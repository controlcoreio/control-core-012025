from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import TenantPolicy
from app.schemas import PolicyCreate, PolicyUpdate, PolicyResponse
from app.routers.auth import get_current_user
from app.services.policy_service import PolicyService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[PolicyResponse])
async def get_policies(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get policies for current tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    policy_service = PolicyService(db)
    policies = policy_service.get_policies(
        tenant_id=tenant_id,
        skip=skip,
        limit=limit,
        status=status,
        category=category
    )
    
    return policies

@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get specific policy"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    policy_service = PolicyService(db)
    policy = policy_service.get_policy_by_id(policy_id, tenant_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    return policy

@router.post("/", response_model=PolicyResponse)
async def create_policy(
    policy_data: PolicyCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new policy"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    policy_service = PolicyService(db)
    policy = policy_service.create_policy(
        tenant_id=tenant_id,
        policy_data=policy_data,
        created_by=current_user.id
    )
    
    return policy

@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: str,
    policy_data: PolicyUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update policy"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    policy_service = PolicyService(db)
    policy = policy_service.update_policy(
        policy_id=policy_id,
        tenant_id=tenant_id,
        policy_data=policy_data
    )
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    return policy

@router.delete("/{policy_id}")
async def delete_policy(
    policy_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete policy"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    policy_service = PolicyService(db)
    success = policy_service.delete_policy(policy_id, tenant_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    return {"message": "Policy deleted successfully"}

@router.post("/{policy_id}/activate")
async def activate_policy(
    policy_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Activate policy"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    policy_service = PolicyService(db)
    policy = policy_service.activate_policy(policy_id, tenant_id)
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    return {"message": "Policy activated successfully", "policy": policy}

@router.post("/{policy_id}/deactivate")
async def deactivate_policy(
    policy_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Deactivate policy"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    policy_service = PolicyService(db)
    policy = policy_service.deactivate_policy(policy_id, tenant_id)
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    return {"message": "Policy deactivated successfully", "policy": policy}

@router.post("/{policy_id}/validate")
async def validate_policy(
    policy_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Validate policy syntax"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    policy_service = PolicyService(db)
    validation_result = policy_service.validate_policy(policy_id, tenant_id)
    
    return validation_result

@router.get("/{policy_id}/versions")
async def get_policy_versions(
    policy_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get policy version history"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    policy_service = PolicyService(db)
    versions = policy_service.get_policy_versions(policy_id, tenant_id)
    
    return versions
