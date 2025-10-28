# Remove Mock PEP Data from Control Core

This guide explains how to remove the mock/example bouncer (PEP) data from the Control Core database.

## What Was Changed

### 1. **Database Initialization (`init_db.py`)**
   - Removed 3 mock PEP instances:
     - "Production API Bouncer" (12 resources, 2847 req/hr)
     - "AI Agent Bouncer" (3 resources, 156 req/hr)  
     - "Banking App Sidecar Bouncer" (8 resources, 0 req/hr)
   - **Total removed:** 23 resources protected, 3003 requests/hour

### 2. **Frontend (`PEPManagementPage.tsx`)**
   - Removed hardcoded "98%" health score
   - Health score now calculated from actual data
   - Added onboarding screen when no bouncers are deployed
   - All stats now use real data from backend API

## How to Remove Existing Mock Data

You have **two options** to remove the mock PEP data from your database:

### Option 1: Quick Cleanup (Recommended)
This removes only the PEP data without affecting other data (users, policies, etc.)

```bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-pap-api

# Activate virtual environment if needed
source venv/bin/activate

# Run the cleanup script
python remove_mock_peps.py
```

### Option 2: Full Database Reset
This will reset the entire database (use with caution!)

```bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-pap-api

# Activate virtual environment if needed
source venv/bin/activate

# Reset database (will prompt for admin credentials)
python init_db.py
```

## After Cleanup

1. **Restart the API server** (if it's running):
   ```bash
   # Stop the current server (Ctrl+C) and restart:
   uvicorn app.main:app --reload --port 8000
   ```

2. **Refresh the frontend** in your browser:
   - Navigate to http://localhost:5173/settings/peps
   - You should now see the onboarding screen with:
     ✓ Welcome message
     ✓ Deployment mode selection (Reverse Proxy vs Sidecar)
     ✓ Step-by-step guide
     ✓ Link to Download Center

## What Happens Next

When users visit `/settings/peps`:
- **Before bouncer deployment:** Shows onboarding guide
- **After deployment:** Shows actual bouncer stats and metrics
- **All data is real:** No more mock/fake data

## Files Modified

1. `/cc-pap-api/init_db.py` - Removed mock PEP creation
2. `/cc-pap/src/components/settings/pep/PEPManagementPage.tsx` - Added onboarding & removed hardcoded values
3. `/cc-pap-api/remove_mock_peps.py` - New cleanup script

## Verification

After cleanup, verify by checking:
1. Navigate to http://localhost:5173/settings/peps
2. You should see **0 Active Bouncers**
3. You should see the **Welcome to Control Core!** onboarding screen
4. Stats should show **0 resources protected, 0 requests/hour**

## Questions?

If you encounter any issues:
1. Check that the database is running
2. Verify API server is connected to the database
3. Check browser console for any errors
4. Ensure you're logged in with valid credentials

