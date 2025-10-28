"""
PIP Connector Service - Handles actual connections to external data sources
Implements authentication and data fetching for various PIP connection types
"""

import aiohttp
import asyncio
import ssl
import certifi
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
import json
import base64
from urllib.parse import urlencode, urlparse
import time

from app.models import PIPConnection, ConnectionType, OAuthToken
from app.schemas import (
    APIKeyAuthConfig, BearerTokenAuthConfig, BasicAuthConfig,
    OAuthAuthConfig, CertificateAuthConfig
)
from sqlalchemy.orm import Session


class PIPConnectorService:
    """Service for connecting to and fetching data from external PIP sources"""
    
    def __init__(self):
        self.timeout = aiohttp.ClientTimeout(total=30)
        
    async def test_connection(
        self, 
        connection_type: str, 
        provider: str,
        auth_type: str,
        configuration: Dict[str, Any],
        credentials: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Test connection to data source before saving
        
        Args:
            connection_type: Type of connection (iam, hr, crm, etc.)
            provider: Specific provider (okta, workday, salesforce, etc.)
            auth_type: Authentication method (oauth, api-key, bearer-token, basic, certificate)
            configuration: Connection configuration
            credentials: Authentication credentials
            
        Returns:
            Dictionary with test results
        """
        start_time = time.time()
        
        try:
            if auth_type == "oauth":
                result = await self._test_oauth_connection(configuration, credentials)
            elif auth_type == "api-key":
                result = await self._test_api_key_connection(configuration, credentials)
            elif auth_type == "bearer-token":
                result = await self._test_bearer_token_connection(configuration, credentials)
            elif auth_type == "basic":
                result = await self._test_basic_auth_connection(configuration, credentials)
            elif auth_type == "certificate":
                result = await self._test_certificate_connection(configuration, credentials)
            else:
                return {
                    "success": False,
                    "status": "error",
                    "response_time": 0,
                    "error_message": f"Unsupported authentication type: {auth_type}",
                    "details": {},
                    "tested_at": datetime.now()
                }
            
            response_time = time.time() - start_time
            result["response_time"] = round(response_time, 3)
            result["tested_at"] = datetime.now()
            
            return result
            
        except Exception as e:
            response_time = time.time() - start_time
            return {
                "success": False,
                "status": "error",
                "response_time": round(response_time, 3),
                "error_message": str(e),
                "details": {"exception_type": type(e).__name__},
                "tested_at": datetime.now()
            }
    
    async def _test_api_key_connection(
        self, 
        configuration: Dict[str, Any], 
        credentials: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Test API Key authentication"""
        api_base_url = configuration.get("endpoint") or credentials.get("api_key", {}).get("api_base_url")
        api_key = credentials.get("api_key", {}).get("api_key") or credentials.get("api_key")
        
        if not api_base_url or not api_key:
            return {
                "success": False,
                "status": "configuration_error",
                "error_message": "Missing API base URL or API key"
            }
        
        # Determine header format based on common patterns
        header_name = "X-API-Key"  # Default
        header_value = api_key
        
        # Some providers use Authorization header
        if any(provider in api_base_url.lower() for provider in ["okta", "auth0"]):
            header_name = "Authorization"
            header_value = f"SSWS {api_key}"  # Okta format
        
        headers = {header_name: header_value}
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                # Try a simple GET request to validate the API key
                test_endpoints = [
                    f"{api_base_url}/users?limit=1",  # Common user endpoint
                    f"{api_base_url}/me",  # Current user endpoint
                    f"{api_base_url}",  # Root endpoint
                ]
                
                last_error = None
                for test_url in test_endpoints:
                    try:
                        async with session.get(test_url, headers=headers) as response:
                            if response.status in [200, 201]:
                                data = await response.json() if response.content_type == 'application/json' else {}
                                return {
                                    "success": True,
                                    "status": "connected",
                                    "details": {
                                        "endpoint_tested": test_url,
                                        "http_status": response.status,
                                        "has_data": bool(data)
                                    }
                                }
                            elif response.status == 401:
                                return {
                                    "success": False,
                                    "status": "authentication_failed",
                                    "error_message": "Invalid API key or unauthorized access"
                                }
                            elif response.status == 403:
                                return {
                                    "success": False,
                                    "status": "forbidden",
                                    "error_message": "API key lacks required permissions"
                                }
                            else:
                                last_error = f"HTTP {response.status}"
                    except Exception as e:
                        last_error = str(e)
                        continue
                
                return {
                    "success": False,
                    "status": "connection_failed",
                    "error_message": f"Could not connect to any test endpoint. Last error: {last_error}"
                }
                
        except asyncio.TimeoutError:
            return {
                "success": False,
                "status": "timeout",
                "error_message": "Connection timed out"
            }
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error_message": str(e)
            }
    
    async def _test_bearer_token_connection(
        self, 
        configuration: Dict[str, Any], 
        credentials: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Test Bearer Token authentication"""
        api_base_url = configuration.get("endpoint") or credentials.get("api_key", {}).get("api_base_url")
        bearer_token = credentials.get("api_key", {}).get("bearer_token") or credentials.get("api_key")
        
        if not api_base_url or not bearer_token:
            return {
                "success": False,
                "status": "configuration_error",
                "error_message": "Missing API base URL or bearer token"
            }
        
        headers = {"Authorization": f"Bearer {bearer_token}"}
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                # Try common endpoints
                test_endpoints = [
                    f"{api_base_url}/users?limit=1",
                    f"{api_base_url}/me",
                    f"{api_base_url}",
                ]
                
                last_error = None
                for test_url in test_endpoints:
                    try:
                        async with session.get(test_url, headers=headers) as response:
                            if response.status in [200, 201]:
                                return {
                                    "success": True,
                                    "status": "connected",
                                    "details": {
                                        "endpoint_tested": test_url,
                                        "http_status": response.status
                                    }
                                }
                            elif response.status == 401:
                                return {
                                    "success": False,
                                    "status": "authentication_failed",
                                    "error_message": "Invalid or expired bearer token"
                                }
                            else:
                                last_error = f"HTTP {response.status}"
                    except Exception as e:
                        last_error = str(e)
                        continue
                
                return {
                    "success": False,
                    "status": "connection_failed",
                    "error_message": f"Could not connect. Last error: {last_error}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error_message": str(e)
            }
    
    async def _test_basic_auth_connection(
        self, 
        configuration: Dict[str, Any], 
        credentials: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Test Username/Password authentication"""
        login_url = credentials.get("username", {}).get("login_url") or configuration.get("login_url")
        username = credentials.get("username", {}).get("username") or credentials.get("username")
        password = credentials.get("password", {}).get("password") or credentials.get("password")
        
        if not login_url or not username or not password:
            return {
                "success": False,
                "status": "configuration_error",
                "error_message": "Missing login URL, username, or password"
            }
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                # Attempt login
                login_data = {"username": username, "password": password}
                
                async with session.post(login_url, json=login_data) as response:
                    if response.status in [200, 201]:
                        # Try to extract session token/cookie
                        response_data = await response.json() if response.content_type == 'application/json' else {}
                        
                        # Check for common token fields
                        token = (
                            response_data.get("token") or 
                            response_data.get("access_token") or
                            response_data.get("session_token")
                        )
                        
                        return {
                            "success": True,
                            "status": "authenticated",
                            "details": {
                                "login_url": login_url,
                                "has_token": bool(token),
                                "http_status": response.status
                            }
                        }
                    elif response.status == 401:
                        return {
                            "success": False,
                            "status": "authentication_failed",
                            "error_message": "Invalid username or password"
                        }
                    else:
                        error_msg = await response.text()
                        return {
                            "success": False,
                            "status": "login_failed",
                            "error_message": f"Login failed with HTTP {response.status}: {error_msg[:200]}"
                        }
                        
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error_message": str(e)
            }
    
    async def _test_oauth_connection(
        self, 
        configuration: Dict[str, Any], 
        credentials: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Test OAuth 2.0 configuration (validates URLs and credentials format)"""
        oauth_creds = credentials.get("oauth_token", {})
        
        auth_url = oauth_creds.get("authUrl") or oauth_creds.get("auth_url")
        token_url = oauth_creds.get("tokenUrl") or oauth_creds.get("token_url")
        client_id = oauth_creds.get("clientId") or oauth_creds.get("client_id")
        client_secret = oauth_creds.get("clientSecret") or oauth_creds.get("client_secret")
        
        if not all([auth_url, token_url, client_id, client_secret]):
            return {
                "success": False,
                "status": "configuration_error",
                "error_message": "Missing required OAuth configuration (auth_url, token_url, client_id, client_secret)"
            }
        
        try:
            # Validate URLs are reachable
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                # Test authorization URL
                try:
                    async with session.get(auth_url) as response:
                        auth_url_reachable = response.status != 404
                except:
                    auth_url_reachable = False
                
                # Test token URL (should respond to GET even if it requires POST)
                try:
                    async with session.get(token_url) as response:
                        token_url_reachable = response.status in [200, 400, 405]  # 405 = Method Not Allowed is OK
                except:
                    token_url_reachable = False
                
                if auth_url_reachable and token_url_reachable:
                    return {
                        "success": True,
                        "status": "configuration_valid",
                        "details": {
                            "auth_url": auth_url,
                            "token_url": token_url,
                            "note": "OAuth configuration validated. Complete OAuth flow to fully connect."
                        }
                    }
                else:
                    return {
                        "success": False,
                        "status": "unreachable",
                        "error_message": f"OAuth endpoints unreachable (auth_url: {auth_url_reachable}, token_url: {token_url_reachable})"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error_message": str(e)
            }
    
    async def _test_certificate_connection(
        self, 
        configuration: Dict[str, Any], 
        credentials: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Test Client Certificate authentication"""
        api_base_url = configuration.get("endpoint")
        cert_creds = credentials.get("certificate", {})
        
        certificate = cert_creds.get("certificate")
        private_key = cert_creds.get("private_key")
        
        if not all([api_base_url, certificate, private_key]):
            return {
                "success": False,
                "status": "configuration_error",
                "error_message": "Missing API base URL, certificate, or private key"
            }
        
        try:
            # For now, validate certificate format
            if not ("BEGIN CERTIFICATE" in certificate and "END CERTIFICATE" in certificate):
                return {
                    "success": False,
                    "status": "invalid_certificate",
                    "error_message": "Certificate must be in PEM format"
                }
            
            if not ("BEGIN" in private_key and "PRIVATE KEY" in private_key and "END" in private_key):
                return {
                    "success": False,
                    "status": "invalid_key",
                    "error_message": "Private key must be in PEM format"
                }
            
            # In production, you would actually attempt the TLS connection with the certificate
            # For now, return success if format is valid
            return {
                "success": True,
                "status": "configuration_valid",
                "details": {
                    "note": "Certificate format validated. Actual TLS connection will be tested on first use."
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error_message": str(e)
            }
    
    async def authenticate_oauth(
        self, 
        connection: PIPConnection,
        db: Session
    ) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """
        Complete OAuth authentication flow and store tokens
        
        Returns:
            Tuple of (success, error_message, token_data)
        """
        try:
            config = connection.configuration
            credentials = connection.credentials
            oauth_config = credentials.get("oauth_token", {})
            
            token_url = oauth_config.get("tokenUrl") or oauth_config.get("token_url")
            client_id = oauth_config.get("clientId") or oauth_config.get("client_id")
            client_secret = oauth_config.get("clientSecret") or oauth_config.get("client_secret")
            
            # Encode client credentials
            auth_string = f"{client_id}:{client_secret}"
            auth_bytes = auth_string.encode('ascii')
            auth_base64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                "Authorization": f"Basic {auth_base64}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            # For client credentials flow
            data = {
                "grant_type": "client_credentials",
                "scope": oauth_config.get("scopes", "")
            }
            
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(token_url, headers=headers, data=data) as response:
                    if response.status == 200:
                        token_data = await response.json()
                        
                        # Store token in database
                        oauth_token = OAuthToken(
                            connection_id=connection.id,
                            provider=connection.provider,
                            access_token=token_data.get("access_token"),
                            refresh_token=token_data.get("refresh_token"),
                            token_type=token_data.get("token_type", "Bearer"),
                            expires_at=datetime.now() + timedelta(seconds=token_data.get("expires_in", 3600)),
                            scope=oauth_config.get("scopes")
                        )
                        
                        db.add(oauth_token)
                        db.commit()
                        
                        return True, None, token_data
                    else:
                        error = await response.text()
                        return False, f"OAuth token request failed: HTTP {response.status} - {error[:200]}", None
                        
        except Exception as e:
            return False, f"OAuth authentication error: {str(e)}", None
    
    async def fetch_data(
        self, 
        connection: PIPConnection,
        endpoint_path: str = "",
        query_params: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Optional[List[Dict[str, Any]]], Optional[str]]:
        """
        Fetch data from configured PIP connection
        
        Returns:
            Tuple of (success, data, error_message)
        """
        try:
            config = connection.configuration
            credentials = connection.credentials
            auth_type = config.get("auth_type")
            
            # Build headers based on auth type
            headers = await self._build_auth_headers(connection, auth_type, credentials)
            
            # Build URL
            base_url = config.get("endpoint") or config.get("api_base_url")
            if not base_url:
                return False, None, "No API base URL configured"
            
            url = f"{base_url.rstrip('/')}/{endpoint_path.lstrip('/')}" if endpoint_path else base_url
            
            if query_params:
                url = f"{url}?{urlencode(query_params)}"
            
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url, headers=headers) as response:
                    if response.status in [200, 201]:
                        data = await response.json()
                        # Normalize data to list format
                        if isinstance(data, dict):
                            # Extract common list fields
                            data = (
                                data.get("data") or 
                                data.get("results") or 
                                data.get("items") or 
                                data.get("records") or
                                [data]  # Wrap single object
                            )
                        return True, data, None
                    else:
                        error = await response.text()
                        return False, None, f"HTTP {response.status}: {error[:200]}"
                        
        except Exception as e:
            return False, None, str(e)
    
    async def _build_auth_headers(
        self,
        connection: PIPConnection,
        auth_type: str,
        credentials: Dict[str, Any]
    ) -> Dict[str, str]:
        """Build authentication headers based on auth type"""
        headers = {"Content-Type": "application/json"}
        
        if auth_type == "api-key":
            api_key = credentials.get("api_key", {}).get("api_key") or credentials.get("api_key")
            header_name = credentials.get("api_key", {}).get("header_name", "X-API-Key")
            headers[header_name] = api_key
            
        elif auth_type == "bearer-token":
            token = credentials.get("api_key", {}).get("bearer_token") or credentials.get("api_key")
            headers["Authorization"] = f"Bearer {token}"
            
        elif auth_type == "basic":
            # Assume token was obtained during connection test
            username = credentials.get("username", {}).get("username") or credentials.get("username")
            password = credentials.get("password", {}).get("password") or credentials.get("password")
            auth_string = f"{username}:{password}"
            auth_bytes = auth_string.encode('ascii')
            auth_base64 = base64.b64encode(auth_bytes).decode('ascii')
            headers["Authorization"] = f"Basic {auth_base64}"
            
        elif auth_type == "oauth":
            # Get stored OAuth token (implementation would query OAuthToken table)
            # For now, return basic headers
            pass
            
        return headers
    
    async def sync_data(
        self,
        connection_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """
        Sync data from PIP connection to Control Core cache
        
        Returns:
            Sync result with statistics
        """
        connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            return {
                "success": False,
                "error": "Connection not found"
            }
        
        start_time = datetime.now()
        
        try:
            # Fetch data
            success, data, error = await self.fetch_data(connection)
            
            if not success:
                return {
                    "success": False,
                    "error": error,
                    "duration_seconds": (datetime.now() - start_time).total_seconds()
                }
            
            # Process and cache data (implementation would store in Redis or database)
            records_processed = len(data) if data else 0
            
            # Update connection sync status
            connection.last_sync = datetime.now()
            connection.health_status = "healthy"
            db.commit()
            
            return {
                "success": True,
                "records_processed": records_processed,
                "records_synced": records_processed,
                "records_failed": 0,
                "duration_seconds": (datetime.now() - start_time).total_seconds()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "duration_seconds": (datetime.now() - start_time).total_seconds()
            }
    
    async def discover_schema(
        self,
        connection: PIPConnection,
        sample_size: int = 5
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Auto-discover schema from connected data source
        Fetches sample data and analyzes structure
        
        Returns:
            Tuple of (success, schema_data, error_message)
        """
        try:
            # Fetch sample data
            success, data, error = await self.fetch_data(
                connection=connection,
                query_params={"limit": sample_size}
            )
            
            if not success:
                return False, None, error
            
            if not data or len(data) == 0:
                return False, None, "No data available from source to analyze schema"
            
            # Analyze first record to discover fields
            sample_record = data[0] if isinstance(data, list) else data
            schema = self._analyze_record_schema(sample_record)
            
            # Build suggested mappings based on common patterns
            suggested_mappings = self._suggest_attribute_mappings(schema, connection.connection_type.value)
            
            return True, {
                "fields": schema,
                "sample_data": data[:sample_size],
                "record_count": len(data),
                "suggested_mappings": suggested_mappings
            }, None
            
        except Exception as e:
            return False, None, f"Schema discovery error: {str(e)}"
    
    def _analyze_record_schema(self, record: Dict[str, Any], parent_path: str = "") -> List[Dict[str, Any]]:
        """Recursively analyze record structure to build schema"""
        schema = []
        
        for key, value in record.items():
            field_path = f"{parent_path}.{key}" if parent_path else key
            field_type = type(value).__name__
            
            field_info = {
                "path": field_path,
                "key": key,
                "type": self._python_type_to_schema_type(value),
                "sample_value": str(value)[:100] if value is not None else None,
                "is_sensitive": self._is_potentially_sensitive(key),
                "nullable": value is None
            }
            
            # For nested objects, recurse
            if isinstance(value, dict) and value:
                field_info["nested_fields"] = self._analyze_record_schema(value, field_path)
            elif isinstance(value, list) and value and isinstance(value[0], dict):
                field_info["array_item_schema"] = self._analyze_record_schema(value[0], field_path)
            
            schema.append(field_info)
        
        return schema
    
    def _python_type_to_schema_type(self, value: Any) -> str:
        """Convert Python type to schema type"""
        if value is None:
            return "null"
        elif isinstance(value, bool):
            return "boolean"
        elif isinstance(value, int):
            return "integer"
        elif isinstance(value, float):
            return "number"
        elif isinstance(value, str):
            return "string"
        elif isinstance(value, list):
            return "array"
        elif isinstance(value, dict):
            return "object"
        else:
            return "unknown"
    
    def _is_potentially_sensitive(self, field_name: str) -> bool:
        """Identify potentially sensitive fields"""
        sensitive_keywords = [
            'password', 'token', 'secret', 'key', 'ssn', 'social_security',
            'credit_card', 'card_number', 'cvv', 'pin', 'salary', 'compensation',
            'medical', 'health', 'diagnosis', 'prescription', 'dob', 'date_of_birth'
        ]
        field_lower = field_name.lower()
        return any(keyword in field_lower for keyword in sensitive_keywords)
    
    def _suggest_attribute_mappings(
        self, 
        schema: List[Dict[str, Any]], 
        connection_type: str
    ) -> List[Dict[str, str]]:
        """Suggest attribute mappings based on connection type and field names"""
        suggestions = []
        
        # Common mapping patterns
        mapping_patterns = {
            "iam": {
                "id": "user.id", "user_id": "user.id", "username": "user.username",
                "email": "user.email", "role": "user.role", "roles": "user.roles",
                "groups": "user.groups", "department": "user.department",
                "manager": "user.manager", "manager_id": "user.manager_id"
            },
            "hr": {
                "employee_id": "user.employee_id", "first_name": "user.first_name",
                "last_name": "user.last_name", "department": "user.department",
                "title": "user.title", "job_title": "user.job_title",
                "manager": "user.manager", "location": "user.location",
                "hire_date": "user.hire_date", "status": "user.status"
            },
            "crm": {
                "customer_id": "customer.id", "account_id": "customer.account_id",
                "company": "customer.company", "tier": "customer.tier",
                "region": "customer.region", "account_manager": "customer.owner"
            },
            "erp": {
                "cost_center": "resource.cost_center", "project_id": "resource.project_id",
                "budget": "resource.budget", "approval_status": "resource.approval_status"
            }
        }
        
        patterns = mapping_patterns.get(connection_type, {})
        
        for field in schema:
            field_key = field["key"].lower()
            # Check for exact or partial matches
            for source_key, target_key in patterns.items():
                if source_key in field_key or field_key in source_key:
                    suggestions.append({
                        "source_field": field["path"],
                        "target_attribute": target_key,
                        "confidence": "high" if source_key == field_key else "medium",
                        "type": field["type"],
                        "transformation": None
                    })
                    break
        
        return suggestions

