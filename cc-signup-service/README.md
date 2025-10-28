# Control Core Signup Service
The Control Core Signup Service handles user registration and onboarding for the Control Core platform. Control Core is the centralized authorization and compliance platform built for the AI-driven enterprise. It solves the core problem of securing the dynamic, real-time interactions between new AI initiatives and legacy technology. By enforcing business, security, and compliance rules with dynamic context management, Control Core eliminates the need for brittle, custom-coded access logic, turning a major security liability into a strategic advantage. It empowers organizations to innovate faster, reduce operational costs, and mitigate the risk of a breach.
## Features
### User Registration

- **Account Creation**: Secure user account registration
- **Email Verification**: Email-based account verification
- **Plan Selection**: Integration with subscription plans
- **Onboarding**: Guided setup process for new users
### Authentication

- **Multi-Factor Authentication**: Enhanced security with MFA
- **Social Login**: Integration with Google, GitHub, and other providers
- **Password Management**: Secure password handling and recovery
- **Session Management**: Secure session handling and management
### Subscription Management

- **Plan Selection**: Kickstart, Pro, and Custom plan options
- **Payment Integration**: Stripe integration for subscription management
- **Billing Management**: Automated billing and invoice generation
- **Trial Management**: 90-day free trial for Kickstart plan
## Technology Stack
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **Authentication**: JWT tokens with Auth0 integration
- **Payment**: Stripe API integration
- **Email**: SendGrid for transactional emails
- **Monitoring**: Prometheus metrics and logging
## API Endpoints
### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/verify-email` - Email verification
- `POST /auth/reset-password` - Password reset
### User Management

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `DELETE /users/account` - Delete user account
### Subscription

- `GET /subscriptions/plans` - Get available plans
- `POST /subscriptions/create` - Create subscription
- `PUT /subscriptions/update` - Update subscription
- `DELETE /subscriptions/cancel` - Cancel subscription
## Development Setup
### Prerequisites
- Python 3.9+
- PostgreSQL 13+
- Redis (for caching)
### Installation

```bash
# Install dependencies

pip install -r requirements.txt
# Set up environment variables

cp .env.example .env
# Edit .env with your configuration
# Run database migrations

python -m alembic upgrade head
# Start the service

uvicorn app.main:app --reload
```
### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/controlcore
SECRET_KEY=your-secret-key-here
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
SENDGRID_API_KEY=your-sendgrid-key
```
## Deployment
### Docker

```bash
# Build the image

docker build -t cc-signup-service .
# Run the container

docker run -p 8000:8000 cc-signup-service
```
### Kubernetes

```bash
# Deploy with Helm

helm install cc-signup-service ./helm-chart \
  --namespace controlcore \
  --create-namespace
```
## Security
### Data Protection

- **Encryption**: All sensitive data encrypted at rest and in transit
- **GDPR Compliance**: Full GDPR compliance for data handling
- **Audit Logging**: Comprehensive audit trail for all operations
- **Rate Limiting**: Protection against abuse and attacks
### Authentication Security

- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Session Security**: Secure session management
- **CSRF Protection**: Cross-site request forgery protection
## Monitoring
### Health Checks

- **Liveness Probe**: Service health monitoring
- **Readiness Probe**: Service readiness checking
- **Database Health**: Database connection monitoring
- **External Services**: Third-party service health checks
### Metrics

- **Request Metrics**: Request count, duration, and error rates
- **Business Metrics**: Registration rates, conversion rates
- **System Metrics**: CPU, memory, and disk usage
- **Custom Metrics**: Business-specific metrics
## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
## Support
- **Documentation**: [docs.controlcore.io](https://docs.controlcore.io)
- **Community Forum**: [community.controlcore.io](https://community.controlcore.io)
- **Support Email**: support@controlcore.io
## License
This project is licensed under the MIT License - see the LICENSE file for details.
