from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Tenant, TenantUser, TenantSubscription
from app.schemas import TenantCreate, TenantResponse, TenantUpdate, TenantUserResponse
from app.routers.auth import get_current_user
from app.services.tenant_service import TenantService
from app.services.stripe_service import StripeService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[TenantResponse])
async def get_tenants(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all tenants (admin only)"""
    tenant_service = TenantService(db)
    tenants = tenant_service.get_tenants(skip=skip, limit=limit)
    return tenants

@router.get("/my", response_model=TenantResponse)
async def get_my_tenant(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get current user's tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID not found in request"
        )
    
    tenant_service = TenantService(db)
    tenant = tenant_service.get_tenant_by_id(tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return tenant

@router.post("/", response_model=TenantResponse)
async def create_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new tenant"""
    tenant_service = TenantService(db)
    
    # Check if user already has a tenant
    existing_tenant = tenant_service.get_tenant_by_user_id(current_user.id)
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a tenant"
        )
    
    # Create tenant
    tenant = tenant_service.create_tenant(
        name=tenant_data.name,
        domain=tenant_data.domain,
        subdomain=tenant_data.subdomain,
        plan_type=tenant_data.plan_type,
        user_id=current_user.id
    )
    
    # Create Stripe customer and subscription
    stripe_service = StripeService()
    stripe_customer = stripe_service.create_customer(
        email=current_user.email,
        name=current_user.name,
        metadata={"tenant_id": tenant.id}
    )
    
    # Create subscription
    subscription = stripe_service.create_subscription(
        customer_id=stripe_customer.id,
        price_id=tenant_data.stripe_price_id
    )
    
    # Update tenant with Stripe information
    tenant_service.update_tenant_stripe_info(
        tenant_id=tenant.id,
        stripe_customer_id=stripe_customer.id,
        stripe_subscription_id=subscription.id
    )
    
    return tenant

@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    tenant_data: TenantUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update tenant"""
    tenant_service = TenantService(db)
    
    # Check if user has access to this tenant
    tenant = tenant_service.get_tenant_by_id(tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if user is admin of this tenant
    if not tenant_service.is_user_admin(tenant_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update tenant
    updated_tenant = tenant_service.update_tenant(tenant_id, tenant_data)
    return updated_tenant

@router.delete("/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete tenant"""
    tenant_service = TenantService(db)
    
    # Check if user has access to this tenant
    tenant = tenant_service.get_tenant_by_id(tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if user is admin of this tenant
    if not tenant_service.is_user_admin(tenant_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Cancel Stripe subscription
    stripe_service = StripeService()
    if tenant.stripe_subscription_id:
        stripe_service.cancel_subscription(tenant.stripe_subscription_id)
    
    # Delete tenant
    tenant_service.delete_tenant(tenant_id)
    
    return {"message": "Tenant deleted successfully"}

@router.get("/{tenant_id}/users", response_model=List[TenantUserResponse])
async def get_tenant_users(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get tenant users"""
    tenant_service = TenantService(db)
    
    # Check if user has access to this tenant
    if not tenant_service.is_user_member(tenant_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    users = tenant_service.get_tenant_users(tenant_id)
    return users

@router.post("/{tenant_id}/users")
async def add_tenant_user(
    tenant_id: str,
    user_email: str,
    role: str = "user",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add user to tenant"""
    tenant_service = TenantService(db)
    
    # Check if user is admin of this tenant
    if not tenant_service.is_user_admin(tenant_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Add user to tenant
    user = tenant_service.add_tenant_user(
        tenant_id=tenant_id,
        user_email=user_email,
        role=role
    )
    
    return {"message": "User added to tenant successfully", "user": user}

@router.delete("/{tenant_id}/users/{user_id}")
async def remove_tenant_user(
    tenant_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Remove user from tenant"""
    tenant_service = TenantService(db)
    
    # Check if user is admin of this tenant
    if not tenant_service.is_user_admin(tenant_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Remove user from tenant
    tenant_service.remove_tenant_user(tenant_id, user_id)
    
    return {"message": "User removed from tenant successfully"}

@router.get("/{tenant_id}/subscription")
async def get_tenant_subscription(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get tenant subscription information"""
    tenant_service = TenantService(db)
    
    # Check if user has access to this tenant
    if not tenant_service.is_user_member(tenant_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    subscription = tenant_service.get_tenant_subscription(tenant_id)
    return subscription

@router.post("/{tenant_id}/subscription/upgrade")
async def upgrade_tenant_subscription(
    tenant_id: str,
    new_plan: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upgrade tenant subscription"""
    tenant_service = TenantService(db)
    
    # Check if user is admin of this tenant
    if not tenant_service.is_user_admin(tenant_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Upgrade subscription
    stripe_service = StripeService()
    subscription = stripe_service.upgrade_subscription(
        tenant_id=tenant_id,
        new_plan=new_plan
    )
    
    return {"message": "Subscription upgraded successfully", "subscription": subscription}
