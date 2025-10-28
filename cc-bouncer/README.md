# Control Core Bouncer - Enhanced Policy Enforcement Point

The Control Core Bouncer is a comprehensive Policy Enforcement Point (PEP) for Control Core - the centralized authorization and compliance platform built for the AI-driven enterprise. It solves the core problem of securing the dynamic, real-time interactions between new AI initiatives and legacy technology. By enforcing business, security, and compliance rules with dynamic context management, Control Core eliminates the need for brittle, custom-coded access logic, turning a major security liability into a strategic advantage. It empowers organizations to innovate faster, reduce operational costs, and mitigate the risk of a breach.
The Bouncer provides integrated Policy Decision Point (PDP), OPAL connection, caching, and policy management capabilities. It acts as a reverse proxy that enforces policies on incoming requests while providing real-time policy evaluation, content injection, and comprehensive audit logging.

## 🚀 Key Features

### Core Functionality

- **Reverse Proxy**: Transparent request forwarding with policy enforcement
- **Integrated PDP**: Policy Decision Point functionality built-in
- **OPAL Integration**: Seamless policy synchronization from GitHub and other sources
- **Advanced Caching**: Multi-level caching for policies and decisions
- **Real-time Evaluation**: Sub-100ms policy evaluation with caching
- **Content Injection**: Pre/post-prompt and response modification for AI agents

### Policy Management

- **GitHub Integration**: Direct policy fetching from GitHub repositories
- **OPAL Synchronization**: Automatic policy updates via OPAL server
- **Data Source Integration**: Support for IAM, databases, and external APIs
- **Policy Caching**: Intelligent caching with TTL and LRU eviction
- **Decision Caching**: High-performance decision caching

### AI Agent Control

- **Content Injection**: Pre/post-prompt and response modification
- **Context Engineering**: Dynamic context injection based on policies
- **Response Filtering**: Content filtering and masking for sensitive data
- **Prompt Modification**: Real-time prompt modification for AI safety

### Advanced Context Generation and Ingestion

- **Context-Aware Policies**: Real-time context enrichment for authorization decisions
- **Multi-Source Context**: Fetches context from APIs, databases, files, and streams
- **Security Context**: Integrates threat levels, compliance status, and risk scores
- **User Context**: Enriches decisions with user profiles, permissions, and preferences
- **AI Model Context**: Provides model capabilities, limitations, and performance metrics
- **Conversation Context**: Real-time conversation history and sentiment analysis
- **Data Masking**: Automatic masking of sensitive data in context
- **Content Filtering**: Advanced filtering based on user permissions and data classification

### Performance & Reliability

- **High Performance**: Sub-100ms policy evaluation with caching
- **Fault Tolerance**: Graceful degradation when services are unavailable
- **Health Monitoring**: Built-in health checks and monitoring
- **Load Balancing**: Support for multiple target services
- **Auto-scaling**: Horizontal scaling capabilities

## 🏗️ Architecture

### Component Overview

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   cc-bouncer    │    │  Target App    │
│   Request       │───▶│   (PEP + PDP)   │───▶│   (Protected)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   OPAL Server   │
                       │   (Policy Sync) │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   GitHub Repo  │
                       │   (Policies)    │
                       └─────────────────┘
```

### Internal Architecture

```text
cc-bouncer/
├── main.go                    # Main application entry point
├── services/
│   ├── opal_client.go        # OPAL server communication
│   ├── policy_cache.go       # Policy and decision caching
│   ├── opa_service.go        # OPA policy evaluation
│   ├── pdp_service.go        # Policy Decision Point service
│   ├── pap_client.go         # PAP API communication
│   └── opa_client.go         # OPA client communication
├── handlers/
│   └── authorization.go      # Authorization request handlers
├── models/
│   ├── authorization.go      # Authorization models
│   └── pap.go               # PAP models
└── README.md                # This file
```

## 🔧 Configuration

### Environment Variables

#### Core Configuration

```bash
# Bouncer Configuration

BOUNCER_PORT=8080                    # Port for the bouncer service
TARGET_HOST=localhost:8000          # Target application host
PAP_API_URL=http://localhost:8000   # PAP API URL
OPAL_SERVER_URL=http://localhost:7000 # OPAL server URL
TENANT_ID=default                   # Tenant identifier
API_KEY=your-api-key               # API key for authentication
# Caching Configuration

CACHE_ENABLED=true                  # Enable caching
CACHE_TTL=5m                       # Cache TTL
CACHE_MAX_SIZE=1000                # Maximum cache size
# Logging Configuration

LOG_ENABLED=true                   # Enable logging
LOG_LEVEL=info                    # Log level (debug, info, warn, error)
# Metrics Configuration

METRICS_ENABLED=true              # Enable metrics
METRICS_PORT=9090                 # Metrics port
```

#### OPAL Configuration

```bash
# OPAL Server Configuration

OPAL_SERVER_URL=http://localhost:7000
OPAL_CLIENT_ID=your-client-id
OPAL_CLIENT_SECRET=your-client-secret
# Policy Repository Configuration

POLICY_REPO_URL=https://github.com/your-org/policies
POLICY_REPO_BRANCH=main
POLICY_REPO_TOKEN=your-github-token
```

#### Data Source Configuration

```bash
# IAM Integration

IAM_ENDPOINT=https://your-iam.com/api
IAM_CLIENT_ID=your-iam-client-id
IAM_CLIENT_SECRET=your-iam-client-secret
# Database Integration

DB_HOST=localhost
DB_PORT=5432
DB_NAME=controlcore
DB_USER=postgres
DB_PASSWORD=password
```

## 🚀 Quick Start

### Prerequisites

- Go 1.21 or higher
- Docker and Docker Compose
- OPAL server running
- PAP API running
- Target application to protect

### Installation

**Clone the repository:**

   ```bash
   git clone https://github.com/controlcore/control-core.git
   cd control-core/cc-bouncer
   ```

**Install dependencies:**

```bash
   go mod tidy
   ```

**Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

**Build and run:**

   ```bash
   go run main.go
   ```

### Docker Deployment

1. **Build Docker image:**

   ```bash
   docker build -t cc-bouncer .
   ```

2. **Run with Docker Compose:**

   ```bash
   docker-compose up -d
   ```

## 📡 API Endpoints

### Core Authorization

- `POST /api/v1/authorize` - Make authorization decision
- `POST /api/v1/authorize/bulk` - Make bulk authorization decisions

### Policy Management Information

- `GET /api/v1/policies` - Get policy information
- `GET /api/v1/policies/sync` - Sync policies from OPAL
- `GET /api/v1/policies/cache` - Get cache statistics
- `POST /api/v1/policies/cache/clear` - Clear policy cache

### OPAL Integration

- `GET /api/v1/opal/status` - Check OPAL server status
- `POST /api/v1/opal/sync` - Sync with OPAL server
- `GET /api/v1/opal/data-sources` - List data sources

### OPA Integration

- `GET /api/v1/opa/data` - Get OPA data for debugging

### Context Ingestion

- `POST /api/v1/context/ingest` - Perform context ingestion
- `GET /api/v1/context/sources` - List context sources
- `GET /api/v1/context/rules` - List context rules
- `POST /api/v1/context/rules` - Create context rule
- `PUT /api/v1/context/rules/:id` - Update context rule
- `DELETE /api/v1/context/rules/:id` - Delete context rule
- `GET /api/v1/context/security-policies` - List security policies
- `POST /api/v1/context/security-policies` - Create security policy
- `PUT /api/v1/context/security-policies/:id` - Update security policy
- `DELETE /api/v1/context/security-policies/:id` - Delete security policy
- `GET /api/v1/context/config` - Get context configuration
- `PUT /api/v1/context/config` - Update context configuration

### Monitoring & Metrics

- `GET /api/v1/metrics` - Get metrics
- `GET /api/v1/stats` - Get statistics
- `GET /health` - Health check
- `GET /healthz` - Simple health check

## 🔄 Policy Flow

### 1. Request Processing

```text
Client Request → cc-bouncer → Policy Evaluation → Decision → Response
```

### 2. Policy Synchronization

```text
OPAL Server → GitHub Repo → Policy Bundle → cc-bouncer Cache
```

### 3. Data Source Integration

```text
External IAM/DB → OPAL Server → Data Sources → Policy Evaluation
```

## 🎯 Use Cases

### 1. API Protection

```yaml
# Example policy for API protection

package controlcore
allow {
    input.user.roles[_] == "admin"
    input.action.name == "read"
    input.resource.type == "api"
}
```

### 2. AI Agent Control

```yaml
# Example policy for AI agent control

package controlcore
allow {
    input.user.roles[_] == "developer"
    input.action.name == "generate"
    input.resource.type == "ai_agent"
    input.context.prompt_risk_score < 0.5
}
```

### 3. Data Access Control

```yaml
# Example policy for data access

package controlcore
allow {
    input.user.department == input.resource.department
    input.action.name == "read"
    input.resource.type == "data"
    input.context.data_classification == "public"
}
```

## 🔒 Security Features

### Authentication & Authorization

- **JWT-based Authentication**: Secure token-based authentication
- **Role-based Access Control**: Fine-grained role-based permissions
- **Attribute-based Access Control**: Context-aware access decisions
- **Multi-factor Authentication**: Support for MFA integration

### Data Protection

- **Encryption at Rest**: All cached data encrypted
- **Encryption in Transit**: TLS/SSL for all communications
- **Data Masking**: Sensitive data protection
- **Audit Logging**: Complete audit trail

### Network Security

- **TLS/SSL Encryption**: End-to-end encryption
- **Certificate Management**: Automatic certificate handling
- **Firewall Integration**: Network-level protection
- **Rate Limiting**: DDoS protection

## 📊 Monitoring & Observability

### Metrics Collection

- **Request Metrics**: Request count, response time, error rate
- **Cache Metrics**: Hit ratio, miss ratio, eviction rate
- **Policy Metrics**: Evaluation count, decision time
- **System Metrics**: CPU, memory, disk usage

### Logging

- **Structured Logging**: JSON-formatted logs
- **Request Tracing**: End-to-end request tracing
- **Audit Logging**: Security and compliance logging
- **Error Logging**: Detailed error information

### Health Checks

- **Liveness Probe**: Service health check
- **Readiness Probe**: Service readiness check
- **Dependency Checks**: OPAL, OPA, PAP health
- **Performance Checks**: Response time monitoring

## 🚀 Deployment Models

### 1. Self-Hosted (Kickstart & Custom)

```yaml
# docker-compose.yml

version: '3.8'
services:
  cc-bouncer:
    image: cc-bouncer:latest
    ports:
      - "8080:8080"
    environment:
      - TARGET_HOST=target-app:8000
      - PAP_API_URL=http://cc-pap-api:8000
      - OPAL_SERVER_URL=http://cc-opal:7000
      - TENANT_ID=default
      - API_KEY=your-api-key
```

### 2. Hybrid (Pro Plan)

```yaml
# Pro plan deployment

services:
  cc-bouncer:
    image: cc-bouncer:latest
    ports:
      - "8080:8080"
    environment:
      - TARGET_HOST=target-app:8000
      - PAP_API_URL=https://your-tenant.controlplane.controlcore.io
      - OPAL_SERVER_URL=https://your-tenant.controlplane.controlcore.io/opal
      - TENANT_ID=your-tenant-id
      - API_KEY=your-tenant-api-key
```

### 3. Kubernetes Deployment

```yaml
# k8s deployment

apiVersion: apps/v1
kind: Deployment
metadata:
  name: cc-bouncer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cc-bouncer
  template:
    metadata:
      labels:
        app: cc-bouncer
    spec:
      containers:
      - name: cc-bouncer
        image: cc-bouncer:latest
        ports:
        - containerPort: 8080
        env:
        - name: TARGET_HOST
          value: "target-app:8000"
        - name: PAP_API_URL
          value: "http://cc-pap-api:8000"
        - name: OPAL_SERVER_URL
          value: "http://cc-opal:7000"
```

## 🔧 Advanced Configuration

### Policy Caching

```yaml
# Cache configuration

cache:
  enabled: true
  ttl: 5m
  max_size: 1000
  cleanup_interval: 5m
  eviction_policy: lru
```

### Decision Caching

```yaml
# Decision cache configuration

decision_cache:
  enabled: true
  ttl: 1m
  max_size: 5000
  eviction_policy: oldest
```

### OPAL Integration Config

```yaml
# OPAL configuration

opal:
  server_url: "http://localhost:7000"
  client_id: "bouncer-client"
  client_secret: "your-secret"
  sync_interval: "5m"
  data_sources:
    - name: "github-policies"
      type: "github"
      url: "https://github.com/your-org/policies"
      branch: "main"
    - name: "iam-users"
      type: "api"
      url: "https://your-iam.com/api/users"
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Policy Sync Issues

```bash
# Check OPAL server status

curl http://localhost:7000/health
# Check bouncer OPAL status

curl http://localhost:8080/api/v1/opal/status
# Force policy sync

curl -X POST http://localhost:8080/api/v1/opal/sync
```

#### 2. Cache Issues

```bash
# Check cache statistics

curl http://localhost:8080/api/v1/policies/cache
# Clear cache

curl -X POST http://localhost:8080/api/v1/policies/cache/clear
```

#### 3. Performance Issues

```bash
# Check metrics

curl http://localhost:8080/api/v1/metrics
# Check statistics

curl http://localhost:8080/api/v1/stats
```

### Debugging

#### Enable Debug Logging

```bash
export LOG_LEVEL=debug
export LOG_ENABLED=true
```

#### Check OPA Data

```bash
curl http://localhost:8080/api/v1/opa/data
```

#### Check Policy Information

```bash
curl http://localhost:8080/api/v1/policies
```

## 📚 Additional Resources

- [Control Core Documentation](https://docs.controlcore.io)
- [OPAL Documentation](https://docs.opal.ac)
- [OPA Documentation](https://www.openpolicyagent.org/docs/)
- [GitHub Repository](https://github.com/controlcore/control-core)

## 🤝 Support

For support and questions:

- **Documentation**: [Control Core Docs](https://docs.controlcore.io)
- **Support**: [support@controlcore.io](mailto:support@controlcore.io)
- **Community**: [Control Core Community](https://community.controlcore.io)
- **GitHub**: [Control Core GitHub](https://github.com/controlcoreio)

## 📄 License

This project is licensed to Controlcore.io
