# Control Core
**Version**: 012025  
**Release Date**: January 2025
Control Core is a comprehensive Policy-Based Access Control (PBAC) platform designed to secure APIs, AI agents, LLMs, and RAG tools with dynamic, real-time context and auditability.
## 🚀 Quick Start

```bash
# Start Control Core

./start-controlcore.sh
# Setup databases

./setup-databases.sh
# Or use Docker Compose directly

./docker-compose.sh up -d
```
## 📋 Components
### Core Platform

- **cc-pap**: Policy Administration Point (Frontend + API)
- **cc-pap-pro-tenant**: Multi-tenant Control Plane for Pro customers
- **cc-bouncer**: Policy Enforcement Point (The Bouncer)
- **cc-pap-api**: PAP API backend
- **cc-infra**: Infrastructure and deployment configurations
### Demo Application (Separate)

- **acme-consulting-demo-api**: Demo application backend
- **acme-consulting-demo-frontend**: Demo application frontend
## 🏗️ Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Control Core  │    │   Demo App      │    │   Your App      │
│                 │    │   (Separate)    │    │   (Protected)   │
│  ┌─────────────┐ │    │                 │    │                 │
│  │     PAP     │ │    │  ┌─────────────┐│    │  ┌─────────────┐│
│  │  (Admin UI) │ │    │  │   Demo API  ││    │  │   Your API  ││
│  └─────────────┘ │    │  └─────────────┘│    │  └─────────────┘│
│                 │    │                 │    │                 │
│  ┌─────────────┐ │    │  ┌─────────────┐│    │                 │
│  │   Bouncer   │◄┼────┼──┤   Demo UI   ││    │                 │
│  │   (PEP)     │ │    │  └─────────────┘│    │                 │
│  └─────────────┘ │    └─────────────────┘    └─────────────────┘
└─────────────────┘
```
## 🛠️ Features
### Policy Management

- **Visual Policy Builder**: Drag-and-drop policy creation
- **Monaco Code Editor**: Advanced Rego code editor with IntelliSense
- **Policy Templates**: Pre-built templates for common scenarios
- **Multi-environment Support**: Sandbox, staging, and production
### Enforcement

- **The Bouncer**: High-performance policy enforcement
- **Real-time Evaluation**: Live policy testing and validation
- **Context Ingestion**: Dynamic data enrichment
- **OPAL Integration**: Git-based policy synchronization
### Enterprise Features

- **Multi-tenancy**: Isolated tenant environments
- **AI Integration**: Customer LLM service integration
- **Compliance Support**: GDPR, PIPEDA, SOC2, CCPA, HIPAA, PCI DSS
- **Audit Logging**: Comprehensive activity tracking
## 🚀 Deployment Models
### Kickstart (Self-hosted)

- Control Plane: Self-hosted
- Bouncer: Self-hosted
- Database: Self-hosted
### Pro (Hybrid)

- Control Plane: AWS-hosted (multi-tenant)
- Bouncer: Self-hosted
- Database: AWS-hosted
### Custom (Self-hosted)

- Control Plane: Self-hosted
- Bouncer: Self-hosted
- Database: Self-hosted
## 📊 Service URLs
| Service | URL | Description |
|---------|-----|-------------|
| PAP Frontend | http://localhost:3000 | Policy Administration UI |
| PAP API | http://localhost:8000 | Policy Management API |
| PAP Pro Tenant | http://localhost:8001 | Multi-tenant Control Plane |
| Demo Frontend | http://localhost:3001 | Demo Application UI |
| Demo API | http://localhost:8002 | Demo Application API |
| Bouncer | http://localhost:8080 | Policy Enforcement Point |
| OPAL Server | http://localhost:7000 | Policy Synchronization |
## 🔧 Development
### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.9+ (for backend development)
- Go 1.21+ (for Bouncer development)
### Setup

```bash
# Clone repository

git clone <repository-url>
cd control-core-012025
# Start all services

./start-controlcore.sh
# Setup databases

./setup-databases.sh
# Or start specific services

./docker-compose.sh up -d postgres redis
./docker-compose.sh up -d cc-pap-api cc-pap-frontend
```
### Database Setup

```bash
# Setup databases

./setup-databases.sh
# Check database status

./version-manager.sh status
```
## 📝 Version Management
Control Core uses a date-based versioning system (MMYYYY):

```bash
# Check current version

./version-manager.sh current
# Set new version

./version-manager.sh set 022025
# Bump version

./version-manager.sh bump minor
# Update all components

./version-manager.sh update
# Show status

./version-manager.sh status
```
## 🔐 Security
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control (RBAC)**: Granular permission management
- **Attribute-based Access Control (ABAC)**: Context-aware authorization
- **Data Masking**: Dynamic data filtering and masking
- **Audit Logging**: Comprehensive security event tracking
- **Encryption**: Data encryption at rest and in transit
## 🤖 AI Integration
Control Core supports integration with customer LLM services:
- **OpenAI**: GPT-3.5, GPT-4, GPT-4 Turbo
- **Anthropic**: Claude 3, Claude 3.5
- **Azure OpenAI**: GPT-3.5, GPT-4
- **AWS Bedrock**: Claude, Llama, Titan
- **Google AI**: Gemini Pro, Gemini Ultra
- **Cohere**: Command, Command Light
- **Custom LLM**: Any OpenAI-compatible API
## 📚 Documentation
- [API Documentation](http://localhost:8000/docs)
- [Pro Tenant API](http://localhost:8001/docs)
- [Demo API Documentation](http://localhost:8002/docs)
- [Architecture Overview](cc-infra/docs/architecture-overview.md)
- [Context Deployment Guide](cc-infra/docs/context-deployment-guide.md)
- [Naming Conventions](NAMING_CONVENTIONS.md)
## 🐛 Troubleshooting
### Common Issues
1. **Port Conflicts**: Ensure ports 3000, 8000, 8001, 8002, 8080, 7000 are available
2. **Database Connection**: Check PostgreSQL is running and accessible
3. **Docker Issues**: Ensure Docker is running and has sufficient resources
### Logs

```bash
# View all logs

./docker-compose.sh logs -f
# View specific service logs

./docker-compose.sh logs -f cc-pap-api
./docker-compose.sh logs -f cc-bouncer
```
### Health Checks

```bash
# Check service health

curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8080/health
```
## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request
## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
## 🆘 Support
For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide
---
**Control Core** - Secure your APIs, AI agents, and resources with intelligent policy-based access control.
