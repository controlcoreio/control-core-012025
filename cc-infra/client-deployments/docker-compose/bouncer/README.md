# Control Core - Standalone Bouncer Docker Compose Deployment

This directory contains a Docker Compose configuration for deploying a standalone Control Core Bouncer (PEP) that connects to a remote Control Plane.

## What's Included

- **cc-bouncer**: Policy Enforcement Point (PEP) with integrated:
  - Policy Decision Point (PDP)
  - OPAL Client for policy synchronization
  - OPA (Open Policy Agent) for policy evaluation
  - Caching layer for high performance

- **cc-bouncer-redis** (optional): Distributed caching for production deployments

## Use Cases

Deploy a bouncer when you need to:
- Protect an API or microservice with policy-based access control
- Enforce policies in real-time with sub-100ms latency
- Synchronize policies from GitHub or Control Plane
- Add AI agent control and content injection
- Implement compliance and security controls

## Prerequisites

- Docker 20.10+
- Docker Compose v2.x
- 2GB RAM minimum (4GB recommended)
- 1 CPU core minimum
- Network access to:
  - Control Plane (PAP API)
  - Target application
  - GitHub (if using direct sync)

## Quick Start

### 1. Configure Environment

```bash
# Copy environment template
cp env.template .env

# Edit configuration
nano .env
```

### 2. Required Configuration

Edit `.env` and set these **required** values:

```bash
# Bouncer Identity
BOUNCER_NAME=my-api-gateway-prod
TENANT_ID=your-tenant-id
API_KEY=your-bouncer-api-key

# Target Application (the app you want to protect)
TARGET_HOST=api.yourapp.com:443
TARGET_PORT=443

# Control Plane Connection
# For Self-Hosted: http://your-controlplane.example.com:8000
# For Pro Plan: https://your-tenant.controlcore.io
PAP_API_URL=https://your-tenant.controlcore.io
```

### 3. Start Bouncer

```bash
# Start bouncer (without Redis)
docker compose up -d

# OR with Redis caching (recommended for production)
docker compose --profile with-redis up -d

# Check status
docker compose ps

# View logs
docker compose logs -f cc-bouncer
```

### 4. Verify Deployment

```bash
# Check bouncer health
curl http://localhost:8080/health

# Check metrics
curl http://localhost:9090/metrics

# Test authorization (replace with your test data)
curl -X POST http://localhost:8080/api/v1/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "user": {"id": "test-user", "roles": ["developer"]},
    "resource": {"id": "api-endpoint", "type": "api"},
    "action": {"name": "read"}
  }'
```

## Configuration Details

### Bouncer Identity

```bash
# Unique name for this bouncer instance
BOUNCER_NAME=api-gateway-prod

# Your tenant ID from Control Plane
TENANT_ID=acme-corp-123

# API key for authentication with Control Plane
API_KEY=your-bouncer-api-key
```

### Target Application

The application you want to protect:

```bash
# Hostname and port of your application
TARGET_HOST=api.yourapp.com:443
TARGET_PORT=443
```

Traffic flow: `Client → Bouncer → Target Application`

### Control Plane Connection

#### Self-Hosted Control Plane:
```bash
PAP_API_URL=http://your-controlplane.example.com:8000
```

#### Pro Plan (ControlCore Hosted):
```bash
PAP_API_URL=https://your-tenant.controlcore.io
```

### GitHub Policy Sync (Optional)

For direct GitHub repository synchronization:

```bash
GITHUB_REPO_URL=https://github.com/your-org/policies
GITHUB_REPO_BRANCH=main
GITHUB_TOKEN=ghp_your_github_token
GITHUB_POLICY_PATH=policies/api-gateway-prod/
```

**Directory structure in GitHub**:
```
policies/
└── api-gateway-prod/
    ├── sandbox/
    │   ├── policy1.rego
    │   └── policy2.rego
    └── production/
        ├── policy1.rego
        └── policy2.rego
```

### Performance Tuning

```bash
# Policy cache configuration
CACHE_ENABLED=true
CACHE_TTL=5m                # How long to cache policies
CACHE_MAX_SIZE=1000         # Max number of cached policies

# Decision cache configuration
DECISION_CACHE_TTL=1m       # How long to cache decisions
```

### TLS/SSL Configuration

For HTTPS connections:

```bash
TLS_ENABLED=true
TLS_CERTS_PATH=./certs
TLS_CERT_PATH=/certs/tls.crt
TLS_KEY_PATH=/certs/tls.key
```

Place your certificates in `./certs/` directory before starting.

## Deployment Scenarios

### Scenario 1: Protect Internal API

```bash
BOUNCER_NAME=internal-api-prod
TARGET_HOST=internal-api:8000
PAP_API_URL=http://controlplane:8000
```

### Scenario 2: Protect External API with GitHub Sync

```bash
BOUNCER_NAME=public-api-prod
TARGET_HOST=api.example.com:443
PAP_API_URL=https://tenant.controlcore.io
GITHUB_REPO_URL=https://github.com/org/policies
GITHUB_TOKEN=ghp_token
```

### Scenario 3: Multi-Environment Deployment

Deploy separate bouncers for different environments:

**Production Bouncer**:
```bash
BOUNCER_NAME=api-gateway-production
TARGET_HOST=api-prod.example.com:443
GITHUB_POLICY_PATH=policies/api-gateway/production/
```

**Staging Bouncer**:
```bash
BOUNCER_NAME=api-gateway-staging
TARGET_HOST=api-staging.example.com:443
GITHUB_POLICY_PATH=policies/api-gateway/staging/
```

## Monitoring

### Health Checks

```bash
# Bouncer health
curl http://localhost:8080/health

# Response: {"status": "healthy", "timestamp": "..."}
```

### Metrics

Prometheus metrics available at port 9090:

```bash
curl http://localhost:9090/metrics
```

**Key Metrics**:
- `bouncer_requests_total`: Total requests processed
- `bouncer_policy_evaluations_total`: Policy evaluations
- `bouncer_cache_hits_total`: Cache hits
- `bouncer_cache_misses_total`: Cache misses
- `bouncer_evaluation_duration_seconds`: Evaluation latency

### Logs

```bash
# View all logs
docker compose logs -f

# View bouncer logs only
docker compose logs -f cc-bouncer

# Last 100 lines
docker compose logs --tail=100 cc-bouncer
```

## Multiple Bouncers

Deploy multiple bouncers for different services:

```bash
# Create separate directories
mkdir bouncer-api-gateway
mkdir bouncer-admin-api

# Copy configuration to each
cp -r . bouncer-api-gateway/
cp -r . bouncer-admin-api/

# Configure each with unique names and ports
cd bouncer-api-gateway/
# Edit .env: BOUNCER_NAME=api-gateway, BOUNCER_PORT=8080

cd ../bouncer-admin-api/
# Edit .env: BOUNCER_NAME=admin-api, BOUNCER_PORT=8081

# Start each independently
docker compose up -d
```

## Upgrading

```bash
# Update version in .env
CC_VERSION=1.2.0

# Pull new image
docker compose pull

# Restart bouncer
docker compose up -d

# Verify
docker compose logs -f cc-bouncer
```

## Troubleshooting

### Cannot Connect to Control Plane

```bash
# Test connectivity
docker compose exec cc-bouncer curl -v ${PAP_API_URL}/health

# Check logs for connection errors
docker compose logs cc-bouncer | grep "connection"
```

### Cannot Connect to Target Application

```bash
# Test connectivity
docker compose exec cc-bouncer curl -v http://${TARGET_HOST}

# Verify network configuration
docker compose exec cc-bouncer ping ${TARGET_HOST}
```

### Policies Not Loading

```bash
# Check OPAL sync status
curl http://localhost:8080/api/v1/opal/status

# Check policy cache
curl http://localhost:8080/api/v1/policies/cache

# Force policy sync
curl -X POST http://localhost:8080/api/v1/opal/sync
```

### High Latency

```bash
# Check cache statistics
curl http://localhost:8080/api/v1/stats

# Enable Redis caching
docker compose --profile with-redis up -d

# Increase cache TTL in .env
CACHE_TTL=10m
DECISION_CACHE_TTL=5m
```

### Reset Bouncer

```bash
# Stop bouncer
docker compose down

# Remove volumes
docker volume rm cc_bouncer_cache cc_bouncer_logs

# Start fresh
docker compose up -d
```

## Security Best Practices

1. **Secure API Keys**: Use strong, unique API keys per bouncer
2. **Network Isolation**: Deploy bouncer in same network as target app
3. **TLS Everywhere**: Enable TLS for external connections
4. **Restrict Access**: Use firewall rules to limit bouncer access
5. **Monitor Logs**: Set up alerting for authorization failures
6. **Rotate Credentials**: Regularly rotate API keys and GitHub tokens
7. **Update Regularly**: Keep bouncer updated with security patches

## Production Checklist

- [ ] Unique bouncer name configured
- [ ] Strong API key generated
- [ ] Target application configured correctly
- [ ] Control Plane connectivity tested
- [ ] Redis caching enabled (for production)
- [ ] TLS configured (if needed)
- [ ] Monitoring and alerting set up
- [ ] Backup API key stored securely
- [ ] Log aggregation configured
- [ ] Firewall rules configured
- [ ] Performance testing completed

## Support

- **Documentation**: https://docs.controlcore.io
- **GitHub Issues**: For Kickstart plan users
- **Email Support**: support@controlcore.io (Pro/Custom plans)

---

**Last Updated**: 2025-10-31

