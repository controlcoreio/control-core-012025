# Control Core PAP Core Library

Shared core library for both single-tenant (cc-pap-api) and multi-tenant (cc-pap-pro-tenant) Control Core implementations. Control Core is the centralized authorization and compliance platform built for the AI-driven enterprise. It solves the core problem of securing the dynamic, real-time interactions between new AI initiatives and legacy technology. By enforcing business, security, and compliance rules with dynamic context management, Control Core eliminates the need for brittle, custom-coded access logic, turning a major security liability into a strategic advantage. It empowers organizations to innovate faster, reduce operational costs, and mitigate the risk of a breach.

## Overview

This library contains the shared business logic, models, and integrations used by both single-tenant and multi-tenant Control Core APIs. It provides a common foundation while allowing each implementation to handle tenant isolation and deployment-specific concerns.

## Architecture

```text
cc-pap-core/
├── models/              # Shared database models
├── schemas/             # Shared Pydantic schemas  
├── services/            # Business logic services
├── utils/               # Utility functions
├── integrations/        # External service integrations
│   ├── opa/            # OPA integration
│   ├── stripe/         # Stripe integration
│   ├── auth0/          # Auth0 integration
│   └── aws/            # AWS integration
├── policies/            # Policy management core
│   ├── rego/           # Rego policy handling
│   ├── validation/     # Policy validation
│   ├── deployment/     # Policy deployment
│   └── testing/        # Policy testing framework
├── policy-templates/    # Comprehensive policy template library
│   ├── ai-governance/   # AI governance policies
│   ├── ai-risk-management/ # AI risk management (NIST)
│   ├── ai-prompt-security/ # AI prompt security
│   ├── ai-context-management/ # AI dynamic context
│   ├── compliance/      # Regulatory compliance (GDPR, HIPAA, etc.)
│   ├── security/        # Security frameworks
│   ├── industry-frameworks/ # Industry-specific frameworks
│   ├── ai-assistants/   # AI assistant policies
│   └── template-metadata.json # Smart suggestions engine
├── auth/               # Authentication and authorization
├── audit/              # Audit logging
└── exceptions/         # Shared exceptions
```

## Features

### Policy Management

- Rego policy parsing and validation
- Policy testing framework
- Policy deployment and rollback
- Policy versioning and history
- Policy templates and libraries

### External Integrations

- **Auth0 Service** (`auth0_service.py`) - Complete Auth0 integration for tenant management, user authentication, and authorization
- **Stripe Service** (`stripe_service.py`) - Comprehensive Stripe integration for billing, subscriptions, and customer management
- **API Service** (`api_service.py`) - Centralized API client for both self-hosted and hosted deployments
- OPA (Open Policy Agent) integration
- AWS services integration

### Frontend Integration

- **React Hooks** (`useApi.ts`) - Shared React Query hooks for both cc-pap and cc-pap-pro-tenant frontends
- **Type Definitions** (`api.ts`) - Shared TypeScript types for API responses
- **Error Handling** - Built-in error handling and loading states
- **Caching** - Intelligent caching and background updates
**Note**: Deployment configurations are managed in `cc-infra/scripts/deployment-configs.ts` for proper infrastructure organization.

### Authentication & Authorization

- JWT token handling
- Role-based access control
- API key management
- User session management

### Audit & Logging

- Comprehensive audit logging
- Decision tracking
- Performance monitoring
- Security event logging

## Usage

### Single-Tenant API (cc-pap-api)

```python
from cc_pap_core.services import PolicyService
from cc_pap_core.integrations.opa import OPAClient
from cc_pap_core.auth import AuthenticationService
# Use shared services

policy_service = PolicyService()
opa_client = OPAClient()
auth_service = AuthenticationService()
```

### Multi-Tenant API (cc-pap-pro-tenant)

```python
from cc_pap_core.services import PolicyService
from cc_pap_core.integrations.opa import OPAClient
from cc_pap_core.auth import AuthenticationService
from cc_pap_core.tenant import TenantContext
# Use shared services with tenant context

def get_policy_service(tenant_id: str) -> PolicyService:
    return PolicyService(tenant_context=TenantContext(tenant_id))
```

## Installation

```bash
pip install -e cc-pap-core/
```

## Development

```bash
# Install development dependencies

pip install -e cc-pap-core/[dev]
# Run tests

pytest cc-pap-core/tests/
# Run linting

flake8 cc-pap-core/
black cc-pap-core/
```

## API Reference

See the comprehensive API documentation in the cc-docs repository for detailed usage examples and API references.
