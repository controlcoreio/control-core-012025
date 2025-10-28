#!/bin/bash

# CC Demo App Startup Script
# This script starts the complete CC Demo App stack including database, backend API, and frontend

set -e

echo "🚀 Starting CC Demo App..."
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs

# Start the services
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is ready
echo "🔍 Checking database connection..."
until docker-compose exec -T db pg_isready -U postgres; do
    echo "⏳ Waiting for database..."
    sleep 2
done

# Initialize database with sample data
echo "🗄️ Initializing database with sample data..."
docker-compose exec -T api python init_db.py

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
sleep 5

# Check if API is ready
echo "🔍 Checking API health..."
until curl -f http://localhost:8001/health > /dev/null 2>&1; do
    echo "⏳ Waiting for API..."
    sleep 2
done

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
sleep 5

# Check if frontend is ready
echo "🔍 Checking frontend..."
until curl -f http://localhost:3001 > /dev/null 2>&1; do
    echo "⏳ Waiting for frontend..."
    sleep 2
done

echo ""
echo "✅ CC Demo App is now running!"
echo "================================"
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:8001"
echo "📚 API Documentation: http://localhost:8001/docs"
echo "🗄️ Database: localhost:5433 (postgres/password)"
echo ""
echo "🔑 Demo Users:"
echo "  - admin/admin123 (Full access)"
echo "  - manager/manager123 (Management access)"
echo "  - analyst/analyst123 (Analytics access)"
echo "  - hr/hr123 (HR access)"
echo "  - finance/finance123 (Finance access)"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop: ./stop-demo-app.sh"
echo ""