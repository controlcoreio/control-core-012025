"""
Shared Auth0 Service for Control Core
Handles authentication, authorization, and user management across all Control Core applications
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import requests
from authlib.integrations.requests_client import OAuth2Session
from authlib.jose import jwt
import secrets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Auth0Role(str, Enum):
    ADMIN = "admin"
    USER = "user"
    VIEWER = "viewer"
    DEVELOPER = "developer"

class Auth0Connection(str, Enum):
    USERNAME_PASSWORD = "Username-Password-Authentication"
    GOOGLE = "google-oauth2"
    GITHUB = "github"
    MICROSOFT = "windowslive"
    LINKEDIN = "linkedin"

@dataclass
class Auth0User:
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    email_verified: bool = False
    roles: List[str] = None
    metadata: Dict[str, Any] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

@dataclass
class Auth0Tenant:
    tenant_id: str
    domain: str
    client_id: str
    client_secret: str
    audience: str
    connection: str
    tier: str
    region: str
    created_at: datetime

class Auth0Service:
    """
    Shared Auth0 service for Control Core authentication and authorization
    """
    
    def __init__(self, auth0_domain: str, auth0_client_id: str, auth0_client_secret: str):
        self.auth0_domain = auth0_domain
        self.auth0_client_id = auth0_client_id
        self.auth0_client_secret = auth0_client_secret
        self.management_api_url = f"https://{auth0_domain}/api/v2"
        self.auth0_url = f"https://{auth0_domain}"
        
        # Initialize OAuth2 session for management API
        self.session = OAuth2Session(
            client_id=auth0_client_id,
            client_secret=auth0_client_secret,
            scope="read:users write:users read:roles write:roles read:connections write:connections"
        )
        
        # Get management API token
        self.management_token = self._get_management_token()

    def _get_management_token(self) -> str:
        """Get Auth0 Management API token"""
        try:
            token_url = f"{self.auth0_url}/oauth/token"
            token_data = {
                "client_id": self.auth0_client_id,
                "client_secret": self.auth0_client_secret,
                "audience": f"{self.auth0_url}/api/v2/",
                "grant_type": "client_credentials"
            }
            
            response = requests.post(token_url, json=token_data)
            response.raise_for_status()
            
            token_info = response.json()
            return token_info["access_token"]
            
        except Exception as e:
            logger.error(f"Failed to get Auth0 management token: {str(e)}")
            raise

    def create_tenant(self, tenant_config: Dict[str, Any]) -> Auth0Tenant:
        """
        Create Auth0 tenant for new customer
        """
        try:
            logger.info(f"Creating Auth0 tenant for {tenant_config['domain']}")
            
            # Generate tenant-specific configuration
            tenant_id = f"tenant_{secrets.token_hex(8)}"
            tenant_domain = f"{tenant_id}.{self.auth0_domain}"
            
            # Create Auth0 application for tenant
            app_config = {
                "name": f"Control Core - {tenant_config['company']}",
                "description": f"Control Core application for {tenant_config['company']}",
                "callbacks": [
                    f"https://{tenant_config['domain']}/callback",
                    f"https://{tenant_config['domain']}/auth/callback"
                ],
                "allowed_logout_urls": [
                    f"https://{tenant_config['domain']}/logout",
                    f"https://{tenant_config['domain']}/auth/logout"
                ],
                "web_origins": [
                    f"https://{tenant_config['domain']}"
                ],
                "allowed_origins": [
                    f"https://{tenant_config['domain']}"
                ],
                "app_type": "spa",
                "token_endpoint_auth_method": "none"
            }
            
            headers = {
                "Authorization": f"Bearer {self.management_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.management_api_url}/clients",
                json=app_config,
                headers=headers
            )
            response.raise_for_status()
            
            app_data = response.json()
            
            # Create Auth0 tenant record
            tenant = Auth0Tenant(
                tenant_id=tenant_id,
                domain=tenant_domain,
                client_id=app_data["client_id"],
                client_secret=app_data["client_secret"],
                audience=f"https://{tenant_domain}/api",
                connection=Auth0Connection.USERNAME_PASSWORD,
                tier=tenant_config["tier"],
                region=tenant_config["region"],
                created_at=datetime.utcnow()
            )
            
            logger.info(f"Successfully created Auth0 tenant: {tenant_id}")
            return tenant
            
        except Exception as e:
            logger.error(f"Failed to create Auth0 tenant: {str(e)}")
            raise

    def create_user(self, tenant: Auth0Tenant, user_data: Dict[str, Any]) -> Auth0User:
        """
        Create user in Auth0 tenant
        """
        try:
            logger.info(f"Creating Auth0 user: {user_data['email']}")
            
            # Prepare user creation data
            user_creation_data = {
                "connection": tenant.connection,
                "email": user_data["email"],
                "password": user_data.get("password", secrets.token_urlsafe(12)),
                "name": user_data["name"],
                "email_verified": user_data.get("email_verified", False),
                "user_metadata": {
                    "company": user_data.get("company", ""),
                    "tier": tenant.tier,
                    "region": tenant.region,
                    "created_by": "control_core_signup"
                },
                "app_metadata": {
                    "roles": user_data.get("roles", [Auth0Role.USER]),
                    "tier": tenant.tier,
                    "tenant_id": tenant.tenant_id
                }
            }
            
            headers = {
                "Authorization": f"Bearer {self.management_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.management_api_url}/users",
                json=user_creation_data,
                headers=headers
            )
            response.raise_for_status()
            
            user_data_response = response.json()
            
            # Create Auth0User object
            auth0_user = Auth0User(
                user_id=user_data_response["user_id"],
                email=user_data_response["email"],
                name=user_data_response["name"],
                picture=user_data_response.get("picture"),
                email_verified=user_data_response.get("email_verified", False),
                roles=user_data_response.get("app_metadata", {}).get("roles", []),
                metadata=user_data_response.get("user_metadata", {}),
                created_at=datetime.fromisoformat(user_data_response["created_at"].replace('Z', '+00:00')),
                last_login=datetime.fromisoformat(user_data_response["last_login"].replace('Z', '+00:00')) if user_data_response.get("last_login") else None
            )
            
            logger.info(f"Successfully created Auth0 user: {auth0_user.user_id}")
            return auth0_user
            
        except Exception as e:
            logger.error(f"Failed to create Auth0 user: {str(e)}")
            raise

    def authenticate_user(self, tenant: Auth0Tenant, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user with Auth0
        """
        try:
            logger.info(f"Authenticating user: {email}")
            
            # Prepare authentication data
            auth_data = {
                "grant_type": "password",
                "username": email,
                "password": password,
                "audience": tenant.audience,
                "scope": "openid profile email",
                "client_id": tenant.client_id,
                "client_secret": tenant.client_secret
            }
            
            response = requests.post(
                f"{self.auth0_url}/oauth/token",
                data=auth_data
            )
            response.raise_for_status()
            
            token_data = response.json()
            
            # Decode and validate JWT token
            user_info = self._decode_jwt_token(token_data["id_token"], tenant)
            
            logger.info(f"Successfully authenticated user: {email}")
            return {
                "access_token": token_data["access_token"],
                "id_token": token_data["id_token"],
                "refresh_token": token_data.get("refresh_token"),
                "expires_in": token_data["expires_in"],
                "user_info": user_info
            }
            
        except Exception as e:
            logger.error(f"Failed to authenticate user: {str(e)}")
            raise

    def refresh_token(self, tenant: Auth0Tenant, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh Auth0 access token
        """
        try:
            refresh_data = {
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": tenant.client_id,
                "client_secret": tenant.client_secret
            }
            
            response = requests.post(
                f"{self.auth0_url}/oauth/token",
                data=refresh_data
            )
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Failed to refresh token: {str(e)}")
            raise

    def get_user_info(self, access_token: str, tenant: Auth0Tenant) -> Auth0User:
        """
        Get user information from Auth0
        """
        try:
            headers = {
                "Authorization": f"Bearer {access_token}"
            }
            
            response = requests.get(
                f"{self.auth0_url}/userinfo",
                headers=headers
            )
            response.raise_for_status()
            
            user_data = response.json()
            
            return Auth0User(
                user_id=user_data["sub"],
                email=user_data["email"],
                name=user_data["name"],
                picture=user_data.get("picture"),
                email_verified=user_data.get("email_verified", False),
                roles=user_data.get("app_metadata", {}).get("roles", []),
                metadata=user_data.get("user_metadata", {})
            )
            
        except Exception as e:
            logger.error(f"Failed to get user info: {str(e)}")
            raise

    def update_user_roles(self, user_id: str, roles: List[str]) -> bool:
        """
        Update user roles in Auth0
        """
        try:
            logger.info(f"Updating roles for user {user_id}: {roles}")
            
            update_data = {
                "app_metadata": {
                    "roles": roles
                }
            }
            
            headers = {
                "Authorization": f"Bearer {self.management_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.patch(
                f"{self.management_api_url}/users/{user_id}",
                json=update_data,
                headers=headers
            )
            response.raise_for_status()
            
            logger.info(f"Successfully updated roles for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update user roles: {str(e)}")
            return False

    def delete_user(self, user_id: str) -> bool:
        """
        Delete user from Auth0
        """
        try:
            logger.info(f"Deleting Auth0 user: {user_id}")
            
            headers = {
                "Authorization": f"Bearer {self.management_token}"
            }
            
            response = requests.delete(
                f"{self.management_api_url}/users/{user_id}",
                headers=headers
            )
            response.raise_for_status()
            
            logger.info(f"Successfully deleted user: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete user: {str(e)}")
            return False

    def _decode_jwt_token(self, id_token: str, tenant: Auth0Tenant) -> Dict[str, Any]:
        """
        Decode and validate JWT token
        """
        try:
            # Get Auth0 public key for token verification
            jwks_url = f"{self.auth0_url}/.well-known/jwks.json"
            jwks_response = requests.get(jwks_url)
            jwks_response.raise_for_status()
            
            jwks = jwks_response.json()
            
            # Decode JWT token
            header = jwt.get_unverified_header(id_token)
            key = self._get_public_key(jwks, header["kid"])
            
            payload = jwt.decode(
                id_token,
                key,
                algorithms=["RS256"],
                audience=tenant.audience,
                issuer=self.auth0_url
            )
            
            return payload
            
        except Exception as e:
            logger.error(f"Failed to decode JWT token: {str(e)}")
            raise

    def _get_public_key(self, jwks: Dict[str, Any], kid: str) -> str:
        """
        Get public key from JWKS for token verification
        """
        for key in jwks["keys"]:
            if key["kid"] == kid:
                return key
        
        raise ValueError(f"Key with kid {kid} not found in JWKS")

    def create_roles(self, tenant: Auth0Tenant, roles: List[Dict[str, Any]]) -> List[str]:
        """
        Create Auth0 roles for tenant
        """
        try:
            logger.info(f"Creating roles for tenant {tenant.tenant_id}")
            
            created_roles = []
            headers = {
                "Authorization": f"Bearer {self.management_token}",
                "Content-Type": "application/json"
            }
            
            for role_data in roles:
                response = requests.post(
                    f"{self.management_api_url}/roles",
                    json=role_data,
                    headers=headers
                )
                response.raise_for_status()
                
                role_info = response.json()
                created_roles.append(role_info["id"])
            
            logger.info(f"Successfully created {len(created_roles)} roles")
            return created_roles
            
        except Exception as e:
            logger.error(f"Failed to create roles: {str(e)}")
            raise

    def assign_roles_to_user(self, user_id: str, role_ids: List[str]) -> bool:
        """
        Assign roles to user
        """
        try:
            logger.info(f"Assigning roles to user {user_id}: {role_ids}")
            
            assign_data = {
                "roles": role_ids
            }
            
            headers = {
                "Authorization": f"Bearer {self.management_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.management_api_url}/users/{user_id}/roles",
                json=assign_data,
                headers=headers
            )
            response.raise_for_status()
            
            logger.info(f"Successfully assigned roles to user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to assign roles to user: {str(e)}")
            return False

    def get_tenant_config(self, tenant_id: str) -> Dict[str, Any]:
        """
        Get tenant configuration for frontend integration
        """
        try:
            # This would typically fetch from database
            # For now, return mock configuration
            return {
                "domain": f"{tenant_id}.auth0.com",
                "client_id": "mock_client_id",
                "audience": f"https://{tenant_id}.auth0.com/api",
                "scope": "openid profile email",
                "response_type": "code",
                "redirect_uri": "/callback"
            }
            
        except Exception as e:
            logger.error(f"Failed to get tenant config: {str(e)}")
            raise

    def validate_token(self, token: str, tenant: Auth0Tenant) -> Dict[str, Any]:
        """
        Validate Auth0 token
        """
        try:
            # This would validate the token with Auth0
            # For now, return mock validation
            return {
                "valid": True,
                "user_id": "mock_user_id",
                "expires_at": datetime.utcnow() + timedelta(hours=1)
            }
            
        except Exception as e:
            logger.error(f"Failed to validate token: {str(e)}")
            raise
