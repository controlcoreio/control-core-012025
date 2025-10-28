#!/bin/bash

# Control Core OPAL Integration Setup Script
# This script sets up OPAL for Git-based policy management

set -e

echo "🚀 Setting up Control Core OPAL Integration..."

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo "❌ Git is not installed. Please install Git first."
        exit 1
    fi
    
    echo "✅ All requirements met!"
}

# Create necessary directories
create_directories() {
    echo "📁 Creating directories..."
    
    mkdir -p opal-data
    mkdir -p opal-logs
    mkdir -p opal-policies
    mkdir -p opal-cache
    
    echo "✅ Directories created!"
}

# Setup environment variables
setup_environment() {
    echo "🔧 Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Control Core OPAL Environment Variables
GITHUB_TOKEN=your-github-token-here
OPAL_SERVER_PORT=7000
OPAL_CLIENT_PORT=8083
OPA_PORT=8181
REDIS_PORT=6379

# Policy Repository Configuration
POLICY_REPO_URL=https://github.com/controlcoreio/staging-policies-repo.git
POLICY_REPO_BRANCH=main
POLICY_REPO_POLLING_INTERVAL=30

# Security Configuration
OPAL_WEBHOOK_SECRET=control-core-webhook-secret
OPAL_AUTH_TOKEN=control-core-auth-token

# Performance Configuration
OPAL_WORKER_COUNT=4
OPAL_MAX_WORKERS=8
OPAL_TIMEOUT=30

# Cache Configuration
OPAL_CACHE_TTL=300
OPAL_CACHE_MAX_SIZE=1000

# Logging Configuration
OPAL_LOG_LEVEL=INFO
OPAL_LOG_FORMAT_INCLUDE_PID=true
EOF
        echo "✅ Environment file created! Please update .env with your GitHub token."
    else
        echo "✅ Environment file already exists!"
    fi
}

# Setup GitHub webhook (if running on a server)
setup_github_webhook() {
    echo "🔗 Setting up GitHub webhook..."
    
    echo "To enable automatic policy updates, set up a GitHub webhook:"
    echo "1. Go to your GitHub repository settings"
    echo "2. Navigate to Webhooks"
    echo "3. Add webhook with URL: http://your-server:7000/webhook"
    echo "4. Set content type to application/json"
    echo "5. Set secret to: control-core-webhook-secret"
    echo "6. Select 'Just the push event'"
    echo ""
    echo "This will automatically sync policies when changes are pushed to the repository."
}

# Start OPAL services
start_opal_services() {
    echo "🚀 Starting OPAL services..."
    
    # Start Redis
    echo "Starting Redis..."
    docker-compose -f opal-compose.yml up -d redis
    
    # Wait for Redis to be ready
    echo "Waiting for Redis to be ready..."
    sleep 10
    
    # Start OPAL Server
    echo "Starting OPAL Server..."
    docker-compose -f opal-compose.yml up -d cc-opal-server
    
    # Wait for OPAL Server to be ready
    echo "Waiting for OPAL Server to be ready..."
    sleep 15
    
    # Start OPAL Client
    echo "Starting OPAL Client..."
    docker-compose -f opal-compose.yml up -d cc-opal-client
    
    # Wait for OPAL Client to be ready
    echo "Waiting for OPAL Client to be ready..."
    sleep 15
    
    # Start OPA Server
    echo "Starting OPA Server..."
    docker-compose -f opal-compose.yml up -d cc-opa-server
    
    echo "✅ OPAL services started!"
}

# Test OPAL integration
test_opal_integration() {
    echo "🧪 Testing OPAL integration..."
    
    # Test OPAL Server health
    echo "Testing OPAL Server health..."
    if curl -f http://localhost:7000/health > /dev/null 2>&1; then
        echo "✅ OPAL Server is healthy!"
    else
        echo "❌ OPAL Server health check failed!"
        return 1
    fi
    
    # Test OPAL Client health
    echo "Testing OPAL Client health..."
    if curl -f http://localhost:8083/health > /dev/null 2>&1; then
        echo "✅ OPAL Client is healthy!"
    else
        echo "❌ OPAL Client health check failed!"
        return 1
    fi
    
    # Test OPA Server health
    echo "Testing OPA Server health..."
    if curl -f http://localhost:8181/health > /dev/null 2>&1; then
        echo "✅ OPA Server is healthy!"
    else
        echo "❌ OPA Server health check failed!"
        return 1
    fi
    
    # Test policy bundle
    echo "Testing policy bundle..."
    if curl -f http://localhost:8080/bundle > /dev/null 2>&1; then
        echo "✅ Policy bundle is accessible!"
    else
        echo "❌ Policy bundle test failed!"
        return 1
    fi
    
    echo "✅ All OPAL integration tests passed!"
}

# Show service status
show_status() {
    echo "📊 OPAL Services Status:"
    echo ""
    echo "OPAL Server:     http://localhost:7000"
    echo "OPAL Client:     http://localhost:8083"
    echo "OPA Server:      http://localhost:8181"
    echo "Bundle Server:   http://localhost:8080"
    echo "Redis:           localhost:6379"
    echo ""
    echo "Health Checks:"
    echo "- OPAL Server:   http://localhost:7000/health"
    echo "- OPAL Client:   http://localhost:8083/health"
    echo "- OPA Server:    http://localhost:8181/health"
    echo "- Bundle:        http://localhost:8080/bundle"
    echo ""
    echo "Logs:"
    echo "- OPAL Server:   docker logs cc-opal-server"
    echo "- OPAL Client:   docker logs cc-opal-client"
    echo "- OPA Server:    docker logs cc-opa-server"
    echo "- Redis:         docker logs cc-redis"
}

# Main execution
main() {
    echo "🎯 Control Core OPAL Integration Setup"
    echo "======================================"
    echo ""
    
    check_requirements
    create_directories
    setup_environment
    setup_github_webhook
    
    echo ""
    echo "🚀 Starting OPAL services..."
    start_opal_services
    
    echo ""
    echo "🧪 Testing integration..."
    if test_opal_integration; then
        echo ""
        echo "🎉 OPAL integration setup completed successfully!"
        show_status
    else
        echo ""
        echo "❌ OPAL integration setup failed. Please check the logs."
        echo "Run 'docker logs cc-opal-server' for OPAL Server logs"
        echo "Run 'docker logs cc-opal-client' for OPAL Client logs"
        exit 1
    fi
}

# Run main function
main "$@"
