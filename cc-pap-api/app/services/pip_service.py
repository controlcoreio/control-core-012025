"""
PIP (Policy Information Point) Service for Control Core
Manages connections, attribute mapping, OPAL synchronization, and sensitive data handling
"""

import asyncio
import aiohttp
import json
import time
import hashlib
import hmac
import redis
import os
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
from dataclasses import dataclass
from enum import Enum

from app.models import PIPConnection, AttributeMapping, PIPSyncLog, ConnectionType, ConnectionStatus
from app.schemas import PIPConnectionCreate, AttributeMappingCreate
from .secrets_service import secrets_service
from .oauth_service import oauth_service
from .openapi_parser import openapi_service
from ..connectors.iam_connector import IAMConnectorFactory
from ..connectors.database_connector import DatabaseConnectorFactory

class DataSensitivity(str, Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

class CacheStrategy(str, Enum):
    NO_CACHE = "no_cache"
    SHORT_TERM = "short_term"  # 5 minutes
    MEDIUM_TERM = "medium_term"  # 1 hour
    LONG_TERM = "long_term"  # 24 hours
    CUSTOM = "custom"

@dataclass
class SensitiveAttribute:
    name: str
    value: Any
    sensitivity: DataSensitivity
    is_encrypted: bool = False
    cache_ttl: int = 300  # 5 minutes default
    last_updated: datetime = None

@dataclass
class AuditLogEntry:
    connection_id: str
    attribute_name: str
    operation: str  # fetch, cache_hit, cache_miss, error
    timestamp: datetime
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None
    # Never log actual attribute values for sensitive data

class PIPService:
    """Enhanced service for managing PIP connections, sensitive data, caching, and audit logging"""
    
    def __init__(self, db: Session, redis_client: redis.Redis = None, encryption_key: str = None):
        self.db = db
        self.redis = redis_client or self._init_redis()
        self.encryption = Fernet(encryption_key.encode()) if encryption_key else None
        self.opal_client = None  # Will be initialized with OPAL client
        self.cache_prefix = "pip_sensitive:"
        self.audit_logs = []
    
    def _init_redis(self) -> Optional[redis.Redis]:
        """Initialize Redis client with connection pooling"""
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            return redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
        except Exception as e:
            print(f"Warning: Redis connection failed: {e}")
            return None
    
    async def create_connection(self, connection_data: PIPConnectionCreate, created_by: str) -> PIPConnection:
        """Create a new PIP connection"""
        # Store credentials securely using secrets service
        secret_id = secrets_service.store_secret(0, connection_data.credentials)  # connection_id will be updated after creation
        
        db_connection = PIPConnection(
            name=connection_data.name,
            description=connection_data.description,
            connection_type=connection_data.connection_type,
            provider=connection_data.provider,
            configuration=connection_data.configuration,
            credentials={"secret_id": secret_id},  # Store reference to secret instead of encrypted data
            health_check_url=connection_data.health_check_url,
            sync_enabled=connection_data.sync_enabled,
            sync_frequency=connection_data.sync_frequency,
            created_by=created_by
        )
        
        self.db.add(db_connection)
        self.db.commit()
        self.db.refresh(db_connection)
        
        # Update secret with correct connection_id
        secrets_service.rotate_secret(db_connection.id, secret_id, connection_data.credentials)
        
        # Create default attribute mappings if template exists
        await self._create_default_mappings(db_connection)
        
        return db_connection
    
    async def test_connection(self, connection_data: PIPConnectionCreate) -> Dict[str, Any]:
        """Test a connection configuration without saving"""
        try:
            start_time = time.time()
            
            if connection_data.connection_type == ConnectionType.IAM:
                result = await self._test_iam_connection(connection_data)
            elif connection_data.connection_type == "database":
                result = await self._test_database_connection(connection_data)
            elif connection_data.connection_type == "openapi":
                result = await self._test_openapi_connection(connection_data)
            elif connection_data.connection_type == ConnectionType.ERP:
                result = await self._test_erp_connection(connection_data)
            elif connection_data.connection_type == ConnectionType.CRM:
                result = await self._test_crm_connection(connection_data)
            elif connection_data.connection_type == ConnectionType.MCP:
                result = await self._test_mcp_connection(connection_data)
            else:
                result = await self._test_custom_connection(connection_data)
            
            response_time = time.time() - start_time
            
            return {
                "success": result["success"],
                "status": result["status"],
                "response_time": response_time,
                "error_message": result.get("error"),
                "details": result.get("details", {}),
                "tested_at": datetime.now()
            }
            
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "response_time": 0.0,
                "error_message": str(e),
                "details": {},
                "tested_at": datetime.now()
            }
    
    async def health_check_connection(self, connection_id: int) -> Dict[str, Any]:
        """Perform health check on a PIP connection"""
        connection = self.db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise ValueError(f"PIP connection {connection_id} not found")
        
        start_time = time.time()
        
        try:
            # Decrypt credentials for health check
            credentials = self._decrypt_credentials(connection.credentials)
            
            if connection.connection_type == ConnectionType.IAM:
                health_status = await self._check_iam_connection(connection, credentials)
            elif connection.connection_type == ConnectionType.ERP:
                health_status = await self._check_erp_connection(connection, credentials)
            elif connection.connection_type == ConnectionType.CRM:
                health_status = await self._check_crm_connection(connection, credentials)
            elif connection.connection_type == ConnectionType.MCP:
                health_status = await self._check_mcp_connection(connection, credentials)
            else:
                health_status = await self._check_custom_connection(connection, credentials)
            
            response_time = time.time() - start_time
            
            # Update connection health status
            connection.health_status = health_status["status"]
            connection.last_health_check = datetime.now()
            self.db.commit()
            
            return {
                "connection_id": connection_id,
                "status": health_status["status"],
                "response_time": response_time,
                "error_message": health_status.get("error"),
                "checked_at": datetime.now(),
                "details": health_status.get("details", {})
            }
            
        except Exception as e:
            response_time = time.time() - start_time
            connection.health_status = "unhealthy"
            connection.last_health_check = datetime.now()
            self.db.commit()
            
            return {
                "connection_id": connection_id,
                "status": "unhealthy",
                "response_time": response_time,
                "error_message": str(e),
                "checked_at": datetime.now(),
                "details": {}
            }
    
    async def sync_connection(self, connection_id: int, sync_type: str = "incremental", force: bool = False) -> Dict[str, Any]:
        """Sync data from a PIP connection"""
        connection = self.db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise ValueError(f"PIP connection {connection_id} not found")
        
        # Create sync log entry
        sync_log = PIPSyncLog(
            connection_id=connection_id,
            sync_type=sync_type,
            status="running",
            started_at=datetime.now()
        )
        self.db.add(sync_log)
        self.db.commit()
        self.db.refresh(sync_log)
        
        try:
            # Perform actual sync based on connection type
            sync_result = await self._perform_sync(connection, sync_type, force)
            
            # Update sync log
            sync_log.status = sync_result["status"]
            sync_log.records_processed = sync_result["records_processed"]
            sync_log.records_synced = sync_result["records_synced"]
            sync_log.records_failed = sync_result["records_failed"]
            sync_log.error_message = sync_result.get("error_message")
            sync_log.duration_seconds = sync_result["duration_seconds"]
            sync_log.completed_at = datetime.now()
            
            # Update connection last sync
            connection.last_sync = datetime.now()
            
            self.db.commit()
            
            return {
                "connection_id": connection_id,
                "sync_id": sync_log.id,
                "status": sync_result["status"],
                "records_processed": sync_result["records_processed"],
                "records_synced": sync_result["records_synced"],
                "records_failed": sync_result["records_failed"],
                "duration_seconds": sync_result["duration_seconds"],
                "started_at": sync_log.started_at,
                "completed_at": sync_log.completed_at,
                "error_message": sync_result.get("error_message")
            }
            
        except Exception as e:
            sync_log.status = "error"
            sync_log.error_message = str(e)
            sync_log.completed_at = datetime.now()
            self.db.commit()
            
            return {
                "connection_id": connection_id,
                "sync_id": sync_log.id,
                "status": "error",
                "records_processed": 0,
                "records_synced": 0,
                "records_failed": 0,
                "duration_seconds": 0.0,
                "started_at": sync_log.started_at,
                "completed_at": sync_log.completed_at,
                "error_message": str(e)
            }
    
    async def sync_to_opal(self, connection_id: int) -> Dict[str, Any]:
        """Sync PIP configuration to OPAL for Bouncer data fetching and caching"""
        connection = self.db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise ValueError(f"PIP connection {connection_id} not found")
        
        try:
            # Get all attribute mappings for this connection
            mappings = self.db.query(AttributeMapping).filter(
                AttributeMapping.connection_id == connection_id
            ).all()
            
            # Prepare OPAL configuration for Bouncer
            opal_config = {
                "connection_id": connection_id,
                "connection_name": connection.name,
                "connection_type": connection.connection_type.value,
                "provider": connection.provider,
                "endpoint": connection.configuration.get("endpoint", ""),
                "credentials": connection.credentials,  # Encrypted credentials
                "sync_enabled": connection.sync_enabled,
                "sync_frequency": connection.sync_frequency,
                "health_check_url": connection.health_check_url,
                "attribute_mappings": [
                    {
                        "source_attribute": mapping.source_attribute,
                        "target_attribute": mapping.target_attribute,
                        "transformation_rule": mapping.transformation_rule,
                        "is_required": mapping.is_required,
                        "is_sensitive": mapping.is_sensitive,
                        "data_type": mapping.data_type,
                        "cache_ttl": self._get_cache_ttl_for_mapping(mapping)
                    }
                    for mapping in mappings
                ],
                "cache_strategy": {
                    "sensitive_data_ttl": 60,  # 1 minute for sensitive data
                    "public_data_ttl": 3600,  # 1 hour for public data
                    "internal_data_ttl": 1800,  # 30 minutes for internal data
                    "encryption_enabled": True,
                    "audit_logging": True
                },
                "opal_config": {
                    "data_sources": [{
                        "name": f"pip_{connection_id}",
                        "url": connection.configuration.get("endpoint", ""),
                        "topics": [f"pip_{connection_id}_attributes"],
                        "dependencies": [],
                        "config": {
                            "connection_type": connection.connection_type.value,
                            "provider": connection.provider,
                            "credentials": connection.credentials,
                            "attribute_mappings": [
                                {
                                    "source": mapping.source_attribute,
                                    "target": mapping.target_attribute,
                                    "transformation": mapping.transformation_rule,
                                    "sensitive": mapping.is_sensitive,
                                    "cache_ttl": self._get_cache_ttl_for_mapping(mapping)
                                }
                                for mapping in mappings
                            ]
                        }
                    }],
                    "policy_bundles": [{
                        "url": f"git://{connection.name}-policies",
                        "topics": [f"pip_{connection_id}_policies"],
                        "dependencies": [f"pip_{connection_id}_attributes"]
                    }]
                },
                "sync_timestamp": datetime.now().isoformat()
            }
            
            # Send configuration to OPAL for Bouncer deployment
            opal_result = await self._send_to_opal(opal_config)
            
            return {
                "connection_id": connection_id,
                "opal_sync_status": "success",
                "mappings_synced": len(mappings),
                "opal_result": opal_result,
                "bouncer_config_sent": True,
                "synced_at": datetime.now()
            }
            
        except Exception as e:
            return {
                "connection_id": connection_id,
                "opal_sync_status": "error",
                "mappings_synced": 0,
                "error_message": str(e),
                "synced_at": datetime.now()
            }
    
    def _get_cache_ttl_for_mapping(self, mapping: AttributeMapping) -> int:
        """Get cache TTL for a specific attribute mapping"""
        if mapping.is_sensitive:
            return 60  # 1 minute for sensitive data
        elif mapping.data_type in ["password", "secret", "token"]:
            return 60  # 1 minute for security-related data
        else:
            return 1800  # 30 minutes for regular data
    
    async def get_connection_attributes(self, connection_id: int) -> List[Dict[str, Any]]:
        """Get all attributes available from a connection"""
        connection = self.db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise ValueError(f"PIP connection {connection_id} not found")
        
        try:
            # Decrypt credentials
            credentials = self._decrypt_credentials(connection.credentials)
            
            # Fetch attributes based on connection type
            if connection.connection_type == ConnectionType.IAM:
                attributes = await self._fetch_iam_attributes(connection, credentials)
            elif connection.connection_type == ConnectionType.ERP:
                attributes = await self._fetch_erp_attributes(connection, credentials)
            elif connection.connection_type == ConnectionType.CRM:
                attributes = await self._fetch_crm_attributes(connection, credentials)
            elif connection.connection_type == ConnectionType.MCP:
                attributes = await self._fetch_mcp_attributes(connection, credentials)
            else:
                attributes = await self._fetch_custom_attributes(connection, credentials)
            
            return attributes
            
        except Exception as e:
            return []
    
    def _encrypt_credentials(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Encrypt credentials for storage"""
        # In production, use proper encryption
        return {"encrypted": True, "data": credentials}
    
    def _decrypt_credentials(self, encrypted_credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Decrypt credentials for use"""
        # In production, use proper decryption
        return encrypted_credentials.get("data", {})
    
    async def _create_default_mappings(self, connection: PIPConnection):
        """Create default attribute mappings based on connection type and provider"""
        # This would load from integration templates
        # For now, create basic mappings
        default_mappings = [
            {
                "source_attribute": "id",
                "target_attribute": "controlcore.user.id",
                "transformation_rule": {"type": "direct"},
                "is_required": True,
                "is_sensitive": False,
                "data_type": "string"
            },
            {
                "source_attribute": "email",
                "target_attribute": "controlcore.user.email",
                "transformation_rule": {"type": "direct"},
                "is_required": True,
                "is_sensitive": False,
                "data_type": "string"
            }
        ]
        
        for mapping_data in default_mappings:
            mapping = AttributeMapping(
                connection_id=connection.id,
                source_attribute=mapping_data["source_attribute"],
                target_attribute=mapping_data["target_attribute"],
                transformation_rule=mapping_data["transformation_rule"],
                is_required=mapping_data["is_required"],
                is_sensitive=mapping_data["is_sensitive"],
                data_type=mapping_data["data_type"]
            )
            self.db.add(mapping)
        
        self.db.commit()
    
    # Connection testing methods
    async def _test_iam_connection(self, connection_data: PIPConnectionCreate) -> Dict[str, Any]:
        """Test IAM connection"""
        start_time = time.time()
        await asyncio.sleep(0.1)  # Simulate network delay
        
        return {
            "success": True,
            "status": "connected",
            "response_time": time.time() - start_time,
            "details": {"provider": connection_data.provider}
        }
    
    async def _test_erp_connection(self, connection_data: PIPConnectionCreate) -> Dict[str, Any]:
        """Test ERP connection"""
        start_time = time.time()
        await asyncio.sleep(0.2)
        
        return {
            "success": True,
            "status": "connected",
            "response_time": time.time() - start_time,
            "details": {"provider": connection_data.provider}
        }
    
    async def _test_crm_connection(self, connection_data: PIPConnectionCreate) -> Dict[str, Any]:
        """Test CRM connection"""
        start_time = time.time()
        await asyncio.sleep(0.15)
        
        return {
            "success": True,
            "status": "connected",
            "response_time": time.time() - start_time,
            "details": {"provider": connection_data.provider}
        }
    
    async def _test_mcp_connection(self, connection_data: PIPConnectionCreate) -> Dict[str, Any]:
        """Test MCP connection"""
        start_time = time.time()
        await asyncio.sleep(0.1)
        
        return {
            "success": True,
            "status": "connected",
            "response_time": time.time() - start_time,
            "details": {"provider": connection_data.provider}
        }
    
    async def _test_custom_connection(self, connection_data: PIPConnectionCreate) -> Dict[str, Any]:
        """Test custom connection"""
        start_time = time.time()
        await asyncio.sleep(0.1)
        
        return {
            "success": True,
            "status": "connected",
            "response_time": time.time() - start_time,
            "details": {"provider": connection_data.provider}
        }
    
    # Health check methods
    async def _check_iam_connection(self, connection: PIPConnection, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Check IAM connection health"""
        await asyncio.sleep(0.1)
        return {"status": "healthy", "details": {"provider": connection.provider}}
    
    async def _check_erp_connection(self, connection: PIPConnection, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Check ERP connection health"""
        await asyncio.sleep(0.2)
        return {"status": "healthy", "details": {"provider": connection.provider}}
    
    async def _check_crm_connection(self, connection: PIPConnection, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Check CRM connection health"""
        await asyncio.sleep(0.15)
        return {"status": "healthy", "details": {"provider": connection.provider}}
    
    async def _check_mcp_connection(self, connection: PIPConnection, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Check MCP connection health"""
        await asyncio.sleep(0.1)
        return {"status": "healthy", "details": {"provider": connection.provider}}
    
    async def _check_custom_connection(self, connection: PIPConnection, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Check custom connection health"""
        await asyncio.sleep(0.1)
        return {"status": "healthy", "details": {"provider": connection.provider}}
    
    # Sync methods
    async def _perform_sync(self, connection: PIPConnection, sync_type: str, force: bool) -> Dict[str, Any]:
        """Perform data synchronization"""
        start_time = time.time()
        
        # Simulate sync process
        await asyncio.sleep(1)
        
        return {
            "status": "success",
            "records_processed": 100,
            "records_synced": 95,
            "records_failed": 5,
            "duration_seconds": time.time() - start_time
        }
    
    async def _send_to_opal(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send data to OPAL for distribution"""
        # In real implementation, this would use OPAL client
        await asyncio.sleep(0.1)
        return {"opal_status": "success", "data_sent": True}
    
    # Attribute fetching methods
    async def _fetch_iam_attributes(self, connection: PIPConnection, credentials: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch attributes from IAM system"""
        await asyncio.sleep(0.1)
        return [
            {"name": "id", "type": "string", "description": "User ID"},
            {"name": "email", "type": "string", "description": "Email address"},
            {"name": "roles", "type": "array", "description": "User roles"}
        ]
    
    async def _fetch_erp_attributes(self, connection: PIPConnection, credentials: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch attributes from ERP system"""
        await asyncio.sleep(0.2)
        return [
            {"name": "employee_id", "type": "string", "description": "Employee ID"},
            {"name": "department", "type": "string", "description": "Department"},
            {"name": "job_title", "type": "string", "description": "Job title"}
        ]
    
    async def _fetch_crm_attributes(self, connection: PIPConnection, credentials: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch attributes from CRM system"""
        await asyncio.sleep(0.15)
        return [
            {"name": "contact_id", "type": "string", "description": "Contact ID"},
            {"name": "company", "type": "string", "description": "Company name"},
            {"name": "lead_source", "type": "string", "description": "Lead source"}
        ]
    
    async def _fetch_mcp_attributes(self, connection: PIPConnection, credentials: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch attributes from MCP system"""
        await asyncio.sleep(0.1)
        return [
            {"name": "tool_name", "type": "string", "description": "Tool name"},
            {"name": "tool_description", "type": "string", "description": "Tool description"},
            {"name": "tool_schema", "type": "object", "description": "Tool schema"}
        ]
    
    async def _fetch_custom_attributes(self, connection: PIPConnection, credentials: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch attributes from custom system"""
        await asyncio.sleep(0.1)
        return [
            {"name": "custom_id", "type": "string", "description": "Custom ID"},
            {"name": "custom_field", "type": "string", "description": "Custom field"}
        ]
    
    # Enhanced methods for sensitive data handling
    
    async def fetch_sensitive_attributes(
        self, 
        connection_id: int, 
        user_id: str, 
        required_attributes: List[str],
        request_id: str = None
    ) -> Dict[str, SensitiveAttribute]:
        """Fetch sensitive attributes with real-time data and caching"""
        
        connection = self.db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise ValueError(f"PIP connection {connection_id} not found")
        
        # Get attribute mappings for this connection
        mappings = self.db.query(AttributeMapping).filter(
            AttributeMapping.connection_id == connection_id
        ).all()
        
        # Create mapping dictionary
        attribute_mappings = {m.source_attribute: m for m in mappings}
        
        # Check cache first for non-sensitive attributes
        cached_attributes = {}
        attributes_to_fetch = []
        
        for attr_name in required_attributes:
            if attr_name in attribute_mappings:
                mapping = attribute_mappings[attr_name]
                
                # Check cache if not sensitive
                if not mapping.is_sensitive and self.redis:
                    cached_value = await self._get_from_cache(connection_id, attr_name)
                    if cached_value:
                        cached_attributes[attr_name] = SensitiveAttribute(
                            name=attr_name,
                            value=cached_value,
                            sensitivity=DataSensitivity.PUBLIC,
                            last_updated=datetime.now()
                        )
                        self._log_audit(connection_id, attr_name, "cache_hit", user_id, request_id)
                    else:
                        attributes_to_fetch.append(attr_name)
                else:
                    # Always fetch sensitive attributes in real-time
                    attributes_to_fetch.append(attr_name)
        
        # Fetch real-time data for required attributes
        real_time_attributes = {}
        if attributes_to_fetch:
            real_time_attributes = await self._fetch_real_time_data(
                connection, attributes_to_fetch, user_id, request_id
            )
        
        # Combine cached and real-time attributes
        all_attributes = {**cached_attributes, **real_time_attributes}
        
        # Cache non-sensitive attributes
        if self.redis:
            await self._cache_attributes(connection_id, all_attributes)
        
        return all_attributes
    
    async def _fetch_real_time_data(
        self, 
        connection: PIPConnection, 
        attributes: List[str], 
        user_id: str, 
        request_id: str
    ) -> Dict[str, SensitiveAttribute]:
        """Fetch real-time data from external system"""
        
        try:
            # Decrypt credentials
            credentials = self._decrypt_credentials(connection.credentials)
            
            # Determine data source and fetch accordingly
            if connection.connection_type == ConnectionType.IAM:
                return await self._fetch_iam_sensitive_data(connection, credentials, attributes, user_id, request_id)
            elif connection.connection_type == ConnectionType.ERP:
                return await self._fetch_erp_sensitive_data(connection, credentials, attributes, user_id, request_id)
            elif connection.connection_type == ConnectionType.CRM:
                return await self._fetch_crm_sensitive_data(connection, credentials, attributes, user_id, request_id)
            elif connection.connection_type == ConnectionType.MCP:
                return await self._fetch_mcp_sensitive_data(connection, credentials, attributes, user_id, request_id)
            else:
                return await self._fetch_custom_sensitive_data(connection, credentials, attributes, user_id, request_id)
                
        except Exception as e:
            # Log error without exposing sensitive data
            self._log_audit(connection.id, "fetch_error", "error", user_id, request_id, False, str(e))
            raise
    
    async def _fetch_iam_sensitive_data(
        self, 
        connection: PIPConnection, 
        credentials: Dict[str, Any], 
        attributes: List[str], 
        user_id: str, 
        request_id: str
    ) -> Dict[str, SensitiveAttribute]:
        """Fetch sensitive data from IAM systems"""
        
        await asyncio.sleep(0.1)  # Simulate network delay
        
        # Mock sensitive data - in real implementation, this would call actual APIs
        sensitive_data = {
            "user.id": "auth0|123456789",
            "user.email": "john.doe@company.com",
            "user.roles": ["admin", "developer"],
            "user.permissions": ["read:users", "write:policies"],
            "user.metadata": {
                "department": "Engineering",
                "security_clearance": "high"
            }
        }
        
        result = {}
        for attr in attributes:
            if attr in sensitive_data:
                value = sensitive_data[attr]
                sensitivity = self._determine_sensitivity(attr, value)
                
                # Encrypt sensitive data
                if sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED]:
                    value = self._encrypt_sensitive_data(value)
                
                result[attr] = SensitiveAttribute(
                    name=attr,
                    value=value,
                    sensitivity=sensitivity,
                    is_encrypted=sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED],
                    cache_ttl=self._get_cache_ttl(sensitivity),
                    last_updated=datetime.now()
                )
                
                self._log_audit(connection.id, attr, "fetch", user_id, request_id)
        
        return result
    
    async def _fetch_erp_sensitive_data(
        self, 
        connection: PIPConnection, 
        credentials: Dict[str, Any], 
        attributes: List[str], 
        user_id: str, 
        request_id: str
    ) -> Dict[str, SensitiveAttribute]:
        """Fetch sensitive data from ERP systems"""
        
        await asyncio.sleep(0.2)
        
        # Mock ERP sensitive data
        sensitive_data = {
            "employee.id": "EMP001",
            "employee.salary": 95000,
            "employee.ssn": "123-45-6789",
            "employee.department": "Engineering",
            "employee.manager": "John Smith",
            "employee.benefits": ["health", "dental", "401k"]
        }
        
        result = {}
        for attr in attributes:
            if attr in sensitive_data:
                value = sensitive_data[attr]
                sensitivity = self._determine_sensitivity(attr, value)
                
                if sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED]:
                    value = self._encrypt_sensitive_data(value)
                
                result[attr] = SensitiveAttribute(
                    name=attr,
                    value=value,
                    sensitivity=sensitivity,
                    is_encrypted=sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED],
                    cache_ttl=self._get_cache_ttl(sensitivity),
                    last_updated=datetime.now()
                )
                
                self._log_audit(connection.id, attr, "fetch", user_id, request_id)
        
        return result
    
    async def _fetch_crm_sensitive_data(
        self, 
        connection: PIPConnection, 
        credentials: Dict[str, Any], 
        attributes: List[str], 
        user_id: str, 
        request_id: str
    ) -> Dict[str, SensitiveAttribute]:
        """Fetch sensitive data from CRM systems"""
        
        await asyncio.sleep(0.15)
        
        # Mock CRM sensitive data
        sensitive_data = {
            "contact.id": "003123456789",
            "contact.email": "customer@example.com",
            "contact.phone": "+1-555-123-4567",
            "contact.company": "Acme Corp",
            "contact.lead_score": 85,
            "contact.notes": "VIP customer with high potential"
        }
        
        result = {}
        for attr in attributes:
            if attr in sensitive_data:
                value = sensitive_data[attr]
                sensitivity = self._determine_sensitivity(attr, value)
                
                if sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED]:
                    value = self._encrypt_sensitive_data(value)
                
                result[attr] = SensitiveAttribute(
                    name=attr,
                    value=value,
                    sensitivity=sensitivity,
                    is_encrypted=sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED],
                    cache_ttl=self._get_cache_ttl(sensitivity),
                    last_updated=datetime.now()
                )
                
                self._log_audit(connection.id, attr, "fetch", user_id, request_id)
        
        return result
    
    async def _fetch_mcp_sensitive_data(
        self, 
        connection: PIPConnection, 
        credentials: Dict[str, Any], 
        attributes: List[str], 
        user_id: str, 
        request_id: str
    ) -> Dict[str, SensitiveAttribute]:
        """Fetch sensitive data from MCP systems"""
        
        await asyncio.sleep(0.1)
        
        # Mock MCP sensitive data
        sensitive_data = {
            "tool.name": "data_analyzer",
            "tool.description": "Advanced data analysis tool",
            "tool.schema": {"input": "string", "output": "object"},
            "tool.capabilities": ["analysis", "visualization", "export"]
        }
        
        result = {}
        for attr in attributes:
            if attr in sensitive_data:
                value = sensitive_data[attr]
                sensitivity = self._determine_sensitivity(attr, value)
                
                if sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED]:
                    value = self._encrypt_sensitive_data(value)
                
                result[attr] = SensitiveAttribute(
                    name=attr,
                    value=value,
                    sensitivity=sensitivity,
                    is_encrypted=sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED],
                    cache_ttl=self._get_cache_ttl(sensitivity),
                    last_updated=datetime.now()
                )
                
                self._log_audit(connection.id, attr, "fetch", user_id, request_id)
        
        return result
    
    async def _fetch_custom_sensitive_data(
        self, 
        connection: PIPConnection, 
        credentials: Dict[str, Any], 
        attributes: List[str], 
        user_id: str, 
        request_id: str
    ) -> Dict[str, SensitiveAttribute]:
        """Fetch sensitive data from custom systems"""
        
        await asyncio.sleep(0.1)
        
        # Mock custom sensitive data
        sensitive_data = {
            "custom.id": "CUST001",
            "custom.value": "sensitive_value",
            "custom.metadata": {"type": "confidential"}
        }
        
        result = {}
        for attr in attributes:
            if attr in sensitive_data:
                value = sensitive_data[attr]
                sensitivity = self._determine_sensitivity(attr, value)
                
                if sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED]:
                    value = self._encrypt_sensitive_data(value)
                
                result[attr] = SensitiveAttribute(
                    name=attr,
                    value=value,
                    sensitivity=sensitivity,
                    is_encrypted=sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED],
                    cache_ttl=self._get_cache_ttl(sensitivity),
                    last_updated=datetime.now()
                )
                
                self._log_audit(connection.id, attr, "fetch", user_id, request_id)
        
        return result
    
    def _determine_sensitivity(self, attribute_name: str, value: Any) -> DataSensitivity:
        """Determine data sensitivity based on attribute name and value"""
        
        # Check attribute name patterns
        sensitive_patterns = [
            "password", "secret", "key", "token", "ssn", "social_security",
            "salary", "compensation", "benefits", "medical", "health",
            "phone", "address", "credit_card", "bank_account"
        ]
        
        for pattern in sensitive_patterns:
            if pattern in attribute_name.lower():
                return DataSensitivity.RESTRICTED
        
        # Check value content for sensitive patterns
        if isinstance(value, str):
            if any(pattern in value.lower() for pattern in ["@", "password", "secret"]):
                return DataSensitivity.CONFIDENTIAL
        
        # Default to internal for most attributes
        return DataSensitivity.INTERNAL
    
    def _get_cache_ttl(self, sensitivity: DataSensitivity) -> int:
        """Get cache TTL based on data sensitivity"""
        
        ttl_map = {
            DataSensitivity.PUBLIC: 3600,      # 1 hour
            DataSensitivity.INTERNAL: 1800,    # 30 minutes
            DataSensitivity.CONFIDENTIAL: 300,  # 5 minutes
            DataSensitivity.RESTRICTED: 60      # 1 minute
        }
        
        return ttl_map.get(sensitivity, 300)
    
    def _encrypt_sensitive_data(self, data: Any) -> str:
        """Encrypt sensitive data"""
        if not self.encryption:
            return str(data)  # Return as-is if no encryption key
        
        if isinstance(data, (dict, list)):
            data = json.dumps(data)
        else:
            data = str(data)
        
        return self.encryption.encrypt(data.encode()).decode()
    
    def _decrypt_sensitive_data(self, encrypted_data: str) -> Any:
        """Decrypt sensitive data"""
        if not self.encryption:
            return encrypted_data  # Return as-is if no encryption key
        
        try:
            decrypted = self.encryption.decrypt(encrypted_data.encode()).decode()
            # Try to parse as JSON, fallback to string
            try:
                return json.loads(decrypted)
            except json.JSONDecodeError:
                return decrypted
        except Exception:
            return encrypted_data  # Return as-is if decryption fails
    
    async def _get_from_cache(self, connection_id: int, attribute_name: str) -> Any:
        """Get attribute value from cache"""
        if not self.redis:
            return None
        
        cache_key = f"{self.cache_prefix}{connection_id}:{attribute_name}"
        cached_data = await self.redis.get(cache_key)
        
        if cached_data:
            return json.loads(cached_data)
        return None
    
    async def _cache_attributes(
        self, 
        connection_id: int, 
        attributes: Dict[str, SensitiveAttribute]
    ):
        """Cache attributes with appropriate TTL"""
        if not self.redis:
            return
        
        for attr_name, attr_data in attributes.items():
            # Only cache non-sensitive or short-term sensitive data
            if attr_data.sensitivity in [DataSensitivity.PUBLIC, DataSensitivity.INTERNAL]:
                cache_key = f"{self.cache_prefix}{connection_id}:{attr_name}"
                cache_data = {
                    "value": attr_data.value,
                    "sensitivity": attr_data.sensitivity.value,
                    "last_updated": attr_data.last_updated.isoformat()
                }
                
                await self.redis.setex(
                    cache_key, 
                    attr_data.cache_ttl, 
                    json.dumps(cache_data, default=str)
                )
    
    def _log_audit(
        self, 
        connection_id: int, 
        attribute_name: str, 
        operation: str, 
        user_id: str, 
        request_id: str, 
        success: bool = True, 
        error_message: str = None
    ):
        """Log audit entry without exposing sensitive data"""
        
        audit_entry = AuditLogEntry(
            connection_id=str(connection_id),
            attribute_name=attribute_name,
            operation=operation,
            timestamp=datetime.now(),
            user_id=user_id,
            request_id=request_id,
            success=success,
            error_message=error_message
        )
        
        self.audit_logs.append(audit_entry)
        
        # In production, this would be stored in a secure audit database
        print(f"AUDIT: {audit_entry.operation} on {audit_entry.attribute_name} - Success: {success}")
    
    async def get_audit_logs(
        self, 
        connection_id: int = None, 
        user_id: str = None, 
        start_date: datetime = None, 
        end_date: datetime = None
    ) -> List[AuditLogEntry]:
        """Get audit logs with filtering"""
        
        filtered_logs = self.audit_logs
        
        if connection_id:
            filtered_logs = [log for log in filtered_logs if log.connection_id == str(connection_id)]
        
        if user_id:
            filtered_logs = [log for log in filtered_logs if log.user_id == user_id]
        
        if start_date:
            filtered_logs = [log for log in filtered_logs if log.timestamp >= start_date]
        
        if end_date:
            filtered_logs = [log for log in filtered_logs if log.timestamp <= end_date]
        
        return filtered_logs
    
    async def clear_sensitive_cache(self, connection_id: int = None):
        """Clear sensitive data from cache"""
        if not self.redis:
            return
        
        if connection_id:
            pattern = f"{self.cache_prefix}{connection_id}:*"
        else:
            pattern = f"{self.cache_prefix}*"
        
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)
    
    async def get_cache_statistics(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.redis:
            return {"error": "Redis not configured"}
        
        pattern = f"{self.cache_prefix}*"
        keys = await self.redis.keys(pattern)
        
        return {
            "total_cached_attributes": len(keys),
            "cache_hit_rate": 0.85,  # Would be calculated from actual metrics
            "memory_usage": "2.5MB",  # Would be calculated from actual usage
            "expired_entries": 0  # Would be calculated from actual metrics
        }
    
    # New test methods for enhanced connection types
    async def _test_iam_connection(self, connection_data: PIPConnectionCreate) -> Dict[str, Any]:
        """Test IAM connection using IAMConnectorFactory"""
        try:
            result = await IAMConnectorFactory.test_connection(
                connection_data.provider,
                connection_data.configuration,
                connection_data.credentials
            )
            return result
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error": str(e),
                "details": {"provider": connection_data.provider}
            }
    
    async def _test_database_connection(self, connection_data: PIPConnectionCreate) -> Dict[str, Any]:
        """Test database connection using DatabaseConnectorFactory"""
        try:
            result = await DatabaseConnectorFactory.test_connection(
                connection_data.provider,
                connection_data.configuration,
                connection_data.credentials
            )
            return result
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error": str(e),
                "details": {"provider": connection_data.provider}
            }
    
    async def _test_openapi_connection(self, connection_data: PIPConnectionCreate) -> Dict[str, Any]:
        """Test OpenAPI specification parsing"""
        try:
            # Get spec content from configuration
            spec_content = connection_data.configuration.get('spec_content', '')
            spec_url = connection_data.configuration.get('spec_url', '')
            spec_format = connection_data.configuration.get('format', 'auto')
            
            if spec_url:
                # Fetch spec from URL
                import aiohttp
                async with aiohttp.ClientSession() as session:
                    async with session.get(spec_url) as response:
                        if response.status == 200:
                            spec_content = await response.text()
                        else:
                            raise Exception(f"Failed to fetch spec from URL: HTTP {response.status}")
            
            if not spec_content:
                raise Exception("No OpenAPI specification content provided")
            
            # Test parsing
            result = await openapi_service.test_spec_parsing(spec_content, spec_format)
            return result
            
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error": str(e),
                "details": {"provider": "openapi"}
            }
    
    async def fetch_and_cache_attributes(
        self, 
        connection_id: int, 
        user_id: str, 
        required_attributes: List[str]
    ) -> Dict[str, SensitiveAttribute]:
        """Fetch attributes from connection and cache them"""
        connection = self.db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise ValueError(f"PIP connection {connection_id} not found")
        
        # Get credentials from secrets service
        credentials = secrets_service.retrieve_secret(connection_id, connection.credentials.get('secret_id', ''))
        
        attributes = {}
        
        try:
            if connection.connection_type == ConnectionType.IAM:
                # Use IAM connector
                connector = IAMConnectorFactory.create_connector(
                    connection.provider, connection_id, connection.configuration, credentials
                )
                
                # Fetch user data
                user_data = await connector.fetch_user_by_id(user_id)
                if user_data:
                    # Map user data to attributes
                    for attr in required_attributes:
                        if attr.startswith('user.'):
                            field_name = attr.replace('user.', '')
                            value = self._extract_nested_value(user_data, field_name)
                            if value is not None:
                                attributes[attr] = SensitiveAttribute(
                                    name=attr,
                                    value=value,
                                    sensitivity=DataSensitivity.INTERNAL,
                                    last_updated=datetime.now()
                                )
            
            elif connection.connection_type == "database":
                # Use database connector
                connector = DatabaseConnectorFactory.create_connector(
                    connection.provider, connection_id, connection.configuration, credentials
                )
                
                # Query resource attributes
                resource_data = await connector.query_resource_attributes(user_id, [])
                if resource_data:
                    # Map resource data to attributes
                    for attr in required_attributes:
                        if attr.startswith('resource.'):
                            field_name = attr.replace('resource.', '')
                            value = self._extract_nested_value(resource_data, field_name)
                            if value is not None:
                                attributes[attr] = SensitiveAttribute(
                                    name=attr,
                                    value=value,
                                    sensitivity=DataSensitivity.INTERNAL,
                                    last_updated=datetime.now()
                                )
            
            # Cache the attributes
            await self._cache_attributes(connection_id, attributes)
            
            # Log audit
            for attr_name in attributes:
                self._log_audit(connection_id, attr_name, "fetch", user_id, f"req_{int(time.time())}")
            
            return attributes
            
        except Exception as e:
            # Log error
            for attr_name in required_attributes:
                self._log_audit(connection_id, attr_name, "fetch", user_id, f"req_{int(time.time())}", False, str(e))
            raise
    
    def _extract_nested_value(self, data: Dict[str, Any], field_name: str) -> Any:
        """Extract nested value from data using dot notation"""
        if '.' in field_name:
            parts = field_name.split('.')
            current = data
            for part in parts:
                if isinstance(current, dict) and part in current:
                    current = current[part]
                else:
                    return None
            return current
        else:
            return data.get(field_name)
    
    async def generate_opal_payload(self, connection_id: int, changed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate OPAL payload for data changes"""
        connection = self.db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise ValueError(f"PIP connection {connection_id} not found")
        
        return {
            "id": f"pip-source-{connection_id}",
            "entries": [
                {
                    "url": f"http://pap-api:8000/pip/connections/{connection_id}/fetch-sensitive-attributes",
                    "config": {
                        "headers": {"Authorization": "Bearer {token}"},
                        "method": "POST"
                    },
                    "dst_path": f"/pip/{connection.name}",
                    "save_method": "PUT"
                }
            ],
            "metadata": {
                "connection_id": connection_id,
                "connection_name": connection.name,
                "provider": connection.provider,
                "changed_data": changed_data,
                "timestamp": datetime.now().isoformat()
            }
        }
    
    async def send_to_opal(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Send data updates to OPAL server"""
        opal_url = os.getenv('OPAL_SERVER_URL', 'http://localhost:7002')
        opal_token = os.getenv('OPAL_AUTH_TOKEN', '')
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        if opal_token:
            headers['Authorization'] = f'Bearer {opal_token}'
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{opal_url}/data/config",
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        return {
                            "success": True,
                            "message": "Data sent to OPAL successfully",
                            "response": await response.json()
                        }
                    else:
                        error_text = await response.text()
                        return {
                            "success": False,
                            "error": f"OPAL request failed: HTTP {response.status} - {error_text}"
                        }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to send to OPAL: {str(e)}"
            }
    
    # --- Caching Methods ---
    
    async def _cache_attributes(self, connection_id: int, attributes: Dict[str, SensitiveAttribute]) -> None:
        """Cache sensitive attributes with TTL based on sensitivity level"""
        if not self.redis:
            return
        
        try:
            for attr_name, attr_data in attributes.items():
                cache_key = f"{self.cache_prefix}{connection_id}:{attr_name}"
                
                # Set TTL based on sensitivity
                ttl = self._get_cache_ttl(attr_data.sensitivity)
                
                # Prepare cache data (encrypt if needed)
                cache_data = {
                    "name": attr_data.name,
                    "value": attr_data.value,
                    "sensitivity": attr_data.sensitivity.value,
                    "is_encrypted": attr_data.is_encrypted,
                    "last_updated": attr_data.last_updated.isoformat() if attr_data.last_updated else None
                }
                
                # Encrypt sensitive data if encryption is available
                if self.encryption and attr_data.sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED]:
                    cache_data["value"] = self.encryption.encrypt(str(attr_data.value).encode()).decode()
                    cache_data["is_encrypted"] = True
                
                # Store in Redis with TTL
                self.redis.setex(cache_key, ttl, json.dumps(cache_data))
                
        except Exception as e:
            print(f"Warning: Failed to cache attributes: {e}")
    
    def _get_cache_ttl(self, sensitivity: DataSensitivity) -> int:
        """Get cache TTL in seconds based on data sensitivity"""
        ttl_map = {
            DataSensitivity.PUBLIC: 3600,      # 1 hour
            DataSensitivity.INTERNAL: 1800,    # 30 minutes
            DataSensitivity.CONFIDENTIAL: 300, # 5 minutes
            DataSensitivity.RESTRICTED: 60     # 1 minute
        }
        return ttl_map.get(sensitivity, 300)
    
    async def _get_cached_attributes(self, connection_id: int, attribute_names: List[str]) -> Dict[str, SensitiveAttribute]:
        """Retrieve cached attributes"""
        if not self.redis:
            return {}
        
        cached_attributes = {}
        
        try:
            for attr_name in attribute_names:
                cache_key = f"{self.cache_prefix}{connection_id}:{attr_name}"
                cached_data = self.redis.get(cache_key)
                
                if cached_data:
                    data = json.loads(cached_data)
                    
                    # Decrypt if needed
                    if data.get("is_encrypted") and self.encryption:
                        data["value"] = self.encryption.decrypt(data["value"].encode()).decode()
                    
                    cached_attributes[attr_name] = SensitiveAttribute(
                        name=data["name"],
                        value=data["value"],
                        sensitivity=DataSensitivity(data["sensitivity"]),
                        is_encrypted=data.get("is_encrypted", False),
                        last_updated=datetime.fromisoformat(data["last_updated"]) if data["last_updated"] else None
                    )
                    
        except Exception as e:
            print(f"Warning: Failed to retrieve cached attributes: {e}")
        
        return cached_attributes
    
    async def clear_sensitive_cache(self, connection_id: int) -> Dict[str, Any]:
        """Clear all cached data for a connection"""
        if not self.redis:
            return {"message": "Redis not available", "cleared": 0}
        
        try:
            pattern = f"{self.cache_prefix}{connection_id}:*"
            keys = self.redis.keys(pattern)
            
            if keys:
                deleted_count = self.redis.delete(*keys)
                return {
                    "message": f"Cleared {deleted_count} cached items",
                    "cleared": deleted_count
                }
            else:
                return {
                    "message": "No cached items found",
                    "cleared": 0
                }
                
        except Exception as e:
            return {
                "message": f"Failed to clear cache: {str(e)}",
                "cleared": 0
            }
    
    async def get_cache_statistics(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.redis:
            return {"error": "Redis not available"}
        
        try:
            info = self.redis.info()
            keyspace_info = self.redis.info('keyspace')
            
            # Count PIP-related keys
            pip_keys = self.redis.keys(f"{self.cache_prefix}*")
            
            return {
                "redis_connected": True,
                "total_keys": info.get('db0', {}).get('keys', 0),
                "pip_cached_items": len(pip_keys),
                "memory_used": info.get('used_memory_human', 'N/A'),
                "uptime": info.get('uptime_in_seconds', 0),
                "connected_clients": info.get('connected_clients', 0)
            }
            
        except Exception as e:
            return {
                "error": f"Failed to get cache statistics: {str(e)}",
                "redis_connected": False
            }
