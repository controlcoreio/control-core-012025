#!/bin/bash

# Control Core - Stop All Development Services
# This script stops all Control Core services

echo "🛑 Stopping Control Core Development Services"
echo "=================================================="
echo ""

# Kill cc-pap-api (port 8000)
echo "1️⃣  Stopping cc-pap-api..."
lsof -ti :8000 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Stopped cc-pap-api"
else
    echo "   ℹ️  cc-pap-api was not running"
fi

# Kill cc-signup-service (port 8002)
echo "2️⃣  Stopping cc-signup-service..."
lsof -ti :8002 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Stopped cc-signup-service"
else
    echo "   ℹ️  cc-signup-service was not running"
fi

# Kill cc-docs (port 3000)
echo "3️⃣  Stopping cc-docs..."
lsof -ti :3000 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Stopped cc-docs"
else
    echo "   ℹ️  cc-docs was not running"
fi

echo ""
echo "=================================================="
echo "✅ All Control Core services stopped"
echo "=================================================="

