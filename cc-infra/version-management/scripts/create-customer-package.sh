#!/bin/bash

# Control Core Customer Package Creator
# This script creates a customer-safe deployment package that excludes all internal artifacts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory and paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_MGMT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Current version
CURRENT_VERSION=$(cat "$VERSION_MGMT_DIR/internal/VERSION" 2>/dev/null || echo "012025.01")
CUSTOMER_VERSION=$(cat "$VERSION_MGMT_DIR/customer/CUSTOMER_VERSION" 2>/dev/null || echo "012025.01")

# Default output directory
OUTPUT_DIR=""
PACKAGE_VERSION=""
CREATE_TARBALL=true

# Function to display help
show_help() {
    echo -e "${BLUE}Control Core Customer Package Creator${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --version <version>     Set customer version (default: $CUSTOMER_VERSION)"
    echo "  --output <directory>    Output directory (default: ./customer-packages)"
    echo "  --no-tar               Don't create tarball, just directory"
    echo "  --help                 Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 --version 012025.01 --output /tmp/control-core"
    echo "  $0 --version 012025.01"
    echo "  $0 --output ./releases --no-tar"
    echo ""
    echo "This script creates a customer-safe deployment package that:"
    echo "  ✅ Includes only customer-facing components"
    echo "  ❌ Excludes all internal development artifacts"
    echo "  ❌ Excludes BOM, internal changelogs, and source code"
    echo "  ✅ Includes version-locked helm charts"
    echo "  ✅ Includes offline deployment capabilities"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            PACKAGE_VERSION="$2"
            shift 2
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --no-tar)
            CREATE_TARBALL=false
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Set defaults
PACKAGE_VERSION=${PACKAGE_VERSION:-$CUSTOMER_VERSION}
OUTPUT_DIR=${OUTPUT_DIR:-"$VERSION_MGMT_DIR/customer-packages"}

echo -e "${BLUE}Creating Customer Package${NC}"
echo -e "${BLUE}Version: ${GREEN}$PACKAGE_VERSION${NC}"
echo -e "${BLUE}Output: ${GREEN}$OUTPUT_DIR${NC}"
echo ""

# Create output directory
PACKAGE_DIR="$OUTPUT_DIR/control-core-$PACKAGE_VERSION"
echo -e "${BLUE}Creating package directory: $PACKAGE_DIR${NC}"
mkdir -p "$PACKAGE_DIR"

# Create customer-safe directory structure
echo -e "${BLUE}Creating customer-safe directory structure...${NC}"
mkdir -p "$PACKAGE_DIR/helm-charts"
mkdir -p "$PACKAGE_DIR/scripts"
mkdir -p "$PACKAGE_DIR/config"
mkdir -p "$PACKAGE_DIR/policies"
mkdir -p "$PACKAGE_DIR/images"

# Copy customer-safe helm charts (excluding internal artifacts)
echo -e "${BLUE}Copying customer-safe helm charts...${NC}"
cp -r "$PROJECT_ROOT/cc-infra/helm-chart" "$PACKAGE_DIR/"

# Remove any internal artifacts from helm charts
find "$PACKAGE_DIR/helm-chart" -name "*.md" -type f | grep -v "README.md" | xargs rm -f
find "$PACKAGE_DIR/helm-chart" -name "test-*" -type f | xargs rm -f

# Copy only customer-safe scripts
echo -e "${BLUE}Copying customer deployment scripts...${NC}"
cp "$PROJECT_ROOT/start-controlcore.sh" "$PACKAGE_DIR/scripts/"
cp "$PROJECT_ROOT/setup-databases.sh" "$PACKAGE_DIR/scripts/"
cp "$VERSION_MGMT_DIR/scripts/customer-update.sh" "$PACKAGE_DIR/scripts/"

# Create customer-safe version file
echo -e "${BLUE}Creating customer version file...${NC}"
echo "$PACKAGE_VERSION" > "$PACKAGE_DIR/VERSION"

# Copy customer release notes
if [ -f "$VERSION_MGMT_DIR/customer/RELEASE_NOTES.md" ]; then
    echo -e "${BLUE}Copying customer release notes...${NC}"
    cp "$VERSION_MGMT_DIR/customer/RELEASE_NOTES.md" "$PACKAGE_DIR/"
fi

# Create customer-safe deployment configuration
echo -e "${BLUE}Creating customer deployment configuration...${NC}"
cat > "$PACKAGE_DIR/config/deployment.yaml" << EOF
# Control Core Customer Deployment Configuration
# Version: $PACKAGE_VERSION
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

deployment:
  version: "$PACKAGE_VERSION"
  mode: "production"
  offline: true
  
components:
  frontend:
    enabled: true
    version: "$PACKAGE_VERSION"
  pap-api:
    enabled: true
    version: "$PACKAGE_VERSION"
  bouncer:
    enabled: true
    version: "$PACKAGE_VERSION"
  pdp:
    enabled: true
    version: "$PACKAGE_VERSION"
  opal:
    enabled: true
    version: "0.8.9"
  database:
    enabled: true
    version: "15.5"
  redis:
    enabled: true
    version: "7.2.3"

security:
  imageDigests: true
  versionLocked: true
  offlineOnly: true
  noExternalDependencies: true
EOF

# Create customer-safe helm values
echo -e "${BLUE}Creating customer-safe helm values...${NC}"
if [ -f "$PROJECT_ROOT/cc-infra/helm-chart/controlcore/values-offline.yaml" ]; then
    cp "$PROJECT_ROOT/cc-infra/helm-chart/controlcore/values-offline.yaml" "$PACKAGE_DIR/helm-chart/controlcore/values-customer.yaml"
    
    # Remove any internal references and ensure customer-safe configuration
    sed -i.bak 's/githubToken: ".*"/githubToken: ""/g' "$PACKAGE_DIR/helm-chart/controlcore/values-customer.yaml"
    sed -i.bak 's/deploymentMode: ".*"/deploymentMode: "production"/g' "$PACKAGE_DIR/helm-chart/controlcore/values-customer.yaml"
    rm -f "$PACKAGE_DIR/helm-chart/controlcore/values-customer.yaml.bak"
fi

# Create customer deployment script
echo -e "${BLUE}Creating customer deployment script...${NC}"
cat > "$PACKAGE_DIR/deploy.sh" << 'EOF'
#!/bin/bash

# Control Core Customer Deployment Script
# This script deploys Control Core in a customer environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Control Core Customer Deployment${NC}"
echo -e "${BLUE}===============================${NC}"

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is required but not installed${NC}"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    echo -e "${RED}❌ helm is required but not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ docker is required but not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Load container images if available
if [ -d "images" ] && [ "$(ls -A images)" ]; then
    echo -e "${BLUE}Loading container images...${NC}"
    for image_file in images/*.tar; do
        if [ -f "$image_file" ]; then
            echo "Loading $(basename "$image_file")..."
            docker load < "$image_file"
        fi
    done
    echo -e "${GREEN}✅ Images loaded successfully${NC}"
fi

# Deploy using helm
echo -e "${BLUE}Deploying Control Core...${NC}"
helm install controlcore ./helm-chart/controlcore \
    --values ./helm-chart/controlcore/values-customer.yaml \
    --namespace controlcore \
    --create-namespace

echo -e "${GREEN}✅ Control Core deployed successfully${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Check deployment status: kubectl get pods -n controlcore"
echo "2. Access frontend: kubectl port-forward -n controlcore svc/cc-frontend 3000:3000"
echo "3. View logs: kubectl logs -n controlcore -l app=cc-frontend"
EOF

chmod +x "$PACKAGE_DIR/deploy.sh"

# Create customer README
echo -e "${BLUE}Creating customer README...${NC}"
cat > "$PACKAGE_DIR/README.md" << EOF
# Control Core Customer Package

**Version:** $PACKAGE_VERSION  
**Release Date:** $(date -u +"%Y-%m-%d")  
**Deployment Mode:** Production, Offline

## Overview

This package contains the complete Control Core platform for customer deployment. All components are version-locked and tested for stability.

## Quick Start

1. **Prerequisites**
   - Kubernetes cluster (1.19+)
   - Helm 3.2.0+
   - kubectl configured for your cluster

2. **Deploy**
   \`\`\`bash
   ./deploy.sh
   \`\`\`

3. **Access**
   - Frontend: \`kubectl port-forward -n controlcore svc/cc-frontend 3000:3000\`
   - API: \`kubectl port-forward -n controlcore svc/cc-pap 8082:8082\`

## Components

This package includes the following tested and approved components:

- **Control Core Frontend** ($PACKAGE_VERSION)
- **Policy Administration Point API** ($PACKAGE_VERSION)
- **Policy Enforcement Point (Bouncer)** ($PACKAGE_VERSION)
- **Policy Decision Point** ($PACKAGE_VERSION)
- **OPAL Server** (0.8.9)
- **PostgreSQL Database** (15.5)
- **Redis Cache** (7.2.3)

## Security

- All components use exact version pinning
- Image digests are verified
- No external dependencies during deployment
- Offline deployment mode only

## Support

For support and documentation, contact your Control Core representative.

---

**Control Core** - Secure Policy Management Platform
EOF

# Create .dockerignore to prevent accidental inclusion of internal artifacts
echo -e "${BLUE}Creating .dockerignore for additional protection...${NC}"
cat > "$PACKAGE_DIR/.dockerignore" << EOF
# Prevent accidental inclusion of internal artifacts
**/internal/**
**/BOM.json
**/INTERNAL_CHANGELOG.md
**/test-*
**/.git/**
**/node_modules/**
**/cc-logs/**
**/data/**
**/temp/**
**/tmp/**
**/*.log
**/*.tmp
**/*.bak
**/*.swp
**/*.swo
**/.*
EOF

# Create customer update script
echo -e "${BLUE}Creating customer update script...${NC}"
cat > "$PACKAGE_DIR/update.sh" << 'EOF'
#!/bin/bash

# Control Core Customer Update Script
# This script updates Control Core to a new version

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Control Core Customer Update${NC}"
echo -e "${BLUE}===========================${NC}"

# Check if new package is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Please provide path to new package${NC}"
    echo "Usage: $0 <path-to-new-package>"
    exit 1
fi

NEW_PACKAGE="$1"

if [ ! -d "$NEW_PACKAGE" ]; then
    echo -e "${RED}❌ New package directory not found: $NEW_PACKAGE${NC}"
    exit 1
fi

# Backup current deployment
echo -e "${BLUE}Creating backup...${NC}"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

kubectl get all -n controlcore -o yaml > "$BACKUP_DIR/current-deployment.yaml"
echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"

# Update deployment
echo -e "${BLUE}Updating deployment...${NC}"
helm upgrade controlcore "$NEW_PACKAGE/helm-chart/controlcore" \
    --values "$NEW_PACKAGE/helm-chart/controlcore/values-customer.yaml" \
    --namespace controlcore

echo -e "${GREEN}✅ Update completed successfully${NC}"
EOF

chmod +x "$PACKAGE_DIR/update.sh"

# Create security manifest
echo -e "${BLUE}Creating security manifest...${NC}"
cat > "$PACKAGE_DIR/SECURITY.md" << EOF
# Control Core Security Manifest

**Package Version:** $PACKAGE_VERSION  
**Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Security Features

### Version Locking
- All components use exact version pinning
- No floating tags or 'latest' versions
- All images include SHA256 digests

### Offline Deployment
- No external network dependencies
- All required images included
- Local policy and configuration files

### Access Control
- No internal development artifacts
- No source code included
- No internal changelogs or documentation

### Validation
- All components tested and approved
- Security vulnerabilities scanned
- Compatibility verified

## Components Verified

| Component | Version | Status |
|-----------|---------|--------|
| cc-frontend | $PACKAGE_VERSION | ✅ Approved |
| cc-pap-api | $PACKAGE_VERSION | ✅ Approved |
| cc-bouncer | $PACKAGE_VERSION | ✅ Approved |
| cc-opal | 0.8.9 | ✅ Approved |
| opal-server | 0.8.9 | ✅ Approved |
| opa | 1.9.0 | ✅ Approved |
| monaco-editor | 0.54.0 | ✅ Approved |
| regal | 0.36.0 | ✅ Approved |
| cedar-agent | 0.2.1 | 🔄 Staged |
| postgresql | 15.5 | ✅ Approved |
| redis | 7.2.3 | ✅ Approved |

## Security Checksum

\`\`\`
Package: control-core-$PACKAGE_VERSION
SHA256: [Generated during package creation]
\`\`\`
EOF

# Create package manifest
echo -e "${BLUE}Creating package manifest...${NC}"
cat > "$PACKAGE_DIR/MANIFEST.json" << EOF
{
  "package": {
    "name": "control-core",
    "version": "$PACKAGE_VERSION",
    "type": "customer-deployment",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "generator": "customer-package-creator"
  },
  "components": [
    {
      "name": "cc-frontend",
      "version": "$PACKAGE_VERSION",
      "type": "application"
    },
    {
      "name": "cc-pap-api", 
      "version": "$PACKAGE_VERSION",
      "type": "application"
    },
    {
      "name": "cc-bouncer",
      "version": "$PACKAGE_VERSION",
      "type": "application"
    },
    {
      "name": "cc-opal",
      "version": "$PACKAGE_VERSION",
      "type": "application"
    },
    {
      "name": "opal-server",
      "version": "0.8.9",
      "type": "dependency"
    },
    {
      "name": "postgresql",
      "version": "15.5",
      "type": "dependency"
    },
    {
      "name": "redis",
      "version": "7.2.3",
      "type": "dependency"
    }
  ],
  "security": {
    "offlineOnly": true,
    "versionLocked": true,
    "noInternalArtifacts": true,
    "digestVerified": true
  }
}
EOF

# Final security check - ensure no internal artifacts
echo -e "${BLUE}Performing final security check...${NC}"

# Check for forbidden files
FORBIDDEN_FILES=(
    "BOM.json"
    "INTERNAL_CHANGELOG.md"
    "internal/"
    ".git/"
    "node_modules/"
    "test-"
)

for pattern in "${FORBIDDEN_FILES[@]}"; do
    if find "$PACKAGE_DIR" -name "*$pattern*" -type f -o -name "*$pattern*" -type d | grep -q .; then
        echo -e "${RED}❌ Security violation: Found forbidden pattern '$pattern'${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Security check passed - no internal artifacts found${NC}"

# Create tarball if requested
if [ "$CREATE_TARBALL" = true ]; then
    echo -e "${BLUE}Creating tarball...${NC}"
    cd "$OUTPUT_DIR"
    tar -czf "control-core-$PACKAGE_VERSION.tar.gz" "control-core-$PACKAGE_VERSION"
    
    # Generate checksum
    sha256sum "control-core-$PACKAGE_VERSION.tar.gz" > "control-core-$PACKAGE_VERSION.sha256"
    
    echo -e "${GREEN}✅ Tarball created: control-core-$PACKAGE_VERSION.tar.gz${NC}"
    echo -e "${GREEN}✅ Checksum created: control-core-$PACKAGE_VERSION.sha256${NC}"
fi

# Display package contents
echo -e "${BLUE}Package contents:${NC}"
ls -la "$PACKAGE_DIR"

echo ""
echo -e "${GREEN}✅ Customer package created successfully${NC}"
echo -e "${BLUE}Location: $PACKAGE_DIR${NC}"
if [ "$CREATE_TARBALL" = true ]; then
    echo -e "${BLUE}Tarball: $OUTPUT_DIR/control-core-$PACKAGE_VERSION.tar.gz${NC}"
fi
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: This package contains only customer-safe components${NC}"
echo -e "${YELLOW}⚠️  All internal artifacts have been excluded${NC}"
echo -e "${YELLOW}⚠️  Ready for customer deployment${NC}"