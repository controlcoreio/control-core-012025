# Control Core

**The centralized authorization and compliance platform built for the AI-driven enterprise.**

Control Core solves the core problem of securing the dynamic, real-time interactions between new AI initiatives and legacy technology. By enforcing business, security, and compliance rules with dynamic context management, Control Core eliminates the need for brittle, custom-coded access logic, turning a major security liability into a strategic advantage. It empowers organizations to innovate faster, reduce operational costs, and mitigate the risk of a breach.

## 🏗️ Platform Architecture

Control Core is built on a modern, cloud-native architecture with the following core components:

### Core Platform Components

#### 1

**cc-pap** (Policy Administration Point)

- **Purpose**: Frontend UI for policy management and administration
- **Technology**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Location**: `/cc-pap/`
- **Features**: Policy creation, management, monitoring, user interface, AI integration for policy creation enhancement

#### 2

**cc-pap-api** (Policy Administration Point API)

- **Purpose**: Backend API for policy management and administration
- **Technology**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **Location**: `/cc-pap-api/`
- **Features**: Policy CRUD, user management, authentication, AI agent control

#### 3

**cc-bouncer** (Policy Enforcement Point with integrated PDP)

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

#### 4

**cc-pap-pro-tenant** (Multi-tenant Control Plane for Pro customers)

- **Purpose**: Multi-tenant PAP for Pro plan customers
- **Technology**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **Location**: `/cc-pap-pro-tenant/`
- **Features**:
  - Tenant isolation
  - Bouncer connection management
  - Certificate management
  - Advanced monitoring
  - Customer-specific configurations

### Supporting Components

#### 5. **cc-signup-service**
- **Purpose**: Customer onboarding and signup service
- **Technology**: FastAPI, Python
- **Location**: `/cc-signup-service/`
- **Features**: User registration, plan selection, billing integration

#### 6. **cc-business-admin**
- **Purpose**: Business administration and analytics
- **Technology**: React, Python FastAPI
- **Location**: `/cc-business-admin/`
- **Features**: Business metrics, customer analytics, subscription management

#### 7. **cc-language-server**
- **Purpose**: Language server for policy development
- **Technology**: TypeScript
- **Location**: `/cc-language-server/`
- **Features**: Policy syntax highlighting, autocomplete, validation

#### 8. **cc-opal**
- **Purpose**: OPAL (Open Policy Administration Layer) integration
- **Technology**: Python
- **Location**: `/cc-opal/`
- **Features**: Policy synchronization, data source integration

#### 9. **cc-infra**
- **Purpose**: Infrastructure and deployment management
- **Technology**: Docker, Kubernetes, Helm
- **Location**: `/cc-infra/`
- **Features**: Deployment configurations, infrastructure as code

## 🎯 Policy Administration Point (PAP) Types

Control Core supports multiple PAP deployment models:

### 1. **Self-Hosted PAP** (Kickstart Plan)
- **Deployment**: Full self-hosted platform
- **Components**: Control Plane + Bouncer + OPAL + Database
- **Requirements**: Docker, Docker Compose, 4GB RAM, 2 CPU cores
- **Support**: Community support
- **Use Case**: Small teams, testing, development

### 2. **Hosted PAP** (Pro Plan)
- **Deployment**: Hybrid (hosted Control Plane + self-hosted Bouncer)
- **Components**: Bouncer + OPAL Client
- **Requirements**: Docker, Docker Compose, 2GB RAM, 1 CPU core
- **Support**: Priority support
- **Use Case**: Production environments with reduced infrastructure overhead

### 3. **Enterprise PAP** (Custom Plan)
- **Deployment**: Self-hosted with enterprise features
- **Components**: Control Plane + Bouncer + OPAL + Database + Monitoring + Backup
- **Requirements**: Docker, Kubernetes, Helm, 8GB RAM, 4 CPU cores
- **Support**: Dedicated support + SLA
- **Use Case**: Large enterprises with advanced requirements

## 🛡️ Bouncer PEP Types

Control Core Bouncer (Policy Enforcement Point) supports multiple deployment patterns:

### 1. **API Gateway PEP**
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

### 4. **Sidecar PEP**
- **Type**: Container sidecar pattern
- **Use Case**: Kubernetes deployments
- **Deployment**: Sidecar container alongside application
- **Features**: Transparent integration, shared networking

## 🚀 Deployment Options

### Docker Compose
```bash
# Quick start with Docker Compose
cd cc-infra/docker-compose
docker-compose up -d
```

### Kubernetes (Helm)
```bash
# Deploy with Helm charts
helm install controlcore ./cc-infra/helm-chart/controlcore
```

### Cloud Providers
- **AWS**: CloudFormation templates, Lambda authorizers
- **Google Cloud**: Cloud Functions, Endpoints
- **Azure**: API Management policies, Functions
- **Kong**: Plugin-based integration
- **NGINX**: Module-based integration

## 📋 Demo Applications

### cc-demoapp
- **Purpose**: Comprehensive demonstration application
- **Technology**: Next.js, FastAPI, PostgreSQL
- **Location**: `/cc-demoapp/`
- **Features**: AI-powered business features, PBAC demonstrations, sample data

### cc-demoapp-api
- **Purpose**: Demo application backend API
- **Technology**: FastAPI, Python, SQLAlchemy
- **Location**: `/cc-demoapp-api/`
- **Features**: Business intelligence, client management, financial analytics

## 🔧 Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.9+ (for backend development)
- Go 1.21+ (for Bouncer development)

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd control-core-012025

# Start core platform
cd cc-infra/docker-compose
docker-compose up -d

# Start demo application (optional)
cd ../../cc-demoapp
npm install
npm run dev
```

### Development Environment
```bash
# Run setup script
./scripts/setup-dev-environment.sh
```

## 📚 Documentation

### Platform Documentation
- **Architecture**: [cc-infra/docs/architecture-overview.md](cc-infra/docs/architecture-overview.md)
- **Deployment Guides**: [cc-infra/deployment-guides/](cc-infra/deployment-guides/)
- **API Documentation**: [cc-pap-api/docs/](cc-pap-api/docs/)

### Component Documentation
- **Bouncer**: [cc-bouncer/README.md](cc-bouncer/README.md)
- **PAP API**: [cc-pap-api/README.md](cc-pap-api/README.md)
- **Demo App**: [cc-demoapp/README.md](cc-demoapp/README.md)

### Infrastructure Documentation
- **Helm Charts**: [cc-infra/helm-chart/README.md](cc-infra/helm-chart/README.md)
- **Docker Compose**: [cc-infra/docker-compose/README.md](cc-infra/docker-compose/README.md)
- **Kubernetes**: [cc-infra/k8s/README.md](cc-infra/k8s/README.md)

## 🎯 Use Cases

### AI Security & Governance
- **AI Prompt Filtering**: Control AI model inputs and outputs
- **Content Injection**: Dynamic context management for AI agents
- **Response Sanitization**: Remove sensitive data from AI responses
- **Multi-Provider Policies**: Different rules for different AI providers

### Enterprise Authorization
- **API Protection**: Secure REST APIs and microservices
- **Data Access Control**: Row, column, and field-level security
- **Compliance**: GDPR, HIPAA, SOX compliance enforcement
- **Audit Logging**: Comprehensive activity tracking

### Business Intelligence
- **Role-Based Analytics**: Secure data access for business intelligence
- **Financial Data Protection**: Secure financial reporting and analytics
- **Healthcare Compliance**: HIPAA-compliant patient data management
- **Cross-Border Data**: Geographic data residency controls

## 🔒 Security Features

- **Policy-Based Access Control (PBAC)**: Dynamic, context-aware authorization
- **Real-Time Enforcement**: Sub-100ms policy evaluation
- **Audit Logging**: Complete activity tracking and compliance reporting
- **Multi-Tenant Support**: Secure tenant isolation
- **API Key Management**: Secure API authentication and authorization
- **Content Filtering**: Advanced content inspection and filtering

## 🌐 Integration Capabilities

### AI Providers
- **OpenAI**: GPT models with policy enforcement
- **Anthropic**: Claude models with safety controls
- **Google**: Gemini models with enterprise policies
- **Azure OpenAI**: Enterprise AI with compliance controls
- **Hugging Face**: Open-source models with governance

### Cloud Platforms
- **AWS**: API Gateway, Lambda, EKS integration
- **Google Cloud**: Cloud Functions, GKE, Endpoints
- **Azure**: API Management, Functions, AKS
- **Kubernetes**: Native K8s integration with sidecar pattern

### Enterprise Systems
- **Identity Providers**: SAML, OAuth2, OIDC integration
- **Databases**: PostgreSQL, MySQL, MongoDB support
- **Message Queues**: Kafka, RabbitMQ, AWS SQS
- **Monitoring**: Prometheus, Grafana, Datadog integration

## 📞 Support & Community

### Support Tiers
- **Kickstart**: Community support via GitHub Issues
- **Pro**: Priority support with SLA
- **Custom**: Dedicated support with enterprise SLA

### Community Resources
- **Documentation**: Comprehensive guides and API references
- **Examples**: Sample policies and integration patterns
- **Templates**: Pre-built policy templates for common use cases
- **Best Practices**: Security and compliance guidelines

---

**Control Core** - Empowering organizations to innovate securely in the AI-driven enterprise. 🚀

For detailed component documentation, see the individual README files in each directory.