"""
Health Monitoring Service for Control Core PIP
Implements connection testing, health monitoring, and security audit logging
"""

import asyncio
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
import logging

from app.models import PIPConnection, PIPSyncLog, WebhookEvent
from .pip_service import PIPService
from .secrets_service import secrets_service

logger = logging.getLogger(__name__)

class HealthMonitorService:
    """Service for monitoring PIP connection health and performance"""
    
    def __init__(self, db: Session):
        self.db = db
        self.pip_service = PIPService(db)
        self.monitoring_enabled = True
        self.health_check_interval = 300  # 5 minutes
        self.retry_attempts = 3
        self.retry_delay = 30  # seconds
    
    async def start_health_monitoring(self):
        """Start background health monitoring for all connections"""
        if not self.monitoring_enabled:
            return
        
        logger.info("Starting PIP health monitoring service")
        
        while self.monitoring_enabled:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.health_check_interval)
            except Exception as e:
                logger.error(f"Health monitoring error: {str(e)}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def stop_health_monitoring(self):
        """Stop health monitoring service"""
        self.monitoring_enabled = False
        logger.info("Stopping PIP health monitoring service")
    
    async def _perform_health_checks(self):
        """Perform health checks on all active connections"""
        connections = self.db.query(PIPConnection).filter(
            PIPConnection.sync_enabled == True
        ).all()
        
        for connection in connections:
            try:
                await self._check_connection_health(connection)
            except Exception as e:
                logger.error(f"Failed to check health for connection {connection.id}: {str(e)}")
    
    async def _check_connection_health(self, connection: PIPConnection):
        """Check health of a specific connection"""
        try:
            # Perform health check
            health_result = await self.pip_service.health_check_connection(connection.id)
            
            # Update connection status
            connection.health_status = health_result['status']
            connection.last_health_check = datetime.now()
            
            # Log health check result
            if health_result['status'] == 'unhealthy':
                logger.warning(f"Connection {connection.id} ({connection.name}) is unhealthy: {health_result.get('error_message', 'Unknown error')}")
                
                # Trigger alert if connection has been unhealthy for too long
                await self._check_unhealthy_duration(connection)
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Health check failed for connection {connection.id}: {str(e)}")
            connection.health_status = 'unhealthy'
            connection.last_health_check = datetime.now()
            self.db.commit()
    
    async def _check_unhealthy_duration(self, connection: PIPConnection):
        """Check if connection has been unhealthy for too long"""
        # Check if connection has been unhealthy for more than 1 hour
        unhealthy_threshold = datetime.now() - timedelta(hours=1)
        
        # Get recent health checks
        recent_checks = self.db.query(PIPSyncLog).filter(
            and_(
                PIPSyncLog.connection_id == connection.id,
                PIPSyncLog.sync_type == 'health_check',
                PIPSyncLog.started_at > unhealthy_threshold
            )
        ).all()
        
        # Count consecutive failures
        consecutive_failures = 0
        for check in reversed(recent_checks):
            if check.status == 'error':
                consecutive_failures += 1
            else:
                break
        
        # Alert if too many consecutive failures
        if consecutive_failures >= 5:
            logger.error(f"Connection {connection.id} has had {consecutive_failures} consecutive health check failures")
            await self._send_health_alert(connection, consecutive_failures)
    
    async def _send_health_alert(self, connection: PIPConnection, failure_count: int):
        """Send health alert for unhealthy connection"""
        # In a real implementation, this would send notifications
        # For now, just log the alert
        alert_message = f"ALERT: Connection {connection.name} (ID: {connection.id}) has failed {failure_count} consecutive health checks"
        logger.error(alert_message)
        
        # Could integrate with notification services like:
        # - Email notifications
        # - Slack/Teams webhooks
        # - PagerDuty alerts
        # - Custom alerting system
    
    async def test_connection_with_retry(self, connection_id: int) -> Dict[str, Any]:
        """Test connection with retry logic"""
        connection = self.db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise ValueError(f"PIP connection {connection_id} not found")
        
        last_error = None
        
        for attempt in range(self.retry_attempts):
            try:
                result = await self.pip_service.health_check_connection(connection_id)
                
                if result['status'] == 'healthy':
                    return {
                        'success': True,
                        'status': 'healthy',
                        'response_time': result['response_time'],
                        'attempts': attempt + 1,
                        'details': result.get('details', {})
                    }
                else:
                    last_error = result.get('error_message', 'Health check failed')
                    
            except Exception as e:
                last_error = str(e)
            
            # Wait before retry (except on last attempt)
            if attempt < self.retry_attempts - 1:
                await asyncio.sleep(self.retry_delay)
        
        return {
            'success': False,
            'status': 'unhealthy',
            'error': last_error,
            'attempts': self.retry_attempts,
            'details': {}
        }
    
    async def get_connection_health_summary(self) -> Dict[str, Any]:
        """Get health summary for all connections"""
        connections = self.db.query(PIPConnection).all()
        
        healthy_count = 0
        unhealthy_count = 0
        unknown_count = 0
        total_connections = len(connections)
        
        for connection in connections:
            if connection.health_status == 'healthy':
                healthy_count += 1
            elif connection.health_status == 'unhealthy':
                unhealthy_count += 1
            else:
                unknown_count += 1
        
        return {
            'total_connections': total_connections,
            'healthy': healthy_count,
            'unhealthy': unhealthy_count,
            'unknown': unknown_count,
            'health_percentage': (healthy_count / total_connections * 100) if total_connections > 0 else 0,
            'last_check': datetime.now().isoformat()
        }
    
    async def get_connection_performance_metrics(self, connection_id: int, hours: int = 24) -> Dict[str, Any]:
        """Get performance metrics for a connection"""
        connection = self.db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise ValueError(f"PIP connection {connection_id} not found")
        
        # Get sync logs for the specified time period
        start_time = datetime.now() - timedelta(hours=hours)
        sync_logs = self.db.query(PIPSyncLog).filter(
            and_(
                PIPSyncLog.connection_id == connection_id,
                PIPSyncLog.started_at > start_time
            )
        ).all()
        
        if not sync_logs:
            return {
                'connection_id': connection_id,
                'connection_name': connection.name,
                'period_hours': hours,
                'total_syncs': 0,
                'successful_syncs': 0,
                'failed_syncs': 0,
                'average_duration': 0,
                'average_records_processed': 0,
                'error_rate': 0
            }
        
        # Calculate metrics
        total_syncs = len(sync_logs)
        successful_syncs = len([log for log in sync_logs if log.status == 'success'])
        failed_syncs = total_syncs - successful_syncs
        
        total_duration = sum(log.duration_seconds or 0 for log in sync_logs)
        average_duration = total_duration / total_syncs if total_syncs > 0 else 0
        
        total_records = sum(log.records_processed or 0 for log in sync_logs)
        average_records = total_records / total_syncs if total_syncs > 0 else 0
        
        error_rate = (failed_syncs / total_syncs * 100) if total_syncs > 0 else 0
        
        return {
            'connection_id': connection_id,
            'connection_name': connection.name,
            'period_hours': hours,
            'total_syncs': total_syncs,
            'successful_syncs': successful_syncs,
            'failed_syncs': failed_syncs,
            'average_duration': round(average_duration, 2),
            'average_records_processed': round(average_records, 2),
            'error_rate': round(error_rate, 2),
            'last_sync': sync_logs[-1].started_at.isoformat() if sync_logs else None
        }
    
    async def audit_connection_access(self, connection_id: int, user_id: str, operation: str, details: Dict[str, Any] = None):
        """Audit connection access for security monitoring"""
        try:
            # Log to audit system
            audit_entry = {
                'timestamp': datetime.now().isoformat(),
                'connection_id': connection_id,
                'user_id': user_id,
                'operation': operation,
                'details': details or {},
                'service': 'health_monitor'
            }
            
            # In a real implementation, this would write to a secure audit database
            logger.info(f"AUDIT: {audit_entry}")
            
            # Check for suspicious patterns
            await self._check_suspicious_patterns(connection_id, user_id, operation)
            
        except Exception as e:
            logger.error(f"Failed to audit connection access: {str(e)}")
    
    async def _check_suspicious_patterns(self, connection_id: int, user_id: str, operation: str):
        """Check for suspicious access patterns"""
        # In a real implementation, this would analyze access patterns
        # For now, just log potential issues
        
        suspicious_operations = ['delete', 'rotate_secret', 'clear_cache']
        if operation in suspicious_operations:
            logger.warning(f"Suspicious operation detected: {operation} on connection {connection_id} by user {user_id}")
    
    async def get_security_audit_logs(
        self, 
        connection_id: Optional[int] = None,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get security audit logs with filtering"""
        try:
            # In a real implementation, this would query a secure audit database
            # For now, return mock audit logs
            audit_logs = [
                {
                    'timestamp': datetime.now().isoformat(),
                    'connection_id': connection_id or 1,
                    'user_id': user_id or 'system',
                    'operation': 'health_check',
                    'details': {'status': 'healthy'},
                    'service': 'health_monitor'
                }
            ]
            
            return audit_logs
            
        except Exception as e:
            logger.error(f"Failed to get security audit logs: {str(e)}")
            return []
    
    async def schedule_periodic_syncs(self):
        """Schedule periodic syncs for all enabled connections"""
        connections = self.db.query(PIPConnection).filter(
            PIPConnection.sync_enabled == True
        ).all()
        
        for connection in connections:
            try:
                # Check if sync is due
                if self._is_sync_due(connection):
                    await self._trigger_sync(connection)
            except Exception as e:
                logger.error(f"Failed to schedule sync for connection {connection.id}: {str(e)}")
    
    def _is_sync_due(self, connection: PIPConnection) -> bool:
        """Check if sync is due for a connection"""
        if not connection.last_sync:
            return True
        
        sync_interval = timedelta(seconds=connection.sync_frequency)
        next_sync_time = connection.last_sync + sync_interval
        
        return datetime.now() >= next_sync_time
    
    async def _trigger_sync(self, connection: PIPConnection):
        """Trigger sync for a connection"""
        try:
            sync_result = await self.pip_service.sync_connection(connection.id, "incremental")
            
            if sync_result.get('success'):
                connection.last_sync = datetime.now()
                self.db.commit()
                logger.info(f"Successfully synced connection {connection.id}")
            else:
                logger.error(f"Sync failed for connection {connection.id}: {sync_result.get('error')}")
                
        except Exception as e:
            logger.error(f"Failed to trigger sync for connection {connection.id}: {str(e)}")
    
    async def cleanup_old_logs(self, days: int = 30):
        """Clean up old sync logs and webhook events"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Clean up old sync logs
            old_sync_logs = self.db.query(PIPSyncLog).filter(
                PIPSyncLog.started_at < cutoff_date
            ).delete()
            
            # Clean up old webhook events
            old_webhook_events = self.db.query(WebhookEvent).filter(
                WebhookEvent.created_at < cutoff_date
            ).delete()
            
            self.db.commit()
            
            logger.info(f"Cleaned up {old_sync_logs} old sync logs and {old_webhook_events} old webhook events")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old logs: {str(e)}")
            self.db.rollback()

class SecurityAuditService:
    """Service for security audit logging and monitoring"""
    
    def __init__(self, db: Session):
        self.db = db
        self.audit_logs = []
    
    async def log_credential_access(self, connection_id: int, user_id: str, operation: str, success: bool = True):
        """Log credential access for audit purposes"""
        audit_entry = {
            'timestamp': datetime.now().isoformat(),
            'connection_id': connection_id,
            'user_id': user_id,
            'operation': operation,
            'success': success,
            'service': 'secrets_service'
        }
        
        self.audit_logs.append(audit_entry)
        logger.info(f"SECURITY_AUDIT: {audit_entry}")
    
    async def log_connection_test(self, connection_id: int, user_id: str, success: bool, error_message: str = None):
        """Log connection test for audit purposes"""
        audit_entry = {
            'timestamp': datetime.now().isoformat(),
            'connection_id': connection_id,
            'user_id': user_id,
            'operation': 'test_connection',
            'success': success,
            'error_message': error_message,
            'service': 'health_monitor'
        }
        
        self.audit_logs.append(audit_entry)
        logger.info(f"SECURITY_AUDIT: {audit_entry}")
    
    async def log_data_access(self, connection_id: int, user_id: str, attributes: List[str], success: bool = True):
        """Log data access for audit purposes"""
        audit_entry = {
            'timestamp': datetime.now().isoformat(),
            'connection_id': connection_id,
            'user_id': user_id,
            'operation': 'data_access',
            'attributes': attributes,
            'success': success,
            'service': 'pip_service'
        }
        
        self.audit_logs.append(audit_entry)
        logger.info(f"SECURITY_AUDIT: {audit_entry}")
    
    async def get_audit_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get audit summary for the specified time period"""
        start_time = datetime.now() - timedelta(hours=hours)
        
        # Filter audit logs by time period
        recent_logs = [
            log for log in self.audit_logs
            if datetime.fromisoformat(log['timestamp']) > start_time
        ]
        
        # Calculate summary statistics
        total_operations = len(recent_logs)
        successful_operations = len([log for log in recent_logs if log.get('success', True)])
        failed_operations = total_operations - successful_operations
        
        # Group by operation type
        operations_by_type = {}
        for log in recent_logs:
            op_type = log.get('operation', 'unknown')
            operations_by_type[op_type] = operations_by_type.get(op_type, 0) + 1
        
        # Group by user
        operations_by_user = {}
        for log in recent_logs:
            user_id = log.get('user_id', 'unknown')
            operations_by_user[user_id] = operations_by_user.get(user_id, 0) + 1
        
        return {
            'period_hours': hours,
            'total_operations': total_operations,
            'successful_operations': successful_operations,
            'failed_operations': failed_operations,
            'success_rate': (successful_operations / total_operations * 100) if total_operations > 0 else 0,
            'operations_by_type': operations_by_type,
            'operations_by_user': operations_by_user,
            'generated_at': datetime.now().isoformat()
        }

# Global instances (will be initialized with proper dependencies)
health_monitor_service = None
security_audit_service = None

def initialize_health_monitoring(db: Session):
    """Initialize health monitoring services with dependencies"""
    global health_monitor_service, security_audit_service
    health_monitor_service = HealthMonitorService(db)
    security_audit_service = SecurityAuditService(db)
