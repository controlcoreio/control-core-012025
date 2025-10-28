#!/bin/bash

# Control Core Quick Deploy Script
# Auto-generated for your Control Core deployment

set -e

echo "🚀 Deploying Control Core..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it and try again."
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Deploying Control Plane...${NC}"
docker-compose -f controlcore-compose.yml up -d

# Wait for Control Plane to be ready
echo -e "${YELLOW}⏳ Waiting for Control Plane to be ready (this may take 30-60 seconds)...${NC}"
sleep 30

# Check if Control Plane is healthy
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f http://localhost:8082/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Control Plane is ready!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${YELLOW}⚠️  Control Plane health check timed out, but continuing...${NC}"
        break
    fi
    echo "   Checking... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

# Deploy Bouncers
echo -e "${BLUE}🛡️  Step 2: Deploying Bouncers...${NC}"

# Check if there are any bouncer compose files
BOUNCER_FILES=$(find . -name "bouncer-*-compose.yml" 2>/dev/null)

if [ -z "$BOUNCER_FILES" ]; then
    echo -e "${YELLOW}⚠️  No bouncer configuration files found.${NC}"
    echo "   If you want to deploy bouncers, create bouncer-<name>-compose.yml files"
else
    for bouncer_file in $BOUNCER_FILES; do
        bouncer_name=$(basename "$bouncer_file" | sed 's/bouncer-//;s/-compose.yml//')
        echo -e "   Deploying ${bouncer_name}..."
        docker-compose -f "$bouncer_file" up -d
    done
    echo -e "${GREEN}✅ Bouncers deployed!${NC}"
fi

# Final checks and info
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "================================"
echo ""
echo "📊 Control Core is now running:"
echo "   • Control Plane UI:  http://localhost:3000"
echo "   • Control Plane API: http://localhost:8082"
echo "   • API Documentation: http://localhost:8082/docs"
echo ""
echo "🔑 Default credentials:"
echo "   • Username: admin"
echo "   • Password: (check your .env file for CC_BUILTIN_ADMIN_PASS)"
echo ""
echo "📝 Next steps:"
echo "   1. Access the Control Plane UI at http://localhost:3000"
echo "   2. Log in with the admin credentials"
echo "   3. Navigate to /settings/resources to see auto-discovered resources"
echo "   4. Enrich your resources with business context and metadata"
echo "   5. Create policies to protect your resources"
echo ""
echo "🔍 To check service status:"
echo "   docker-compose ps"
echo ""
echo "📋 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose -f controlcore-compose.yml down"
for bouncer_file in $BOUNCER_FILES; do
    echo "   docker-compose -f $bouncer_file down"
done
echo ""

