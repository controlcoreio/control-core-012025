from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.models import TenantMetrics, TenantAuditLog
from app.schemas import MetricCreate, MetricResponse, AuditLogResponse, DashboardStats, TenantDashboard
from app.routers.auth import get_current_user
from app.services.monitoring_service import MonitoringService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/dashboard", response_model=TenantDashboard)
async def get_tenant_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get tenant dashboard data"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    monitoring_service = MonitoringService(db)
    dashboard = monitoring_service.get_tenant_dashboard(tenant_id)
    
    return dashboard

@router.get("/metrics", response_model=List[MetricResponse])
async def get_metrics(
    request: Request,
    metric_name: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get metrics for current tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    monitoring_service = MonitoringService(db)
    metrics = monitoring_service.get_metrics(
        tenant_id=tenant_id,
        metric_name=metric_name,
        start_time=start_time,
        end_time=end_time
    )
    
    return metrics

@router.post("/metrics", response_model=MetricResponse)
async def create_metric(
    metric_data: MetricCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new metric"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    monitoring_service = MonitoringService(db)
    metric = monitoring_service.create_metric(
        tenant_id=tenant_id,
        metric_data=metric_data
    )
    
    return metric

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    action: Optional[str] = None,
    result: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get audit logs for current tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    monitoring_service = MonitoringService(db)
    audit_logs = monitoring_service.get_audit_logs(
        tenant_id=tenant_id,
        skip=skip,
        limit=limit,
        action=action,
        result=result,
        start_time=start_time,
        end_time=end_time
    )
    
    return audit_logs

@router.get("/health")
async def get_health_status(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get health status for current tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    monitoring_service = MonitoringService(db)
    health_status = monitoring_service.get_health_status(tenant_id)
    
    return health_status

@router.get("/alerts")
async def get_alerts(
    request: Request,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get alerts for current tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    monitoring_service = MonitoringService(db)
    alerts = monitoring_service.get_alerts(
        tenant_id=tenant_id,
        severity=severity,
        status=status
    )
    
    return alerts

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Acknowledge alert"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    monitoring_service = MonitoringService(db)
    success = monitoring_service.acknowledge_alert(alert_id, tenant_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    return {"message": "Alert acknowledged successfully"}

@router.get("/performance")
async def get_performance_metrics(
    request: Request,
    time_range: str = "1h",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get performance metrics"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    monitoring_service = MonitoringService(db)
    performance = monitoring_service.get_performance_metrics(tenant_id, time_range)
    
    return performance

@router.get("/usage")
async def get_usage_metrics(
    request: Request,
    time_range: str = "1d",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get usage metrics"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    monitoring_service = MonitoringService(db)
    usage = monitoring_service.get_usage_metrics(tenant_id, time_range)
    
    return usage
