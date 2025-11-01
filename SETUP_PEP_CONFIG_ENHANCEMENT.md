# Setup Guide: PEP Configuration Enhancement

## Quick Start

This guide will help you set up and test the new PEP configuration enhancement feature.

---

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ installed
- PostgreSQL or SQLite database
- Access to Control Core backend and frontend repositories

---

## Step 1: Database Migration

### Navigate to the backend directory:
```bash
cd cc-pap-api
```

### Activate virtual environment (if using one):
```bash
source venv/bin/activate  # On Linux/Mac
# or
.\venv\Scripts\activate   # On Windows
```

### Run the database migration:
```bash
alembic upgrade head
```

### Verify the migration:
```bash
# Check that new columns were added
python -c "
from app.database import SessionLocal
from app.models_config import GlobalPEPConfig

db = SessionLocal()
config = db.query(GlobalPEPConfig).first()
if config:
    print('✓ Migration successful!')
    print(f'  - default_sidecar_port: {config.default_sidecar_port}')
    print(f'  - sidecar_injection_mode: {config.sidecar_injection_mode}')
    print(f'  - sidecar_resource_limits_cpu: {config.sidecar_resource_limits_cpu}')
    print(f'  - sidecar_resource_limits_memory: {config.sidecar_resource_limits_memory}')
else:
    print('⚠ No global config found - will be created on first use')
db.close()
"
```

---

## Step 2: Start Backend Services

### Start the FastAPI backend:
```bash
# In cc-pap-api directory
uvicorn app.main:app --reload --port 8000
```

### Verify backend is running:
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

---

## Step 3: Start Frontend

### Navigate to frontend directory:
```bash
cd ../cc-pap
```

### Install dependencies (if not already installed):
```bash
npm install
```

### Start the development server:
```bash
npm run dev
```

### Open browser:
Navigate to `http://localhost:5173` (or the port shown in terminal)

---

## Step 4: Test the Feature

### 4.1 Test Global Configuration

1. **Login to the application**
2. **Navigate to**: Settings → Bouncers → Configuration & Settings tab
3. **Verify sections appear**:
   - ✓ Common Configuration (always visible)
   - ✓ Reverse-Proxy Specific Configuration (if you have reverse-proxy bouncers)
   - ✓ Sidecar Specific Configuration (if you have sidecar bouncers)

4. **Test Configuration Fields**:
   
   **Common Configuration**:
   - [ ] Control Plane URL is editable
   - [ ] Shows current value from backend
   
   **Sidecar Configuration** (if visible):
   - [ ] Default Sidecar Port accepts numbers 1-65535
   - [ ] Sidecar Injection Mode dropdown works (automatic/manual)
   - [ ] Namespace Selector is editable
   - [ ] CPU Limit accepts values like "500m", "1", "2"
   - [ ] Memory Limit accepts values like "256Mi", "512Mi", "1Gi"
   - [ ] Init Container toggle works

5. **Test Saving**:
   - [ ] Make changes to any field
   - [ ] Verify "Unsaved Changes" indicator appears
   - [ ] Click "Save Global Settings"
   - [ ] Verify success toast notification
   - [ ] Refresh page and verify changes persist

### 4.2 Test Individual Bouncer Configuration

1. **Select a bouncer** from the "Individual Bouncer Configuration" dropdown
2. **Verify conditional rendering**:
   
   **If Reverse-Proxy**:
   - [ ] Shows "Upstream Service Configuration (Reverse-Proxy)" section
   - [ ] Shows Upstream Target URL field
   - [ ] Shows Proxy Timeout dropdown
   - [ ] Shows Public Proxy URL field
   
   **If Sidecar**:
   - [ ] Shows "Sidecar Configuration" section
   - [ ] Shows Sidecar Port Override field
   - [ ] Shows Traffic Interception Mode dropdown
   - [ ] Shows CPU/Memory Limit Override fields

3. **Test Configuration Save**:
   - [ ] Make changes
   - [ ] Click "Save Configuration"
   - [ ] Verify success notification
   - [ ] Verify changes persist after reload

### 4.3 Test API Endpoints

#### Get Global Configuration:
```bash
curl -X GET http://localhost:8000/pep-config/global \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "id": 1,
  "tenant_id": "...",
  "control_plane_url": "https://api.controlcore.io",
  "default_proxy_domain": "bouncer.controlcore.io",
  "default_sidecar_port": 8080,
  "sidecar_injection_mode": "automatic",
  "sidecar_resource_limits_cpu": "500m",
  "sidecar_resource_limits_memory": "256Mi",
  "sidecar_init_container_enabled": true,
  ...
}
```

#### Update Global Configuration:
```bash
curl -X PUT http://localhost:8000/pep-config/global \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "default_sidecar_port": 9090,
    "sidecar_injection_mode": "manual",
    "sidecar_resource_limits_cpu": "1",
    "sidecar_resource_limits_memory": "512Mi"
  }'
```

#### Get Effective Configuration for a Bouncer:
```bash
curl -X GET http://localhost:8000/pep-config/effective/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Step 5: Test Configuration Propagation

### Simulate Bouncer Polling:

```bash
# This simulates what a deployed bouncer would do
# Replace {pep_id} with actual PEP ID

curl -X GET http://localhost:8000/pep-config/effective/{pep_id}
```

**Expected Behavior**:
- Response includes only relevant configuration for the bouncer's deployment mode
- Reverse-proxy bouncers get `proxy_domain` but not sidecar fields
- Sidecar bouncers get sidecar fields but not `proxy_domain`
- Individual overrides take precedence over global defaults

---

## Troubleshooting

### Issue: Migration fails

**Solution**:
```bash
# Check alembic version
alembic current

# If needed, create a new database
rm test.db  # If using SQLite
alembic upgrade head
```

### Issue: Frontend doesn't show new fields

**Solution**:
1. Clear browser cache
2. Check browser console for errors
3. Verify backend is running and accessible
4. Check that global config endpoint returns new fields

### Issue: Configuration not saving

**Solution**:
1. Check browser network tab for API errors
2. Verify authentication token is valid
3. Check backend logs for errors
4. Ensure database migration completed successfully

### Issue: Bouncer types not detected

**Solution**:
1. Ensure you have bouncers registered in the system
2. Check bouncer `deployment_mode` field in database:
   ```sql
   SELECT id, name, deployment_mode FROM peps;
   ```
3. Verify bouncers are properly registered with correct deployment_mode

---

## Validation Checks

### Database Schema:
```sql
-- Check global_pep_config table
PRAGMA table_info(global_pep_config);
-- Should show new sidecar columns

-- Check individual_pep_config table
PRAGMA table_info(individual_pep_config);
-- Should show new sidecar override columns
```

### API Health:
```bash
# Check if all endpoints are accessible
curl http://localhost:8000/pep-config/global
curl http://localhost:8000/pep-config/individual/1
curl http://localhost:8000/pep-config/effective/1
```

### Frontend Console:
Open browser DevTools → Console
- Should not see any React errors
- Should see successful API calls to `/pep-config/global`

---

## Testing Checklist

- [ ] Database migration completed successfully
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Global configuration loads from backend
- [ ] Bouncer type detection works
- [ ] Conditional UI rendering works correctly
- [ ] Configuration fields are editable
- [ ] Save operations succeed
- [ ] Unsaved changes warning works
- [ ] Configuration persists after page reload
- [ ] API endpoints return correct data
- [ ] Reverse-proxy bouncers see only relevant fields
- [ ] Sidecar bouncers see only relevant fields

---

## Next Steps

Once testing is complete:

1. **Code Review**: Submit PR for team review
2. **Integration Testing**: Test with actual deployed bouncers
3. **Documentation**: Update user-facing documentation
4. **Staging Deployment**: Deploy to staging environment
5. **Production Deployment**: Roll out to production (with feature flag if needed)

---

## Support

If you encounter any issues:

1. Check the implementation summary: `PEP_CONFIGURATION_IMPLEMENTATION_SUMMARY.md`
2. Review backend logs in `cc-pap-api/logs/`
3. Check browser console for frontend errors
4. Review network tab for API call failures

---

**Last Updated**: November 1, 2025  
**Implementation Version**: 1.0.0

