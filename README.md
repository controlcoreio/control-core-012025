# Control Core

**The centralized authorization and compliance platform built for the AI-driven enterprise.**

Control Core solves the core problem of securing the dynamic, real-time interactions between new AI initiatives and legacy technology. By enforcing business, security, and compliance rules with dynamic context management, Control Core eliminates the need for brittle, custom-coded access logic, turning a major security liability into a strategic advantage. It empowers organizations to innovate faster, reduce operational costs, and mitigate the risk of a breach.

---

## 🏗️ Platform Architecture

Control Core is built on a modern, cloud-native architecture with the following core components:

### Core Platform Components

#### 1. **cc-pap** (Policy Administration Point - Frontend)
- **Purpose**: Modern UI for policy management and administration
- **Technology**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Location**: `/cc-pap/`
- **Port**: 5173 (development), 80/443 (production)
- **Features**: 
  - Policy creation wizard with templates
  - Visual policy builder with IntelliSense
  - Getting Started wizard for onboarding
  - PIP (Policy Information Point) data source configuration
  - Real-time policy monitoring and audit logs
  - AI integration for policy creation enhancement

#### 2. **cc-pap-api** (Policy Administration Point - Backend)
- **Purpose**: Backend API for policy management and administration
- **Technology**: FastAPI, Python 3.11+, SQLAlchemy, PostgreSQL
- **Location**: `/cc-pap-api/`
- **Port**: 8000
- **Features**: 
  - Policy CRUD operations with versioning
  - User management and authentication (JWT, OAuth2)
  - PIP connector service (REST API, LDAP, Database)
  - Template management (180+ policy templates)
  - Integration with OPA/Cedar policy engines
  - OPAL data distribution endpoints
  - Redis caching for PIP metadata

#### 3. **cc-pap-core** (Shared Policy Templates & Logic)
- **Purpose**: Shared policy templates and core business logic
- **Technology**: Python, TypeScript, Rego (OPA)
- **Location**: `/cc-pap-core/`
- **Contents**:
  - **180 Policy Templates** organized by category:
    - 30 Compliance templates (PIPEDA, HIPAA, GDPR, CCPA, SOC 2)
    - 15 Canadian Financial Regulation templates (OSFI, FINTRAC, AMF)
    - 15 AI Security templates (prompt injection, RAG security)
    - 20+ Security Control templates (RBAC, Zero Trust, MFA)
    - 25+ Data Governance templates
  - Template metadata with:
    - Detailed descriptions
    - Use cases with real-world examples
    - Compliance framework mappings
    - Integration guides
    - Condition definitions with example values

#### 4. **cc-bouncer** (Policy Enforcement Point with integrated PDP)
- **Purpose**: High-performance reverse proxy with integrated Policy Decision Point
- **Technology**: Go 1.21+, Gin framework, OPA integration
- **Location**: `/cc-bouncer/`
- **Port**: Configurable (default 8080)
- **Features**:
  - Reverse proxy functionality (< 5ms latency)
  - Policy enforcement with caching
  - Decision caching (Redis)
  - Content injection for AI context
  - Comprehensive audit logging
  - Integrated PDP (Policy Decision Point)
  - Health checks and metrics

#### 5. **cc-bouncer-sidecar** (HTTP Sidecar PEP)
- **Purpose**: Lightweight sidecar container for Kubernetes deployments
- **Technology**: Go
- **Location**: `/cc-bouncer-sidecar/`
- **Features**: 
  - Transparent HTTP proxying
  - Minimal resource footprint
  - Kubernetes-native integration

#### 6. **cc-pap-pro-tenant** (Multi-tenant Control Plane for Pro customers)
- **Purpose**: Multi-tenant PAP for Pro plan customers
- **Technology**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **Location**: `/cc-pap-pro-tenant/`
- **Features**:
  - Tenant isolation and management
  - Bouncer connection management with mTLS
  - Certificate lifecycle management
  - Advanced monitoring and analytics
  - Customer-specific configurations
  - White-label support

### Supporting Components

#### 7. **cc-opal** (Policy & Data Distribution)
- **Purpose**: OPAL (Open Policy Administration Layer) integration for real-time policy/data sync
- **Technology**: Python, FastAPI, WebSocket
- **Location**: `/cc-opal/`
- **Features**: 
  - Real-time policy synchronization
  - Data source integration (Git, APIs, databases)
  - PIP data distribution
  - Cedar policy engine support
  - Multi-PEP coordination

#### 8. **cc-signup-service**
- **Purpose**: Customer onboarding and subscription management
- **Technology**: FastAPI, Python, Stripe integration
- **Location**: `/cc-signup-service/`
- **Features**: 
  - User registration with email verification
  - Plan selection (Kickstart, Pro, Custom)
  - Billing integration (Stripe)
  - Trial management

#### 9. **cc-business-admin**
- **Purpose**: Business administration and analytics dashboard
- **Technology**: React, Python FastAPI
- **Location**: `/cc-business-admin/`
- **Features**: 
  - Business metrics and KPIs
  - Customer analytics
  - Subscription management
  - Revenue tracking

#### 10. **cc-language-server**
- **Purpose**: LSP (Language Server Protocol) for policy development
- **Technology**: TypeScript, Monaco Editor integration
- **Location**: `/cc-language-server/`
- **Features**: 
  - Rego syntax highlighting
  - Autocomplete for policy attributes
  - Real-time validation
  - Hover documentation

#### 11. **cc-docs**
- **Purpose**: Documentation website
- **Technology**: Next.js, MDX
- **Location**: `/cc-docs/`
- **Features**: 
  - Comprehensive user guides
  - API reference documentation
  - Integration tutorials
  - Best practices

#### 12. **cc-infra**
- **Purpose**: Infrastructure and deployment management
- **Technology**: Docker, Kubernetes, Helm
- **Location**: `/cc-infra/`
- **Contents**:
  - `controlcore-local-dev.yml` - Local development Docker Compose
  - Helm charts for Kubernetes deployment
  - Deployment guides for AWS, GCP, Azure
  - Monitoring and observability configs

### Data Layer

#### 13. **cc-data**
- **Purpose**: Data layer components
- **Location**: `/cc-data/`
- **Components**:
  - PostgreSQL configuration
  - Redis configuration
  - OPAL data sources

---

## 🎯 Policy Administration Point (PAP) Types

Control Core supports multiple PAP deployment models:

### 1. **Self-Hosted PAP** (Kickstart Plan)
- **Deployment**: Full self-hosted platform
- **Components**: Control Plane + Bouncer + OPAL + Database
- **Requirements**: Docker, Docker Compose, 4GB RAM, 2 CPU cores
- **Support**: Community support
- **Use Case**: Small teams, testing, development
- **Cost**: Free

### 2. **Hosted PAP** (Pro Plan)
- **Deployment**: Hybrid (hosted Control Plane + self-hosted Bouncer)
- **Components**: Bouncer + OPAL Client (Control Plane managed by Control Core)
- **Requirements**: Docker, Docker Compose, 2GB RAM, 1 CPU core
- **Support**: Priority support with SLA
- **Use Case**: Production environments with reduced infrastructure overhead
- **Cost**: Subscription-based

### 3. **Enterprise PAP** (Custom Plan)
- **Deployment**: Self-hosted or dedicated cloud with enterprise features
- **Components**: Control Plane + Bouncer + OPAL + Database + Monitoring + Backup
- **Requirements**: Docker, Kubernetes, Helm, 8GB RAM, 4 CPU cores
- **Support**: Dedicated support + SLA
- **Use Case**: Large enterprises with advanced requirements
- **Cost**: Custom pricing

---

## 🛡️ Bouncer PEP Types

Control Core Bouncer (Policy Enforcement Point) supports multiple deployment patterns:

### 1. **API Gateway PEP** (Most Common)
- **Type**: Proxy-based enforcement
- **Use Case**: REST APIs and microservices
- **Deployment**: Standalone service or sidecar container
- **Architecture**: `Client → PEP Proxy → Protected API`
- **Features**: Request/response filtering, rate limiting, authentication

### 2. **Application PEP**
- **Type**: Library/SDK integration
- **Use Case**: Direct application integration
- **Deployment**: Embedded in application code
- **Features**: Fine-grained control, minimal latency

### 3. **Cloud Gateway PEP**
- **Type**: Cloud provider integration
- **Use Case**: AWS API Gateway, Google Cloud Endpoints, Azure API Management
- **Deployment**: Cloud-native integration
- **Features**: Serverless, auto-scaling, managed infrastructure

### 4. **Sidecar PEP** (Kubernetes)
- **Type**: Container sidecar pattern
- **Use Case**: Kubernetes deployments with multiple services
- **Deployment**: Sidecar container alongside application
- **Features**: Transparent integration, shared networking, minimal config

---

## 🚀 Quick Start - Local Development

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- Go 1.21+ (for Bouncer development)
- 8GB RAM minimum, 16GB recommended

### 1. Clone Repository
```bash
git clone <repository-url>
cd control-core-012025
```

### 2. Start Core Services
```bash
cd cc-infra
docker compose -f controlcore-local-dev.yml up -d

# Wait for services to be healthy (30-60 seconds)
docker compose -f controlcore-local-dev.yml ps
```

### 3. Access Control Core
- **PAP Frontend**: http://localhost:5173
- **PAP API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

**Default Login**:
- Username: `ccadmin`
- Password: `SecurePass2025!`

### 4. Verify Installation
```bash
# Check API health
curl http://localhost:8000/health

# Check policy templates loaded
curl http://localhost:8000/policies/templates/ | jq 'length'
# Should return ~180 templates
```

---

## 🔧 Development Workflows

### Build & Rebuild Containers

#### Rebuild Specific Service
```bash
cd cc-infra
docker compose -f controlcore-local-dev.yml build cc-pap-api
docker compose -f controlcore-local-dev.yml up -d cc-pap-api
```

#### Rebuild All Services
```bash
cd cc-infra
docker compose -f controlcore-local-dev.yml down
docker compose -f controlcore-local-dev.yml build
docker compose -f controlcore-local-dev.yml up -d
```

#### Clean Rebuild (removes volumes)
```bash
cd cc-infra
docker compose -f controlcore-local-dev.yml down -v
docker compose -f controlcore-local-dev.yml build --no-cache
docker compose -f controlcore-local-dev.yml up -d
```

### View Logs
```bash
# All services
docker compose -f controlcore-local-dev.yml logs -f

# Specific service
docker compose -f controlcore-local-dev.yml logs -f cc-pap-api

# Last 100 lines
docker compose -f controlcore-local-dev.yml logs --tail=100 cc-pap-api
```

### Check Service Status
```bash
docker compose -f controlcore-local-dev.yml ps

# Health check
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 📦 Repository Structure

```
control-core-012025/
├── cc-pap/                    # Frontend (React/Vite)
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   └── services/         # API services
│   └── package.json
├── cc-pap-api/               # Backend API (FastAPI)
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   ├── models/           # Database models
│   │   ├── services/         # Business logic
│   │   └── schemas/          # Pydantic schemas
│   ├── load_policy_templates.py
│   └── requirements.txt
├── cc-pap-core/              # Shared templates & logic
│   └── policy-templates/     # 180+ policy templates
│       ├── compliance/       # 30 compliance templates
│       ├── canadian-financial-regulation/  # 15 Canadian templates
│       ├── ai-security/      # 15 AI security templates
│       ├── security-controls/ # Security templates
│       └── data-governance/  # Data governance templates
├── cc-bouncer/               # PEP (Go)
│   ├── main.go
│   ├── handlers/
│   └── services/
├── cc-pap-pro-tenant/        # Multi-tenant control plane
├── cc-opal/                  # Policy & data distribution
├── cc-signup-service/        # Customer onboarding
├── cc-business-admin/        # Business admin dashboard
├── cc-infra/                 # Infrastructure configs
│   ├── controlcore-local-dev.yml  # Local dev compose
│   ├── helm-chart/           # Kubernetes Helm charts
│   └── k8s/                  # Kubernetes manifests
├── cc-demoapp/               # Demo application
├── cc-demoapp-api/           # Demo API
└── README.md                 # This file
```

---

## 🎯 Recent Updates & Features

### Policy Templates (180 total)
- ✅ **30 Compliance Templates**: PIPEDA, HIPAA, GDPR, CCPA, SOC 2 with region-specific use cases
- ✅ **15 Canadian Financial Regulation Templates**: OSFI, FINTRAC, Payments Canada, AMF Quebec
- ✅ **15 AI Security Templates**: Prompt injection prevention, RAG security, AI agent controls
- ✅ **1,103 Condition Examples**: All policy conditions now have contextual example values
- ✅ **Template Metadata**: Detailed descriptions, use cases, compliance frameworks, integration guides

### Frontend Updates (cc-pap)
- ✅ **Getting Started Wizard**: 7-step onboarding flow for new users
- ✅ **PIP Data Source Configuration**: Visual wizard for connecting external data sources
- ✅ **Policy Builder**: Drag-and-drop policy creation with IntelliSense
- ✅ **Monaco Editor Integration**: IDE-like experience for Rego policy editing
- ✅ **Template Selection**: Browse and deploy 180+ pre-built policy templates

### Backend Updates (cc-pap-api)
- ✅ **PIP Connector Service**: REST API, OAuth2, Basic Auth, API Key, Certificate authentication
- ✅ **Redis Caching**: High-performance PIP metadata caching
- ✅ **Template Loading**: Automatic filesystem-based template loading on startup
- ✅ **OPAL Integration**: Real-time policy and data distribution endpoints
- ✅ **Session Management**: JWT-based authentication with session tracking

### Infrastructure Updates
- ✅ **Docker Compose**: Optimized local development environment
- ✅ **Database Persistence**: Configurable CC_DROP_TABLES flag for data retention
- ✅ **Health Checks**: Comprehensive service health monitoring
- ✅ **Build Optimization**: Multi-arch Docker images (ARM64/x86_64)

---

## 📚 Documentation

### Platform Documentation
- **Architecture**: [cc-infra/docs/architecture-overview.md](cc-infra/docs/architecture-overview.md)
- **Deployment Guides**: [cc-infra/deployment-guides/](cc-infra/deployment-guides/)
- **API Documentation**: http://localhost:8000/docs (when running locally)

### Component Documentation
- **Bouncer**: [cc-bouncer/README.md](cc-bouncer/README.md)
- **PAP API**: [cc-pap-api/README.md](cc-pap-api/README.md)
- **Demo App**: [cc-demoapp/README.md](cc-demoapp/README.md)
- **OPAL Integration**: [cc-opal/README.md](cc-opal/README.md)

### Integration Guides
- **PIP Data Sources**: [cc-pap-api/docs/pip-integration.md](cc-pap-api/docs/pip-integration.md)
- **Policy Templates**: [cc-pap-core/policy-templates/README.md](cc-pap-core/policy-templates/README.md)
- **OPAL Setup**: [cc-opal/README.md](cc-opal/README.md)

---

## 🎯 Use Cases

### AI Security & Governance
- **AI Prompt Filtering**: Control AI model inputs and outputs
- **Content Injection**: Dynamic context management for AI agents
- **Response Sanitization**: Remove sensitive data from AI responses
- **Multi-Provider Policies**: Different rules for OpenAI, Anthropic, Google AI

### Enterprise Authorization
- **API Protection**: Secure REST APIs and microservices
- **Data Access Control**: Row, column, and field-level security
- **Compliance**: GDPR, HIPAA, SOC 2, PIPEDA, FINTRAC compliance
- **Audit Logging**: Comprehensive activity tracking for compliance

### Financial Services (Canada)
- **OSFI B-13 Technology Risk**: IT system controls and cyber resilience
- **FINTRAC AML**: Suspicious transaction reporting and monitoring
- **Payments Canada**: Payment system oversight and fraud prevention
- **Provincial Regulators**: FSRA (Ontario), AMF (Quebec) compliance

### Healthcare (Canada & US)
- **PHIPA (Ontario)**: Circle of care, consent management, substitute decision makers
- **HIPAA (US)**: Minimum necessary, breach notification, business associate controls
- **Patient Data Protection**: Granular access controls for healthcare records

---

## 🔒 Security Features

- **Policy-Based Access Control (PBAC)**: Dynamic, context-aware authorization
- **Real-Time Enforcement**: Sub-100ms policy evaluation with caching
- **Comprehensive Audit Logging**: Complete activity tracking for compliance
- **Multi-Tenant Support**: Secure tenant isolation with dedicated databases
- **API Key Management**: Secure API authentication and authorization
- **Content Filtering**: Advanced content inspection and PII detection
- **Encryption**: TLS/mTLS for all communication, encryption at rest
- **Session Management**: JWT tokens with refresh, session tracking, logout

---

## 🌐 Integration Capabilities

### AI Providers
- **OpenAI**: GPT-4, GPT-3.5 with policy enforcement
- **Anthropic**: Claude 2/3 with safety controls
- **Google**: Gemini Pro with enterprise policies
- **Azure OpenAI**: Enterprise AI with compliance controls
- **Hugging Face**: Open-source models with governance
- **AWS Bedrock**: Multi-model support with guardrails

### Cloud Platforms
- **AWS**: API Gateway, Lambda, EKS integration
- **Google Cloud**: Cloud Functions, GKE, Endpoints
- **Azure**: API Management, Functions, AKS
- **Kubernetes**: Native K8s integration with sidecar pattern
- **Docker**: Docker Compose, Swarm support

### Enterprise Systems
- **Identity Providers**: SAML, OAuth2, OIDC, LDAP, Active Directory
- **Databases**: PostgreSQL, MySQL, MongoDB, SQL Server
- **Message Queues**: Kafka, RabbitMQ, AWS SQS, Azure Service Bus
- **Monitoring**: Prometheus, Grafana, Datadog, New Relic
- **SIEM**: Splunk, ELK Stack, Azure Sentinel

### PIP (Policy Information Point) Data Sources
- **REST APIs**: JSON APIs with various auth methods
- **LDAP/Active Directory**: User and group information
- **Databases**: Direct SQL queries for attributes
- **Identity Providers**: Okta, Auth0, Azure AD
- **CRM Systems**: Salesforce, HubSpot
- **HR Systems**: Workday, BambooHR
- **Custom APIs**: Any HTTP-accessible data source

---

## 📞 Support & Community

### Support Tiers
- **Kickstart Plan**: Community support via GitHub Issues
- **Pro Plan**: Priority support with SLA (24-hour response)
- **Custom Plan**: Dedicated support with enterprise SLA (4-hour response)

### Community Resources
- **Documentation**: https://docs.controlcore.ai
- **Examples**: [cc-pap-core/policy-templates/](cc-pap-core/policy-templates/)
- **Templates**: 180+ pre-built policy templates
- **Best Practices**: Security and compliance guidelines
- **GitHub**: Issues, Discussions, Pull Requests

### Getting Help
1. **Documentation**: Check docs.controlcore.ai first
2. **GitHub Issues**: Search existing issues or create new one
3. **Email Support**: support@controlcore.ai (Pro/Custom plans)
4. **Slack Community**: Join our Slack workspace (coming soon)

---

## 🔄 Git Workflow & Syncing

### Branch Strategy
- **`master`**: Production-ready code
- **`dev`**: Development branch for staging changes
- **Feature branches**: `feature/description`, `fix/description`

### Sync to GitHub
```bash
# Check current status
git status

# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: updated policy templates and frontend improvements"

# Push to dev branch
git push origin dev

# Push to master (after testing on dev)
git push origin master
```

### Pull Latest Changes
```bash
# Pull from dev
git checkout dev
git pull origin dev

# Pull from master
git checkout master
git pull origin master
```

---

## 🛠️ Troubleshooting

### Port Conflicts
```bash
# Check what's using port 8000, 5173, 5432, 6379
lsof -i :8000
lsof -i :5173
lsof -i :5432
lsof -i :6379

# Kill process if needed
kill -9 <PID>
```

### Container Issues
```bash
# Check container logs
docker logs cc-pap-api --tail 100

# Restart specific container
docker restart cc-pap-api

# Remove and recreate
docker rm -f cc-pap-api
cd cc-infra
docker compose -f controlcore-local-dev.yml up -d cc-pap-api
```

### Database Issues
```bash
# Reset database (WARNING: deletes all data)
cd cc-infra
docker compose -f controlcore-local-dev.yml down -v
docker compose -f controlcore-local-dev.yml up -d
```

### Frontend Issues
```bash
# Clear node_modules and reinstall
cd cc-pap
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📈 Performance Benchmarks

- **Policy Evaluation**: < 10ms (average), < 50ms (p99)
- **PIP Data Fetch**: < 100ms (cached), < 500ms (uncached)
- **Template Loading**: 180 templates in < 5 seconds
- **API Response Time**: < 50ms (average)
- **Concurrent Users**: 1000+ (tested with k6)

---

## 🚧 Roadmap

### Q1 2025
- ✅ 180+ policy templates with detailed metadata
- ✅ PIP data source integration
- ✅ Canadian financial regulation templates
- ⏳ GraphQL API support
- ⏳ Enhanced AI policy generation

### Q2 2025
- ⏳ Cedar policy engine support (in addition to OPA)
- ⏳ Advanced caching strategies
- ⏳ Policy versioning and rollback
- ⏳ Multi-region deployment support

### Q3 2025
- ⏳ Policy simulation and testing framework
- ⏳ Advanced analytics and reporting
- ⏳ Mobile app for policy monitoring

---

**Control Core** - Empowering organizations to innovate securely in the AI-driven enterprise. 🚀

For detailed component documentation, see the individual README files in each directory.

---

## 📄 License

Copyright © 2025 Control Core. All rights reserved.

For licensing information, contact: licensing@controlcore.ai
