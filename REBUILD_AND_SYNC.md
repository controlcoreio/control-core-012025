# Control Core - Rebuild and Sync Guide

**Date**: October 24, 2025  
**Purpose**: Comprehensive guide for rebuilding essential containers and syncing changes to GitHub

---

## 📋 Step 1: Clean Up Docker Environment

### Stop All Control Core Containers
```bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-infra
docker compose -f controlcore-local-dev.yml down
```

### Remove All Control Core Images (Optional - for clean rebuild)
```bash
# List Control Core images
docker images | grep -E "cc-pap|cc-bouncer|cc-opal"

# Remove them (WARNING: requires rebuild)
docker compose -f controlcore-local-dev.yml down --rmi all

# OR remove volumes too (WARNING: deletes database data)
docker compose -f controlcore-local-dev.yml down -v --rmi all
```

### Clean Docker System (Optional)
```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove volumes (WARNING: deletes all Docker volumes)
docker volume prune
```

---

## 🔨 Step 2: Rebuild Essential Containers

### Essential Services to Rebuild

1. **cc-db** (PostgreSQL)
2. **cc-redis** (Redis for caching)
3. **cc-pap-api** (Backend API)
4. **cc-pap** (Frontend)
5. **cc-bouncer** (Policy Enforcement Point)
6. **cc-opal-server** & **cc-opal-client** (Policy distribution)

### Rebuild Sequence

```bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-infra

# Step 1: Build all images
docker compose -f controlcore-local-dev.yml build --no-cache

# Step 2: Start database and redis first
docker compose -f controlcore-local-dev.yml up -d cc-db cc-redis

# Step 3: Wait for database to be ready (10-15 seconds)
sleep 15

# Step 4: Start backend API
docker compose -f controlcore-local-dev.yml up -d cc-pap-api

# Step 5: Wait for API to load templates (10-15 seconds)
sleep 15

# Step 6: Start frontend
docker compose -f controlcore-local-dev.yml up -d cc-pap

# Step 7: Start bouncer and OPAL
docker compose -f controlcore-local-dev.yml up -d cc-bouncer cc-opal-server cc-opal-client

# Step 8: Check all services are healthy
docker compose -f controlcore-local-dev.yml ps
```

### Alternative: One-Command Rebuild
```bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-infra

# Full rebuild and start
docker compose -f controlcore-local-dev.yml up -d --build
```

---

## ✅ Step 3: Verify Services

### Check Container Status
```bash
docker compose -f controlcore-local-dev.yml ps

# Expected output:
# cc-db          healthy
# cc-redis       healthy
# cc-pap-api     healthy
# cc-pap         healthy
# cc-bouncer     healthy
```

### Test Backend API
```bash
# Health check
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# Check templates loaded
curl http://localhost:8000/policies/templates/ | jq 'length'
# Expected: ~180

# Check SSO status endpoint
curl http://localhost:8000/auth/sso/status
# Expected: {"enabled":false,"provider":null,"configured":false,...}
```

### Test Frontend
```bash
# Open browser
open http://localhost:5173/login

# Or curl
curl -I http://localhost:5173
# Expected: HTTP/1.1 200 OK
```

### Check Logs for Errors
```bash
# Check API logs for template loading
docker logs cc-pap-api --tail 50 | grep -i "template"

# Check for any errors
docker logs cc-pap-api --tail 100 | grep -i "error"
```

---

## 🔄 Step 4: Sync Changes to GitHub

### Check Git Status
```bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025
git status
```

### Stage Changes

#### Modified Files to Stage
Based on recent work, these files have significant updates:

```bash
# Core API and template changes
git add cc-pap-api/app/routers/auth.py
git add cc-pap-api/app/routers/pip.py
git add cc-pap-api/app/routers/opal_data.py
git add cc-pap-api/app/services/pip_connector_service.py
git add cc-pap-api/app/services/pip_cache_service.py
git add cc-pap-api/init_db.py
git add cc-pap-api/load_policy_templates.py
git add cc-pap-api/Dockerfile

# Frontend changes
git add cc-pap/src/components/onboarding/GettingStartedWizard.tsx
git add cc-pap/src/components/onboarding/wizard-steps/SelfHostedDownloadStep.tsx
git add cc-pap/src/components/pips/AddInformationSourceWizard.tsx
git add cc-pap/src/components/editor/MonacoRegoEditor.tsx
git add cc-pap/src/components/builder/ConditionRuleBlock.tsx

# Policy templates (all 180 templates with updated metadata)
git add cc-pap-core/policy-templates/

# Infrastructure
git add cc-infra/controlcore-local-dev.yml

# Documentation
git add README.md
git add REBUILD_AND_SYNC.md
```

### Commit Changes

```bash
# Commit with comprehensive message
git commit -m "feat: comprehensive Control Core updates

- Updated README with full repository documentation
- Fixed 180 policy templates with contextual examples
- Updated 30 compliance templates with region-specific use cases
- Added 15 Canadian financial regulation templates
- Implemented PIP data source integration with Redis caching
- Fixed SSO endpoint connection issues
- Removed OPAL duplication and cleaned up architecture
- Updated Getting Started wizard and policy builder
- Added Monaco Editor IntelliSense for PIP attributes
- Fixed condition example values across all templates

Changes impact: cc-pap, cc-pap-api, cc-pap-core, cc-infra
Components: Frontend, Backend API, Policy Templates, Infrastructure
"
```

### Push to Dev Branch
```bash
# Switch to dev branch
git checkout dev

# Pull latest changes first
git pull origin dev

# Push changes
git push origin dev
```

### Merge Dev to Master (After Testing)
```bash
# Switch to master
git checkout master

# Pull latest
git pull origin master

# Merge dev into master
git merge dev

# Push to master
git push origin master
```

---

## 🔄 Step 5: Sync Changes to cc-pap-pro-tenant

### Changes to Apply to cc-pap-pro-tenant

The following frontend changes from `cc-pap` should be synced to `cc-pap-pro-tenant`:

#### 1. **Getting Started Wizard Updates**
Files to copy/sync:
- `cc-pap/src/components/onboarding/GettingStartedWizard.tsx`
- `cc-pap/src/components/onboarding/wizard-steps/SelfHostedDownloadStep.tsx`
- Remove: `cc-pap/src/components/onboarding/wizard-steps/PolicyGenerationStep.tsx` (if exists)

Changes:
- Removed duplicate Step 6 (Generate Custom Policy)
- Updated demo app descriptions to be more generic
- Fixed step flow and navigation

#### 2. **PIP Data Source Configuration**
Files to copy/sync:
- `cc-pap/src/components/pips/AddInformationSourceWizard.tsx`
- `cc-pap/src/components/pips/auth/APIKeyFields.tsx`
- `cc-pap/src/components/pips/auth/BasicAuthFields.tsx`
- `cc-pap/src/components/pips/auth/OAuthFields.tsx`

Changes:
- Added Bearer Token authentication method
- Context-specific field labels
- Schema discovery integration
- Attribute mapping enhancements

#### 3. **Policy Builder Enhancements**
Files to copy/sync:
- `cc-pap/src/components/builder/ConditionRuleBlock.tsx`
- `cc-pap/src/hooks/use-pip-attributes.ts` (NEW FILE)

Changes:
- PIP attributes dynamically loaded in policy builder
- Categorized attribute display
- Tooltips for PIP data sources

#### 4. **Monaco Editor Integration**
Files to copy/sync:
- `cc-pap/src/components/editor/MonacoRegoEditor.tsx`

Changes:
- IntelliSense for PIP attributes
- Hover documentation for attributes
- Dynamic completion provider

### Sync Process

```bash
# Navigate to cc-pap-pro-tenant
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-pap-pro-tenant

# Copy updated files from cc-pap
cp -r ../cc-pap/src/components/onboarding/ ./src/components/onboarding/
cp -r ../cc-pap/src/components/pips/ ./src/components/pips/
cp ../cc-pap/src/components/builder/ConditionRuleBlock.tsx ./src/components/builder/
cp ../cc-pap/src/components/editor/MonacoRegoEditor.tsx ./src/components/editor/
cp ../cc-pap/src/hooks/use-pip-attributes.ts ./src/hooks/

# Test the build
npm run build

# Commit changes
git add .
git commit -m "sync: apply cc-pap updates to pro-tenant

- Updated Getting Started wizard
- Enhanced PIP data source configuration
- Improved policy builder with PIP attributes
- Added Monaco Editor IntelliSense
"

# Push to repository
git push origin dev  # or master, depending on workflow
```

---

## 📊 Post-Deployment Checklist

### Functional Testing

- [ ] Login with `ccadmin` / `SecurePass2025!`
- [ ] Navigate to Getting Started wizard
- [ ] Create a new policy from template
- [ ] Test PIP data source configuration
- [ ] Test policy builder with conditions
- [ ] Test Monaco Editor with IntelliSense
- [ ] Verify policy templates load (should show ~180)
- [ ] Check "More Details" on templates shows content
- [ ] Test policy deployment to bouncer

### Performance Testing

- [ ] Policy evaluation time < 100ms
- [ ] Template loading time < 5 seconds
- [ ] API response time < 50ms
- [ ] Frontend page load < 2 seconds

### Security Testing

- [ ] Session management working
- [ ] JWT tokens valid
- [ ] Password change persists across restarts
- [ ] API authentication required
- [ ] Audit logs capturing events

---

## 🐛 Troubleshooting

### Issue: Templates Not Loading

**Symptom**: Only 3 templates or no templates visible

**Solution**:
```bash
# Check if templates directory is mounted correctly
docker exec cc-pap-api ls -la /home/cc-pap-core/policy-templates/compliance

# Check logs for template loading
docker logs cc-pap-api | grep "template"

# Force reload by restarting API
docker restart cc-pap-api
docker logs -f cc-pap-api
```

### Issue: Port Conflicts

**Symptom**: `ERR_CONNECTION_RESET` or container fails to start

**Solution**:
```bash
# Check for processes on key ports
lsof -i :8000
lsof -i :5173
lsof -i :5432
lsof -i :6379

# Kill conflicting processes
kill -9 <PID>

# Restart containers
docker compose -f controlcore-local-dev.yml restart
```

### Issue: Database Connection Failed

**Symptom**: API logs show database connection errors

**Solution**:
```bash
# Check database is healthy
docker exec cc-db pg_isready -U ccuser

# Restart database
docker restart cc-db

# Wait and restart API
sleep 10
docker restart cc-pap-api
```

### Issue: Redis Connection Failed

**Symptom**: PIP caching not working

**Solution**:
```bash
# Check Redis
docker exec cc-redis redis-cli ping
# Expected: PONG

# Restart Redis
docker restart cc-redis
docker restart cc-pap-api
```

---

## 🎯 Success Criteria

After completing this rebuild and sync:

✅ All essential containers running and healthy  
✅ 180+ policy templates loaded with rich metadata  
✅ 1,103 condition examples populated  
✅ Frontend accessible at http://localhost:5173  
✅ Backend API responding at http://localhost:8000  
✅ No port conflicts or connection errors  
✅ Changes committed to Git (dev branch)  
✅ Changes synced to cc-pap-pro-tenant  
✅ All features working: login, policy creation, templates, PIP config  

---

## 📞 Support

If you encounter issues:

1. Check container logs: `docker logs <container-name>`
2. Review this troubleshooting section
3. Check GitHub Issues
4. Contact support@controlcore.ai (Pro/Custom plans)

---

**Control Core** - Rebuild Complete! 🚀

