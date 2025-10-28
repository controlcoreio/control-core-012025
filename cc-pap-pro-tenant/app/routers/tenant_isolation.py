from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from app.database import get_db
from app.routers.auth import get_current_user
from app.services.tenant_isolation_service import TenantIsolationService
from app.schemas import TenantResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/setup")
async def setup_tenant_isolation(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Setup tenant isolation infrastructure"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    # Get tenant
    from app.models import Tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Setup tenant isolation
    isolation_service = TenantIsolationService(db)
    isolation_config = isolation_service.create_tenant_isolation(tenant)
    
    return {
        "message": "Tenant isolation setup completed successfully",
        "tenant_id": tenant_id,
        "isolation_config": isolation_config
    }

@router.get("/status")
async def get_tenant_isolation_status(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get tenant isolation status"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    # Get tenant
    from app.models import Tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Get isolation status
    isolation_config = tenant.config.get("isolation", {})
    
    return {
        "tenant_id": tenant_id,
        "isolation_enabled": bool(isolation_config),
        "isolation_level": isolation_config.get("isolation_level", "none"),
        "database_schema": isolation_config.get("database_schema", {}),
        "redis_namespace": isolation_config.get("redis_namespace", {}),
        "s3_prefix": isolation_config.get("s3_prefix", {}),
        "network_config": isolation_config.get("network_config", {}),
        "security_config": isolation_config.get("security_config", {}),
        "monitoring_config": isolation_config.get("monitoring_config", {})
    }

@router.get("/limits")
async def get_tenant_limits(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get tenant resource limits"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    isolation_service = TenantIsolationService(db)
    limits = isolation_service.get_tenant_limits(tenant_id)
    
    return {
        "tenant_id": tenant_id,
        "limits": limits,
        "usage": {
            "policies": isolation_service._get_current_usage(tenant_id, "policies"),
            "resources": isolation_service._get_current_usage(tenant_id, "resources"),
            "bouncers": isolation_service._get_current_usage(tenant_id, "bouncers"),
            "users": isolation_service._get_current_usage(tenant_id, "users")
        }
    }

@router.post("/validate-access")
async def validate_tenant_access(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Validate user access to tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    isolation_service = TenantIsolationService(db)
    has_access = isolation_service.validate_tenant_access(tenant_id, user_id)
    
    return {
        "tenant_id": tenant_id,
        "user_id": user_id,
        "has_access": has_access
    }

@router.get("/health")
async def get_tenant_health(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get tenant health status"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    # Get tenant health status
    from app.models import Tenant, TenantPolicy, TenantResource, TenantBouncer
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Get resource counts
    policies_count = db.query(TenantPolicy).filter(TenantPolicy.tenant_id == tenant_id).count()
    resources_count = db.query(TenantResource).filter(TenantResource.tenant_id == tenant_id).count()
    bouncers_count = db.query(TenantBouncer).filter(TenantBouncer.tenant_id == tenant_id).count()
    
    # Get active bouncers
    active_bouncers = db.query(TenantBouncer).filter(
        TenantBouncer.tenant_id == tenant_id,
        TenantBouncer.status == "active"
    ).count()
    
    return {
        "tenant_id": tenant_id,
        "status": "healthy",
        "resources": {
            "policies": policies_count,
            "resources": resources_count,
            "bouncers": bouncers_count,
            "active_bouncers": active_bouncers
        },
        "isolation": {
            "enabled": bool(tenant.config.get("isolation")),
            "level": tenant.config.get("isolation", {}).get("isolation_level", "none")
        },
        "timestamp": "2024-01-15T10:30:00Z"
    }

@router.post("/cleanup")
async def cleanup_tenant_isolation(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cleanup tenant isolation infrastructure"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    isolation_service = TenantIsolationService(db)
    success = isolation_service.cleanup_tenant_isolation(tenant_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup tenant isolation"
        )
    
    return {
        "message": "Tenant isolation cleanup completed successfully",
        "tenant_id": tenant_id
    }

@router.get("/metrics")
async def get_tenant_metrics(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get tenant isolation metrics"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    # Get tenant metrics
    from app.models import Tenant, TenantMetrics
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Get recent metrics
    recent_metrics = db.query(TenantMetrics).filter(
        TenantMetrics.tenant_id == tenant_id
    ).order_by(TenantMetrics.timestamp.desc()).limit(100).all()
    
    # Group metrics by type
    metrics_by_type = {}
    for metric in recent_metrics:
        metric_type = metric.metric_type
        if metric_type not in metrics_by_type:
            metrics_by_type[metric_type] = []
        metrics_by_type[metric_type].append({
            "name": metric.metric_name,
            "value": metric.metric_value,
            "labels": metric.labels,
            "timestamp": metric.timestamp.isoformat()
        })
    
    return {
        "tenant_id": tenant_id,
        "metrics": metrics_by_type,
        "total_metrics": len(recent_metrics)
    }

@router.get("/config")
async def get_tenant_config(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get tenant configuration"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    # Get tenant
    from app.models import Tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return {
        "tenant_id": tenant_id,
        "config": tenant.config,
        "limits": tenant.limits,
        "plan_type": tenant.plan_type,
        "status": tenant.status
    }
