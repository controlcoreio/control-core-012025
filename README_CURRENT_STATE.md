# Control Core - Current State & Access Guide

## 🎯 Quick Start

### Access Control Core

**Frontend URL**: **http://localhost:5173**

**Login Credentials**:
```
Username: ccadmin
Password: SecurePass2025!
```

## 🐳 All Services Running in Docker

| Service | Status | URL | Description |
|---------|--------|-----|-------------|
| **cc-pap** | ✅ Running | http://localhost:5173 | Control Core Admin UI (React/Vite) |
| **cc-pap-api** | ✅ Healthy | http://localhost:8000 | Backend API (FastAPI) |
| **API Docs** | ✅ Running | http://localhost:8000/docs | Swagger UI Documentation |
| **cc-bouncer** | ✅ Healthy | http://localhost:8080 | Policy Enforcement Point (Go) |
| **cc-signup-service** | ⚠️ Running | http://localhost:8002 | User Signup Service |
| **cc-db** | ✅ Healthy | localhost:5432 | PostgreSQL Database |

## ✅ What's Been Implemented

### 1. Removed All Mock User Data
- ❌ No more demo credentials on login page
- ❌ No `MOCK_USERS` in codebase
- ✅ Real authentication via backend API
- ✅ JWT token-based sessions

### 2. Builtin Admin User
- ✅ Secure environment-based credentials
- ✅ Username: `ccadmin` (configurable via `CC_BUILTIN_ADMIN_USER`)
- ✅ Password: `SecurePass2025!` (configurable via `CC_BUILTIN_ADMIN_PASS`)
- ✅ Bcrypt encrypted password storage
- ✅ Bypasses all RBAC checks (unlimited access)
- ✅ Special audit logging (`SYSTEM_ADMIN_BYPASS`)
- ✅ No subscription setup required
- ✅ Automatic custom tier provisioning

### 3. Docker Containerization
- ✅ All services running as containers
- ✅ Infrastructure organized in `cc-infra/` folder
- ✅ One-command startup: `./cc-infra/start-controlcore.sh`
- ✅ Persistent database storage
- ✅ Health checks and auto-restart
- ✅ Development-friendly volume mounts

### 4. API Integration
- ✅ Frontend connects to backend API
- ✅ Dashboard metrics from database
- ✅ Authentication flow integrated
- ✅ CORS configured
- ✅ JWT tokens stored securely

### 5. Policy Templates
- ✅ 14 templates loaded into database
- ✅ Categories: AI Governance, AI Risk, Compliance, Security
- ✅ Template loader script: `load_policy_templates.py`
- ✅ 50+ templates available in `cc-pap-core/policy-templates/`

### 6. Custom Hooks Created
- ✅ `useDashboardStats()` - Real dashboard metrics
- ✅ `useAuditLogs()` - Audit log fetching
- ✅ `usePolicies()` - Policy management
- ✅ `usePolicyTemplates()` - Template library
- ✅ `usePIPConnections()` - PIP sources

## 🔧 Container Management

### Start Services
```bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-infra
./start-controlcore.sh
```

### Stop Services
```bash
cd cc-infra
docker compose -f controlcore-local-dev.yml down
```

### View Logs
```bash
cd cc-infra

# All services
docker compose -f controlcore-local-dev.yml logs -f

# Specific service
docker compose -f controlcore-local-dev.yml logs -f cc-pap-api
docker compose -f controlcore-local-dev.yml logs -f cc-pap
docker compose -f controlcore-local-dev.yml logs -f cc-bouncer
```

### Restart After Code Changes
```bash
cd cc-infra
docker compose -f controlcore-local-dev.yml restart cc-pap        # Frontend
docker compose -f controlcore-local-dev.yml restart cc-pap-api    # Backend
docker compose -f controlcore-local-dev.yml restart cc-bouncer    # Bouncer
```

### Rebuild After Major Changes
```bash
cd cc-infra
docker compose -f controlcore-local-dev.yml build
docker compose -f controlcore-local-dev.yml up -d
```

### Check Service Status
```bash
cd cc-infra
docker compose -f controlcore-local-dev.yml ps
```

## 📁 File Locations

### Infrastructure
- **Docker Compose**: `cc-infra/controlcore-local-dev.yml`
- **Startup Script**: `cc-infra/start-controlcore.sh`
- **Helm Charts**: `cc-infra/helm-chart/`
- **Kubernetes**: `cc-infra/k8s/`

### Backend
- **Main API**: `cc-pap-api/app/main.py`
- **Auth Router**: `cc-pap-api/app/routers/auth.py`
- **Dashboard API**: `cc-pap-api/app/routers/dashboard.py`
- **Database Init**: `cc-pap-api/init_db.py`
- **Template Loader**: `cc-pap-api/load_policy_templates.py`
- **Environment**: `cc-pap-api/.env`

### Frontend
- **Main App**: `cc-pap/src/App.tsx`
- **Auth Context**: `cc-pap/src/contexts/AuthContext.tsx`
- **API Config**: `cc-pap/src/config/app.ts`
- **Dashboard**: `cc-pap/src/components/dashboard/`
- **Hooks**: `cc-pap/src/hooks/`

### Policy Templates
- **Templates**: `cc-pap-core/policy-templates/`
- **Metadata**: `cc-pap-core/policy-templates/template-metadata.json`

## 🔐 Security Configuration

### Environment Variables

**Location**: `cc-pap-api/.env`

```bash
# System Administrator Credentials
CC_BUILTIN_ADMIN_USER=ccadmin
CC_BUILTIN_ADMIN_PASS=SecurePass2025!

# Database
DATABASE_URL=postgresql://postgres:password@cc-db:5432/control_core_db

# Security
SECRET_KEY=control-core-secret-key-2025
JWT_SECRET_KEY=jwt-secret-key-2025
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Change the password** for production deployments!

### Password Management
- Passwords stored as bcrypt hashes in database
- Never stored in plain text
- Environment variable-based configuration
- `.env` file gitignored

## 📊 Database Status

### Initialized Tables
- ✅ users (1 builtin admin created)
- ✅ policies (4 sample policies)
- ✅ policy_templates (14 templates loaded)
- ✅ protected_resources (3 sample resources)
- ✅ peps (3 bouncer instances)
- ✅ environments (2: Production, Sandbox)
- ✅ audit_logs (100 sample logs)
- ✅ pip_connections (3 connections: Auth0, Salesforce, Workday)
- ✅ ai_agents, rag_systems, content_injections
- ✅ stripe_products, stripe_prices
- ✅ integrations, mcp_connections

### Database Access
```bash
# Connect to database (from host)
psql postgresql://postgres:password@localhost:5432/control_core_db

# Connect from container
docker exec -it cc-db psql -U postgres -d control_core_db

# Check builtin admin
SELECT username, role, email FROM users WHERE role = 'builtin_admin';
```

## 🎨 Frontend Status

### Working Features
- ✅ Login page (no mock users)
- ✅ Authentication flow
- ✅ Dashboard with real metrics
- ✅ Session management
- ✅ Automatic invalid session cleanup
- ✅ Builtin admin subscription bypass

### Updated Components
- ✅ `LoginPage.tsx` - No demo credentials
- ✅ `AuthContext.tsx` - Backend API integration
- ✅ `CoreMetricsSnapshot.tsx` - Real dashboard stats
- ✅ `App.tsx` - Builtin admin routing
- ✅ `SubscriptionContext.tsx` - Admin provisioning

### Components Still Using Mock Data
- ⏳ Policy lists and environments
- ⏳ PIP sources table
- ⏳ Audit log table
- ⏳ Analysis charts
- ⏳ Settings pages

## 🔧 Development Workflow

### Making Frontend Changes
1. Edit files in `cc-pap/src/`
2. Vite hot-reloads automatically
3. Refresh browser to see changes
4. No container restart needed (volume mounted)

### Making Backend Changes
1. Edit files in `cc-pap-api/app/`
2. Uvicorn auto-reloads (--reload flag)
3. Check logs: `docker compose -f controlcore-local-dev.yml logs -f cc-pap-api`
4. Test: `curl http://localhost:8000/health`

### Database Changes
1. Edit `cc-pap-api/init_db.py`
2. Restart container to re-run init:
   ```bash
   docker compose -f controlcore-local-dev.yml restart cc-pap-api
   ```
3. Or run directly:
   ```bash
   docker compose -f controlcore-local-dev.yml exec cc-pap-api python init_db.py
   ```

### Bouncer Changes
1. Edit files in `cc-bouncer/`
2. Rebuild: `docker compose -f controlcore-local-dev.yml build cc-bouncer`
3. Restart: `docker compose -f controlcore-local-dev.yml up -d cc-bouncer`

## 🐛 Troubleshooting

### Frontend Not Loading
1. Check container status: `docker compose -f controlcore-local-dev.yml ps`
2. Check logs: `docker compose -f controlcore-local-dev.yml logs cc-pap`
3. Verify port: `curl http://localhost:5173`
4. Clear browser cache/storage

### Backend API Errors
1. Check logs: `docker compose -f controlcore-local-dev.yml logs cc-pap-api`
2. Verify health: `curl http://localhost:8000/health`
3. Check database connection: `docker compose -f controlcore-local-dev.yml exec cc-db pg_isready`
4. Restart: `docker compose -f controlcore-local-dev.yml restart cc-pap-api`

### Login Fails
1. Verify backend is running: `curl http://localhost:8000/health`
2. Test login endpoint:
   ```bash
   curl -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"ccadmin","password":"SecurePass2025!"}'
   ```
3. Check browser console for errors
4. Clear browser storage and try again

### Database Issues
1. Check database is running: `docker ps | grep cc-db`
2. Check logs: `docker compose -f controlcore-local-dev.yml logs cc-db`
3. Verify connection: `docker exec -it cc-db psql -U postgres -c "SELECT 1;"`
4. Reinitialize: `docker compose -f controlcore-local-dev.yml restart cc-pap-api`

### Container Won't Start
1. Check logs for errors
2. Remove and rebuild:
   ```bash
   docker compose -f controlcore-local-dev.yml down
   docker compose -f controlcore-local-dev.yml build
   docker compose -f controlcore-local-dev.yml up -d
   ```

## 📖 Documentation

### Key Documents
- **This File**: Current state and access guide
- **IMPLEMENTATION_SUMMARY.md**: Detailed implementation summary
- **MOCK_DATA_REMOVAL_COMPLETE.md**: Mock data cleanup status
- **cc-infra/README.md**: Infrastructure documentation
- **cc-pap-api/README.md**: Backend API documentation
- **cc-pap/README.md**: Frontend documentation

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🚀 Next Development Steps

### Priority 1: Complete Mock Data Removal
1. Update remaining dashboard widgets
2. Connect policy list to `/policies` endpoint
3. Connect audit logs to `/audit/logs` endpoint
4. Connect PIP page to `/pip/connections` endpoint
5. Remove all `MOCK_*` references from `mockData.ts`

### Priority 2: Policy Templates
1. Load remaining templates (35+ more)
2. Create template browsing UI
3. Implement template application workflow
4. Add template customization

### Priority 3: User Journey Implementation
1. Complete signup service integration
2. Stripe payment integration
3. Plan selection workflow
4. Download/deployment guides
5. Getting started wizard
6. PEP connection flow

### Priority 4: Production Readiness
1. Environment variable security
2. Secrets management
3. SSL/TLS configuration
4. Production Docker compose
5. Kubernetes deployment
6. Customer packaging

## 🔒 Security Notes

### Builtin Admin
- **Internal use only** - not for customers
- **Emergency access** - backup master credential
- **Change password** in production
- **Monitor usage** via audit logs
- **Never share** with customers

### Customer Admin
- Will be created via signup service
- Authenticated through Auth0/SAML SSO
- Full organizational privileges
- Subject to customer IAM policies

## 📊 Current Database State

### Users
- 1 builtin admin user (ccadmin)
- Role: `builtin_admin`
- All permissions granted

### Policies
- 4 sample policies created
- 14 policy templates loaded
- Categories: AI Governance, Compliance, Security

### Resources
- 3 sample protected resources
- Customer API, Analytics Dashboard, Employee Portal

### PEPs (Bouncers)
- 3 bouncer instances
- Production API Bouncer, AI Agent Bouncer, Banking App Sidecar

### 🏗️ Bouncer Deployment Architecture

**Dual Environment Deployment:**
- **Sandbox Bouncer**: Connected to PAP Sandbox mode
- **Production Bouncer**: Connected to PAP Production mode

**Client Responsibility:**
- Deploy Sandbox bouncer in front of test resources
- Deploy Production bouncer in front of production resources
- Configure appropriate environment connections
- Manage bouncer lifecycle and updates

**Deployment Pattern:**
```
Client Infrastructure:
├── Test Environment
│   ├── Test Application/API
│   └── Sandbox Bouncer → PAP Sandbox
└── Production Environment
    ├── Production Application/API
    └── Production Bouncer → PAP Production
```

### Environments
- 2 environments: Production, Sandbox
- Ready for policy promotion workflow

### Audit Logs
- 100 sample audit log entries
- Real logs will be generated during use

### PIP Connections
- 3 connections: Auth0, Salesforce, Workday
- With attribute mappings
- Sync logs available

## 🎓 Usage Examples

### Test Authentication
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ccadmin","password":"SecurePass2025!"}'
```

### Get Dashboard Stats
```bash
TOKEN="your_jwt_token_here"
curl http://localhost:8000/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

### List Policies
```bash
curl http://localhost:8000/policies \
  -H "Authorization: Bearer $TOKEN"
```

### List Policy Templates
```bash
curl http://localhost:8000/policies/templates \
  -H "Authorization: Bearer $TOKEN"
```

### Get Audit Logs
```bash
curl http://localhost:8000/audit/logs?limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

## 📝 Configuration Files

### Docker
- `cc-infra/controlcore-local-dev.yml` - Docker Compose
- `cc-pap/Dockerfile.dev` - Frontend container
- `cc-pap-api/Dockerfile` - Backend container
- `cc-bouncer/Dockerfile` - Bouncer container
- `cc-signup-service/Dockerfile` - Signup service container

### Environment
- `cc-pap-api/.env` - Backend environment variables
- `cc-pap-api/env.example` - Environment template
- `.env` files are gitignored

### Build
- `cc-pap/package.json` - Frontend dependencies
- `cc-pap-api/requirements.txt` - Backend dependencies
- `cc-bouncer/go.mod` - Bouncer dependencies

## 🔄 Remaining Work

### Mock Data Cleanup (In Progress)
**Files still referencing mock data**: 25+
- Dashboard widgets (charts, metrics)
- Policy lists and tables
- PIP sources and connections
- Audit log displays
- Analysis components
- Settings pages

**Solution**: Created custom hooks for API integration
- Use hooks to fetch real data
- Remove `MOCK_*` imports
- Replace hardcoded values

### Policy Templates (Partially Complete)
**Status**: 14/50+ templates loaded
- Need to load remaining templates
- Need to categorize properly
- Need to create browsing UI

### Customer Journey (Not Started)
- Signup service integration
- Stripe payment flow
- Plan selection
- Tenant provisioning
- Deployment guides
- Getting started wizard

## 🎯 How to Continue Development

### 1. Access the System
```bash
# Start services
cd cc-infra
./start-controlcore.sh

# Open browser
open http://localhost:5173

# Login: ccadmin / SecurePass2025!
```

### 2. Update Components
- Replace `MOCK_*` data with custom hooks
- Example: Replace `MOCK_AUDIT_LOGS` with `useAuditLogs()`
- Test each component after update

### 3. Load More Templates
```bash
cd cc-pap-api
source venv/bin/activate
python load_policy_templates.py
```

### 4. Test Changes
- Frontend auto-reloads (Vite HMR)
- Backend auto-reloads (Uvicorn --reload)
- Check browser console for errors
- Check container logs for issues

## 📧 Support

### Logs
- Frontend: `docker compose -f controlcore-local-dev.yml logs cc-pap`
- Backend: `docker compose -f controlcore-local-dev.yml logs cc-pap-api`
- Database: `docker compose -f controlcore-local-dev.yml logs cc-db`
- Bouncer: `docker compose -f controlcore-local-dev.yml logs cc-bouncer`

### Health Checks
- Frontend: http://localhost:5173
- Backend: http://localhost:8000/health
- Bouncer: http://localhost:8080/health
- Database: `docker exec cc-db pg_isready`

---

**Last Updated**: January 7, 2025, 10:30 PM
**Status**: ✅ Core Services Running
**Access**: http://localhost:5173
**Login**: ccadmin / SecurePass2025!

