# Control Core - Client Deployment Options

This directory contains production-ready deployment configurations for Control Core. Clients can choose from three deployment methods based on their infrastructure and requirements.

## Deployment Decision Matrix

| Factor | Helm Chart | Docker Compose | Kubernetes YAML |
|--------|-----------|----------------|-----------------|
| **Platform** | Kubernetes | Single server or VMs | Kubernetes |
| **Complexity** | Low | Very Low | Medium |
| **Customization** | High | Medium | Very High |
| **Best For** | Production K8s | Dev/Small deployments | Advanced K8s users |
| **Auto-scaling** | ✅ Yes | ❌ No | ✅ Yes (manual config) |
| **HA Support** | ✅ Yes | ⚠️ Limited | ✅ Yes (manual config) |
| **Updates** | Easy | Medium | Manual |

## Deployment Methods

### 1. Helm Chart (Recommended for Kubernetes)

**Location**: `/cc-infra/client-deployments/helm-chart/`

**Use When**:
- Deploying to Kubernetes clusters
- Need easy configuration management
- Want automated scaling and HA
- Prefer simplified updates

**Quick Start**:
```bash
# Add Control Core Helm repository
helm repo add controlcore https://charts.controlcore.io
helm repo update

# Install Control Plane
helm install cc-control-plane controlcore/control-plane \
  --namespace controlcore \
  --create-namespace \
  --values values-production.yaml

# Install Bouncer(s)
helm install cc-bouncer-prod controlcore/bouncer \
  --namespace controlcore \
  --values bouncer-values.yaml
```

**Features**:
- Pre-configured for production
- Built-in monitoring and observability
- Automatic certificate management
- Database backup configurations
- Resource limits and quotas

---

### 2. Docker Compose (Recommended for Single Server)

**Location**: `/cc-infra/client-deployments/docker-compose/`

**Use When**:
- Deploying to a single server or VM
- Testing production configurations
- Small to medium deployments
- Prefer Docker over Kubernetes

#### 2a. Control Plane Deployment

**Location**: `docker-compose/control-plane/`

Deploys complete Control Plane:
- PAP API (Backend)
- PAP UI (Frontend)
- PostgreSQL Database
- Redis Cache
- Signup Service

**Quick Start**:
```bash
cd docker-compose/control-plane/

# Copy and configure environment
cp env.template .env
nano .env  # Configure your settings

# Start Control Plane
docker compose up -d

# Check status
docker compose ps
docker compose logs -f cc-pap-api
```

**Access**:
- PAP UI: http://localhost (port 80)
- PAP API: http://localhost:8000
- API Docs: http://localhost:8000/docs

#### 2b. Bouncer Deployment

**Location**: `docker-compose/bouncer/`

Deploys standalone Bouncer (PEP) that connects to remote Control Plane.

**Quick Start**:
```bash
cd docker-compose/bouncer/

# Copy and configure environment
cp env.template .env
nano .env  # Configure Control Plane URL and credentials

# Start Bouncer
docker compose up -d

# With Redis caching (recommended)
docker compose --profile with-redis up -d

# Check status
docker compose ps
docker compose logs -f cc-bouncer
```

**Configuration**:
- Connect to self-hosted Control Plane or Pro Plan hosted service
- Configure target application to protect
- Set up GitHub policy repository (optional)

---

### 3. Kubernetes YAML Manifests (Advanced)

**Location**: `/cc-infra/client-deployments/kubernetes/`

**Use When**:
- Need full control over Kubernetes resources
- Custom infrastructure requirements
- Integration with existing K8s tooling
- Prefer GitOps workflows

**Structure**:
```
kubernetes/
├── control-plane/
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── configmap.yaml
│   ├── database.yaml
│   ├── redis.yaml
│   ├── pap-api.yaml
│   ├── pap-ui.yaml
│   └── ingress.yaml
└── bouncer/
    ├── configmap.yaml
    ├── secrets.yaml
    ├── deployment.yaml
    ├── service.yaml
    └── hpa.yaml
```

**Quick Start**:
```bash
cd kubernetes/control-plane/

# Create namespace
kubectl apply -f namespace.yaml

# Configure secrets
kubectl create secret generic cc-secrets \
  --from-literal=db-password='your-password' \
  --from-literal=jwt-secret='your-jwt-secret' \
  -n controlcore

# Apply configurations
kubectl apply -f .

# Verify deployment
kubectl get pods -n controlcore
kubectl get svc -n controlcore
```

---

## Architecture Overview

### Self-Hosted Deployment (Kickstart/Custom Plans)

```
┌─────────────────────────────────────────┐
│        Control Plane (Your Infra)       │
│  ┌────────────┐  ┌──────────────────┐   │
│  │  PAP UI    │  │    PAP API       │   │
│  │ (Frontend) │  │   (Backend)      │   │
│  └────────────┘  └──────────────────┘   │
│  ┌────────────┐  ┌──────────────────┐   │
│  │ PostgreSQL │  │     Redis        │   │
│  └────────────┘  └──────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
          ┌─────────────────────┐
          │   GitHub Policies   │
          └─────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│         Bouncer 1 (Your Infra)          │
│  ┌──────────────────────────────────┐   │
│  │  PEP + PDP + OPAL + OPA         │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│         Bouncer 2 (Your Infra)          │
│  ┌──────────────────────────────────┐   │
│  │  PEP + PDP + OPAL + OPA         │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Hybrid Deployment (Pro Plan)

```
┌─────────────────────────────────────────┐
│   Control Plane (ControlCore Hosted)    │
│  ┌────────────┐  ┌──────────────────┐   │
│  │  PAP UI    │  │    PAP API       │   │
│  │            │  │                  │   │
│  └────────────┘  └──────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
          ┌─────────────────────┐
          │   GitHub Policies   │
          └─────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│         Bouncer (Your Infra)            │
│  ┌──────────────────────────────────┐   │
│  │  PEP + PDP + OPAL + OPA         │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Prerequisites

### For All Deployments:
- Docker 20.10+ or Kubernetes 1.24+
- 4GB RAM minimum (8GB recommended)
- 2 CPU cores minimum (4 cores recommended)
- 20GB disk space

### For Kubernetes Deployments:
- kubectl configured and connected to cluster
- Helm 3.x (for Helm chart method)
- Ingress controller (nginx, traefik, etc.)
- cert-manager (optional, for TLS)

### For Docker Compose Deployments:
- Docker Compose v2.x
- Network access to pull images
- Persistent storage configured

---

## Security Considerations

### Secrets Management:
- Never commit `.env` files to version control
- Use environment-specific secrets
- Rotate credentials regularly
- Use secret management tools (Vault, K8s Secrets, etc.)

### Network Security:
- Configure firewalls appropriately
- Use TLS/SSL for all external connections
- Implement network policies in Kubernetes
- Restrict access to admin interfaces

### Data Protection:
- Enable database encryption at rest
- Configure backup and disaster recovery
- Implement data retention policies
- Monitor for security events

---

## Monitoring and Observability

All deployment methods include:
- Health check endpoints
- Prometheus metrics
- Structured logging
- Performance metrics

### Recommended Monitoring Stack:
- **Metrics**: Prometheus + Grafana
- **Logs**: Elasticsearch + Fluentd + Kibana (EFK)
- **Tracing**: Jaeger or Zipkin
- **Alerting**: Prometheus Alertmanager

---

## Support

For deployment assistance:

- **Documentation**: [Control Core Docs](https://docs.controlcore.io)
- **Kickstart Plan**: GitHub Issues
- **Pro/Custom Plans**: support@controlcore.io
- **Community**: [Control Core Community](https://community.controlcore.io)

---

## Next Steps

1. Choose your deployment method based on the decision matrix
2. Review the specific deployment guide in the chosen directory
3. Configure environment variables and secrets
4. Deploy Control Plane
5. Deploy Bouncer(s)
6. Verify deployment and test policies
7. Set up monitoring and alerting
8. Configure backup and disaster recovery

---

**Last Updated**: 2025-10-31  
**Version**: 1.0

