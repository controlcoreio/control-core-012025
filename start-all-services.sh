#!/bin/bash

# Control Core - Start All Development Services
# This script starts all Control Core services for local development using Docker Desktop
# All services are linked to the 'dev' branch on GitHub

set -e

echo "🚀 Starting Control Core Development Environment"
echo "=================================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Ensure we're on the dev branch
echo "📌 Ensuring git branch: dev"
git checkout dev 2>/dev/null || echo "   Already on dev branch"
git pull origin dev 2>/dev/null || echo "   No remote updates"
echo ""

# Function to check if Docker is running
check_docker() {
    # Try to find Docker executable
    if command -v docker > /dev/null 2>&1; then
        DOCKER_CMD="docker"
    elif [ -f "/Applications/Docker.app/Contents/Resources/bin/docker" ]; then
        DOCKER_CMD="/Applications/Docker.app/Contents/Resources/bin/docker"
        export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
    else
        echo "❌ Docker not found. Please install Docker Desktop."
        exit 1
    fi
    
    # Check if Docker daemon is accessible
    if ! $DOCKER_CMD info > /dev/null 2>&1; then
        echo "❌ Docker Desktop is not running. Please start Docker Desktop first."
        exit 1
    fi
    
    # Export docker command for use in script
    export DOCKER_CMD
}

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=60
    local attempt=0
    
    echo "⏳ Waiting for $service_name..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo "   ✅ $service_name is ready"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "   ⚠️  Warning: $service_name did not start within expected time"
    return 1
}

# Check Docker is running
check_docker

echo "🏗️  Control Core Architecture Context:"
echo "=================================================="
echo ""
echo "   Control Plane Components:"
echo "   • cc-pap (Frontend) - Port 5173"
echo "   • cc-pap-api (Backend API) - Port 8000"
echo "   • cc-pap-core (Shared services/templates)"
echo "   • cc-pap-pro-tenant (Hosted Pro tenant service)"
echo "   • cc-language-server (Language support)"
echo ""
echo "   Supporting Services:"
echo "   • cc-signup-service - Port 8002"
echo "   • cc-docs - Port 3000"
echo "   • cc-bouncer (PEP) - Port 8080"
echo ""
echo "   Infrastructure:"
echo "   • cc-infra (Deployment configs)"
echo "   • PostgreSQL (Database) - Port 5432"
echo "   • Redis (Cache) - Port 6379"
echo ""
echo "   🎯 Development Dependencies:"
echo "   • cc-pap ↔ cc-pap-api ↔ cc-pap-core ↔ cc-language-server"
echo "   • cc-pap ↔ cc-infra ↔ cc-docs"
echo "   • cc-bouncer ↔ cc-docs"
echo "   • cc-pap-core updates → cc-pap-pro-tenant"
echo ""
echo "=================================================="
echo ""

# Start Control Core services using cc-infra docker-compose
echo "1️⃣  Starting Control Core Infrastructure (PostgreSQL, Redis, cc-pap-api, cc-bouncer)..."
cd "$SCRIPT_DIR/cc-infra"
if check_port 5432 || check_port 6379 || check_port 8000 || check_port 8080; then
    echo "   ℹ️  Some ports are in use, checking containers..."
    if $DOCKER_CMD ps --format "{{.Names}}" | grep -qE "(cc-db|cc-redis|cc-pap-api|cc-bouncer)"; then
        echo "   ✅ Some Control Core containers already running"
    fi
fi

# Start infrastructure services from cc-infra
$DOCKER_CMD compose -f controlcore-local-dev.yml up -d cc-db cc-redis cc-pap-api cc-pap cc-bouncer 2>&1 | grep -E "(Starting|Started|created|healthy|Error)" || true
echo "   ✅ Control Core infrastructure services started"
cd "$SCRIPT_DIR"
echo ""

# Start cc-signup-service (Port 8002)
echo "2️⃣  Starting cc-signup-service (Port 8002)..."
if check_port 8002; then
    echo "   ℹ️  Port 8002 already in use, skipping..."
else
    cd "$SCRIPT_DIR/cc-infra"
    $DOCKER_CMD compose -f controlcore-local-dev.yml up -d cc-signup-service 2>&1 | grep -E "(Starting|Started|created|healthy|Error)" || true
    echo "   ✅ cc-signup-service started"
fi
cd "$SCRIPT_DIR"
echo ""

# Start cc-docs (Port 3000)
echo "3️⃣  Starting cc-docs (Port 3000)..."
if check_port 3000; then
    echo "   ℹ️  Port 3000 already in use, skipping..."
else
    cd "$SCRIPT_DIR/cc-docs"
    npm run dev > /tmp/cc-docs.log 2>&1 &
    echo "   ✅ cc-docs started (PID: $!)"
fi
cd "$SCRIPT_DIR"
echo ""

# Start cc-bouncer (Port 8080) - Optional, comment out if not needed
echo "6️⃣  Starting cc-bouncer (Port 8080)..."
if check_port 8080; then
    echo "   ℹ️  Port 8080 already in use, skipping..."
else
    echo "   ℹ️  cc-bouncer requires manual setup - checking for container..."
        if $DOCKER_CMD ps --format "{{.Names}}" | grep -q "cc-bouncer"; then
        echo "   ✅ cc-bouncer container already running"
    else
        echo "   ⚠️  cc-bouncer not started (manual setup required)"
    fi
fi
echo ""

# Wait for core services to be ready
echo "🔍 Checking service health..."
echo ""

wait_for_service "http://localhost:8000/health" "cc-pap-api" || true
wait_for_service "http://localhost:8002/health" "cc-signup-service" || true
wait_for_service "http://localhost:3000" "cc-docs" || true

echo ""
echo "=================================================="
echo "✨ Control Core Development Environment Ready!"
echo "=================================================="
echo ""
echo "📚 Available Services:"
echo ""
echo "   🔹 Control Plane API (Swagger UI)"
echo "      http://localhost:8000/docs"
echo "      Health: http://localhost:8000/health"
echo ""
echo "   🔹 Signup Service"
echo "      http://localhost:8002"
echo "      Health: http://localhost:8002/health"
echo ""
echo "   🔹 Documentation Site"
echo "      http://localhost:3000"
echo ""
echo "   🔹 Bouncer (PEP)"
echo "      http://localhost:8080 (if running)"
echo ""
echo "=================================================="
echo ""
echo "💡 Development Tips:"
echo ""
echo "   🔗 Service Dependencies:"
echo "   • cc-pap changes → consider cc-pap-api, cc-pap-core, cc-language-server"
echo "   • cc-pap-api changes → consider cc-pap, cc-docs, cc-infra"
echo "   • cc-pap-core changes → sync to cc-pap-pro-tenant"
echo "   • cc-bouncer changes → update cc-docs"
echo ""
echo "   📝 Current Branch: $(git branch --show-current)"
echo "   🔄 Sync with: git push origin dev"
echo ""
echo "   🛑 Stop all services: ./stop-all-services.sh"
echo ""
