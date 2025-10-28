# Control Core OPAL Integration
This directory contains the OPAL (Open Policy Administration Layer) integration for Control Core, enabling Git-based policy management and real-time policy synchronization.
## Overview
OPAL provides:
- **Git-based Policy Management**: Policies stored in Git repositories
- **Real-time Synchronization**: Automatic policy updates via webhooks
- **Policy Caching**: High-performance policy evaluation
- **Multi-tenant Support**: Isolated policy environments
- **Audit Logging**: Complete policy change tracking
## Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Git Repo      │    │   OPAL Server   │    │   OPAL Client   │
│   (Policies)    │◄───┤   (Sync)        │◄───┤   (Cache)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │   OPA Server    │
                       │   (Performance) │    │   (Evaluation)  │
                       └─────────────────┘    └─────────────────┘
```
## Quick Start
### 1. Prerequisites
- Docker and Docker Compose
- Git
- GitHub repository with policies
- GitHub token with repository access
### 2. Setup

```bash
# Navigate to OPAL directory

cd cc-infra/opal
# Run setup script

./setup-opal.sh
```
### 3. Configuration
Update the `.env` file with your configuration:

```bash
# GitHub Configuration

GITHUB_TOKEN=your-github-token-here
POLICY_REPO_URL=https://github.com/controlcoreio/staging-policies-repo.git
# Service Ports

OPAL_SERVER_PORT=7000
OPAL_CLIENT_PORT=8083
OPA_PORT=8181
REDIS_PORT=6379
# Security

OPAL_WEBHOOK_SECRET=control-core-webhook-secret
OPAL_AUTH_TOKEN=control-core-auth-token
```
### 4. Start Services

```bash
# Start all OPAL services

docker-compose -f opal-compose.yml up -d
# Check status

docker-compose -f opal-compose.yml ps
```
## Services
### OPAL Server

- **Port**: 7000
- **Purpose**: Policy synchronization from Git repository
- **Health Check**: http://localhost:7000/health
- **Bundle**: http://localhost:8080/bundle
### OPAL Client

- **Port**: 8083
- **Purpose**: Policy caching and OPA integration
- **Health Check**: http://localhost:8083/health
### OPA Server

- **Port**: 8181
- **Purpose**: Policy evaluation engine
- **Health Check**: http://localhost:8181/health
### Redis

- **Port**: 6379
- **Purpose**: Caching and performance optimization
## Policy Management
### Policy Structure
Policies are organized in the Git repository:
```
staging-policies-repo/
├── policies/
│   └── enabled/
│       ├── main.rego
│       ├── ai-agent-control.rego
│       ├── data-masking.rego
│       └── filter.rego
└── README.md
```
### Policy Types
1. **Main Policies**: Core access control rules
2. **AI Agent Control**: AI behavior and content injection
3. **Data Masking**: Sensitive data protection
4. **Filtering**: Data filtering and transformation
### Adding Policies
1. Create new `.rego` files in `policies/enabled/`
2. Follow OPA Rego syntax
3. Commit and push to Git repository
4. OPAL will automatically sync changes
### Policy Validation

```bash
# Test policy syntax

opa test policies/enabled/
# Validate policy bundle

curl -X POST http://localhost:8181/v1/data \
  -H "Content-Type: application/json" \
  -d '{"input": {"user": {"role": "admin"}, "resource": "/api/v1/policies"}}'
```
## GitHub Integration
### Webhook Setup
1. Go to your GitHub repository settings
2. Navigate to Webhooks
3. Add webhook:
   - **URL**: `http://your-server:7000/webhook`
   - **Content Type**: `application/json`
   - **Secret**: `control-core-webhook-secret`
   - **Events**: Just the push event
### Automatic Sync
When policies are pushed to the repository:
1. GitHub sends webhook to OPAL Server
2. OPAL Server pulls latest policies
3. Policies are compiled and cached
4. OPAL Client receives updated policies
5. OPA Server is updated with new policies
## Monitoring
### Health Checks

```bash
# OPAL Server

curl http://localhost:7000/health
# OPAL Client

curl http://localhost:8083/health
# OPA Server

curl http://localhost:8181/health
# Bundle Server

curl http://localhost:8080/bundle
```
### Logs

```bash
# View all logs

docker-compose -f opal-compose.yml logs
# View specific service logs

docker logs cc-opal-server
docker logs cc-opal-client
docker logs cc-opa-server
docker logs cc-redis
```
### Metrics
- **OPAL Server**: http://localhost:7000/metrics
- **OPAL Client**: http://localhost:8083/metrics
- **OPA Server**: http://localhost:8181/metrics
## Configuration
### OPAL Server Configuration

```yaml
# opal-server-config.yaml

OPAL_SERVER_PORT: 7000
OPAL_POLICY_SOURCE_TYPE: "GIT"
OPAL_POLICY_REPO_URL: "https://github.com/controlcoreio/staging-policies-repo.git"
OPAL_POLICY_REPO_POLLING_INTERVAL: 30
OPAL_WEBHOOK_ENABLED: true
OPAL_WEBHOOK_SECRET: "control-core-webhook-secret"
```
### OPAL Client Configuration

```yaml
# opal-client-config.yaml

OPAL_CLIENT_API_SERVER_PORT: 8083
OPAL_SERVER_URL: "http://cc-opal-server:7000"
OPAL_SYNC_ENABLED: true
OPAL_SYNC_INTERVAL: 30
OPAL_CACHE_ENABLED: true
OPAL_CACHE_TTL: 300
```
## Troubleshooting
### Common Issues
1. **OPAL Server not starting**
   - Check GitHub token permissions
   - Verify repository access
   - Check network connectivity
2. **Policies not syncing**
   - Verify webhook configuration
   - Check OPAL Server logs
   - Test manual policy pull
3. **OPA Server not responding**
   - Check OPAL Client status
   - Verify policy compilation
   - Check OPA Server logs
### Debug Commands

```bash
# Check service status

docker-compose -f opal-compose.yml ps
# View logs

docker-compose -f opal-compose.yml logs -f
# Test policy evaluation

curl -X POST http://localhost:8181/v1/data \
  -H "Content-Type: application/json" \
  -d '{"input": {"user": {"role": "admin"}}}'
# Force policy sync

curl -X POST http://localhost:7000/sync
```
## Security
### Authentication

- OPAL Server: Internal network only
- OPAL Client: Internal network only
- OPA Server: Internal network only
- Redis: Internal network only
### Secrets Management

- GitHub token stored in environment variables
- Webhook secret configured
- No external access to sensitive data
### Network Security

- All services on internal Docker network
- No external ports exposed by default
- TLS termination at ingress level
## Performance
### Caching

- Redis for high-performance caching
- Policy compilation caching
- Bundle compression
### Optimization

- Worker process configuration
- Connection pooling
- Batch processing
### Scaling

- Horizontal scaling support
- Load balancing
- Resource optimization
## Integration with Control Core
### PAP Integration

- OPAL Server connects to PAP API
- Real-time policy updates
- Audit logging integration
### Bouncer Integration

- OPAL Client provides policies to Bouncer
- High-performance policy evaluation
- Cached policy responses
### Frontend Integration

- Policy management UI
- Real-time policy status
- Policy testing interface
## Best Practices
1. **Policy Organization**
   - Use clear naming conventions
   - Organize by functionality
   - Document policy purpose
2. **Version Control**
   - Use semantic versioning
   - Tag releases
   - Maintain changelog
3. **Testing**
   - Test policies before deployment
   - Use policy validation
   - Monitor policy performance
4. **Security**
   - Review policy changes
   - Use least privilege
   - Audit policy access
## Support
For issues and questions:
- Check logs for error messages
- Verify configuration settings
- Test individual components
- Review OPAL documentation
## License
This integration follows the same license as Control Core platform.
