#!/bin/bash

echo "🚀 Setting up Control Core PAP API..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create necessary directories
mkdir -p config policies logs init

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update the .env file with your configuration"
fi

# Set up environment variables
cat > .env << EOF
# Control Core PAP API Configuration
DATABASE_URL=postgresql://postgres:password@cc-db:5432/control_core_db
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here
ENVIRONMENT=development
LOG_LEVEL=info

# Stripe Configuration (Update with your keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Auth0 Configuration (Update with your keys)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# GitHub Integration
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO_URL=https://github.com/controlcore/policies

# OPAL Configuration
OPAL_POLICY_REPO_URL=https://github.com/controlcore/policies
OPAL_DATA_SOURCES_CONFIG=./config/data-sources.json
EOF

echo "📝 Please update the .env file with your API keys and configuration"

# Start the services
echo "🐳 Starting Control Core PAP API..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Control Core PAP API is now running!"
echo ""
echo "📱 Access your services:"
echo "   • Control Core Admin: http://localhost:3000"
echo "   • Control Core API: http://localhost:8000"
echo "   • API Documentation: http://localhost:8000/docs"
echo "   • Demo App: http://localhost:3001"
echo "   • Demo API: http://localhost:8001"
echo ""
echo "🔐 Default credentials:"
echo "   • Email: admin@controlcore.io"
echo "   • Password: admin123"
echo ""
echo "📚 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Sign in with the default credentials"
echo "   3. Create your first policy"
echo "   4. Configure the Bouncer to protect your applications"
echo ""
echo "🆘 Need help? Contact us at info@controlcore.io"
