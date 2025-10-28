"""
PIP Connection Validators - Validate configuration for each connection type
"""

from typing import Dict, Any, List, Optional, Tuple
import re
from urllib.parse import urlparse


class PIPValidators:
    """Validators for PIP connection configurations"""
    
    @staticmethod
    def validate_url(url: str) -> Tuple[bool, Optional[str]]:
        """Validate URL format"""
        if not url:
            return False, "URL is required"
        
        try:
            result = urlparse(url)
            if not all([result.scheme, result.netloc]):
                return False, "Invalid URL format. Must include scheme (https://) and domain"
            if result.scheme not in ['http', 'https']:
                return False, "URL must use http or https protocol"
            return True, None
        except Exception as e:
            return False, f"Invalid URL: {str(e)}"
    
    @staticmethod
    def validate_iam_connection(
        config: Dict[str, Any], 
        provider: str,
        auth_type: str
    ) -> Tuple[bool, Optional[str]]:
        """Validate IAM provider configuration"""
        
        # Provider-specific validation
        if provider == "okta":
            if auth_type == "oauth":
                required_fields = ["authUrl", "tokenUrl", "clientId", "clientSecret"]
                if not all(config.get(f) for f in required_fields):
                    return False, "Okta OAuth requires authUrl, tokenUrl, clientId, and clientSecret"
            elif auth_type in ["api-key", "bearer-token"]:
                endpoint = config.get("endpoint")
                if not endpoint:
                    return False, "Okta API requires endpoint URL"
                if ".okta.com" not in endpoint:
                    return False, "Okta endpoint should contain '.okta.com' domain"
                    
        elif provider == "azure_ad":
            if auth_type == "oauth":
                tenant_id = config.get("tenant_id") or config.get("endpoint")
                if not tenant_id:
                    return False, "Azure AD requires tenant ID"
                    
        elif provider == "auth0":
            if auth_type == "oauth":
                domain = config.get("domain") or config.get("endpoint")
                if not domain:
                    return False, "Auth0 requires domain"
                if ".auth0.com" not in domain and ".us.auth0.com" not in domain:
                    return False, "Auth0 domain should contain '.auth0.com'"
        
        return True, None
    
    @staticmethod
    def validate_hr_connection(
        config: Dict[str, Any], 
        provider: str,
        auth_type: str
    ) -> Tuple[bool, Optional[str]]:
        """Validate HR system configuration"""
        
        if provider == "workday":
            tenant = config.get("tenant") or config.get("endpoint")
            if not tenant:
                return False, "Workday requires tenant URL"
                
        elif provider == "bamboohr":
            subdomain = config.get("subdomain") or config.get("endpoint")
            if not subdomain:
                return False, "BambooHR requires subdomain"
                
        elif provider == "adp":
            if auth_type == "oauth":
                required = ["authUrl", "tokenUrl", "clientId", "clientSecret"]
                if not all(config.get(f) for f in required):
                    return False, "ADP OAuth requires all OAuth configuration fields"
        
        return True, None
    
    @staticmethod
    def validate_crm_connection(
        config: Dict[str, Any], 
        provider: str,
        auth_type: str
    ) -> Tuple[bool, Optional[str]]:
        """Validate CRM system configuration"""
        
        if provider == "salesforce":
            if auth_type == "oauth":
                instance = config.get("instance") or config.get("endpoint")
                if not instance:
                    return False, "Salesforce requires instance URL"
                if ".salesforce.com" not in instance:
                    return False, "Salesforce instance should contain '.salesforce.com'"
                    
        elif provider == "hubspot":
            if auth_type == "oauth":
                required = ["authUrl", "tokenUrl", "clientId", "clientSecret"]
                if not all(config.get(f) for f in required):
                    return False, "HubSpot OAuth requires all OAuth fields"
            elif auth_type in ["api-key", "bearer-token"]:
                if not config.get("endpoint"):
                    return False, "HubSpot requires API endpoint"
        
        return True, None
    
    @staticmethod
    def validate_erp_connection(
        config: Dict[str, Any], 
        provider: str,
        auth_type: str
    ) -> Tuple[bool, Optional[str]]:
        """Validate ERP system configuration"""
        
        if provider == "sap":
            endpoint = config.get("endpoint")
            if not endpoint:
                return False, "SAP requires API endpoint"
            if auth_type == "certificate":
                # SAP often requires certificate auth
                cert_data = config.get("credentials", {}).get("certificate", {})
                if not cert_data.get("certificate"):
                    return False, "SAP certificate authentication requires certificate"
                    
        elif provider == "oracle_erp":
            endpoint = config.get("endpoint")
            if not endpoint:
                return False, "Oracle ERP requires API endpoint"
                
        elif provider == "netsuite":
            if auth_type == "oauth":
                account_id = config.get("account_id")
                if not account_id:
                    return False, "NetSuite OAuth requires account ID"
        
        return True, None
    
    @staticmethod
    def validate_database_connection(
        config: Dict[str, Any],
        db_config: Dict[str, Any]
    ) -> Tuple[bool, Optional[str]]:
        """Validate database connection configuration"""
        
        required_fields = ["host", "database", "username", "password"]
        missing_fields = [f for f in required_fields if not db_config.get(f)]
        
        if missing_fields:
            return False, f"Missing required database fields: {', '.join(missing_fields)}"
        
        # Validate port if provided
        port = db_config.get("port")
        if port:
            try:
                port_num = int(port)
                if port_num < 1 or port_num > 65535:
                    return False, "Port must be between 1 and 65535"
            except ValueError:
                return False, "Port must be a valid number"
        
        return True, None
    
    @staticmethod
    def validate_warehouse_connection(
        config: Dict[str, Any],
        db_config: Dict[str, Any],
        provider: str
    ) -> Tuple[bool, Optional[str]]:
        """Validate data warehouse connection configuration"""
        
        if provider == "snowflake":
            required = ["account", "database"]
            missing = [f for f in required if not (db_config.get(f) or config.get(f))]
            if missing:
                return False, f"Snowflake requires: {', '.join(missing)}"
                
        elif provider == "bigquery":
            project_id = config.get("project_id") or db_config.get("project_id")
            if not project_id:
                return False, "BigQuery requires project_id"
                
        elif provider == "databricks":
            workspace_url = config.get("workspace_url") or config.get("endpoint")
            if not workspace_url:
                return False, "Databricks requires workspace URL"
        
        return True, None
    
    @staticmethod
    def validate_cloud_connection(
        config: Dict[str, Any],
        provider: str
    ) -> Tuple[bool, Optional[str]]:
        """Validate cloud provider connection configuration"""
        
        if provider == "aws":
            access_key = config.get("access_key_id") or config.get("username")
            secret_key = config.get("secret_access_key") or config.get("password")
            region = config.get("region") or config.get("endpoint")
            
            if not all([access_key, secret_key, region]):
                return False, "AWS requires access_key_id, secret_access_key, and region"
                
        elif provider == "azure":
            subscription_id = config.get("subscription_id")
            tenant_id = config.get("tenant_id")
            
            if not all([subscription_id, tenant_id]):
                return False, "Azure requires subscription_id and tenant_id"
                
        elif provider == "gcp":
            project_id = config.get("project_id")
            if not project_id:
                return False, "GCP requires project_id"
        
        return True, None
    
    @staticmethod
    def validate_api_connection(
        config: Dict[str, Any],
        auth_type: str
    ) -> Tuple[bool, Optional[str]]:
        """Validate custom API connection configuration"""
        
        endpoint = config.get("endpoint")
        if not endpoint:
            return False, "API endpoint is required"
        
        # Validate URL
        valid, error = PIPValidators.validate_url(endpoint)
        if not valid:
            return False, error
        
        # Validate auth-specific requirements
        if auth_type == "oauth":
            required = ["authUrl", "tokenUrl", "clientId", "clientSecret"]
            missing = [f for f in required if not config.get(f)]
            if missing:
                return False, f"OAuth requires: {', '.join(missing)}"
        
        return True, None
    
    @staticmethod
    def validate_configuration(
        connection_type: str,
        provider: str,
        auth_type: str,
        configuration: Dict[str, Any],
        credentials: Dict[str, Any]
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate complete PIP connection configuration
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        
        # Route to specific validator based on connection type
        if connection_type == "iam" or connection_type == "identity":
            return PIPValidators.validate_iam_connection(configuration, provider, auth_type)
            
        elif connection_type == "hr":
            return PIPValidators.validate_hr_connection(configuration, provider, auth_type)
            
        elif connection_type == "crm":
            return PIPValidators.validate_crm_connection(configuration, provider, auth_type)
            
        elif connection_type == "erp":
            return PIPValidators.validate_erp_connection(configuration, provider, auth_type)
            
        elif connection_type == "database":
            db_config = configuration.get("dbConfig", {})
            return PIPValidators.validate_database_connection(configuration, db_config)
            
        elif connection_type == "warehouse":
            db_config = configuration.get("dbConfig", {})
            return PIPValidators.validate_warehouse_connection(configuration, db_config, provider)
            
        elif connection_type == "cloud":
            return PIPValidators.validate_cloud_connection(configuration, provider)
            
        elif connection_type == "api":
            return PIPValidators.validate_api_connection(configuration, auth_type)
        
        # Default: basic validation
        return True, None

