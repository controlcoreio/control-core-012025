from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import TenantBouncer
from app.schemas import BouncerCreate, BouncerUpdate, BouncerResponse
from app.routers.auth import get_current_user
from app.services.bouncer_service import BouncerService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[BouncerResponse])
async def get_bouncers(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get bouncers for current tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    bouncer_service = BouncerService(db)
    bouncers = bouncer_service.get_bouncers(
        tenant_id=tenant_id,
        skip=skip,
        limit=limit,
        status=status
    )
    
    return bouncers

@router.get("/{bouncer_id}", response_model=BouncerResponse)
async def get_bouncer(
    bouncer_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get specific bouncer"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    bouncer_service = BouncerService(db)
    bouncer = bouncer_service.get_bouncer_by_id(bouncer_id, tenant_id)
    if not bouncer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer not found"
        )
    
    return bouncer

@router.post("/", response_model=BouncerResponse)
async def create_bouncer(
    bouncer_data: BouncerCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new bouncer"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    bouncer_service = BouncerService(db)
    bouncer = bouncer_service.create_bouncer(
        tenant_id=tenant_id,
        bouncer_data=bouncer_data
    )
    
    return bouncer

@router.put("/{bouncer_id}", response_model=BouncerResponse)
async def update_bouncer(
    bouncer_id: str,
    bouncer_data: BouncerUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update bouncer"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    bouncer_service = BouncerService(db)
    bouncer = bouncer_service.update_bouncer(
        bouncer_id=bouncer_id,
        tenant_id=tenant_id,
        bouncer_data=bouncer_data
    )
    
    if not bouncer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer not found"
        )
    
    return bouncer

@router.delete("/{bouncer_id}")
async def delete_bouncer(
    bouncer_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete bouncer"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    bouncer_service = BouncerService(db)
    success = bouncer_service.delete_bouncer(bouncer_id, tenant_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer not found"
        )
    
    return {"message": "Bouncer deleted successfully"}

@router.post("/{bouncer_id}/start")
async def start_bouncer(
    bouncer_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Start bouncer"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    bouncer_service = BouncerService(db)
    bouncer = bouncer_service.start_bouncer(bouncer_id, tenant_id)
    
    if not bouncer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer not found"
        )
    
    return {"message": "Bouncer started successfully", "bouncer": bouncer}

@router.post("/{bouncer_id}/stop")
async def stop_bouncer(
    bouncer_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Stop bouncer"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    bouncer_service = BouncerService(db)
    bouncer = bouncer_service.stop_bouncer(bouncer_id, tenant_id)
    
    if not bouncer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer not found"
        )
    
    return {"message": "Bouncer stopped successfully", "bouncer": bouncer}

@router.post("/{bouncer_id}/restart")
async def restart_bouncer(
    bouncer_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Restart bouncer"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    bouncer_service = BouncerService(db)
    bouncer = bouncer_service.restart_bouncer(bouncer_id, tenant_id)
    
    if not bouncer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer not found"
        )
    
    return {"message": "Bouncer restarted successfully", "bouncer": bouncer}

@router.get("/{bouncer_id}/status")
async def get_bouncer_status(
    bouncer_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get bouncer status"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    bouncer_service = BouncerService(db)
    status = bouncer_service.get_bouncer_status(bouncer_id, tenant_id)
    
    if not status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer not found"
        )
    
    return status

@router.post("/{bouncer_id}/sync")
async def sync_bouncer(
    bouncer_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Sync bouncer with policies"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    bouncer_service = BouncerService(db)
    sync_result = bouncer_service.sync_bouncer(bouncer_id, tenant_id)
    
    if not sync_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer not found"
        )
    
    return {"message": "Bouncer synced successfully", "result": sync_result}
