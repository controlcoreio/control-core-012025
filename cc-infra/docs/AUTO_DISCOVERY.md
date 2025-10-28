# Control Core Auto-Discovery System

## Overview

Control Core implements automatic resource discovery through bouncer registration. When you deploy a bouncer (Policy Enforcement Point), it automatically registers itself and the resource it's protecting with the Control Plane, eliminating manual configuration.

## How It Works

### 1. Bouncer Deployment with Configuration

When deploying a bouncer, you configure it with environment variables that describe the resource it's protecting:

```yaml
environment:
  # Bouncer Identity
  - BOUNCER_ID=bouncer-customer-api-1
  - BOUNCER_NAME=Customer API Bouncer
  - BOUNCER_TYPE=reverse-proxy  # or sidecar
  
  # Resource Information
  - RESOURCE_NAME=Customer API
  - RESOURCE_TYPE=api  # api, webapp, database, ai-agent, mcp-server
  - TARGET_HOST=customer-api:8000
  - ORIGINAL_HOST_URL=https://api.company.com
  - BOUNCER_PUBLIC_URL=https://api-protected.company.com
  - SECURITY_POSTURE=deny-all
  
  # Deployment Context
  - DEPLOYMENT_PLATFORM=kubernetes
  - ENVIRONMENT=production
  
  # Control Plane Connection
  - PAP_API_URL=http://cc-pap-api:8082
  - TENANT_ID=your-tenant-id
  - API_KEY=your-api-key
```

### 2. Automatic Registration on Startup

When the bouncer starts:

1. **Connects to Control Plane**: The bouncer contacts the PAP API at `/api/v1/peps/register`
2. **Sends Registration Data**: Includes bouncer identity, resource information, and deployment context
3. **Creates PEP Record**: Control Plane creates or updates the bouncer (PEP) record
4. **Creates Resource Record**: Control Plane automatically creates a protected resource entry
5. **Links Them Together**: The resource is linked to the bouncer that protects it
6. **Starts Heartbeat**: Bouncer sends periodic heartbeats to maintain "active" status

### 3. Resource Appears in Control Plane UI

The resource automatically appears in the Control Plane UI at `/settings/resources`:

- **Auto-Discovered Badge**: Indicates the resource was automatically discovered
- **Read-Only Basic Info**: Name, type, and URLs are read-only (from bouncer)
- **Enrichment Fields**: Admin can add business context and metadata

### 4. Resource Enrichment

After auto-discovery, administrators can enrich resources with metadata:

**Business Context**:
- Business description/purpose
- Cost center allocation
- Owner contact (email, team)

**Data Classification**:
- Public / Internal / Confidential / Restricted
- Determines default policy strictness

**Compliance**:
- Compliance tags (GDPR, HIPAA, SOC2, PCI-DSS, ISO27001)
- Enables compliance-specific policy templates
- Audit level (none, basic, detailed, comprehensive)

**Operational**:
- SLA tier (gold/silver/bronze)
- Data residency requirements (US, EU, APAC)
- Affects policy evaluation priorities

## Configuration Reference

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RESOURCE_NAME` | Human-readable name of the resource | `Customer API` |
| `RESOURCE_TYPE` | Type of resource being protected | `api`, `webapp`, `database`, `ai-agent`, `mcp-server` |
| `TARGET_HOST` | Internal host:port being protected | `customer-api:8000` |
| `PAP_API_URL` | Control Plane API endpoint | `http://cc-pap-api:8082` |
| `TENANT_ID` | Your Control Core tenant ID | `your-tenant-id` |
| `API_KEY` | API key for authentication | `your-api-key` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BOUNCER_ID` | Unique bouncer identifier | Auto-generated |
| `BOUNCER_NAME` | Human-readable bouncer name | `bouncer-1` |
| `BOUNCER_TYPE` | Deployment type | `reverse-proxy` |
| `ORIGINAL_HOST_URL` | Original public URL | Empty |
| `BOUNCER_PUBLIC_URL` | Bouncer's public URL | Empty |
| `SECURITY_POSTURE` | Default security posture | `deny-all` |
| `DEPLOYMENT_PLATFORM` | Deployment platform | `docker` |
| `ENVIRONMENT` | Environment name | `production` |

## Deployment Examples

### Docker Compose

```yaml
version: '3.8'

services:
  cc-bouncer-customer-api:
    image: controlcore/cc-bouncer:latest
    container_name: cc-bouncer-customer-api
    ports:
      - "8080:8080"
    environment:
      # Bouncer Configuration
      - BOUNCER_PORT=8080
      - BOUNCER_ID=bouncer-customer-api-1
      - BOUNCER_NAME=Customer API Bouncer
      - BOUNCER_TYPE=reverse-proxy
      
      # Resource Information (Auto-Discovery)
      - RESOURCE_NAME=Customer API
      - RESOURCE_TYPE=api
      - TARGET_HOST=customer-api:8000
      - ORIGINAL_HOST_URL=https://api.company.com
      - BOUNCER_PUBLIC_URL=https://protected.company.com
      - SECURITY_POSTURE=deny-all
      
      # Deployment Context
      - DEPLOYMENT_PLATFORM=docker
      - ENVIRONMENT=production
      
      # Control Plane Connection
      - PAP_API_URL=http://cc-pap-api:8082
      - OPAL_SERVER_URL=http://cc-opal:7000
      - TENANT_ID=your-tenant-id
      - API_KEY=your-api-key
      
      # Operational
      - LOG_ENABLED=true
      - CACHE_ENABLED=true
    depends_on:
      - cc-pap-api
      - cc-opal
```

### Kubernetes (Helm)

```yaml
bouncer:
  enabled: true
  replicaCount: 1
  
  env:
    - name: BOUNCER_ID
      value: "bouncer-customer-api-1"
    - name: BOUNCER_NAME
      value: "Customer API Bouncer"
    - name: BOUNCER_TYPE
      value: "reverse-proxy"
    
    # Resource Auto-Discovery
    - name: RESOURCE_NAME
      value: "Customer API"
    - name: RESOURCE_TYPE
      value: "api"
    - name: TARGET_HOST
      value: "customer-api:8000"
    - name: ORIGINAL_HOST_URL
      value: "https://api.company.com"
    - name: BOUNCER_PUBLIC_URL
      value: "https://protected.company.com"
    - name: SECURITY_POSTURE
      value: "deny-all"
    
    # Deployment Context
    - name: DEPLOYMENT_PLATFORM
      value: "kubernetes"
    - name: ENVIRONMENT
      value: "production"
    
    # Control Plane Connection
    - name: PAP_API_URL
      value: "http://cc-pap:8082"
    - name: TENANT_ID
      valueFrom:
        secretKeyRef:
          name: controlcore-secrets
          key: tenant-id
    - name: API_KEY
      valueFrom:
        secretKeyRef:
          name: controlcore-secrets
          key: api-key
```

## Resource Types

| Type | Description | Use Cases |
|------|-------------|-----------|
| `api` | REST APIs, GraphQL APIs | Web services, microservices |
| `webapp` | Web applications | Admin panels, customer portals |
| `database` | Databases | PostgreSQL, MySQL, MongoDB |
| `ai-agent` | AI agents and services | LLM agents, AI assistants |
| `mcp-server` | Model Context Protocol servers | Claude MCP integrations |

## Security Postures

| Posture | Description | Behavior |
|---------|-------------|----------|
| `deny-all` | Secure by default (recommended) | Denies all requests unless explicitly allowed by policy |
| `allow-all` | Permissive | Allows all requests unless explicitly denied by policy |

## Benefits

### 1. **Reduced Deployment Time**
- **Before**: ~2 hours (manual configuration)
- **After**: ~15 minutes (automatic)

### 2. **Eliminates Configuration Drift**
- Resource configuration comes from infrastructure code
- No manual data entry in UI
- Single source of truth

### 3. **Improved Accuracy**
- No typos or manual errors
- Automatic validation
- Consistent naming

### 4. **Better Visibility**
- See which bouncer protects each resource
- Track bouncer health and status
- Monitor resource protection coverage

### 5. **Easier Scaling**
- Deploy multiple bouncers quickly
- Each bouncer auto-registers
- Centralized management

## Workflow

### Deployment Flow

```
1. Customer configures resource in deployment template
   ↓
2. Deploys bouncer with resource configuration
   ↓
3. Bouncer starts and registers with Control Plane
   ↓
4. Control Plane creates PEP and resource records
   ↓
5. Resource appears in UI automatically
   ↓
6. Admin enriches resource with business metadata
   ↓
7. Admin creates policies for the resource
```

### Updating Resources

To update a resource configuration:

1. **Update deployment template** with new values
2. **Redeploy bouncer** (restart or rolling update)
3. **Bouncer re-registers** with updated information
4. **Resource updated** in Control Plane automatically

Note: Enrichment data (business context, classifications) is preserved during updates.

## Monitoring

### Bouncer Status

View bouncer status in Control Plane UI:

- **Active**: Bouncer is running and sending heartbeats
- **Inactive**: Bouncer hasn't sent heartbeat recently
- **Error**: Bouncer encountered an error

### Resource Discovery Audit

All resource discoveries are logged in the audit log:

```json
{
  "event_type": "RESOURCE_CREATED",
  "auto_discovered": true,
  "bouncer_id": "bouncer-customer-api-1",
  "resource_name": "Customer API",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Troubleshooting

### Resource Not Appearing

1. **Check bouncer logs**:
   ```bash
   docker-compose logs cc-bouncer
   ```

2. **Verify environment variables** are set correctly

3. **Check Control Plane connectivity**:
   ```bash
   curl http://cc-pap-api:8082/api/v1/health
   ```

4. **Verify API key** is valid

### Bouncer Shows as Inactive

1. **Check heartbeat logs** in bouncer
2. **Verify network connectivity** to Control Plane
3. **Check firewall rules**

### Resource Not Updating

1. **Restart bouncer** to trigger re-registration
2. **Check for errors** in Control Plane logs
3. **Verify bouncer_id** matches existing record

## API Reference

### POST /api/v1/peps/register

Registers a bouncer and its protected resource.

**Request Body**:
```json
{
  "bouncer_id": "bouncer-customer-api-1",
  "bouncer_name": "Customer API Bouncer",
  "bouncer_type": "reverse-proxy",
  "tenant_id": "your-tenant-id",
  "resource": {
    "name": "Customer API",
    "type": "api",
    "target_host": "customer-api:8000",
    "original_host_url": "https://api.company.com",
    "deployment_url": "https://protected.company.com",
    "default_security_posture": "deny-all"
  },
  "deployment_info": {
    "platform": "kubernetes",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

**Response**:
```json
{
  "id": 123,
  "name": "Customer API Bouncer",
  "bouncer_id": "bouncer-customer-api-1",
  "status": "active",
  "environment": "production",
  "deployment_mode": "reverse-proxy",
  "target_url": "customer-api:8000",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### PUT /api/v1/resources/{resource_id}/enrich

Enriches an auto-discovered resource with metadata.

**Request Body**:
```json
{
  "business_context": "Primary customer-facing API",
  "data_classification": "confidential",
  "compliance_tags": ["GDPR", "SOC2"],
  "owner_email": "platform-team@company.com",
  "owner_team": "Platform Engineering",
  "sla_tier": "gold",
  "data_residency": "us",
  "audit_level": "detailed"
}
```

## Best Practices

1. **Use Descriptive Names**: Make resource names clear and consistent
2. **Set Correct Types**: Choose the most specific resource type
3. **Configure Security Posture**: Use `deny-all` for production
4. **Add Business Context**: Enrich resources with metadata immediately
5. **Monitor Bouncer Health**: Set up alerts for inactive bouncers
6. **Keep Deployment Code**: Store bouncer configs in version control
7. **Use Secrets Management**: Don't hardcode API keys in configs

## Migration from Manual Resources

If you have existing manually-created resources:

1. **Deploy bouncers** with matching resource names
2. **Resources won't be duplicated** (matched by name)
3. **Bouncers link** to existing resources automatically
4. **Mark as auto-discovered** if desired

Or:

1. **Delete manual resources** from UI
2. **Deploy bouncers** with auto-discovery
3. **Resources recreated** automatically
4. **Re-enrich** with metadata (previous enrichment lost)

## Support

For questions or issues with auto-discovery:

- Documentation: https://docs.controlcore.io
- Support: support@controlcore.io
- GitHub Issues: https://github.com/controlcore/control-core/issues

