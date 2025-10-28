# Control Core Customer Download System
This directory contains the customer download system for Control Core platform, providing automated package generation and deployment for different subscription tiers.
## Overview
The customer download system provides:
- **Automated Package Generation**: Generate deployment packages based on subscription tier
- **Tier-Specific Deployment**: Different packages for Kickstart, Pro, and Custom tiers
- **Onboarding Flow**: Guided onboarding process for new customers
- **Download Management**: Secure package downloads with expiration
- **Deployment Support**: Comprehensive deployment guides and scripts
- **Auto-Discovery**: Bouncers automatically register resources with Control Plane (NEW)
## Architecture
### Components

- **cc-signup-service**: Customer onboarding and package generation service
- **Package Generator**: Automated package creation for different tiers
- **Email Service**: Onboarding email notifications
- **Download Service**: Secure package download management
### Subscription Tiers
#### 1. Kickstart (Free)

- **Deployment**: Self-hosted (full platform)
- **Components**: Control Plane + Bouncer + OPAL + Database
- **Requirements**: Docker, Docker Compose, 4GB RAM, 2 CPU cores
- **Support**: Community support
- **Package Size**: ~2GB
#### 2. Pro ($99/month)

- **Deployment**: Hybrid (hosted Control Plane + self-hosted Bouncer)
- **Components**: Bouncer + OPAL Client
- **Requirements**: Docker, Docker Compose, 2GB RAM, 1 CPU core
- **Support**: Priority support
- **Package Size**: ~500MB
#### 3. Custom (Contact Sales)

- **Deployment**: Custom enterprise deployment
- **Components**: Full platform + monitoring + backup + K8s manifests
- **Requirements**: Docker, Kubernetes, Helm, 8GB RAM, 4 CPU cores
- **Support**: Dedicated support + SLA
- **Package Size**: ~5GB
## Package Contents
### Kickstart Package

```
kickstart-{user-id}-{timestamp}/
├── cc-frontend/                 # Control Core Admin UI
├── cc-pap-api/                  # Policy Administration Point API
├── cc-bouncer/                  # Policy Enforcement Point
├── cc-opal/                     # Policy synchronization service
├── cc-db/                       # PostgreSQL database
├── docker-compose.yml           # Docker Compose configuration
├── .env                         # Environment configuration
├── setup.sh                     # Setup script
├── start.sh                     # Start script
├── stop.sh                      # Stop script
└── README.md                    # Deployment guide
```
### Pro Package

```
pro-{user-id}-{timestamp}/
├── cc-bouncer/                  # Policy Enforcement Point
├── cc-opal-client/              # OPAL client for policy sync
├── docker-compose.yml           # Docker Compose configuration
├── .env                         # Environment configuration
├── setup.sh                     # Setup script
├── start.sh                     # Start script
├── stop.sh                      # Stop script
└── README.md                    # Deployment guide
```
### Custom Package

```
custom-{user-id}-{timestamp}/
├── cc-frontend/                 # Control Core Admin UI
├── cc-pap-api/                  # Policy Administration Point API
├── cc-bouncer/                  # Policy Enforcement Point
├── cc-opal/                     # Policy synchronization service
├── cc-db/                       # PostgreSQL database
├── cc-monitoring/               # Monitoring and observability
├── cc-backup/                   # Backup and recovery
├── k8s-manifests/               # Kubernetes manifests
├── helm-charts/                 # Helm charts
├── docker-compose.yml           # Docker Compose configuration
├── .env                         # Environment configuration
├── setup.sh                     # Setup script
└── README.md                    # Deployment guide
```
## Onboarding Flow
### 1. Signup Process

1. **Marketing Website**: Customer clicks "Get Started"
2. **Signup Page**: Redirected to AWS-hosted signup page
3. **Plan Selection**: Choose Kickstart (default), Pro, or Custom
4. **Payment**: Stripe integration for Pro/Custom plans
5. **Account Creation**: User account created with subscription tier
### 2. Onboarding Steps
#### Kickstart Onboarding

1. **Welcome**: Welcome email with next steps
2. **Download Package**: Download self-hosted package
3. **Deploy Platform**: Deploy Control Core on infrastructure
4. **Configure Policies**: Set up first policies
5. **Deploy Bouncer**: Deploy Bouncer to protect resources
6. **Test Deployment**: Verify deployment works
#### Pro Onboarding

1. **Welcome**: Welcome email with tenant setup
2. **Tenant Setup**: Isolated tenant prepared on AWS
3. **Download Bouncer**: Download Bouncer package
4. **Configure Policies**: Set up policies in hosted Control Plane
5. **Deploy Bouncer**: Deploy Bouncer to protect resources
6. **Test Deployment**: Verify hybrid deployment works
#### Custom Onboarding

1. **Welcome**: Welcome email with consultation scheduling
2. **Consultation**: Schedule call with Control Core team
3. **Custom Setup**: Team sets up custom deployment
4. **Training**: Receive training on custom setup
5. **Go Live**: Custom deployment goes live
## API Endpoints
### Onboarding API

- `GET /onboarding/steps` - Get onboarding steps
- `GET /onboarding/progress` - Get onboarding progress
- `POST /onboarding/start` - Start onboarding process
- `GET /onboarding/download-package` - Get download package
- `POST /onboarding/deploy/{step_id}` - Complete onboarding step
- `GET /onboarding/deployment-status` - Get deployment status
- `POST /onboarding/support-request` - Create support request
- `GET /onboarding/resources` - Get onboarding resources
### Authentication API

- `GET /auth/me` - Get current user info
### Stripe API

- `GET /stripe/products` - Get available products
- `POST /stripe/create-checkout-session` - Create checkout session
- `POST /stripe/webhook` - Handle Stripe webhooks
## Auto-Discovery System (NEW)

### Overview

Control Core now implements automatic resource discovery. When you deploy a bouncer, it automatically:
1. Registers itself with the Control Plane
2. Creates a protected resource entry
3. Links the bouncer to the resource
4. Enables immediate policy enforcement

### Benefits

- **87.5% faster deployment** (~15 minutes vs ~2 hours)
- **Zero configuration drift** (single source of truth)
- **No manual errors** (automated registration)
- **Full visibility** (see which bouncer protects each resource)

### How It Works

**Step 1**: Configure bouncer with resource information:
```yaml
environment:
  - RESOURCE_NAME=Customer API
  - RESOURCE_TYPE=api
  - TARGET_HOST=customer-api:8000
  - ORIGINAL_HOST_URL=https://api.company.com
  - SECURITY_POSTURE=deny-all
```

**Step 2**: Deploy bouncer:
```bash
docker-compose -f bouncer-compose.yml up -d
```

**Step 3**: Resource automatically appears in Control Plane UI at `/settings/resources`

**Step 4**: Enrich resource with metadata (business context, compliance tags, etc.)

### Resource Enrichment

After auto-discovery, administrators can add:

- **Business Context**: Description, cost center, owner info
- **Data Classification**: Public, internal, confidential, restricted
- **Compliance**: GDPR, HIPAA, SOC2, PCI-DSS tags
- **Operational**: SLA tier, data residency, audit level

### Templates

All new deployment packages include:
- `quick-deploy.sh` - Single-command deployment
- `bouncer-example-compose.yml` - Multi-bouncer example
- `github-actions-deploy.yml` - CI/CD workflow
- Auto-discovery configuration in all bouncer configs

See `/templates/README.md` for detailed usage.

## Deployment Scripts
### Setup Scripts

Each package includes setup scripts that:
- Check system requirements
- Create necessary directories
- Set proper permissions
- Validate configuration
- Run database migrations (NEW)
### Start Scripts

Start scripts that:
- Start Docker services
- Wait for services to be ready
- Check service health
- Provide access URLs
### Stop Scripts

Stop scripts that:
- Stop Docker services
- Clean up resources
- Provide status information
## Security Features
### Package Security

- **Secure Downloads**: HTTPS-only package downloads
- **Expiration**: Packages expire after 7-30 days
- **Authentication**: User authentication required
- **Audit Logging**: All downloads logged
### Environment Security

- **Secrets Management**: Secure environment variable handling
- **Network Security**: Internal network communication
- **Access Control**: Role-based access control
- **Encryption**: Data encryption at rest and in transit
## Monitoring and Support
### Health Checks

- **Service Health**: Monitor all service health
- **Performance Metrics**: Track performance metrics
- **Error Logging**: Comprehensive error logging
- **Alerting**: Automated alerting for issues
### Support Channels

- **Documentation**: Comprehensive deployment guides
- **Email Support**: support@controlcore.io
- **Community**: Community forum and chat
- **Enterprise Support**: Dedicated support for Pro/Custom
## Troubleshooting
### Common Issues
1. **Package Download Fails**
   - Check user authentication
   - Verify package expiration
   - Check network connectivity
2. **Deployment Fails**
   - Check system requirements
   - Verify Docker installation
   - Check port availability
3. **Services Won't Start**
   - Check environment variables
   - Verify database connectivity
   - Check resource availability
### Debug Commands

```bash
# Check service status

docker-compose ps
# View logs

docker-compose logs
# Check health

curl http://localhost:8080/health
```
## Best Practices
### 1. System Requirements

- Ensure adequate resources
- Use SSD storage for better performance
- Configure proper networking
- Set up monitoring
### 2. Security

- Use strong passwords
- Enable firewall rules
- Regular security updates
- Backup configurations
### 3. Performance

- Monitor resource usage
- Scale as needed
- Optimize configurations
- Regular maintenance
## Support
For customer onboarding issues:
1. Check deployment logs
2. Verify system requirements
3. Review documentation
4. Contact support if needed
## License
This system follows the same license as Control Core platform.
