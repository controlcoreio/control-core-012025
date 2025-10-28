# Control Core Deployment Templates

This directory contains templates for deploying Control Core with resource auto-discovery.

## Available Templates

### 1. `quick-deploy.sh`

Single-command deployment script that:
- Deploys Control Plane
- Waits for readiness
- Deploys all bouncers
- Provides status and next steps

**Usage**:
```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

### 2. `bouncer-example-compose.yml`

Example showing multiple bouncers protecting different resources:
- Customer API (REST API)
- Admin Portal (Web App)
- AI Agent (AI Service)

**Usage**:
```bash
# Copy and customize
cp bouncer-example-compose.yml my-bouncers-compose.yml

# Edit resource configurations
nano my-bouncers-compose.yml

# Deploy
docker-compose -f my-bouncers-compose.yml up -d
```

## Quick Start

### Step 1: Deploy Control Plane

```bash
docker-compose -f controlcore-compose.yml up -d
```

### Step 2: Configure Your Bouncer

Copy the example and update these variables:

```yaml
environment:
  # Update these for your resource:
  - RESOURCE_NAME=My Customer API  # Your resource name
  - RESOURCE_TYPE=api              # api, webapp, database, ai-agent
  - TARGET_HOST=my-api:8000        # Your internal service
  - ORIGINAL_HOST_URL=https://api.mycompany.com  # Public URL
```

### Step 3: Deploy Bouncer

```bash
docker-compose -f my-bouncers-compose.yml up -d
```

### Step 4: Verify Auto-Discovery

```bash
# Check bouncer logs
docker logs customer-api-bouncer | grep "Successfully registered"

# View in Control Plane
curl http://localhost:8082/api/v1/resources | jq

# Look for your resource with auto_discovered: true
```

### Step 5: Enrich Your Resource

1. Go to http://localhost:3000/settings/resources
2. Find your auto-discovered resource
3. Click to edit/enrich
4. Add business context, data classification, etc.

## Resource Types

Choose the appropriate type for your resource:

| Type | Description | Examples |
|------|-------------|----------|
| `api` | REST/GraphQL APIs | Customer API, Payment API |
| `webapp` | Web applications | Admin Portal, Dashboard |
| `database` | Databases | PostgreSQL, MySQL, MongoDB |
| `ai-agent` | AI services | ChatGPT wrapper, AI assistant |
| `mcp-server` | MCP servers | Claude MCP integrations |

## Security Postures

| Posture | Behavior | Use Case |
|---------|----------|----------|
| `deny-all` | Deny by default (recommended) | Production, sensitive data |
| `allow-all` | Allow by default | Development, public APIs |

## Environment Variables Reference

### Required

- `RESOURCE_NAME` - Display name for the resource
- `RESOURCE_TYPE` - Type of resource (see table above)
- `TARGET_HOST` - Internal host:port to protect
- `PAP_API_URL` - Control Plane API URL
- `TENANT_ID` - Your tenant identifier
- `API_KEY` - API authentication key

### Optional

- `BOUNCER_ID` - Unique identifier (auto-generated if not set)
- `BOUNCER_NAME` - Human-readable bouncer name
- `BOUNCER_TYPE` - `reverse-proxy` or `sidecar`
- `ORIGINAL_HOST_URL` - Original public URL
- `BOUNCER_PUBLIC_URL` - Bouncer's public URL
- `SECURITY_POSTURE` - `deny-all` or `allow-all`
- `DEPLOYMENT_PLATFORM` - `docker`, `kubernetes`, or `binary`
- `ENVIRONMENT` - `production`, `staging`, or `dev`

## Advanced Scenarios

### Protecting Multiple APIs

Create separate bouncer services for each API:

```yaml
services:
  customer-api-bouncer:
    # ... config for Customer API
  
  payment-api-bouncer:
    # ... config for Payment API
  
  analytics-api-bouncer:
    # ... config for Analytics API
```

### Sidecar Deployment

For sidecar mode (runs alongside your app):

```yaml
services:
  my-app:
    image: my-app:latest
    # ... your app config
  
  my-app-bouncer:
    image: controlcore/cc-bouncer:latest
    environment:
      - BOUNCER_TYPE=sidecar
      - TARGET_HOST=localhost:8000  # Same container network
      # ... other config
```

### Kubernetes/Helm

For Kubernetes deployments, use the Helm chart values:

```yaml
# values.yaml
bouncer:
  env:
    - name: RESOURCE_NAME
      value: "My API"
    - name: RESOURCE_TYPE
      value: "api"
    # ... other variables
```

## Troubleshooting

### Bouncer Won't Start

1. Check Docker logs: `docker logs <bouncer-name>`
2. Verify environment variables are set
3. Check Control Plane is running

### Resource Not Appearing

1. Check registration succeeded in logs
2. Verify API_KEY is correct
3. Check Control Plane API: `curl http://localhost:8082/api/v1/resources`

### Duplicate Resources

- Use unique `BOUNCER_ID` for each bouncer
- Don't restart bouncers with different IDs

## Documentation

- **Auto-Discovery Guide**: `/cc-infra/docs/AUTO_DISCOVERY.md`
- **Quick Start**: `/AUTO_DISCOVERY_QUICKSTART.md`
- **Deployment Guides**: `/cc-infra/deployment-guides/`

## Support

- Documentation: https://docs.controlcore.io
- Email: support@controlcore.io
- Issues: GitHub Issues

