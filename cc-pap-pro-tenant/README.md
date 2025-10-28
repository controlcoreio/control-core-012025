# Control Core Multi-Tenant Control Plane
Multi-tenant Control Plane for Pro plan customers, providing isolated tenant environments with comprehensive policy management, resource protection, and monitoring capabilities. Control Core is the centralized authorization and compliance platform built for the AI-driven enterprise. It solves the core problem of securing the dynamic, real-time interactions between new AI initiatives and legacy technology. By enforcing business, security, and compliance rules with dynamic context management, Control Core eliminates the need for brittle, custom-coded access logic, turning a major security liability into a strategic advantage. It empowers organizations to innovate faster, reduce operational costs, and mitigate the risk of a breach.
## Overview
The Multi-Tenant Control Plane is designed for Pro plan customers who require hosted Control Plane services with tenant isolation. It provides:
- **Tenant Isolation**: Complete separation of tenant data and configurations
- **Policy Management**: Centralized policy creation, management, and deployment
- **Resource Protection**: Management of protected resources and Bouncer deployments
- **Monitoring & Analytics**: Comprehensive monitoring and audit capabilities
- **Subscription Management**: Stripe integration for billing and subscription management
## Architecture
### Tenant Isolation
The system provides three levels of tenant isolation:
1. **Database Level**: Each tenant has isolated database schemas
2. **Application Level**: Tenant context enforced at the application layer
3. **Network Level**: Tenant-specific subdomains and routing
### Key Components
- **Tenant Management**: Create, update, and manage tenant accounts
- **Policy Engine**: Rego policy creation, validation, and deployment
- **Resource Management**: Protected resource configuration and monitoring
- **Bouncer Management**: Bouncer deployment and configuration
- **Monitoring**: Real-time metrics, alerts, and audit logging
- **Billing**: Stripe integration for subscription management
## Features
### Tenant Management

- Tenant creation and configuration
- User management within tenants
- Subscription and billing management
- Tenant-specific settings and limits
### Policy Management

- Visual policy builder
- Monaco code editor with Rego IntelliSense
- Policy validation and testing
- Version control and rollback
- Policy templates and libraries
### Resource Protection

- API Gateway integration
- AI Agent protection
- LLM service protection
- RAG system protection
- Git repository protection
### Bouncer Management

- Bouncer deployment and configuration
- Health monitoring and status tracking
- Policy synchronization
- Performance metrics
### Monitoring & Analytics

- Real-time dashboard
- Performance metrics
- Usage analytics
- Audit logging
- Alert management
### Advanced Context Generation and Ingestion

- **Multi-Tenant Context Management**: Tenant-isolated context configuration
- **Context-Aware Policy Templates**: AI agents, LLMs, and RAG systems
- **Real-time Context Ingestion**: APIs, databases, files, and streams
- **Advanced Security Policies**: Data masking, encryption, and access controls
- **Content Injection**: Request and response modification based on context
- **Performance Optimization**: Caching and rate limiting for context sources
## API Endpoints
### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user info
### Tenant Management

- `GET /api/v1/tenants/` - List tenants (admin)
- `GET /api/v1/tenants/my` - Get current tenant
- `POST /api/v1/tenants/` - Create tenant
- `PUT /api/v1/tenants/{id}` - Update tenant
- `DELETE /api/v1/tenants/{id}` - Delete tenant
### Policy Management

- `GET /api/v1/policies/` - List policies
- `POST /api/v1/policies/` - Create policy
- `PUT /api/v1/policies/{id}` - Update policy
- `DELETE /api/v1/policies/{id}` - Delete policy
- `POST /api/v1/policies/{id}/activate` - Activate policy
- `POST /api/v1/policies/{id}/deactivate` - Deactivate policy
### Resource Management

- `GET /api/v1/resources/` - List resources
- `POST /api/v1/resources/` - Create resource
- `PUT /api/v1/resources/{id}` - Update resource
- `DELETE /api/v1/resources/{id}` - Delete resource
- `POST /api/v1/resources/{id}/test` - Test resource connectivity
### Bouncer Management

- `GET /api/v1/bouncers/` - List bouncers
- `POST /api/v1/bouncers/` - Create bouncer
- `PUT /api/v1/bouncers/{id}` - Update bouncer
- `DELETE /api/v1/bouncers/{id}` - Delete bouncer
- `POST /api/v1/bouncers/{id}/start` - Start bouncer
- `POST /api/v1/bouncers/{id}/stop` - Stop bouncer
### Monitoring

- `GET /api/v1/monitoring/dashboard` - Get dashboard data
- `GET /api/v1/monitoring/metrics` - Get metrics
- `GET /api/v1/monitoring/audit-logs` - Get audit logs
- `GET /api/v1/monitoring/health` - Get health status
- `GET /api/v1/monitoring/alerts` - Get alerts
### Context Ingestion (Advanced)

- `GET /api/v1/tenants/{tenant_id}/context/sources` - Get context sources for a tenant
- `POST /api/v1/tenants/{tenant_id}/context/sources` - Create a new context source
- `GET /api/v1/tenants/{tenant_id}/context/rules` - Get context rules for a tenant
- `POST /api/v1/tenants/{tenant_id}/context/rules` - Create a new context rule
- `GET /api/v1/tenants/{tenant_id}/context/security-policies` - Get security policies for a tenant
- `POST /api/v1/tenants/{tenant_id}/context/security-policies` - Create a new security policy
- `GET /api/v1/tenants/{tenant_id}/context/config` - Get context configuration for a tenant
- `PUT /api/v1/tenants/{tenant_id}/context/config` - Update context configuration for a tenant
- `POST /api/v1/tenants/{tenant_id}/context/generate` - Generate a context-aware policy for a tenant
- `POST /api/v1/tenants/{tenant_id}/context/test` - Test context generation for a tenant
- `GET /api/v1/tenants/{tenant_id}/context/templates` - Get available context templates for a tenant
- `GET /api/v1/tenants/{tenant_id}/context/metrics` - Get context ingestion metrics for a tenant
## Configuration
### Environment Variables

```bash
# Application

APP_NAME=Control Core Multi-Tenant Control Plane
VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false
# Database

DATABASE_URL=postgresql://postgres:password@localhost:5432/control_core_multi_tenant
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30
# Redis

REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=
# Security

SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
# CORS

ALLOWED_ORIGINS=["https://controlcore.io", "https://app.controlcore.io"]
ALLOWED_HOSTS=["controlplane.controlcore.io", "*.controlcore.io"]
# Rate Limiting

RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=3600
# Tenant Settings

MAX_TENANTS_PER_PLAN={"pro": 1, "custom": 10}
TENANT_ISOLATION_LEVEL=database
# Monitoring

MONITORING_ENABLED=true
METRICS_ENABLED=true
LOG_LEVEL=INFO
# AWS

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
# S3

S3_BUCKET=control-core-tenant-data
S3_PREFIX=tenants/
# Email

SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=noreply@controlcore.io
# Stripe

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# Auth0

AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
```
## Deployment
### Docker Deployment

```bash
# Build image

docker build -t cc-multi-tenant-control-plane .
# Run container

docker run -d \
  --name cc-multi-tenant-control-plane \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://postgres:password@localhost:5432/control_core_multi_tenant \
  -e REDIS_URL=redis://localhost:6379/0 \
  -e SECRET_KEY=your-secret-key-here \
  cc-multi-tenant-control-plane
```
### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cc-multi-tenant-control-plane
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cc-multi-tenant-control-plane
  template:
    metadata:
      labels:
        app: cc-multi-tenant-control-plane
    spec:
      containers:
      - name: cc-multi-tenant-control-plane
        image: cc-multi-tenant-control-plane:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          value: "postgresql://postgres:password@cc-db:5432/control_core_multi_tenant"
        - name: REDIS_URL
          value: "redis://cc-redis:6379/0"
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: cc-secrets
              key: secret-key
---
apiVersion: v1
kind: Service
metadata:
  name: cc-multi-tenant-control-plane
spec:
  selector:
    app: cc-multi-tenant-control-plane
  ports:
  - port: 8000
    targetPort: 8000
  type: LoadBalancer
```
## Development
### Local Development

```bash
# Install dependencies

pip install -r requirements.txt
# Set environment variables

export DATABASE_URL=postgresql://postgres:password@localhost:5432/control_core_multi_tenant
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=your-secret-key-here
# Run development server

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
### Database Setup

```bash
# Create database

createdb control_core_multi_tenant
# Run migrations

alembic upgrade head
```
## Security
### Tenant Isolation

- Database-level isolation with separate schemas
- Application-level tenant context enforcement
- Network-level subdomain routing
### Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Tenant-specific permissions
- API key management
### Data Protection

- Encryption at rest and in transit
- Secure data handling
- Audit logging
- Compliance with GDPR, HIPAA, SOC2
## Monitoring
### Health Checks

- Application health endpoints
- Database connectivity checks
- Redis connectivity checks
- External service health monitoring
### Metrics

- Performance metrics
- Usage analytics
- Error rates
- Response times
### Alerting

- Real-time alerts
- Email notifications
- Webhook integrations
- Escalation policies
## Documentation
### Context Ingestion

For detailed information about context generation and ingestion capabilities, see [Context Ingestion Documentation](docs/context-ingestion.md).
## Support
For support and questions:
- Documentation: [Control Core Docs](https://docs.controlcore.io)
- Support: [support@controlcore.io](mailto:support@controlcore.io)
- Community: [Control Core Community](https://community.controlcore.io)
