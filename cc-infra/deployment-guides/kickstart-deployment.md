# Control Core Kickstart Deployment Guide
## Overview
This guide will help you deploy Control Core Kickstart on your infrastructure. Control Core Kickstart is a self-hosted Policy-Based Access Control (PBAC) platform that provides complete control over your deployment.
## Prerequisites
### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2
- **Memory**: 4GB RAM minimum, 8GB recommended
- **CPU**: 2 cores minimum, 4 cores recommended
- **Storage**: 20GB free space minimum
- **Network**: Internet connection for initial setup
### Software Requirements

- **Docker**: Version 20.10.0 or higher
- **Docker Compose**: Version 2.0.0 or higher
- **Git**: For cloning repositories (optional)
### Port Requirements

- **3000**: Control Core Admin UI
- **8080**: The Bouncer (PEP)
- **8082**: PAP API
- **7000**: OPAL Server
- **5432**: PostgreSQL Database
## Installation
### 1. Download Control Core Package
1. **Access your Control Core account**
   - Go to https://controlcore.io
   - Sign in to your account
   - Navigate to "Downloads" section
2. **Download the package**
   ```bash
   # Download your personalized package
   wget https://downloads.controlcore.io/packages/kickstart-{your-user-id}.zip
   
   # Extract the package
   unzip kickstart-{your-user-id}.zip
   cd kickstart-{your-user-id}
   ```
### 2. System Setup
1. **Install Docker and Docker Compose**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install docker.io docker-compose
   
   # Start Docker service
   sudo systemctl start docker
   sudo systemctl enable docker
   
   # Add user to docker group
   sudo usermod -aG docker $USER
   ```
2. **Verify installation**
   ```bash
   docker --version
   docker-compose --version
   ```
### 3. Configure Environment
1. **Review environment configuration**
   ```bash
   cat .env
   ```
2. **Update configuration if needed**
   ```bash
   # Edit .env file with your preferences
   nano .env
   ```
   Key configuration options:
   - `TENANT_ID`: Your tenant identifier
   - `API_KEY`: Your API key
   - `BOUNCER_PORT`: Port for The Bouncer (default: 8080)
   - `TARGET_HOST`: Target host for Bouncer proxy
   - `LOG_LEVEL`: Logging level (INFO, DEBUG, ERROR)
### 4. Deploy Control Core
1. **Run setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
2. **Start Control Core**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
3. **Verify deployment**
   ```bash
   # Check service status
   docker-compose ps
   
   # Check logs
   docker-compose logs
   ```
## Accessing Control Core
### 1. Admin UI

- **URL**: http://localhost:3000
- **Default Login**: Use your Control Core account credentials
- **Features**: Policy management, resource configuration, monitoring
### 2. The Bouncer (PEP)

- **URL**: http://localhost:8080
- **Purpose**: Policy Enforcement Point
- **Configuration**: Configure target hosts and policies
### 3. PAP API

- **URL**: http://localhost:8082
- **Purpose**: Policy Administration Point API
- **Documentation**: http://localhost:8082/docs
## Configuration
### 1. Policy Management
1. **Access Admin UI**
   - Go to http://localhost:3000
   - Sign in with your credentials
2. **Create your first policy**
   - Navigate to "Policies" section
   - Click "Create Policy"
   - Use the policy wizard or Monaco editor
   - Save and activate the policy
3. **Configure resources**
   - **Note**: Resources are now automatically discovered from bouncers (see Auto-Discovery below)
   - Navigate to "Resources" section to view and enrich auto-discovered resources
   - Resources are no longer added manually

### 2. Resource Auto-Discovery (New)

Control Core now automatically discovers resources from deployed bouncers. When you deploy a bouncer, it registers itself and the resource it's protecting with the Control Plane.

1. **Configure bouncer with resource information**

   When deploying a bouncer, add resource configuration environment variables:
   
   ```yaml
   environment:
     # Bouncer Identity
     - BOUNCER_ID=bouncer-customer-api-1
     - BOUNCER_NAME=Customer API Bouncer
     - BOUNCER_TYPE=reverse-proxy  # or sidecar
     
     # Resource Auto-Discovery (Required)
     - RESOURCE_NAME=Customer API
     - RESOURCE_TYPE=api  # api, webapp, database, ai-agent, mcp-server
     - TARGET_HOST=customer-api:8000
     - ORIGINAL_HOST_URL=https://api.company.com
     - SECURITY_POSTURE=deny-all
     
     # Deployment Context
     - DEPLOYMENT_PLATFORM=docker
     - ENVIRONMENT=production
     
     # Control Plane Connection
     - PAP_API_URL=http://cc-pap-api:8082
     - TENANT_ID=your-tenant-id
     - API_KEY=your-api-key
   ```

2. **Deploy the bouncer**
   ```bash
   docker-compose -f bouncer-compose.yml up -d
   ```

3. **Verify registration**
   ```bash
   # Check bouncer registered
   docker logs your-bouncer | grep "Successfully registered"
   
   # View in Control Plane
   curl http://localhost:8082/api/v1/resources | jq
   ```

4. **Enrich the resource** (via UI or API)
   
   After auto-discovery, navigate to `/settings/resources` and add:
   - Business context and description
   - Data classification (public, internal, confidential, restricted)
   - Compliance tags (GDPR, HIPAA, SOC2, etc.)
   - Owner information (email, team)
   - SLA tier (gold, silver, bronze)
   - Data residency requirements

**Benefits of Auto-Discovery**:
- ✅ No manual resource creation needed
- ✅ Resources automatically linked to bouncers
- ✅ Configuration comes from infrastructure code
- ✅ Eliminates configuration drift
- ✅ Faster deployment (15 minutes vs 2 hours)

See `/cc-infra/docs/AUTO_DISCOVERY.md` for complete documentation.

### 3. Bouncer Configuration (Legacy)
1. **Configure target hosts**
   ```bash
   # Edit .env file
   TARGET_HOST=your-api-server:8000
   ```
2. **Restart Bouncer**
   ```bash
   docker-compose restart cc-bouncer
   ```
3. **Test Bouncer**
   ```bash
   # Test health endpoint
   curl http://localhost:8080/health
   
   # Test policy evaluation
   curl -X POST http://localhost:8080/evaluate \
     -H "Content-Type: application/json" \
     -d '{"user": "test", "resource": "/api/data", "action": "GET"}'
   ```
### 3. Policy Synchronization
1. **Configure OPAL**
   - OPAL automatically syncs policies from your Control Plane
   - No additional configuration needed
2. **Monitor synchronization**
   ```bash
   # Check OPAL logs
   docker-compose logs cc-opal
   ```
## Monitoring and Maintenance
### 1. Health Checks
1. **Service health**
   ```bash
   # Check all services
   docker-compose ps
   
   # Check specific service
   docker-compose logs cc-frontend
   docker-compose logs cc-pap-api
   docker-compose logs cc-bouncer
   ```
2. **API health**
   ```bash
   # Frontend health
   curl http://localhost:3000/api/health
   
   # PAP API health
   curl http://localhost:8082/api/v1/health
   
   # Bouncer health
   curl http://localhost:8080/health
   ```
### 2. Logs and Monitoring
1. **View logs**
   ```bash
   # All services
   docker-compose logs
   
   # Specific service
   docker-compose logs cc-bouncer
   
   # Follow logs
   docker-compose logs -f cc-bouncer
   ```
2. **Monitor performance**
   ```bash
   # Check resource usage
   docker stats
   
   # Check disk usage
   df -h
   ```
### 3. Backup and Recovery
1. **Backup data**
   ```bash
   # Backup database
   docker-compose exec cc-db pg_dump -U postgres control_core_db > backup.sql
   
   # Backup configuration
   cp .env backup.env
   ```
2. **Restore data**
   ```bash
   # Restore database
   docker-compose exec -T cc-db psql -U postgres control_core_db < backup.sql
   ```
## Troubleshooting
### Common Issues
1. **Services won't start**
   ```bash
   # Check Docker status
   sudo systemctl status docker
   
   # Check port availability
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8080
   ```
2. **Database connection errors**
   ```bash
   # Check database logs
   docker-compose logs cc-db
   
   # Restart database
   docker-compose restart cc-db
   ```
3. **Bouncer not working**
   ```bash
   # Check Bouncer logs
   docker-compose logs cc-bouncer
   
   # Test Bouncer connectivity
   curl http://localhost:8080/health
   ```
### Debug Commands
1. **Service status**
   ```bash
   docker-compose ps
   docker-compose top
   ```
2. **Resource usage**
   ```bash
   docker stats
   docker system df
   ```
3. **Network connectivity**
   ```bash
   # Test internal connectivity
   docker-compose exec cc-bouncer ping cc-pap
   docker-compose exec cc-bouncer ping cc-opal
   ```
## Security Considerations
### 1. Network Security

- **Firewall**: Configure firewall rules to restrict access
- **SSL/TLS**: Use HTTPS for production deployments
- **VPN**: Consider VPN access for remote administration
### 2. Authentication

- **Strong Passwords**: Use strong passwords for all accounts
- **MFA**: Enable multi-factor authentication where possible
- **API Keys**: Rotate API keys regularly
### 3. Data Protection

- **Encryption**: Enable encryption at rest and in transit
- **Backup**: Regular backups of configuration and data
- **Updates**: Keep system and dependencies updated
## Performance Optimization
### 1. Resource Allocation

- **Memory**: Allocate adequate memory for each service
- **CPU**: Use multiple CPU cores for better performance
- **Storage**: Use SSD storage for better I/O performance
### 2. Scaling

- **Horizontal Scaling**: Deploy multiple Bouncer instances
- **Load Balancing**: Use load balancer for multiple instances
- **Caching**: Enable caching for better performance
### 3. Monitoring

- **Metrics**: Monitor CPU, memory, and disk usage
- **Logs**: Centralize log collection and analysis
- **Alerts**: Set up alerts for critical issues
## Support
### 1. Documentation

- **User Guide**: https://docs.controlcore.io
- **API Documentation**: http://localhost:8082/docs
- **Community**: https://community.controlcore.io
### 2. Support Channels

- **Email**: support@controlcore.io
- **Community Forum**: https://community.controlcore.io
- **GitHub Issues**: https://github.com/controlcore/issues
### 3. Professional Support

- **Priority Support**: Available for Pro and Custom plans
- **Dedicated Support**: Available for Custom plans
- **Training**: Available for Custom plans
## Next Steps
1. **Create Policies**: Set up your first policies
2. **Configure Resources**: Add your APIs and applications
3. **Deploy Bouncer**: Deploy Bouncer to protect your resources
4. **Monitor**: Set up monitoring and alerting
5. **Scale**: Scale as needed for your workload
## Conclusion
You now have Control Core Kickstart running on your infrastructure. Follow the next steps to configure policies and protect your resources. For additional help, refer to the documentation or contact support.
