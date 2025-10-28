from sqlalchemy.orm import Session
from app.models import TenantUser
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta
import jwt
from app.config import settings
import sys
import os

# Add cc-pap-core to path for Auth0 service
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../cc-pap-core'))
from auth0_service import Auth0Service, Auth0Tenant, Auth0User, Auth0Role

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: Session, auth0_service: Optional[Auth0Service] = None):
        self.db = db
        self.auth0_service = auth0_service
    
    def authenticate_user(self, email: str, password: str) -> Optional[TenantUser]:
        """Authenticate user with email and password"""
        try:
            # In a real implementation, this would validate credentials
            # For now, we'll do a simple lookup
            user = self.db.query(TenantUser).filter(
                TenantUser.email == email
            ).first()
            
            if user and user.is_active:
                return user
            
            return None
            
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None
    
    def create_access_token(self, user: TenantUser) -> str:
        """Create JWT access token"""
        try:
            payload = {
                "user_id": user.user_id,
                "email": user.email,
                "tenant_id": user.tenant_id,
                "role": user.role,
                "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
            }
            
            token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
            return token
            
        except Exception as e:
            logger.error(f"Error creating access token: {e}")
            raise
    
    def create_refresh_token(self, user: TenantUser) -> str:
        """Create JWT refresh token"""
        try:
            payload = {
                "user_id": user.user_id,
                "email": user.email,
                "tenant_id": user.tenant_id,
                "exp": datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
            }
            
            token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
            return token
            
        except Exception as e:
            logger.error(f"Error creating refresh token: {e}")
            raise
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None
        except Exception as e:
            logger.error(f"Error verifying token: {e}")
            return None
    
    def get_user_by_token(self, token: str) -> Optional[TenantUser]:
        """Get user by JWT token"""
        try:
            payload = self.verify_token(token)
            if not payload:
                return None
            
            user = self.db.query(TenantUser).filter(
                TenantUser.user_id == payload.get("user_id")
            ).first()
            
            return user
            
        except Exception as e:
            logger.error(f"Error getting user by token: {e}")
            return None
    
    def update_last_login(self, user_id: str):
        """Update user's last login timestamp"""
        try:
            user = self.db.query(TenantUser).filter(TenantUser.user_id == user_id).first()
            if user:
                user.last_login = datetime.utcnow()
                self.db.commit()
                
        except Exception as e:
            logger.error(f"Error updating last login: {e}")
    
    def revoke_token(self, token: str) -> bool:
        """Revoke JWT token"""
        try:
            # In a real implementation, this would add the token to a blacklist
            # For now, we'll just log it
            logger.info(f"Token revoked: {token}")
            return True
            
        except Exception as e:
            logger.error(f"Error revoking token: {e}")
            return False
    
    def get_user_permissions(self, user: TenantUser) -> Dict[str, Any]:
        """Get user permissions based on role"""
        permissions = {
            "admin": [
                "create_policy",
                "update_policy",
                "delete_policy",
                "create_resource",
                "update_resource",
                "delete_resource",
                "create_bouncer",
                "update_bouncer",
                "delete_bouncer",
                "manage_users",
                "view_audit_logs",
                "manage_subscription"
            ],
            "user": [
                "create_policy",
                "update_policy",
                "create_resource",
                "update_resource",
                "create_bouncer",
                "update_bouncer",
                "view_audit_logs"
            ],
            "viewer": [
                "view_policies",
                "view_resources",
                "view_bouncers",
                "view_audit_logs"
            ]
        }
        
        return {
            "role": user.role,
            "permissions": permissions.get(user.role, []),
            "tenant_id": user.tenant_id
        }
    
    def check_permission(self, user: TenantUser, permission: str) -> bool:
        """Check if user has specific permission"""
        user_permissions = self.get_user_permissions(user)
        return permission in user_permissions["permissions"]
    
    def validate_tenant_access(self, user: TenantUser, tenant_id: str) -> bool:
        """Validate if user has access to tenant"""
        return user.tenant_id == tenant_id and user.is_active
    
    # Auth0 Integration Methods
    
    def authenticate_with_auth0(self, auth0_token: str, tenant_id: str) -> Optional[TenantUser]:
        """Authenticate user using Auth0 token"""
        try:
            if not self.auth0_service:
                logger.warning("Auth0 service not configured")
                return None
            
            # Validate Auth0 token
            auth0_user = self.auth0_service.get_user_info(auth0_token, None)
            if not auth0_user:
                return None
            
            # Find or create user in database
            user = self.db.query(TenantUser).filter(
                TenantUser.email == auth0_user.email,
                TenantUser.tenant_id == tenant_id
            ).first()
            
            if not user:
                # Create new user from Auth0 data
                user = TenantUser(
                    user_id=auth0_user.user_id,
                    email=auth0_user.email,
                    name=auth0_user.name,
                    tenant_id=tenant_id,
                    role=auth0_user.roles[0] if auth0_user.roles else "user",
                    is_active=True,
                    auth0_user_id=auth0_user.user_id,
                    created_at=datetime.utcnow(),
                    last_login=datetime.utcnow()
                )
                self.db.add(user)
                self.db.commit()
            else:
                # Update last login
                user.last_login = datetime.utcnow()
                self.db.commit()
            
            return user
            
        except Exception as e:
            logger.error(f"Error authenticating with Auth0: {e}")
            return None
    
    def create_auth0_user(self, tenant_id: str, user_data: Dict[str, Any]) -> Optional[TenantUser]:
        """Create user in both Auth0 and local database"""
        try:
            if not self.auth0_service:
                logger.warning("Auth0 service not configured")
                return None
            
            # Create user in Auth0
            auth0_user = self.auth0_service.create_user(None, user_data)  # tenant would be passed here
            if not auth0_user:
                return None
            
            # Create user in local database
            user = TenantUser(
                user_id=auth0_user.user_id,
                email=auth0_user.email,
                name=auth0_user.name,
                tenant_id=tenant_id,
                role=auth0_user.roles[0] if auth0_user.roles else "user",
                is_active=True,
                auth0_user_id=auth0_user.user_id,
                created_at=datetime.utcnow()
            )
            
            self.db.add(user)
            self.db.commit()
            
            logger.info(f"Created user in Auth0 and database: {user.email}")
            return user
            
        except Exception as e:
            logger.error(f"Error creating Auth0 user: {e}")
            return None
    
    def update_auth0_user_roles(self, user_id: str, roles: List[str]) -> bool:
        """Update user roles in Auth0"""
        try:
            if not self.auth0_service:
                logger.warning("Auth0 service not configured")
                return False
            
            return self.auth0_service.update_user_roles(user_id, roles)
            
        except Exception as e:
            logger.error(f"Error updating Auth0 user roles: {e}")
            return False
    
    def delete_auth0_user(self, user_id: str) -> bool:
        """Delete user from Auth0"""
        try:
            if not self.auth0_service:
                logger.warning("Auth0 service not configured")
                return False
            
            # Delete from Auth0
            auth0_success = self.auth0_service.delete_user(user_id)
            
            # Delete from local database
            user = self.db.query(TenantUser).filter(TenantUser.user_id == user_id).first()
            if user:
                self.db.delete(user)
                self.db.commit()
            
            return auth0_success
            
        except Exception as e:
            logger.error(f"Error deleting Auth0 user: {e}")
            return False
    
    def get_auth0_config(self, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Get Auth0 configuration for tenant"""
        try:
            if not self.auth0_service:
                return None
            
            return self.auth0_service.get_tenant_config(tenant_id)
            
        except Exception as e:
            logger.error(f"Error getting Auth0 config: {e}")
            return None
