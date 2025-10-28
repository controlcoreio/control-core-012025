# Context Ingestion for Control Core PAP Pro Tenant
## Overview
The Control Core PAP Pro Tenant includes advanced context generation and ingestion capabilities specifically designed for multi-tenant environments. This document describes the context ingestion features available to Pro plan customers.
## Features
### Multi-Tenant Context Management

- **Tenant-Isolated Context**: Each tenant has their own context configuration
- **Secure Context Sharing**: Context data is isolated between tenants
- **Custom Context Sources**: Tenants can configure their own context sources
- **Advanced Security Policies**: Tenant-specific security policies and data masking
### Context Generation Capabilities

- **AI Agent Context**: User profiles, security context, AI model metadata, conversation history
- **LLM Context**: Prompt enrichment, knowledge injection, compliance filtering, response templating
- **RAG System Context**: Document access control, user permissions, retrieval history, content sanitization
### Advanced Security Features

- **Data Masking**: Automatic masking of sensitive data in context
- **Content Filtering**: Advanced filtering based on user permissions and data classification
- **Tenant Isolation**: Complete isolation of context data between tenants
- **Audit Logging**: Comprehensive logging of context operations
## API Endpoints
### Context Sources Management

- `GET /api/v1/tenants/{tenant_id}/context/sources` - Get context sources for a tenant
- `POST /api/v1/tenants/{tenant_id}/context/sources` - Create a new context source
- `PUT /api/v1/tenants/{tenant_id}/context/sources/{source_id}` - Update a context source
- `DELETE /api/v1/tenants/{tenant_id}/context/sources/{source_id}` - Delete a context source
### Context Rules Management

- `GET /api/v1/tenants/{tenant_id}/context/rules` - Get context rules for a tenant
- `POST /api/v1/tenants/{tenant_id}/context/rules` - Create a new context rule
- `PUT /api/v1/tenants/{tenant_id}/context/rules/{rule_id}` - Update a context rule
- `DELETE /api/v1/tenants/{tenant_id}/context/rules/{rule_id}` - Delete a context rule
### Security Policies Management

- `GET /api/v1/tenants/{tenant_id}/context/security-policies` - Get security policies for a tenant
- `POST /api/v1/tenants/{tenant_id}/context/security-policies` - Create a new security policy
- `PUT /api/v1/tenants/{tenant_id}/context/security-policies/{policy_id}` - Update a security policy
- `DELETE /api/v1/tenants/{tenant_id}/context/security-policies/{policy_id}` - Delete a security policy
### Context Configuration

- `GET /api/v1/tenants/{tenant_id}/context/config` - Get context configuration for a tenant
- `PUT /api/v1/tenants/{tenant_id}/context/config` - Update context configuration for a tenant
### Context Generation

- `POST /api/v1/tenants/{tenant_id}/context/generate` - Generate a context-aware policy for a tenant
- `POST /api/v1/tenants/{tenant_id}/context/test` - Test context generation for a tenant
### Context Templates

- `GET /api/v1/tenants/{tenant_id}/context/templates` - Get available context templates for a tenant
### Context Metrics

- `GET /api/v1/tenants/{tenant_id}/context/metrics` - Get context ingestion metrics for a tenant
## Usage Examples
### 1. Configure Context Sources for a Tenant

```bash
# Create a user profile API source

curl -X POST "https://api.controlcore.io/api/v1/tenants/tenant-123/context/sources" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "User Profile API",
    "type": "api",
    "url": "https://api.company.com/user-profile",
    "auth_type": "bearer",
    "credentials": {
      "token": "your_api_token"
    },
    "permissions": ["context.source.api", "context.read"],
    "rate_limit": 100,
    "timeout": 30,
    "enabled": true,
    "description": "Fetches user profile information"
  }'
```
### 2. Create Context Rules

```bash
# Create a user context enrichment rule

curl -X POST "https://api.controlcore.io/api/v1/tenants/tenant-123/context/rules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "User Context Enrichment",
    "description": "Enriches context with user profile information",
    "source": "user-profile-api",
    "target": "user_context",
    "conditions": {
      "user.role": ["admin", "developer", "analyst"],
      "resource.type": "ai_agent"
    },
    "transform": {
      "mapping": {
        "user_profile": "profile",
        "user_permissions": "permissions",
        "security_clearance": "clearance_level"
      }
    },
    "permissions": ["context.ingest", "context.read"],
    "priority": 1,
    "enabled": true
  }'
```
### 3. Generate Context-Aware Policy

```bash
# Generate a context-aware policy for AI agents

curl -X POST "https://api.controlcore.io/api/v1/tenants/tenant-123/context/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "template_id": "ai-context-template",
    "user_id": "user-456",
    "resource_id": "ai-agent-789",
    "context_sources": [
      {
        "name": "User Profile API",
        "type": "api",
        "url": "https://api.company.com/user-profile",
        "auth_type": "bearer",
        "permissions": ["context.source.api", "context.read"]
      }
    ],
    "context_rules": [
      {
        "name": "User Context Enrichment",
        "source": "user-profile-api",
        "target": "user_context",
        "conditions": {
          "user.role": ["admin", "developer"]
        },
        "transform": {
          "mapping": {
            "user_profile": "profile"
          }
        },
        "permissions": ["context.ingest", "context.read"]
      }
    ],
    "security_policies": [
      {
        "name": "Sensitive Data Protection",
        "rules": [
          {
            "type": "mask",
            "condition": {
              "field": "password"
            },
            "action": {
              "fields": ["password", "token", "secret"]
            }
          }
        ],
        "permissions": ["context.security.mask"]
      }
    ]
  }'
```
### 4. Test Context Generation

```bash
# Test context generation with sample data

curl -X POST "https://api.controlcore.io/api/v1/tenants/tenant-123/context/test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user": {
      "id": "user-456",
      "roles": ["developer"],
      "profile": {
        "name": "John Doe",
        "department": "Engineering"
      },
      "permissions": ["context.ingest", "context.read"]
    },
    "resource": {
      "id": "ai-agent-789",
      "type": "ai_agent",
      "classification": "internal"
    },
    "action": {
      "name": "generate",
      "type": "execute"
    },
    "context": {
      "request_id": "req-123",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "sources": ["user-profile-api", "security-context-db"],
    "permissions": ["context.ingest", "context.read"]
  }'
```
## Configuration Examples
### Default Context Configuration
```json
{
  "enabled": true,
  "max_context_size": 1048576,
  "timeout_seconds": 30,
  "allowed_sources": ["api", "database", "file", "stream"],
  "permission_levels": {
    "admin": "full",
    "developer": "limited",
    "analyst": "read_only",
    "viewer": "view_only"
  },
  "data_sources": [],
  "ingestion_rules": [],
  "security_policies": []
}
```
### AI Agent Context Template
```json
{
  "template_id": "ai-context-template",
  "name": "AI Agent Context-Aware Policy",
  "description": "Advanced policy template for AI agents with context ingestion",
  "category": "ai_agent",
  "context_sources": [
    "user-profile-api",
    "security-context-db",
    "ai-model-metadata",
    "conversation-history"
  ],
  "context_rules": [
    "user-context-enrichment",
    "security-context-enrichment",
    "ai-model-context",
    "conversation-context"
  ],
  "security_policies": [
    "sensitive-data-protection",
    "ai-context-filtering"
  ]
}
```
## Security Considerations
### Data Isolation

- Each tenant's context data is completely isolated
- No cross-tenant data access is possible
- Context configurations are tenant-specific
### Data Masking

- Automatic masking of sensitive fields (passwords, tokens, secrets)
- Configurable masking patterns per tenant
- Support for encryption of sensitive data
### Access Control

- Role-based access to context features
- Tenant-specific permissions
- Audit logging of all context operations
### Compliance

- GDPR compliance for EU tenants
- SOC 2 compliance for enterprise tenants
- Custom compliance requirements per tenant
## Monitoring and Metrics
### Context Metrics

- Context ingestion request count
- Context cache hit ratio
- Average processing time
- Security violations count
### Tenant Metrics

- Number of context sources per tenant
- Number of context rules per tenant
- Number of security policies per tenant
- Generated policies count
### Performance Metrics

- Context processing latency
- Source connectivity status
- Rule execution time
- Policy generation time
## Best Practices
### 1. Context Source Configuration

- Use appropriate authentication methods
- Set reasonable rate limits
- Configure proper timeouts
- Monitor source health
### 2. Context Rules

- Keep rules simple and focused
- Use appropriate priorities
- Test rules thoroughly
- Monitor rule performance
### 3. Security Policies

- Implement data masking for sensitive data
- Use content filtering appropriately
- Regular security policy reviews
- Monitor security violations
### 4. Performance Optimization

- Use caching for frequently accessed context
- Optimize context rules for performance
- Monitor context processing metrics
- Scale context sources appropriately
## Troubleshooting
### Common Issues
1. **Context Source Connectivity**
   - Check source URLs and authentication
   - Verify network connectivity
   - Check rate limits and timeouts
2. **Context Rule Execution**
   - Verify rule conditions
   - Check rule priorities
   - Monitor rule performance
3. **Security Policy Violations**
   - Review security policy rules
   - Check data masking configuration
   - Monitor security violations
### Debug Commands

```bash
# Check tenant context configuration

curl -X GET "https://api.controlcore.io/api/v1/tenants/tenant-123/context/config" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Get context metrics

curl -X GET "https://api.controlcore.io/api/v1/tenants/tenant-123/context/metrics" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Test context generation

curl -X POST "https://api.controlcore.io/api/v1/tenants/tenant-123/context/test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"user": {...}, "resource": {...}, "action": {...}}'
```
## Conclusion
The Control Core PAP Pro Tenant's context ingestion capabilities provide the most advanced PBAC platform available for multi-tenant environments. With tenant isolation, advanced security features, and comprehensive monitoring, Pro plan customers can implement sophisticated context-aware policies that enhance security and improve user experience.
