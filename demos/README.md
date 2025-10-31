# Control Core - Demo Applications

This directory serves as an index for all Control Core demo applications and resources. These demos showcase Control Core's capabilities and provide examples for developers.

## Demo Components

### 1. ACME Consulting Demo App (cc-demoapp)

**Location**: `/cc-demoapp/`  
**Technology**: Next.js, React, TypeScript, Tailwind CSS  
**Purpose**: Full-featured demo application showcasing Control Core's authorization capabilities

**Features Demonstrated**:
- Policy-based access control
- AI agent control and content injection
- Data masking and protection
- Real-time policy enforcement
- Multi-tenant scenarios
- Compliance controls (GDPR, HIPAA, PIPEDA)

**Quick Start**:
```bash
cd ../cc-demoapp
npm install
npm run dev
```

**Access**: http://localhost:3000

**Documentation**: See `/cc-demoapp/README.md` for detailed setup

---

### 2. Demo API Backend (cc-demoapp-api)

**Location**: `/cc-demoapp-api/`  
**Technology**: FastAPI, Python 3.11+  
**Purpose**: Backend API for demo application

**Features**:
- RESTful API endpoints
- Mock data generation
- Integration with Control Core PAP
- Example policy enforcement points
- Test scenarios for various use cases

**Quick Start**:
```bash
cd ../cc-demoapp-api
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python mock_backend.py
```

**Access**: http://localhost:8001

**Documentation**: See `/cc-demoapp-api/README.md`

---

### 3. Sample Policies Repository (cc-demoapp-policies-repo)

**Location**: `/cc-demoapp-policies-repo/`  
**Technology**: Rego (OPA Policy Language)  
**Purpose**: Sample policies for ACME Consulting demo

**Includes**:
- AI agent control policies
- Data masking policies
- Access control policies
- Content filtering policies
- Compliance policies

**Policy Files**:
```
cc-demoapp-policies-repo/
└── policies/
    ├── main.rego                  # Policy entry point
    ├── control-core-main.rego     # Main access control
    ├── ai-agent-control.rego      # AI agent policies
    ├── data-masking.rego          # Data protection
    ├── filter.rego                # Content filtering
    └── mask.rego                  # Masking utilities
```

**Use Cases Demonstrated**:
1. **Business Intelligence**: Secure access to analytics data
2. **AI Agent Control**: Controlled AI responses and behavior
3. **Data Protection**: Automatic data masking based on user roles
4. **Compliance**: Policy enforcement for regulatory requirements

**Integration**:
- Used by cc-demoapp to demonstrate policy enforcement
- Can be imported into Control Core PAP for testing
- Examples for GitHub policy repository integration

---

## Running Complete Demo Environment

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Python 3.11+
- Control Core services running (PAP, PAP API, Bouncer)

### Option 1: Full Stack with Docker

```bash
# Start Control Core services
cd ../cc-infra/local-development
docker compose up -d

# Start demo app
cd ../../cc-demoapp
npm install
npm run dev

# Start demo API
cd ../cc-demoapp-api
python mock_backend.py
```

### Option 2: Demo-Only Mode

Run demos without full Control Core stack (using mock mode):

```bash
# Demo app standalone
cd ../cc-demoapp
npm install
NEXT_PUBLIC_MOCK_MODE=true npm run dev

# Demo API standalone
cd ../cc-demoapp-api
python mock_backend.py
```

## Demo Scenarios

### Scenario 1: Basic Access Control

**Demo**: Role-based access to resources  
**Policies**: `control-core-main.rego`  
**Showcases**:
- User authentication
- Role-based authorization
- Resource-level permissions

### Scenario 2: AI Agent Control

**Demo**: AI chatbot with policy controls  
**Policies**: `ai-agent-control.rego`  
**Showcases**:
- Prompt injection prevention
- Content filtering
- Response modification
- Context injection

### Scenario 3: Data Protection

**Demo**: Sensitive data masking  
**Policies**: `data-masking.rego`, `mask.rego`  
**Showcases**:
- Automatic PII detection
- Role-based data masking
- Field-level security
- Data classification

### Scenario 4: Compliance

**Demo**: Regulatory compliance controls  
**Policies**: Multiple compliance policies  
**Showcases**:
- GDPR right to access/deletion
- HIPAA minimum necessary
- PIPEDA consent management
- Audit logging

## Demo User Accounts

The demo includes pre-configured user accounts with different roles:

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| admin@acme.com | Demo123! | Admin | Full access |
| manager@acme.com | Demo123! | Manager | Department access |
| developer@acme.com | Demo123! | Developer | Limited access |
| analyst@acme.com | Demo123! | Analyst | Read-only |

## Demo Data

Demo data includes:
- **Users**: 20 sample users with various roles
- **Projects**: 10 projects across different departments
- **Documents**: 50 sample documents with classifications
- **API Resources**: Multiple protected API endpoints
- **AI Conversations**: Sample conversation histories

## Customizing Demos

### Adding New Policies

1. Create policy file in `cc-demoapp-policies-repo/policies/`
2. Test policy using OPA CLI or Control Core PAP
3. Update demo app to showcase new policy

### Adding New Scenarios

1. Add new page/component in `cc-demoapp/src/`
2. Create corresponding API endpoints in `cc-demoapp-api/`
3. Document scenario in this README

### Modifying Demo Data

Edit data generators in:
- `cc-demoapp/src/lib/mock-data.ts`
- `cc-demoapp-api/app/mock_data.py`

## Demo Documentation

Detailed documentation for each demo component:

- **Demo App**: `/cc-demoapp/README.md`
- **Demo API**: `/cc-demoapp-api/README.md`
- **Policies**: `/cc-demoapp-policies-repo/README.md`
- **Architecture**: `/cc-demoapp/docs/architecture.md`
- **API Reference**: `/cc-demoapp-api/docs/api-reference.md`

## Using Demos for Customer Presentations

### Preparation Checklist

- [ ] All services running and healthy
- [ ] Demo accounts tested
- [ ] Policies loaded in Control Core
- [ ] Network connectivity verified
- [ ] Backup plans for live demos
- [ ] Demo scripts prepared

### Demo Flow Recommendations

1. **Start with Overview** (5 min)
   - Show Control Core architecture
   - Explain policy-based access control
   - Highlight key differentiators

2. **Basic Authorization** (5 min)
   - Login as different users
   - Show role-based access
   - Demonstrate policy decisions

3. **AI Agent Control** (10 min)
   - Show AI chatbot interaction
   - Demonstrate policy enforcement
   - Show content injection/filtering

4. **Data Protection** (5 min)
   - Show data masking in action
   - Demonstrate role-based visibility
   - Explain compliance benefits

5. **Live Policy Updates** (5 min)
   - Update policy in PAP
   - Show real-time propagation
   - Demonstrate immediate effect

6. **Q&A and Deep Dive** (10 min)
   - Answer questions
   - Show specific features requested
   - Discuss integration options

## Troubleshooting Demos

### Demo App Won't Start

```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Demo API Errors

```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Run with debug logging
LOG_LEVEL=debug python mock_backend.py
```

### Policies Not Working

```bash
# Verify policies loaded in Control Core
curl http://localhost:8000/policies/templates/

# Check bouncer connectivity
curl http://localhost:8080/health

# Test policy evaluation
curl -X POST http://localhost:8080/api/v1/authorize \
  -H "Content-Type: application/json" \
  -d '{"user": {"id": "test"}, "resource": {"id": "test"}, "action": {"name": "read"}}'
```

## Contributing Demo Content

We welcome contributions to improve demos:

1. Fork the repository
2. Create demo improvements
3. Test thoroughly
4. Submit pull request with demo description

## Support

For demo-related questions:

- **Documentation**: https://docs.controlcore.io/demos
- **GitHub Issues**: For bug reports
- **Email**: demos@controlcore.io

---

**Last Updated**: 2025-10-31  
**Demo Version**: 1.0

