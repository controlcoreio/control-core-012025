"""
Audit Logger Service for Control Core PIP
Handles comprehensive audit logging for PIP operations
"""

import logging
import json
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

from app.models import PIPConnection, PIPSyncLog
from app.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class AuditEventType(Enum):
    CONNECTION_CREATED = "connection_created"
    CONNECTION_UPDATED = "connection_updated"
    CONNECTION_DELETED = "connection_deleted"
    CONNECTION_TESTED = "connection_tested"
    DATA_FETCHED = "data_fetched"
    DATA_PUBLISHED = "data_published"
    AUTHENTICATION_SUCCESS = "auth_success"
    AUTHENTICATION_FAILED = "auth_failed"
    TOKEN_REFRESHED = "token_refreshed"
    SYNC_STARTED = "sync_started"
    SYNC_COMPLETED = "sync_completed"
    SYNC_FAILED = "sync_failed"
    WEBHOOK_RECEIVED = "webhook_received"
    SENSITIVE_DATA_ACCESSED = "sensitive_data_accessed"
    CONFIGURATION_CHANGED = "configuration_changed"

class AuditSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class AuditEvent:
    """Represents an audit event"""
    event_id: str
    event_type: AuditEventType
    severity: AuditSeverity
    connection_id: Optional[int]
    user_id: Optional[str]
    timestamp: datetime
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    correlation_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "connection_id": self.connection_id,
            "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat(),
            "details": self.details,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "correlation_id": self.correlation_id
        }

class AuditLogger:
    """Service for comprehensive audit logging"""
    
    def __init__(self):
        self.logger = logging.getLogger("audit")
        self.retention_days = 90  # Default retention period
    
    def log_connection_created(self, connection: PIPConnection, user_id: str, ip_address: str = None, user_agent: str = None) -> str:
        """Log connection creation event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.CONNECTION_CREATED,
            severity=AuditSeverity.MEDIUM,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "connection_type": connection.connection_type,
                "sync_enabled": connection.sync_enabled,
                "sync_frequency": connection.sync_frequency
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self._log_event(event)
        return event_id
    
    def log_connection_updated(self, connection: PIPConnection, user_id: str, changes: Dict[str, Any], ip_address: str = None, user_agent: str = None) -> str:
        """Log connection update event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.CONNECTION_UPDATED,
            severity=AuditSeverity.MEDIUM,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "connection_type": connection.connection_type,
                "changes": changes
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self._log_event(event)
        return event_id
    
    def log_connection_deleted(self, connection_id: int, connection_name: str, provider: str, user_id: str, ip_address: str = None, user_agent: str = None) -> str:
        """Log connection deletion event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.CONNECTION_DELETED,
            severity=AuditSeverity.HIGH,
            connection_id=connection_id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection_name,
                "provider": provider
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self._log_event(event)
        return event_id
    
    def log_connection_tested(self, connection: PIPConnection, user_id: str, test_result: Dict[str, Any], ip_address: str = None, user_agent: str = None) -> str:
        """Log connection test event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.CONNECTION_TESTED,
            severity=AuditSeverity.LOW,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "test_success": test_result.get("success", False),
                "response_time": test_result.get("response_time", 0),
                "error": test_result.get("error")
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self._log_event(event)
        return event_id
    
    def log_data_fetched(self, connection: PIPConnection, record_count: int, fetch_duration: float, user_id: str = None) -> str:
        """Log data fetch event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.DATA_FETCHED,
            severity=AuditSeverity.LOW,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "record_count": record_count,
                "fetch_duration": fetch_duration
            }
        )
        
        self._log_event(event)
        return event_id
    
    def log_data_published(self, connection: PIPConnection, record_count: int, publish_duration: float, opal_response: Dict[str, Any] = None) -> str:
        """Log data publish event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.DATA_PUBLISHED,
            severity=AuditSeverity.LOW,
            connection_id=connection.id,
            user_id=None,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "record_count": record_count,
                "publish_duration": publish_duration,
                "opal_success": opal_response.get("success") if opal_response else None
            }
        )
        
        self._log_event(event)
        return event_id
    
    def log_authentication_success(self, connection: PIPConnection, auth_method: str, user_id: str = None) -> str:
        """Log successful authentication event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.AUTHENTICATION_SUCCESS,
            severity=AuditSeverity.LOW,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "auth_method": auth_method
            }
        )
        
        self._log_event(event)
        return event_id
    
    def log_authentication_failed(self, connection: PIPConnection, auth_method: str, error: str, user_id: str = None, ip_address: str = None) -> str:
        """Log failed authentication event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.AUTHENTICATION_FAILED,
            severity=AuditSeverity.HIGH,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "auth_method": auth_method,
                "error": error
            },
            ip_address=ip_address
        )
        
        self._log_event(event)
        return event_id
    
    def log_token_refreshed(self, connection: PIPConnection, token_type: str, success: bool, error: str = None) -> str:
        """Log token refresh event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.TOKEN_REFRESHED,
            severity=AuditSeverity.MEDIUM if success else AuditSeverity.HIGH,
            connection_id=connection.id,
            user_id=None,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "token_type": token_type,
                "success": success,
                "error": error
            }
        )
        
        self._log_event(event)
        return event_id
    
    def log_sync_started(self, connection: PIPConnection, sync_type: str, user_id: str = None) -> str:
        """Log sync start event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.SYNC_STARTED,
            severity=AuditSeverity.LOW,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "sync_type": sync_type
            }
        )
        
        self._log_event(event)
        return event_id
    
    def log_sync_completed(self, connection: PIPConnection, sync_type: str, record_count: int, duration: float, user_id: str = None) -> str:
        """Log sync completion event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.SYNC_COMPLETED,
            severity=AuditSeverity.LOW,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "sync_type": sync_type,
                "record_count": record_count,
                "duration": duration
            }
        )
        
        self._log_event(event)
        return event_id
    
    def log_sync_failed(self, connection: PIPConnection, sync_type: str, error: str, user_id: str = None) -> str:
        """Log sync failure event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.SYNC_FAILED,
            severity=AuditSeverity.HIGH,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "sync_type": sync_type,
                "error": error
            }
        )
        
        self._log_event(event)
        return event_id
    
    def log_webhook_received(self, connection: PIPConnection, webhook_data: Dict[str, Any], ip_address: str = None) -> str:
        """Log webhook received event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.WEBHOOK_RECEIVED,
            severity=AuditSeverity.LOW,
            connection_id=connection.id,
            user_id=None,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "webhook_type": webhook_data.get("type", "unknown"),
                "data_size": len(json.dumps(webhook_data))
            },
            ip_address=ip_address
        )
        
        self._log_event(event)
        return event_id
    
    def log_sensitive_data_accessed(self, connection: PIPConnection, data_type: str, record_count: int, user_id: str, ip_address: str = None) -> str:
        """Log sensitive data access event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.SENSITIVE_DATA_ACCESSED,
            severity=AuditSeverity.CRITICAL,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "data_type": data_type,
                "record_count": record_count
            },
            ip_address=ip_address
        )
        
        self._log_event(event)
        return event_id
    
    def log_configuration_changed(self, connection: PIPConnection, config_type: str, changes: Dict[str, Any], user_id: str, ip_address: str = None) -> str:
        """Log configuration change event"""
        event_id = str(uuid.uuid4())
        
        event = AuditEvent(
            event_id=event_id,
            event_type=AuditEventType.CONFIGURATION_CHANGED,
            severity=AuditSeverity.MEDIUM,
            connection_id=connection.id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            details={
                "connection_name": connection.name,
                "provider": connection.provider,
                "config_type": config_type,
                "changes": changes
            },
            ip_address=ip_address
        )
        
        self._log_event(event)
        return event_id
    
    def _log_event(self, event: AuditEvent):
        """Log audit event to database and file"""
        try:
            # Log to database
            self._log_to_database(event)
            
            # Log to file
            self._log_to_file(event)
            
        except Exception as e:
            logger.error(f"Failed to log audit event {event.event_id}: {e}")
    
    def _log_to_database(self, event: AuditEvent):
        """Log event to database"""
        try:
            db = next(get_db())
            
            # Create audit log entry
            audit_log = PIPSyncLog(
                connection_id=event.connection_id,
                sync_type="audit_log",
                status="success",
                records_processed=1,
                response_time=0,
                error_message=None,
                metadata={
                    "event_id": event.event_id,
                    "event_type": event.event_type.value,
                    "severity": event.severity.value,
                    "user_id": event.user_id,
                    "details": event.details,
                    "ip_address": event.ip_address,
                    "user_agent": event.user_agent,
                    "correlation_id": event.correlation_id
                }
            )
            
            db.add(audit_log)
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log audit event to database: {e}")
    
    def _log_to_file(self, event: AuditEvent):
        """Log event to file"""
        try:
            # Log to structured log file
            log_entry = {
                "timestamp": event.timestamp.isoformat(),
                "event_id": event.event_id,
                "event_type": event.event_type.value,
                "severity": event.severity.value,
                "connection_id": event.connection_id,
                "user_id": event.user_id,
                "details": event.details,
                "ip_address": event.ip_address,
                "user_agent": event.user_agent,
                "correlation_id": event.correlation_id
            }
            
            # Log with appropriate level based on severity
            if event.severity == AuditSeverity.CRITICAL:
                self.logger.critical(json.dumps(log_entry))
            elif event.severity == AuditSeverity.HIGH:
                self.logger.error(json.dumps(log_entry))
            elif event.severity == AuditSeverity.MEDIUM:
                self.logger.warning(json.dumps(log_entry))
            else:
                self.logger.info(json.dumps(log_entry))
                
        except Exception as e:
            logger.error(f"Failed to log audit event to file: {e}")
    
    def get_audit_logs(self, connection_id: int = None, event_type: AuditEventType = None, 
                      start_date: datetime = None, end_date: datetime = None, 
                      limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit logs with filtering"""
        try:
            db = next(get_db())
            
            query = db.query(PIPSyncLog).filter(
                PIPSyncLog.sync_type == "audit_log"
            )
            
            if connection_id:
                query = query.filter(PIPSyncLog.connection_id == connection_id)
            
            if start_date:
                query = query.filter(PIPSyncLog.created_at >= start_date)
            
            if end_date:
                query = query.filter(PIPSyncLog.created_at <= end_date)
            
            logs = query.order_by(PIPSyncLog.created_at.desc()).limit(limit).all()
            
            return [
                {
                    "event_id": log.metadata.get("event_id"),
                    "event_type": log.metadata.get("event_type"),
                    "severity": log.metadata.get("severity"),
                    "connection_id": log.connection_id,
                    "user_id": log.metadata.get("user_id"),
                    "timestamp": log.created_at.isoformat(),
                    "details": log.metadata.get("details", {}),
                    "ip_address": log.metadata.get("ip_address"),
                    "user_agent": log.metadata.get("user_agent")
                }
                for log in logs
            ]
            
        except Exception as e:
            logger.error(f"Failed to get audit logs: {e}")
            return []
    
    def cleanup_old_logs(self, retention_days: int = None):
        """Clean up old audit logs"""
        try:
            retention_days = retention_days or self.retention_days
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            db = next(get_db())
            
            # Delete old audit logs
            deleted_count = db.query(PIPSyncLog).filter(
                PIPSyncLog.sync_type == "audit_log",
                PIPSyncLog.created_at < cutoff_date
            ).delete()
            
            db.commit()
            
            logger.info(f"Cleaned up {deleted_count} old audit logs")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup old audit logs: {e}")
            return 0

# Global instance
audit_logger = AuditLogger()
