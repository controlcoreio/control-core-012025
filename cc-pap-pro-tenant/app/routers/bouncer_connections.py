from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.routers.auth import get_current_user
from app.services.bouncer_connection_service import BouncerConnectionService
from app.schemas import BouncerConnectionCreate, BouncerConnectionUpdate, BouncerConnectionResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[BouncerConnectionResponse])
async def get_bouncer_connections(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get bouncer connections for current tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    connections = connection_service.get_bouncer_connections(
        tenant_id=tenant_id,
        skip=skip,
        limit=limit,
        status=status
    )
    
    return connections

@router.get("/{connection_id}", response_model=BouncerConnectionResponse)
async def get_bouncer_connection(
    connection_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get specific bouncer connection"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    connection = connection_service.get_bouncer_connection_by_id(connection_id, tenant_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer connection not found"
        )
    
    return connection

@router.post("/", response_model=BouncerConnectionResponse)
async def create_bouncer_connection(
    connection_data: BouncerConnectionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new bouncer connection"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    connection = connection_service.create_bouncer_connection(
        tenant_id=tenant_id,
        connection_data=connection_data
    )
    
    return connection

@router.put("/{connection_id}", response_model=BouncerConnectionResponse)
async def update_bouncer_connection(
    connection_id: str,
    connection_data: BouncerConnectionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update bouncer connection"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    connection = connection_service.update_bouncer_connection(
        connection_id=connection_id,
        tenant_id=tenant_id,
        connection_data=connection_data
    )
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer connection not found"
        )
    
    return connection

@router.delete("/{connection_id}")
async def delete_bouncer_connection(
    connection_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete bouncer connection"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    success = connection_service.delete_bouncer_connection(connection_id, tenant_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bouncer connection not found"
        )
    
    return {"message": "Bouncer connection deleted successfully"}

@router.post("/{connection_id}/test")
async def test_bouncer_connection(
    connection_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Test bouncer connection"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    test_result = connection_service.test_bouncer_connection(connection_id, tenant_id)
    
    return test_result

@router.post("/{connection_id}/sync")
async def sync_bouncer_connection(
    connection_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Sync bouncer connection"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    sync_result = connection_service.sync_bouncer_connection(connection_id, tenant_id)
    
    return sync_result

@router.get("/{connection_id}/certificates")
async def get_bouncer_certificates(
    connection_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get bouncer connection certificates"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    certificates = connection_service.get_bouncer_certificates(connection_id, tenant_id)
    
    return certificates

@router.post("/{connection_id}/certificates")
async def upload_bouncer_certificate(
    connection_id: str,
    certificate_data: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload bouncer connection certificate"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    certificate = connection_service.upload_bouncer_certificate(
        connection_id, tenant_id, certificate_data
    )
    
    return certificate

@router.get("/{connection_id}/metrics")
async def get_bouncer_metrics(
    connection_id: str,
    request: Request,
    time_range: str = "1h",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get bouncer connection metrics"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    metrics = connection_service.get_bouncer_metrics(connection_id, tenant_id, time_range)
    
    return metrics

@router.get("/{connection_id}/logs")
async def get_bouncer_logs(
    connection_id: str,
    request: Request,
    skip: int = 0,
    limit: int = 100,
    level: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get bouncer connection logs"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    connection_service = BouncerConnectionService(db)
    logs = connection_service.get_bouncer_logs(
        connection_id, tenant_id, skip, limit, level, start_time, end_time
    )
    
    return logs
