from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models import Tenant, TenantUser, TenantSubscription, TenantPolicy, TenantResource, TenantBouncer
from app.schemas import TenantCreate, TenantUpdate, TenantUserCreate
from typing import List, Optional
import uuid
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class TenantService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_tenant(self, name: str, domain: str, subdomain: str, plan_type: str, user_id: str) -> Tenant:
        """Create a new tenant"""
        try:
            tenant = Tenant(
                id=str(uuid.uuid4()),
                name=name,
                domain=domain,
                subdomain=subdomain,
                plan_type=plan_type,
                status="pending",
                config=self._get_default_config(plan_type),
                limits=self._get_default_limits(plan_type)
            )
            
            self.db.add(tenant)
            self.db.commit()
            self.db.refresh(tenant)
            
            # Add the creator as admin user
            self.add_tenant_user(tenant.id, user_id, "admin")
            
            logger.info(f"Created tenant {tenant.id} for user {user_id}")
            return tenant
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating tenant: {e}")
            raise
    
    def get_tenant_by_id(self, tenant_id: str) -> Optional[Tenant]:
        """Get tenant by ID"""
        return self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    def get_tenant_by_domain(self, domain: str) -> Optional[Tenant]:
        """Get tenant by domain"""
        return self.db.query(Tenant).filter(Tenant.domain == domain).first()
    
    def get_tenant_by_subdomain(self, subdomain: str) -> Optional[Tenant]:
        """Get tenant by subdomain"""
        return self.db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    
    def get_tenant_by_user_id(self, user_id: str) -> Optional[Tenant]:
        """Get tenant by user ID"""
        tenant_user = self.db.query(TenantUser).filter(
            and_(
                TenantUser.user_id == user_id,
                TenantUser.is_active == True
            )
        ).first()
        
        if tenant_user:
            return self.get_tenant_by_id(tenant_user.tenant_id)
        return None
    
    def get_tenants(self, skip: int = 0, limit: int = 100) -> List[Tenant]:
        """Get all tenants with pagination"""
        return self.db.query(Tenant).offset(skip).limit(limit).all()
    
    def update_tenant(self, tenant_id: str, tenant_data: TenantUpdate) -> Optional[Tenant]:
        """Update tenant"""
        try:
            tenant = self.get_tenant_by_id(tenant_id)
            if not tenant:
                return None
            
            update_data = tenant_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(tenant, field, value)
            
            tenant.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(tenant)
            
            logger.info(f"Updated tenant {tenant_id}")
            return tenant
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating tenant: {e}")
            raise
    
    def delete_tenant(self, tenant_id: str) -> bool:
        """Delete tenant"""
        try:
            tenant = self.get_tenant_by_id(tenant_id)
            if not tenant:
                return False
            
            # Delete related data
            self.db.query(TenantUser).filter(TenantUser.tenant_id == tenant_id).delete()
            self.db.query(TenantPolicy).filter(TenantPolicy.tenant_id == tenant_id).delete()
            self.db.query(TenantResource).filter(TenantResource.tenant_id == tenant_id).delete()
            self.db.query(TenantBouncer).filter(TenantBouncer.tenant_id == tenant_id).delete()
            
            # Delete tenant
            self.db.delete(tenant)
            self.db.commit()
            
            logger.info(f"Deleted tenant {tenant_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting tenant: {e}")
            raise
    
    def add_tenant_user(self, tenant_id: str, user_email: str, role: str = "user") -> Optional[TenantUser]:
        """Add user to tenant"""
        try:
            # Check if user already exists in tenant
            existing_user = self.db.query(TenantUser).filter(
                and_(
                    TenantUser.tenant_id == tenant_id,
                    TenantUser.email == user_email
                )
            ).first()
            
            if existing_user:
                return existing_user
            
            tenant_user = TenantUser(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                user_id=str(uuid.uuid4()),  # This would be the actual user ID from Auth0
                email=user_email,
                name=user_email.split("@")[0],  # Use email prefix as name
                role=role,
                is_active=True
            )
            
            self.db.add(tenant_user)
            self.db.commit()
            self.db.refresh(tenant_user)
            
            logger.info(f"Added user {user_email} to tenant {tenant_id}")
            return tenant_user
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding tenant user: {e}")
            raise
    
    def remove_tenant_user(self, tenant_id: str, user_id: str) -> bool:
        """Remove user from tenant"""
        try:
            tenant_user = self.db.query(TenantUser).filter(
                and_(
                    TenantUser.tenant_id == tenant_id,
                    TenantUser.user_id == user_id
                )
            ).first()
            
            if not tenant_user:
                return False
            
            self.db.delete(tenant_user)
            self.db.commit()
            
            logger.info(f"Removed user {user_id} from tenant {tenant_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing tenant user: {e}")
            raise
    
    def get_tenant_users(self, tenant_id: str) -> List[TenantUser]:
        """Get all users for a tenant"""
        return self.db.query(TenantUser).filter(
            and_(
                TenantUser.tenant_id == tenant_id,
                TenantUser.is_active == True
            )
        ).all()
    
    def is_user_member(self, tenant_id: str, user_id: str) -> bool:
        """Check if user is a member of the tenant"""
        tenant_user = self.db.query(TenantUser).filter(
            and_(
                TenantUser.tenant_id == tenant_id,
                TenantUser.user_id == user_id,
                TenantUser.is_active == True
            )
        ).first()
        
        return tenant_user is not None
    
    def is_user_admin(self, tenant_id: str, user_id: str) -> bool:
        """Check if user is an admin of the tenant"""
        tenant_user = self.db.query(TenantUser).filter(
            and_(
                TenantUser.tenant_id == tenant_id,
                TenantUser.user_id == user_id,
                TenantUser.role == "admin",
                TenantUser.is_active == True
            )
        ).first()
        
        return tenant_user is not None
    
    def update_tenant_stripe_info(self, tenant_id: str, stripe_customer_id: str, stripe_subscription_id: str):
        """Update tenant with Stripe information"""
        try:
            tenant = self.get_tenant_by_id(tenant_id)
            if not tenant:
                return False
            
            # Create or update subscription record
            subscription = self.db.query(TenantSubscription).filter(
                TenantSubscription.tenant_id == tenant_id
            ).first()
            
            if not subscription:
                subscription = TenantSubscription(
                    id=str(uuid.uuid4()),
                    tenant_id=tenant_id,
                    plan_type=tenant.plan_type,
                    status="active"
                )
                self.db.add(subscription)
            
            subscription.stripe_customer_id = stripe_customer_id
            subscription.stripe_subscription_id = stripe_subscription_id
            subscription.current_period_start = datetime.utcnow()
            subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
            
            # Update tenant status
            tenant.status = "active"
            tenant.updated_at = datetime.utcnow()
            
            self.db.commit()
            
            logger.info(f"Updated Stripe info for tenant {tenant_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating tenant Stripe info: {e}")
            raise
    
    def get_tenant_subscription(self, tenant_id: str) -> Optional[TenantSubscription]:
        """Get tenant subscription information"""
        return self.db.query(TenantSubscription).filter(
            TenantSubscription.tenant_id == tenant_id
        ).first()
    
    def _get_default_config(self, plan_type: str) -> dict:
        """Get default configuration for plan type"""
        if plan_type == "pro":
            return {
                "max_policies": 100,
                "max_resources": 50,
                "max_bouncers": 5,
                "max_users": 10,
                "features": ["basic_monitoring", "email_support"]
            }
        elif plan_type == "custom":
            return {
                "max_policies": 1000,
                "max_resources": 500,
                "max_bouncers": 50,
                "max_users": 100,
                "features": ["advanced_monitoring", "dedicated_support", "custom_integrations"]
            }
        else:
            return {}
    
    def _get_default_limits(self, plan_type: str) -> dict:
        """Get default limits for plan type"""
        if plan_type == "pro":
            return {
                "api_calls_per_hour": 10000,
                "policy_evaluations_per_hour": 50000,
                "storage_gb": 10,
                "backup_retention_days": 30
            }
        elif plan_type == "custom":
            return {
                "api_calls_per_hour": 100000,
                "policy_evaluations_per_hour": 500000,
                "storage_gb": 100,
                "backup_retention_days": 90
            }
        else:
            return {}
