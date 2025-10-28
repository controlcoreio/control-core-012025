# Control Core Architecture Overview

## Component Naming and Structure

### Core Components

#### 1. **cc-pap** (Policy Administration Point)

- **Purpose**: Frontend UI for policy management and administration
- **Technology**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Location**: `/cc-pap/`
- **Features**: Policy creation, management, monitoring, user interface, AI integration for policy creation enhancement

#### 2. **cc-pap-api** (Policy Administration Point API)

- **Purpose**: Backend API for policy management and administration
- **Technology**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **Location**: `/cc-pap-api/`
- **Features**: Policy CRUD, user management, authentication, AI agent control

#### 3. **cc-bouncer** (Policy Enforcement Point with integrated PDP)

- **Purpose**: Reverse proxy with integrated Policy Decision Point
- **Technology**: Go, Gin framework, OPA integration
- **Location**: `/cc-bouncer/`
- **Features**:
  - Reverse proxy functionality
  - Policy enforcement
  - Decision caching
  - Content injection
  - Audit logging
  - Integrated PDP (Policy Decision Point)

#### 4. **cc-pap-pro-tenant** (Multi-tenant Control Plane for Pro customers)

- **Purpose**: Multi-tenant PAP for Pro plan customers
- **Technology**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **Location**: `/cc-pap-pro-tenant/`
- **Features**:
  - Tenant isolation
  - Bouncer connection management
  - Certificate management
  - Advanced monitoring
  - Customer-specific configurations

### Demo Components

#### 5. **acme-consulting-demo-api** (Standalone Demo Application)

- **Purpose**: Business intelligence demo application (no Control Core dependencies)
- **Technology**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **Location**: `/acme-consulting-demo-api/`
- **Features**: Client management, financial analytics, employee management

#### 6. **acme-consulting-demo-frontend** (Demo Application UI)

- **Purpose**: Frontend for the demo application
- **Technology**: Next.js, TypeScript, Tailwind CSS
- **Location**: `/acme-consulting-demo-frontend/`
- **Features**: Business intelligence dashboard, analytics, reporting

### Infrastructure Components

#### 7. **cc-signup-service** (Customer Onboarding)

- **Purpose**: AWS-hosted signup and onboarding service
- **Technology**: FastAPI, Python, Stripe integration, Auth0
- **Location**: `/cc-signup-service/`
- **Features**: Customer registration, subscription management, package generation

#### 8. **cc-infra** (Infrastructure Management)

- **Purpose**: Docker, Kubernetes, Helm charts, deployment configurations
- **Location**: `/cc-infra/`
- **Features**:
  - Docker Compose files
  - Kubernetes manifests
  - Helm charts
  - Auto-scaling configurations
  - Customer download packages

## Architecture Patterns

### 1. **Kickstart Plan (Self-Hosted)**

```text
Customer Environment:
├── cc-pap (UI)
├── cc-pap-api (Backend)
├── cc-bouncer (PEP + PDP)
├── PostgreSQL (Database)
└── OPAL (Policy Sync)
```

### 2. **Pro Plan (Hybrid)**

```text
AWS (Hosted Control Plane):
├── cc-pap-pro-tenant (Multi-tenant PAP)
├── Tenant Isolation
└── Customer Management
Customer Environment:
├── cc-bouncer (PEP + PDP)
├── Direct connection to AWS
└── Certificate management
```

### 3. **Custom Plan (Enterprise)**

```text
Customer Environment:
├── cc-pap (UI)
├── cc-pap-api (Backend)
├── cc-bouncer (PEP + PDP)
├── PostgreSQL (Database)
├── OPAL (Policy Sync)
└── Dedicated resources
```

## Component Relationships

### Policy Flow

```text
cc-pap (UI) → cc-pap-api (Backend) → OPAL → cc-bouncer (PEP+PDP) → Target Application
```

### Multi-tenant Flow (Pro Plan)

```text
Customer → cc-pap-pro-tenant (AWS) → Customer's cc-bouncer → Target Application
```

### Decision Flow

```text
Request → cc-bouncer (PEP) → Integrated PDP → OPA → Decision → Response
```

## Key Architectural Decisions

### 1. **PDP Integration with Bouncer**

- **Decision**: Merged PDP functionality into cc-bouncer
- **Rationale**: PDP is closer to the enforcement point and requires auto-scaling
- **Benefits**:
  - Reduced latency
  - Simplified deployment
  - Better performance
  - Easier scaling

### 2. **Multi-tenant Control Plane**

- **Decision**: Separate cc-pap-pro-tenant for Pro customers
- **Rationale**: Pro customers need isolated environments with advanced features
- **Benefits**:
  - Tenant isolation
  - Advanced monitoring
  - Certificate management
  - Direct bouncer connections

### 3. **Naming Consistency**

- **Decision**: Standardized naming with cc- prefix

- **Changes Made**:
  - `cc-frontend` → `cc-pap`
  - `cc-multi-tenant-control-plane` → `cc-pap-pro-tenant`
  - `cc-pdp` → Merged into `cc-bouncer` (integrated PDP)
  - `cc-pap-admin-server` → Removed (replaced by `cc-pap-api`)
  - `cc-pap-client` → Removed (replaced by `cc-bouncer`)

## Deployment Models

### 1. **Self-Hosted (Kickstart & Custom)**

- All components deployed in customer environment
- Full control and isolation
- Requires customer infrastructure management

### 2. **Hybrid (Pro)**

- Control Plane hosted on AWS
- Bouncer deployed in customer environment
- Direct secure connections between components

### 3. **Fully Hosted (Future)**

- All components hosted on AWS
- Managed service model
- Maximum convenience for customers

## Security Considerations

### 1. **Tenant Isolation**

- Database schema separation
- Redis namespace isolation
- S3 prefix isolation
- Network isolation

### 2. **Certificate Management**

- Client certificates for bouncer connections
- Server certificates for HTTPS
- Certificate rotation and validation

### 3. **Network Security**

- TLS/SSL encryption
- Certificate-based authentication
- Network segmentation
- Firewall rules

## Monitoring and Observability

### 1. **Metrics Collection**

- Tenant-specific metrics
- Performance monitoring
- Resource usage tracking
- Custom metrics

### 2. **Logging**

- Structured logging
- Tenant-specific log aggregation
- Audit trails
- Security logging

### 3. **Alerting**

- Real-time alerts
- Tenant-specific alerting
- Escalation policies
- Custom alerts

## Scalability Considerations

### 1. **Auto-scaling**

- Horizontal Pod Autoscaler (HPA)
- CPU and memory utilization targets
- Configurable scaling policies
- Resource limits per tenant

### 2. **Load Balancing**

- Multiple bouncer instances
- Resource-specific bouncers
- Load distribution
- Health checks

### 3. **Caching**

- Decision caching
- Policy caching
- Redis-based caching
- TTL management

## Future Enhancements

### 1. **Advanced AI Integration**

- LLM-specific policies
- RAG system integration
- Context engineering
- Prompt modification

### 2. **Enhanced Monitoring**

- Real-time dashboards
- Predictive analytics
- Anomaly detection
- Performance optimization

### 3. **Enterprise Features**

- Multi-region deployment
- Disaster recovery
- Compliance reporting
- Advanced security
