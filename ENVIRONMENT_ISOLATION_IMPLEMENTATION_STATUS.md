# Environment Isolation Implementation Status

## Completed Tasks ✅

### 1. Data Sources (PIP) Environment Isolation
**Backend Changes:**
- ✅ Updated `PIPConnection` model in `app/models.py`:
  - Changed `environment` from `default="both"` to `nullable=False` (required field)
  - Removed support for "both" environment value
  - Only allows "sandbox" or "production"

- ✅ Updated `app/routers/pip.py`:
  - Added `environment` query parameter to `get_pip_connections()`
  - Added validation for environment parameter
  - Filters connections by environment when provided

- ✅ Updated `app/routers/opal.py`:
  - Removed `(PIPConnection.environment == "both")` check
  - Only matches exact environment for bouncer data sources

- ✅ Created migration: `migrations/environment_isolation_pip.py`
  - Duplicates existing "both" connections into separate sandbox and production entries
  - Updates NULL environments to 'sandbox'
  - Makes environment column NOT NULL

**Frontend Changes:**
- ✅ Updated `DataSourcesPage.tsx`:
  - Added `useEnvironment` hook to get current environment from top header
  - Added `EnvironmentBadge` to page header
  - Loads connections filtered by current environment
  - Reloads when environment changes in top header

- ✅ Updated `pipService.ts`:
  - Added `environment` parameter to `getConnections()` method
  - Passes environment filter in API requests
  - Updated `PIPConnectionCreate` interface to require `environment` field

- ✅ Updated `AddInformationSourceWizard.tsx`:
  - Added `environment` prop to interface
  - Auto-sets environment from current environment context
  - No user selection needed - uses top header environment

### 2. Notifications Environment Isolation
**Backend Changes:**
- ✅ Created new models in `app/models.py`:
  - `NotificationSettings`: Environment-specific alert rules and channel configurations
  - `NotificationCredentials`: Shared credentials across environments (Slack, ServiceNow)

- ✅ Created new API router: `app/routers/notifications.py`
  - `GET /v1/notifications/settings?environment=<env>`: Get environment-specific settings
  - `PUT /v1/notifications/settings?environment=<env>`: Update environment-specific settings
  - `GET /v1/notifications/credentials`: Get shared credentials
  - `PUT /v1/notifications/credentials`: Update shared credentials
  - `POST /v1/notifications/test?environment=<env>`: Test notification channel

- ✅ Registered notifications router in `app/main.py`

- ✅ Created migration: `migrations/environment_isolation_notifications.py`
  - Creates `notification_settings` table with environment column
  - Creates `notification_credentials` table for shared credentials
  - Adds indexes for performance

**Frontend Changes (TODO):**
- ⏳ Update `NotificationsPage.tsx` to use environment context
- ⏳ Update `AlertChannelsConfig.tsx` for per-environment channels
- ⏳ Update `GeneralSystemAlerts.tsx` to load/save per environment
- ⏳ Update `CustomAlertRules.tsx` to load/save per environment

### 3. OPAL Settings Restructuring
**Completed:**
- ✅ Removed global OPAL settings page from frontend:
  - Deleted `OPALSettings.tsx` component
  - Removed route from `Index.tsx`
  - Removed settings menu item from `MinimalSettingsPage.tsx`

**Remaining:**
- ⏳ Add per-bouncer OPAL configuration UI
- ⏳ Add API endpoints for bouncer-specific OPAL settings
- ⏳ Create `BouncerOPALConfig.tsx` component
- ⏳ Integrate into `PEPManagementPage.tsx`

### 4. Policy Repository Settings
- ✅ Verified: Already using environment context correctly
- ✅ No information box suggesting separate repos (already clean)
- ✅ Backend supports folder structure (policies/sandbox/ and policies/production/)

## Remaining Work ⏳

### ✅ Completed - High Priority

1. **Notifications Frontend Implementation** ✅
   - Updated `NotificationsPage.tsx`:
     - ✅ Added `useEnvironment` hook
     - ✅ Added environment badge
     - ✅ Loads/saves settings for current environment
     - ✅ Shows indicator that credentials are shared
   
   - Updated child components:
     - ✅ `AlertChannelsConfig.tsx` - environment-aware, info alert for shared credentials
     - ✅ `GeneralSystemAlerts.tsx` - loads/saves per environment via API
     - ✅ `CustomAlertRules.tsx` - environment-aware state management

2. **Per-Bouncer OPAL Configuration** ✅
   - Backend API endpoints in `app/routers/peps.py`:
     - ✅ `GET /peps/{pep_id}/opal-config` - Get bouncer-specific OPAL config
     - ✅ `PUT /peps/{pep_id}/opal-config` - Update bouncer-specific OPAL settings
   
   - Frontend components:
     - ⏳ Create `BouncerOPALConfig.tsx` component (API ready)
     - ⏳ Add OPAL config section to `PEPManagementPage.tsx` (API ready)

3. **Documentation** ✅
   - ✅ Added comprehensive Environment Management section to Admin Guide
   - ✅ Documented dual-environment architecture
   - ✅ Documented environment-specific settings
   - ✅ Documented best practices
   - ✅ All documentation is user-facing (no internal code details)

### Medium Priority

4. **Database Migrations** ⚠️
   - ⚠️ `environment_isolation_pip.py` migration created (requires database initialization)
   - ⚠️ `environment_isolation_notifications.py` migration created (requires database initialization)
   - Note: Migrations are ready but require database tables to be created first via init_db.py

5. **Frontend OPAL UI** ⏳
   - ⏳ Create `BouncerOPALConfig.tsx` component
   - ⏳ Integrate into `PEPManagementPage.tsx`

6. **Testing** ⏳
   - ⏳ Test data sources filtering by environment
   - ⏳ Test environment switching updates data sources
   - ⏳ Test creating data sources auto-sets environment
   - ⏳ Test notification settings per environment
   - ✅ OPAL global page is removed
   - ⏳ Test per-bouncer OPAL config (when UI implemented)

## Architecture Notes

### Data Sources
- Each connection must be environment-specific (sandbox OR production)
- No "both" environment support
- Connections with different endpoints for each environment should be created as separate entries
- Frontend honors top header environment selector (no page-specific filter)

### Notifications
- Alert rules and channel configurations are environment-specific
- Credentials (API keys, tokens) are shared across environments
- Same Slack workspace, different channels per environment
- Frontend honors top header environment selector

### OPAL Configuration
- No global OPAL configuration UI
- OPAL settings are managed per-bouncer
- Control Plane acts as OPAL Server
- Each Bouncer has its own OPAL Client
- Configuration is auto-generated during bouncer deployment
- Per-bouncer tuning available for: cache settings, rate limits, sync frequency

### Environment Context
- All settings pages use `useEnvironment` hook from `EnvironmentContext.tsx`
- Environment selector in top header controls all pages
- Switching environment automatically reloads filtered data
- `EnvironmentBadge` component displays current environment

## Files Modified

### Backend
- `cc-pap-api/app/models.py` - Added notification models, updated PIP model
- `cc-pap-api/app/routers/pip.py` - Added environment filtering
- `cc-pap-api/app/routers/opal.py` - Removed "both" environment support
- `cc-pap-api/app/routers/notifications.py` - Created new router
- `cc-pap-api/app/main.py` - Registered notifications router
- `cc-pap-api/migrations/environment_isolation_pip.py` - Created
- `cc-pap-api/migrations/environment_isolation_notifications.py` - Created

### Frontend
- `cc-pap/src/components/settings/DataSourcesPage.tsx` - Added environment context
- `cc-pap/src/components/pips/AddInformationSourceWizard.tsx` - Auto-set environment
- `cc-pap/src/services/pipService.ts` - Added environment parameter
- `cc-pap/src/components/settings/NotificationsPage.tsx` - Added environment context
- `cc-pap/src/components/settings/notifications/GeneralSystemAlerts.tsx` - Environment-aware with API integration
- `cc-pap/src/components/settings/notifications/CustomAlertRules.tsx` - Environment-aware
- `cc-pap/src/components/settings/notifications/AlertChannelsConfig.tsx` - Environment-aware with shared credentials info
- `cc-pap/src/pages/Index.tsx` - Removed OPAL route
- `cc-pap/src/components/settings/MinimalSettingsPage.tsx` - Removed OPAL menu item
- `cc-pap/src/components/settings/OPALSettings.tsx` - **DELETED**

### Documentation
- `cc-docs/app/guides/admin/page.mdx` - Added comprehensive Environment Management section

## Next Steps

1. Complete notifications frontend implementation
2. Implement per-bouncer OPAL configuration
3. Run database migrations
4. Comprehensive testing
5. Update documentation

## Testing Checklist

### Data Sources
- [ ] Data sources filtered by environment
- [ ] Creating data source sets correct environment
- [ ] Switching environment reloads data sources
- [ ] Environment badge displays correctly
- [ ] No "both" option in wizard

### Notifications (When Implemented)
- [ ] Settings load per environment
- [ ] Switching environment loads different settings
- [ ] Credentials section shows shared message
- [ ] Alert rules persist per environment
- [ ] Channel configurations persist per environment

### OPAL
- [ ] Global OPAL page is removed
- [ ] Settings menu doesn't show OPAL option
- [ ] Route `/settings/opal` returns 404
- [ ] Per-bouncer config accessible (when implemented)

### General
- [ ] Environment switching works smoothly
- [ ] No console errors
- [ ] API calls include environment parameters
- [ ] Audit logs capture environment

