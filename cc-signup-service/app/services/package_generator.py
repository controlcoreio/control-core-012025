"""
Package Generator Service for Control Core Signup
Generates deployment packages for self-hosted users
"""

import os
import logging
import zipfile
import tempfile
import shutil
from typing import Dict, Any, List
from datetime import datetime, timedelta
from pathlib import Path
import yaml
import json
import secrets
import string

logger = logging.getLogger(__name__)

class PackageGenerator:
    def __init__(self):
        self.templates_dir = Path(__file__).parent.parent / "templates" / "packages"
        self.output_dir = Path(__file__).parent.parent / "generated_packages"
        self.s3_bucket = os.getenv("S3_BUCKET_NAME")
        self.s3_access_key = os.getenv("S3_ACCESS_KEY")
        self.s3_secret_key = os.getenv("S3_SECRET_KEY")
        
        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def generate_packages(self, user_id: str, tier: str) -> List[Dict[str, Any]]:
        """Generate all deployment packages for a user"""
        try:
            packages = []
            
            # Generate Helm chart package
            helm_package = await self._generate_helm_package(user_id, tier)
            packages.append(helm_package)
            
            # Generate Docker Compose package
            docker_package = await self._generate_docker_compose_package(user_id, tier)
            packages.append(docker_package)
            
            # Generate binary packages for different platforms
            binary_packages = await self._generate_binary_packages(user_id, tier)
            packages.extend(binary_packages)
            
            logger.info(f"Generated {len(packages)} packages for user {user_id}")
            return packages
            
        except Exception as e:
            logger.error(f"Failed to generate packages for user {user_id}: {e}")
            raise
    
    async def _generate_helm_package(self, user_id: str, tier: str) -> Dict[str, Any]:
        """Generate Helm chart package"""
        try:
            package_id = f"helm-{user_id[:8]}-{int(datetime.utcnow().timestamp())}"
            
            # Create temporary directory
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                
                # Copy Helm chart template
                helm_template_dir = self.templates_dir / "helm"
                if helm_template_dir.exists():
                    shutil.copytree(helm_template_dir, temp_path / "controlcore")
                else:
                    # Create basic Helm chart structure
                    await self._create_helm_chart_structure(temp_path / "controlcore", user_id, tier)
                
                # Generate values.yaml
                values = await self._generate_helm_values(user_id, tier)
                with open(temp_path / "controlcore" / "values.yaml", "w") as f:
                    yaml.dump(values, f, default_flow_style=False)
                
                # Generate README
                readme_content = await self._generate_helm_readme(user_id, tier)
                with open(temp_path / "README.md", "w") as f:
                    f.write(readme_content)
                
                # Create ZIP package
                zip_path = self.output_dir / f"{package_id}.zip"
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file_path in temp_path.rglob('*'):
                        if file_path.is_file():
                            arcname = file_path.relative_to(temp_path)
                            zipf.write(file_path, arcname)
                
                # Upload to S3 if configured
                download_url = await self._upload_to_s3(zip_path, f"{package_id}.zip")
                
                return {
                    "package_id": package_id,
                    "package_type": "helm",
                    "package_format": "kubernetes",
                    "download_url": download_url,
                    "file_size": zip_path.stat().st_size,
                    "components": ["cc-pap", "cc-pap-api", "postgresql", "redis", "opa", "opal"],
                    "requirements": {
                        "kubernetes": ">=1.20.0",
                        "helm": ">=3.8.0",
                        "storage": "10Gi",
                        "memory": "4Gi",
                        "cpu": "2 cores"
                    }
                }
                
        except Exception as e:
            logger.error(f"Failed to generate Helm package: {e}")
            raise
    
    async def _generate_docker_compose_package(self, user_id: str, tier: str) -> Dict[str, Any]:
        """Generate Docker Compose package"""
        try:
            package_id = f"docker-{user_id[:8]}-{int(datetime.utcnow().timestamp())}"
            
            # Create temporary directory
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                
                # Generate docker-compose.yml
                compose_config = await self._generate_docker_compose_config(user_id, tier)
                with open(temp_path / "docker-compose.yml", "w") as f:
                    yaml.dump(compose_config, f, default_flow_style=False)
                
                # Generate .env file
                env_config = await self._generate_env_config(user_id, tier)
                with open(temp_path / ".env", "w") as f:
                    for key, value in env_config.items():
                        f.write(f"{key}={value}\n")
                
                # Generate deployment script
                deploy_script = await self._generate_deploy_script("docker")
                with open(temp_path / "deploy.sh", "w") as f:
                    f.write(deploy_script)
                os.chmod(temp_path / "deploy.sh", 0o755)
                
                # Generate README
                readme_content = await self._generate_docker_readme(user_id, tier)
                with open(temp_path / "README.md", "w") as f:
                    f.write(readme_content)
                
                # Create ZIP package
                zip_path = self.output_dir / f"{package_id}.zip"
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file_path in temp_path.rglob('*'):
                        if file_path.is_file():
                            arcname = file_path.relative_to(temp_path)
                            zipf.write(file_path, arcname)
                
                # Upload to S3 if configured
                download_url = await self._upload_to_s3(zip_path, f"{package_id}.zip")
                
                return {
                    "package_id": package_id,
                    "package_type": "docker-compose",
                    "package_format": "docker",
                    "download_url": download_url,
                    "file_size": zip_path.stat().st_size,
                    "components": ["cc-pap", "cc-pap-api", "postgresql", "redis", "opa", "opal"],
                    "requirements": {
                        "docker": ">=20.10.0",
                        "docker-compose": ">=2.0.0",
                        "storage": "10GB",
                        "memory": "4GB",
                        "cpu": "2 cores"
                    }
                }
                
        except Exception as e:
            logger.error(f"Failed to generate Docker Compose package: {e}")
            raise
    
    async def _generate_binary_packages(self, user_id: str, tier: str) -> List[Dict[str, Any]]:
        """Generate binary packages for different platforms"""
        packages = []
        platforms = ["linux-amd64", "linux-arm64", "darwin-amd64", "darwin-arm64", "windows-amd64"]
        
        for platform in platforms:
            try:
                package = await self._generate_binary_package(user_id, tier, platform)
                packages.append(package)
            except Exception as e:
                logger.error(f"Failed to generate binary package for {platform}: {e}")
        
        return packages
    
    async def _generate_binary_package(self, user_id: str, tier: str, platform: str) -> Dict[str, Any]:
        """Generate binary package for specific platform"""
        try:
            package_id = f"binary-{platform}-{user_id[:8]}-{int(datetime.utcnow().timestamp())}"
            
            # Create temporary directory
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                
                # Generate configuration files
                config = await self._generate_binary_config(user_id, tier)
                with open(temp_path / "config.yaml", "w") as f:
                    yaml.dump(config, f, default_flow_style=False)
                
                # Generate .env file
                env_config = await self._generate_env_config(user_id, tier)
                with open(temp_path / ".env", "w") as f:
                    for key, value in env_config.items():
                        f.write(f"{key}={value}\n")
                
                # Generate deployment script
                deploy_script = await self._generate_deploy_script("binary", platform)
                script_name = "deploy.sh" if platform != "windows-amd64" else "deploy.bat"
                with open(temp_path / script_name, "w") as f:
                    f.write(deploy_script)
                if platform != "windows-amd64":
                    os.chmod(temp_path / script_name, 0o755)
                
                # Generate README
                readme_content = await self._generate_binary_readme(user_id, tier, platform)
                with open(temp_path / "README.md", "w") as f:
                    f.write(readme_content)
                
                # Create ZIP package
                zip_path = self.output_dir / f"{package_id}.zip"
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file_path in temp_path.rglob('*'):
                        if file_path.is_file():
                            arcname = file_path.relative_to(temp_path)
                            zipf.write(file_path, arcname)
                
                # Upload to S3 if configured
                download_url = await self._upload_to_s3(zip_path, f"{package_id}.zip")
                
                return {
                    "package_id": package_id,
                    "package_type": "binary",
                    "package_format": platform,
                    "download_url": download_url,
                    "file_size": zip_path.stat().st_size,
                    "components": ["cc-pap", "cc-pap-api"],
                    "requirements": {
                        "os": platform.split('-')[0],
                        "architecture": platform.split('-')[1],
                        "storage": "5GB",
                        "memory": "2GB",
                        "cpu": "1 core"
                    }
                }
                
        except Exception as e:
            logger.error(f"Failed to generate binary package for {platform}: {e}")
            raise
    
    async def _generate_helm_values(self, user_id: str, tier: str) -> Dict[str, Any]:
        """Generate Helm values for user"""
        return {
            "global": {
                "user_id": user_id,
                "tier": tier,
                "telemetry": {
                    "enabled": True,
                    "endpoint": os.getenv("BAC_API_URL", "http://localhost:8001")
                }
            },
            "cc-pap": {
                "enabled": True,
                "replicaCount": 1,
                "image": {
                    "repository": "controlcore/cc-pap",
                    "tag": "latest",
                    "pullPolicy": "IfNotPresent"
                },
                "service": {
                    "type": "ClusterIP",
                    "port": 3000
                },
                "ingress": {
                    "enabled": True,
                    "hosts": [{
                        "host": "controlcore.local",
                        "paths": ["/"]
                    }]
                },
                "resources": {
                    "requests": {
                        "memory": "512Mi",
                        "cpu": "250m"
                    },
                    "limits": {
                        "memory": "1Gi",
                        "cpu": "500m"
                    }
                }
            },
            "cc-pap-api": {
                "enabled": True,
                "replicaCount": 1,
                "image": {
                    "repository": "controlcore/cc-pap-api",
                    "tag": "latest",
                    "pullPolicy": "IfNotPresent"
                },
                "service": {
                    "type": "ClusterIP",
                    "port": 8000
                },
                "resources": {
                    "requests": {
                        "memory": "256Mi",
                        "cpu": "100m"
                    },
                    "limits": {
                        "memory": "512Mi",
                        "cpu": "250m"
                    }
                }
            },
            "postgresql": {
                "enabled": True,
                "auth": {
                    "postgresPassword": self._generate_password(),
                    "username": "controlcore",
                    "password": self._generate_password(),
                    "database": "controlcore"
                },
                "primary": {
                    "persistence": {
                        "enabled": True,
                        "size": "10Gi"
                    }
                }
            },
            "redis": {
                "enabled": True,
                "auth": {
                    "enabled": True,
                    "password": self._generate_password()
                },
                "master": {
                    "persistence": {
                        "enabled": True,
                        "size": "2Gi"
                    }
                }
            },
            "opa": {
                "enabled": True,
                "replicaCount": 1,
                "image": {
                    "repository": "openpolicyagent/opa",
                    "tag": "latest",
                    "pullPolicy": "IfNotPresent"
                },
                "service": {
                    "type": "ClusterIP",
                    "port": 8181
                }
            },
            "opal": {
                "enabled": True,
                "replicaCount": 1,
                "image": {
                    "repository": "authorizon/opal-server",
                    "tag": "latest",
                    "pullPolicy": "IfNotPresent"
                },
                "service": {
                    "type": "ClusterIP",
                    "port": 7002
                }
            }
        }
    
    async def _generate_docker_compose_config(self, user_id: str, tier: str) -> Dict[str, Any]:
        """Generate Docker Compose configuration"""
        return {
            "version": "3.8",
            "services": {
                "cc-pap": {
                    "image": "controlcore/cc-pap:latest",
                    "ports": ["3000:3000"],
                    "environment": {
                        "NODE_ENV": "production",
                        "USER_ID": user_id,
                        "TIER": tier,
                        "DATABASE_URL": "postgresql://controlcore:${POSTGRES_PASSWORD}@postgres:5432/controlcore",
                        "REDIS_URL": "redis://:${REDIS_PASSWORD}@redis:6379",
                        "OPA_URL": "http://opa:8181",
                        "OPAL_URL": "http://opal:7002"
                    },
                    "depends_on": ["postgres", "redis", "opa", "opal"],
                    "volumes": ["./data/cc-pap:/app/data"],
                    "restart": "unless-stopped"
                },
                "cc-pap-api": {
                    "image": "controlcore/cc-pap-api:latest",
                    "ports": ["8000:8000"],
                    "environment": {
                        "DATABASE_URL": "postgresql://controlcore:${POSTGRES_PASSWORD}@postgres:5432/controlcore",
                        "REDIS_URL": "redis://:${REDIS_PASSWORD}@redis:6379",
                        "OPA_URL": "http://opa:8181",
                        "OPAL_URL": "http://opal:7002"
                    },
                    "depends_on": ["postgres", "redis", "opa", "opal"],
                    "restart": "unless-stopped"
                },
                "postgres": {
                    "image": "postgres:15",
                    "environment": {
                        "POSTGRES_DB": "controlcore",
                        "POSTGRES_USER": "controlcore",
                        "POSTGRES_PASSWORD": "${POSTGRES_PASSWORD}"
                    },
                    "volumes": ["./data/postgres:/var/lib/postgresql/data"],
                    "restart": "unless-stopped"
                },
                "redis": {
                    "image": "redis:7-alpine",
                    "command": "redis-server --requirepass ${REDIS_PASSWORD}",
                    "volumes": ["./data/redis:/data"],
                    "restart": "unless-stopped"
                },
                "opa": {
                    "image": "openpolicyagent/opa:latest",
                    "command": "run --server --addr=0.0.0.0:8181",
                    "ports": ["8181:8181"],
                    "restart": "unless-stopped"
                },
                "opal": {
                    "image": "authorizon/opal-server:latest",
                    "ports": ["7002:7002"],
                    "environment": {
                        "OPA_SERVER_URL": "http://opa:8181"
                    },
                    "depends_on": ["opa"],
                    "restart": "unless-stopped"
                }
            },
            "volumes": {
                "postgres_data": {},
                "redis_data": {}
            }
        }
    
    async def _generate_env_config(self, user_id: str, tier: str) -> Dict[str, str]:
        """Generate environment configuration"""
        return {
            "USER_ID": user_id,
            "TIER": tier,
            "POSTGRES_PASSWORD": self._generate_password(),
            "REDIS_PASSWORD": self._generate_password(),
            "JWT_SECRET": self._generate_password(),
            "ENCRYPTION_KEY": self._generate_password(),
            "TELEMETRY_ENDPOINT": os.getenv("BAC_API_URL", "http://localhost:8001"),
            "TELEMETRY_ENABLED": "true"
        }
    
    async def _generate_binary_config(self, user_id: str, tier: str) -> Dict[str, Any]:
        """Generate binary configuration"""
        return {
            "user_id": user_id,
            "tier": tier,
            "server": {
                "host": "0.0.0.0",
                "port": 3000
            },
            "database": {
                "type": "sqlite",
                "path": "./data/controlcore.db"
            },
            "redis": {
                "enabled": False
            },
            "opa": {
                "enabled": False
            },
            "opal": {
                "enabled": False
            },
            "telemetry": {
                "enabled": True,
                "endpoint": os.getenv("BAC_API_URL", "http://localhost:8001")
            }
        }
    
    async def _create_helm_chart_structure(self, chart_path: Path, user_id: str, tier: str):
        """Create basic Helm chart structure"""
        chart_path.mkdir(parents=True, exist_ok=True)
        
        # Chart.yaml
        chart_yaml = {
            "apiVersion": "v2",
            "name": "controlcore",
            "description": "Control Core deployment for self-hosted users",
            "type": "application",
            "version": "1.0.0",
            "appVersion": "2.0.0"
        }
        
        with open(chart_path / "Chart.yaml", "w") as f:
            yaml.dump(chart_yaml, f)
        
        # Create templates directory
        templates_dir = chart_path / "templates"
        templates_dir.mkdir(exist_ok=True)
        
        # Create basic template files (simplified)
        with open(templates_dir / "deployment.yaml", "w") as f:
            f.write("# Deployment template would go here\n")
        
        with open(templates_dir / "service.yaml", "w") as f:
            f.write("# Service template would go here\n")
        
        with open(templates_dir / "ingress.yaml", "w") as f:
            f.write("# Ingress template would go here\n")
    
    async def _generate_deploy_script(self, package_type: str, platform: str = None) -> str:
        """Generate deployment script"""
        if package_type == "helm":
            return """#!/bin/bash
set -e

echo "Deploying Control Core with Helm..."

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo "Helm is not installed. Please install Helm first."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Create namespace
kubectl create namespace controlcore --dry-run=client -o yaml | kubectl apply -f -

# Install with Helm
helm install controlcore ./controlcore --namespace controlcore

echo "Deployment complete!"
echo "Access your Control Core instance at: http://localhost:3000"
"""
        
        elif package_type == "docker":
            return """#!/bin/bash
set -e

echo "Deploying Control Core with Docker Compose..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Start services
docker-compose up -d

echo "Deployment complete!"
echo "Access your Control Core instance at: http://localhost:3000"
"""
        
        elif package_type == "binary":
            if platform == "windows-amd64":
                return """@echo off
echo Deploying Control Core Binary...

REM Check if the binary exists
if not exist "cc-pap.exe" (
    echo cc-pap.exe not found. Please download the binary first.
    exit /b 1
)

REM Create data directory
if not exist "data" mkdir data

REM Start the service
echo Starting Control Core...
cc-pap.exe --config config.yaml

echo Deployment complete!
echo Access your Control Core instance at: http://localhost:3000
"""
            else:
                return """#!/bin/bash
set -e

echo "Deploying Control Core Binary..."

# Check if the binary exists
if [ ! -f "cc-pap" ]; then
    echo "cc-pap binary not found. Please download the binary first."
    exit 1
fi

# Make binary executable
chmod +x cc-pap

# Create data directory
mkdir -p data

# Start the service
echo "Starting Control Core..."
./cc-pap --config config.yaml
"""
        
        return ""
    
    async def _generate_helm_readme(self, user_id: str, tier: str) -> str:
        """Generate Helm README"""
        return f"""# Control Core Helm Deployment

This package contains everything you need to deploy Control Core in your Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (version 1.20 or higher)
- Helm 3.8 or higher
- kubectl configured to access your cluster
- At least 4GB RAM and 2 CPU cores available
- 10GB of persistent storage

## Quick Start

1. Extract this package:
   ```bash
   unzip controlcore-helm.zip
   cd controlcore-helm
   ```

2. Deploy Control Core:
   ```bash
   ./deploy.sh
   ```

3. Access your Control Core instance:
   - URL: http://localhost:3000
   - Default credentials will be provided in the deployment output

## Configuration

Edit `controlcore/values.yaml` to customize your deployment:

- Resource limits and requests
- Ingress configuration
- Database settings
- Redis configuration

## Support

- Documentation: https://docs.controlcore.io
- Support: support@controlcore.io
- User ID: {user_id}
- Tier: {tier}
"""
    
    async def _generate_docker_readme(self, user_id: str, tier: str) -> str:
        """Generate Docker README"""
        return f"""# Control Core Docker Deployment

This package contains everything you need to deploy Control Core using Docker Compose.

## Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- At least 4GB RAM and 2 CPU cores available
- 10GB of free disk space

## Quick Start

1. Extract this package:
   ```bash
   unzip controlcore-docker.zip
   cd controlcore-docker
   ```

2. Deploy Control Core:
   ```bash
   ./deploy.sh
   ```

3. Access your Control Core instance:
   - URL: http://localhost:3000
   - Default credentials will be provided in the deployment output

## Configuration

Edit `.env` file to customize your deployment:

- Database passwords
- Redis password
- JWT secrets
- Other environment variables

## Support

- Documentation: https://docs.controlcore.io
- Support: support@controlcore.io
- User ID: {user_id}
- Tier: {tier}
"""
    
    async def _generate_binary_readme(self, user_id: str, tier: str, platform: str) -> str:
        """Generate binary README"""
        os_name = platform.split('-')[0]
        arch = platform.split('-')[1]
        
        return f"""# Control Core Binary Deployment ({platform})

This package contains the Control Core binary for {os_name} ({arch}).

## Prerequisites

- {os_name} operating system
- {arch} architecture
- At least 2GB RAM and 1 CPU core available
- 5GB of free disk space

## Quick Start

1. Extract this package:
   ```bash
   unzip controlcore-{platform}.zip
   cd controlcore-{platform}
   ```

2. Deploy Control Core:
   ```bash
   ./deploy.sh
   ```
   
   On Windows:
   ```cmd
   deploy.bat
   ```

3. Access your Control Core instance:
   - URL: http://localhost:3000
   - Default credentials will be provided in the deployment output

## Configuration

Edit `config.yaml` to customize your deployment:

- Server host and port
- Database configuration
- Feature toggles
- Telemetry settings

## Support

- Documentation: https://docs.controlcore.io
- Support: support@controlcore.io
- User ID: {user_id}
- Tier: {tier}
"""
    
    async def _upload_to_s3(self, file_path: Path, filename: str) -> str:
        """Upload file to S3 and return signed URL"""
        if not self.s3_bucket:
            # Return local file URL if S3 not configured
            return f"file://{file_path}"
        
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            s3_client = boto3.client(
                's3',
                aws_access_key_id=self.s3_access_key,
                aws_secret_access_key=self.s3_secret_key
            )
            
            # Upload file
            s3_client.upload_file(str(file_path), self.s3_bucket, filename)
            
            # Generate signed URL (7 days expiry)
            signed_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.s3_bucket, 'Key': filename},
                ExpiresIn=604800  # 7 days
            )
            
            return signed_url
            
        except Exception as e:
            logger.error(f"Failed to upload to S3: {e}")
            # Return local file URL as fallback
            return f"file://{file_path}"
    
    def _generate_password(self) -> str:
        """Generate a secure password"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(16))
        return password
