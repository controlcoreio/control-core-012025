from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from app.models import TenantMetrics, TenantAuditLog, Tenant, TenantPolicy, TenantResource, TenantBouncer
from app.schemas import MetricCreate, DashboardStats, TenantDashboard
from typing import List, Optional, Dict, Any
import uuid
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class MonitoringService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_metric(self, tenant_id: str, metric_data: MetricCreate) -> TenantMetrics:
        """Create a new metric"""
        try:
            metric = TenantMetrics(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                metric_name=metric_data.metric_name,
                metric_value=metric_data.metric_value,
                metric_type=metric_data.metric_type,
                labels=metric_data.labels or {}
            )
            
            self.db.add(metric)
            self.db.commit()
            self.db.refresh(metric)
            
            logger.info(f"Created metric {metric.id} for tenant {tenant_id}")
            return metric
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating metric: {e}")
            raise
    
    def get_metrics(self, tenant_id: str, metric_name: Optional[str] = None, 
                   start_time: Optional[str] = None, end_time: Optional[str] = None) -> List[TenantMetrics]:
        """Get metrics for tenant with filters"""
        try:
            query = self.db.query(TenantMetrics).filter(TenantMetrics.tenant_id == tenant_id)
            
            if metric_name:
                query = query.filter(TenantMetrics.metric_name == metric_name)
            
            if start_time:
                start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                query = query.filter(TenantMetrics.timestamp >= start_dt)
            
            if end_time:
                end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                query = query.filter(TenantMetrics.timestamp <= end_dt)
            
            metrics = query.order_by(desc(TenantMetrics.timestamp)).all()
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting metrics: {e}")
            raise
    
    def get_audit_logs(self, tenant_id: str, skip: int = 0, limit: int = 100,
                      action: Optional[str] = None, result: Optional[str] = None,
                      start_time: Optional[str] = None, end_time: Optional[str] = None) -> List[TenantAuditLog]:
        """Get audit logs for tenant with filters"""
        try:
            query = self.db.query(TenantAuditLog).filter(TenantAuditLog.tenant_id == tenant_id)
            
            if action:
                query = query.filter(TenantAuditLog.action == action)
            
            if result:
                query = query.filter(TenantAuditLog.result == result)
            
            if start_time:
                start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                query = query.filter(TenantAuditLog.timestamp >= start_dt)
            
            if end_time:
                end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                query = query.filter(TenantAuditLog.timestamp <= end_dt)
            
            audit_logs = query.order_by(desc(TenantAuditLog.timestamp)).offset(skip).limit(limit).all()
            return audit_logs
            
        except Exception as e:
            logger.error(f"Error getting audit logs: {e}")
            raise
    
    def get_tenant_dashboard(self, tenant_id: str) -> TenantDashboard:
        """Get tenant dashboard data"""
        try:
            # Get tenant information
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")
            
            # Get statistics
            stats = self._get_tenant_statistics(tenant_id)
            
            # Get recent activities
            recent_activities = self.get_audit_logs(tenant_id, skip=0, limit=10)
            
            # Get health status
            health_status = self._get_health_status(tenant_id)
            
            return TenantDashboard(
                tenant=tenant,
                stats=stats,
                recent_activities=recent_activities,
                health_status=health_status
            )
            
        except Exception as e:
            logger.error(f"Error getting tenant dashboard: {e}")
            raise
    
    def get_health_status(self, tenant_id: str) -> Dict[str, Any]:
        """Get health status for tenant"""
        try:
            return self._get_health_status(tenant_id)
            
        except Exception as e:
            logger.error(f"Error getting health status: {e}")
            raise
    
    def get_alerts(self, tenant_id: str, severity: Optional[str] = None, 
                  status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get alerts for tenant"""
        try:
            # In a real implementation, this would query an alerts table
            # For now, return mock alerts
            alerts = [
                {
                    "id": "alert_1",
                    "title": "High CPU Usage",
                    "description": "CPU usage is above 80%",
                    "severity": "warning",
                    "status": "active",
                    "timestamp": datetime.utcnow().isoformat()
                },
                {
                    "id": "alert_2",
                    "title": "Policy Evaluation Error",
                    "description": "Policy evaluation failed for resource api-1",
                    "severity": "error",
                    "status": "active",
                    "timestamp": datetime.utcnow().isoformat()
                }
            ]
            
            # Filter by severity and status
            if severity:
                alerts = [alert for alert in alerts if alert["severity"] == severity]
            
            if status:
                alerts = [alert for alert in alerts if alert["status"] == status]
            
            return alerts
            
        except Exception as e:
            logger.error(f"Error getting alerts: {e}")
            raise
    
    def acknowledge_alert(self, alert_id: str, tenant_id: str) -> bool:
        """Acknowledge alert"""
        try:
            # In a real implementation, this would update the alert status
            # For now, return success
            logger.info(f"Acknowledged alert {alert_id} for tenant {tenant_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error acknowledging alert: {e}")
            raise
    
    def get_performance_metrics(self, tenant_id: str, time_range: str) -> Dict[str, Any]:
        """Get performance metrics"""
        try:
            # In a real implementation, this would query actual performance data
            # For now, return mock performance metrics
            return {
                "time_range": time_range,
                "metrics": {
                    "requests_per_second": 45.2,
                    "average_response_time": "15ms",
                    "error_rate": "0.1%",
                    "uptime": "99.9%",
                    "throughput": "2.5MB/s"
                },
                "trends": {
                    "requests_per_second": [40, 42, 45, 48, 45, 43, 45],
                    "response_time": [12, 13, 15, 16, 15, 14, 15],
                    "error_rate": [0.1, 0.2, 0.1, 0.0, 0.1, 0.1, 0.1]
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting performance metrics: {e}")
            raise
    
    def get_usage_metrics(self, tenant_id: str, time_range: str) -> Dict[str, Any]:
        """Get usage metrics"""
        try:
            # In a real implementation, this would query actual usage data
            # For now, return mock usage metrics
            return {
                "time_range": time_range,
                "usage": {
                    "api_calls": 12500,
                    "policy_evaluations": 45000,
                    "data_transferred": "2.5GB",
                    "storage_used": "1.2GB",
                    "active_users": 15
                },
                "limits": {
                    "api_calls": 100000,
                    "policy_evaluations": 500000,
                    "storage": "10GB",
                    "users": 100
                },
                "utilization": {
                    "api_calls": 12.5,
                    "policy_evaluations": 9.0,
                    "storage": 12.0,
                    "users": 15.0
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting usage metrics: {e}")
            raise
    
    def _get_tenant_statistics(self, tenant_id: str) -> DashboardStats:
        """Get tenant statistics"""
        try:
            # Get counts for different resources
            total_policies = self.db.query(TenantPolicy).filter(
                TenantPolicy.tenant_id == tenant_id
            ).count()
            
            total_resources = self.db.query(TenantResource).filter(
                TenantResource.tenant_id == tenant_id
            ).count()
            
            total_bouncers = self.db.query(TenantBouncer).filter(
                TenantBouncer.tenant_id == tenant_id
            ).count()
            
            active_bouncers = self.db.query(TenantBouncer).filter(
                and_(
                    TenantBouncer.tenant_id == tenant_id,
                    TenantBouncer.status == "active"
                )
            ).count()
            
            # Get user count (mock for now)
            total_users = 15
            
            # Get recent audit logs count
            recent_audit_logs = self.db.query(TenantAuditLog).filter(
                and_(
                    TenantAuditLog.tenant_id == tenant_id,
                    TenantAuditLog.timestamp >= datetime.utcnow() - timedelta(hours=24)
                )
            ).count()
            
            # Get policy evaluations today (mock)
            policy_evaluations_today = 45000
            
            # Get average response time (mock)
            average_response_time = 15.5
            
            return DashboardStats(
                total_policies=total_policies,
                total_resources=total_resources,
                total_bouncers=total_bouncers,
                active_bouncers=active_bouncers,
                total_users=total_users,
                recent_audit_logs=recent_audit_logs,
                policy_evaluations_today=policy_evaluations_today,
                average_response_time=average_response_time
            )
            
        except Exception as e:
            logger.error(f"Error getting tenant statistics: {e}")
            raise
    
    def _get_health_status(self, tenant_id: str) -> Dict[str, str]:
        """Get health status for tenant resources"""
        try:
            # Get health status for all resources
            resources = self.db.query(TenantResource).filter(
                TenantResource.tenant_id == tenant_id
            ).all()
            
            health_status = {}
            for resource in resources:
                health_status[resource.name] = resource.health_status or "unknown"
            
            # Get bouncer health status
            bouncers = self.db.query(TenantBouncer).filter(
                TenantBouncer.tenant_id == tenant_id
            ).all()
            
            for bouncer in bouncers:
                health_status[f"bouncer_{bouncer.name}"] = bouncer.status
            
            return health_status
            
        except Exception as e:
            logger.error(f"Error getting health status: {e}")
            raise
