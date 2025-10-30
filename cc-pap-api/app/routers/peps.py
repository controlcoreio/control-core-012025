from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import PEP, User, AuditLog, ProtectedResource, BouncerOPALConfiguration
from app.schemas import PEPCreate, PEPUpdate, PEPResponse, BouncerRegistrationRequest
from app.routers.auth import get_current_user
from app.services.opal_distribution import get_opal_distribution_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/peps", tags=["peps"])

@router.post("/register", response_model=PEPResponse)
async def register_bouncer(
    bouncer_data: BouncerRegistrationRequest,
    db: Session = Depends(get_db)
):
    """
    Auto-register bouncer and create protected resource.
    Called by bouncer on startup.
    """
    # Check if bouncer already exists
    existing_bouncer = db.query(PEP).filter(
        PEP.bouncer_id == bouncer_data.bouncer_id
    ).first()
    
    if existing_bouncer:
        # Update existing bouncer
        existing_bouncer.status = "active"
        existing_bouncer.last_health_check = datetime.utcnow()
        existing_bouncer.is_connected = True
        existing_bouncer.intercepting_traffic = True
        existing_bouncer.last_heartbeat = datetime.utcnow()
        db_bouncer = existing_bouncer
    else:
        # Create new bouncer
        db_bouncer = PEP(
            name=bouncer_data.bouncer_name,
            bouncer_id=bouncer_data.bouncer_id,
            deployment_mode=bouncer_data.bouncer_type,
            status="active",
            environment=bouncer_data.deployment_info.environment,
            bouncer_version=bouncer_data.deployment_info.version,
            target_url=bouncer_data.resource.target_host,
            proxy_url=bouncer_data.resource.deployment_url,
            is_connected=True,
            intercepting_traffic=True,
            last_heartbeat=datetime.utcnow()
        )
        db.add(db_bouncer)
        db.flush()  # Get bouncer ID
    
    # Auto-create or update protected resource
    resource_info = bouncer_data.resource
    existing_resource = db.query(ProtectedResource).filter(
        ProtectedResource.bouncer_id == db_bouncer.id
    ).first()
    
    if not existing_resource:
        db_resource = ProtectedResource(
            name=resource_info.name,
            url=resource_info.deployment_url or "",
            original_host=resource_info.target_host,
            original_host_production=resource_info.original_host_url or "",
            default_security_posture=resource_info.default_security_posture,
            environment=bouncer_data.deployment_info.environment,
            auto_discovered=True,
            discovered_at=datetime.utcnow(),
            bouncer_id=db_bouncer.id
        )
        db.add(db_resource)
    
    db.commit()
    db.refresh(db_bouncer)
    
    # INTELLIGENT AUTO-CONFIGURATION
    # Automatically configure OPAL policy distribution for this bouncer
    # This reduces customer configuration work
    opal_service = get_opal_distribution_service(db)
    opal_config = opal_service.auto_configure_bouncer_opal(
        bouncer_id=bouncer_data.bouncer_id,
        environment=bouncer_data.deployment_info.environment,
        resource_name=resource_info.name
    )
    
    logger.info(f"Auto-configured OPAL for bouncer {bouncer_data.bouncer_id}")
    logger.info(f"Policy filters: {opal_config['policy_filters']}")
    logger.info(f"Data filters: {len(opal_config['data_filters'])} data sources")
    
    return db_bouncer

@router.post("/{pep_id}/heartbeat")
async def bouncer_heartbeat(
    pep_id: int,
    intercepting: bool = True,
    db: Session = Depends(get_db)
):
    """Receive heartbeat from bouncer with connection and traffic status."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Update heartbeat and connection status
    current_time = datetime.utcnow()
    pep.last_health_check = current_time
    pep.last_heartbeat = current_time
    pep.status = "active"
    pep.is_connected = True
    pep.intercepting_traffic = intercepting
    db.commit()
    
    return {
        "message": "Heartbeat received",
        "status": "active",
        "is_connected": True,
        "last_heartbeat": current_time.isoformat()
    }

@router.get("/", response_model=List[PEPResponse])
async def get_peps(
    skip: int = 0,
    limit: int = 100,
    environment: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all PEPs (The Bouncer instances) with optional environment filtering."""
    query = db.query(PEP)
    
    if environment:
        query = query.filter(PEP.environment == environment)
    
    peps = query.offset(skip).limit(limit).all()
    return peps

@router.get("/{pep_id}", response_model=PEPResponse)
async def get_pep(
    pep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific PEP (Bouncer) by ID."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    return pep

@router.post("/", response_model=PEPResponse)
async def create_pep(
    pep_data: PEPCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new PEP (Bouncer) instance."""
    db_pep = PEP(
        name=pep_data.name,
        environment=pep_data.environment,
        max_capacity=pep_data.max_capacity
    )
    
    db.add(db_pep)
    db.commit()
    db.refresh(db_pep)
    
    # Log PEP deployment
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Deployed PEP (Bouncer): {db_pep.name}",
        resource=f"PEP #{db_pep.id}",
        resource_type="pep",
        result="success",
        event_type="PEP_DEPLOYED",
        outcome="SUCCESS",
        environment=db_pep.environment
    )
    db.add(audit_log)
    db.commit()
    
    return db_pep

@router.put("/{pep_id}", response_model=PEPResponse)
async def update_pep(
    pep_id: int,
    pep_data: PEPUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing PEP (Bouncer)."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Update fields if provided
    update_data = pep_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pep, field, value)
    
    db.commit()
    db.refresh(pep)
    
    # Log PEP update
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Updated PEP (Bouncer): {pep.name}",
        resource=f"PEP #{pep_id}",
        resource_type="pep",
        result="success",
        event_type="PEP_UPDATED",
        outcome="SUCCESS",
        environment=pep.environment
    )
    db.add(audit_log)
    db.commit()
    
    return pep

@router.delete("/{pep_id}")
async def delete_pep(
    pep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a PEP (Bouncer)."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    pep_name = pep.name
    pep_environment = pep.environment  # Capture before deletion
    
    db.delete(pep)
    db.commit()
    
    # Log PEP deletion
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Deleted PEP (Bouncer): {pep_name}",
        resource=f"PEP #{pep_id}",
        resource_type="pep",
        result="success",
        event_type="PEP_DELETED",
        outcome="SUCCESS",
        environment=pep_environment
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "PEP (Bouncer) deleted successfully"}

@router.post("/{pep_id}/health-check")
async def health_check_pep(
    pep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Perform a health check on a PEP (Bouncer)."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Simulate health check
    import time
    from datetime import datetime
    
    # Simulate response time
    time.sleep(0.1)
    response_time = 45.2
    
    # Update PEP with health check results
    pep.last_health_check = datetime.utcnow()
    pep.response_time = response_time
    pep.status = "active"  # Assume healthy
    pep.current_load = 25.5  # Simulate current load
    
    db.commit()
    
    return {
        "pep_id": pep_id,
        "name": pep.name,
        "status": "healthy",
        "response_time": response_time,
        "current_load": pep.current_load,
        "last_checked": pep.last_health_check,
        "environment": pep.environment
    }

@router.get("/{pep_id}/metrics")
async def get_pep_metrics(
    pep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get metrics for a specific PEP (Bouncer)."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Simulate metrics data
    return {
        "pep_id": pep_id,
        "name": pep.name,
        "environment": pep.environment,
        "metrics": {
            "current_load": pep.current_load,
            "max_capacity": pep.max_capacity,
            "response_time": pep.response_time,
            "status": pep.status,
            "uptime": "99.9%",
            "requests_per_second": 150.5,
            "error_rate": 0.1,
            "policies_loaded": 12,
            "last_policy_sync": "2024-01-15T10:30:00Z"
        },
        "time_range": "24h"
    }

@router.post("/{pep_id}/deploy")
async def deploy_pep(
    pep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deploy a PEP (Bouncer) instance."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Simulate deployment process
    pep.status = "active"
    db.commit()
    
    return {
        "pep_id": pep_id,
        "name": pep.name,
        "status": "deployed",
        "deployment_url": f"https://bouncer-{pep_id}.controlcore.io",
        "environment": pep.environment,
        "deployed_at": "2024-01-15T10:30:00Z"
    }

@router.post("/{pep_id}/sync-policies")
async def sync_policies(
    pep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sync policies to a PEP (Bouncer)."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Simulate policy sync
    return {
        "pep_id": pep_id,
        "name": pep.name,
        "sync_status": "completed",
        "policies_synced": 12,
        "sync_time": "2024-01-15T10:30:00Z",
        "environment": pep.environment
    }

@router.get("/{pep_id}/logs")
async def get_pep_logs(
    pep_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get logs for a specific PEP (Bouncer)."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Simulate log data
    logs = [
        {
            "timestamp": "2024-01-15T10:30:00Z",
            "level": "INFO",
            "message": "Policy evaluation completed",
            "decision": "PERMIT",
            "user": "finance_user",
            "resource": "/financial/records"
        },
        {
            "timestamp": "2024-01-15T10:29:45Z",
            "level": "WARN",
            "message": "High load detected",
            "load_percentage": 85.2,
            "action": "scaling_triggered"
        },
        {
            "timestamp": "2024-01-15T10:29:30Z",
            "level": "INFO",
            "message": "Health check passed",
            "response_time": "45.2ms",
            "status": "healthy"
        }
    ]
    
    return {
        "pep_id": pep_id,
        "name": pep.name,
        "environment": pep.environment,
        "logs": logs[:limit],
        "total_logs": len(logs)
    }


@router.get("/{pep_id}/opal-config")
async def get_bouncer_opal_config(
    pep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get OPAL configuration for a specific bouncer."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Get or create OPAL config for this bouncer
    config = db.query(BouncerOPALConfiguration).filter(
        BouncerOPALConfiguration.bouncer_id == pep.bouncer_id
    ).first()
    
    if not config:
        # Auto-create config using opal_distribution service
        opal_service = get_opal_distribution_service(db)
        config_dict = opal_service.auto_configure_bouncer_opal(
            bouncer_id=pep.bouncer_id,
            environment=pep.environment,
            resource_name=pep.name
        )
        return config_dict
    
    return {
        "bouncer_id": config.bouncer_id,
        "environment": config.environment,
        "cache_enabled": config.cache_enabled,
        "cache_ttl": config.cache_ttl,
        "cache_max_size": config.cache_max_size,
        "rate_limit_rps": config.rate_limit_rps,
        "rate_limit_burst": config.rate_limit_burst,
        "auto_configured": config.auto_configured,
        "resource_name": config.resource_name
    }


@router.put("/{pep_id}/opal-config")
async def update_bouncer_opal_config(
    pep_id: int,
    cache_enabled: bool = None,
    cache_ttl: int = None,
    cache_max_size: str = None,
    rate_limit_rps: int = None,
    rate_limit_burst: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update OPAL configuration for a specific bouncer."""
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Get or create OPAL config
    config = db.query(BouncerOPALConfiguration).filter(
        BouncerOPALConfiguration.bouncer_id == pep.bouncer_id
    ).first()
    
    if not config:
        # Create new config
        config = BouncerOPALConfiguration(
            bouncer_id=pep.bouncer_id,
            environment=pep.environment,
            resource_name=pep.name,
            auto_configured=False
        )
        db.add(config)
    
    # Update provided fields
    if cache_enabled is not None:
        config.cache_enabled = cache_enabled
    if cache_ttl is not None:
        config.cache_ttl = cache_ttl
    if cache_max_size is not None:
        config.cache_max_size = cache_max_size
    if rate_limit_rps is not None:
        config.rate_limit_rps = rate_limit_rps
    if rate_limit_burst is not None:
        config.rate_limit_burst = rate_limit_burst
    
    config.auto_configured = False  # Mark as manually configured
    
    db.commit()
    db.refresh(config)
    
    # Log the update
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Updated OPAL config for bouncer {pep.name}",
        resource=f"bouncer_{pep.bouncer_id}",
        resource_type="pep",
        result="success",
        event_type="OPAL_CONFIG_UPDATED",
        outcome="SUCCESS",
        environment=pep.environment,
        reason=f"OPAL configuration manually updated for {pep.name}"
    )
    db.add(audit_log)
    db.commit()
    
    logger.info(f"OPAL config updated for bouncer {pep.name} by {current_user.username}")
    
    return {
        "message": "OPAL configuration updated successfully",
        "bouncer_id": config.bouncer_id,
        "cache_enabled": config.cache_enabled,
        "cache_ttl": config.cache_ttl,
        "cache_max_size": config.cache_max_size,
        "rate_limit_rps": config.rate_limit_rps,
        "rate_limit_burst": config.rate_limit_burst
    }
