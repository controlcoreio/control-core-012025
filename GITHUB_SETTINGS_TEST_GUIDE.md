# GitHub Settings - Quick Testing Guide

## ✅ Fix Complete - What Was Changed

### Backend Changes (cc-pap-api/app/routers/settings.py)
Added three new endpoints to match what the frontend expects:
1. `GET /settings/github-config` - Load saved settings
2. `PUT /settings/github-config` - Save settings to database
3. `POST /settings/github-config/test` - Test GitHub connection

### What This Fixes
- ✅ **404 Error**: Endpoints now exist and match frontend calls
- ✅ **Persistence**: Settings save to PostgreSQL database, survive restarts
- ✅ **Connection Testing**: Can verify GitHub credentials before saving

## 🧪 How to Test

### Step 1: Verify Backend is Running
```bash
curl http://localhost:8000/docs
```
Should return the FastAPI documentation page (or at least not fail).

### Step 2: Test in Browser

1. **Navigate to Settings**
   - Go to: `http://localhost:3000/settings/controls-repository`
   - Login if prompted

2. **Configure GitHub Connection**
   - **Repository URL**: `https://github.com/YOUR_ORG/YOUR_REPO`
   - **Branch**: `main` (or your default branch)
   - **Access Token**: Your GitHub Personal Access Token
     - Generate at: https://github.com/settings/tokens
     - Required scopes: `repo` (full control)
   - **Auto Sync**: Enable/Disable as desired
   - **Sync Interval**: 5 minutes (default)

3. **Test Connection**
   - Click "Test Connection" button
   - Should see: ✅ "Connection Successful" toast
   - Should show repository details:
     - Repository name
     - Branch exists confirmation
     - Your GitHub username
     - Write access confirmation

4. **Save Settings**
   - Click "Save Settings" button
   - Should see: ✅ "Settings Saved" toast

5. **Verify Persistence**
   - Refresh the page
   - Settings should still be there (repo URL, branch, status)
   - Access token will show as `***` for security

6. **Test Restart Persistence**
   - Stop the backend: `lsof -ti:8000 | xargs kill -9`
   - Start the backend: 
     ```bash
     cd cc-pap-api
     source venv/bin/activate
     uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
     ```
   - Refresh the frontend page
   - Settings should STILL be there ✅

## 🔍 Expected Behavior

### Before Fix
- ❌ 404 error in console: `POST http://localhost:8000/settings/github-config/test 404 (Not Found)`
- ❌ Settings lost after page refresh
- ❌ Settings lost after server restart
- ❌ Cannot test connection

### After Fix
- ✅ No 404 errors
- ✅ Settings persist after page refresh
- ✅ Settings persist after server restart
- ✅ Connection test works and shows detailed info
- ✅ Audit log entries created for configuration changes

## 🐛 Troubleshooting

### Issue: "Backend is not responding"
**Solution**: Start the backend server:
```bash
cd cc-pap-api
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: "Not authenticated"
**Solution**: Login to the frontend first at `http://localhost:3000/login`

### Issue: "Connection Failed" with valid token
**Possible Causes**:
- Token expired or revoked
- Token doesn't have `repo` scope
- Repository URL format incorrect (should be `https://github.com/owner/repo`)
- Repository is private and token doesn't have access
- Branch name doesn't exist

### Issue: Settings not persisting
**Check**:
1. Database is running: `psql -h localhost -U postgres -d control_core_db -c "\dt github_configuration"`
2. Backend logs for errors: `tail -f cc-logs/pap-api.log`
3. Browser console for errors

## 📊 Database Verification

### Check if settings are in database:
```bash
cd cc-pap-api
source venv/bin/activate
python3 << EOF
from app.database import SessionLocal
from app.models import GitHubConfiguration

db = SessionLocal()
config = db.query(GitHubConfiguration).first()
if config:
    print(f"✅ Settings found in database:")
    print(f"   Repo: {config.repo_url}")
    print(f"   Branch: {config.branch}")
    print(f"   Status: {config.connection_status}")
    print(f"   Auto-sync: {config.auto_sync}")
    print(f"   Last updated: {config.updated_at}")
else:
    print("❌ No settings in database yet")
db.close()
EOF
```

## 📝 API Endpoints Reference

### GET /settings/github-config
**Purpose**: Load saved GitHub configuration

**Response**:
```json
{
  "configured": true,
  "repo_url": "https://github.com/owner/repo",
  "branch": "main",
  "auto_sync": true,
  "sync_interval": 5,
  "connection_status": "connected",
  "last_sync_time": "2025-01-29T12:00:00",
  "webhook_url": null,
  "access_token": "***",
  "webhook_secret": "***"
}
```

### PUT /settings/github-config
**Purpose**: Save GitHub configuration to database

**Request Body**:
```json
{
  "repo_url": "https://github.com/owner/repo",
  "branch": "main",
  "access_token": "ghp_xxxxxxxxxxxx",
  "auto_sync": true,
  "sync_interval": 5,
  "webhook_url": null,
  "webhook_secret": null,
  "connection_status": "connected"
}
```

**Response**:
```json
{
  "success": true,
  "message": "GitHub configuration saved successfully",
  "repo_url": "https://github.com/owner/repo",
  "branch": "main",
  "connection_status": "connected",
  "persisted": true
}
```

### POST /settings/github-config/test
**Purpose**: Test GitHub connection before saving

**Request Body**:
```json
{
  "repo_url": "https://github.com/owner/repo",
  "branch": "main",
  "access_token": "ghp_xxxxxxxxxxxx"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully connected to owner/repo",
  "details": {
    "repo_name": "owner/repo",
    "repo_private": false,
    "branch_exists": true,
    "branch_name": "main",
    "authenticated_user": "username",
    "has_write_access": true
  }
}
```

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ No 404 errors in browser console
2. ✅ "Test Connection" button works and shows success
3. ✅ Settings save successfully
4. ✅ Settings persist after page refresh
5. ✅ Settings persist after server restart
6. ✅ Connection status badge shows "Connected" (green)
7. ✅ Database query shows saved configuration

---
**Status**: Ready for Testing
**Date**: January 29, 2025

