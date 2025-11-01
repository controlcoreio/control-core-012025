#!/bin/bash

# Quick script to restart the backend server with the new PEP configuration changes

echo "🔄 Restarting Control Core Backend Server..."
echo ""

cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-pap-api

echo "📍 Current directory: $(pwd)"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found"
    echo "Please create a virtual environment first:"
    echo "  python3 -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
fi

echo "✅ Virtual environment found"
echo ""

# Kill any existing uvicorn processes
echo "🛑 Stopping any existing backend servers..."
pkill -f "uvicorn app.main:app" 2>/dev/null || echo "  No existing servers found"
sleep 2

echo ""
echo "🚀 Starting backend server..."
echo "   URL: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
./venv/bin/uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

