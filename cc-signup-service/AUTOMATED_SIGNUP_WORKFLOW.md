# Control Core Automated Signup and Deployment Workflow
This document describes the complete automated signup and deployment workflow for Control Core, integrating Stripe, Auth0, and automated deployment systems.
## Overview
The automated signup workflow provides a seamless experience for customers to:
1. **Sign up** with their company information and choose a tier
2. **Create accounts** in Stripe (billing), Auth0 (authentication), and Control Core
3. **Automatically deploy** Control Core based on their tier
4. **Get access** to their fully configured Control Core instance
## Workflow Components
### 1. Signup Service (`cc-signup-service`)

- **Purpose**: Central orchestration service for the entire signup workflow
- **Key Features**:
  - Stripe customer and subscription creation
  - Auth0 tenant and user creation
  - Deployment configuration generation
  - BAC (Business Admin Console) logging
  - Webhook handling for real-time updates
### 2. Stripe Integration

- **Customer Management**: Creates Stripe customers with metadata
- **Subscription Management**: Sets up subscriptions based on tier
- **Billing**: Handles trial periods, payments, and invoicing
- **Webhooks**: Real-time updates for subscription changes
### 3. Auth0 Integration

- **Tenant Creation**: Creates isolated Auth0 tenants for each customer
- **User Management**: Creates admin users with appropriate roles
- **Authentication**: Provides secure login for Control Core access
- **Multi-tenant Support**: Complete tenant isolation
### 4. Automated Deployment

- **Tier-based Deployment**: Different deployment strategies per tier
- **Infrastructure Provisioning**: Automated setup of all required components
- **Configuration Management**: Environment-specific configurations
- **Health Monitoring**: Automated health checks and validation
### 5. Business Admin Console (BAC)

- **Real-time Logging**: All events logged to BAC for monitoring
- **Customer Management**: Complete CRM functionality
- **Deployment Monitoring**: Track deployment progress and status
- **Business Analytics**: Revenue and usage analytics
## Deployment Tiers
### Kickstart Tier (Hybrid)

- **Control Plane**: Hosted by Control Core (`https://app.controlcore.io`)
- **Bouncer**: Self-hosted by customer
- **Auth0**: Dedicated tenant for authentication
- **Features**: Basic policy management, 1M API calls, email support
- **Trial**: 90 days free
### Pro Tier (Hybrid)

- **Control Plane**: Hosted by Control Core (`https://app.controlcore.io`)
- **Bouncer**: Self-hosted by customer with monitoring
- **Auth0**: Dedicated tenant with advanced features
- **Features**: Advanced policy management, 10M API calls, priority support, usage-based billing
- **Trial**: 14 days free
### Custom Tier (Fully Self-hosted)

- **Control Plane**: Self-hosted on customer infrastructure
- **Bouncer**: Self-hosted with full monitoring
- **Auth0**: Dedicated tenant with full customization
- **Features**: Full customization, unlimited API calls, dedicated support, on-premise deployment
- **Trial**: 30 days free
## API Endpoints
### Signup Endpoints

- `POST /signup/` - Complete automated signup workflow
- `GET /signup/status/{deployment_id}` - Get deployment status
- `POST /signup/webhook/stripe` - Handle Stripe webhooks
- `GET /signup/tiers` - Get available subscription tiers
- `POST /signup/deploy/{customer_id}` - Manually trigger deployment
### BAC Endpoints

- `POST /api/events/deployment` - Log deployment events
- `POST /api/events/customer-signup` - Log customer signup
- `GET /api/events/deployment/{deployment_id}/status` - Get deployment status
- `GET /api/events/deployments` - List all deployments
## Configuration
### Environment Variables

```bash
# Stripe Configuration

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
# Auth0 Configuration

AUTH0_DOMAIN=controlcore.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
# BAC Configuration

BAC_API_URL=http://localhost:8001
# Deployment Configuration

DEPLOYMENT_REGION=us-east-1
SSL_MODE=letsencrypt
```
### Auth0 Tenant Configuration

Each customer gets:
- **Dedicated Auth0 Application**: Isolated authentication
- **Custom Domain**: `{tenant-id}.controlcore.auth0.com`
- **User Management**: Admin users with appropriate roles
- **Security Policies**: Tier-specific security configurations
## Deployment Process
### 1. Signup Initiation

```bash
curl -X POST https://signup.controlcore.io/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "name": "John Smith",
    "company": "Acme Corp",
    "tier": "pro",
    "region": "us-east-1"
  }'
```
### 2. Automated Processing

1. **Stripe Customer Creation**: Create customer and subscription
2. **Auth0 Tenant Setup**: Create tenant and admin user
3. **Deployment Configuration**: Generate deployment config
4. **BAC Logging**: Log all events for monitoring
5. **Deployment Trigger**: Start automated deployment
### 3. Deployment Execution

- **Kickstart/Pro**: Deploy Bouncer with monitoring (if Pro)
- **Custom**: Deploy full Control Core stack
- **SSL Configuration**: Automatic SSL certificate generation
- **Health Checks**: Validate all services are running
### 4. Access Provisioning

- **Login Credentials**: Auth0-based authentication
- **Access URLs**: Tier-specific access points
- **Documentation**: Deployment-specific instructions
## Monitoring and Logging
### Real-time Monitoring

- **Deployment Progress**: Track deployment steps and progress
- **Health Status**: Monitor all service health
- **Error Handling**: Automatic error detection and logging
- **BAC Integration**: All events logged to Business Admin Console
### Logging Events

- `customer_signup` - Customer account creation
- `deployment_started` - Deployment initiation
- `deployment_completed` - Successful deployment
- `deployment_failed` - Deployment failure
- `health_check_passed` - Service health validation
- `ssl_configured` - SSL certificate setup
## Security Considerations
### Data Isolation

- **Tenant Isolation**: Complete separation between customers
- **Auth0 Tenants**: Dedicated authentication for each customer
- **Database Separation**: Isolated data storage
- **Network Security**: Secure communication between components
### Access Control

- **Role-based Access**: Admin, User, Viewer roles
- **Permission Management**: Granular permission control
- **Session Management**: Secure session handling
- **Multi-factor Authentication**: Enhanced security options
## Troubleshooting
### Common Issues

1. **Deployment Timeout**: Check network connectivity and resource availability
2. **SSL Certificate Issues**: Verify domain ownership and DNS configuration
3. **Auth0 Configuration**: Ensure proper tenant setup and user creation
4. **Stripe Integration**: Verify API keys and webhook configuration
### Monitoring Commands

```bash
# Check deployment status

curl https://signup.controlcore.io/signup/status/{deployment_id}
# View deployment logs

curl https://bac.controlcore.io/api/events/deployment/{deployment_id}/events
# Check service health

curl https://app.controlcore.io/health
```
## Future Enhancements
### Planned Features

- **Multi-region Deployment**: Deploy across multiple regions
- **Custom Domain Support**: Customer-specific domains
- **Advanced Monitoring**: Enhanced observability and alerting
- **CI/CD Integration**: Automated updates and deployments
- **Backup and Recovery**: Automated backup and disaster recovery
### Integration Opportunities

- **Enterprise SSO**: Integration with corporate identity providers
- **Compliance Frameworks**: SOC2, ISO27001, GDPR compliance
- **Advanced Analytics**: Usage analytics and business intelligence
- **API Management**: Advanced API management and rate limiting
## Support
For technical support or questions about the automated signup workflow:
- **Documentation**: [docs.controlcore.io](https://docs.controlcore.io)
- **Support Email**: support@controlcore.io
- **Sales Contact**: sales@controlcore.io
- **Community Forum**: [community.controlcore.io](https://community.controlcore.io)
