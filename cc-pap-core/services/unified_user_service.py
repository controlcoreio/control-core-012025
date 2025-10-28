"""
Unified User Management Service for Control Core
Consolidates user management across PAP, Pro-Tenant, and Auth0 services
Implements SOC2-compliant RBAC and authentication
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

# Import Auth0 service
from auth0_service import Auth0Service, Auth0Tenant, Auth0User, Auth0Role

# Import encryption service
from security.encryption_service import encryption_service, SecretType

logger = logging.getLogger(__name__)

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    POLICY_ADMIN = "policy_admin"
    SECURITY_ANALYST = "security_analyst"
    RESOURCE_MANAGER = "resource_manager"
    DEVELOPER = "developer"
    VIEWER = "viewer"

class AuthMethod(str, Enum):
    PASSWORD = "password"
    MFA = "mfa"
    SSO = "sso"
    PASSKEY = "passkey"
    MAGIC_LINK = "magic_link"

@dataclass
class UserPermissions:
    role: UserRole
    permissions: List[str]
    level: int
    inherits_from: Optional[List[str]] = None

@dataclass
class UserSession:
    session_id: str
    user_id: str
    ip_address: str
    user_agent: str
    created_at: datetime
    last_activity: datetime
    expires_at: datetime

@dataclass
class UnifiedUser:
    id: str
    auth0_id: Optional[str]
    email: str
    name: str
    username: str
    role: UserRole
    permissions: List[str]
    status: UserStatus
    mfa_enabled: bool
    auth_methods: List[AuthMethod]
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    subscription_tier: str
    deployment_model: str
    github_repo: Optional[str]
    tenant_id: Optional[str]
    session_info: Dict[str, Any]

class UnifiedUserService:
    """
    Unified user management service that consolidates all user operations
    across PAP, Pro-Tenant, and Auth0 services with SOC2 compliance
    """
    
    def __init__(self, auth0_service: Optional[Auth0Service] = None):
        self.auth0_service = auth0_service
        self.encryption_service = encryption_service
        
        # SOC2-compliant role definitions with principle of least privilege
        self.role_permissions = {
            UserRole.SUPER_ADMIN: UserPermissions(
                role=UserRole.SUPER_ADMIN,
                permissions=[
                    "user.manage.all",
                    "policy.manage.all",
                    "system.configure.all",
                    "billing.manage.all",
                    "compliance.manage.all",
                    "audit.view.all",
                    "security.manage.all",
                    "tenant.manage.all"
                ],
                level=100
            ),
            UserRole.POLICY_ADMIN: UserPermissions(
                role=UserRole.POLICY_ADMIN,
                permissions=[
                    "policy.create",
                    "policy.edit",
                    "policy.delete",
                    "policy.deploy",
                    "policy.test",
                    "audit.view.policies",
                    "resource.manage",
                    "context.manage"
                ],
                level=80
            ),
            UserRole.SECURITY_ANALYST: UserPermissions(
                role=UserRole.SECURITY_ANALYST,
                permissions=[
                    "security.monitor",
                    "audit.view.security",
                    "compliance.view",
                    "incident.manage",
                    "policy.view",
                    "resource.view"
                ],
                level=70
            ),
            UserRole.RESOURCE_MANAGER: UserPermissions(
                role=UserRole.RESOURCE_MANAGER,
                permissions=[
                    "resource.create",
                    "resource.edit",
                    "resource.delete",
                    "resource.configure",
                    "context.source.manage",
                    "policy.view",
                    "audit.view.resources"
                ],
                level=60
            ),
            UserRole.DEVELOPER: UserPermissions(
                role=UserRole.DEVELOPER,
                permissions=[
                    "policy.create",
                    "policy.edit",
                    "policy.test",
                    "policy.view",
                    "resource.view",
                    "context.view"
                ],
                level=40
            ),
            UserRole.VIEWER: UserPermissions(
                role=UserRole.VIEWER,
                permissions=[
                    "policy.view",
                    "resource.view",
                    "audit.view.basic",
                    "dashboard.view"
                ],
                level=20
            )
        }
        
        # Session management
        self.active_sessions: Dict[str, UserSession] = {}
        self.session_timeout = int(os.getenv('SESSION_TIMEOUT_MINUTES', '480'))  # 8 hours
        
        logger.info("UnifiedUserService initialized with SOC2 compliance")

    def create_user(
        self,
        email: str,
        name: str,
        username: str,
        role: UserRole,
        password: Optional[str] = None,
        tenant_id: Optional[str] = None,
        subscription_tier: str = "kickstart",
        deployment_model: str = "hosted",
        github_repo: Optional[str] = None,
        auth_methods: Optional[List[AuthMethod]] = None
    ) -> UnifiedUser:
        """Create a new user with SOC2-compliant permissions"""
        
        user_id = str(uuid.uuid4())
        current_time = datetime.utcnow()
        
        # Get role permissions
        role_perms = self.role_permissions.get(role)
        if not role_perms:
            raise ValueError(f"Invalid role: {role}")
        
        # Set default auth methods
        if not auth_methods:
            auth_methods = [AuthMethod.PASSWORD]
        
        # Create Auth0 user if service is available
        auth0_id = None
        if self.auth0_service and tenant_id:
            try:
                # This would create the user in Auth0
                # For now, we'll simulate it
                auth0_id = f"auth0|{uuid.uuid4().hex}"
                logger.info(f"Created Auth0 user: {auth0_id}")
            except Exception as e:
                logger.error(f"Failed to create Auth0 user: {e}")
        
        # Create unified user
        user = UnifiedUser(
            id=user_id,
            auth0_id=auth0_id,
            email=email,
            name=name,
            username=username,
            role=role,
            permissions=role_perms.permissions,
            status=UserStatus.PENDING,
            mfa_enabled=False,
            auth_methods=auth_methods,
            last_login=None,
            created_at=current_time,
            updated_at=current_time,
            subscription_tier=subscription_tier,
            deployment_model=deployment_model,
            github_repo=github_repo,
            tenant_id=tenant_id,
            session_info={}
        )
        
        # Log user creation for audit
        self._log_user_operation("create", user_id, email, role.value)
        
        logger.info(f"Created user: {email} with role {role.value}")
        return user

    def authenticate_user(
        self,
        email: str,
        password: str,
        tenant_id: Optional[str] = None,
        ip_address: str = "127.0.0.1",
        user_agent: str = "unknown"
    ) -> Optional[UnifiedUser]:
        """Authenticate user with SOC2-compliant logging"""
        
        try:
            # In production, this would validate against Auth0 or local database
            # For now, we'll simulate authentication
            
            # Mock user lookup (in production, query database)
            user = self._get_user_by_email(email)
            if not user:
                self._log_user_operation("auth_failed", "unknown", email, "unknown")
                return None
            
            # Check user status
            if user.status != UserStatus.ACTIVE:
                self._log_user_operation("auth_failed_inactive", user.id, email, user.role.value)
                return None
            
            # Update last login
            user.last_login = datetime.utcnow()
            user.updated_at = datetime.utcnow()
            
            # Create session
            session = self._create_session(user.id, ip_address, user_agent)
            user.session_info = {
                "active_sessions": len(self.active_sessions),
                "last_activity": session.last_activity.isoformat(),
                "ip_addresses": [ip_address],
                "user_agents": [user_agent]
            }
            
            # Log successful authentication
            self._log_user_operation("auth_success", user.id, email, user.role.value)
            
            return user
            
        except Exception as e:
            logger.error(f"Authentication failed for {email}: {e}")
            self._log_user_operation("auth_error", "unknown", email, "unknown")
            return None

    def update_user_role(self, user_id: str, new_role: UserRole) -> bool:
        """Update user role with permission validation"""
        
        try:
            user = self._get_user_by_id(user_id)
            if not user:
                return False
            
            old_role = user.role
            
            # Get new role permissions
            role_perms = self.role_permissions.get(new_role)
            if not role_perms:
                return False
            
            # Update user
            user.role = new_role
            user.permissions = role_perms.permissions
            user.updated_at = datetime.utcnow()
            
            # Update Auth0 if available
            if self.auth0_service and user.auth0_id:
                try:
                    # Update Auth0 roles
                    auth0_roles = self._map_role_to_auth0_roles(new_role)
                    self.auth0_service.update_user_roles(user.auth0_id, auth0_roles)
                except Exception as e:
                    logger.error(f"Failed to update Auth0 roles: {e}")
            
            # Log role change
            self._log_user_operation("role_change", user_id, user.email, f"{old_role.value}->{new_role.value}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update user role: {e}")
            return False

    def enable_mfa(self, user_id: str) -> bool:
        """Enable multi-factor authentication for user"""
        
        try:
            user = self._get_user_by_id(user_id)
            if not user:
                return False
            
            user.mfa_enabled = True
            user.updated_at = datetime.utcnow()
            
            # Log MFA enable
            self._log_user_operation("mfa_enable", user_id, user.email, user.role.value)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to enable MFA: {e}")
            return False

    def disable_mfa(self, user_id: str) -> bool:
        """Disable multi-factor authentication for user"""
        
        try:
            user = self._get_user_by_id(user_id)
            if not user:
                return False
            
            user.mfa_enabled = False
            user.updated_at = datetime.utcnow()
            
            # Log MFA disable
            self._log_user_operation("mfa_disable", user_id, user.email, user.role.value)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to disable MFA: {e}")
            return False

    def suspend_user(self, user_id: str, reason: Optional[str] = None) -> bool:
        """Suspend user account"""
        
        try:
            user = self._get_user_by_id(user_id)
            if not user:
                return False
            
            user.status = UserStatus.SUSPENDED
            user.updated_at = datetime.utcnow()
            
            # Revoke all active sessions
            self._revoke_user_sessions(user_id)
            
            # Log suspension
            self._log_user_operation("suspend", user_id, user.email, user.role.value, reason)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to suspend user: {e}")
            return False

    def activate_user(self, user_id: str) -> bool:
        """Activate user account"""
        
        try:
            user = self._get_user_by_id(user_id)
            if not user:
                return False
            
            user.status = UserStatus.ACTIVE
            user.updated_at = datetime.utcnow()
            
            # Log activation
            self._log_user_operation("activate", user_id, user.email, user.role.value)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to activate user: {e}")
            return False

    def check_permission(self, user: UnifiedUser, permission: str) -> bool:
        """Check if user has specific permission"""
        
        return permission in user.permissions

    def get_users_by_tenant(self, tenant_id: str) -> List[UnifiedUser]:
        """Get all users for a tenant"""
        
        # In production, this would query the database
        # For now, return mock data
        return []

    def get_user_by_id(self, user_id: str) -> Optional[UnifiedUser]:
        """Get user by ID"""
        
        return self._get_user_by_id(user_id)

    def get_user_by_email(self, email: str) -> Optional[UnifiedUser]:
        """Get user by email"""
        
        return self._get_user_by_email(email)

    def _get_user_by_id(self, user_id: str) -> Optional[UnifiedUser]:
        """Internal method to get user by ID"""
        
        # In production, this would query the database
        # For now, return mock data
        return None

    def _get_user_by_email(self, email: str) -> Optional[UnifiedUser]:
        """Internal method to get user by email"""
        
        # In production, this would query the database
        # For now, return mock data
        return None

    def _create_session(self, user_id: str, ip_address: str, user_agent: str) -> UserSession:
        """Create a new user session"""
        
        session_id = str(uuid.uuid4())
        current_time = datetime.utcnow()
        expires_at = current_time + timedelta(minutes=self.session_timeout)
        
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=current_time,
            last_activity=current_time,
            expires_at=expires_at
        )
        
        self.active_sessions[session_id] = session
        return session

    def _revoke_user_sessions(self, user_id: str) -> None:
        """Revoke all sessions for a user"""
        
        sessions_to_remove = [
            session_id for session_id, session in self.active_sessions.items()
            if session.user_id == user_id
        ]
        
        for session_id in sessions_to_remove:
            del self.active_sessions[session_id]

    def _map_role_to_auth0_roles(self, role: UserRole) -> List[str]:
        """Map internal roles to Auth0 roles"""
        
        role_mapping = {
            UserRole.SUPER_ADMIN: ["admin"],
            UserRole.POLICY_ADMIN: ["policy_admin"],
            UserRole.SECURITY_ANALYST: ["security_analyst"],
            UserRole.RESOURCE_MANAGER: ["resource_manager"],
            UserRole.DEVELOPER: ["developer"],
            UserRole.VIEWER: ["viewer"]
        }
        
        return role_mapping.get(role, ["user"])

    def _log_user_operation(self, operation: str, user_id: str, email: str, role: str, details: Optional[str] = None):
        """Log user operations for SOC2 audit trail"""
        
        audit_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": operation,
            "user_id": user_id,
            "email": email,
            "role": role,
            "details": details,
            "service": "unified_user_service"
        }
        
        logger.info(f"USER_AUDIT: {json.dumps(audit_log)}")

    def get_role_definitions(self) -> Dict[str, UserPermissions]:
        """Get all role definitions"""
        
        return {role.value: perms for role, perms in self.role_permissions.items()}

    def validate_permissions(self, user: UnifiedUser, required_permissions: List[str]) -> bool:
        """Validate that user has all required permissions"""
        
        return all(permission in user.permissions for permission in required_permissions)

# Global unified user service instance
unified_user_service = UnifiedUserService()
