#!/bin/bash

# Control Core Docker Startup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================"
echo "  Control Core - Docker Container Startup"
echo "================================================"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo ""
    echo "Please install Docker Desktop:"
    echo "  macOS: brew install --cask docker"
    echo "  Or download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo ""
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed and running${NC}"
echo ""

# Check for existing containers
RUNNING_CONTAINERS=$(docker compose -f controlcore-local-dev.yml ps -q 2>/dev/null | wc -l | tr -d ' ')

if [ "$RUNNING_CONTAINERS" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Control Core containers are already running${NC}"
    echo ""
    docker compose -f controlcore-local-dev.yml ps
    echo ""
    read -p "Do you want to restart them? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping existing containers..."
        docker compose -f controlcore-local-dev.yml down
    else
        echo "Exiting..."
        exit 0
    fi
fi

echo -e "${BLUE}Building Docker images...${NC}"
echo "This may take a few minutes on first run..."
echo ""

# Build images
docker compose -f controlcore-local-dev.yml build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Build completed successfully${NC}"
echo ""

# Start services
echo -e "${BLUE}Starting Control Core services...${NC}"
docker compose -f controlcore-local-dev.yml up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to start services${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Control Core services are starting!${NC}"
echo ""

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "Service Status:"
echo "================================================"
docker compose -f controlcore-local-dev.yml ps

echo ""
echo "================================================"
echo -e "${GREEN}  Control Core is Ready!${NC}"
echo "================================================"
echo ""
echo "Access Control Core:"
echo -e "  ${BLUE}🌐 Frontend:${NC}     http://localhost:5173"
echo -e "  ${BLUE}🔧 Backend API:${NC}  http://localhost:8000"
echo -e "  ${BLUE}📚 API Docs:${NC}     http://localhost:8000/docs"
echo -e "  ${BLUE}🛡️  Bouncer:${NC}      http://localhost:8080"
echo -e "  ${BLUE}📝 Signup:${NC}       http://localhost:8002"
echo ""
echo "Login Credentials:"
echo -e "  ${YELLOW}Username:${NC} ccadmin"
echo -e "  ${YELLOW}Password:${NC} SecurePass2025!"
echo ""
echo "Useful Commands:"
echo "  View logs:       docker compose -f controlcore-local-dev.yml logs -f"
echo "  Stop services:   docker compose -f controlcore-local-dev.yml down"
echo "  Restart:         docker compose -f controlcore-local-dev.yml restart"
echo "  Rebuild:         docker compose -f controlcore-local-dev.yml build"
echo ""
echo "================================================"

