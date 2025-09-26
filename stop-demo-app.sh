#!/bin/bash

# CC Demo App Shutdown Script
# This script stops the complete CC Demo App stack

set -e

echo "🛑 Stopping CC Demo App..."
echo "================================"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed."
    exit 1
fi

# Stop the services
echo "🐳 Stopping Docker containers..."
docker-compose down

echo ""
echo "✅ CC Demo App has been stopped!"
echo "================================"
echo ""
echo "💡 To start again: ./start-demo-app.sh"
echo "🗑️ To remove all data: docker-compose down -v"
echo ""
