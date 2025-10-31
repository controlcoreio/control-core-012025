from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import PEP, User, AuditLog, ProtectedResource, BouncerOPALConfiguration
from app.schemas import PEPCreate, PEPUpdate, PEPResponse, BouncerRegistrationRequest, BouncerOPALConfigUpdate
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
    """Trigger bouncer to sync policies from GitHub.
    
    This sends a signal to the bouncer's OPAL Server to pull from its GitHub folder.
    The bouncer has OPAL Server built-in that watches its specific folder.
    """
    from datetime import datetime
    from app.models import BouncerSyncHistory, BouncerOPALConfiguration
    import httpx
    
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Get bouncer's OPAL configuration
    opal_config = db.query(BouncerOPALConfiguration).filter(
        BouncerOPALConfiguration.bouncer_id == pep.bouncer_id
    ).first()
    
    if not opal_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bouncer OPAL configuration not found - bouncer may not be properly registered"
        )
    
    # Call bouncer's OPAL management endpoint to trigger sync
    sync_triggered = False
    sync_error = None
    
    if pep.proxy_url:
        try:
            # Bouncer should have OPAL management API at /opal/sync
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{pep.proxy_url}/opal/sync",
                    headers={
                        "Authorization": f"Bearer {pep.api_key or 'default-key'}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    sync_triggered = True
                    logger.info(f"Successfully triggered sync for bouncer {pep.bouncer_id}")
                else:
                    sync_error = f"Bouncer returned status {response.status_code}"
                    logger.warning(f"Bouncer sync trigger failed: {sync_error}")
                    
        except Exception as e:
            sync_error = str(e)
            logger.error(f"Failed to trigger bouncer sync: {e}")
    else:
        sync_error = "Bouncer proxy URL not configured"
        logger.warning(f"Cannot trigger sync for {pep.bouncer_id}: {sync_error}")
    
    # Record sync history
    sync_history = BouncerSyncHistory(
        bouncer_id=pep.bouncer_id,
        sync_type="manual",
        status="triggered" if sync_triggered else "failed",
        triggered_by=current_user.username,
        error_message=sync_error
    )
    db.add(sync_history)
    
    # Update OPAL config status
    if sync_triggered:
        opal_config.last_sync_time = datetime.utcnow()
        opal_config.last_sync_status = "in_progress"
    else:
        opal_config.last_sync_status = "failed"
        opal_config.last_sync_error = sync_error
    
    db.commit()
    
    # Audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Triggered policy sync for bouncer {pep.name}",
        resource=f"Bouncer #{pep.id}",
        resource_type="bouncer",
        result="success" if sync_triggered else "failed",
        event_type="CONFIG_CHANGE",
        outcome="SUCCESS" if sync_triggered else "FAILURE",
        environment=pep.environment,
        reason=f"Manual sync triggered for {pep.name}" + (f" - {sync_error}" if sync_error else "")
    )
    db.add(audit_log)
    db.commit()
    
    if sync_triggered:
        return {
            "success": True,
            "pep_id": pep_id,
            "name": pep.name,
            "sync_status": "triggered",
            "message": "Bouncer's OPAL Server will pull policies from GitHub",
            "environment": pep.environment,
            "folder_path": opal_config.folder_path
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger sync: {sync_error}"
        )

@router.get("/{pep_id}/sync-status")
async def get_bouncer_sync_status(
    pep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current GitHub sync status for a bouncer."""
    from app.models import BouncerOPALConfiguration
    
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    opal_config = db.query(BouncerOPALConfiguration).filter(
        BouncerOPALConfiguration.bouncer_id == pep.bouncer_id
    ).first()
    
    if not opal_config:
        return {
            "bouncer_id": pep.bouncer_id,
            "configured": False,
            "message": "Bouncer OPAL not configured"
        }
    
    return {
        "bouncer_id": pep.bouncer_id,
        "bouncer_name": pep.name,
        "configured": True,
        "folder_path": opal_config.folder_path,
        "last_sync_time": opal_config.last_sync_time.isoformat() if opal_config.last_sync_time else None,
        "last_sync_status": opal_config.last_sync_status,
        "last_sync_error": opal_config.last_sync_error,
        "policies_count": opal_config.policies_count,
        "next_sync_time": opal_config.next_sync_time.isoformat() if opal_config.next_sync_time else None,
        "polling_interval": opal_config.polling_interval,
        "webhook_enabled": opal_config.webhook_enabled,
        "use_tenant_default": opal_config.use_tenant_default
    }


@router.get("/{pep_id}/sync-history")
async def get_bouncer_sync_history(
    pep_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sync history for a bouncer."""
    from app.models import BouncerSyncHistory
    
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP (Bouncer) not found"
        )
    
    # Get sync history records
    history = db.query(BouncerSyncHistory).filter(
        BouncerSyncHistory.bouncer_id == pep.bouncer_id
    ).order_by(
        BouncerSyncHistory.sync_time.desc()
    ).limit(limit).all()
    
    return {
        "bouncer_id": pep.bouncer_id,
        "bouncer_name": pep.name,
        "total_records": len(history),
        "history": [
            {
                "id": h.id,
                "sync_time": h.sync_time.isoformat() if h.sync_time else None,
                "sync_type": h.sync_type,
                "status": h.status,
                "policies_synced": h.policies_synced,
                "policies_added": h.policies_added,
                "policies_updated": h.policies_updated,
                "policies_deleted": h.policies_deleted,
                "error_message": h.error_message,
                "duration_ms": h.duration_ms,
                "triggered_by": h.triggered_by,
                "commit_sha": h.commit_sha
            }
            for h in history
        ]
    }


@router.post("/sync-all")
async def sync_all_bouncers(
    environment: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trigger sync for all active bouncers (or filtered by environment).
    
    This is useful for bulk operations like "sync all sandbox bouncers"
    after making configuration changes.
    """
    from app.models import BouncerSyncHistory, BouncerOPALConfiguration
    import httpx
    from datetime import datetime
    
    # Get all active bouncers
    query = db.query(PEP).filter(PEP.status == "active")
    if environment:
        query = query.filter(PEP.environment == environment)
    
    bouncers = query.all()
    
    results = []
    success_count = 0
    failed_count = 0
    
    for pep in bouncers:
        try:
            # Get OPAL config
            opal_config = db.query(BouncerOPALConfiguration).filter(
                BouncerOPALConfiguration.bouncer_id == pep.bouncer_id
            ).first()
            
            if not opal_config:
                results.append({
                    "bouncer_id": pep.bouncer_id,
                    "success": False,
                    "error": "OPAL not configured"
                })
                failed_count += 1
                continue
            
            # Trigger sync
            sync_triggered = False
            sync_error = None
            
            if pep.proxy_url:
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.post(
                            f"{pep.proxy_url}/opal/sync",
                            headers={
                                "Authorization": f"Bearer {pep.api_key or 'default-key'}",
                                "Content-Type": "application/json"
                            }
                        )
                        sync_triggered = response.status_code == 200
                        if not sync_triggered:
                            sync_error = f"Status {response.status_code}"
                except Exception as e:
                    sync_error = str(e)
            else:
                sync_error = "Proxy URL not configured"
            
            # Record sync history
            sync_history = BouncerSyncHistory(
                bouncer_id=pep.bouncer_id,
                sync_type="manual",
                status="triggered" if sync_triggered else "failed",
                triggered_by=current_user.username,
                error_message=sync_error
            )
            db.add(sync_history)
            
            # Update OPAL config
            if sync_triggered:
                opal_config.last_sync_time = datetime.utcnow()
                opal_config.last_sync_status = "in_progress"
                success_count += 1
            else:
                opal_config.last_sync_status = "failed"
                opal_config.last_sync_error = sync_error
                failed_count += 1
            
            results.append({
                "bouncer_id": pep.bouncer_id,
                "bouncer_name": pep.name,
                "success": sync_triggered,
                "error": sync_error
            })
            
        except Exception as e:
            logger.error(f"Error syncing bouncer {pep.bouncer_id}: {e}")
            results.append({
                "bouncer_id": pep.bouncer_id,
                "success": False,
                "error": str(e)
            })
            failed_count += 1
    
    db.commit()
    
    # Audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Bulk sync triggered for {len(bouncers)} bouncers",
        resource="bulk_sync",
        resource_type="system",
        result="success" if failed_count == 0 else "partial",
        event_type="CONFIG_CHANGE",
        outcome="SUCCESS" if failed_count == 0 else "PARTIAL",
        environment=environment or "all",
        reason=f"Bulk sync: {success_count} succeeded, {failed_count} failed"
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "total_bouncers": len(bouncers),
        "success_count": success_count,
        "failed_count": failed_count,
        "environment": environment or "all",
        "results": results
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
    config_update: BouncerOPALConfigUpdate,
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
    if config_update.cache_enabled is not None:
        config.cache_enabled = config_update.cache_enabled
    if config_update.cache_ttl is not None:
        config.cache_ttl = config_update.cache_ttl
    if config_update.cache_max_size is not None:
        config.cache_max_size = config_update.cache_max_size
    if config_update.rate_limit_rps is not None:
        config.rate_limit_rps = config_update.rate_limit_rps
    if config_update.rate_limit_burst is not None:
        config.rate_limit_burst = config_update.rate_limit_burst
    
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
