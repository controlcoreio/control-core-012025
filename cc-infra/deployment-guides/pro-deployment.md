# Control Core Pro Deployment Guide
## Overview
This guide will help you deploy Control Core Pro, a hybrid deployment model where the Control Plane is hosted on AWS and you deploy The Bouncer on your infrastructure.
## Architecture
### Hybrid Deployment Model

- **Control Plane**: Hosted on AWS (multi-tenant)
- **Bouncer**: Self-hosted on your infrastructure
- **OPAL**: Synchronizes policies from hosted Control Plane to your Bouncer
- **Database**: Hosted on AWS (shared)
### Benefits

- **Reduced Infrastructure**: No need to host Control Plane
- **Automatic Updates**: Control Plane updates automatically
- **Scalability**: AWS handles Control Plane scaling
- **Security**: Isolated tenant with dedicated resources
## Prerequisites
### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2
- **Memory**: 2GB RAM minimum, 4GB recommended
- **CPU**: 1 core minimum, 2 cores recommended
- **Storage**: 10GB free space minimum
- **Network**: Internet connection for policy synchronization
### Software Requirements

- **Docker**: Version 20.10.0 or higher
- **Docker Compose**: Version 2.0.0 or higher
- **Internet Access**: Required for policy synchronization
### Port Requirements

- **8080**: The Bouncer (PEP)
- **7000**: OPAL Client
- **9090**: Metrics (optional)
## Installation
### 1. Download Pro Package
1. **Access your Control Core account**
   - Go to https://controlcore.io
   - Sign in to your account
   - Navigate to "Downloads" section
2. **Download the package**
   ```bash
   # Download your personalized package
   wget https://downloads.controlcore.io/packages/pro-{your-user-id}.zip
   
   # Extract the package
   unzip pro-{your-user-id}.zip
   cd pro-{your-user-id}
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
2. **Update configuration**
   ```bash
   # Edit .env file with your preferences
   nano .env
   ```
   Key configuration options:
   - `CONTROL_PLANE_URL`: Your hosted Control Plane URL
   - `TENANT_ID`: Your tenant identifier
   - `API_KEY`: Your API key
   - `BOUNCER_PORT`: Port for The Bouncer (default: 8080)
   - `TARGET_HOST`: Target host for Bouncer proxy
   - `LOG_LEVEL`: Logging level (INFO, DEBUG, ERROR)
### 4. Deploy Bouncer
1. **Run setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
2. **Start Bouncer**
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
### 1. Hosted Control Plane

- **URL**: https://controlplane.controlcore.io
- **Login**: Use your Control Core account credentials
- **Features**: Policy management, resource configuration, monitoring
### 2. The Bouncer (PEP)

- **URL**: http://localhost:8080
- **Purpose**: Policy Enforcement Point
- **Configuration**: Configure target hosts and policies
### 3. Policy Synchronization

- **OPAL Client**: Automatically syncs policies from hosted Control Plane
- **Real-time**: Policies are synchronized in real-time
- **Reliable**: Built-in retry and error handling
## Configuration
### 1. Policy Management
1. **Access Hosted Control Plane**
   - Go to https://controlplane.controlcore.io
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
### 3. Policy Synchronization
1. **Monitor synchronization**
   ```bash
   # Check OPAL client logs
   docker-compose logs cc-opal-client
   ```
2. **Verify policy sync**
   ```bash
   # Check Bouncer policies
   curl http://localhost:8080/policies
   ```
## Monitoring and Maintenance
### 1. Health Checks
1. **Service health**
   ```bash
   # Check all services
   docker-compose ps
   
   # Check specific service
   docker-compose logs cc-bouncer
   docker-compose logs cc-opal-client
   ```
2. **API health**
   ```bash
   # Bouncer health
   curl http://localhost:8080/health
   
   # OPAL client health
   curl http://localhost:7000/health
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
### 3. Policy Synchronization Monitoring
1. **Check sync status**
   ```bash
   # Check OPAL client status
   curl http://localhost:7000/status
   ```
2. **Monitor sync logs**
   ```bash
   # Check sync logs
   docker-compose logs cc-opal-client | grep "sync"
   ```
## Troubleshooting
### Common Issues
1. **Services won't start**
   ```bash
   # Check Docker status
   sudo systemctl status docker
   
   # Check port availability
   netstat -tulpn | grep :8080
   ```
2. **Policy synchronization issues**
   ```bash
   # Check OPAL client logs
   docker-compose logs cc-opal-client
   
   # Check network connectivity
   docker-compose exec cc-opal-client ping controlplane.controlcore.io
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
   docker-compose exec cc-bouncer ping cc-opal-client
   
   # Test external connectivity
   docker-compose exec cc-opal-client ping controlplane.controlcore.io
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
- **Backup**: Regular backups of configuration
- **Updates**: Keep system and dependencies updated
## Performance Optimization
### 1. Resource Allocation

- **Memory**: Allocate adequate memory for Bouncer
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
- **API Documentation**: https://controlplane.controlcore.io/docs
- **Community**: https://community.controlcore.io
### 2. Support Channels

- **Email**: support@controlcore.io
- **Priority Support**: Available for Pro plans
- **Community Forum**: https://community.controlcore.io
### 3. Professional Support

- **Priority Support**: Available for Pro plans
- **Dedicated Support**: Available for Custom plans
- **Training**: Available for Custom plans
## Next Steps
1. **Create Policies**: Set up your first policies in the hosted Control Plane
2. **Configure Resources**: Add your APIs and applications
3. **Deploy Bouncer**: Deploy Bouncer to protect your resources
4. **Monitor**: Set up monitoring and alerting
5. **Scale**: Scale as needed for your workload
## Conclusion
You now have Control Core Pro running with a hosted Control Plane and self-hosted Bouncer. Follow the next steps to configure policies and protect your resources. For additional help, refer to the documentation or contact support.
