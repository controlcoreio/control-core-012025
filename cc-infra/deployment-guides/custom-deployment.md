# Control Core Custom Deployment Guide
## Overview
This guide will help you deploy Control Core Custom, an enterprise-grade deployment with dedicated support, custom configurations, and advanced features.
## Architecture
### Enterprise Deployment Model

- **Control Plane**: Self-hosted with dedicated resources
- **Bouncer**: Self-hosted with enterprise features
- **OPAL**: Policy synchronization with enterprise features
- **Database**: Self-hosted with enterprise features
- **Monitoring**: Advanced monitoring and observability
- **Backup**: Automated backup and recovery
### Benefits

- **Complete Control**: Full control over your deployment
- **Custom Configuration**: Tailored to your specific needs
- **Enterprise Features**: Advanced monitoring, backup, and security
- **Dedicated Support**: Dedicated support team and SLA
- **Training**: Comprehensive training and onboarding
## Prerequisites
### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended)
- **Memory**: 8GB RAM minimum, 16GB recommended
- **CPU**: 4 cores minimum, 8 cores recommended
- **Storage**: 50GB free space minimum, 100GB recommended
- **Network**: High-speed internet connection
### Software Requirements

- **Docker**: Version 20.10.0 or higher
- **Docker Compose**: Version 2.0.0 or higher
- **Kubernetes**: Version 1.20.0 or higher (optional)
- **Helm**: Version 3.0.0 or higher (optional)
- **Git**: For version control
### Port Requirements

- **3000**: Control Core Admin UI
- **8080**: The Bouncer (PEP)
- **8082**: PAP API
- **7000**: OPAL Server
- **5432**: PostgreSQL Database
- **9090**: Metrics
- **9091**: Monitoring
## Installation
### 1. Download Custom Package
1. **Contact Control Core Sales**
   - Email: sales@controlcore.io
   - Schedule consultation call
   - Receive custom package
2. **Download the package**
   ```bash
   # Download your personalized package
   wget https://downloads.controlcore.io/packages/custom-{your-user-id}.zip
   
   # Extract the package
   unzip custom-{your-user-id}.zip
   cd custom-{your-user-id}
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
2. **Install Kubernetes (optional)**
   ```bash
   # Install kubectl
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   
   # Install Helm
   curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
   ```
3. **Verify installation**
   ```bash
   docker --version
   docker-compose --version
   kubectl version --client
   helm version
   ```
### 3. Configure Environment
1. **Review environment configuration**
   ```bash
   cat .env
   ```
2. **Update configuration**
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
   - `MONITORING_ENABLED`: Enable monitoring (true/false)
   - `BACKUP_ENABLED`: Enable backup (true/false)
### 4. Deploy Control Core
#### Option 1: Docker Compose Deployment
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
#### Option 2: Kubernetes Deployment
1. **Create namespace**
   ```bash
   kubectl create namespace control-core
   ```
2. **Deploy with Helm**
   ```bash
   helm install control-core helm-charts/controlcore \
     --namespace control-core \
     --values values.yaml
   ```
3. **Verify deployment**
   ```bash
   kubectl get pods -n control-core
   kubectl get services -n control-core
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
### 4. Monitoring

- **URL**: http://localhost:9090
- **Purpose**: Metrics and monitoring
- **Features**: Performance metrics, health checks, alerts
## Configuration
### 1. Policy Management
1. **Access Admin UI**
   - Go to http://localhost:3000
   - Sign in with your credentials
2. **Create policies**
   - Navigate to "Policies" section
   - Click "Create Policy"
   - Use the policy wizard or Monaco editor
   - Save and activate the policy
3. **Configure resources**
   - Navigate to "Resources" section
   - Add your APIs, applications, or services
   - Configure protection settings
### 2. Bouncer Configuration
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
### 3. Monitoring Configuration
1. **Access monitoring**
   - Go to http://localhost:9090
   - View metrics and performance data
2. **Configure alerts**
   - Set up alerting rules
   - Configure notification channels
   - Test alerting system
### 4. Backup Configuration
1. **Enable backup**
   ```bash
   # Edit .env file
   BACKUP_ENABLED=true
   BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
   ```
2. **Configure backup storage**
   ```bash
   # Set backup location
   BACKUP_LOCATION=/backup/control-core
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

- **Email**: enterprise@controlcore.io
- **Dedicated Support**: Available for Custom plans
- **SLA**: Service Level Agreement included
### 3. Professional Support

- **Dedicated Support**: Available for Custom plans
- **Training**: Comprehensive training and onboarding
- **Consulting**: Custom configuration and optimization
## Next Steps
1. **Create Policies**: Set up your first policies
2. **Configure Resources**: Add your APIs and applications
3. **Deploy Bouncer**: Deploy Bouncer to protect your resources
4. **Monitor**: Set up monitoring and alerting
5. **Scale**: Scale as needed for your workload
## Conclusion
You now have Control Core Custom running on your infrastructure with enterprise features. Follow the next steps to configure policies and protect your resources. For additional help, refer to the documentation or contact your dedicated support team.
