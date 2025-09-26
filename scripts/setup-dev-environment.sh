#!/bin/bash

# Control Core Development Environment Setup Script
# This script sets up the development environment for Control Core

set -e

echo "🚀 Setting up Control Core Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "cc-pap" ]; then
    print_error "Please run this script from the Control Core root directory"
    exit 1
fi

# Check for required tools
print_info "Checking for required tools..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi
print_status "Node.js $(node --version) found"

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.9+ from https://python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
if [ "$(echo "$PYTHON_VERSION < 3.9" | bc -l)" -eq 1 ]; then
    print_error "Python 3.9+ is required. Current version: $(python3 --version)"
    exit 1
fi
print_status "Python $(python3 --version) found"

# Check Go
if ! command -v go &> /dev/null; then
    print_error "Go is not installed. Please install Go 1.21+ from https://golang.org/"
    exit 1
fi

GO_VERSION=$(go version | cut -d' ' -f3 | cut -d'o' -f2)
if [ "$(echo "$GO_VERSION < 1.21" | bc -l)" -eq 1 ]; then
    print_error "Go 1.21+ is required. Current version: $(go version)"
    exit 1
fi
print_status "Go $(go version) found"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker from https://docker.com/"
    exit 1
fi
print_status "Docker $(docker --version) found"

# Check Git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git from https://git-scm.com/"
    exit 1
fi
print_status "Git $(git --version) found"

# Setup Git hooks
print_info "Setting up Git hooks..."

# Install commitlint and husky globally
if ! command -v commitlint &> /dev/null; then
    print_info "Installing commitlint..."
    npm install -g @commitlint/cli @commitlint/config-conventional
fi

if ! command -v husky &> /dev/null; then
    print_info "Installing husky..."
    npm install -g husky
fi

# Initialize husky
if [ ! -d ".husky" ]; then
    npx husky install
    npx husky add .husky/commit-msg 'npx --no -- commitlint --edit $1'
    npx husky add .husky/pre-commit 'npm run lint'
    print_status "Git hooks configured"
fi

# Setup commitlint config
if [ ! -f "commitlint.config.js" ]; then
    cat > commitlint.config.js << EOF
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
        'revert'
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'cc-pap',
        'cc-pap-api',
        'cc-bouncer',
        'cc-opal',
        'cc-demoapp',
        'cc-docs',
        'cc-infra',
        'cc-language-server',
        'cc-pap-core',
        'cc-pap-pro-tenant',
        'cc-signup-service',
        'cc-business-admin',
        'global'
      ]
    ]
  }
};
EOF
    print_status "Commitlint configuration created"
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."

if [ -f "cc-pap/package.json" ]; then
    print_info "Installing cc-pap dependencies..."
    cd cc-pap && npm install && cd ..
    print_status "cc-pap dependencies installed"
fi

if [ -f "cc-demoapp/package.json" ]; then
    print_info "Installing cc-demoapp dependencies..."
    cd cc-demoapp && npm install && cd ..
    print_status "cc-demoapp dependencies installed"
fi

if [ -f "cc-docs/package.json" ]; then
    print_info "Installing cc-docs dependencies..."
    cd cc-docs && npm install && cd ..
    print_status "cc-docs dependencies installed"
fi

# Install backend dependencies
print_info "Installing backend dependencies..."

if [ -f "cc-pap-api/requirements.txt" ]; then
    print_info "Installing cc-pap-api dependencies..."
    cd cc-pap-api && pip install -r requirements.txt && cd ..
    print_status "cc-pap-api dependencies installed"
fi

if [ -f "cc-pap-pro-tenant/requirements.txt" ]; then
    print_info "Installing cc-pap-pro-tenant dependencies..."
    cd cc-pap-pro-tenant && pip install -r requirements.txt && cd ..
    print_status "cc-pap-pro-tenant dependencies installed"
fi

if [ -f "cc-signup-service/requirements.txt" ]; then
    print_info "Installing cc-signup-service dependencies..."
    cd cc-signup-service && pip install -r requirements.txt && cd ..
    print_status "cc-signup-service dependencies installed"
fi

# Install Go dependencies
print_info "Installing Go dependencies..."

if [ -f "cc-bouncer/go.mod" ]; then
    print_info "Installing cc-bouncer dependencies..."
    cd cc-bouncer && go mod download && cd ..
    print_status "cc-bouncer dependencies installed"
fi

if [ -f "cc-bouncer-sidecar/go.mod" ]; then
    print_info "Installing cc-bouncer-sidecar dependencies..."
    cd cc-bouncer-sidecar && go mod download && cd ..
    print_status "cc-bouncer-sidecar dependencies installed"
fi

# Setup development environment files
print_info "Setting up environment files..."

# Create .env files for services that need them
if [ ! -f "cc-pap-api/.env" ]; then
    print_info "Creating cc-pap-api/.env..."
    cat > cc-pap-api/.env << EOF
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/control_core_db

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# External Services
STRIPE_SECRET_KEY=sk_test_...
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# OPAL
OPAL_SERVER_URL=http://localhost:7000
GITHUB_TOKEN=your_github_token
EOF
    print_status "cc-pap-api/.env created"
fi

# Setup pre-commit hooks
print_info "Setting up pre-commit hooks..."

# Install pre-commit if not already installed
if ! command -v pre-commit &> /dev/null; then
    pip install pre-commit
fi

# Create .pre-commit-config.yaml
if [ ! -f ".pre-commit-config.yaml" ]; then
    cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict
      - id: debug-statements

  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.42.0
    hooks:
      - id: eslint
        files: \\.(js|jsx|ts|tsx)$
        additional_dependencies:
          - eslint@8.42.0
          - "@typescript-eslint/eslint-plugin@5.59.11"
          - "@typescript-eslint/parser@5.59.11"

  - repo: https://github.com/golangci/golangci-lint
    rev: v1.53.3
    hooks:
      - id: golangci-lint
EOF
    print_status "Pre-commit configuration created"
fi

# Install pre-commit hooks
pre-commit install
print_status "Pre-commit hooks installed"

# Create development scripts
print_info "Creating development scripts..."

# Create start-dev.sh
cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash
# Start all development services

echo "🚀 Starting Control Core Development Environment"

# Start services with Docker Compose
cd cc-infra/docker-compose && docker-compose -f docker-compose.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
curl -f http://localhost:8000/health || echo "❌ cc-pap-api not ready"
curl -f http://localhost:3000 || echo "❌ cc-pap not ready"
curl -f http://localhost:3001 || echo "❌ cc-demoapp not ready"

echo "✅ Development environment started!"
echo "📱 Services available at:"
echo "   - Control Core Admin: http://localhost:3000"
echo "   - API Documentation: http://localhost:8000/docs"
echo "   - Demo App: http://localhost:3001"
EOF

chmod +x scripts/start-dev.sh
print_status "Development start script created"

# Create stop-dev.sh
cat > scripts/stop-dev.sh << 'EOF'
#!/bin/bash
# Stop all development services

echo "🛑 Stopping Control Core Development Environment"

# Stop services
cd cc-infra/docker-compose && docker-compose -f docker-compose.yml down

echo "✅ Development environment stopped!"
EOF

chmod +x scripts/stop-dev.sh
print_status "Development stop script created"

# Create test script
cat > scripts/test-all.sh << 'EOF'
#!/bin/bash
# Run all tests

echo "🧪 Running all tests..."

# Frontend tests
if [ -f "cc-pap/package.json" ]; then
    echo "Testing cc-pap..."
    cd cc-pap && npm test && cd ..
fi

if [ -f "cc-demoapp/package.json" ]; then
    echo "Testing cc-demoapp..."
    cd cc-demoapp && npm test && cd ..
fi

# Backend tests
if [ -f "cc-pap-api/requirements.txt" ]; then
    echo "Testing cc-pap-api..."
    cd cc-pap-api && pytest && cd ..
fi

# Go tests
if [ -f "cc-bouncer/go.mod" ]; then
    echo "Testing cc-bouncer..."
    cd cc-bouncer && go test ./... && cd ..
fi

echo "✅ All tests completed!"
EOF

chmod +x scripts/test-all.sh
print_status "Test script created"

# Create lint script
cat > scripts/lint-all.sh << 'EOF'
#!/bin/bash
# Lint all code

echo "🔍 Linting all code..."

# Frontend linting
if [ -f "cc-pap/package.json" ]; then
    echo "Linting cc-pap..."
    cd cc-pap && npm run lint && cd ..
fi

if [ -f "cc-demoapp/package.json" ]; then
    echo "Linting cc-demoapp..."
    cd cc-demoapp && npm run lint && cd ..
fi

# Backend linting
if [ -f "cc-pap-api/requirements.txt" ]; then
    echo "Linting cc-pap-api..."
    cd cc-pap-api && flake8 . --max-line-length=100 && cd ..
fi

# Go linting
if [ -f "cc-bouncer/go.mod" ]; then
    echo "Linting cc-bouncer..."
    cd cc-bouncer && go vet ./... && cd ..
fi

echo "✅ All linting completed!"
EOF

chmod +x scripts/lint-all.sh
print_status "Lint script created"

# Setup VS Code settings
print_info "Setting up VS Code settings..."

if [ ! -d ".vscode" ]; then
    mkdir .vscode
fi

# Create VS Code settings
cat > .vscode/settings.json << EOF
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "python.defaultInterpreterPath": "python3",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "go.formatTool": "goimports",
  "go.lintTool": "golangci-lint",
  "files.exclude": {
    "**/node_modules": true,
    "**/__pycache__": true,
    "**/.pytest_cache": true,
    "**/dist": true,
    "**/build": true
  }
}
EOF

# Create VS Code extensions recommendations
cat > .vscode/extensions.json << EOF
{
  "recommendations": [
    "ms-python.python",
    "ms-python.flake8",
    "ms-python.black-formatter",
    "golang.go",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
EOF

print_status "VS Code settings configured"

# Final setup
print_info "Finalizing setup..."

# Make scripts executable
chmod +x scripts/*.sh

# Create .gitignore additions
if ! grep -q "# Development" .gitignore; then
    cat >> .gitignore << EOF

# Development
.env
.env.local
.env.development
.env.test
.env.production
.vscode/settings.json
*.log
.DS_Store
EOF
fi

print_status "Development environment setup completed!"

echo ""
echo "🎉 Control Core Development Environment Ready!"
echo "=============================================="
echo ""
echo "📋 Next Steps:"
echo "1. Configure your environment variables in the .env files"
echo "2. Start development services: ./scripts/start-dev.sh"
echo "3. Run tests: ./scripts/test-all.sh"
echo "4. Run linting: ./scripts/lint-all.sh"
echo ""
echo "🔗 Useful Commands:"
echo "  - Start dev environment: ./scripts/start-dev.sh"
echo "  - Stop dev environment: ./scripts/stop-dev.sh"
echo "  - Run all tests: ./scripts/test-all.sh"
echo "  - Lint all code: ./scripts/lint-all.sh"
echo ""
echo "📚 Documentation:"
echo "  - Development workflow: .github/workflows/development-workflow.md"
echo "  - Branch protection: .github/BRANCH_PROTECTION.md"
echo "  - CI/CD pipeline: .github/workflows/ci-cd.yml"
echo ""
print_status "Happy coding! 🚀"
