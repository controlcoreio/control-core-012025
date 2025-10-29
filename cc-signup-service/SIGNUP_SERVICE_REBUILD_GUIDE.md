# Signup Service - Why Changes Aren't Showing & How to Fix

## 🔍 **Problem**

You've made changes to the signup service frontend React components, but they're **not showing** when you access http://localhost:8002.

## 📌 **Root Cause**

The signup service architecture works like this:

```
run_on_8002.py (Python/FastAPI)
    ↓
Serves STATIC files from: app/static/
    ↓
app/static/ = OUTPUT of frontend build
    ↓
Frontend source code is in: frontend/src/
```

**The Issue**: 
- You modified `frontend/src/components/UnifiedBouncerDownload.tsx`
- But `run_on_8002.py` serves files from `app/static/`
- The static files are **outdated** (built before your changes)
- React changes don't auto-update - they need to be **rebuilt**

## ✅ **Solution: Rebuild Frontend**

### Option 1: Use the Automated Script (EASIEST)

```bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-signup-service
./rebuild-and-restart.sh
```

This script:
- ✅ Kills any process on port 8002
- ✅ Rebuilds frontend (`npm run build`)
- ✅ Activates Python venv
- ✅ Installs dependencies
- ✅ Starts the service

### Option 2: Manual Steps

```bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-signup-service

# Step 1: Kill port 8002
lsof -ti:8002 | xargs kill -9

# Step 2: Build frontend
cd frontend
npm run build
# This builds React app → outputs to ../app/static/

# Step 3: Go back and start service
cd ..
source venv/bin/activate
python run_on_8002.py
```

### Option 3: Development Mode (Auto-Reload)

If you're still making changes and want auto-reload:

**Terminal 1** (Frontend dev server):
```bash
cd cc-signup-service/frontend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2** (Backend API):
```bash
cd cc-signup-service
source venv/bin/activate
python run_on_8002.py
# Runs on http://localhost:8002
```

Then access frontend at http://localhost:3000 (auto-reloads on changes)

## 🎯 **What Changes Will Show After Rebuild**

### 1. Signup Form
- ✅ **Job Title** field (instead of duplicate email)
- ✅ "Business Email (will be verified)" label
- ✅ Fixed favicon (no flash)

### 2. Bouncer Downloads Page
- ✅ **3 bouncer types only** (Sidecar, Reverse Proxy, MCP)
- ✅ **Sidecar marked as Recommended** (green badge)
- ✅ **Info buttons** (?) on each card
- ✅ **Info modals** with examples and use cases
- ✅ **Deployment + Troubleshooting links**
- ✅ **Dual environment education** (green/red boxes)
- ✅ **Version 042025** (not v2.1.0)

## 🔄 **Development Workflow**

### For Active Development (Making Changes)
Use dev mode with auto-reload:
```bash
cd frontend
npm run dev  # Frontend on :3000 with hot-reload
```

### For Testing/Production (Finalized Changes)
Build and serve:
```bash
npm run build  # Builds to ../app/static/
cd ..
python run_on_8002.py  # Serves built files
```

## 🚨 **Common Issues**

### Issue 1: "Port 8002 already in use"
**Solution**:
```bash
lsof -ti:8002 | xargs kill -9
```

### Issue 2: "ModuleNotFoundError: No module named 'fastapi'"
**Solution**: Activate venv first:
```bash
source venv/bin/activate
python run_on_8002.py
```

### Issue 3: Changes still not showing after build
**Solutions**:
1. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Clear browser cache
3. Open in incognito/private window
4. Check console for errors
5. Verify build completed without errors

### Issue 4: Frontend build fails
**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📋 **Quick Checklist**

Before expecting to see changes:
- [ ] Modified source files in `frontend/src/`
- [ ] Ran `npm run build` in `frontend/` directory
- [ ] Build completed without errors
- [ ] Killed any process on port 8002
- [ ] Started `run_on_8002.py` with venv activated
- [ ] Hard refreshed browser (Cmd+Shift+R)
- [ ] Checked for console errors

## 🎉 **Expected Result**

After rebuild and restart, visiting http://localhost:8002 should show:

**Signup Form**:
- Full Name
- **Job Title** ← NEW!
- Company Name
- **Business Email (will be verified)** ← UPDATED!

**Downloads Section** (if accessible):
- **3 bouncer cards** (not 5)
- **Sidecar** with green "Recommended" badge
- **MCP** with blue "New" badge
- **(?)** info buttons on each card
- **Deployment Guide** and **Troubleshooting** links at top
- **Dual environment** blue box with green/red cards

## 🔧 **Recommended: Use the Automated Script**

```bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-signup-service
./rebuild-and-restart.sh
```

This handles everything automatically!

## ⏱️ **Build Time**

- Frontend build: ~10-30 seconds
- Backend startup: ~2-5 seconds
- **Total**: Under 1 minute

---

**After running the script or manual rebuild, all your changes will be visible!** 🚀

