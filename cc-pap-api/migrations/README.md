# Database Migrations for Control Core PAP API

## ⚠️ CRITICAL: Production Database Schema Management

**Schema mismatches cause production login failures and data corruption.**

This directory contains database migration scripts to safely update the database schema without data loss.

## Migration Strategy

### Development
- Database can be reset: Set `CC_DROP_TABLES=true` in environment
- Fresh start: Drop and recreate all tables

### Production
- **NEVER** use `CC_DROP_TABLES=true` - this deletes all customer data!
- **ALWAYS** use migrations to modify schema
- **ALWAYS** test migrations on staging first

## Running Migrations

### 1. Check Current Schema
Before any deployment, validate schema matches models:

```bash
python check_db_schema.py
```

If validation fails, **DO NOT DEPLOY** until fixed.

### 2. Create New Migration
When you modify models (add/remove columns):

```bash
# 1. Create migration file
cp migrations/migration_template.py migrations/YYYY_MM_DD_description.py

# 2. Edit the migration to add your schema changes
# 3. Test on dev database first
python migrations/YYYY_MM_DD_description.py

# 4. Commit migration to git
git add migrations/YYYY_MM_DD_description.py
git commit -m "feat: add migration for [description]"
```

### 3. Apply Migration in Production

```bash
# Always backup first!
docker exec cc-db pg_dump -U postgres control_core_db > backup_$(date +%Y%m%d).sql

# Run migration
docker exec cc-pap-api python migrations/YYYY_MM_DD_description.py

# Verify schema
docker exec cc-pap-api python check_db_schema.py
```

## Available Migrations

- `add_settings_and_policy_fields.py` - Adds GitHub/OPAL config tables and policy fields
- `add_auto_discovery_fields.py` - Adds auto-discovery fields to PEPs and Resources

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Run `python check_db_schema.py` - must pass
- [ ] Test all migrations on staging environment
- [ ] Backup production database
- [ ] Have rollback plan ready
- [ ] Test login after migration
- [ ] Monitor error logs for 24 hours

## Emergency Rollback

If a migration causes issues:

```bash
# Restore from backup
docker exec -i cc-db psql -U postgres control_core_db < backup_YYYYMMDD.sql

# Restart API
docker restart cc-pap-api
```

## Schema Validation in CI/CD

Add this to your CI/CD pipeline:

```yaml
- name: Validate Database Schema
  run: |
    python check_db_schema.py
    if [ $? -ne 0 ]; then
      echo "Schema validation failed!"
      exit 1
    fi
```

## Common Issues

### Issue: "column X does not exist"
**Cause**: Model was updated but database wasn't migrated
**Fix**: Create and run migration to add the column

### Issue: Login fails with schema errors
**Cause**: User model changed but users table wasn't updated
**Fix**: 
1. In dev: Set `CC_DROP_TABLES=true` and restart
2. In prod: Create migration to add missing columns

### Issue: Foreign key constraint errors
**Cause**: Table dependencies prevent dropping
**Fix**: Migrations handle this automatically with CASCADE

## Model Change Workflow

When you modify a model (e.g., add a column to User):

1. **Update the model** in `app/models.py`
2. **Create migration** for the change
3. **Test locally** with fresh database
4. **Validate schema** with `check_db_schema.py`
5. **Test on staging** environment
6. **Apply to production** with backup
7. **Verify** login and all features work

## Never Do This in Production

❌ Set `CC_DROP_TABLES=true` - deletes all data!
❌ Manually ALTER tables without migration scripts  
❌ Deploy model changes without corresponding migrations
❌ Skip schema validation before deployment

## Always Do This

✅ Run `check_db_schema.py` before every deployment
✅ Create migration scripts for schema changes
✅ Test migrations on staging first
✅ Backup database before migrations
✅ Monitor after deployment

