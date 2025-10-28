# Control Core Docker Compose Files

This directory contains Docker Compose files for different deployment scenarios of the Control Core platform.

## Files Overview

### Control Core Platform

- **`controlcore-compose.yml`** - Development environment for the complete Control Core platform
- **`controlcore-prod-compose.yml`** - Production environment for the complete Control Core platform

### Demo Applications

- **`demo-app-compose.yml`** - Development environment for the ACME Consulting demo app
- **`demo-app-prod-compose.yml`** - Production environment for the ACME Consulting demo app
- **`opa-compose.yml`** - Standalone OPA server configuration
- **`cedar-compose.yml`** - Cedar Agent configuration (Future)

## Control Core Platform Services

### Core Services

- **cc-pap-api**: Policy Administration Point API
- **cc-frontend**: Control Core Admin UI (Policy Management Interface)
- **cc-bouncer**: Policy Enforcement Point (PEP) - Reverse Proxy
- **cc-opal**: Policy synchronization service
- **cc-db**: PostgreSQL database for Control Core

### Demo Services

- **acme-demo-api**: ACME Consulting demo API
- **acme-demo-frontend**: ACME Consulting demo frontend
- **acme-db**: PostgreSQL database for demo app

## Quick Start

### Development Environment

```bash
# Start Control Core platform

cd cc-infra/docker-compose
docker-compose -f controlcore-compose.yml up -d
# Start demo app only

docker-compose -f demo-app-compose.yml up -d
```

### Production Environment

```bash
# Set environment variables

export SECRET_KEY=your-secret-key
export POSTGRES_PASSWORD=your-db-password
export TENANT_ID=your-tenant-id
export API_KEY=your-api-key
export OPAL_POLICY_REPO_URL=https://github.com/your-org/policies
export ACME_POSTGRES_PASSWORD=your-acme-db-password
# Start Control Core platform

cd cc-infra/docker-compose
docker-compose -f controlcore-prod-compose.yml up -d
```

## Service Ports

### Control Core Platform Overview

- **Control Core Admin UI**: [localhost:3000](http://localhost:3000)
- **Control Core API**: [localhost:8000](http://localhost:8000)
- **Control Core Bouncer**: [localhost:8080](http://localhost:8080)
- **OPAL Server**: [localhost:7000](http://localhost:7000)
- **Control Core DB**: [localhost:5432](localhost:5432)

### Demo App

- **Demo Frontend**: [localhost:3001](http://localhost:3001)
- **Demo API**: [localhost:8001](http://localhost:8001)
- **Demo DB**: [localhost:5433](localhost:5433)

## Environment Variables

### Required for Production

- `SECRET_KEY`: Secret key for JWT tokens
- `POSTGRES_PASSWORD`: Database password
- `TENANT_ID`: Tenant identifier
- `API_KEY`: API key for Bouncer authentication
- `OPAL_POLICY_REPO_URL`: GitHub repository for policies
- `ACME_POSTGRES_PASSWORD`: Demo app database password

### Optional

- `LOG_LEVEL`: Logging level (default: info)
- `CACHE_ENABLED`: Enable decision caching (default: true)
- `LOG_ENABLED`: Enable request/response logging (default: true)

## Security Features

All Docker Compose files include:

- **Non-root users** in containers
- **Network isolation** with custom networks
- **Volume management** for data persistence
- **Health checks** for service monitoring
- **Restart policies** for high availability

## Monitoring

### Health Checks

```bash
# Check all services

docker-compose -f controlcore-compose.yml ps
# Check specific service logs

docker-compose -f controlcore-compose.yml logs cc-pap-api
docker-compose -f controlcore-compose.yml logs cc-bouncer
```

### Service Status

```bash
# Control Core API health

curl http://localhost:8000/health
# Control Core Bouncer health

curl http://localhost:8080/health
# OPAL Server health

curl http://localhost:7000/health
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, 8000, 8001, 8080, 7000, 5432, 5433 are available
2. **Database connection**: Check database credentials and network connectivity
3. **API key issues**: Verify API_KEY is set correctly for Bouncer
4. **Policy sync**: Ensure OPAL_POLICY_REPO_URL is accessible

### Logs

```bash
# View all logs

docker-compose -f controlcore-compose.yml logs
# View specific service logs

docker-compose -f controlcore-compose.yml logs -f cc-pap-api
```

## Cleanup

```bash
# Stop and remove containers

docker-compose -f controlcore-compose.yml down
# Stop and remove containers with volumes

docker-compose -f controlcore-compose.yml down -v
# Remove images

docker-compose -f controlcore-compose.yml down --rmi all
```
