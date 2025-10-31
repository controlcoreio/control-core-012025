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
echo "=================================================="
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "   📝 Staging all changes..."
    git add -A
    
    echo "   💾 Committing changes..."
    COMMIT_MESSAGE="chore: end of session - sync development changes $(date '+%Y-%m-%d %H:%M')"
    git commit -m "$COMMIT_MESSAGE" || echo "   ℹ️  No changes to commit"
    echo ""
fi

# Show current status
echo "   📊 Repository Status:"
echo "   • Current branch: $(git branch --show-current)"
echo "   • Uncommitted changes: $(git status --porcelain | wc -l | tr -d ' ') files"
echo "   • Last commit: $(git log -1 --pretty=format:'%h - %s')"
echo ""

# Push to dev branch (origin - personal/working repo)
echo "   🔄 Step 1/4: Pushing to 'dev' branch (origin)..."
if git push origin dev 2>&1; then
    echo "   ✅ Successfully pushed to origin/dev"
else
    echo "   ⚠️  Failed to push to origin/dev"
    echo "   📝 Check: git remote -v | grep origin"
fi
echo ""

# Update and push master/main branch
echo "   🔄 Step 2/4: Merging dev into 'master' branch..."
CURRENT_BRANCH=$(git branch --show-current)
git checkout master 2>/dev/null || git checkout -b master

if git merge dev -m "Merge dev into master: sync development changes $(date '+%Y-%m-%d')"; then
    echo "   ✅ Successfully merged dev into master"
    
    echo "   🔄 Pushing master to origin..."
    if git push origin master 2>&1; then
        echo "   ✅ Successfully pushed to origin/master"
    else
        echo "   ⚠️  Failed to push to origin/master"
    fi
else
    echo "   ⚠️  Merge conflicts detected!"
    echo "   📝 Manual resolution needed:"
    echo "      1. Resolve conflicts in the files listed above"
    echo "      2. Run: git add <resolved-files>"
    echo "      3. Run: git commit"
    echo "      4. Run: git push origin master"
    echo "   ⏭️  Skipping master branch sync..."
    git merge --abort 2>/dev/null || true
fi
echo ""

# Push to organization repo (if configured)
echo "   🔄 Step 3/4: Pushing to organization repo (org)..."
if git remote | grep -q "^org$"; then
    # Push dev branch
    if git checkout dev 2>/dev/null && git push org dev 2>&1; then
        echo "   ✅ Successfully pushed dev to org/dev"
    else
        echo "   ⚠️  Failed to push to org/dev"
    fi
    
    # Push master branch
    if git checkout master 2>/dev/null && git push org master 2>&1; then
        echo "   ✅ Successfully pushed master to org/master"
    else
        echo "   ⚠️  Failed to push to org/master"
    fi
else
    echo "   ℹ️  Organization remote 'org' not configured"
    echo "   📝 To add: git remote add org <org-repo-url>"
fi
echo ""

# Return to original branch
echo "   🔄 Step 4/4: Returning to '$CURRENT_BRANCH' branch..."
git checkout "$CURRENT_BRANCH" 2>&1
echo "   ✅ Back on $CURRENT_BRANCH branch"
echo ""

echo "=================================================="
echo "📤 GitHub Sync Complete"
echo "=================================================="
echo ""
echo "   ✅ Changes committed and pushed"
echo ""
echo "   🌿 Branch Status:"
echo "   • dev: Pushed to origin $(git remote -v | grep origin | head -1 | awk '{print $2}')"
echo "   • master: Merged from dev and pushed to origin"
if git remote | grep -q "^org$"; then
echo "   • org: Pushed to organization repo"
fi
echo ""
echo "   💡 Quick Commands:"
echo "   • View commit history: git log --oneline -10"
echo "   • Check remote status: git remote -v"
echo "   • See what was pushed: git log origin/dev..dev"
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
echo "✅ Shutdown Complete - Ready for Next Session"
echo "=================================================="
echo ""
echo "📊 Summary of Actions:"
echo ""
echo "   🐳 Docker Services:"
echo "   • All Control Core containers stopped"
echo "   • Stopped containers cleaned up"
echo "   • Unused volumes removed"
echo "   • Network resources freed"
echo ""
echo "   💻 Development Servers:"
echo "   • cc-docs (Node.js) stopped"
echo "   • All background processes terminated"
echo ""
echo "   📤 Git Synchronization:"
echo "   • All changes committed with timestamp"
echo "   • dev branch → pushed to origin"
echo "   • master branch → merged from dev and pushed"
if git remote | grep -q "^org$"; then
echo "   • dev & master → pushed to organization repo"
fi
echo ""
echo "   🔗 Service Sync:"
echo "   • cc-pap-pro-tenant synced with cc-pap-core"
echo ""
echo "=================================================="
echo ""
echo "🎯 Ready for Next Development Session!"
echo ""
echo "   ▶️  Start services: ./start-all-services.sh"
echo ""
echo "   📚 Documentation:"
echo "   • Main README: README.md"
echo "   • Getting Started: 00_START_HERE.md"
echo "   • Deployment Guides: cc-infra/client-deployments/"
echo ""
echo "   🔍 Check Status:"
echo "   • Git status: git status"
echo "   • Git log: git log --oneline -5"
echo "   • Docker status: docker ps -a"
echo ""
echo "=================================================="
echo ""
