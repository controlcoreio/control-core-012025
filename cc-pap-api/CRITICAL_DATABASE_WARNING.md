# ⚠️ CRITICAL DATABASE WARNING

## CC_DROP_TABLES Environment Variable

### THE PROBLEM THAT KEEPS HAPPENING

**Every time `CC_DROP_TABLES=true`, the database is completely wiped:**
- All users deleted
- All password changes lost
- All policies deleted
- All configuration lost
- **System becomes unusable**

### WHY THIS IS CRITICAL IN PRODUCTION

Setting `CC_DROP_TABLES=true` in production means:
1. Every container restart = data loss
2. Every deployment = all customers lose access
3. Every scale event = complete system reset
4. **COMPLETE SERVICE OUTAGE**

### THE RULE

```
CC_DROP_TABLES=false  ← ALWAYS in development and production
CC_DROP_TABLES=true   ← ONLY for initial setup, then immediately change to false
```

### Development Workflow

#### Initial Setup (ONCE)
```yaml
environment:
  - CC_DROP_TABLES=true  # Only for initial database creation
```

Run once, then immediately change to:

#### Normal Development (ALWAYS)
```yaml
environment:
  - CC_DROP_TABLES=false  # Preserves data across restarts
```

### Production Deployment

**MANDATORY CHECK before deployment:**

```bash
# Check the environment configuration
grep CC_DROP_TABLES docker-compose.yml
grep CC_DROP_TABLES controlcore-local-dev.yml
grep CC_DROP_TABLES Dockerfile

# Must ALL say: CC_DROP_TABLES=false
```

If ANY say `CC_DROP_TABLES=true`:
1. ❌ DO NOT DEPLOY
2. Change to `false`
3. Redeploy

### What Happens When Set Wrong

```
CC_DROP_TABLES=true
   ↓
Container restarts
   ↓
Database tables dropped
   ↓
All data deleted
   ↓
Admin user recreated with default password
   ↓
All customer password changes LOST
   ↓
Everyone locked out
   ↓
PRODUCTION OUTAGE
```

### Pre-Deployment Checklist

Before EVERY deployment:

- [ ] Check `CC_DROP_TABLES=false` in all configs
- [ ] Run `./pre_deploy_check.sh`
- [ ] Test login with changed password (not default)
- [ ] Verify data persists after restart

### How To Check Current Setting

```bash
# Check environment variable in running container
docker exec cc-pap-api printenv CC_DROP_TABLES

# Expected: false
# If true: IMMEDIATE FIX REQUIRED
```

### Emergency Fix If Set Wrong

```bash
# 1. Stop the container IMMEDIATELY
docker stop cc-pap-api

# 2. Update the environment variable
# Edit docker-compose.yml or controlcore-local-dev.yml
# Change: CC_DROP_TABLES=true
# To:     CC_DROP_TABLES=false

# 3. If data was lost, restore from backup
docker exec -i cc-db psql -U postgres control_core_db < backup.sql

# 4. Restart with correct setting
docker compose up -d cc-pap-api
```

### Automated Protection

The `pre_deploy_check.sh` script now checks this:

```bash
#!/bin/bash
if [ "$CC_DROP_TABLES" == "true" ]; then
    echo "❌ ERROR: CC_DROP_TABLES=true in production!"
    echo "This will delete all customer data!"
    exit 1
fi
```

### Summary

**CC_DROP_TABLES=true = DATA LOSS**

Set it to `false` after initial setup and NEVER change it back.

If you need to reset the database:
1. Backup first
2. Temporarily set to true
3. Restart once
4. Immediately set back to false
5. Verify data persistence

**This is the most critical configuration setting in Control Core.**

