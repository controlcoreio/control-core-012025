#!/bin/bash
# Quick Rebuild Script for Control Core Essential Services
# This script rebuilds and restarts all essential Control Core containers

set -e  # Exit on error

echo "=================================================="
echo "Control Core - Quick Rebuild Script"
echo "=================================================="
echo ""

cd "$(dirname "$0")/cc-infra"

echo "Step 1: Stopping all containers..."
docker compose -f controlcore-local-dev.yml down
echo "✅ Containers stopped"
echo ""

echo "Step 2: Building all images (this may take 5-10 minutes)..."
docker compose -f controlcore-local-dev.yml build --no-cache
echo "✅ Images built"
echo ""

echo "Step 3: Starting database and redis..."
docker compose -f controlcore-local-dev.yml up -d cc-db cc-redis
echo "⏳ Waiting for database to be ready (15 seconds)..."
sleep 15
echo "✅ Database and Redis started"
echo ""

echo "Step 4: Starting backend API..."
docker compose -f controlcore-local-dev.yml up -d cc-pap-api
echo "⏳ Waiting for API to load templates (15 seconds)..."
sleep 15
echo "✅ Backend API started"
echo ""

echo "Step 5: Starting frontend..."
docker compose -f controlcore-local-dev.yml up -d cc-pap
echo "✅ Frontend started"
echo ""

echo "Step 6: Starting bouncer and OPAL..."
docker compose -f controlcore-local-dev.yml up -d cc-bouncer cc-opal-server cc-opal-client
echo "✅ Bouncer and OPAL started"
echo ""

echo "Step 7: Checking service status..."
docker compose -f controlcore-local-dev.yml ps
echo ""

echo "=================================================="
echo "✅ Rebuild Complete!"
echo "=================================================="
echo ""
echo "Verification:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo ""
echo "Testing:"
echo "  curl http://localhost:8000/health"
echo "  curl http://localhost:8000/policies/templates/ | jq 'length'"
echo ""
echo "Login credentials:"
echo "  Username: ccadmin"
echo "  Password: SecurePass2025!"
echo ""

