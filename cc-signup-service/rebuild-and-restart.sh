#!/bin/bash

echo "🔄 Rebuilding and Restarting Control Core Signup Service..."
echo "=============================================="

# Step 1: Kill any process on port 8002
echo ""
echo "1️⃣  Killing any process on port 8002..."
lsof -ti:8002 | xargs kill -9 2>/dev/null || echo "   No process found on port 8002"

# Step 2: Rebuild frontend
echo ""
echo "2️⃣  Rebuilding frontend..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   📦 Installing frontend dependencies..."
    npm install
fi

echo "   🔨 Building frontend (outputs to ../app/static)..."
npm run build

if [ $? -ne 0 ]; then
    echo "   ❌ Frontend build failed!"
    exit 1
fi

echo "   ✅ Frontend built successfully!"

# Step 3: Activate venv and start backend
cd ..
echo ""
echo "3️⃣  Starting backend service..."

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "   📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
echo "   🔧 Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "   📥 Ensuring backend dependencies are installed..."
pip install -r requirements.txt --quiet

# Start the service
echo ""
echo "   🚀 Starting signup service on port 8002..."
echo "   📍 Access at: http://localhost:8002"
echo "   📝 Changes included:"
echo "      - Job Title field (instead of duplicate email)"
echo "      - 3 bouncer types (Sidecar recommended)"
echo "      - Info modals with examples"
echo "      - Deployment + troubleshooting links"
echo "      - Dual environment education"
echo ""
echo "=============================================="
python run_on_8002.py

