#!/bin/bash

# Control Core Kickstart Package Setup Script
# This script sets up Control Core for customer deployment

set -e

echo "🚀 Control Core Kickstart Setup"
echo "==============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo -e "${BLUE}📋 Checking requirements...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
        echo "Visit: https://git-scm.com/downloads"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met!${NC}"
}

# Create environment file
setup_environment() {
    echo -e "${BLUE}🔧 Setting up environment...${NC}"
    
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
            echo -e "${YELLOW}⚠️  Please update .env file with your configuration${NC}"
            echo -e "${YELLOW}   Required: GITHUB_TOKEN, POSTGRES_PASSWORD, CC_TENANT_ID, CC_API_KEY${NC}"
        else
            echo -e "${RED}❌ env.example file not found!${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Environment file already exists${NC}"
    fi
}

# Create necessary directories
create_directories() {
    echo -e "${BLUE}📁 Creating directories...${NC}"
    
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p data/opal
    mkdir -p logs
    mkdir -p policies
    
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Pull Docker images
pull_images() {
    echo -e "${BLUE}🐳 Pulling Docker images...${NC}"
    
    # Control Core images
    docker pull postgres:15
    docker pull redis:7-alpine
    docker pull permitio/opal-server:latest
    docker pull permitio/opal-client:latest
    docker pull openpolicyagent/opa:1.9.0
    
    echo -e "${GREEN}✅ Docker images pulled${NC}"
}

# Start Control Core platform
start_control_core() {
    echo -e "${BLUE}🚀 Starting Control Core platform...${NC}"
    
    if [ -f controlcore-compose.yml ]; then
        docker-compose -f controlcore-compose.yml up -d
        echo -e "${GREEN}✅ Control Core platform started${NC}"
    else
        echo -e "${RED}❌ controlcore-compose.yml not found!${NC}"
        exit 1
    fi
}

# Start demo application
start_demo_app() {
    echo -e "${BLUE}🎯 Starting demo application...${NC}"
    
    if [ -f demo-app-compose.yml ]; then
        docker-compose -f demo-app-compose.yml up -d
        echo -e "${GREEN}✅ Demo application started${NC}"
    else
        echo -e "${YELLOW}⚠️  demo-app-compose.yml not found, skipping demo app${NC}"
    fi
}

# Wait for services to be ready
wait_for_services() {
    echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
    
    # Wait for database
    echo "Waiting for database..."
    sleep 10
    
    # Wait for OPAL server
    echo "Waiting for OPAL server..."
    sleep 15
    
    # Wait for PAP API
    echo "Waiting for PAP API..."
    sleep 10
    
    echo -e "${GREEN}✅ Services are ready${NC}"
}

# Test services
test_services() {
    echo -e "${BLUE}🧪 Testing services...${NC}"
    
    # Test PAP API
    if curl -f http://localhost:8082/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PAP API is healthy${NC}"
    else
        echo -e "${RED}❌ PAP API health check failed${NC}"
        return 1
    fi
    
    # Test OPAL Server
    if curl -f http://localhost:7000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OPAL Server is healthy${NC}"
    else
        echo -e "${RED}❌ OPAL Server health check failed${NC}"
        return 1
    fi
    
    # Test Bouncer
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Bouncer is healthy${NC}"
    else
        echo -e "${RED}❌ Bouncer health check failed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ All services are healthy${NC}"
}

# Show service information
show_status() {
    echo -e "${BLUE}📊 Control Core Services Status${NC}"
    echo ""
    echo -e "${GREEN}🎯 Control Core Platform:${NC}"
    echo "   Admin UI:      http://localhost:3000"
    echo "   PAP API:       http://localhost:8082"
    echo "   API Docs:      http://localhost:8082/docs"
    echo "   Bouncer:       http://localhost:8080"
    echo "   OPAL Server:   http://localhost:7000"
    echo ""
    echo -e "${GREEN}🎯 Demo Application:${NC}"
    echo "   Demo UI:       http://localhost:3001"
    echo "   Demo API:      http://localhost:8000"
    echo ""
    echo -e "${GREEN}🔑 Default Credentials:${NC}"
    echo "   Username:      admin"
    echo "   Password:      admin123"
    echo "   API Key:       demo-api-key"
    echo ""
    echo -e "${GREEN}📋 Useful Commands:${NC}"
    echo "   View logs:     docker-compose logs -f"
    echo "   Stop all:      docker-compose down"
    echo "   Restart:       docker-compose restart"
    echo "   Status:        docker-compose ps"
    echo ""
    echo -e "${GREEN}📚 Documentation:${NC}"
    echo "   README.md:     Complete setup guide"
    echo "   API Docs:      http://localhost:8082/docs"
    echo "   Health Check:  http://localhost:8082/health"
}

# Main execution
main() {
    echo -e "${GREEN}🎉 Welcome to Control Core!${NC}"
    echo ""
    
    check_requirements
    setup_environment
    create_directories
    pull_images
    
    echo ""
    echo -e "${YELLOW}⚠️  Before continuing, please update .env file with your configuration${NC}"
    echo -e "${YELLOW}   Required: GITHUB_TOKEN, POSTGRES_PASSWORD, CC_TENANT_ID, CC_API_KEY${NC}"
    echo ""
    read -p "Press Enter to continue after updating .env file..."
    
    start_control_core
    start_demo_app
    wait_for_services
    
    echo ""
    echo -e "${BLUE}🧪 Testing services...${NC}"
    if test_services; then
        echo ""
        echo -e "${GREEN}🎉 Control Core setup completed successfully!${NC}"
        show_status
    else
        echo ""
        echo -e "${RED}❌ Setup failed. Please check the logs:${NC}"
        echo "   docker-compose logs"
        exit 1
    fi
}

# Run main function
main "$@"
