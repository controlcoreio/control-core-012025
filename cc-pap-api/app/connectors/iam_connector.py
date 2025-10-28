"""
IAM Connector Service for Control Core PIP
Handles connections to Identity Providers (Okta, Azure AD, Auth0, LDAP)
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from datetime import datetime
import logging

from ..services.oauth_service import oauth_service
from ..services.secrets_service import secrets_service

logger = logging.getLogger(__name__)

class IAMConnector(ABC):
    """Abstract base class for IAM connectors"""
    
    def __init__(self, connection_id: int, config: Dict[str, Any], credentials: Dict[str, Any]):
        self.connection_id = connection_id
        self.config = config
        self.credentials = credentials
        self.provider = config.get('provider', 'unknown')
    
    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to IAM provider"""
        pass
    
    @abstractmethod
    async def fetch_users(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch users from IAM provider"""
        pass
    
    @abstractmethod
    async def fetch_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch specific user by ID"""
        pass
    
    @abstractmethod
    async def fetch_groups(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch groups from IAM provider"""
        pass
    
    @abstractmethod
    async def fetch_user_groups(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch groups for a specific user"""
        pass
    
    @abstractmethod
    async def get_schema(self) -> Dict[str, Any]:
        """Get available attributes and schema"""
        pass

class OktaConnector(IAMConnector):
    """Okta IAM connector"""
    
    def __init__(self, connection_id: int, config: Dict[str, Any], credentials: Dict[str, Any]):
        super().__init__(connection_id, config, credentials)
        self.base_url = config.get('base_url', '').rstrip('/')
        self.api_token = credentials.get('api_token')
        self.oauth_config = credentials.get('oauth_config')
        self.use_oauth = bool(self.oauth_config)
    
    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        if self.use_oauth:
            # Use OAuth token
            token = await oauth_service.get_valid_token('okta', self.oauth_config, self.connection_id)
            return {'Authorization': f'Bearer {token.access_token}'}
        else:
            # Use API token
            return {'Authorization': f'SSWS {self.api_token}'}
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Okta connection"""
        try:
            headers = await self._get_auth_headers()
            url = f"{self.base_url}/api/v1/users?limit=1"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        return {
                            'success': True,
                            'status': 'connected',
                            'details': {
                                'provider': 'okta',
                                'base_url': self.base_url,
                                'auth_method': 'oauth' if self.use_oauth else 'api_token',
                                'message': 'Connection successful'
                            }
                        }
                    else:
                        error_text = await response.text()
                        return {
                            'success': False,
                            'status': 'error',
                            'error': f"HTTP {response.status}: {error_text}",
                            'details': {
                                'provider': 'okta',
                                'base_url': self.base_url
                            }
                        }
        except Exception as e:
            return {
                'success': False,
                'status': 'error',
                'error': str(e),
                'details': {
                    'provider': 'okta',
                    'base_url': self.base_url
                }
            }
    
    async def fetch_users(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch users from Okta"""
        headers = await self._get_auth_headers()
        url = f"{self.base_url}/api/v1/users?limit={limit}&offset={offset}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    users = await response.json()
                    return users
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch users: HTTP {response.status} - {error_text}")
    
    async def fetch_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch specific user by ID"""
        headers = await self._get_auth_headers()
        url = f"{self.base_url}/api/v1/users/{user_id}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch user {user_id}: HTTP {response.status} - {error_text}")
    
    async def fetch_groups(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch groups from Okta"""
        headers = await self._get_auth_headers()
        url = f"{self.base_url}/api/v1/groups?limit={limit}&offset={offset}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    groups = await response.json()
                    return groups
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch groups: HTTP {response.status} - {error_text}")
    
    async def fetch_user_groups(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch groups for a specific user"""
        headers = await self._get_auth_headers()
        url = f"{self.base_url}/api/v1/users/{user_id}/groups"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    groups = await response.json()
                    return groups
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch user groups: HTTP {response.status} - {error_text}")
    
    async def get_schema(self) -> Dict[str, Any]:
        """Get Okta user schema"""
        return {
            'user_attributes': [
                {'name': 'id', 'type': 'string', 'description': 'Unique user identifier'},
                {'name': 'profile.firstName', 'type': 'string', 'description': 'User first name'},
                {'name': 'profile.lastName', 'type': 'string', 'description': 'User last name'},
                {'name': 'profile.email', 'type': 'string', 'description': 'User email address'},
                {'name': 'profile.login', 'type': 'string', 'description': 'User login name'},
                {'name': 'profile.department', 'type': 'string', 'description': 'User department'},
                {'name': 'profile.title', 'type': 'string', 'description': 'User job title'},
                {'name': 'profile.manager', 'type': 'string', 'description': 'User manager'},
                {'name': 'status', 'type': 'string', 'description': 'User status (ACTIVE, INACTIVE, etc.)'},
                {'name': 'created', 'type': 'datetime', 'description': 'User creation date'},
                {'name': 'lastLogin', 'type': 'datetime', 'description': 'Last login date'},
                {'name': 'mfaEnabled', 'type': 'boolean', 'description': 'MFA enabled status'}
            ],
            'group_attributes': [
                {'name': 'id', 'type': 'string', 'description': 'Unique group identifier'},
                {'name': 'profile.name', 'type': 'string', 'description': 'Group name'},
                {'name': 'profile.description', 'type': 'string', 'description': 'Group description'},
                {'name': 'type', 'type': 'string', 'description': 'Group type'},
                {'name': 'created', 'type': 'datetime', 'description': 'Group creation date'}
            ]
        }

class AzureADConnector(IAMConnector):
    """Azure Active Directory IAM connector"""
    
    def __init__(self, connection_id: int, config: Dict[str, Any], credentials: Dict[str, Any]):
        super().__init__(connection_id, config, credentials)
        self.tenant_id = config.get('tenant_id', 'common')
        self.oauth_config = credentials.get('oauth_config')
        self.use_oauth = bool(self.oauth_config)
    
    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        if self.use_oauth:
            token = await oauth_service.get_valid_token('azure_ad', self.oauth_config, self.connection_id)
            return {'Authorization': f'Bearer {token.access_token}'}
        else:
            raise Exception("Azure AD requires OAuth authentication")
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Azure AD connection"""
        try:
            headers = await self._get_auth_headers()
            url = "https://graph.microsoft.com/v1.0/me"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        user_data = await response.json()
                        return {
                            'success': True,
                            'status': 'connected',
                            'details': {
                                'provider': 'azure_ad',
                                'tenant_id': self.tenant_id,
                                'auth_method': 'oauth',
                                'user': user_data.get('displayName', 'Unknown'),
                                'message': 'Connection successful'
                            }
                        }
                    else:
                        error_text = await response.text()
                        return {
                            'success': False,
                            'status': 'error',
                            'error': f"HTTP {response.status}: {error_text}",
                            'details': {
                                'provider': 'azure_ad',
                                'tenant_id': self.tenant_id
                            }
                        }
        except Exception as e:
            return {
                'success': False,
                'status': 'error',
                'error': str(e),
                'details': {
                    'provider': 'azure_ad',
                    'tenant_id': self.tenant_id
                }
            }
    
    async def fetch_users(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch users from Azure AD"""
        headers = await self._get_auth_headers()
        url = f"https://graph.microsoft.com/v1.0/users?$top={limit}&$skip={offset}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('value', [])
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch users: HTTP {response.status} - {error_text}")
    
    async def fetch_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch specific user by ID"""
        headers = await self._get_auth_headers()
        url = f"https://graph.microsoft.com/v1.0/users/{user_id}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch user {user_id}: HTTP {response.status} - {error_text}")
    
    async def fetch_groups(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch groups from Azure AD"""
        headers = await self._get_auth_headers()
        url = f"https://graph.microsoft.com/v1.0/groups?$top={limit}&$skip={offset}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('value', [])
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch groups: HTTP {response.status} - {error_text}")
    
    async def fetch_user_groups(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch groups for a specific user"""
        headers = await self._get_auth_headers()
        url = f"https://graph.microsoft.com/v1.0/users/{user_id}/memberOf"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('value', [])
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch user groups: HTTP {response.status} - {error_text}")
    
    async def get_schema(self) -> Dict[str, Any]:
        """Get Azure AD user schema"""
        return {
            'user_attributes': [
                {'name': 'id', 'type': 'string', 'description': 'Unique user identifier'},
                {'name': 'displayName', 'type': 'string', 'description': 'User display name'},
                {'name': 'givenName', 'type': 'string', 'description': 'User first name'},
                {'name': 'surname', 'type': 'string', 'description': 'User last name'},
                {'name': 'mail', 'type': 'string', 'description': 'User email address'},
                {'name': 'userPrincipalName', 'type': 'string', 'description': 'User principal name'},
                {'name': 'department', 'type': 'string', 'description': 'User department'},
                {'name': 'jobTitle', 'type': 'string', 'description': 'User job title'},
                {'name': 'manager', 'type': 'object', 'description': 'User manager'},
                {'name': 'accountEnabled', 'type': 'boolean', 'description': 'Account enabled status'},
                {'name': 'createdDateTime', 'type': 'datetime', 'description': 'User creation date'},
                {'name': 'lastSignInDateTime', 'type': 'datetime', 'description': 'Last sign-in date'}
            ],
            'group_attributes': [
                {'name': 'id', 'type': 'string', 'description': 'Unique group identifier'},
                {'name': 'displayName', 'type': 'string', 'description': 'Group display name'},
                {'name': 'description', 'type': 'string', 'description': 'Group description'},
                {'name': 'groupTypes', 'type': 'array', 'description': 'Group types'},
                {'name': 'createdDateTime', 'type': 'datetime', 'description': 'Group creation date'}
            ]
        }

class Auth0Connector(IAMConnector):
    """Auth0 IAM connector"""
    
    def __init__(self, connection_id: int, config: Dict[str, Any], credentials: Dict[str, Any]):
        super().__init__(connection_id, config, credentials)
        self.domain = config.get('domain', '').rstrip('/')
        self.oauth_config = credentials.get('oauth_config')
        self.use_oauth = bool(self.oauth_config)
    
    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        if self.use_oauth:
            token = await oauth_service.get_valid_token('auth0', self.oauth_config, self.connection_id)
            return {'Authorization': f'Bearer {token.access_token}'}
        else:
            raise Exception("Auth0 requires OAuth authentication")
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Auth0 connection"""
        try:
            headers = await self._get_auth_headers()
            url = f"https://{self.domain}/userinfo"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        user_data = await response.json()
                        return {
                            'success': True,
                            'status': 'connected',
                            'details': {
                                'provider': 'auth0',
                                'domain': self.domain,
                                'auth_method': 'oauth',
                                'user': user_data.get('name', 'Unknown'),
                                'message': 'Connection successful'
                            }
                        }
                    else:
                        error_text = await response.text()
                        return {
                            'success': False,
                            'status': 'error',
                            'error': f"HTTP {response.status}: {error_text}",
                            'details': {
                                'provider': 'auth0',
                                'domain': self.domain
                            }
                        }
        except Exception as e:
            return {
                'success': False,
                'status': 'error',
                'error': str(e),
                'details': {
                    'provider': 'auth0',
                    'domain': self.domain
                }
            }
    
    async def fetch_users(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch users from Auth0"""
        headers = await self._get_auth_headers()
        url = f"https://{self.domain}/api/v2/users?per_page={limit}&page={offset // limit + 1}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch users: HTTP {response.status} - {error_text}")
    
    async def fetch_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch specific user by ID"""
        headers = await self._get_auth_headers()
        url = f"https://{self.domain}/api/v2/users/{user_id}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch user {user_id}: HTTP {response.status} - {error_text}")
    
    async def fetch_groups(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch groups from Auth0"""
        headers = await self._get_auth_headers()
        url = f"https://{self.domain}/api/v2/groups?per_page={limit}&page={offset // limit + 1}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch groups: HTTP {response.status} - {error_text}")
    
    async def fetch_user_groups(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch groups for a specific user"""
        headers = await self._get_auth_headers()
        url = f"https://{self.domain}/api/v2/users/{user_id}/groups"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to fetch user groups: HTTP {response.status} - {error_text}")
    
    async def get_schema(self) -> Dict[str, Any]:
        """Get Auth0 user schema"""
        return {
            'user_attributes': [
                {'name': 'user_id', 'type': 'string', 'description': 'Unique user identifier'},
                {'name': 'name', 'type': 'string', 'description': 'User full name'},
                {'name': 'given_name', 'type': 'string', 'description': 'User first name'},
                {'name': 'family_name', 'type': 'string', 'description': 'User last name'},
                {'name': 'email', 'type': 'string', 'description': 'User email address'},
                {'name': 'nickname', 'type': 'string', 'description': 'User nickname'},
                {'name': 'picture', 'type': 'string', 'description': 'User profile picture URL'},
                {'name': 'email_verified', 'type': 'boolean', 'description': 'Email verified status'},
                {'name': 'created_at', 'type': 'datetime', 'description': 'User creation date'},
                {'name': 'updated_at', 'type': 'datetime', 'description': 'User last update date'},
                {'name': 'last_login', 'type': 'datetime', 'description': 'Last login date'},
                {'name': 'logins_count', 'type': 'integer', 'description': 'Number of logins'}
            ],
            'group_attributes': [
                {'name': '_id', 'type': 'string', 'description': 'Unique group identifier'},
                {'name': 'name', 'type': 'string', 'description': 'Group name'},
                {'name': 'description', 'type': 'string', 'description': 'Group description'},
                {'name': 'created_at', 'type': 'datetime', 'description': 'Group creation date'},
                {'name': 'updated_at', 'type': 'datetime', 'description': 'Group last update date'}
            ]
        }

class LDAPConnector(IAMConnector):
    """LDAP IAM connector (basic implementation)"""
    
    def __init__(self, connection_id: int, config: Dict[str, Any], credentials: Dict[str, Any]):
        super().__init__(connection_id, config, credentials)
        self.server = config.get('server')
        self.port = config.get('port', 389)
        self.base_dn = config.get('base_dn')
        self.username = credentials.get('username')
        self.password = credentials.get('password')
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test LDAP connection"""
        try:
            # In a real implementation, this would use python-ldap3
            # For now, we'll simulate the connection test
            await asyncio.sleep(0.1)  # Simulate network delay
            
            return {
                'success': True,
                'status': 'connected',
                'details': {
                    'provider': 'ldap',
                    'server': self.server,
                    'port': self.port,
                    'base_dn': self.base_dn,
                    'message': 'LDAP connection successful'
                }
            }
        except Exception as e:
            return {
                'success': False,
                'status': 'error',
                'error': str(e),
                'details': {
                    'provider': 'ldap',
                    'server': self.server,
                    'port': self.port
                }
            }
    
    async def fetch_users(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch users from LDAP"""
        # Mock implementation - in real implementation, this would query LDAP
        return [
            {
                'dn': 'cn=john.doe,ou=users,dc=example,dc=com',
                'cn': 'john.doe',
                'mail': 'john.doe@example.com',
                'givenName': 'John',
                'sn': 'Doe',
                'department': 'Engineering',
                'title': 'Software Engineer'
            }
        ]
    
    async def fetch_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch specific user by ID"""
        # Mock implementation
        return {
            'dn': f'cn={user_id},ou=users,dc=example,dc=com',
            'cn': user_id,
            'mail': f'{user_id}@example.com',
            'givenName': 'John',
            'sn': 'Doe',
            'department': 'Engineering',
            'title': 'Software Engineer'
        }
    
    async def fetch_groups(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch groups from LDAP"""
        # Mock implementation
        return [
            {
                'dn': 'cn=developers,ou=groups,dc=example,dc=com',
                'cn': 'developers',
                'description': 'Development team',
                'member': ['cn=john.doe,ou=users,dc=example,dc=com']
            }
        ]
    
    async def fetch_user_groups(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch groups for a specific user"""
        # Mock implementation
        return [
            {
                'dn': 'cn=developers,ou=groups,dc=example,dc=com',
                'cn': 'developers',
                'description': 'Development team'
            }
        ]
    
    async def get_schema(self) -> Dict[str, Any]:
        """Get LDAP schema"""
        return {
            'user_attributes': [
                {'name': 'dn', 'type': 'string', 'description': 'Distinguished name'},
                {'name': 'cn', 'type': 'string', 'description': 'Common name'},
                {'name': 'mail', 'type': 'string', 'description': 'Email address'},
                {'name': 'givenName', 'type': 'string', 'description': 'First name'},
                {'name': 'sn', 'type': 'string', 'description': 'Surname'},
                {'name': 'department', 'type': 'string', 'description': 'Department'},
                {'name': 'title', 'type': 'string', 'description': 'Job title'},
                {'name': 'telephoneNumber', 'type': 'string', 'description': 'Phone number'},
                {'name': 'manager', 'type': 'string', 'description': 'Manager DN'}
            ],
            'group_attributes': [
                {'name': 'dn', 'type': 'string', 'description': 'Distinguished name'},
                {'name': 'cn', 'type': 'string', 'description': 'Common name'},
                {'name': 'description', 'type': 'string', 'description': 'Group description'},
                {'name': 'member', 'type': 'array', 'description': 'Group members'}
            ]
        }

class IAMConnectorFactory:
    """Factory for creating IAM connectors"""
    
    _connectors = {
        'okta': OktaConnector,
        'azure_ad': AzureADConnector,
        'auth0': Auth0Connector,
        'ldap': LDAPConnector
    }
    
    @classmethod
    def create_connector(cls, provider: str, connection_id: int, config: Dict[str, Any], credentials: Dict[str, Any]) -> IAMConnector:
        """Create IAM connector instance"""
        if provider not in cls._connectors:
            raise ValueError(f"Unsupported IAM provider: {provider}")
        
        connector_class = cls._connectors[provider]
        return connector_class(connection_id, config, credentials)
    
    @classmethod
    def get_supported_providers(cls) -> List[str]:
        """Get list of supported IAM providers"""
        return list(cls._connectors.keys())
    
    @classmethod
    async def test_connection(cls, provider: str, config: Dict[str, Any], credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Test connection for a provider"""
        try:
            connector = cls.create_connector(provider, 0, config, credentials)
            return await connector.test_connection()
        except Exception as e:
            return {
                'success': False,
                'status': 'error',
                'error': str(e),
                'details': {
                    'provider': provider
                }
            }
