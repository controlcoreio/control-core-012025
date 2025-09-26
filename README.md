# Control Core - Centralized Authorization & Compliance Platform

Control Core is the centralized authorization and compliance platform built for the AI-driven enterprise. It helps organizations take control of their new and legacy technology including AI initiatives by helping them enforce real-time decisions and context based on business, security or compliance policies. It helps the organizations enforce their rules, automate security with dynamic real-time context, audit for compliance and reduce resource drain to save costs.

The goal is to provide a simplified, unified authorization and compliance management platform primarily for AI initiatives in an organization. The application must provide a ultra low effort deployment model, no-code and full-code options, AI assisted policy developed, an extensive library of policy templates for various scenarios including compliance frameworks in Canada and USA regions.

## 🏗️ Architecture Overview

Control Core delivers three main service containers that can be deployed in different configurations based on customer tier:

### Service Architecture

#### 1. **Control Plane Service** 

The centralized management and policy administration service that provides:

- Policy creation, management, and deployment
- User management and authentication
- AI agent control and context management
- Real-time monitoring and analytics
- Integration with external systems (Auth0, Stripe, etc.)

#### 2. **Bouncer Service (PEP)**

The Policy Enforcement Point that acts as a reverse proxy to protect applications:

- Real-time policy enforcement
- Content injection for AI agents
- Audit logging and monitoring
- High-performance decision caching
- Context-aware policy evaluation

#### 3. **Demo App Service (Optional)**

A professional business intelligence platform for demonstrations:

- Policy-agnostic demo application
- Real-time PBAC demonstrations
- Enterprise-grade UI/UX
- Comprehensive API coverage

### Core Components

#### **cc-pap** - Policy Administration Point (Frontend UI)

- **Technology**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Purpose**: Modern web interface for policy management and administration
- **Features**:
  - Visual policy builder with Monaco code editor
  - Policy templates and libraries
  - Real-time policy evaluation
  - Comprehensive audit logging
  - Multi-environment support
  - Advanced context-aware policy templates

#### **cc-pap-api** - Policy Administration Point API (Backend)

- **Technology**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **Purpose**: Backend API for policy management and administration
- **Features**:
  - Policy CRUD operations
  - User management and authentication
  - AI agent control and context management
  - Stripe integration for billing
  - Auth0 integration for authentication
  - OPAL integration for Git-based policy management

#### **cc-bouncer** - Policy Enforcement Point with Integrated PDP

- **Technology**: Go, Gin framework, OPA integration
- **Purpose**: Reverse proxy with integrated Policy Decision Point
- **Features**:
  - Reverse proxy functionality
  - Policy enforcement and decision caching
  - Content injection for AI agents
  - Audit logging and monitoring
  - Integrated PDP (Policy Decision Point)
  - Context-aware policy evaluation

#### **cc-bouncer-sidecar** - Sidecar PEP Deployment

- **Technology**: Go, container sidecar pattern
- **Purpose**: Deploy PEP as container sidecar (no reverse proxy required)
- **Features**:
  - Same functionality as cc-bouncer
  - Sidecar deployment model
  - Direct application integration
  - Simplified deployment for containerized applications

#### **cc-opal** - OPAL Server for Policy Synchronization

- **Technology**: Python-based OPAL server (fork of permitio/opal)
- **Purpose**: Git-based policy management and real-time synchronization
- **Features**:
  - Git-based policy management
  - Real-time policy synchronization
  - Policy caching and performance optimization
  - Multi-tenant support
  - Webhook-based updates

#### **cc-pap-pro-tenant** - Multi-tenant Control Plane (Pro Plan)

- **Technology**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **Purpose**: Multi-tenant PAP for Pro plan customers
- **Features**:
  - Tenant isolation and management
  - Bouncer connection management
  - Certificate management
  - Advanced monitoring and analytics
  - Customer-specific configurations

### Demo Components

#### **cc-demoapp** - Demo Application Frontend

- **Technology**: Next.js, TypeScript, Tailwind CSS
- **Purpose**: Business intelligence demo application
- **Features**: Analytics dashboard, reporting, user interface

#### **cc-demoapp-api** - Demo Application Backend

- **Technology**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **Purpose**: Backend API for demo application
- **Features**: Client management, financial analytics, employee management

### Business Operations Components

#### **cc-business-admin** - Business Administration Console

- **Technology**: React, FastAPI, Stripe integration
- **Purpose**: Internal console for Control Core business administrators
- **Features**:
  - Customer account management
  - Self-onboarding for demo instances
  - Billing, invoicing, and renewals
  - Kickstart pilot extensions
  - Business analytics and reporting

#### **cc-signup-service** - Customer Onboarding Service

- **Technology**: FastAPI, Python, Stripe integration, Auth0
- **Purpose**: Fully hosted customer onboarding service
- **Features**: 
  - Customer registration and onboarding
  - Subscription management
  - Package generation
  - Trial management

### Infrastructure Components

#### **cc-infra** - Infrastructure Management

- **Purpose**: Docker, Kubernetes, Helm charts, deployment configurations
- **Features**:
  - Docker Compose files for different deployment scenarios
  - Kubernetes manifests and Helm charts
  - Auto-scaling configurations
  - Customer download packages
  - Version management system

#### **cc-docs** - Documentation Site

- **Technology**: Next.js, MDX
- **Purpose**: Comprehensive documentation and guides
- **Features**: Architecture guides, deployment guides, API documentation

#### **cc-language-server** - Language Server

- **Technology**: TypeScript
- **Purpose**: IDE integration for policy development
- **Features**: IntelliSense, syntax highlighting, validation

## 🚀 Delivery Architecture

Control Core offers three deployment tiers, each with different service configurations:

### 1. **Kickstart Plan (Self-Hosted)**

All three services deployed in customer environment

```text
Customer Environment:
├── Control Plane Service:
│   ├── cc-pap (UI) - Policy Administration Interface
│   ├── cc-pap-api (Backend) - Policy Management API
│   ├── cc-opal (Policy Sync) - Git-based Policy Management
│   ├── PostgreSQL (Database) - Data persistence
│   └── Redis (Caching) - Performance optimization
├── Bouncer Service:
│   ├── cc-bouncer (PEP + PDP) - Policy Enforcement & Decision
│   └── cc-bouncer-sidecar (Optional) - Sidecar deployment
└── Demo App Service (Optional):
    ├── cc-demoapp (Frontend) - Demo Application
    ├── cc-demoapp-api (Backend) - Demo API
    └── PostgreSQL (Demo Database)
```

### 2. **Pro Plan (Hybrid)**
**Control Plane hosted by Control Core, Bouncer self-hosted by customer**

```text
AWS (Control Core Hosted):
├── cc-pap-pro-tenant (Multi-tenant Control Plane)
├── Tenant Isolation & Management
├── Customer Management
└── Billing & Subscription Management

Customer Environment:
├── cc-bouncer (PEP + PDP) - Policy Enforcement
├── Direct connection to AWS Control Plane
└── Certificate management
```

### 3. **Custom Plan (Enterprise)**

All services deployed in customer environment with dedicated resources

```text
Customer Environment:
├── Control Plane Service:
│   ├── cc-pap (UI) - Full-featured interface
│   ├── cc-pap-api (Backend) - Complete API
│   ├── cc-opal (Policy Sync) - Git-based management
│   ├── PostgreSQL (Database) - Data persistence
│   └── Redis (Caching) - Performance
├── Bouncer Service:
│   ├── cc-bouncer (PEP + PDP) - Policy enforcement
│   └── cc-bouncer-sidecar (Optional) - Sidecar deployment
├── Demo App Service (Optional):
│   ├── cc-demoapp (Frontend) - Demo Application
│   ├── cc-demoapp-api (Backend) - Demo API
│   └── PostgreSQL (Demo Database)
└── Dedicated resources and support
```

### 4. **SaaS Solution (Future)**

Fully hosted solution for customer self-driven demo instances

```text
Control Core Cloud:
├── Multi-tenant Control Plane
├── Customer-specific Bouncer instances
├── Demo App instances
├── Shared infrastructure
└── Managed by Control Core operations team
```

## 🔄 Policy Flow Architecture

### Policy Management Flow

```text
cc-pap (UI) → cc-pap-api (Backend) → cc-opal (Sync) → cc-bouncer (PEP+PDP) → Target Application
```

### Multi-tenant Flow (Pro Plan)

```text
Customer → cc-pap-pro-tenant (AWS) → Customer's cc-bouncer → Target Application
```

### Decision Flow

```text
Request → cc-bouncer (PEP) → Integrated PDP → OPA → Decision → Response
```

## 🛠️ Key Features

### Advanced Context Management

- **Context-Aware Policy Templates**: Pre-built templates for AI agents, LLMs, and RAG systems
- **Real-time Context Ingestion**: Fetches context from multiple sources (APIs, databases, streams)
- **Dynamic Policy Evaluation**: Policies adapt based on real-time context
- **Content Injection**: Modifies requests and responses based on context

### AI Agent Control

- **AI Agent Management**: Register and configure AI agents (LLMs, RAG systems)
- **Content Injection**: Pre/post-prompt and response modification
- **Context Engineering**: RAG system integration and context filtering
- **AI Policy Templates**: Pre-built templates for AI safety and governance

### Enterprise Features

- **Multi-tenant Support**: Complete tenant isolation
- **Advanced Monitoring**: Real-time metrics, alerts, and audit logging
- **Integration Support**: Auth0, Okta, Azure AD, AWS IAM
- **ERP/CRM Integration**: SAP, Oracle, Workday, NetSuite, Salesforce, HubSpot
- **MCP Connections**: Model Context Protocol support

## 📦 Repository Structure

### Core Service Repositories

```text
control-core-012025/
├── cc-pap/                    # Policy Administration Point (Frontend UI)
├── cc-pap-api/                # Policy Administration Point API (Backend)
├── cc-bouncer/                # Policy Enforcement Point with Integrated PDP
├── cc-bouncer-sidecar/        # Sidecar PEP Deployment
├── cc-opal/                   # OPAL Server for Policy Synchronization
├── cc-pap-pro-tenant/         # Multi-tenant Control Plane (Pro Plan)
```

### Demo Application Repositories

```text
├── cc-demoapp/                # Demo Application Frontend
├── cc-demoapp-api/            # Demo Application Backend
├── cc-demoapp-policies-repo/  # Demo Policies Repository
```

### Business Operations Repositories

```text
├── cc-business-admin/         # Business Administration Console
├── cc-signup-service/         # Customer Onboarding Service
```

### Infrastructure & Documentation

```text
├── cc-infra/                  # Infrastructure Management
├── cc-docs/                   # Documentation Site
├── cc-language-server/        # Language Server for IDE Integration
├── cc-pap-core/              # Core PAP Components
```

### Legacy Components

```text
├── legacy-pap-admin-server/   # Legacy PAP Admin Server
├── legacy-pap-client/         # Legacy PAP Client
├── legacy-pdp/               # Legacy Policy Decision Point
```

### Data & Logs

```text
├── cc-data/                  # Data storage configurations
├── cc-logs/                  # Log management
├── logs/                     # Application logs
```

## 🔗 Service Relationships & Dependencies

### Core Service Dependencies

```text
Control Plane Service:
├── cc-pap (Frontend) → cc-pap-api (Backend)
├── cc-pap-api → PostgreSQL (Database)
├── cc-pap-api → Redis (Caching)
├── cc-pap-api → cc-opal (Policy Sync)
└── cc-pap-api → Auth0 (Authentication)

Bouncer Service:
├── cc-bouncer → cc-opal (Policy Sync)
├── cc-bouncer → cc-pap-api (Policy Management)
└── cc-bouncer → OPA (Policy Engine)

Demo App Service:
├── cc-demoapp (Frontend) → cc-demoapp-api (Backend)
├── cc-demoapp-api → PostgreSQL (Demo Database)
└── cc-demoapp → cc-bouncer (Policy Enforcement)
```

### Business Operations Dependencies

```text
Business Admin:
├── cc-business-admin → Stripe (Billing)
├── cc-business-admin → SendGrid (Email)
└── cc-business-admin → cc-signup-service (Customer Data)

Signup Service:
├── cc-signup-service → Stripe (Payments)
├── cc-signup-service → Auth0 (Authentication)
└── cc-signup-service → SendGrid (Email)
```

### Cross-Repository Updates

**Important**: When making updates to core services, ensure consistency across related repositories:

- **cc-pap** ↔ **cc-pap-api** ↔ **cc-pap-pro-tenant**: All PAP-related updates must be synchronized
- **cc-bouncer** ↔ **cc-bouncer-sidecar**: Bouncer functionality must be consistent across both deployment models
- **cc-demoapp** ↔ **cc-demoapp-api**: Demo application frontend and backend must be synchronized

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- Node.js 18+ (for development)
- Python 3.9+ (for backend services)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/controlcore/control-core.git
cd control-core

# Start the development environment
docker-compose up -d

# Access the services
# - Control Core Admin: http://localhost:3000
# - API Documentation: http://localhost:8000/docs
# - Demo App: http://localhost:3001
```

### Production Deployment

```bash
# Using Docker Compose
cd cc-infra/docker-compose
docker-compose -f controlcore-compose.yml up -d

# Using Kubernetes
cd cc-infra/k8s
kubectl apply -f controlcore-stack.yaml

# Using Helm
cd cc-infra/helm-chart
helm install controlcore ./controlcore
```

## 📚 Documentation

- **Architecture Overview**: [cc-infra/docs/architecture-overview.md](cc-infra/docs/architecture-overview.md)
- **Deployment Guides**: [cc-infra/deployment-guides/](cc-infra/deployment-guides/)
- **Context Deployment**: [cc-infra/docs/context-deployment-guide.md](cc-infra/docs/context-deployment-guide.md)
- **API Documentation**: [cc-pap-api/docs/](cc-pap-api/docs/)

## 🔧 Development

### Component Development

- **Frontend**: `cd cc-pap && npm run dev`
- **Backend API**: `cd cc-pap-api && python -m uvicorn app.main:app --reload`
- **Bouncer**: `cd cc-bouncer && go run main.go`
- **OPAL Server**: `cd cc-opal && python -m opal_server.main`

### Testing

```bash
# Run tests for all components
npm test                    # Frontend tests
pytest cc-pap-api/         # Backend API tests
go test cc-bouncer/        # Bouncer tests
```

## 📈 Version Management

Control Core uses a quarterly release schedule with patch versions for bug fixes and security updates.

```bash
# Check current version
./version-manager.sh current

# Check status
./version-manager.sh status

# Bump version
./version-manager.sh bump patch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.controlcore.io](https://docs.controlcore.io)
- **Support**: [support@controlcore.io](mailto:support@controlcore.io)
- **Issues**: [GitHub Issues](https://github.com/controlcore/control-core/issues)

---

**Control Core** - Empowering organizations to innovate faster, reduce operational costs, and mitigate the risk of a breach through intelligent authorization and compliance management.
