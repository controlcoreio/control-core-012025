# Control Core Infrastructure
This document explains the infrastructure organization and how to use the infrastructure tools.
## 📁 Infrastructure Organization
All infrastructure-related files are organized in the `cc-infra/` directory:
```
cc-infra/
├── version-management/     # Version management system
│   ├── internal/         # Internal development files
│   ├── customer/        # Customer-facing files
│   └── scripts/         # Version management scripts
├── docker-compose/       # Docker Compose configurations
│   └── controlcore-compose.yml
├── scripts/             # Infrastructure scripts
│   ├── start-controlcore.sh
│   └── setup-databases.sh
├── docs/                # Infrastructure documentation
│   ├── architecture-overview.md
│   ├── context-deployment-guide.md
│   └── NAMING_CONVENTIONS.md
├── helm-chart/          # Kubernetes Helm charts
├── k8s/                 # Kubernetes manifests
├── deployment-guides/   # Deployment documentation
├── auto-scaling/        # Auto-scaling configurations
├── customer-downloads/  # Customer deployment packages
└── opal/               # OPAL server configurations
```
## 🚀 Quick Start
### From Project Root (Recommended)

```bash
# Start Control Core

./start-controlcore.sh
# Setup databases

./setup-databases.sh
# Version management

./version-manager.sh current
./version-manager.sh status
# Docker Compose operations

./docker-compose.sh up -d
./docker-compose.sh down
./docker-compose.sh logs -f
```
### Direct Usage (Advanced)

```bash
# Use scripts directly from cc-infra

cd cc-infra/scripts
./start-controlcore.sh
./setup-databases.sh
# Use version management directly

cd cc-infra/version-management/scripts
./version-manager.sh current
./version-manager.sh status
```
## 📋 Available Commands
### Control Core Management

```bash
# Start all services

./start-controlcore.sh
# Setup databases

./setup-databases.sh
# Docker Compose operations

./docker-compose.sh up -d
./docker-compose.sh down
./docker-compose.sh logs -f
./docker-compose.sh restart
```
### Version Management

```bash
# Check versions

./version-manager.sh current
./version-manager.sh customer
# Version operations

./version-manager.sh set 012025.01
./version-manager.sh bump quarter
./version-manager.sh bump patch
# Documentation

./version-manager.sh changelog
./version-manager.sh release-notes
```
## 🏗️ Infrastructure Components
### Core Services

- **cc-pap**: Policy Administration Point (Frontend + API)
- **cc-pap-pro-tenant**: Multi-tenant Control Plane
- **cc-bouncer**: Policy Enforcement Point (The Bouncer)
- **cc-pap-api**: PAP API backend
### Demo Services

- **acme-consulting-demo-api**: Demo application backend
- **acme-consulting-demo-frontend**: Demo application frontend
### Infrastructure Services

- **PostgreSQL**: Database services
- **Redis**: Caching and session management
- **OPAL**: Policy synchronization server
- **Nginx**: Reverse proxy (optional)
## 🔧 Configuration
### Environment Variables

```bash
# Database configuration

export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=password
# Service URLs

export PAP_API_URL=http://localhost:8000
export PAP_FRONTEND_URL=http://localhost:3000
export BOUNCER_URL=http://localhost:8080
```
### Docker Compose Configuration

The main Docker Compose file is located at:
```
cc-infra/docker-compose/controlcore-compose.yml
```
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
## 🔄 Development Workflow
### Starting Development

```bash
# 1. Start all services

./start-controlcore.sh
# 2. Check service status

./docker-compose.sh ps
# 3. View logs

./docker-compose.sh logs -f
```
### Database Management

```bash
# Setup databases

./setup-databases.sh
# Check database status

./docker-compose.sh exec postgres psql -U postgres -c "\l"
```
### Version Management

```bash
# Check current version

./version-manager.sh current
# Bump version for new features

./version-manager.sh bump quarter
# Bump version for bug fixes

./version-manager.sh bump patch
```
## 🐛 Troubleshooting
### Common Issues
1. **Port Conflicts**: Ensure ports 3000, 8000, 8001, 8002, 8080, 7000 are available
2. **Database Connection**: Check PostgreSQL is running
3. **Docker Issues**: Ensure Docker is running and has sufficient resources
4. **Path Issues**: Run scripts from project root
### Debugging Commands

```bash
# Check service health

curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8080/health
# View service logs

./docker-compose.sh logs cc-pap-api
./docker-compose.sh logs cc-bouncer
# Check database connectivity

./docker-compose.sh exec postgres psql -U postgres -c "SELECT 1;"
```
### Reset Everything

```bash
# Stop all services

./docker-compose.sh down
# Remove volumes (WARNING: This will delete all data)

./docker-compose.sh down -v
# Start fresh

./start-controlcore.sh
```
## 📚 Documentation
### Infrastructure Documentation

- [Architecture Overview](cc-infra/docs/architecture-overview.md)
- [Context Deployment Guide](cc-infra/docs/context-deployment-guide.md)
- [Naming Conventions](cc-infra/docs/NAMING_CONVENTIONS.md)
### Version Management

- [Version Management Guide](cc-infra/version-management/README.md)
### Deployment Guides

- [Kickstart Deployment](cc-infra/deployment-guides/kickstart-deployment.md)
- [Pro Deployment](cc-infra/deployment-guides/pro-deployment.md)
- [Custom Deployment](cc-infra/deployment-guides/custom-deployment.md)
## 🔒 Security Considerations
### Internal vs Customer Files

- **Internal files** are never shipped to customers
- **Customer files** are included in customer packages
- **Scripts** are organized by audience (internal vs customer)
### Version Management

- Internal version tracks development progress
- Customer version tracks shipped releases
- Both versions can be different
## 🆘 Support
### Getting Help

```bash
# Show help for scripts

./start-controlcore.sh --help
./setup-databases.sh --help
./version-manager.sh help
```
### Common Commands

```bash
# Check everything is working

./docker-compose.sh ps
./version-manager.sh status
# View all logs

./docker-compose.sh logs -f
# Restart services

./docker-compose.sh restart
```
---
**Control Core Infrastructure** - Organized, efficient, and maintainable infrastructure management for the Control Core platform.
