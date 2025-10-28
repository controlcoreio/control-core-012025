"""
Schema Introspection Service for Control Core PIP
Discovers and analyzes data schemas from various data sources
"""

import asyncio
import aiohttp
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

from app.models import PIPConnection
from app.connectors.iam_connector import IAMConnectorFactory
from app.connectors.database_connector import DatabaseConnectorFactory
from .openapi_parser import openapi_service

logger = logging.getLogger(__name__)

@dataclass
class Field:
    """Represents a data field with metadata"""
    name: str
    type: str
    description: Optional[str] = None
    required: bool = False
    nullable: bool = True
    default_value: Optional[Any] = None
    enum_values: Optional[List[str]] = None
    format: Optional[str] = None
    example: Optional[Any] = None
    sensitivity: str = "internal"  # public, internal, confidential, restricted

class SchemaIntrospectionService:
    """Service for discovering and analyzing data schemas from various sources"""
    
    def __init__(self):
        self.cache: Dict[str, Dict[str, List[Field]]] = {}
        self.cache_ttl = 3600  # 1 hour
    
    async def discover_iam_schema(self, connection: PIPConnection) -> Dict[str, List[Field]]:
        """Discover IAM provider schema (users, groups, roles)"""
        try:
            # Get credentials from secrets service
            from .secrets_service import secrets_service
            credentials = secrets_service.get_secret(connection.id, "credentials")
            
            # Create IAM connector
            connector = IAMConnectorFactory.create_connector(
                connection.provider, 
                connection.id, 
                connection.configuration, 
                credentials
            )
            
            schema = {}
            
            if connection.provider == "okta":
                schema = await self._discover_okta_schema(connector)
            elif connection.provider == "azure_ad":
                schema = await self._discover_azure_ad_schema(connector)
            elif connection.provider == "auth0":
                schema = await self._discover_auth0_schema(connector)
            elif connection.provider == "ldap":
                schema = await self._discover_ldap_schema(connector)
            else:
                schema = await self._discover_generic_iam_schema(connector)
            
            # Cache the schema
            cache_key = f"iam_{connection.provider}_{connection.id}"
            self.cache[cache_key] = schema
            
            return schema
            
        except Exception as e:
            logger.error(f"Failed to discover IAM schema for {connection.provider}: {e}")
            return self._get_fallback_iam_schema(connection.provider)
    
    async def _discover_okta_schema(self, connector) -> Dict[str, List[Field]]:
        """Discover Okta-specific schema"""
        try:
            # Get user schema from Okta
            user_schema = await connector.get_user_schema()
            group_schema = await connector.get_group_schema()
            
            return {
                "users": self._parse_okta_user_schema(user_schema),
                "groups": self._parse_okta_group_schema(group_schema)
            }
        except Exception as e:
            logger.error(f"Failed to discover Okta schema: {e}")
            return self._get_fallback_iam_schema("okta")
    
    async def _discover_azure_ad_schema(self, connector) -> Dict[str, List[Field]]:
        """Discover Azure AD-specific schema"""
        try:
            # Get Microsoft Graph schema
            user_schema = await connector.get_user_schema()
            group_schema = await connector.get_group_schema()
            
            return {
                "users": self._parse_azure_user_schema(user_schema),
                "groups": self._parse_azure_group_schema(group_schema)
            }
        except Exception as e:
            logger.error(f"Failed to discover Azure AD schema: {e}")
            return self._get_fallback_iam_schema("azure_ad")
    
    async def _discover_auth0_schema(self, connector) -> Dict[str, List[Field]]:
        """Discover Auth0-specific schema"""
        try:
            # Get Auth0 Management API schema
            user_schema = await connector.get_user_schema()
            
            return {
                "users": self._parse_auth0_user_schema(user_schema),
                "groups": self._get_fallback_group_schema()
            }
        except Exception as e:
            logger.error(f"Failed to discover Auth0 schema: {e}")
            return self._get_fallback_iam_schema("auth0")
    
    async def _discover_ldap_schema(self, connector) -> Dict[str, List[Field]]:
        """Discover LDAP-specific schema"""
        try:
            # Get LDAP schema
            user_schema = await connector.get_user_schema()
            group_schema = await connector.get_group_schema()
            
            return {
                "users": self._parse_ldap_user_schema(user_schema),
                "groups": self._parse_ldap_group_schema(group_schema)
            }
        except Exception as e:
            logger.error(f"Failed to discover LDAP schema: {e}")
            return self._get_fallback_iam_schema("ldap")
    
    async def _discover_generic_iam_schema(self, connector) -> Dict[str, List[Field]]:
        """Discover generic IAM schema"""
        try:
            user_schema = await connector.get_user_schema()
            return {
                "users": self._parse_generic_user_schema(user_schema),
                "groups": self._get_fallback_group_schema()
            }
        except Exception as e:
            logger.error(f"Failed to discover generic IAM schema: {e}")
            return self._get_fallback_iam_schema("generic")
    
    def _parse_okta_user_schema(self, schema_data: Dict) -> List[Field]:
        """Parse Okta user schema"""
        fields = []
        
        # Standard Okta user fields
        standard_fields = [
            Field("id", "string", "User ID", True, False, sensitivity="internal"),
            Field("email", "string", "Email address", True, False, sensitivity="internal"),
            Field("firstName", "string", "First name", False, True, sensitivity="internal"),
            Field("lastName", "string", "Last name", False, True, sensitivity="internal"),
            Field("displayName", "string", "Display name", False, True, sensitivity="public"),
            Field("login", "string", "Login name", True, False, sensitivity="internal"),
            Field("status", "string", "User status", True, False, enum_values=["ACTIVE", "INACTIVE", "LOCKED_OUT", "PASSWORD_EXPIRED", "SUSPENDED"], sensitivity="internal"),
            Field("created", "datetime", "Creation date", False, True, sensitivity="internal"),
            Field("lastLogin", "datetime", "Last login date", False, True, sensitivity="confidential"),
            Field("lastUpdated", "datetime", "Last update date", False, True, sensitivity="internal"),
            Field("activated", "datetime", "Activation date", False, True, sensitivity="internal"),
            Field("statusChanged", "datetime", "Status change date", False, True, sensitivity="internal"),
            Field("passwordChanged", "datetime", "Password change date", False, True, sensitivity="restricted"),
            Field("profile", "object", "User profile", False, True, sensitivity="internal"),
            Field("credentials", "object", "User credentials", False, True, sensitivity="restricted"),
            Field("_links", "object", "Resource links", False, True, sensitivity="internal")
        ]
        
        fields.extend(standard_fields)
        
        # Add custom attributes if present
        if "definitions" in schema_data and "custom" in schema_data["definitions"]:
            custom_props = schema_data["definitions"]["custom"].get("properties", {})
            for prop_name, prop_def in custom_props.items():
                fields.append(Field(
                    name=f"customAttributes.{prop_name}",
                    type=prop_def.get("type", "string"),
                    description=prop_def.get("description", f"Custom attribute: {prop_name}"),
                    required=prop_name in schema_data["definitions"]["custom"].get("required", []),
                    nullable=not prop_def.get("required", False),
                    sensitivity="internal"
                ))
        
        return fields
    
    def _parse_azure_user_schema(self, schema_data: Dict) -> List[Field]:
        """Parse Azure AD user schema"""
        fields = []
        
        # Standard Azure AD user fields
        standard_fields = [
            Field("id", "string", "User ID", True, False, sensitivity="internal"),
            Field("userPrincipalName", "string", "User principal name", True, False, sensitivity="internal"),
            Field("mail", "string", "Email address", False, True, sensitivity="internal"),
            Field("displayName", "string", "Display name", False, True, sensitivity="public"),
            Field("givenName", "string", "Given name", False, True, sensitivity="internal"),
            Field("surname", "string", "Surname", False, True, sensitivity="internal"),
            Field("jobTitle", "string", "Job title", False, True, sensitivity="internal"),
            Field("department", "string", "Department", False, True, sensitivity="internal"),
            Field("officeLocation", "string", "Office location", False, True, sensitivity="internal"),
            Field("businessPhones", "array", "Business phone numbers", False, True, sensitivity="internal"),
            Field("mobilePhone", "string", "Mobile phone", False, True, sensitivity="confidential"),
            Field("accountEnabled", "boolean", "Account enabled", True, False, sensitivity="internal"),
            Field("createdDateTime", "datetime", "Creation date", False, True, sensitivity="internal"),
            Field("lastSignInDateTime", "datetime", "Last sign-in date", False, True, sensitivity="confidential"),
            Field("signInActivity", "object", "Sign-in activity", False, True, sensitivity="restricted"),
            Field("assignedLicenses", "array", "Assigned licenses", False, True, sensitivity="internal"),
            Field("assignedPlans", "array", "Assigned plans", False, True, sensitivity="internal"),
            Field("onPremisesSyncEnabled", "boolean", "On-premises sync enabled", False, True, sensitivity="internal"),
            Field("onPremisesLastSyncDateTime", "datetime", "Last on-premises sync", False, True, sensitivity="internal"),
            Field("preferredLanguage", "string", "Preferred language", False, True, sensitivity="internal"),
            Field("usageLocation", "string", "Usage location", False, True, sensitivity="internal"),
            Field("userType", "string", "User type", False, True, enum_values=["Member", "Guest"], sensitivity="internal")
        ]
        
        fields.extend(standard_fields)
        
        # Add extension attributes if present
        if "extensions" in schema_data:
            for ext_name, ext_def in schema_data["extensions"].items():
                fields.append(Field(
                    name=f"extensionAttributes.{ext_name}",
                    type=ext_def.get("type", "string"),
                    description=ext_def.get("description", f"Extension attribute: {ext_name}"),
                    required=ext_def.get("required", False),
                    nullable=not ext_def.get("required", False),
                    sensitivity="internal"
                ))
        
        return fields
    
    def _parse_auth0_user_schema(self, schema_data: Dict) -> List[Field]:
        """Parse Auth0 user schema"""
        fields = []
        
        # Standard Auth0 user fields
        standard_fields = [
            Field("user_id", "string", "User ID", True, False, sensitivity="internal"),
            Field("email", "string", "Email address", False, True, sensitivity="internal"),
            Field("email_verified", "boolean", "Email verified", False, True, sensitivity="internal"),
            Field("username", "string", "Username", False, True, sensitivity="internal"),
            Field("phone_number", "string", "Phone number", False, True, sensitivity="confidential"),
            Field("phone_verified", "boolean", "Phone verified", False, True, sensitivity="internal"),
            Field("created_at", "datetime", "Creation date", False, True, sensitivity="internal"),
            Field("updated_at", "datetime", "Update date", False, True, sensitivity="internal"),
            Field("identities", "array", "User identities", False, True, sensitivity="internal"),
            Field("app_metadata", "object", "Application metadata", False, True, sensitivity="internal"),
            Field("user_metadata", "object", "User metadata", False, True, sensitivity="internal"),
            Field("picture", "string", "Profile picture URL", False, True, sensitivity="public"),
            Field("name", "string", "Full name", False, True, sensitivity="internal"),
            Field("nickname", "string", "Nickname", False, True, sensitivity="public"),
            Field("given_name", "string", "Given name", False, True, sensitivity="internal"),
            Field("family_name", "string", "Family name", False, True, sensitivity="internal"),
            Field("last_login", "datetime", "Last login date", False, True, sensitivity="confidential"),
            Field("last_ip", "string", "Last IP address", False, True, sensitivity="restricted"),
            Field("logins_count", "integer", "Login count", False, True, sensitivity="confidential"),
            Field("blocked", "boolean", "User blocked", False, True, sensitivity="internal")
        ]
        
        fields.extend(standard_fields)
        
        return fields
    
    def _parse_ldap_user_schema(self, schema_data: Dict) -> List[Field]:
        """Parse LDAP user schema"""
        fields = []
        
        # Standard LDAP user fields
        standard_fields = [
            Field("dn", "string", "Distinguished name", True, False, sensitivity="internal"),
            Field("uid", "string", "User ID", True, False, sensitivity="internal"),
            Field("cn", "string", "Common name", True, False, sensitivity="internal"),
            Field("sn", "string", "Surname", False, True, sensitivity="internal"),
            Field("givenName", "string", "Given name", False, True, sensitivity="internal"),
            Field("displayName", "string", "Display name", False, True, sensitivity="public"),
            Field("mail", "string", "Email address", False, True, sensitivity="internal"),
            Field("userPrincipalName", "string", "User principal name", False, True, sensitivity="internal"),
            Field("sAMAccountName", "string", "SAM account name", False, True, sensitivity="internal"),
            Field("memberOf", "array", "Group memberships", False, True, sensitivity="internal"),
            Field("department", "string", "Department", False, True, sensitivity="internal"),
            Field("title", "string", "Job title", False, True, sensitivity="internal"),
            Field("telephoneNumber", "string", "Telephone number", False, True, sensitivity="internal"),
            Field("mobile", "string", "Mobile number", False, True, sensitivity="confidential"),
            Field("streetAddress", "string", "Street address", False, True, sensitivity="confidential"),
            Field("l", "string", "City", False, True, sensitivity="internal"),
            Field("st", "string", "State", False, True, sensitivity="internal"),
            Field("postalCode", "string", "Postal code", False, True, sensitivity="confidential"),
            Field("c", "string", "Country", False, True, sensitivity="internal"),
            Field("company", "string", "Company", False, True, sensitivity="internal"),
            Field("manager", "string", "Manager DN", False, True, sensitivity="internal"),
            Field("userAccountControl", "integer", "User account control flags", False, True, sensitivity="internal"),
            Field("lastLogon", "datetime", "Last logon", False, True, sensitivity="confidential"),
            Field("lastLogonTimestamp", "datetime", "Last logon timestamp", False, True, sensitivity="confidential"),
            Field("whenCreated", "datetime", "Creation date", False, True, sensitivity="internal"),
            Field("whenChanged", "datetime", "Last change date", False, True, sensitivity="internal"),
            Field("pwdLastSet", "datetime", "Password last set", False, True, sensitivity="restricted"),
            Field("accountExpires", "datetime", "Account expiration", False, True, sensitivity="internal"),
            Field("badPwdCount", "integer", "Bad password count", False, True, sensitivity="restricted"),
            Field("lockoutTime", "datetime", "Lockout time", False, True, sensitivity="restricted")
        ]
        
        fields.extend(standard_fields)
        
        return fields
    
    def _parse_generic_user_schema(self, schema_data: Dict) -> List[Field]:
        """Parse generic user schema"""
        fields = []
        
        # Generic user fields
        generic_fields = [
            Field("id", "string", "User ID", True, False, sensitivity="internal"),
            Field("email", "string", "Email address", False, True, sensitivity="internal"),
            Field("name", "string", "Full name", False, True, sensitivity="internal"),
            Field("username", "string", "Username", False, True, sensitivity="internal"),
            Field("active", "boolean", "User active", False, True, sensitivity="internal"),
            Field("created_at", "datetime", "Creation date", False, True, sensitivity="internal"),
            Field("updated_at", "datetime", "Update date", False, True, sensitivity="internal"),
            Field("last_login", "datetime", "Last login", False, True, sensitivity="confidential"),
            Field("roles", "array", "User roles", False, True, sensitivity="internal"),
            Field("groups", "array", "User groups", False, True, sensitivity="internal"),
            Field("attributes", "object", "Custom attributes", False, True, sensitivity="internal")
        ]
        
        fields.extend(generic_fields)
        
        return fields
    
    def _get_fallback_group_schema(self) -> List[Field]:
        """Get fallback group schema"""
        return [
            Field("id", "string", "Group ID", True, False, sensitivity="internal"),
            Field("name", "string", "Group name", True, False, sensitivity="internal"),
            Field("description", "string", "Group description", False, True, sensitivity="internal"),
            Field("members", "array", "Group members", False, True, sensitivity="internal"),
            Field("created_at", "datetime", "Creation date", False, True, sensitivity="internal"),
            Field("updated_at", "datetime", "Update date", False, True, sensitivity="internal")
        ]
    
    def _get_fallback_iam_schema(self, provider: str) -> Dict[str, List[Field]]:
        """Get fallback IAM schema for a provider"""
        return {
            "users": self._parse_generic_user_schema({}),
            "groups": self._get_fallback_group_schema()
        }
    
    async def discover_database_schema(self, connection: PIPConnection) -> Dict[str, List[Field]]:
        """Discover database schema (tables, columns, relationships)"""
        try:
            # Get credentials from secrets service
            from .secrets_service import secrets_service
            credentials = secrets_service.get_secret(connection.id, "credentials")
            
            # Create database connector
            connector = DatabaseConnectorFactory.create_connector(
                connection.provider,
                connection.id,
                connection.configuration,
                credentials
            )
            
            # Get database schema
            schema_info = await connector.get_schema_info()
            
            # Parse schema into fields
            tables = []
            columns = []
            
            for table_name, table_info in schema_info.get("tables", {}).items():
                tables.append(Field(
                    name=table_name,
                    type="table",
                    description=table_info.get("comment", f"Table: {table_name}"),
                    required=True,
                    nullable=False,
                    sensitivity="internal"
                ))
                
                for column_name, column_info in table_info.get("columns", {}).items():
                    columns.append(Field(
                        name=f"{table_name}.{column_name}",
                        type=column_info.get("type", "string"),
                        description=column_info.get("comment", f"Column: {column_name}"),
                        required=column_info.get("nullable", True) == False,
                        nullable=column_info.get("nullable", True),
                        default_value=column_info.get("default"),
                        sensitivity=self._determine_column_sensitivity(column_name, column_info)
                    ))
            
            schema = {
                "tables": tables,
                "columns": columns
            }
            
            # Cache the schema
            cache_key = f"db_{connection.provider}_{connection.id}"
            self.cache[cache_key] = schema
            
            return schema
            
        except Exception as e:
            logger.error(f"Failed to discover database schema for {connection.provider}: {e}")
            return self._get_fallback_database_schema()
    
    def _determine_column_sensitivity(self, column_name: str, column_info: Dict) -> str:
        """Determine column sensitivity based on name and type"""
        sensitive_columns = [
            "password", "passwd", "pwd", "secret", "token", "key", "auth",
            "ssn", "social_security", "credit_card", "card_number",
            "phone", "mobile", "address", "zip", "postal"
        ]
        
        column_lower = column_name.lower()
        for sensitive in sensitive_columns:
            if sensitive in column_lower:
                return "restricted"
        
        if column_info.get("type", "").lower() in ["password", "secret", "encrypted"]:
            return "restricted"
        
        return "internal"
    
    def _get_fallback_database_schema(self) -> Dict[str, List[Field]]:
        """Get fallback database schema"""
        return {
            "tables": [
                Field("users", "table", "Users table", True, False, sensitivity="internal"),
                Field("groups", "table", "Groups table", True, False, sensitivity="internal"),
                Field("resources", "table", "Resources table", True, False, sensitivity="internal")
            ],
            "columns": [
                Field("users.id", "string", "User ID", True, False, sensitivity="internal"),
                Field("users.email", "string", "User email", True, False, sensitivity="internal"),
                Field("users.name", "string", "User name", False, True, sensitivity="internal"),
                Field("users.created_at", "datetime", "Creation date", False, True, sensitivity="internal"),
                Field("groups.id", "string", "Group ID", True, False, sensitivity="internal"),
                Field("groups.name", "string", "Group name", True, False, sensitivity="internal"),
                Field("resources.id", "string", "Resource ID", True, False, sensitivity="internal"),
                Field("resources.name", "string", "Resource name", True, False, sensitivity="internal"),
                Field("resources.owner_id", "string", "Resource owner", False, True, sensitivity="internal")
            ]
        }
    
    async def discover_api_schema(self, connection: PIPConnection) -> Dict[str, List[Field]]:
        """Discover API schema (endpoints, models, security)"""
        try:
            # Get OpenAPI spec from connection
            spec_url = connection.configuration.get("spec_url")
            spec_content = connection.configuration.get("spec_content")
            
            if spec_url:
                # Fetch OpenAPI spec from URL
                async with aiohttp.ClientSession() as session:
                    async with session.get(spec_url) as response:
                        if response.status == 200:
                            spec_content = await response.text()
            
            if not spec_content:
                return self._get_fallback_api_schema()
            
            # Parse OpenAPI spec
            api_schema = await openapi_service.parse_openapi_spec(spec_content)
            
            # Convert to field format
            endpoints = []
            models = []
            
            for path, methods in api_schema.get("paths", {}).items():
                for method, operation in methods.items():
                    endpoints.append(Field(
                        name=f"{method.upper()} {path}",
                        type="endpoint",
                        description=operation.get("summary", f"{method.upper()} {path}"),
                        required=True,
                        nullable=False,
                        sensitivity="internal"
                    ))
            
            for model_name, model_def in api_schema.get("components", {}).get("schemas", {}).items():
                for prop_name, prop_def in model_def.get("properties", {}).items():
                    models.append(Field(
                        name=f"{model_name}.{prop_name}",
                        type=prop_def.get("type", "string"),
                        description=prop_def.get("description", f"Property: {prop_name}"),
                        required=prop_name in model_def.get("required", []),
                        nullable=not prop_def.get("required", False),
                        enum_values=prop_def.get("enum"),
                        format=prop_def.get("format"),
                        example=prop_def.get("example"),
                        sensitivity="internal"
                    ))
            
            schema = {
                "endpoints": endpoints,
                "models": models
            }
            
            # Cache the schema
            cache_key = f"api_{connection.provider}_{connection.id}"
            self.cache[cache_key] = schema
            
            return schema
            
        except Exception as e:
            logger.error(f"Failed to discover API schema for {connection.provider}: {e}")
            return self._get_fallback_api_schema()
    
    def _get_fallback_api_schema(self) -> Dict[str, List[Field]]:
        """Get fallback API schema"""
        return {
            "endpoints": [
                Field("GET /users", "endpoint", "Get users", True, False, sensitivity="internal"),
                Field("POST /users", "endpoint", "Create user", True, False, sensitivity="internal"),
                Field("GET /users/{id}", "endpoint", "Get user by ID", True, False, sensitivity="internal"),
                Field("PUT /users/{id}", "endpoint", "Update user", True, False, sensitivity="internal"),
                Field("DELETE /users/{id}", "endpoint", "Delete user", True, False, sensitivity="internal")
            ],
            "models": [
                Field("User.id", "string", "User ID", True, False, sensitivity="internal"),
                Field("User.email", "string", "User email", True, False, sensitivity="internal"),
                Field("User.name", "string", "User name", False, True, sensitivity="internal"),
                Field("User.created_at", "datetime", "Creation date", False, True, sensitivity="internal")
            ]
        }
    
    async def get_cached_schema(self, connection: PIPConnection) -> Optional[Dict[str, List[Field]]]:
        """Get cached schema for a connection"""
        cache_key = f"{connection.connection_type}_{connection.provider}_{connection.id}"
        return self.cache.get(cache_key)
    
    def clear_schema_cache(self, connection_id: Optional[int] = None):
        """Clear schema cache for a connection or all connections"""
        if connection_id:
            # Clear cache for specific connection
            keys_to_remove = [key for key in self.cache.keys() if f"_{connection_id}" in key]
            for key in keys_to_remove:
                del self.cache[key]
        else:
            # Clear all cache
            self.cache.clear()

# Global instance
schema_introspection_service = SchemaIntrospectionService()
