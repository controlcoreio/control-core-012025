from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import TenantResource
from app.schemas import ResourceCreate, ResourceUpdate, ResourceResponse
from app.routers.auth import get_current_user
from app.services.resource_service import ResourceService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[ResourceResponse])
async def get_resources(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    resource_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get resources for current tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    resource_service = ResourceService(db)
    resources = resource_service.get_resources(
        tenant_id=tenant_id,
        skip=skip,
        limit=limit,
        resource_type=resource_type
    )
    
    return resources

@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get specific resource"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    resource_service = ResourceService(db)
    resource = resource_service.get_resource_by_id(resource_id, tenant_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return resource

@router.post("/", response_model=ResourceResponse)
async def create_resource(
    resource_data: ResourceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new resource"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    resource_service = ResourceService(db)
    resource = resource_service.create_resource(
        tenant_id=tenant_id,
        resource_data=resource_data
    )
    
    return resource

@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: str,
    resource_data: ResourceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update resource"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    resource_service = ResourceService(db)
    resource = resource_service.update_resource(
        resource_id=resource_id,
        tenant_id=tenant_id,
        resource_data=resource_data
    )
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return resource

@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete resource"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    resource_service = ResourceService(db)
    success = resource_service.delete_resource(resource_id, tenant_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return {"message": "Resource deleted successfully"}

@router.post("/{resource_id}/test")
async def test_resource(
    resource_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Test resource connectivity"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    resource_service = ResourceService(db)
    test_result = resource_service.test_resource(resource_id, tenant_id)
    
    return test_result

@router.post("/{resource_id}/enable")
async def enable_resource(
    resource_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Enable resource protection"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    resource_service = ResourceService(db)
    resource = resource_service.enable_resource(resource_id, tenant_id)
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return {"message": "Resource protection enabled", "resource": resource}

@router.post("/{resource_id}/disable")
async def disable_resource(
    resource_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Disable resource protection"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    resource_service = ResourceService(db)
    resource = resource_service.disable_resource(resource_id, tenant_id)
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return {"message": "Resource protection disabled", "resource": resource}
