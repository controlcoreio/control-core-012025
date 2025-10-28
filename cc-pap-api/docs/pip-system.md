# Policy Information Point (PIP) System
## Overview
The Policy Information Point (PIP) system in Control Core provides comprehensive connection management, attribute mapping, and data synchronization capabilities. It serves as the central hub for integrating with external systems and distributing data to Bouncers via OPAL.
## Key Features
### 🔗 Connection Management

- **Multi-Provider Support**: Out-of-box integrations for major IAM, ERP, CRM, and MCP providers
- **Connection Testing**: Test connections before saving configurations
- **Health Monitoring**: Continuous health checks and status monitoring
- **Credential Management**: Secure storage and encryption of credentials
### 🗺️ Attribute Mapping

- **Flexible Mapping**: Map source attributes to Control Core attributes
- **Transformation Rules**: Support for data transformation and validation
- **Data Types**: Support for string, number, boolean, array, and object data types
- **Sensitive Data Handling**: Special handling for sensitive attributes
### 🔄 Data Synchronization

- **Real-time Sync**: Continuous synchronization with external systems
- **Incremental Updates**: Efficient incremental data updates
- **OPAL Integration**: Automatic distribution to Bouncers via OPAL
- **Sync Logging**: Comprehensive logging of sync operations
## Supported Integrations
### IAM (Identity and Access Management)

- **Auth0**: User management and authentication
- **Okta**: Enterprise identity management
- **Azure AD**: Microsoft Active Directory
- **AWS IAM**: Amazon Web Services Identity and Access Management
### ERP (Enterprise Resource Planning)

- **SAP**: SAP ERP system integration
- **Oracle ERP**: Oracle Cloud ERP
- **Workday**: Human capital management
- **NetSuite**: Cloud-based ERP and CRM
### CRM (Customer Relationship Management)

- **Salesforce**: Salesforce CRM integration
- **HubSpot**: Marketing and sales platform
- **Microsoft Dynamics 365**: Customer engagement platform
### MCP (Model Context Protocol)

- **MCP Tools**: AI tool integration
- **MCP Resources**: Data resource integration
- **MCP Prompts**: Prompt management integration
## API Endpoints
### Connection Management

- `GET /pip/connections` - List all PIP connections
- `POST /pip/connections` - Create a new PIP connection
- `GET /pip/connections/{id}` - Get specific connection
- `PUT /pip/connections/{id}` - Update connection
- `DELETE /pip/connections/{id}` - Delete connection
### Attribute Mapping

- `GET /pip/connections/{id}/mappings` - Get attribute mappings
- `POST /pip/connections/{id}/mappings` - Create attribute mapping
- `PUT /pip/mappings/{id}` - Update attribute mapping
- `DELETE /pip/mappings/{id}` - Delete attribute mapping
### Health and Testing

- `POST /pip/connections/{id}/health-check` - Health check connection
- `POST /pip/connections/test` - Test connection configuration
### Data Synchronization

- `POST /pip/connections/{id}/sync` - Sync connection data
- `GET /pip/connections/{id}/sync-logs` - Get sync logs
### Integration Templates

- `GET /pip/templates` - Get available templates
- `GET /pip/templates/{id}` - Get specific template
### MCP Connections

- `GET /pip/mcp/connections` - List MCP connections
- `POST /pip/mcp/connections` - Create MCP connection
## Usage Examples
### 1. Create Auth0 Connection
```bash
curl -X POST "https://api.controlcore.io/pip/connections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Auth0 Production",
    "description": "Auth0 connection for production users",
    "connection_type": "iam",
    "provider": "auth0",
    "configuration": {
      "base_url": "https://company.auth0.com",
      "api_version": "v2"
    },
    "credentials": {
      "domain": "company.auth0.com",
      "client_id": "your_client_id",
      "client_secret": "your_client_secret",
      "management_api_token": "your_token"
    },
    "sync_enabled": true,
    "sync_frequency": 300
  }'
```
### 2. Create Attribute Mapping
```bash
curl -X POST "https://api.controlcore.io/pip/connections/1/mappings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "source_attribute": "user_id",
    "target_attribute": "controlcore.user.id",
    "transformation_rule": {
      "type": "direct"
    },
    "is_required": true,
    "is_sensitive": false,
    "data_type": "string"
  }'
```
### 3. Test Connection
```bash
curl -X POST "https://api.controlcore.io/pip/connections/test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "connection_type": "iam",
    "provider": "auth0",
    "configuration": {
      "base_url": "https://company.auth0.com"
    },
    "credentials": {
      "domain": "company.auth0.com",
      "client_id": "your_client_id",
      "client_secret": "your_client_secret"
    }
  }'
```
### 4. Sync Connection Data
```bash
curl -X POST "https://api.controlcore.io/pip/connections/1/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sync_type": "incremental",
    "force": false
  }'
```
### 5. Health Check Connection
```bash
curl -X POST "https://api.controlcore.io/pip/connections/1/health-check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "check_type": "full"
  }'
```
## Configuration Examples
### Auth0 Integration Template
```json
{
  "name": "Auth0 Integration",
  "description": "Connect to Auth0 for user management and authentication",
  "connection_type": "iam",
  "provider": "auth0",
  "template_config": {
    "base_url": "https://{domain}.auth0.com",
    "api_version": "v2",
    "endpoints": {
      "users": "/api/v2/users",
      "roles": "/api/v2/roles",
      "permissions": "/api/v2/permissions"
    },
    "rate_limits": {
      "requests_per_minute": 1000,
      "burst_limit": 100
    }
  },
  "required_credentials": [
    "domain",
    "client_id",
    "client_secret",
    "management_api_token"
  ],
  "attribute_mappings": [
    {
      "source_attribute": "user_id",
      "target_attribute": "controlcore.user.id",
      "transformation_rule": {"type": "direct"},
      "is_required": true,
      "is_sensitive": false,
      "data_type": "string"
    },
    {
      "source_attribute": "email",
      "target_attribute": "controlcore.user.email",
      "transformation_rule": {"type": "direct"},
      "is_required": true,
      "is_sensitive": false,
      "data_type": "string"
    }
  ]
}
```
### Salesforce Integration Template
```json
{
  "name": "Salesforce Integration",
  "description": "Connect to Salesforce CRM for customer relationship management data",
  "connection_type": "crm",
  "provider": "salesforce",
  "template_config": {
    "base_url": "https://{instance}.salesforce.com",
    "api_version": "v58.0",
    "endpoints": {
      "users": "/services/data/v58.0/sobjects/User",
      "accounts": "/services/data/v58.0/sobjects/Account",
      "contacts": "/services/data/v58.0/sobjects/Contact"
    },
    "rate_limits": {
      "requests_per_day": 15000,
      "requests_per_minute": 1000
    }
  },
  "required_credentials": [
    "instance_url",
    "access_token",
    "refresh_token",
    "client_id",
    "client_secret"
  ],
  "attribute_mappings": [
    {
      "source_attribute": "Id",
      "target_attribute": "controlcore.user.id",
      "transformation_rule": {"type": "direct"},
      "is_required": true,
      "is_sensitive": false,
      "data_type": "string"
    },
    {
      "source_attribute": "Email",
      "target_attribute": "controlcore.user.email",
      "transformation_rule": {"type": "direct"},
      "is_required": true,
      "is_sensitive": false,
      "data_type": "string"
    }
  ]
}
```
## OPAL Integration
### Data Distribution

The PIP system automatically distributes data to Bouncers via OPAL:
1. **Connection Data**: Connection configurations and credentials
2. **Attribute Mappings**: Source-to-target attribute mappings
3. **Sync Status**: Real-time sync status and health information
4. **Transformation Rules**: Data transformation and validation rules
### OPAL Configuration

```json
{
  "opal_server_url": "https://opal.controlcore.io",
  "opal_client_id": "pip-client",
  "opal_client_secret": "your_secret",
  "sync_frequency": 300,
  "data_encryption": true,
  "compression": true
}
```
## Security Features
### Credential Management

- **Encryption at Rest**: All credentials encrypted in database
- **Secure Transmission**: HTTPS for all API communications
- **Access Control**: Role-based access to connection management
- **Audit Logging**: Complete audit trail of all operations
### Data Protection

- **Sensitive Data Handling**: Special handling for sensitive attributes
- **Data Masking**: Automatic masking of sensitive data in logs
- **Access Logging**: Comprehensive logging of data access
- **Compliance**: GDPR, HIPAA, and SOC2 compliance
## Monitoring and Metrics
### Health Monitoring

- **Connection Health**: Real-time health status of all connections
- **Sync Status**: Status of data synchronization operations
- **Error Tracking**: Comprehensive error logging and tracking
- **Performance Metrics**: Response times and throughput metrics
### Alerting

- **Health Alerts**: Alerts for unhealthy connections
- **Sync Alerts**: Alerts for failed sync operations
- **Performance Alerts**: Alerts for performance issues
- **Security Alerts**: Alerts for security violations
## Best Practices
### Connection Management

1. **Test Before Save**: Always test connections before saving
2. **Regular Health Checks**: Set up regular health check schedules
3. **Credential Rotation**: Regularly rotate credentials
4. **Monitor Sync Status**: Monitor sync operations for failures
### Attribute Mapping

1. **Use Templates**: Start with built-in templates
2. **Validate Mappings**: Test attribute mappings thoroughly
3. **Handle Sensitive Data**: Properly mark and handle sensitive attributes
4. **Document Transformations**: Document complex transformation rules
### Security

1. **Least Privilege**: Use minimal required permissions
2. **Regular Audits**: Regular security audits of connections
3. **Encrypt Everything**: Encrypt all sensitive data
4. **Monitor Access**: Monitor access to connection data
## Troubleshooting
### Common Issues
1. **Connection Failures**
   - Check credentials and configuration
   - Verify network connectivity
   - Check rate limits and quotas
2. **Sync Failures**
   - Check connection health
   - Verify attribute mappings
   - Review sync logs for errors
3. **Performance Issues**
   - Check rate limits
   - Optimize sync frequency
   - Monitor resource usage
### Debug Commands

```bash
# Check connection health

curl -X POST "https://api.controlcore.io/pip/connections/1/health-check" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Get sync logs

curl -X GET "https://api.controlcore.io/pip/connections/1/sync-logs" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Test connection

curl -X POST "https://api.controlcore.io/pip/connections/test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"connection_type": "iam", "provider": "auth0", ...}'
```
## Conclusion
The Control Core PIP system provides the most comprehensive Policy Information Point available, with out-of-box support for major IAM, ERP, CRM, and MCP providers. With advanced attribute mapping, real-time synchronization, and OPAL integration, it enables sophisticated policy decisions based on rich contextual data from external systems.
