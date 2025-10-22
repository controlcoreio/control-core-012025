#!/bin/bash

# Control Core - Start All Development Services
# This script starts all Control Core services for local development

echo "🚀 Starting Control Core Development Environment"
echo "=================================================="
echo ""

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    echo "⏳ Waiting for $service_name on port $port..."
    while [ $attempt -lt $max_attempts ]; do
        if check_port $port; then
            echo "✅ $service_name is ready on port $port"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "⚠️  Warning: $service_name did not start on port $port within expected time"
    return 1
}

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "📂 Working directory: $SCRIPT_DIR"
echo ""

# Start cc-pap-api (Port 8000 - API Documentation)
echo "1️⃣  Starting cc-pap-api (Port 8000)..."
if check_port 8000; then
    echo "   ℹ️  Port 8000 already in use, skipping..."
else
    cd "$SCRIPT_DIR/cc-pap-api"
    source venv/bin/activate
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /dev/null 2>&1 &
    echo "   Started cc-pap-api (PID: $!)"
    deactivate
fi
echo ""

# Start cc-signup-service (Port 8002)
echo "2️⃣  Starting cc-signup-service (Port 8002)..."
if check_port 8002; then
    echo "   ℹ️  Port 8002 already in use, skipping..."
else
    cd "$SCRIPT_DIR/cc-signup-service"
    source venv/bin/activate
    nohup python run_on_8002.py > /dev/null 2>&1 &
    echo "   Started cc-signup-service (PID: $!)"
    deactivate
fi
echo ""

# Start cc-docs (Port 3000)
echo "3️⃣  Starting cc-docs (Port 3000)..."
if check_port 3000; then
    echo "   ℹ️  Port 3000 already in use, skipping..."
else
    cd "$SCRIPT_DIR/cc-docs"
    nohup npm run dev > /dev/null 2>&1 &
    echo "   Started cc-docs (PID: $!)"
fi
echo ""

# Wait for all services to be ready
echo "🔍 Checking service health..."
echo ""

wait_for_service 8000 "cc-pap-api"
wait_for_service 8002 "cc-signup-service"
wait_for_service 3000 "cc-docs"

echo ""
echo "=================================================="
echo "✨ Control Core Development Environment Ready!"
echo "=================================================="
echo ""
echo "📚 Available Services:"
echo ""
echo "   🔹 API Documentation (Swagger UI)"
echo "      http://localhost:8000/docs"
echo ""
echo "   🔹 Signup Service"
echo "      http://localhost:8002"
echo "      Health: http://localhost:8002/health"
echo ""
echo "   🔹 Documentation Site"
echo "      http://localhost:3000"
echo ""
echo "=================================================="
echo ""
echo "💡 Tips:"
echo "   • Use 'pkill -f python' to stop Python services"
echo "   • Use 'pkill -f next' to stop the docs server"
echo "   • Use './stop-all-services.sh' to stop all services"
echo ""

