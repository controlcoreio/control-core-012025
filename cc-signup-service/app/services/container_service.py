import os
import zipfile
import json
from datetime import datetime
from typing import Dict, Any

def generate_deployment_package(user_id: str, tier: str, deployment_preference: str = "on_prem") -> Dict[str, Any]:
    """Generate deployment package for Control Core."""
    
    # Create package directory
    package_dir = f"/tmp/controlcore-{user_id}"
    os.makedirs(package_dir, exist_ok=True)
    
    # Generate package contents based on tier
    if tier == "kickstart":
        # Kickstart: Full self-hosted deployment (Control Plane + Bouncer)
        package_contents = generate_kickstart_package(user_id, package_dir)
    elif tier == "pro":
        # Pro: Hybrid - Control Plane on AWS, Bouncer self-hosted
        package_contents = generate_pro_package(user_id, package_dir)
    else:  # custom
        # Custom: Full self-hosted deployment (Control Plane + Bouncer)
        package_contents = generate_custom_package(user_id, package_dir)
    
    # Create zip file
    zip_filename = f"controlcore-{tier}-{user_id[:8]}.zip"
    zip_path = f"/tmp/{zip_filename}"
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(package_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, package_dir)
                zipf.write(file_path, arcname)
    
    # Generate download URL (in production, this would be uploaded to S3)
    download_url = f"https://downloads.controlcore.io/{zip_filename}"
    
    return {
        "user_id": user_id,
        "tier": tier,
        "deployment_type": deployment_preference,
        "version": "1.0.0",
        "github_repo": f"controlcore-{user_id[:8]}",
        "download_url": download_url,
        "package_size": os.path.getsize(zip_path),
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow().timestamp() + 7 * 24 * 3600)  # 7 days
    }

def generate_kickstart_package(user_id: str, package_dir: str) -> Dict[str, Any]:
    """Generate Kickstart deployment package."""
    
    # Create docker-compose.yml
    docker_compose = f"""
version: '3.8'

services:
  cc-pap-api:
    image: controlcore/cc-pap-api:latest
    container_name: cc-pap-api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@cc-db:5432/control_core_db
      - SECRET_KEY=your-secret-key-here
    depends_on:
      - cc-db
    volumes:
      - ./config:/app/config
      - ./policies:/app/policies

  cc-db:
    image: postgres:15
    container_name: cc-db
    environment:
      - POSTGRES_DB=control_core_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d

  cc-frontend:
    image: controlcore/cc-frontend:latest
    container_name: cc-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - cc-pap-api

  # Sandbox Bouncer (REQUIRED - Your first bouncer)
  # All policies are created and tested here
  cc-bouncer-sandbox:
    image: controlcore/cc-bouncer:latest
    container_name: cc-bouncer-sandbox
    ports:
      - "8080:8080"
    environment:
      # Basic Configuration
      - BOUNCER_PORT=8080
      - TARGET_HOST=acme-demo-api:8000  # Points to demo API
      - PAP_API_URL=http://cc-pap-api:8000
      - OPAL_SERVER_URL=http://cc-opal:7000
      - TENANT_ID={user_id}
      - API_KEY=your-sandbox-api-key-here  # Generate in Settings > Environments
      - LOG_ENABLED=true
      - CACHE_ENABLED=true
      
      # Resource Auto-Discovery Configuration
      - BOUNCER_ID=bouncer-{user_id[:8]}-sandbox
      - BOUNCER_NAME=Demo API Bouncer (Sandbox)
      - BOUNCER_TYPE=reverse-proxy
      - RESOURCE_NAME=Demo API  # This links to production bouncer
      - RESOURCE_TYPE=api
      - ORIGINAL_HOST_URL=https://test-api.yourcompany.com  # Your test API URL
      - SECURITY_POSTURE=deny-all
      - DEPLOYMENT_PLATFORM=docker
      - ENVIRONMENT=sandbox  # REQUIRED for sandbox
    depends_on:
      - cc-pap-api
      - cc-opal

  # Production Bouncer (OPTIONAL - Deploy when ready)
  # IMPORTANT: Deploy this ONLY after testing policies in sandbox
  # To enable: Remove the 'profiles' line or run: docker-compose --profile production up
  cc-bouncer-production:
    image: controlcore/cc-bouncer:latest
    container_name: cc-bouncer-production
    profiles: ["production"]  # Disabled by default
    ports:
      - "8081:8080"
    environment:
      # Basic Configuration
      - BOUNCER_PORT=8080
      - TARGET_HOST=your-prod-api:8000  # CHANGE THIS to your production API
      - PAP_API_URL=http://cc-pap-api:8000
      - OPAL_SERVER_URL=http://cc-opal:7000
      - TENANT_ID={user_id}
      - API_KEY=your-production-api-key-here  # Generate in Settings > Environments
      - LOG_ENABLED=true
      - CACHE_ENABLED=true
      
      # Resource Auto-Discovery Configuration
      - BOUNCER_ID=bouncer-{user_id[:8]}-production
      - BOUNCER_NAME=Demo API Bouncer (Production)
      - BOUNCER_TYPE=reverse-proxy
      - RESOURCE_NAME=Demo API  # SAME as sandbox - creates a pair
      - RESOURCE_TYPE=api
      - ORIGINAL_HOST_URL=https://api.yourcompany.com  # Your production API URL
      - SECURITY_POSTURE=deny-all
      - DEPLOYMENT_PLATFORM=docker
      - ENVIRONMENT=production  # REQUIRED for production
    depends_on:
      - cc-pap-api
      - cc-opal

  cc-opal:
    image: controlcore/cc-opal:latest
    container_name: cc-opal
    ports:
      - "7000:7000"
    environment:
      - OPAL_POLICY_REPO_URL=https://github.com/controlcore/policies
      - OPAL_DATA_SOURCES_CONFIG=./config/data-sources.json
    volumes:
      - ./config:/app/config

  acme-demo-api:
    image: controlcore/acme-demo-api:latest
    container_name: acme-demo-api
    ports:
      - "8001:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@acme-db:5432/acme_demo_db
    depends_on:
      - acme-db

  acme-demo-db:
    image: postgres:15
    container_name: acme-demo-db
    environment:
      - POSTGRES_DB=acme_demo_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - acme_data:/var/lib/postgresql/data

  acme-demo-frontend:
    image: controlcore/acme-demo-frontend:latest
    container_name: acme-demo-frontend
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8001
    depends_on:
      - acme-demo-api

volumes:
  postgres_data:
  acme_data:
"""
    
    with open(f"{package_dir}/docker-compose.yml", "w") as f:
        f.write(docker_compose)
    
    # Create setup script
    setup_script = """#!/bin/bash

echo "🚀 Setting up Control Core Kickstart..."

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
mkdir -p config policies init

# Set up environment variables
cat > .env << EOF
# Control Core Configuration
SECRET_KEY=your-secret-key-here-change-this
DATABASE_URL=postgresql://postgres:password@cc-db:5432/control_core_db

# GitHub Repository (for policy management)
GITHUB_REPO_URL=https://github.com/controlcore/policies
GITHUB_TOKEN=your-github-token-here

# Email Configuration (for magic links)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@controlcore.io
EOF

echo "📝 Please update the .env file with your configuration"

# Start the services
echo "🐳 Starting Control Core services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Control Core is now running!"
echo ""
echo "📱 Access your services:"
echo "   • Control Core Admin: http://localhost:3000"
echo "   • Demo App: http://localhost:3001"
echo "   • API Documentation: http://localhost:8000/docs"
echo ""
echo "🔐 Default login:"
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
"""
    
    with open(f"{package_dir}/setup.sh", "w") as f:
        f.write(setup_script)
    
    os.chmod(f"{package_dir}/setup.sh", 0o755)
    
    # Create README
    readme = """# Control Core Kickstart - Dual Environment Setup

Welcome to Control Core! This package contains everything you need to get started with your free 3-month trial.

## What's Included

- **Control Core Control Plane**: Policy Administration Point (Admin UI + API)
- **Sandbox Bouncer (Port 8080)**: Your first bouncer for policy development ← REQUIRED
- **Production Bouncer (Port 8081)**: Optional bouncer for production ← Disabled by default
- **OPAL**: Policy synchronization service
- **Demo App**: ACME Consulting demo application
- **Database**: PostgreSQL with sample data

## Dual Environment Architecture

Control Core uses a **Sandbox + Production** model like Stripe's test/live mode:

**Default Setup:**
```
Control Plane → Sandbox Bouncer (Required) ← You start here
             ↘ Production Bouncer (Optional) ← Add when ready
```

**Workflow:**
1. Create policies in Sandbox
2. Test with Sandbox bouncer
3. Promote to Production when ready
4. Production bouncer enforces promoted policies

## Quick Start

### Step 1: Start Control Core

```bash
./setup.sh
```

This starts:
- ✅ Control Core Admin UI (http://localhost:3000)
- ✅ PAP API (http://localhost:8000)
- ✅ Sandbox Bouncer (http://localhost:8080) ← Your first bouncer
- ✅ OPAL Server (http://localhost:7000)
- ✅ Demo App (http://localhost:3001)

**Note**: Production bouncer starts disabled. Enable when ready for production.

### Step 2: Access & Generate API Keys

1. Open http://localhost:3000
2. Sign in: admin@controlcore.io / admin123
3. Navigate to **Settings > Environments**
4. Click **"Generate Sandbox API Key"** (starts with `sk_test_`)
5. Update docker-compose.yml with your sandbox key
6. Restart: `docker-compose restart cc-bouncer-sandbox`

### Step 3: Create Your First Policy

1. Ensure "Now viewing: **Sandbox**" in PAP UI ← This is default
2. Go to **Policies** page
3. Click **"Create Policy"** (only available in Sandbox!)
4. Define your policy rules
5. Test it through sandbox bouncer (port 8080)

### Step 4: When Ready for Production

**Only do this after testing policies in Sandbox:**

1. In PAP UI: **Settings > Environments** → Generate Production Key (`sk_live_`)
2. Update docker-compose.yml with production key
3. Enable production bouncer:
   ```bash
   docker-compose --profile production up -d
   ```
4. Promote tested policies: **Policies** → Select policy → **"Promote to Production"**
5. Switch to "Now viewing: **Production**" to verify

## Understanding Bouncer Pairs

Both bouncers protect the same logical resource across environments:

```
Resource: "Demo API"
├── Sandbox Bouncer (localhost:8080) → Test API
└── Production Bouncer (localhost:8081) → Live API
```

Policies created in Sandbox are promoted to Production. Both bouncers share the same `RESOURCE_NAME` to be recognized as a pair.

## Configuration

### API Keys (Generate in PAP UI)
- Sandbox: `sk_test_...` (Required)
- Production: `sk_live_...` (Optional - when ready)

### Environment Variables (.env)
Update after generating keys in PAP UI:
```
SANDBOX_API_KEY=sk_test_your_key_here
PRODUCTION_API_KEY=sk_live_your_key_here
```

## Support

- 📧 Email: info@controlcore.io
- 💬 Chat: Discord.gg/HjhcT572
- 📚 Docs: docs.controlcore.io

## Plan Details

**Kickstart Plan (Free 3-month trial):**
- ✅ Unlimited Usage
- ✅ On-Prem Deployment
- ✅ Dual Environment Support (Sandbox + Production)
- ✅ 100 Active Policies
- ✅ 5 Conditions per Policy
- ✅ Unlimited Decisions
- ✅ Unlimited Identities
- ✅ 90 Days Log Retention
- ✅ Dedicated Account Manager

Enjoy your Control Core experience!
"""
    
    with open(f"{package_dir}/README.md", "w") as f:
        f.write(readme)
    
    return {
        "package_type": "kickstart",
        "services": ["cc-pap-api", "cc-frontend", "cc-bouncer-sandbox", "cc-bouncer-production", "cc-opal", "acme-demo-api", "acme-demo-frontend"],
        "ports": [3000, 8000, 8080, 8081, 7000, 8001, 3001],
        "features": ["admin_ui", "policy_management", "demo_app", "dual_environment_bouncers", "opal_sync", "policy_promotion"]
    }

def generate_pro_package(user_id: str, package_dir: str) -> Dict[str, Any]:
    """Generate Pro deployment package - Hybrid: Control Plane on AWS, Bouncers self-hosted."""
    
    # Create docker-compose.yml for Bouncers (Control Plane is hosted on AWS)
    docker_compose = f"""
version: '3.8'

services:
  # Sandbox Bouncer (REQUIRED - Your first bouncer)
  # Deploy this first to create and test policies
  cc-bouncer-sandbox:
    image: controlcore/cc-bouncer:latest
    container_name: cc-bouncer-sandbox
    ports:
      - "8080:8080"
    environment:
      # Basic Configuration
      - BOUNCER_PORT=8080
      - TARGET_HOST=localhost:8000  # CHANGE THIS to your test API
      - PAP_API_URL=https://controlcore-pro-{user_id[:8]}.controlcore.io
      - OPAL_SERVER_URL=http://cc-opal:7000
      - TENANT_ID={user_id}
      - API_KEY=your-sandbox-api-key-here  # Generate sk_test_ key in Settings
      - LOG_ENABLED=true
      - CACHE_ENABLED=true
      
      # Resource Auto-Discovery Configuration
      - BOUNCER_ID=bouncer-{user_id[:8]}-sandbox
      - BOUNCER_NAME=My API Bouncer (Sandbox)
      - BOUNCER_TYPE=reverse-proxy
      - RESOURCE_NAME=My API  # This links to production bouncer
      - RESOURCE_TYPE=api
      - ORIGINAL_HOST_URL=https://test-api.yourcompany.com  # Test URL
      - SECURITY_POSTURE=deny-all
      - DEPLOYMENT_PLATFORM=docker
      - ENVIRONMENT=sandbox  # REQUIRED for sandbox
    depends_on:
      - cc-opal

  # Production Bouncer (OPTIONAL - Deploy when ready)
  # Deploy this ONLY after testing policies in sandbox
  # To enable: docker-compose --profile production up -d
  cc-bouncer-production:
    image: controlcore/cc-bouncer:latest
    container_name: cc-bouncer-production
    profiles: ["production"]  # Disabled by default
    ports:
      - "8081:8080"
    environment:
      # Basic Configuration
      - BOUNCER_PORT=8080
      - TARGET_HOST=localhost:8000  # CHANGE THIS to your production API
      - PAP_API_URL=https://controlcore-pro-{user_id[:8]}.controlcore.io
      - OPAL_SERVER_URL=http://cc-opal:7000
      - TENANT_ID={user_id}
      - API_KEY=your-production-api-key-here  # Generate sk_live_ key in Settings
      - LOG_ENABLED=true
      - CACHE_ENABLED=true
      
      # Resource Auto-Discovery Configuration
      - BOUNCER_ID=bouncer-{user_id[:8]}-production
      - BOUNCER_NAME=My API Bouncer (Production)
      - BOUNCER_TYPE=reverse-proxy
      - RESOURCE_NAME=My API  # SAME as sandbox - creates a pair
      - RESOURCE_TYPE=api
      - ORIGINAL_HOST_URL=https://api.yourcompany.com  # Production URL
      - SECURITY_POSTURE=deny-all
      - DEPLOYMENT_PLATFORM=docker
      - ENVIRONMENT=production  # REQUIRED for production
    depends_on:
      - cc-opal

  cc-opal:
    image: controlcore/cc-opal:latest
    container_name: cc-opal
    ports:
      - "7000:7000"
    environment:
      - OPAL_POLICY_REPO_URL=https://github.com/controlcore/policies
      - OPAL_DATA_SOURCES_CONFIG=./config/data-sources.json
      - PAP_API_URL=https://controlcore-pro-{user_id[:8]}.controlcore.io
    volumes:
      - ./config:/app/config

  # Optional: Demo app for testing
  acme-demo-api:
    image: controlcore/acme-demo-api:latest
    container_name: acme-demo-api
    ports:
      - "8001:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@acme-db:5432/acme_demo_db
    depends_on:
      - acme-db

  acme-demo-db:
    image: postgres:15
    container_name: acme-demo-db
    environment:
      - POSTGRES_DB=acme_demo_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - acme_data:/var/lib/postgresql/data

  acme-demo-frontend:
    image: controlcore/acme-demo-frontend:latest
    container_name: acme-demo-frontend
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8001
    depends_on:
      - acme-demo-api

volumes:
  acme_data:
"""
    
    with open(f"{package_dir}/docker-compose.yml", "w") as f:
        f.write(docker_compose)
    
    # Create setup script for Pro
    setup_script = f"""#!/bin/bash

echo "🚀 Setting up Control Core Pro (Hybrid Deployment)..."

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
mkdir -p config

# Set up environment variables
cat > .env << EOF
# Control Core Pro Configuration
TENANT_ID={user_id}
API_KEY=your-bouncer-api-key-here
PAP_API_URL=https://controlcore-pro-{user_id[:8]}.controlcore.io

# GitHub Repository (for policy management)
GITHUB_REPO_URL=https://github.com/controlcore/policies
GITHUB_TOKEN=your-github-token-here

# OPAL Configuration
OPAL_POLICY_REPO_URL=https://github.com/controlcore/policies
OPAL_DATA_SOURCES_CONFIG=./config/data-sources.json
EOF

echo "📝 Please update the .env file with your API key and configuration"

# Start the services
echo "🐳 Starting Control Core Bouncer and OPAL..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Control Core Pro is now running!"
echo ""
echo "📱 Access your services:"
echo "   • Control Core Admin: https://controlcore-pro-{user_id[:8]}.controlcore.io"
echo "   • Demo App: http://localhost:3001"
echo "   • Bouncer: http://localhost:8080"
echo ""
echo "🔐 Your Control Plane is hosted on AWS:"
echo "   • URL: https://controlcore-pro-{user_id[:8]}.controlcore.io"
echo "   • Login with your Control Core account"
echo ""
echo "📚 Next steps:"
echo "   1. Open https://controlcore-pro-{user_id[:8]}.controlcore.io in your browser"
echo "   2. Sign in with your Control Core account"
echo "   3. Create your first policy"
echo "   4. Configure the Bouncer to protect your applications"
echo ""
echo "🆘 Need help? Contact us at info@controlcore.io"
"""
    
    with open(f"{package_dir}/setup.sh", "w") as f:
        f.write(setup_script)
    
    os.chmod(f"{package_dir}/setup.sh", 0o755)
    
    # Create README for Pro
    readme = f"""# Control Core Pro - Hybrid Deployment

Welcome to Control Core Pro! This package contains your self-hosted Bouncer (PEP) and OPAL services.

## Architecture

**Hybrid Deployment:**
- **Control Plane**: Hosted on AWS (https://controlcore-pro-{user_id[:8]}.controlcore.io)
- **Bouncer (PEP)**: Self-hosted in your environment
- **OPAL**: Self-hosted for policy synchronization

## What's Included

- **The Bouncer**: Policy Enforcement Point (PEP) - Self-hosted
- **OPAL**: Policy synchronization service - Self-hosted
- **Demo App**: ACME Consulting demo application (optional)
- **Database**: PostgreSQL for demo app

## Quick Start

1. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

2. **Access your Control Plane:**
   - Open https://controlcore-pro-{user_id[:8]}.controlcore.io in your browser
   - Sign in with your Control Core account

3. **Configure your Bouncer:**
   - The Bouncer will automatically sync policies from the Control Plane
   - Access Bouncer at http://localhost:8080

## Configuration

Update the `.env` file with your settings:
- Set your API_KEY (provided in your Control Core account)
- Configure GitHub repository for policy management
- Set up data sources for OPAL

## Pro Plan Features

**Pro Plan ($99/month + usage):**
- ✅ Hybrid Deployment (Control Plane on AWS)
- ✅ 100 Active Policies
- ✅ 5 Conditions per Policy
- ✅ Unlimited Decisions
- ✅ Unlimited Identities
- ✅ 90 Days Log Retention
- ✅ Private Support Channel
- ✅ Context Generation: $1 per 1000

## Support

- 📧 Email: info@controlcore.io
- 💬 Chat: Discord.gg/HjhcT572
- 📚 Docs: docs.controlcore.io

Enjoy your Control Core Pro experience!
"""
    
    with open(f"{package_dir}/README.md", "w") as f:
        f.write(readme)
    
    return {
        "package_type": "pro_hybrid",
        "services": ["cc-bouncer", "cc-opal", "acme-demo-api", "acme-demo-frontend"],
        "ports": [8080, 7000, 8001, 3001],
        "features": ["bouncer", "opal_sync", "demo_app"],
        "control_plane_url": f"https://controlcore-pro-{user_id[:8]}.controlcore.io",
        "deployment_type": "hybrid"
    }

def generate_custom_package(user_id: str, package_dir: str) -> Dict[str, Any]:
    """Generate Custom deployment package - Full self-hosted deployment (Control Plane + Bouncer)."""
    
    # Create docker-compose.yml for full self-hosted deployment
    docker_compose = f"""
version: '3.8'

services:
  cc-pap-api:
    image: controlcore/cc-pap-api:latest
    container_name: cc-pap-api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@cc-db:5432/control_core_db
      - SECRET_KEY=your-secret-key-here
      - DEPLOYMENT_TYPE=custom
    depends_on:
      - cc-db
    volumes:
      - ./config:/app/config
      - ./policies:/app/policies

  cc-db:
    image: postgres:15
    container_name: cc-db
    environment:
      - POSTGRES_DB=control_core_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d

  cc-frontend:
    image: controlcore/cc-frontend:latest
    container_name: cc-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - DEPLOYMENT_TYPE=custom
    depends_on:
      - cc-pap-api

  cc-bouncer:
    image: controlcore/cc-bouncer:latest
    container_name: cc-bouncer
    ports:
      - "8080:8080"
    environment:
      # Basic Configuration
      - BOUNCER_PORT=8080
      - TARGET_HOST=localhost:8000
      - PAP_API_URL=http://cc-pap-api:8000
      - OPAL_SERVER_URL=http://cc-opal:7000
      - DEPLOYMENT_TYPE=custom
      - TENANT_ID={user_id}
      - API_KEY=your-api-key-here
      - LOG_ENABLED=true
      - CACHE_ENABLED=true
      
      # Resource Auto-Discovery Configuration
      # IMPORTANT: Configure these variables to match your resource
      - BOUNCER_ID=bouncer-{user_id[:8]}-1
      - BOUNCER_NAME=My First Bouncer
      - BOUNCER_TYPE=reverse-proxy
      - RESOURCE_NAME=My API  # CHANGE THIS: Name of your resource
      - RESOURCE_TYPE=api  # CHANGE THIS: api, webapp, database, ai-agent, mcp-server
      - ORIGINAL_HOST_URL=https://api.yourcompany.com  # CHANGE THIS
      - SECURITY_POSTURE=deny-all
      - DEPLOYMENT_PLATFORM=docker
      - ENVIRONMENT=production
    depends_on:
      - cc-pap-api
      - cc-opal

  cc-opal:
    image: controlcore/cc-opal:latest
    container_name: cc-opal
    ports:
      - "7000:7000"
    environment:
      - OPAL_POLICY_REPO_URL=https://github.com/controlcore/policies
      - OPAL_DATA_SOURCES_CONFIG=./config/data-sources.json
      - DEPLOYMENT_TYPE=custom
    volumes:
      - ./config:/app/config

  # Optional: Demo app for testing
  acme-demo-api:
    image: controlcore/acme-demo-api:latest
    container_name: acme-demo-api
    ports:
      - "8001:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@acme-db:5432/acme_demo_db
    depends_on:
      - acme-db

  acme-demo-db:
    image: postgres:15
    container_name: acme-demo-db
    environment:
      - POSTGRES_DB=acme_demo_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - acme_data:/var/lib/postgresql/data

  acme-demo-frontend:
    image: controlcore/acme-demo-frontend:latest
    container_name: acme-demo-frontend
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8001
    depends_on:
      - acme-demo-api

volumes:
  postgres_data:
  acme_data:
"""
    
    with open(f"{package_dir}/docker-compose.yml", "w") as f:
        f.write(docker_compose)
    
    # Create setup script for Custom
    setup_script = f"""#!/bin/bash

echo "🚀 Setting up Control Core Custom (Full Self-Hosted Deployment)..."

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
mkdir -p config policies init

# Set up environment variables
cat > .env << EOF
# Control Core Custom Configuration
TENANT_ID={user_id}
SECRET_KEY=your-secret-key-here
DEPLOYMENT_TYPE=custom

# Database Configuration
POSTGRES_DB=control_core_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# GitHub Repository (for policy management)
GITHUB_REPO_URL=https://github.com/controlcore/policies
GITHUB_TOKEN=your-github-token-here

# OPAL Configuration
OPAL_POLICY_REPO_URL=https://github.com/controlcore/policies
OPAL_DATA_SOURCES_CONFIG=./config/data-sources.json
EOF

echo "📝 Please update the .env file with your secret key and configuration"

# Start the services
echo "🐳 Starting Control Core (Full Stack)..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 60

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Control Core Custom is now running!"
echo ""
echo "📱 Access your services:"
echo "   • Control Core Admin: http://localhost:3000"
echo "   • Control Core API: http://localhost:8000"
echo "   • Demo App: http://localhost:3001"
echo "   • Bouncer: http://localhost:8080"
echo ""
echo "🔐 Your Control Plane is self-hosted:"
echo "   • Admin UI: http://localhost:3000"
echo "   • API: http://localhost:8000"
echo "   • Login with your Control Core account"
echo "   • Dedicated Account Manager: Your dedicated support team"
echo ""
echo "📚 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Sign in with your Control Core account"
echo "   3. Create your first policy"
echo "   4. Configure the Bouncer to protect your applications"
echo "   5. Contact your dedicated account manager for advanced configuration"
echo ""
echo "🆘 Need help? Contact your dedicated account manager or info@controlcore.io"
"""
    
    with open(f"{package_dir}/setup.sh", "w") as f:
        f.write(setup_script)
    
    os.chmod(f"{package_dir}/setup.sh", 0o755)
    
    # Create README for Custom
    readme = f"""# Control Core Custom - Full Self-Hosted Deployment

Welcome to Control Core Custom! This package contains your complete self-hosted Control Core platform with dedicated support.

## Architecture

**Full Self-Hosted Deployment:**
- **Control Plane**: Self-hosted in your environment (http://localhost:3000)
- **Bouncer (PEP)**: Self-hosted in your environment (http://localhost:8080)
- **OPAL**: Self-hosted for policy synchronization
- **Database**: PostgreSQL for Control Core and demo app
- **Dedicated Account Manager**: Personal support team

## What's Included

- **Control Core Admin UI**: Policy management interface - Self-hosted
- **Control Core API**: Policy Administration Point - Self-hosted
- **The Bouncer**: Policy Enforcement Point (PEP) - Self-hosted
- **OPAL**: Policy synchronization service - Self-hosted
- **Demo App**: ACME Consulting demo application (optional)
- **Database**: PostgreSQL for Control Core and demo app
- **Dedicated Support**: Personal account manager

## Quick Start

1. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

2. **Access your Control Plane:**
   - Open http://localhost:3000 in your browser
   - Sign in with your Control Core account

3. **Configure your Bouncer:**
   - The Bouncer will automatically sync policies from the Control Plane
   - Access Bouncer at http://localhost:8080

## Configuration

Update the `.env` file with your settings:
- Set your SECRET_KEY (provided in your Control Core account)
- Configure GitHub repository for policy management
- Set up data sources for OPAL

## Custom Plan Features

**Custom Plan (Contact for pricing):**
- ✅ Full Self-Hosted Deployment
- ✅ Unlimited Active Policies
- ✅ Custom Permissions Scanner
- ✅ Smart Rules Recommender
- ✅ Unlimited Decisions
- ✅ Unlimited Identities
- ✅ Extended Log Retention (3-5 years)
- ✅ Dedicated Account Manager
- ✅ Personal Support Team

## Support

- 👤 Dedicated Account Manager: Personal support team
- 📧 Email: info@controlcore.io
- 💬 Chat: Discord.gg/HjhcT572
- 📚 Docs: docs.controlcore.io

Enjoy your Control Core Custom experience!
"""
    
    with open(f"{package_dir}/README.md", "w") as f:
        f.write(readme)
    
    return {
        "package_type": "custom_self_hosted",
        "services": ["cc-pap-api", "cc-frontend", "cc-bouncer", "cc-opal", "acme-demo-api", "acme-demo-frontend"],
        "ports": [3000, 8000, 8080, 7000, 8001, 3001],
        "features": ["admin_ui", "policy_management", "bouncer", "opal_sync", "demo_app", "dedicated_support"],
        "control_plane_url": "http://localhost:3000",
        "deployment_type": "full_self_hosted",
        "account_manager": True
    }
