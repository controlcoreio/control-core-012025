#!/usr/bin/env python3
"""
Simple test server for cc-signup-service
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
import uvicorn
import os

app = FastAPI(
    title="Control Core Signup Service",
    description="Customer onboarding and download system for Control Core",
    version="1.0.0"
)

# Add CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cc-signup-service", "version": "1.0.0"}

@app.get("/ready")
async def readiness_check():
    return {"status": "ready", "service": "cc-signup-service"}

@app.post("/api/signup")
async def signup_test(signup_data: dict):
    """
    Handle user signup and return user details with the actual company name provided
    """
    import uuid
    
    # Generate a unique user ID
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    # Extract company name from the signup data
    company_name = signup_data.get("company_name", "Test Company")
    email = signup_data.get("email", "test@example.com")
    subscription_tier = signup_data.get("subscription_tier", "kickstart")
    billing_cycle = signup_data.get("billing_cycle", "monthly")
    
    return {
        "user_id": user_id,
        "email": email,
        "company_name": company_name,
        "subscription_tier": subscription_tier,
        "billing_cycle": billing_cycle,
        "requires_payment": False,
        "next_steps": [
            "Download your Control Plane package",
            "Deploy the Control Plane in your infrastructure",
            "Access the Getting Started Wizard"
        ]
    }

@app.get("/api/downloads/{user_id}")
async def get_downloads(user_id: str):
    return {
        "user_id": user_id,
        "packages": [
            {
                "package_id": "helm-cp",
                "package_type": "helm",
                "package_format": "kubernetes",
                "download_url": f"/api/download-file/{user_id}/helm-cp",
                "file_size": 102400,
                "components": ["Control Plane", "Database", "Redis"],
                "requirements": {"kubernetes": ">=1.20", "helm": ">=3.0"}
            },
            {
                "package_id": "docker-compose-cp",
                "package_type": "docker-compose",
                "package_format": "docker",
                "download_url": f"/api/download-file/{user_id}/docker-compose-cp",
                "file_size": 204800,
                "components": ["Control Plane", "Database", "Redis"],
                "requirements": {"docker": ">=20.0", "docker-compose": ">=2.0"}
            },
            {
                "package_id": "binary-cp",
                "package_type": "binary",
                "package_format": "standalone",
                "download_url": f"/api/download-file/{user_id}/binary-cp",
                "file_size": 51200,
                "components": ["Control Plane Binary"],
                "requirements": {"os": "linux/amd64", "memory": ">=2GB"}
            }
        ]
    }

@app.get("/api/download-file/{user_id}/{package_id}")
async def download_file(user_id: str, package_id: str):
    """Serve actual test files for download"""
    from fastapi.responses import Response
    import tempfile
    import os
    
    # Create test files based on package type
    if package_id == "helm-cp":
        # Create a test Helm chart
        helm_content = """apiVersion: v2
name: control-core-pap
description: Control Core Policy Administration Point
type: application
version: 1.0.0
appVersion: "1.0.0"

dependencies:
  - name: postgresql
    version: "12.1.9"
    repository: "https://charts.bitnami.com/bitnami"
  - name: redis
    version: "17.3.7"
    repository: "https://charts.bitnami.com/bitnami"

values:
  image:
    repository: controlcore/cc-pap
    tag: "latest"
    pullPolicy: IfNotPresent
  
  service:
    type: ClusterIP
    port: 8000
  
  ingress:
    enabled: true
    className: "nginx"
    annotations:
      nginx.ingress.kubernetes.io/rewrite-target: /
    hosts:
      - host: pap.yourdomain.com
        paths:
          - path: /
            pathType: Prefix
  
  postgresql:
    auth:
      postgresPassword: "controlcore123"
      username: "controlcore"
      password: "controlcore123"
      database: "controlcore"
  
  redis:
    auth:
      enabled: false
  
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi
"""
        return Response(
            content=helm_content,
            media_type="application/x-yaml",
            headers={
                "Content-Disposition": f"attachment; filename=control-core-pap-{user_id}.yaml"
            }
        )
    
    elif package_id == "docker-compose-cp":
        # Create a test Docker Compose file
        docker_compose_content = """version: '3.8'

services:
  control-core-pap:
    image: controlcore/cc-pap:latest
    container_name: control-core-pap
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://controlcore:controlcore123@postgres:5432/controlcore
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=your-secret-key-here
      - AUTH0_DOMAIN=your-domain.auth0.com
      - AUTH0_CLIENT_ID=your-client-id
      - AUTH0_CLIENT_SECRET=your-client-secret
    depends_on:
      - postgres
      - redis
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    networks:
      - controlcore

  postgres:
    image: postgres:15-alpine
    container_name: control-core-postgres
    environment:
      - POSTGRES_DB=controlcore
      - POSTGRES_USER=controlcore
      - POSTGRES_PASSWORD=controlcore123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - controlcore

  redis:
    image: redis:7-alpine
    container_name: control-core-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - controlcore

volumes:
  postgres_data:
  redis_data:

networks:
  controlcore:
    driver: bridge
"""
        return Response(
            content=docker_compose_content,
            media_type="application/x-yaml",
            headers={
                "Content-Disposition": f"attachment; filename=docker-compose-{user_id}.yml"
            }
        )
    
    elif package_id == "binary-cp":
        # Create a test binary installation script
        binary_content = f"""#!/bin/bash

# Control Core PAP Binary Installation Script
# Generated for user: {user_id}

set -e

echo "🚀 Installing Control Core Policy Administration Point"
echo "=================================================="

# Check system requirements
echo "📋 Checking system requirements..."

if ! command -v curl &> /dev/null; then
    echo "❌ curl is required but not installed. Please install curl first."
    exit 1
fi

echo "✅ System requirements met"

# Create installation directory
INSTALL_DIR="/opt/controlcore"
echo "📁 Creating installation directory: $INSTALL_DIR"
sudo mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# Download Control Core PAP binary
echo "⬇️  Downloading Control Core PAP binary..."
sudo curl -L -o cc-pap https://releases.controlcore.io/cc-pap/latest/cc-pap-linux-amd64
sudo chmod +x cc-pap

# Create configuration directory
echo "⚙️  Setting up configuration..."
sudo mkdir -p /etc/controlcore

# Create configuration file
sudo cat > /etc/controlcore/pap.conf << 'CONFIG_EOF'
# Control Core PAP Configuration
# Generated for user: {user_id}

[server]
host = "0.0.0.0"
port = 8000
debug = false

[database]
url = "postgresql://controlcore:controlcore123@localhost:5432/controlcore"

[redis]
url = "redis://localhost:6379"

[auth0]
domain = "your-domain.auth0.com"
client_id = "your-client-id"
client_secret = "your-client-secret"

[logging]
level = "info"
format = "json"
CONFIG_EOF

# Create systemd service
echo "🔧 Creating systemd service..."
sudo cat > /etc/systemd/system/controlcore-pap.service << 'SERVICE_EOF'
[Unit]
Description=Control Core Policy Administration Point
After=network.target

[Service]
Type=simple
User=controlcore
WorkingDirectory=/opt/controlcore
ExecStart=/opt/controlcore/cc-pap --config /etc/controlcore/pap.conf
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Create controlcore user
echo "👤 Creating controlcore user..."
sudo useradd -r -s /bin/false controlcore || true
sudo chown -R controlcore:controlcore $INSTALL_DIR

# Enable and start service
echo "🚀 Starting Control Core PAP service..."
sudo systemctl daemon-reload
sudo systemctl enable controlcore-pap
sudo systemctl start controlcore-pap

echo "✅ Installation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your database connection in /etc/controlcore/pap.conf"
echo "2. Set up Auth0 credentials"
echo "3. Access the PAP dashboard at http://localhost:8000"
echo "4. Check service status: sudo systemctl status controlcore-pap"
echo ""
echo "📚 Documentation: https://docs.controlcore.io"
echo "🆘 Support: support@controlcore.io"
"""
        
        return Response(
            content=binary_content,
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename=install-controlcore-{user_id}.sh"
            }
        )
    
    else:
        return {"error": "Package not found"}

@app.get("/api/pro-provisioning/status/{user_id}")
async def get_pro_tenant_status(user_id: str):
    return {
        "tenant_id": f"tenant_{user_id}",
        "status": "provisioning",
        "progress_percentage": 75,
        "current_step": "Configuring DNS",
        "estimated_completion_time": "5 minutes",
        "access_url": None,
        "admin_credentials": None
    }

# Serve static files
static_dir = os.path.join(os.path.dirname(__file__), "app", "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    # Also serve assets directly
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

# Serve the frontend
@app.get("/")
async def serve_frontend_root():
    index_path = os.path.join(os.path.dirname(__file__), "app", "static", "index.html")
    if os.path.exists(index_path):
        response = FileResponse(index_path, media_type="text/html")
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    return {"message": "Control Core Signup Service", "status": "running", "error": "Frontend not found"}

@app.get("/signup")
async def serve_frontend_signup():
    index_path = os.path.join(os.path.dirname(__file__), "app", "static", "index.html")
    if os.path.exists(index_path):
        response = FileResponse(index_path, media_type="text/html")
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    return {"error": "Frontend not found"}

@app.get("/plans")
async def serve_frontend_plans():
    index_path = os.path.join(os.path.dirname(__file__), "app", "static", "index.html")
    if os.path.exists(index_path):
        response = FileResponse(index_path, media_type="text/html")
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    return {"error": "Frontend not found"}

@app.get("/downloads")
async def serve_frontend_downloads():
    index_path = os.path.join(os.path.dirname(__file__), "app", "static", "index.html")
    if os.path.exists(index_path):
        response = FileResponse(index_path, media_type="text/html")
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    return {"error": "Frontend not found"}

# Serve favicon and other static assets
@app.get("/vite.svg")
async def serve_vite_svg():
    from fastapi.responses import Response
    # Return a simple SVG icon
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <rect width="32" height="32" fill="#4F46E5"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12">CC</text>
    </svg>"""
    return Response(content=svg_content, media_type="image/svg+xml")

@app.get("/logo.png")
async def serve_logo():
    logo_path = os.path.join(os.path.dirname(__file__), "frontend", "public", "logo.png")
    if os.path.exists(logo_path):
        return FileResponse(logo_path, media_type="image/png")
    return {"error": "Logo not found"}

@app.get("/favicon.ico")
async def serve_favicon():
    favicon_path = os.path.join(os.path.dirname(__file__), "frontend", "public", "favicon.ico")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path, media_type="image/x-icon")
    return {"error": "Favicon not found"}

@app.get("/controlcore-icon.svg")
async def serve_controlcore_icon():
    icon_path = os.path.join(os.path.dirname(__file__), "frontend", "public", "controlcore-icon.svg")
    if os.path.exists(icon_path):
        return FileResponse(icon_path, media_type="image/svg+xml")
    return {"error": "Control Core icon not found"}

if __name__ == "__main__":
    print("🚀 Starting cc-signup-service test server...")
    print("📍 Server will be available at: http://localhost:8001")
    print("📚 API docs will be available at: http://localhost:8001/docs")
    print("🔧 Health check: http://localhost:8001/health")
    print("-" * 50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
