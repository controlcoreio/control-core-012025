# Production Deployment Safety Guidelines

## 🚨 CRITICAL: Preventing Database Schema Issues

**A database schema mismatch can break login and cause production outages.**

This document outlines mandatory checks to prevent production deployment issues.

## The Problem We Solved

### What Happened
- User model in code had `api_key_sandbox` and `api_key_production` columns
- Database schema was from an older version without these columns
- Login failed with "column does not exist" errors
- Production would have been completely broken

### Root Cause
- Code was updated (models changed)
- Database was not migrated to match new schema
- No validation before deployment

## Mandatory Pre-Deployment Checklist

Before deploying to ANY environment (staging or production):

### 1. Database Schema Validation
```bash
cd cc-pap-api
python check_db_schema.py
```

**If this fails, DO NOT DEPLOY!**

### 2. Run Pre-Deployment Check
```bash
cd cc-pap-api
./pre_deploy_check.sh
```

This validates:
- Database schema matches models
- Required environment variables are set
- Database connection works
- Admin credentials are not using defaults

### 3. Test Login Flow
```bash
# Test authentication
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "ccadmin", "password": "YOUR_PASSWORD"}'
```

Expected: 200 OK with access_token
Failure: Schema mismatch, fix before deploying

## Development vs Production

### Development Environment
- Can reset database: `CC_DROP_TABLES=true`
- Schema mismatches are caught early
- Rapid iteration is safe

### Production Environment
- **NEVER** set `CC_DROP_TABLES=true` (deletes all customer data!)
- **ALWAYS** use database migrations
- **ALWAYS** backup before schema changes
- **ALWAYS** test on staging first

## Database Migration Workflow

### When You Change a Model

1. **Update the Model**
   ```python
   # Example: Add new column to User model
   class User(Base):
       # ... existing columns ...
       new_field = Column(String)  # NEW COLUMN
   ```

2. **Create Migration Script**
   ```bash
   cd cc-pap-api/migrations
   cp migration_template.py 2025_10_28_add_new_field.py
   # Edit the migration to add the column
   ```

3. **Test Migration Locally**
   ```bash
   python migrations/2025_10_28_add_new_field.py
   ```

4. **Validate Schema**
   ```bash
   python check_db_schema.py  # Must pass
   ```

5. **Commit Migration**
   ```bash
   git add migrations/2025_10_28_add_new_field.py
   git commit -m "feat: add migration for new_field"
   ```

6. **Deploy to Staging**
   ```bash
   # Backup first!
   docker exec cc-db pg_dump -U postgres control_core_db > backup_staging.sql
   
   # Run migration
   docker exec cc-pap-api python migrations/2025_10_28_add_new_field.py
   
   # Validate
   docker exec cc-pap-api python check_db_schema.py
   ```

7. **Test Staging Thoroughly**
   - Test login
   - Test all features
   - Monitor logs for 24 hours

8. **Deploy to Production**
   ```bash
   # Backup first! (MANDATORY)
   docker exec cc-db pg_dump -U postgres control_core_db > backup_prod_$(date +%Y%m%d).sql
   
   # Apply migration
   docker exec cc-pap-api python migrations/2025_10_28_add_new_field.py
   
   # Validate
   docker exec cc-pap-api python check_db_schema.py
   
   # Restart API
   docker restart cc-pap-api
   
   # Test login immediately
   curl -X POST https://api.controlcore.io/auth/login ...
   ```

## CI/CD Integration

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Validate Database Schema
  run: |
    cd cc-pap-api
    python check_db_schema.py
    if [ $? -ne 0 ]; then
      echo "❌ Schema validation failed - blocking deployment"
      exit 1
    fi

- name: Run Pre-Deployment Checks
  run: |
    cd cc-pap-api
    ./pre_deploy_check.sh
```

## Emergency Rollback Procedure

If deployment causes issues:

```bash
# 1. Stop the API immediately
docker stop cc-pap-api

# 2. Restore database from backup
docker exec -i cc-db psql -U postgres control_core_db < backup_prod_YYYYMMDD.sql

# 3. Revert code to previous version
git revert HEAD
docker restart cc-pap-api

# 4. Verify login works
curl -X POST https://api.controlcore.io/auth/login ...
```

## Start/Stop Script Safeguards

### start-all-services.sh
- Ensures on `dev` branch
- Pulls latest code
- Displays architecture dependencies
- Shows which services affect each other

### stop-all-services.sh  
- Stops all services
- Syncs code to GitHub (dev, master, org)
- Syncs cc-pap-core to cc-pap-pro-tenant
- Ensures no data loss

## Development Best Practices

### ✅ Always Do
- Run `check_db_schema.py` before committing model changes
- Create migration scripts for schema changes
- Test migrations locally first
- Keep `CC_DROP_TABLES=false` in production
- Backup before any schema change
- Document breaking changes in commit messages

### ❌ Never Do
- Set `CC_DROP_TABLES=true` in production (deletes all data!)
- Modify schema directly with SQL in production
- Deploy model changes without migrations
- Skip schema validation
- Deploy without testing login

## Service Dependencies

When changing code, consider impact on related services:

### cc-pap changes might affect:
- cc-pap-api (API calls)
- cc-pap-core (shared components)
- cc-language-server (policy editing)
- cc-docs (documentation)
- cc-infra (deployment configs)

### cc-pap-api changes might affect:
- cc-pap (frontend calls)
- cc-pap-pro-tenant (hosted service)
- cc-bouncer (PEP communication)
- cc-docs (API documentation)

### cc-pap-core changes must sync to:
- cc-pap-pro-tenant (hosted Pro service)
- This is automated in `stop-all-services.sh`

## Monitoring After Deployment

After any schema change deployment:

```bash
# Watch for schema errors
docker logs -f cc-pap-api | grep -i "column.*does not exist\|table.*does not exist"

# Monitor login success rate
curl http://api.controlcore.io/metrics | grep login_success_rate

# Check error rate
curl http://api.controlcore.io/health
```

## Summary

**Schema mismatch = Production outage**

Prevention:
1. ✅ Run `check_db_schema.py` before every deployment
2. ✅ Use migrations for schema changes
3. ✅ Test on staging first
4. ✅ Backup before production changes
5. ✅ Monitor after deployment

**These steps are MANDATORY for production deployments.**

