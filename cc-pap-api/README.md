# Control Core PAP API
The Policy Administration Point (PAP) API for Control Core - the centralized authorization and compliance platform built for the AI-driven enterprise. It solves the core problem of securing the dynamic, real-time interactions between new AI initiatives and legacy technology. By enforcing business, security, and compliance rules with dynamic context management, Control Core eliminates the need for brittle, custom-coded access logic, turning a major security liability into a strategic advantage. It empowers organizations to innovate faster, reduce operational costs, and mitigate the risk of a breach.
## Overview
Control Core PAP API provides the backend services for policy management, user authentication, resource protection, and decision monitoring. It serves as the central control plane for the Control Core platform.
## Features
### Core Functionality

- **Policy Management**: Create, update, and manage Rego policies
- **User Authentication**: JWT-based auth with Auth0 integration
- **Resource Protection**: Define and manage protected resources
- **Decision Engine**: Real-time policy evaluation and decision logging
- **Audit System**: Comprehensive audit logging and monitoring
### AI Agent Control

- **AI Agent Management**: Register and configure AI agents (LLMs, RAG systems)
- **Content Injection**: Pre/post-prompt and response modification
- **Context Engineering**: RAG system integration and context filtering
- **AI Policy Templates**: Pre-built templates for AI safety and governance
### Integration & Deployment

- **Stripe Integration**: Subscription and payment management
- **Auth0 Integration**: Magic links, passkeys, and SAML SSO
- **Monaco Editor**: Rego code editor with IntelliSense
- **OPAL Integration**: Git-based policy management and synchronization
## Quick Start
### Prerequisites

- Docker and Docker Compose
- Git
### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/controlcore/control-core.git
   cd control-core/cc-pap-api
   ```
2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```
3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env and set CC_BUILTIN_ADMIN_USER and CC_BUILTIN_ADMIN_PASS
   ```

4. **Initialize the database:**
   ```bash
   python init_db.py
   ```

5. **Access the services:**
   - Control Core Admin: http://localhost:3000
   - API Documentation: http://localhost:8000/docs
   - Demo App: http://localhost:3001

## API Endpoints
### Authentication

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current user
### Policy Management

- `GET /policies` - List all policies
- `POST /policies` - Create new policy
- `PUT /policies/{id}` - Update policy
- `DELETE /policies/{id}` - Delete policy
- `POST /policies/{id}/promote` - Promote policy to production
### Resource Management

- `GET /resources` - List protected resources
- `POST /resources` - Add protected resource
- `PUT /resources/{id}` - Update resource
- `DELETE /resources/{id}` - Remove resource
### Decision Engine

- `POST /decisions/evaluate` - Evaluate access decision
- `GET /decisions/audit` - Get decision audit logs
### AI Agent Control

- `GET /ai-agents` - List AI agents
- `POST /ai-agents` - Register AI agent
- `PUT /ai-agents/{id}` - Update AI agent
- `DELETE /ai-agents/{id}` - Remove AI agent
### Content Injection

- `GET /ai-agents/{id}/injections` - List content injections
- `POST /ai-agents/{id}/injections` - Create content injection
- `PUT /injections/{id}` - Update content injection
- `DELETE /injections/{id}` - Remove content injection
## Configuration
### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@cc-db:5432/control_core_db` |
| `SECRET_KEY` | Application secret key | `your-secret-key-here` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `AUTH0_DOMAIN` | Auth0 domain | `your-domain.auth0.com` |
| `GITHUB_TOKEN` | GitHub token for policy management | `your_github_token` |
### Database Schema
The API uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `policies` - Rego policy definitions
- `protected_resources` - Resources to protect
- `ai_agents` - AI agent configurations
- `content_injections` - Content injection rules
- `audit_logs` - Decision and activity logs
## Development
### Running in Development Mode
1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```
3. **Run the application:**
   ```bash
   uvicorn app.main:app --reload
   ```
### Testing

```bash
# Run tests

pytest
# Run with coverage

pytest --cov=app
```
## Deployment
### Docker Deployment

```bash
# Build and run with Docker Compose

docker-compose up -d
# View logs

docker-compose logs -f
# Stop services

docker-compose down
```
### Production Deployment
1. **Set production environment variables**
2. **Configure reverse proxy (nginx)**
3. **Set up SSL certificates**
4. **Configure monitoring and logging**
## Architecture
### Components

- **PAP API**: Policy Administration Point API
- **Frontend**: React-based admin interface
- **Database**: PostgreSQL for data persistence
- **OPAL**: Policy synchronization service
- **Bouncer**: Policy Enforcement Point (PEP)
### Data Flow

1. **Policy Creation**: Users create policies via the admin interface
2. **Policy Storage**: Policies are stored in the database and Git repository
3. **Policy Sync**: OPAL synchronizes policies to the Bouncer
4. **Decision Making**: Bouncer evaluates policies for incoming requests
5. **Audit Logging**: All decisions are logged for compliance
## Support
- 📧 Email: info@controlcore.io
- 💬 Chat: Discord.gg/HjhcT572
- 📚 Docs: docs.controlcore.io
- 🐛 Issues: GitHub Issues
## License
Copyright © 2025 Control Core. All rights reserved.
