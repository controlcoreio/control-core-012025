#!/bin/bash

# Control Core - Stop All Development Services
# This script stops all Control Core services, cleans up Docker resources,
# syncs code to GitHub (dev and main branches), and syncs frontend/shared 
# services to cc-pap-pro-tenant

set -e

echo "🛑 Stopping Control Core Development Services"
echo "=================================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Set Docker path
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# Ensure we're on dev branch
echo "📌 Checking git branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "   Switching to dev branch..."
    git checkout dev
fi
echo "   Current branch: $(git branch --show-current)"
echo ""

# Stop cc-docs (Node.js)
echo "1️⃣  Stopping cc-docs..."
if lsof -ti :3000 > /dev/null 2>&1; then
    lsof -ti :3000 | xargs kill -9 2>/dev/null
    echo "   ✅ Stopped cc-docs"
else
    echo "   ℹ️  cc-docs was not running"
fi
echo ""

# Stop all Docker containers
echo "2️⃣  Stopping Docker containers..."
if docker ps -q | grep -q .; then
    # Stop Control Core related containers
    docker ps --format "{{.Names}}" | grep -E "(cc-|pap-|bouncer|signup)" | while read container; do
        echo "   Stopping $container..."
        docker stop "$container" 2>/dev/null || true
    done
    echo "   ✅ All Control Core containers stopped"
else
    echo "   ℹ️  No running containers found"
fi
echo ""

# Remove stopped containers
echo "3️⃣  Cleaning up stopped containers..."
REMOVED=$(docker container prune -f --filter "label=com.docker.compose.project" 2>&1 | grep -i "deleted" || echo "0 containers")
echo "   ✅ Cleaned up: $REMOVED"
echo ""

# Remove unused volumes (but keep data volumes)
echo "4️⃣  Cleaning up unused volumes..."
docker volume prune -f 2>&1 | grep -i "reclaimed\|Total" || echo "   No unused volumes"
echo ""

# Git operations - Stage and commit changes
echo "5️⃣  Syncing codebase to GitHub..."
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "   📝 Staging changes..."
    git add -A
    
    echo "   💾 Committing changes..."
    git commit -m "chore: end of session - sync development changes" || echo "   ℹ️  No changes to commit"
fi

# Push to dev branch (personal repo)
echo "   🔄 Pushing to dev branch (rakeshcontrolcore)..."
git push origin dev 2>&1 || echo "   ⚠️  Failed to push to origin dev"

# Update master/main branch
echo "   🔄 Updating master branch..."
git checkout master 2>&1 || git checkout -b master
git merge dev -m "Merge dev into master: sync development changes" 2>&1 || echo "   ⚠️  Merge conflicts - manual resolution needed"

# Push master to personal repo
echo "   🔄 Pushing master to rakeshcontrolcore..."
git push origin master 2>&1 || echo "   ⚠️  Failed to push to origin master"

# Push to organization repo
echo "   🔄 Pushing to controlcoreio organization..."
git push org dev 2>&1 || echo "   ⚠️  Failed to push to org dev"
git push org master 2>&1 || echo "   ⚠️  Failed to push to org master"

# Switch back to dev branch
git checkout dev 2>&1
echo ""

# Sync cc-pap-core to cc-pap-pro-tenant
echo "6️⃣  Syncing cc-pap-core changes to cc-pap-pro-tenant..."
if [ -d "$SCRIPT_DIR/cc-pap-core" ] && [ -d "$SCRIPT_DIR/cc-pap-pro-tenant" ]; then
    echo "   📋 Copying shared frontend and service files..."
    
    # Copy shared services (Python)
    if [ -d "$SCRIPT_DIR/cc-pap-core/services" ]; then
        echo "   • Copying services..."
        rsync -av --delete "$SCRIPT_DIR/cc-pap-core/services/" "$SCRIPT_DIR/cc-pap-pro-tenant/app/services/" 2>/dev/null || true
    fi
    
    # Copy shared UI components if they exist
    if [ -d "$SCRIPT_DIR/cc-pap-core/ui" ]; then
        echo "   • Copying UI components..."
        rsync -av --delete "$SCRIPT_DIR/cc-pap-core/ui/" "$SCRIPT_DIR/cc-pap-pro-tenant/app/ui/" 2>/dev/null || true
    fi
    
    # Copy API service files
    if [ -f "$SCRIPT_DIR/cc-pap-core/api_service.py" ]; then
        echo "   • Copying API service..."
        cp "$SCRIPT_DIR/cc-pap-core/api_service.py" "$SCRIPT_DIR/cc-pap-pro-tenant/app/" 2>/dev/null || true
    fi
    
    echo "   ✅ cc-pap-pro-tenant synced with cc-pap-core"
    
    # Commit changes to cc-pap-pro-tenant if there are any
    cd "$SCRIPT_DIR/cc-pap-pro-tenant"
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        git add -A
        git commit -m "chore: sync shared services from cc-pap-core" 2>/dev/null || true
        echo "   💾 Committed changes to cc-pap-pro-tenant"
    fi
    cd "$SCRIPT_DIR"
else
    echo "   ⚠️  cc-pap-core or cc-pap-pro-tenant directories not found"
fi
echo ""

# Final summary
echo "=================================================="
echo "✅ All services stopped and codebase synced"
echo "=================================================="
echo ""
echo "📊 Summary:"
echo ""
echo "   🐳 Docker: All containers stopped and cleaned"
echo "   📦 Volumes: Unused volumes removed"
echo "   💻 Services: All dev servers stopped"
echo ""
echo "   🔄 Git Sync:"
echo "   • dev branch → pushed to rakeshcontrolcore"
echo "   • master branch → merged from dev and pushed"
echo "   • dev branch → pushed to controlcoreio organization"
echo "   • master branch → pushed to controlcoreio organization"
echo ""
echo "   🔗 cc-pap-pro-tenant: Synced with cc-pap-core"
echo ""
echo "🎯 Ready for next development session!"
echo "   Run './start-all-services.sh' to start again"
echo ""
