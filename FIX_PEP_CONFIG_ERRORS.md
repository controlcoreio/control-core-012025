# Fix: PEP Configuration Page Errors

## ✅ Status: RESOLVED

The database migration has been successfully executed! The PEP configuration tables are now created with all sidecar-specific fields.

## Problem (Resolved)
The `/settings/peps` page was showing CORS errors and 500 Internal Server Errors because the database tables for the new configuration fields hadn't been created yet.

## Quick Fix

### Step 1: Run the Database Migration

```bash
# Navigate to the backend directory
cd cc-pap-api

# Make the migration script executable (Linux/Mac only)
chmod +x run_migration.sh

# Run the migration
./run_migration.sh

# Or run directly with alembic:
alembic upgrade head
```

### Step 2: Restart the Backend Server

```bash
# Stop the current server (Ctrl+C if running)

# Start the server again
uvicorn app.main:app --reload --port 8000
```

### Step 3: Refresh the Frontend

- Reload the browser page at `http://localhost:5173/settings/peps`
- The errors should be gone
- You should now see the configuration page loading properly

---

## What the Migration Does

The migration creates the necessary database tables and columns:

**global_pep_config table - New columns:**
- `default_sidecar_port` - Default port for sidecar bouncers
- `sidecar_injection_mode` - How sidecars are injected (automatic/manual)
- `sidecar_namespace_selector` - K8s namespace selector
- `sidecar_resource_limits_cpu` - CPU limit for sidecars
- `sidecar_resource_limits_memory` - Memory limit for sidecars
- `sidecar_init_container_enabled` - Enable init container

**individual_pep_config table - New columns:**
- `sidecar_port_override` - Override global sidecar port
- `sidecar_traffic_mode` - Traffic interception mode
- `sidecar_resource_cpu_override` - Override CPU limit
- `sidecar_resource_memory_override` - Override memory limit

---

## Alternative: Automatic Table Creation

If you don't want to run migrations manually, the backend will now automatically create the tables on first access. Just:

1. Restart the backend server
2. Refresh the frontend page
3. The tables will be created automatically when you access `/settings/peps`

---

## Verification

After running the migration, verify it worked:

```bash
# Check the migration status
cd cc-pap-api
alembic current

# Should show: add_sidecar_global_config (head)
```

Or check the database directly:

```sql
-- For SQLite
sqlite3 control_core.db

-- Check tables
.tables

-- Should see: global_pep_config, individual_pep_config

-- Check columns in global_pep_config
PRAGMA table_info(global_pep_config);

-- Should see the new sidecar columns
```

---

## Still Having Issues?

### Issue: Migration file not found

**Solution:**
```bash
# Check if migration file exists
ls -la cc-pap-api/alembic/versions/add_sidecar_global_config.py

# If missing, the file should be at:
# cc-pap-api/alembic/versions/add_sidecar_global_config.py
```

### Issue: CORS errors persist

**Solution:**
The backend CORS is configured to allow all origins (`allow_origins=["*"]`), so CORS errors should not occur. If they persist:

1. Check that the backend is running on port 8000
2. Check browser DevTools → Network tab for the actual error
3. Try clearing browser cache
4. Restart both frontend and backend

### Issue: 500 errors persist

**Solution:**
1. Check backend logs for specific error messages
2. Verify the migration completed successfully
3. Try accessing the endpoint directly:
   ```bash
   curl -X GET http://localhost:8000/pep-config/global \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```
4. Check that you're logged in (valid access token)

---

## Expected Behavior After Fix

Once the migration is run and servers restarted:

✅ No CORS errors in console  
✅ No 500 errors when loading `/settings/peps`  
✅ Global configuration loads from backend  
✅ You see configuration sections based on deployed bouncer types  
✅ All fields are editable  
✅ Save operations succeed  

---

## Need More Help?

1. Check the setup guide: `SETUP_PEP_CONFIG_ENHANCEMENT.md`
2. Review implementation summary: `PEP_CONFIGURATION_IMPLEMENTATION_SUMMARY.md`
3. Check field reference: `PEP_CONFIG_FIELD_REFERENCE.md`
4. Look at backend logs in `cc-pap-api/` directory

---

**Last Updated**: November 1, 2025

