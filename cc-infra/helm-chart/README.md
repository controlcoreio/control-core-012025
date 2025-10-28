# Control Core Helm Charts
This directory contains Helm charts for deploying Control Core and the ACME Consulting Demo application.
## Charts Overview
### 1. Control Core Chart (`controlcore/`)

Complete Control Core platform deployment including:
- **cc-frontend**: Control Core Admin UI (port 3000)
- **cc-pap**: Policy Administration Point API (port 8082)
- **cc-bouncer**: Policy Enforcement Point (port 8080)
- **cc-opal**: OPAL server for policy synchronization (port 7000)
- **cc-db**: PostgreSQL database (port 5432)
### 2. CC Demo App Chart (`cc-demoapp/`)

Demo application with flexible bouncer deployment:
- **Sidecar Mode**: cc-bouncer runs as sidecar container (default)
- **Standalone Mode**: cc-bouncer runs as separate service
- **cc-demoapp-api**: Demo business application (port 8000)
- **cc-demoapp-frontend**: Demo frontend (port 3000)
- **postgresql**: Demo database (port 5432)
## Deployment Options
### Control Core Bouncer Deployment Modes
#### 1. Standalone Service (Recommended for Production)

```yaml
# In values.yaml

bouncer:
  enabled: true
  replicaCount: 1
```
#### 2. Sidecar Container (Recommended for Demo)

```yaml
# In cc-demoapp values.yaml

api:
  sidecar:
    enabled: true
    name: cc-bouncer-sidecar
```
## Quick Start
### Deploy Control Core Platform

```bash
# Install Control Core

helm install controlcore ./controlcore
# Or with custom values

helm install controlcore ./controlcore -f controlcore/values.yaml
```
### Deploy CC Demo App with Sidecar

```bash
# Install CC Demo App with sidecar bouncer

helm install cc-demoapp ./cc-demoapp
# Or with standalone bouncer

helm install cc-demoapp ./cc-demoapp --set standaloneBouncer.enabled=true
```
## Configuration
### Environment Variables

- `TENANT_ID`: Tenant identifier
- `API_KEY`: API authentication key
- `PAP_API_URL`: Policy Administration Point URL
- `OPAL_SERVER_URL`: OPAL server URL
- `TARGET_HOST`: Target application host (for bouncer)
### Service Ports

- **Frontend**: 3000
- **PAP API**: 8082
- **Bouncer**: 8080
- **OPAL**: 7000
- **Database**: 5432
## Customer Deployment Options
### Option 1: Full Self-Hosted (Kickstart & Custom)

- Customer deploys all Control Core components
- Bouncer can be standalone or sidecar
- Complete control over infrastructure
### Option 2: Hybrid (Pro Plan)

- Control Plane hosted on AWS (multi-tenant)
- Customer hosts Bouncer (standalone or sidecar)
- Shared Control Plane, isolated enforcement
## Security Features
### Container Security

- Non-root user execution
- Multi-stage builds
- Health checks
- Resource limits
### Network Security

- Internal service communication
- Configurable ingress
- TLS termination at ingress
## Monitoring & Health Checks
All services include:
- **Readiness Probes**: Check if service can handle requests
- **Liveness Probes**: Check if service is alive
- **Startup Probes**: Allow time for initial startup
## Troubleshooting
### Common Issues

1. **Service Discovery**: Ensure services can reach each other
2. **Database Connection**: Check database credentials and connectivity
3. **Policy Sync**: Verify OPAL server configuration and GitHub token
### Debug Commands

```bash
# Check pod status

kubectl get pods
# Check service endpoints

kubectl get services
# View logs

kubectl logs -f deployment/cc-bouncer
```
## Customer Download Package
When customers sign up, they receive:
1. **Helm Charts**: For Kubernetes deployment
2. **Docker Compose**: For simple deployment
3. **K8s Manifests**: For direct Kubernetes deployment
4. **Setup Scripts**: Automated deployment scripts
5. **Documentation**: Deployment and configuration guides
## Architecture Benefits
### Flexibility

- Multiple deployment options (standalone vs sidecar)
- Configurable resource allocation
- Environment-specific configurations
### Scalability

- Horizontal pod autoscaling support
- Load balancing across replicas
- Resource optimization
### Security

- Network isolation
- Secret management
- RBAC integration
