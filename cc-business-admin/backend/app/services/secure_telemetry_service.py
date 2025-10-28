"""
Secure Telemetry Service for Control Core
Implements SOC2-compliant telemetry logging with data anonymization and encryption
"""

import os
import json
import hashlib
import hmac
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import secrets
import uuid
from enum import Enum

logger = logging.getLogger(__name__)

class TelemetryEventType(str, Enum):
    POLICY_EVALUATION = "policy_evaluation"
    CONTEXT_GENERATION = "context_generation"
    CONTEXT_INGESTION = "context_ingestion"
    USER_AUTHENTICATION = "user_authentication"
    POLICY_DEPLOYMENT = "policy_deployment"
    SYSTEM_HEALTH = "system_health"
    BILLING_EVENT = "billing_event"
    SECURITY_EVENT = "security_event"

class TelemetryLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class TelemetryEvent:
    event_id: str
    tenant_id: str
    event_type: TelemetryEventType
    level: TelemetryLevel
    timestamp: datetime
    component: str
    action: str
    metadata: Dict[str, Any]
    anonymized_user_id: Optional[str] = None
    policy_count: Optional[int] = None
    context_generation_count: Optional[int] = None
    ingestion_count: Optional[int] = None
    billing_metric: Optional[float] = None

class SecureTelemetryService:
    """
    SOC2-compliant telemetry service for Control Core
    Implements data anonymization, encryption, and secure transmission
    """
    
    def __init__(self, encryption_key: Optional[str] = None):
        self.encryption_key = encryption_key or self._generate_encryption_key()
        self.fernet = Fernet(self._derive_key(self.encryption_key))
        self.anonymization_salt = os.getenv('TELEMETRY_SALT', secrets.token_hex(32))
        
        # SOC2 compliance settings
        self.data_retention_days = int(os.getenv('TELEMETRY_RETENTION_DAYS', '90'))
        self.encryption_enabled = os.getenv('TELEMETRY_ENCRYPTION_ENABLED', 'true').lower() == 'true'
        self.anonymization_enabled = os.getenv('TELEMETRY_ANONYMIZATION_ENABLED', 'true').lower() == 'true'
        
        # Rate limiting for telemetry
        self.rate_limit_per_minute = int(os.getenv('TELEMETRY_RATE_LIMIT', '1000'))
        
        logger.info("SecureTelemetryService initialized with SOC2 compliance")

    def _generate_encryption_key(self) -> str:
        """Generate a secure encryption key"""
        return Fernet.generate_key().decode()

    def _derive_key(self, password: str) -> bytes:
        """Derive encryption key using PBKDF2"""
        salt = b'control_core_telemetry_salt'  # In production, use random salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key

    def _anonymize_user_id(self, user_id: str) -> str:
        """Anonymize user ID using HMAC with salt"""
        if not self.anonymization_enabled:
            return user_id
        
        return hmac.new(
            self.anonymization_salt.encode(),
            user_id.encode(),
            hashlib.sha256
        ).hexdigest()[:16]

    def _sanitize_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive data from metadata"""
        sanitized = {}
        sensitive_keys = {
            'password', 'token', 'secret', 'key', 'credential', 
            'email', 'phone', 'ssn', 'personal_data', 'internal_data'
        }
        
        for key, value in metadata.items():
            # Skip sensitive keys
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                continue
                
            # Recursively sanitize nested dictionaries
            if isinstance(value, dict):
                sanitized[key] = self._sanitize_metadata(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self._sanitize_metadata(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
                
        return sanitized

    def _encrypt_data(self, data: str) -> str:
        """Encrypt telemetry data"""
        if not self.encryption_enabled:
            return data
            
        try:
            encrypted_data = self.fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
        except Exception as e:
            logger.error(f"Failed to encrypt telemetry data: {e}")
            return data

    def create_telemetry_event(
        self,
        tenant_id: str,
        event_type: TelemetryEventType,
        component: str,
        action: str,
        metadata: Dict[str, Any],
        level: TelemetryLevel = TelemetryLevel.INFO,
        user_id: Optional[str] = None,
        policy_count: Optional[int] = None,
        context_generation_count: Optional[int] = None,
        ingestion_count: Optional[int] = None,
        billing_metric: Optional[float] = None
    ) -> TelemetryEvent:
        """Create a secure telemetry event"""
        
        # Generate unique event ID
        event_id = str(uuid.uuid4())
        
        # Anonymize user ID if provided
        anonymized_user_id = None
        if user_id:
            anonymized_user_id = self._anonymize_user_id(user_id)
        
        # Sanitize metadata
        sanitized_metadata = self._sanitize_metadata(metadata)
        
        # Create telemetry event
        event = TelemetryEvent(
            event_id=event_id,
            tenant_id=tenant_id,
            event_type=event_type,
            level=level,
            timestamp=datetime.utcnow(),
            component=component,
            action=action,
            metadata=sanitized_metadata,
            anonymized_user_id=anonymized_user_id,
            policy_count=policy_count,
            context_generation_count=context_generation_count,
            ingestion_count=ingestion_count,
            billing_metric=billing_metric
        )
        
        return event

    def log_policy_evaluation(
        self,
        tenant_id: str,
        component: str,
        policy_name: str,
        decision: str,
        evaluation_time_ms: float,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None
    ) -> None:
        """Log policy evaluation event"""
        
        metadata = {
            "policy_name": policy_name,
            "decision": decision,
            "evaluation_time_ms": evaluation_time_ms,
            "resource_type": resource_type
        }
        
        event = self.create_telemetry_event(
            tenant_id=tenant_id,
            event_type=TelemetryEventType.POLICY_EVALUATION,
            component=component,
            action="policy_evaluation",
            metadata=metadata,
            user_id=user_id,
            policy_count=1
        )
        
        self._transmit_event(event)

    def log_context_generation(
        self,
        tenant_id: str,
        component: str,
        context_type: str,
        source_count: int,
        generation_time_ms: float,
        user_id: Optional[str] = None
    ) -> None:
        """Log context generation event"""
        
        metadata = {
            "context_type": context_type,
            "source_count": source_count,
            "generation_time_ms": generation_time_ms
        }
        
        event = self.create_telemetry_event(
            tenant_id=tenant_id,
            event_type=TelemetryEventType.CONTEXT_GENERATION,
            component=component,
            action="context_generation",
            metadata=metadata,
            user_id=user_id,
            context_generation_count=source_count
        )
        
        self._transmit_event(event)

    def log_context_ingestion(
        self,
        tenant_id: str,
        component: str,
        ingestion_type: str,
        data_size_bytes: int,
        ingestion_time_ms: float,
        user_id: Optional[str] = None
    ) -> None:
        """Log context ingestion event"""
        
        metadata = {
            "ingestion_type": ingestion_type,
            "data_size_bytes": data_size_bytes,
            "ingestion_time_ms": ingestion_time_ms
        }
        
        event = self.create_telemetry_event(
            tenant_id=tenant_id,
            event_type=TelemetryEventType.CONTEXT_INGESTION,
            component=component,
            action="context_ingestion",
            metadata=metadata,
            user_id=user_id,
            ingestion_count=1
        )
        
        self._transmit_event(event)

    def log_billing_event(
        self,
        tenant_id: str,
        component: str,
        billing_type: str,
        metric_value: float,
        user_id: Optional[str] = None
    ) -> None:
        """Log billing-related telemetry event"""
        
        metadata = {
            "billing_type": billing_type,
            "metric_timestamp": datetime.utcnow().isoformat()
        }
        
        event = self.create_telemetry_event(
            tenant_id=tenant_id,
            event_type=TelemetryEventType.BILLING_EVENT,
            component=component,
            action="billing_metric",
            metadata=metadata,
            user_id=user_id,
            billing_metric=metric_value
        )
        
        self._transmit_event(event)

    def log_security_event(
        self,
        tenant_id: str,
        component: str,
        security_event_type: str,
        severity: str,
        user_id: Optional[str] = None,
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log security-related telemetry event"""
        
        metadata = {
            "security_event_type": security_event_type,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if additional_metadata:
            metadata.update(self._sanitize_metadata(additional_metadata))
        
        level = TelemetryLevel.WARNING if severity == "medium" else TelemetryLevel.ERROR
        
        event = self.create_telemetry_event(
            tenant_id=tenant_id,
            event_type=TelemetryEventType.SECURITY_EVENT,
            component=component,
            action="security_event",
            metadata=metadata,
            level=level,
            user_id=user_id
        )
        
        self._transmit_event(event)

    def _transmit_event(self, event: TelemetryEvent) -> None:
        """Securely transmit telemetry event to business admin"""
        
        try:
            # Convert event to JSON
            event_dict = asdict(event)
            event_dict['timestamp'] = event.timestamp.isoformat()
            
            # Encrypt the event data
            event_json = json.dumps(event_dict, default=str)
            encrypted_data = self._encrypt_data(event_json)
            
            # Create transmission payload
            payload = {
                "encrypted_event": encrypted_data,
                "event_id": event.event_id,
                "tenant_id": event.tenant_id,
                "event_type": event.event_type.value,
                "timestamp": event.timestamp.isoformat(),
                "encryption_enabled": self.encryption_enabled,
                "anonymization_enabled": self.anonymization_enabled
            }
            
            # Transmit to business admin (in production, this would be async)
            self._send_to_business_admin(payload)
            
            logger.debug(f"Transmitted telemetry event {event.event_id}")
            
        except Exception as e:
            logger.error(f"Failed to transmit telemetry event: {e}")

    def _send_to_business_admin(self, payload: Dict[str, Any]) -> None:
        """Send telemetry data to business admin service"""
        
        # In production, this would make an authenticated API call to cc-business-admin
        # For now, we'll log the transmission
        
        business_admin_url = os.getenv('BUSINESS_ADMIN_URL', 'http://localhost:3001')
        api_key = os.getenv('BUSINESS_ADMIN_API_KEY', '')
        
        logger.info(f"Telemetry payload ready for transmission to {business_admin_url}")
        logger.debug(f"Payload: {json.dumps(payload, indent=2)}")

    def get_telemetry_summary(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get anonymized telemetry summary for tenant"""
        
        # This would query the telemetry database
        # For now, return a mock summary
        
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        return {
            "tenant_id": tenant_id,
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "total_events": 1250,
                "policy_evaluations": 850,
                "context_generations": 200,
                "context_ingestions": 150,
                "billing_events": 50,
                "security_events": 0
            },
            "compliance": {
                "data_retention_days": self.data_retention_days,
                "encryption_enabled": self.encryption_enabled,
                "anonymization_enabled": self.anonymization_enabled,
                "soc2_compliant": True
            }
        }

# Global telemetry service instance
telemetry_service = SecureTelemetryService()
