"""
OPAL Configuration Generator for Control Core PIP
Generates OPAL data source configurations from PIP connections
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass, asdict

from app.models import PIPConnection

logger = logging.getLogger(__name__)

@dataclass
class OPALDataSourceConfig:
    """OPAL data source configuration"""
    url: str
    config: Dict[str, Any]
    topics: List[str]
    dst_path: str
    save_method: str
    fetch_interval: Optional[int] = None
    fetch_on_startup: bool = True
    retry_on_failure: bool = True
    retry_count: int = 3
    retry_delay: int = 5

class OPALConfigGenerator:
    """Service for generating OPAL data source configurations"""
    
    def __init__(self, pap_api_url: str = "http://localhost:8000", opal_url: str = "http://localhost:7002"):
        self.pap_api_url = pap_api_url
        self.opal_url = opal_url
    
    def generate_data_source_config(self, connection: PIPConnection, opal_token: str = None) -> OPALDataSourceConfig:
        """Generate OPAL data source configuration from PIP connection"""
        
        # Generate topics based on connection
        topics = self._generate_topics(connection)
        
        # Generate destination path
        dst_path = self._generate_destination_path(connection)
        
        # Generate configuration
        config = {
            "fetcher": "FastApiPIPFetcher",
            "auth": {
                "type": "bearer",
                "token": opal_token or "default-token"
            },
            "headers": {
                "X-Connection-Id": str(connection.id),
                "X-Provider": connection.provider,
                "X-Connection-Type": connection.connection_type,
                "X-PAP-API-URL": self.pap_api_url
            },
            "timeout": 30,
            "retry_count": 3,
            "retry_delay": 5
        }
        
        # Add provider-specific configuration
        config.update(self._get_provider_specific_config(connection))
        
        return OPALDataSourceConfig(
            url=f"{self.pap_api_url}/pip/connections/{connection.id}/data-snapshot",
            config=config,
            topics=topics,
            dst_path=dst_path,
            save_method="PUT",
            fetch_interval=self._get_fetch_interval(connection),
            fetch_on_startup=True,
            retry_on_failure=True,
            retry_count=3,
            retry_delay=5
        )
    
    def _generate_topics(self, connection: PIPConnection) -> List[str]:
        """Generate OPA topics for policy data updates"""
        topics = [
            f"policy_data:{connection.provider}",
            f"policy_data:{connection.connection_type}",
            f"connection:{connection.id}",
            f"provider:{connection.provider}",
            f"type:{connection.connection_type}"
        ]
        
        # Add provider-specific topics
        if connection.connection_type == "identity":
            topics.extend([
                f"identity:{connection.provider}",
                f"users:{connection.provider}",
                f"groups:{connection.provider}"
            ])
        elif connection.connection_type == "database":
            topics.extend([
                f"database:{connection.provider}",
                f"tables:{connection.provider}"
            ])
        elif connection.connection_type == "openapi":
            topics.extend([
                f"api:{connection.provider}",
                f"endpoints:{connection.provider}"
            ])
        
        return topics
    
    def _generate_destination_path(self, connection: PIPConnection) -> str:
        """Generate destination path for OPAL data storage"""
        return f"/policy_data/{connection.provider}/{connection.connection_type}/{connection.name}"
    
    def _get_provider_specific_config(self, connection: PIPConnection) -> Dict[str, Any]:
        """Get provider-specific configuration"""
        config = {}
        
        if connection.connection_type == "identity":
            config.update({
                "data_format": "json",
                "batch_size": 100,
                "include_metadata": True,
                "user_fields": connection.configuration.get("selected_fields", {}).get("users", []),
                "group_fields": connection.configuration.get("selected_fields", {}).get("groups", [])
            })
        elif connection.connection_type == "database":
            config.update({
                "data_format": "json",
                "batch_size": 50,
                "include_metadata": True,
                "selected_tables": connection.configuration.get("selected_tables", []),
                "selected_columns": connection.configuration.get("selected_columns", {}),
                "incremental_sync": connection.configuration.get("incremental_sync", False),
                "timestamp_column": connection.configuration.get("timestamp_column", "updated_at")
            })
        elif connection.connection_type == "openapi":
            config.update({
                "data_format": "json",
                "include_metadata": True,
                "endpoints": connection.configuration.get("selected_endpoints", []),
                "models": connection.configuration.get("selected_models", [])
            })
        
        return config
    
    def _get_fetch_interval(self, connection: PIPConnection) -> Optional[int]:
        """Get fetch interval based on sync frequency"""
        sync_frequency = connection.sync_frequency
        
        if sync_frequency == "realtime":
            return None  # No polling for real-time
        elif sync_frequency == "5min":
            return 300  # 5 minutes
        elif sync_frequency == "15min":
            return 900  # 15 minutes
        elif sync_frequency == "hourly":
            return 3600  # 1 hour
        elif sync_frequency == "daily":
            return 86400  # 24 hours
        elif sync_frequency == "weekly":
            return 604800  # 7 days
        else:
            return 3600  # Default to 1 hour
    
    def generate_opal_client_config(self, connections: List[PIPConnection], opal_token: str = None) -> Dict[str, Any]:
        """Generate complete OPAL client configuration"""
        
        data_sources = []
        
        for connection in connections:
            if connection.status and connection.status.value == "active":
                ds_config = self.generate_data_source_config(connection, opal_token)
                data_sources.append(asdict(ds_config))
        
        return {
            "opal_client": {
                "server_url": self.opal_url,
                "client_id": "control-core-pap",
                "data_sources": data_sources,
                "policy_store": {
                    "type": "git",
                    "url": "https://github.com/control-core/policies",
                    "branch": "main",
                    "auth": {
                        "type": "token",
                        "token": opal_token or "default-token"
                    }
                },
                "log_level": "INFO",
                "fetch_on_startup": True,
                "fetch_interval": 30,
                "retry_on_failure": True,
                "retry_count": 3,
                "retry_delay": 5
            }
        }
    
    def generate_webhook_config(self, connection: PIPConnection) -> Dict[str, Any]:
        """Generate webhook configuration for real-time updates"""
        
        webhook_url = f"{self.pap_api_url}/pip/webhooks/{connection.provider}/{connection.id}"
        
        return {
            "webhook_url": webhook_url,
            "events": self._get_webhook_events(connection),
            "auth": {
                "type": "bearer",
                "token": f"webhook-{connection.id}-{connection.provider}"
            },
            "retry_policy": {
                "max_retries": 3,
                "retry_delay": 5,
                "backoff_multiplier": 2
            },
            "timeout": 30
        }
    
    def _get_webhook_events(self, connection: PIPConnection) -> List[str]:
        """Get webhook events based on connection type"""
        
        if connection.connection_type == "identity":
            return [
                "user.created",
                "user.updated",
                "user.deleted",
                "group.created",
                "group.updated",
                "group.deleted",
                "user.group_added",
                "user.group_removed"
            ]
        elif connection.connection_type == "database":
            return [
                "record.created",
                "record.updated",
                "record.deleted"
            ]
        elif connection.connection_type == "openapi":
            return [
                "endpoint.updated",
                "model.updated"
            ]
        else:
            return [
                "data.updated"
            ]
    
    def generate_policy_helper_functions(self, connection: PIPConnection) -> Dict[str, Any]:
        """Generate OPA helper functions for policy consumption"""
        
        helper_functions = {}
        
        if connection.connection_type == "identity":
            helper_functions.update({
                "get_user": {
                    "description": "Get user information by ID",
                    "function": f"get_user_{connection.provider}",
                    "parameters": ["user_id"],
                    "returns": "user object"
                },
                "get_user_groups": {
                    "description": "Get groups for a user",
                    "function": f"get_user_groups_{connection.provider}",
                    "parameters": ["user_id"],
                    "returns": "array of group objects"
                },
                "get_group_members": {
                    "description": "Get members of a group",
                    "function": f"get_group_members_{connection.provider}",
                    "parameters": ["group_id"],
                    "returns": "array of user objects"
                }
            })
        elif connection.connection_type == "database":
            helper_functions.update({
                "get_table_data": {
                    "description": "Get data from a specific table",
                    "function": f"get_table_data_{connection.provider}",
                    "parameters": ["table_name", "filters"],
                    "returns": "array of records"
                },
                "get_record": {
                    "description": "Get a specific record by ID",
                    "function": f"get_record_{connection.provider}",
                    "parameters": ["table_name", "record_id"],
                    "returns": "record object"
                }
            })
        
        return helper_functions
    
    def generate_data_schema(self, connection: PIPConnection) -> Dict[str, Any]:
        """Generate data schema for OPAL validation"""
        
        schema = {
            "type": "object",
            "properties": {
                "metadata": {
                    "type": "object",
                    "properties": {
                        "provider": {"type": "string"},
                        "connection_id": {"type": "integer"},
                        "last_updated": {"type": "string", "format": "date-time"}
                    },
                    "required": ["provider", "connection_id", "last_updated"]
                }
            },
            "required": ["metadata"]
        }
        
        # Add provider-specific schema
        if connection.connection_type == "identity":
            schema["properties"].update({
                "users": {
                    "type": "object",
                    "patternProperties": {
                        ".*": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "email": {"type": "string"},
                                "name": {"type": "string"},
                                "groups": {"type": "array", "items": {"type": "string"}},
                                "roles": {"type": "array", "items": {"type": "string"}},
                                "attributes": {"type": "object"},
                                "last_updated": {"type": "string", "format": "date-time"}
                            },
                            "required": ["id", "last_updated"]
                        }
                    }
                },
                "groups": {
                    "type": "object",
                    "patternProperties": {
                        ".*": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "name": {"type": "string"},
                                "description": {"type": "string"},
                                "members": {"type": "array", "items": {"type": "string"}},
                                "attributes": {"type": "object"},
                                "last_updated": {"type": "string", "format": "date-time"}
                            },
                            "required": ["id", "last_updated"]
                        }
                    }
                }
            })
        elif connection.connection_type == "database":
            schema["properties"].update({
                "tables": {
                    "type": "object",
                    "patternProperties": {
                        ".*": {
                            "type": "object",
                            "properties": {
                                "data": {"type": "array", "items": {"type": "object"}},
                                "count": {"type": "integer"},
                                "last_updated": {"type": "string", "format": "date-time"}
                            },
                            "required": ["data", "count", "last_updated"]
                        }
                    }
                }
            })
        
        return schema

# Global instance
opal_config_generator = OPALConfigGenerator()
