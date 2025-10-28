"""
Integration Templates for Control Core PIP
Pre-configured templates for common data source integrations
"""

from typing import Dict, Any, List
from datetime import datetime

class IntegrationTemplate:
    """Represents an integration template"""
    
    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        connection_type: str,
        provider: str,
        configuration_template: Dict[str, Any],
        credentials_template: Dict[str, Any],
        attribute_mappings: List[Dict[str, Any]],
        setup_instructions: str,
        is_active: bool = True
    ):
        self.id = id
        self.name = name
        self.description = description
        self.connection_type = connection_type
        self.provider = provider
        self.configuration_template = configuration_template
        self.credentials_template = credentials_template
        self.attribute_mappings = attribute_mappings
        self.setup_instructions = setup_instructions
        self.is_active = is_active
        self.created_at = datetime.utcnow()

# IAM Integration Templates
OKTA_OAUTH_TEMPLATE = IntegrationTemplate(
    id="okta_oauth",
    name="Okta OAuth Integration",
    description="Connect to Okta using OAuth 2.0 for user and group data",
    connection_type="iam",
    provider="okta",
    configuration_template={
        "base_url": "https://your-domain.okta.com",
        "oauth_config": {
            "auth_url": "https://your-domain.okta.com/oauth2/default/v1/authorize",
            "token_url": "https://your-domain.okta.com/oauth2/default/v1/token",
            "scopes": "openid profile email groups",
            "callback_url": "http://localhost:8000/oauth/callback"
        }
    },
    credentials_template={
        "oauth_config": {
            "client_id": "your_okta_client_id",
            "client_secret": "your_okta_client_secret"
        }
    },
    attribute_mappings=[
        {
            "source_attribute": "id",
            "target_attribute": "user.id",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "Unique user identifier"
        },
        {
            "source_attribute": "profile.email",
            "target_attribute": "user.email",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "User email address"
        },
        {
            "source_attribute": "profile.firstName",
            "target_attribute": "user.first_name",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User first name"
        },
        {
            "source_attribute": "profile.lastName",
            "target_attribute": "user.last_name",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User last name"
        },
        {
            "source_attribute": "profile.department",
            "target_attribute": "user.department",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User department"
        },
        {
            "source_attribute": "groups",
            "target_attribute": "user.groups",
            "data_type": "array",
                "is_required": False,
                "is_sensitive": False,
            "description": "User group memberships"
        },
        {
            "source_attribute": "mfaEnabled",
            "target_attribute": "user.mfa_enabled",
            "data_type": "boolean",
                "is_required": False,
                "is_sensitive": False,
            "description": "MFA enabled status"
        }
    ],
    setup_instructions="""
1. Create an OAuth application in your Okta Admin Console
2. Set the redirect URI to: http://localhost:8000/oauth/callback
3. Grant the following scopes: openid, profile, email, groups
4. Copy the Client ID and Client Secret
5. Update the configuration with your Okta domain URL
6. Test the connection to verify OAuth flow works
    """,
    is_active=True
)

OKTA_API_KEY_TEMPLATE = IntegrationTemplate(
    id="okta_api_key",
    name="Okta API Key Integration",
    description="Connect to Okta using API key for user and group data",
    connection_type="iam",
    provider="okta",
    configuration_template={
        "base_url": "https://your-domain.okta.com",
        "api_endpoint": "https://your-domain.okta.com/api/v1"
    },
    credentials_template={
        "api_token": "your_okta_api_token"
    },
    attribute_mappings=OKTA_OAUTH_TEMPLATE.attribute_mappings,
    setup_instructions="""
1. Generate an API token in your Okta Admin Console
2. Go to Security > API > Tokens
3. Create a new token with appropriate scopes
4. Copy the token value (it won't be shown again)
5. Update the configuration with your Okta domain URL
6. Test the connection to verify API access works
    """,
    is_active=True
)

AZURE_AD_TEMPLATE = IntegrationTemplate(
    id="azure_ad",
    name="Azure Active Directory Integration",
    description="Connect to Azure AD using OAuth 2.0 for user and group data",
    connection_type="iam",
    provider="azure_ad",
    configuration_template={
        "tenant_id": "your_tenant_id",
        "oauth_config": {
            "auth_url": "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize",
            "token_url": "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
            "scopes": "openid profile email User.Read",
            "callback_url": "http://localhost:8000/oauth/callback"
        }
    },
    credentials_template={
        "oauth_config": {
            "client_id": "your_azure_app_id",
            "client_secret": "your_azure_app_secret"
        }
    },
    attribute_mappings=[
            {
                "source_attribute": "id",
            "target_attribute": "user.id",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "Unique user identifier"
            },
            {
                "source_attribute": "mail",
            "target_attribute": "user.email",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "User email address"
        },
        {
            "source_attribute": "givenName",
            "target_attribute": "user.first_name",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User first name"
        },
        {
            "source_attribute": "surname",
            "target_attribute": "user.last_name",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User last name"
        },
        {
            "source_attribute": "department",
            "target_attribute": "user.department",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User department"
        },
        {
            "source_attribute": "jobTitle",
            "target_attribute": "user.job_title",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User job title"
        },
        {
            "source_attribute": "accountEnabled",
            "target_attribute": "user.account_enabled",
            "data_type": "boolean",
                "is_required": False,
                "is_sensitive": False,
            "description": "Account enabled status"
        }
    ],
    setup_instructions="""
1. Register an application in Azure AD (App registrations)
2. Set the redirect URI to: http://localhost:8000/oauth/callback
3. Grant the following API permissions: User.Read, Group.Read.All
4. Copy the Application (client) ID and Client secret
5. Update the configuration with your tenant ID
6. Test the connection to verify OAuth flow works
    """,
    is_active=True
)

AUTH0_TEMPLATE = IntegrationTemplate(
    id="auth0",
    name="Auth0 Integration",
    description="Connect to Auth0 using OAuth 2.0 for user and group data",
    connection_type="iam",
    provider="auth0",
    configuration_template={
        "domain": "your-domain.auth0.com",
        "oauth_config": {
            "auth_url": "https://your-domain.auth0.com/authorize",
            "token_url": "https://your-domain.auth0.com/oauth/token",
            "scopes": "openid profile email",
            "callback_url": "http://localhost:8000/oauth/callback"
        }
    },
    credentials_template={
        "oauth_config": {
            "client_id": "your_auth0_client_id",
            "client_secret": "your_auth0_client_secret"
        }
    },
    attribute_mappings=[
        {
            "source_attribute": "user_id",
            "target_attribute": "user.id",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "Unique user identifier"
        },
        {
            "source_attribute": "email",
            "target_attribute": "user.email",
            "data_type": "string",
            "is_required": True,
                "is_sensitive": False,
            "description": "User email address"
        },
        {
            "source_attribute": "given_name",
            "target_attribute": "user.first_name",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User first name"
        },
        {
            "source_attribute": "family_name",
            "target_attribute": "user.last_name",
            "data_type": "string",
            "is_required": False,
                "is_sensitive": False,
            "description": "User last name"
        },
        {
            "source_attribute": "name",
            "target_attribute": "user.full_name",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User full name"
        },
        {
            "source_attribute": "email_verified",
            "target_attribute": "user.email_verified",
            "data_type": "boolean",
                "is_required": False,
                "is_sensitive": False,
            "description": "Email verified status"
        }
    ],
    setup_instructions="""
1. Create an application in your Auth0 Dashboard
2. Set the Allowed Callback URLs to: http://localhost:8000/oauth/callback
3. Grant the following scopes: openid, profile, email
4. Copy the Client ID and Client Secret
5. Update the configuration with your Auth0 domain
6. Test the connection to verify OAuth flow works
    """,
    is_active=True
)

LDAP_TEMPLATE = IntegrationTemplate(
    id="ldap",
    name="LDAP / Active Directory Integration",
    description="Connect to LDAP directory for user and group data",
    connection_type="iam",
    provider="ldap",
    configuration_template={
        "server": "ldap://your-ldap-server.com",
        "port": 389,
        "base_dn": "dc=example,dc=com",
        "user_dn": "ou=users,dc=example,dc=com",
        "group_dn": "ou=groups,dc=example,dc=com"
    },
    credentials_template={
        "username": "cn=admin,dc=example,dc=com",
        "password": "your_ldap_password"
    },
    attribute_mappings=[
        {
            "source_attribute": "cn",
            "target_attribute": "user.id",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "User common name (ID)"
        },
        {
            "source_attribute": "mail",
            "target_attribute": "user.email",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "User email address"
        },
        {
            "source_attribute": "givenName",
            "target_attribute": "user.first_name",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User first name"
        },
        {
            "source_attribute": "sn",
            "target_attribute": "user.last_name",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User surname"
        },
        {
            "source_attribute": "department",
            "target_attribute": "user.department",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "User department"
        },
        {
            "source_attribute": "title",
            "target_attribute": "user.job_title",
            "data_type": "string",
            "is_required": False,
            "is_sensitive": False,
            "description": "User job title"
        }
    ],
    setup_instructions="""
1. Ensure your LDAP server is accessible from the PIP service
2. Create a service account with read access to user and group data
3. Update the configuration with your LDAP server details
4. Set the base DN to your organization's root DN
5. Configure user and group DNs for efficient queries
6. Test the connection to verify LDAP access works
    """,
    is_active=True
)

# Database Integration Templates
POSTGRESQL_TEMPLATE = IntegrationTemplate(
    id="postgresql",
    name="PostgreSQL Database Integration",
    description="Connect to PostgreSQL database for resource metadata",
    connection_type="database",
    provider="postgresql",
    configuration_template={
        "host": "localhost",
        "port": 5432,
        "database": "mydb",
        "schema": "public",
        "ssl_mode": "require"
    },
    credentials_template={
        "username": "postgres",
        "password": "your_password"
    },
    attribute_mappings=[
            {
                "source_attribute": "id",
            "target_attribute": "resource.id",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "Resource unique identifier"
        },
        {
            "source_attribute": "name",
            "target_attribute": "resource.name",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "Resource name"
        },
        {
            "source_attribute": "owner_id",
            "target_attribute": "resource.owner_id",
            "data_type": "string",
            "is_required": True,
                "is_sensitive": False,
            "description": "Resource owner ID"
        },
        {
            "source_attribute": "sensitivity_level",
            "target_attribute": "resource.sensitivity_level",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "Data sensitivity level"
        },
        {
            "source_attribute": "environment",
            "target_attribute": "resource.environment",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "Environment (dev/staging/prod)"
        },
        {
            "source_attribute": "status",
            "target_attribute": "resource.status",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "Resource status"
        },
        {
            "source_attribute": "created_at",
            "target_attribute": "resource.created_at",
            "data_type": "datetime",
                "is_required": False,
                "is_sensitive": False,
            "description": "Creation timestamp"
        }
    ],
    setup_instructions="""
1. Ensure PostgreSQL server is accessible from the PIP service
2. Create a database user with read access to required tables
3. Update the configuration with your database connection details
4. Set the schema name (usually 'public')
5. Configure SSL mode based on your security requirements
6. Test the connection to verify database access works
    """,
    is_active=True
)

MYSQL_TEMPLATE = IntegrationTemplate(
    id="mysql",
    name="MySQL Database Integration",
    description="Connect to MySQL database for resource metadata",
    connection_type="database",
    provider="mysql",
    configuration_template={
        "host": "localhost",
        "port": 3306,
        "database": "mydb"
    },
    credentials_template={
        "username": "root",
        "password": "your_password"
    },
    attribute_mappings=POSTGRESQL_TEMPLATE.attribute_mappings,
    setup_instructions="""
1. Ensure MySQL server is accessible from the PIP service
2. Create a database user with read access to required tables
3. Update the configuration with your database connection details
4. Test the connection to verify database access works
    """,
    is_active=True
)

MONGODB_TEMPLATE = IntegrationTemplate(
    id="mongodb",
    name="MongoDB Database Integration",
    description="Connect to MongoDB database for resource metadata",
    connection_type="database",
    provider="mongodb",
    configuration_template={
        "host": "localhost",
        "port": 27017,
        "database": "mydb"
    },
    credentials_template={
        "username": "admin",
        "password": "your_password"
    },
    attribute_mappings=[
        {
            "source_attribute": "_id",
            "target_attribute": "resource.id",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "Resource unique identifier"
        },
        {
            "source_attribute": "name",
            "target_attribute": "resource.name",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "Resource name"
        },
        {
            "source_attribute": "ownerId",
            "target_attribute": "resource.owner_id",
            "data_type": "string",
            "is_required": True,
            "is_sensitive": False,
            "description": "Resource owner ID"
        },
        {
            "source_attribute": "sensitivityLevel",
            "target_attribute": "resource.sensitivity_level",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "Data sensitivity level"
        },
        {
            "source_attribute": "environment",
            "target_attribute": "resource.environment",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "Environment (dev/staging/prod)"
        },
        {
            "source_attribute": "status",
            "target_attribute": "resource.status",
            "data_type": "string",
            "is_required": False,
            "is_sensitive": False,
            "description": "Resource status"
        },
        {
            "source_attribute": "createdAt",
            "target_attribute": "resource.created_at",
            "data_type": "datetime",
            "is_required": False,
            "is_sensitive": False,
            "description": "Creation timestamp"
        }
    ],
    setup_instructions="""
1. Ensure MongoDB server is accessible from the PIP service
2. Create a database user with read access to required collections
3. Update the configuration with your database connection details
4. Test the connection to verify database access works
    """,
    is_active=True
)

# OpenAPI Integration Template
OPENAPI_TEMPLATE = IntegrationTemplate(
    id="openapi",
    name="OpenAPI Specification Integration",
    description="Parse OpenAPI specification for API endpoint and security information",
    connection_type="openapi",
    provider="openapi",
    configuration_template={
        "spec_url": "https://api.example.com/openapi.json",
        "format": "auto"
    },
    credentials_template={},
    attribute_mappings=[
        {
            "source_attribute": "path",
            "target_attribute": "api.path",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "API endpoint path"
        },
        {
            "source_attribute": "method",
            "target_attribute": "api.method",
            "data_type": "string",
                "is_required": True,
                "is_sensitive": False,
            "description": "HTTP method"
        },
        {
            "source_attribute": "security",
            "target_attribute": "api.security",
            "data_type": "array",
                "is_required": False,
                "is_sensitive": False,
            "description": "Required security schemes"
        },
        {
            "source_attribute": "parameters",
            "target_attribute": "api.parameters",
            "data_type": "array",
                "is_required": False,
                "is_sensitive": False,
            "description": "Required parameters"
        },
        {
            "source_attribute": "operation_id",
            "target_attribute": "api.operation_id",
            "data_type": "string",
                "is_required": False,
                "is_sensitive": False,
            "description": "Operation identifier"
        }
    ],
    setup_instructions="""
1. Ensure your OpenAPI specification is accessible via URL or upload
2. The specification should be in OpenAPI 3.0 or 3.1 format
3. Include security schemes and endpoint definitions
4. Test the connection to verify specification parsing works
    """,
    is_active=True
)

# HR System Template
HR_SYSTEM_TEMPLATE = IntegrationTemplate(
    id="hr_system",
    name="HR System Integration",
    description="Connect to HR systems for employee data and organizational structure",
    connection_type="hr",
    provider="workday",
    configuration_template={
        "base_url": "https://your-workday-instance.com",
        "api_version": "v1",
        "tenant": "your-tenant"
    },
    credentials_template={
        "client_id": "your_client_id",
        "client_secret": "your_client_secret",
        "username": "your_username",
        "password": "your_password"
    },
    attribute_mappings=[
        {"source_attribute": "employee_id", "target_attribute": "user.id", "data_type": "string", "is_required": True, "is_sensitive": False, "description": "Employee ID"},
        {"source_attribute": "first_name", "target_attribute": "user.first_name", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "First name"},
        {"source_attribute": "last_name", "target_attribute": "user.last_name", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Last name"},
        {"source_attribute": "email", "target_attribute": "user.email", "data_type": "string", "is_required": True, "is_sensitive": False, "description": "Email address"},
        {"source_attribute": "department", "target_attribute": "user.department", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Department"},
        {"source_attribute": "job_title", "target_attribute": "user.job_title", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Job title"},
        {"source_attribute": "manager_id", "target_attribute": "user.manager_id", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Manager ID"},
        {"source_attribute": "location", "target_attribute": "user.location", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Work location"},
        {"source_attribute": "employment_status", "target_attribute": "user.status", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Employment status"}
    ],
    setup_instructions="""
1. Obtain API credentials from your HR system administrator
2. Configure OAuth or API key authentication
3. Map employee fields to policy attributes
4. Test the connection to verify data retrieval works
    """,
    is_active=True
)

# CRM System Template
CRM_SYSTEM_TEMPLATE = IntegrationTemplate(
    id="crm_system",
    name="CRM System Integration",
    description="Connect to CRM systems for customer and sales data",
    connection_type="crm",
    provider="salesforce",
    configuration_template={
        "base_url": "https://your-instance.salesforce.com",
        "api_version": "v58.0",
        "sandbox": False
    },
    credentials_template={
        "client_id": "your_client_id",
        "client_secret": "your_client_secret",
        "username": "your_username",
        "password": "your_password",
        "security_token": "your_security_token"
    },
    attribute_mappings=[
        {"source_attribute": "account_id", "target_attribute": "customer.id", "data_type": "string", "is_required": True, "is_sensitive": False, "description": "Customer account ID"},
        {"source_attribute": "account_name", "target_attribute": "customer.name", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Customer name"},
        {"source_attribute": "tier", "target_attribute": "customer.tier", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Customer tier"},
        {"source_attribute": "region", "target_attribute": "customer.region", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Customer region"},
        {"source_attribute": "account_owner", "target_attribute": "customer.owner", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Account owner"},
        {"source_attribute": "contract_value", "target_attribute": "customer.contract_value", "data_type": "number", "is_required": False, "is_sensitive": True, "description": "Contract value"}
    ],
    setup_instructions="""
1. Create a connected app in your CRM system
2. Obtain OAuth credentials and security token
3. Configure API permissions for data access
4. Map customer fields to policy attributes
5. Test the connection to verify data retrieval works
    """,
    is_active=True
)

# ERP System Template
ERP_SYSTEM_TEMPLATE = IntegrationTemplate(
    id="erp_system",
    name="ERP System Integration",
    description="Connect to ERP systems for financial and organizational data",
    connection_type="erp",
    provider="sap",
    configuration_template={
        "base_url": "https://your-sap-instance.com",
        "system_number": "00",
        "client": "100"
    },
    credentials_template={
        "username": "your_username",
        "password": "your_password",
        "client_cert": "path_to_cert",
        "client_key": "path_to_key"
    },
    attribute_mappings=[
        {"source_attribute": "cost_center", "target_attribute": "organization.cost_center", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Cost center"},
        {"source_attribute": "profit_center", "target_attribute": "organization.profit_center", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Profit center"},
        {"source_attribute": "company_code", "target_attribute": "organization.company_code", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Company code"},
        {"source_attribute": "plant", "target_attribute": "organization.plant", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Plant"},
        {"source_attribute": "project_id", "target_attribute": "project.id", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Project ID"},
        {"source_attribute": "project_budget", "target_attribute": "project.budget", "data_type": "number", "is_required": False, "is_sensitive": True, "description": "Project budget"}
    ],
    setup_instructions="""
1. Configure SAP RFC connection or OData service
2. Set up authentication (username/password or certificates)
3. Map organizational and financial fields to policy attributes
4. Test the connection to verify data retrieval works
    """,
    is_active=True
)

# CSM/Ticketing System Template
CSM_SYSTEM_TEMPLATE = IntegrationTemplate(
    id="csm_system",
    name="CSM/Ticketing System Integration",
    description="Connect to ticketing systems for incident and service data",
    connection_type="csm",
    provider="servicenow",
    configuration_template={
        "base_url": "https://your-instance.service-now.com",
        "api_version": "v1",
        "table": "incident"
    },
    credentials_template={
        "username": "your_username",
        "password": "your_password",
        "client_id": "your_client_id",
        "client_secret": "your_client_secret"
    },
    attribute_mappings=[
        {"source_attribute": "ticket_id", "target_attribute": "ticket.id", "data_type": "string", "is_required": True, "is_sensitive": False, "description": "Ticket ID"},
        {"source_attribute": "priority", "target_attribute": "ticket.priority", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Ticket priority"},
        {"source_attribute": "urgency", "target_attribute": "ticket.urgency", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Ticket urgency"},
        {"source_attribute": "state", "target_attribute": "ticket.state", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Ticket state"},
        {"source_attribute": "assigned_to", "target_attribute": "ticket.assigned_to", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Assigned user"},
        {"source_attribute": "category", "target_attribute": "ticket.category", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Ticket category"},
        {"source_attribute": "impact", "target_attribute": "ticket.impact", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Business impact"}
    ],
    setup_instructions="""
1. Create a service account in your ticketing system
2. Configure API access and permissions
3. Map ticket fields to policy attributes
4. Test the connection to verify data retrieval works
    """,
    is_active=True
)

# Cloud Provider Template
CLOUD_PROVIDER_TEMPLATE = IntegrationTemplate(
    id="cloud_provider",
    name="Cloud Provider Metadata Integration",
    description="Connect to cloud providers for resource metadata and tags",
    connection_type="cloud",
    provider="aws",
    configuration_template={
        "region": "us-east-1",
        "services": ["ec2", "s3", "rds", "lambda"]
    },
    credentials_template={
        "access_key_id": "your_access_key",
        "secret_access_key": "your_secret_key",
        "session_token": "your_session_token"
    },
    attribute_mappings=[
        {"source_attribute": "resource_id", "target_attribute": "resource.id", "data_type": "string", "is_required": True, "is_sensitive": False, "description": "Resource ID"},
        {"source_attribute": "resource_type", "target_attribute": "resource.type", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Resource type"},
        {"source_attribute": "environment", "target_attribute": "resource.environment", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Environment tag"},
        {"source_attribute": "owner", "target_attribute": "resource.owner", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Resource owner"},
        {"source_attribute": "cost_center", "target_attribute": "resource.cost_center", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Cost center tag"},
        {"source_attribute": "compliance", "target_attribute": "resource.compliance", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Compliance tag"}
    ],
    setup_instructions="""
1. Create IAM user with appropriate permissions
2. Generate access keys for API access
3. Configure resource tagging strategy
4. Map resource tags to policy attributes
5. Test the connection to verify metadata retrieval works
    """,
    is_active=True
)

# Configuration Management DB Template
CMDB_TEMPLATE = IntegrationTemplate(
    id="cmdb",
    name="Configuration Management DB Integration",
    description="Connect to CMDB for asset and configuration data",
    connection_type="cmdb",
    provider="servicenow_cmdb",
    configuration_template={
        "base_url": "https://your-instance.service-now.com",
        "api_version": "v1",
        "table": "cmdb_ci"
    },
    credentials_template={
        "username": "your_username",
        "password": "your_password"
    },
    attribute_mappings=[
        {"source_attribute": "ci_id", "target_attribute": "asset.id", "data_type": "string", "is_required": True, "is_sensitive": False, "description": "Configuration item ID"},
        {"source_attribute": "name", "target_attribute": "asset.name", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Asset name"},
        {"source_attribute": "class", "target_attribute": "asset.class", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Asset class"},
        {"source_attribute": "owner", "target_attribute": "asset.owner", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Asset owner"},
        {"source_attribute": "location", "target_attribute": "asset.location", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Asset location"},
        {"source_attribute": "criticality", "target_attribute": "asset.criticality", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Asset criticality"},
        {"source_attribute": "status", "target_attribute": "asset.status", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Asset status"}
    ],
    setup_instructions="""
1. Configure CMDB access credentials
2. Map configuration item fields to policy attributes
3. Set up data synchronization schedule
4. Test the connection to verify asset data retrieval works
    """,
    is_active=True
)

# Data Warehouse Template
DATA_WAREHOUSE_TEMPLATE = IntegrationTemplate(
    id="data_warehouse",
    name="Data Warehouse Integration",
    description="Connect to data warehouses for business intelligence data",
    connection_type="warehouse",
    provider="snowflake",
    configuration_template={
        "account": "your-account.snowflakecomputing.com",
        "warehouse": "COMPUTE_WH",
        "database": "ANALYTICS_DB",
        "schema": "PUBLIC"
    },
    credentials_template={
        "username": "your_username",
        "password": "your_password",
        "role": "ANALYST_ROLE"
    },
    attribute_mappings=[
        {"source_attribute": "customer_id", "target_attribute": "customer.id", "data_type": "string", "is_required": True, "is_sensitive": False, "description": "Customer ID"},
        {"source_attribute": "segment", "target_attribute": "customer.segment", "data_type": "string", "is_required": False, "is_sensitive": False, "description": "Customer segment"},
        {"source_attribute": "lifetime_value", "target_attribute": "customer.ltv", "data_type": "number", "is_required": False, "is_sensitive": True, "description": "Customer lifetime value"},
        {"source_attribute": "risk_score", "target_attribute": "customer.risk_score", "data_type": "number", "is_required": False, "is_sensitive": False, "description": "Customer risk score"},
        {"source_attribute": "last_activity", "target_attribute": "customer.last_activity", "data_type": "datetime", "is_required": False, "is_sensitive": False, "description": "Last activity date"}
    ],
    setup_instructions="""
1. Configure Snowflake connection parameters
2. Set up appropriate database roles and permissions
3. Map business intelligence fields to policy attributes
4. Configure data refresh schedule
5. Test the connection to verify data retrieval works
    """,
    is_active=True
)

# All templates
ALL_TEMPLATES = [
    OKTA_OAUTH_TEMPLATE,
    OKTA_API_KEY_TEMPLATE,
    AZURE_AD_TEMPLATE,
    AUTH0_TEMPLATE,
    LDAP_TEMPLATE,
    POSTGRESQL_TEMPLATE,
    MYSQL_TEMPLATE,
    MONGODB_TEMPLATE,
    OPENAPI_TEMPLATE,
    HR_SYSTEM_TEMPLATE,
    CRM_SYSTEM_TEMPLATE,
    ERP_SYSTEM_TEMPLATE,
    CSM_SYSTEM_TEMPLATE,
    CLOUD_PROVIDER_TEMPLATE,
    CMDB_TEMPLATE,
    DATA_WAREHOUSE_TEMPLATE
]

def get_template_by_id(template_id: str) -> IntegrationTemplate:
    """Get template by ID"""
    for template in ALL_TEMPLATES:
        if template.id == template_id:
            return template
    raise ValueError(f"Template not found: {template_id}")

def get_templates_by_type(connection_type: str) -> List[IntegrationTemplate]:
    """Get templates by connection type"""
    return [template for template in ALL_TEMPLATES if template.connection_type == connection_type]

def get_templates_by_provider(provider: str) -> List[IntegrationTemplate]:
    """Get templates by provider"""
    return [template for template in ALL_TEMPLATES if template.provider == provider]

def get_active_templates() -> List[IntegrationTemplate]:
    """Get all active templates"""
    return [template for template in ALL_TEMPLATES if template.is_active]

def get_template_config(template_id: str) -> Dict[str, Any]:
    """Get template configuration for API response"""
    template = get_template_by_id(template_id)
    return {
        'id': template.id,
        'name': template.name,
        'description': template.description,
        'connection_type': template.connection_type,
        'provider': template.provider,
        'configuration_template': template.configuration_template,
        'credentials_template': template.credentials_template,
        'attribute_mappings': template.attribute_mappings,
        'setup_instructions': template.setup_instructions,
        'is_active': template.is_active,
        'created_at': template.created_at.isoformat()
    }