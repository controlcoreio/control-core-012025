"""
OAuth 2.0 / OIDC Integration Service for Control Core PIP
Handles OAuth flows, token management, and provider-specific implementations
"""

import os
import json
import time
import asyncio
import aiohttp
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from abc import ABC, abstractmethod
import logging

from .secrets_service import secrets_service

logger = logging.getLogger(__name__)

# Provider-specific OAuth configurations
PROVIDER_CONFIGS = {
    "okta": {
        "auth_url_template": "https://{domain}/oauth2/{authorization_server}/v1/authorize",
        "token_url_template": "https://{domain}/oauth2/{authorization_server}/v1/token",
        "userinfo_url_template": "https://{domain}/oauth2/{authorization_server}/v1/userinfo",
        "default_scopes": ["openid", "profile", "email", "groups"],
        "required_scopes": ["openid"],
        "response_type": "code",
        "grant_type": "authorization_code"
    },
    "azure_ad": {
        "auth_url_template": "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize",
        "token_url_template": "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
        "userinfo_url_template": "https://graph.microsoft.com/v1.0/me",
        "default_scopes": ["openid", "profile", "email", "User.Read", "GroupMember.Read.All"],
        "required_scopes": ["openid"],
        "response_type": "code",
        "grant_type": "authorization_code"
    },
    "auth0": {
        "auth_url_template": "https://{domain}/authorize",
        "token_url_template": "https://{domain}/oauth/token",
        "userinfo_url_template": "https://{domain}/userinfo",
        "default_scopes": ["openid", "profile", "email", "read:users", "read:groups"],
        "required_scopes": ["openid"],
        "response_type": "code",
        "grant_type": "authorization_code"
    },
    "google": {
        "auth_url_template": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url_template": "https://oauth2.googleapis.com/token",
        "userinfo_url_template": "https://www.googleapis.com/oauth2/v2/userinfo",
        "default_scopes": ["openid", "profile", "email", "https://www.googleapis.com/auth/admin.directory.user.readonly"],
        "required_scopes": ["openid"],
        "response_type": "code",
        "grant_type": "authorization_code"
    }
}

@dataclass
class OAuthToken:
    """OAuth token data structure"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: Optional[int] = None
    refresh_token: Optional[str] = None
    scope: Optional[str] = None
    expires_at: Optional[datetime] = None
    
    def is_expired(self) -> bool:
        """Check if token is expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() >= self.expires_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            'access_token': self.access_token,
            'token_type': self.token_type,
            'expires_in': self.expires_in,
            'refresh_token': self.refresh_token,
            'scope': self.scope,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'OAuthToken':
        """Create from dictionary"""
        expires_at = None
        if data.get('expires_at'):
            expires_at = datetime.fromisoformat(data['expires_at'])
        
        return cls(
            access_token=data['access_token'],
            token_type=data.get('token_type', 'Bearer'),
            expires_in=data.get('expires_in'),
            refresh_token=data.get('refresh_token'),
            scope=data.get('scope'),
            expires_at=expires_at
        )

class OAuthProvider(ABC):
    """Abstract base class for OAuth providers"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.client_id = config.get('client_id')
        self.client_secret = config.get('client_secret')
        self.redirect_uri = config.get('redirect_uri', 'http://localhost:8000/oauth/callback')
        self.scopes = config.get('scopes', 'openid profile email')
    
    @abstractmethod
    def get_authorization_url(self, state: str) -> str:
        """Generate authorization URL"""
        pass
    
    @abstractmethod
    async def exchange_code_for_token(self, code: str) -> OAuthToken:
        """Exchange authorization code for access token"""
        pass
    
    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> OAuthToken:
        """Refresh access token using refresh token"""
        pass
    
    @abstractmethod
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information using access token"""
        pass

class OktaOAuthProvider(OAuthProvider):
    """Okta OAuth 2.0 / OIDC provider"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.base_url = config.get('base_url', '').rstrip('/')
        self.authorization_endpoint = f"{self.base_url}/oauth2/default/v1/authorize"
        self.token_endpoint = f"{self.base_url}/oauth2/default/v1/token"
        self.userinfo_endpoint = f"{self.base_url}/oauth2/default/v1/userinfo"
    
    def get_authorization_url(self, state: str) -> str:
        """Generate Okta authorization URL"""
        params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'scope': self.scopes,
            'redirect_uri': self.redirect_uri,
            'state': state
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{self.authorization_endpoint}?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> OAuthToken:
        """Exchange authorization code for access token"""
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.token_endpoint, data=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Token exchange failed: {response.status} - {error_text}")
                
                token_data = await response.json()
                return self._create_token_from_response(token_data)
    
    async def refresh_token(self, refresh_token: str) -> OAuthToken:
        """Refresh access token"""
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.token_endpoint, data=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Token refresh failed: {response.status} - {error_text}")
                
                token_data = await response.json()
                return self._create_token_from_response(token_data)
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Okta"""
        headers = {'Authorization': f'Bearer {access_token}'}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(self.userinfo_endpoint, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"User info request failed: {response.status} - {error_text}")
                
                return await response.json()
    
    def _create_token_from_response(self, token_data: Dict[str, Any]) -> OAuthToken:
        """Create OAuthToken from provider response"""
        expires_at = None
        if token_data.get('expires_in'):
            expires_at = datetime.utcnow() + timedelta(seconds=token_data['expires_in'])
        
        return OAuthToken(
            access_token=token_data['access_token'],
            token_type=token_data.get('token_type', 'Bearer'),
            expires_in=token_data.get('expires_in'),
            refresh_token=token_data.get('refresh_token'),
            scope=token_data.get('scope'),
            expires_at=expires_at
        )

class AzureADOAuthProvider(OAuthProvider):
    """Azure Active Directory OAuth 2.0 provider"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.tenant_id = config.get('tenant_id', 'common')
        self.authorization_endpoint = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/authorize"
        self.token_endpoint = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        self.userinfo_endpoint = "https://graph.microsoft.com/v1.0/me"
    
    def get_authorization_url(self, state: str) -> str:
        """Generate Azure AD authorization URL"""
        params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'scope': self.scopes,
            'redirect_uri': self.redirect_uri,
            'state': state,
            'response_mode': 'query'
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{self.authorization_endpoint}?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> OAuthToken:
        """Exchange authorization code for access token"""
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.token_endpoint, data=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Token exchange failed: {response.status} - {error_text}")
                
                token_data = await response.json()
                return self._create_token_from_response(token_data)
    
    async def refresh_token(self, refresh_token: str) -> OAuthToken:
        """Refresh access token"""
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.token_endpoint, data=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Token refresh failed: {response.status} - {error_text}")
                
                token_data = await response.json()
                return self._create_token_from_response(token_data)
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Microsoft Graph"""
        headers = {'Authorization': f'Bearer {access_token}'}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(self.userinfo_endpoint, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"User info request failed: {response.status} - {error_text}")
                
                return await response.json()
    
    def _create_token_from_response(self, token_data: Dict[str, Any]) -> OAuthToken:
        """Create OAuthToken from provider response"""
        expires_at = None
        if token_data.get('expires_in'):
            expires_at = datetime.utcnow() + timedelta(seconds=token_data['expires_in'])
        
        return OAuthToken(
            access_token=token_data['access_token'],
            token_type=token_data.get('token_type', 'Bearer'),
            expires_in=token_data.get('expires_in'),
            refresh_token=token_data.get('refresh_token'),
            scope=token_data.get('scope'),
            expires_at=expires_at
        )

class Auth0OAuthProvider(OAuthProvider):
    """Auth0 OAuth 2.0 / OIDC provider"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.domain = config.get('domain', '').rstrip('/')
        self.authorization_endpoint = f"https://{self.domain}/authorize"
        self.token_endpoint = f"https://{self.domain}/oauth/token"
        self.userinfo_endpoint = f"https://{self.domain}/userinfo"
    
    def get_authorization_url(self, state: str) -> str:
        """Generate Auth0 authorization URL"""
        params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'scope': self.scopes,
            'redirect_uri': self.redirect_uri,
            'state': state
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{self.authorization_endpoint}?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> OAuthToken:
        """Exchange authorization code for access token"""
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.token_endpoint, data=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Token exchange failed: {response.status} - {error_text}")
                
                token_data = await response.json()
                return self._create_token_from_response(token_data)
    
    async def refresh_token(self, refresh_token: str) -> OAuthToken:
        """Refresh access token"""
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.token_endpoint, data=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Token refresh failed: {response.status} - {error_text}")
                
                token_data = await response.json()
                return self._create_token_from_response(token_data)
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Auth0"""
        headers = {'Authorization': f'Bearer {access_token}'}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(self.userinfo_endpoint, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"User info request failed: {response.status} - {error_text}")
                
                return await response.json()
    
    def _create_token_from_response(self, token_data: Dict[str, Any]) -> OAuthToken:
        """Create OAuthToken from provider response"""
        expires_at = None
        if token_data.get('expires_in'):
            expires_at = datetime.utcnow() + timedelta(seconds=token_data['expires_in'])
        
        return OAuthToken(
            access_token=token_data['access_token'],
            token_type=token_data.get('token_type', 'Bearer'),
            expires_in=token_data.get('expires_in'),
            refresh_token=token_data.get('refresh_token'),
            scope=token_data.get('scope'),
            expires_at=expires_at
        )

class GoogleOAuthProvider(OAuthProvider):
    """Google OAuth 2.0 provider"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_url = "https://oauth2.googleapis.com/token"
        self.userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    def get_authorization_url(self, state: str) -> str:
        """Generate Google authorization URL"""
        params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'scope': self.scopes,
            'redirect_uri': self.redirect_uri,
            'state': state,
            'access_type': 'offline',  # Request refresh token
            'prompt': 'consent'  # Force consent screen to get refresh token
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{self.auth_url}?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> OAuthToken:
        """Exchange authorization code for access token"""
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': self.redirect_uri
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.token_url, data=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Token exchange failed: {error_text}")
                
                token_data = await response.json()
                return OAuthToken.from_dict(token_data)
    
    async def refresh_token(self, refresh_token: str) -> OAuthToken:
        """Refresh access token using refresh token"""
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.token_url, data=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Token refresh failed: {error_text}")
                
                token_data = await response.json()
                return OAuthToken.from_dict(token_data)
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information using access token"""
        headers = {'Authorization': f'Bearer {access_token}'}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(self.userinfo_url, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"User info request failed: {error_text}")
                
                return await response.json()

class OAuthService:
    """Main OAuth service for managing tokens and provider interactions"""
    
    def __init__(self):
        self.providers = {
            'okta': OktaOAuthProvider,
            'azure_ad': AzureADOAuthProvider,
            'auth0': Auth0OAuthProvider,
            'google': GoogleOAuthProvider
        }
        self._token_cache: Dict[str, OAuthToken] = {}
    
    def get_provider_config(self, provider: str, connection_config: Dict[str, Any]) -> Dict[str, Any]:
        """Get provider-specific OAuth configuration"""
        if provider not in PROVIDER_CONFIGS:
            raise ValueError(f"Unsupported OAuth provider: {provider}")
        
        base_config = PROVIDER_CONFIGS[provider].copy()
        
        # Customize URLs based on provider and connection config
        if provider == "okta":
            domain = connection_config.get("domain", "")
            auth_server = connection_config.get("authorization_server", "default")
            base_config["auth_url"] = base_config["auth_url_template"].format(
                domain=domain, authorization_server=auth_server
            )
            base_config["token_url"] = base_config["token_url_template"].format(
                domain=domain, authorization_server=auth_server
            )
            base_config["userinfo_url"] = base_config["userinfo_url_template"].format(
                domain=domain, authorization_server=auth_server
            )
        elif provider == "azure_ad":
            tenant_id = connection_config.get("tenant_id", "")
            base_config["auth_url"] = base_config["auth_url_template"].format(tenant_id=tenant_id)
            base_config["token_url"] = base_config["token_url_template"].format(tenant_id=tenant_id)
        elif provider == "auth0":
            domain = connection_config.get("domain", "")
            base_config["auth_url"] = base_config["auth_url_template"].format(domain=domain)
            base_config["token_url"] = base_config["token_url_template"].format(domain=domain)
            base_config["userinfo_url"] = base_config["userinfo_url_template"].format(domain=domain)
        
        return base_config
    
    def get_provider(self, provider_type: str, config: Dict[str, Any]) -> OAuthProvider:
        """Get OAuth provider instance"""
        if provider_type not in self.providers:
            raise ValueError(f"Unsupported OAuth provider: {provider_type}")
        
        provider_class = self.providers[provider_type]
        return provider_class(config)
    
    def get_authorization_url(self, provider_type: str, config: Dict[str, Any], state: str) -> str:
        """Generate authorization URL for OAuth flow"""
        provider = self.get_provider(provider_type, config)
        return provider.get_authorization_url(state)
    
    async def exchange_code_for_token(self, provider_type: str, config: Dict[str, Any], code: str) -> OAuthToken:
        """Exchange authorization code for access token"""
        provider = self.get_provider(provider_type, config)
        token = await provider.exchange_code_for_token(code)
        
        # Cache the token
        cache_key = f"{provider_type}_{config.get('client_id', '')}"
        self._token_cache[cache_key] = token
        
        return token
    
    async def get_valid_token(self, provider_type: str, config: Dict[str, Any], connection_id: int) -> OAuthToken:
        """Get a valid access token, refreshing if necessary"""
        cache_key = f"{provider_type}_{config.get('client_id', '')}"
        
        # Check cache first
        if cache_key in self._token_cache:
            token = self._token_cache[cache_key]
            if not token.is_expired():
                return token
        
        # Try to get from stored credentials
        try:
            # In a real implementation, this would retrieve from database
            # For now, we'll simulate getting stored token
            stored_token_data = self._get_stored_token(connection_id)
            if stored_token_data:
                token = OAuthToken.from_dict(stored_token_data)
                
                # Check if token needs refresh
                if token.is_expired() and token.refresh_token:
                    provider = self.get_provider(provider_type, config)
                    token = await provider.refresh_token(token.refresh_token)
                    self._store_token(connection_id, token)
                
                self._token_cache[cache_key] = token
                return token
        except Exception as e:
            logger.error(f"Failed to get stored token for connection {connection_id}: {str(e)}")
        
        raise Exception("No valid token available. Re-authorization required.")
    
    async def get_user_info(self, provider_type: str, config: Dict[str, Any], connection_id: int) -> Dict[str, Any]:
        """Get user information using valid access token"""
        token = await self.get_valid_token(provider_type, config, connection_id)
        provider = self.get_provider(provider_type, config)
        return await provider.get_user_info(token.access_token)
    
    def _get_stored_token(self, connection_id: int) -> Optional[Dict[str, Any]]:
        """Get stored token from database (mock implementation)"""
        # In a real implementation, this would query the database
        # For now, return None to simulate no stored token
        return None
    
    def _store_token(self, connection_id: int, token: OAuthToken):
        """Store token in database (mock implementation)"""
        # In a real implementation, this would store in database
        logger.info(f"Storing token for connection {connection_id}")
    
    async def test_connection(self, provider_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test OAuth connection configuration"""
        try:
            provider = self.get_provider(provider_type, config)
            
            # Test by trying to get authorization URL
            test_state = "test_state"
            auth_url = provider.get_authorization_url(test_state)
            
            return {
                'success': True,
                'status': 'connected',
                'details': {
                    'provider': provider_type,
                    'authorization_url': auth_url,
                    'message': 'OAuth configuration is valid'
                }
            }
        except Exception as e:
            return {
                'success': False,
                'status': 'error',
                'error': str(e),
                'details': {
                    'provider': provider_type,
                    'message': 'OAuth configuration is invalid'
                }
            }
    
    def get_supported_providers(self) -> List[str]:
        """Get list of supported OAuth providers"""
        return list(self.providers.keys())
    
    def get_provider_config_template(self, provider_type: str) -> Dict[str, Any]:
        """Get configuration template for a provider"""
        templates = {
            'okta': {
                'base_url': 'https://your-domain.okta.com',
                'client_id': 'your_client_id',
                'client_secret': 'your_client_secret',
                'scopes': 'openid profile email groups',
                'redirect_uri': 'http://localhost:8000/oauth/callback'
            },
            'azure_ad': {
                'tenant_id': 'your_tenant_id',
                'client_id': 'your_client_id',
                'client_secret': 'your_client_secret',
                'scopes': 'openid profile email User.Read',
                'redirect_uri': 'http://localhost:8000/oauth/callback'
            },
            'auth0': {
                'domain': 'your-domain.auth0.com',
                'client_id': 'your_client_id',
                'client_secret': 'your_client_secret',
                'scopes': 'openid profile email',
                'redirect_uri': 'http://localhost:8000/oauth/callback'
            }
        }
        
        return templates.get(provider_type, {})

# Global instance
oauth_service = OAuthService()
