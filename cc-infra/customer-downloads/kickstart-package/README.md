# Control Core Kickstart Package
Welcome to Control Core! This package contains everything you need to deploy Control Core on your infrastructure.
## What's Included
### 🚀 Control Core Platform

- **Control Core PAP**: Policy Administration Point (Admin UI + API)
- **The Bouncer**: Policy Enforcement Point (PEP)
- **OPAL Server**: Git-based policy synchronization
- **Database**: PostgreSQL for Control Core data
### 📦 Demo Application

- **ACME Consulting Demo**: Sample business application
- **Database**: PostgreSQL for demo data
- **Frontend**: Demo application UI
## Quick Start
### 1. Prerequisites

- Docker and Docker Compose
- Git
- 4GB RAM minimum
- 10GB disk space
### 2. Deploy Control Core

```bash
# Extract the package

tar -xzf control-core-kickstart.tar.gz
cd control-core-kickstart
# Start Control Core platform

docker-compose -f controlcore-compose.yml up -d
# Start demo application

docker-compose -f demo-app-compose.yml up -d
```
### 3. Access the Platform
- **Control Core Admin**: http://localhost:3000
- **Demo Application**: http://localhost:3001
- **API Documentation**: http://localhost:8082/docs
### 4. Default Credentials
- **Username**: admin
- **Password**: admin123
- **API Key**: demo-api-key
## Configuration
### Environment Variables
Update `.env` file with your configuration:

```bash
# Control Core Configuration

CC_TENANT_ID=your-tenant-id
CC_API_KEY=your-api-key
CC_GITHUB_TOKEN=your-github-token
# Database Configuration

POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=control_core_db
# Demo App Configuration

DEMO_DB_PASSWORD=your-demo-password
DEMO_DB_NAME=consulting_db
```
### GitHub Integration
1. Create a GitHub repository for your policies
2. Update `OPAL_POLICY_REPO_URL` in `.env`
3. Set up webhook: `http://your-server:7000/webhook`
## Deployment Options
### Option 1: Docker Compose (Recommended)

```bash
# Full platform

docker-compose -f controlcore-compose.yml up -d
# Demo app only

docker-compose -f demo-app-compose.yml up -d
```
### Option 2: Kubernetes

```bash
# Deploy with Helm

helm install controlcore ./helm-chart/controlcore
# Deploy demo app

helm install acme-demo ./helm-chart/acme-demo
```
### Option 3: Direct K8s Manifests

```bash
# Deploy Control Core

kubectl apply -f k8s/controlcore-stack-new.yaml
# Deploy demo app

kubectl apply -f k8s/acme-stack.yaml
```
## The Bouncer Deployment
### Standalone Service

```bash
# Deploy as standalone service

docker-compose -f bouncer-compose.yml up -d
```
### Sidecar Container

```bash
# Deploy as sidecar with demo app

docker-compose -f demo-app-compose.yml up -d
```
## Policy Management
### Creating Policies
1. Access Control Core Admin UI
2. Navigate to Policies section
3. Use Visual Policy Builder or Monaco Editor
4. Policies are automatically synced via OPAL
### Policy Templates
- **Access Control**: Role-based access policies
- **AI Agent Control**: AI behavior and content injection
- **Data Masking**: Sensitive data protection
- **API Protection**: API endpoint security
## Monitoring
### Health Checks

- **Control Core PAP**: http://localhost:8082/health
- **The Bouncer**: http://localhost:8080/health
- **OPAL Server**: http://localhost:7000/health
- **Demo App**: http://localhost:8000/health
### Logs

```bash
# View all logs

docker-compose logs -f
# View specific service logs

docker logs cc-pap
docker logs cc-bouncer
docker logs cc-opal-server
```
## Security
### Network Security

- All services on internal Docker network
- No external ports exposed by default
- TLS termination at ingress level
### Authentication

- JWT-based authentication
- Role-based access control
- API key authentication for services
### Data Protection

- Encrypted data at rest
- Secure communication between services
- Audit logging for all actions
## Troubleshooting
### Common Issues
1. **Services not starting**
   - Check Docker and Docker Compose versions
   - Verify port availability
   - Check system resources
2. **Database connection issues**
   - Verify database credentials
   - Check network connectivity
   - Review database logs
3. **Policy sync issues**
   - Verify GitHub token permissions
   - Check OPAL Server logs
   - Test webhook configuration
### Debug Commands

```bash
# Check service status

docker-compose ps
# View logs

docker-compose logs -f [service-name]
# Test connectivity

curl http://localhost:8082/health
curl http://localhost:8080/health
curl http://localhost:7000/health
```
## Support
### Documentation

- Control Core Admin UI: Built-in help
- API Documentation: http://localhost:8082/docs
- Policy Examples: `policies/examples/`
### Getting Help

- Check logs for error messages
- Review configuration settings
- Test individual components
- Contact support if needed
## Next Steps
1. **Configure Policies**: Set up your access control policies
2. **Protect Resources**: Configure The Bouncer for your applications
3. **Monitor Usage**: Use the dashboard to monitor policy evaluations
4. **Scale Up**: Consider Pro plan for hosted Control Plane
## License
This package is licensed under the Control Core terms of service.
---
**Welcome to Control Core!** 🎉
Start building secure, policy-driven applications with confidence.
