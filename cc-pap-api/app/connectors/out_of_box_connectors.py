"""
Out-of-Box Connectors for Control Core PIP System
Pre-configured connectors for major IAM, ERP, CRM, and MCP systems
"""

import asyncio
import aiohttp
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

class ConnectorType(str, Enum):
    IAM = "iam"
    ERP = "erp"
    CRM = "crm"
    MCP = "mcp"
    CUSTOM = "custom"

class ConnectorStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PENDING = "pending"

@dataclass
class ConnectorConfig:
    name: str
    type: ConnectorType
    provider: str
    version: str
    description: str
    base_url: str
    auth_type: str
    required_credentials: List[str]
    optional_credentials: List[str]
    default_attributes: List[str]
    rate_limits: Dict[str, int]
    timeout: int
    retry_attempts: int
    cache_ttl: int
    sensitive_attributes: List[str]
    transformation_rules: Dict[str, Any]

class OutOfBoxConnectors:
    """Pre-configured connectors for major enterprise systems"""
    
    def __init__(self):
        self.connectors = self._initialize_connectors()
    
    def _initialize_connectors(self) -> Dict[str, ConnectorConfig]:
        """Initialize all out-of-box connectors"""
        
        return {
            # IAM Connectors
            "auth0": ConnectorConfig(
                name="Auth0",
                type=ConnectorType.IAM,
                provider="auth0",
                version="2.0",
                description="Auth0 identity and access management platform",
                base_url="https://{domain}.auth0.com/api/v2",
                auth_type="bearer_token",
                required_credentials=["domain", "client_id", "client_secret"],
                optional_credentials=["audience", "scope"],
                default_attributes=[
                    "user.id", "user.email", "user.name", "user.roles", 
                    "user.permissions", "user.metadata", "user.app_metadata"
                ],
                rate_limits={"requests_per_minute": 1000, "burst_limit": 100},
                timeout=30,
                retry_attempts=3,
                cache_ttl=300,
                sensitive_attributes=["user.metadata", "user.app_metadata", "user.permissions"],
                transformation_rules={
                    "user.roles": {"type": "array", "default": []},
                    "user.permissions": {"type": "array", "default": []},
                    "user.metadata": {"type": "object", "encrypt": True}
                }
            ),
            
            "okta": ConnectorConfig(
                name="Okta",
                type=ConnectorType.IAM,
                provider="okta",
                version="1.0",
                description="Okta identity and access management",
                base_url="https://{domain}.okta.com/api/v1",
                auth_type="api_token",
                required_credentials=["domain", "api_token"],
                optional_credentials=["org_url"],
                default_attributes=[
                    "user.id", "user.email", "user.name", "user.groups", 
                    "user.apps", "user.profile", "user.status"
                ],
                rate_limits={"requests_per_minute": 600, "burst_limit": 50},
                timeout=30,
                retry_attempts=3,
                cache_ttl=600,
                sensitive_attributes=["user.profile", "user.groups"],
                transformation_rules={
                    "user.groups": {"type": "array", "default": []},
                    "user.apps": {"type": "array", "default": []},
                    "user.profile": {"type": "object", "encrypt": True}
                }
            ),
            
            "azure_ad": ConnectorConfig(
                name="Azure Active Directory",
                type=ConnectorType.IAM,
                provider="azure_ad",
                version="1.0",
                description="Microsoft Azure Active Directory",
                base_url="https://graph.microsoft.com/v1.0",
                auth_type="oauth2",
                required_credentials=["tenant_id", "client_id", "client_secret"],
                optional_credentials=["scope"],
                default_attributes=[
                    "user.id", "user.email", "user.name", "user.groups", 
                    "user.roles", "user.department", "user.job_title"
                ],
                rate_limits={"requests_per_minute": 10000, "burst_limit": 200},
                timeout=30,
                retry_attempts=3,
                cache_ttl=900,
                sensitive_attributes=["user.groups", "user.roles"],
                transformation_rules={
                    "user.groups": {"type": "array", "default": []},
                    "user.roles": {"type": "array", "default": []},
                    "user.department": {"type": "string", "default": ""}
                }
            ),
            
            "aws_iam": ConnectorConfig(
                name="AWS IAM",
                type=ConnectorType.IAM,
                provider="aws_iam",
                version="1.0",
                description="Amazon Web Services Identity and Access Management",
                base_url="https://iam.amazonaws.com",
                auth_type="aws_signature",
                required_credentials=["access_key_id", "secret_access_key", "region"],
                optional_credentials=["session_token"],
                default_attributes=[
                    "user.id", "user.name", "user.arn", "user.groups", 
                    "user.policies", "user.tags", "user.last_login"
                ],
                rate_limits={"requests_per_second": 5, "burst_limit": 10},
                timeout=30,
                retry_attempts=3,
                cache_ttl=1800,
                sensitive_attributes=["user.policies", "user.tags"],
                transformation_rules={
                    "user.groups": {"type": "array", "default": []},
                    "user.policies": {"type": "array", "encrypt": True},
                    "user.tags": {"type": "object", "encrypt": True}
                }
            ),
            
            # ERP Connectors
            "sap": ConnectorConfig(
                name="SAP ERP",
                type=ConnectorType.ERP,
                provider="sap",
                version="1.0",
                description="SAP Enterprise Resource Planning system",
                base_url="https://{host}:{port}/sap/bc/odata/v2",
                auth_type="basic_auth",
                required_credentials=["host", "port", "username", "password", "client"],
                optional_credentials=["language", "system_id"],
                default_attributes=[
                    "employee.id", "employee.name", "employee.email", 
                    "employee.department", "employee.job_title", "employee.manager",
                    "employee.location", "employee.cost_center"
                ],
                rate_limits={"requests_per_minute": 100, "burst_limit": 20},
                timeout=60,
                retry_attempts=2,
                cache_ttl=3600,
                sensitive_attributes=["employee.salary", "employee.benefits"],
                transformation_rules={
                    "employee.department": {"type": "string", "default": ""},
                    "employee.job_title": {"type": "string", "default": ""},
                    "employee.manager": {"type": "string", "default": ""}
                }
            ),
            
            "oracle": ConnectorConfig(
                name="Oracle ERP Cloud",
                type=ConnectorType.ERP,
                provider="oracle",
                version="1.0",
                description="Oracle Cloud ERP system",
                base_url="https://{instance}.oraclecloud.com/fscmRestApi/resources/11.13.18.05",
                auth_type="oauth2",
                required_credentials=["instance", "username", "password", "client_id", "client_secret"],
                optional_credentials=["scope"],
                default_attributes=[
                    "employee.id", "employee.name", "employee.email", 
                    "employee.department", "employee.job_title", "employee.manager",
                    "employee.location", "employee.hire_date"
                ],
                rate_limits={"requests_per_minute": 200, "burst_limit": 30},
                timeout=45,
                retry_attempts=3,
                cache_ttl=1800,
                sensitive_attributes=["employee.salary", "employee.benefits"],
                transformation_rules={
                    "employee.department": {"type": "string", "default": ""},
                    "employee.job_title": {"type": "string", "default": ""},
                    "employee.hire_date": {"type": "datetime", "format": "ISO"}
                }
            ),
            
            "workday": ConnectorConfig(
                name="Workday HCM",
                type=ConnectorType.ERP,
                provider="workday",
                version="1.0",
                description="Workday Human Capital Management",
                base_url="https://{tenant}.workday.com/ccx/api/v1",
                auth_type="oauth2",
                required_credentials=["tenant", "client_id", "client_secret"],
                optional_credentials=["scope"],
                default_attributes=[
                    "employee.id", "employee.name", "employee.email", 
                    "employee.department", "employee.job_title", "employee.manager",
                    "employee.location", "employee.worker_type"
                ],
                rate_limits={"requests_per_minute": 300, "burst_limit": 50},
                timeout=30,
                retry_attempts=3,
                cache_ttl=1200,
                sensitive_attributes=["employee.salary", "employee.benefits"],
                transformation_rules={
                    "employee.department": {"type": "string", "default": ""},
                    "employee.job_title": {"type": "string", "default": ""},
                    "employee.worker_type": {"type": "string", "default": "employee"}
                }
            ),
            
            "netsuite": ConnectorConfig(
                name="NetSuite ERP",
                type=ConnectorType.ERP,
                provider="netsuite",
                version="1.0",
                description="NetSuite cloud ERP system",
                base_url="https://{account}.suitetalk.api.netsuite.com/services/rest/record/v1",
                auth_type="oauth2",
                required_credentials=["account", "consumer_key", "consumer_secret", "token_id", "token_secret"],
                optional_credentials=["realm"],
                default_attributes=[
                    "employee.id", "employee.name", "employee.email", 
                    "employee.department", "employee.job_title", "employee.manager",
                    "employee.location", "employee.status"
                ],
                rate_limits={"requests_per_minute": 1000, "burst_limit": 100},
                timeout=30,
                retry_attempts=3,
                cache_ttl=1800,
                sensitive_attributes=["employee.salary", "employee.benefits"],
                transformation_rules={
                    "employee.department": {"type": "string", "default": ""},
                    "employee.job_title": {"type": "string", "default": ""},
                    "employee.status": {"type": "string", "default": "active"}
                }
            ),
            
            # CRM Connectors
            "salesforce": ConnectorConfig(
                name="Salesforce CRM",
                type=ConnectorType.CRM,
                provider="salesforce",
                version="58.0",
                description="Salesforce customer relationship management",
                base_url="https://{instance}.salesforce.com/services/data/v58.0",
                auth_type="oauth2",
                required_credentials=["instance", "client_id", "client_secret", "username", "password"],
                optional_credentials=["security_token", "scope"],
                default_attributes=[
                    "contact.id", "contact.email", "contact.name", "contact.phone",
                    "contact.company", "contact.title", "contact.lead_source", "contact.status"
                ],
                rate_limits={"requests_per_minute": 1000, "burst_limit": 200},
                timeout=30,
                retry_attempts=3,
                cache_ttl=1800,
                sensitive_attributes=["contact.phone", "contact.notes"],
                transformation_rules={
                    "contact.company": {"type": "string", "default": ""},
                    "contact.lead_source": {"type": "string", "default": ""},
                    "contact.status": {"type": "string", "default": "active"}
                }
            ),
            
            "hubspot": ConnectorConfig(
                name="HubSpot CRM",
                type=ConnectorType.CRM,
                provider="hubspot",
                version="3.0",
                description="HubSpot marketing and sales platform",
                base_url="https://api.hubapi.com/crm/v3",
                auth_type="api_key",
                required_credentials=["api_key"],
                optional_credentials=["portal_id"],
                default_attributes=[
                    "contact.id", "contact.email", "contact.name", "contact.phone",
                    "contact.company", "contact.lifecycle_stage", "contact.lead_score", "contact.notes"
                ],
                rate_limits={"requests_per_minute": 100, "burst_limit": 20},
                timeout=30,
                retry_attempts=3,
                cache_ttl=3600,
                sensitive_attributes=["contact.phone", "contact.notes"],
                transformation_rules={
                    "contact.company": {"type": "string", "default": ""},
                    "contact.lifecycle_stage": {"type": "string", "default": "lead"},
                    "contact.lead_score": {"type": "number", "default": 0}
                }
            ),
            
            "dynamics365": ConnectorConfig(
                name="Microsoft Dynamics 365",
                type=ConnectorType.CRM,
                provider="dynamics365",
                version="9.0",
                description="Microsoft Dynamics 365 CRM",
                base_url="https://{instance}.crm.dynamics.com/api/data/v9.0",
                auth_type="oauth2",
                required_credentials=["instance", "client_id", "client_secret"],
                optional_credentials=["tenant_id", "scope"],
                default_attributes=[
                    "contact.id", "contact.email", "contact.name", "contact.phone",
                    "contact.company", "contact.job_title", "contact.lead_source", "contact.status"
                ],
                rate_limits={"requests_per_minute": 6000, "burst_limit": 100},
                timeout=30,
                retry_attempts=3,
                cache_ttl=1800,
                sensitive_attributes=["contact.phone", "contact.notes"],
                transformation_rules={
                    "contact.company": {"type": "string", "default": ""},
                    "contact.job_title": {"type": "string", "default": ""},
                    "contact.lead_source": {"type": "string", "default": ""}
                }
            ),
            
            # MCP Connectors
            "mcp_tools": ConnectorConfig(
                name="MCP Tools Server",
                type=ConnectorType.MCP,
                provider="mcp_tools",
                version="1.0",
                description="Model Context Protocol tools server",
                base_url="https://{host}:{port}/tools",
                auth_type="api_key",
                required_credentials=["host", "port", "api_key"],
                optional_credentials=["timeout"],
                default_attributes=[
                    "tool.name", "tool.description", "tool.schema", "tool.capabilities",
                    "tool.version", "tool.status", "tool.metadata"
                ],
                rate_limits={"requests_per_minute": 1000, "burst_limit": 100},
                timeout=30,
                retry_attempts=3,
                cache_ttl=600,
                sensitive_attributes=["tool.schema", "tool.metadata"],
                transformation_rules={
                    "tool.capabilities": {"type": "array", "default": []},
                    "tool.schema": {"type": "object", "encrypt": True},
                    "tool.metadata": {"type": "object", "encrypt": True}
                }
            ),
            
            "mcp_resources": ConnectorConfig(
                name="MCP Resources Server",
                type=ConnectorType.MCP,
                provider="mcp_resources",
                version="1.0",
                description="Model Context Protocol resources server",
                base_url="https://{host}:{port}/resources",
                auth_type="api_key",
                required_credentials=["host", "port", "api_key"],
                optional_credentials=["timeout"],
                default_attributes=[
                    "resource.uri", "resource.name", "resource.type", "resource.metadata",
                    "resource.size", "resource.created", "resource.modified"
                ],
                rate_limits={"requests_per_minute": 1000, "burst_limit": 100},
                timeout=30,
                retry_attempts=3,
                cache_ttl=600,
                sensitive_attributes=["resource.metadata"],
                transformation_rules={
                    "resource.type": {"type": "string", "default": "unknown"},
                    "resource.metadata": {"type": "object", "encrypt": True},
                    "resource.size": {"type": "number", "default": 0}
                }
            ),
            
            "mcp_prompts": ConnectorConfig(
                name="MCP Prompts Server",
                type=ConnectorType.MCP,
                provider="mcp_prompts",
                version="1.0",
                description="Model Context Protocol prompts server",
                base_url="https://{host}:{port}/prompts",
                auth_type="api_key",
                required_credentials=["host", "port", "api_key"],
                optional_credentials=["timeout"],
                default_attributes=[
                    "prompt.id", "prompt.name", "prompt.template", "prompt.variables",
                    "prompt.version", "prompt.status", "prompt.metadata"
                ],
                rate_limits={"requests_per_minute": 1000, "burst_limit": 100},
                timeout=30,
                retry_attempts=3,
                cache_ttl=600,
                sensitive_attributes=["prompt.template", "prompt.metadata"],
                transformation_rules={
                    "prompt.variables": {"type": "array", "default": []},
                    "prompt.template": {"type": "string", "encrypt": True},
                    "prompt.metadata": {"type": "object", "encrypt": True}
                }
            )
        }
    
    def get_connector(self, provider: str) -> Optional[ConnectorConfig]:
        """Get connector configuration by provider"""
        return self.connectors.get(provider)
    
    def get_connectors_by_type(self, connector_type: ConnectorType) -> List[ConnectorConfig]:
        """Get all connectors of a specific type"""
        return [connector for connector in self.connectors.values() if connector.type == connector_type]
    
    def get_all_connectors(self) -> List[ConnectorConfig]:
        """Get all available connectors"""
        return list(self.connectors.values())
    
    def get_connector_attributes(self, provider: str) -> List[str]:
        """Get available attributes for a specific connector"""
        connector = self.get_connector(provider)
        if connector:
            return connector.default_attributes
        return []
    
    def get_sensitive_attributes(self, provider: str) -> List[str]:
        """Get sensitive attributes for a specific connector"""
        connector = self.get_connector(provider)
        if connector:
            return connector.sensitive_attributes
        return []
    
    def get_transformation_rules(self, provider: str) -> Dict[str, Any]:
        """Get transformation rules for a specific connector"""
        connector = self.get_connector(provider)
        if connector:
            return connector.transformation_rules
        return {}
    
    def validate_credentials(self, provider: str, credentials: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate credentials for a specific connector"""
        connector = self.get_connector(provider)
        if not connector:
            return False, [f"Unknown provider: {provider}"]
        
        errors = []
        
        # Check required credentials
        for required_cred in connector.required_credentials:
            if required_cred not in credentials or not credentials[required_cred]:
                errors.append(f"Missing required credential: {required_cred}")
        
        # Check credential format
        if provider == "auth0" and "domain" in credentials:
            if not credentials["domain"].endswith(".auth0.com"):
                errors.append("Auth0 domain must end with .auth0.com")
        
        if provider == "okta" and "domain" in credentials:
            if not credentials["domain"].endswith(".okta.com"):
                errors.append("Okta domain must end with .okta.com")
        
        return len(errors) == 0, errors
    
    def get_connection_url(self, provider: str, credentials: Dict[str, Any]) -> str:
        """Get connection URL for a specific connector"""
        connector = self.get_connector(provider)
        if not connector:
            return ""
        
        url = connector.base_url
        
        # Replace placeholders with actual values
        for key, value in credentials.items():
            if f"{{{key}}}" in url:
                url = url.replace(f"{{{key}}}", str(value))
        
        return url
    
    def get_rate_limits(self, provider: str) -> Dict[str, int]:
        """Get rate limits for a specific connector"""
        connector = self.get_connector(provider)
        if connector:
            return connector.rate_limits
        return {}
    
    def get_cache_settings(self, provider: str) -> Dict[str, Any]:
        """Get cache settings for a specific connector"""
        connector = self.get_connector(provider)
        if connector:
            return {
                "ttl": connector.cache_ttl,
                "timeout": connector.timeout,
                "retry_attempts": connector.retry_attempts
            }
        return {}
    
    def get_connector_summary(self) -> Dict[str, Any]:
        """Get summary of all available connectors"""
        summary = {
            "total_connectors": len(self.connectors),
            "by_type": {},
            "providers": list(self.connectors.keys())
        }
        
        for connector in self.connectors.values():
            if connector.type.value not in summary["by_type"]:
                summary["by_type"][connector.type.value] = 0
            summary["by_type"][connector.type.value] += 1
        
        return summary
