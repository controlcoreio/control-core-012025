#!/bin/bash

# Control Core BOM (Bill of Materials) Manager
# This script manages the BOM for version-controlled, offline deployments

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
BOM_FILE="$VERSION_MGMT_DIR/BOM.json"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Current version
CURRENT_VERSION=$(cat "$VERSION_MGMT_DIR/internal/VERSION" 2>/dev/null || echo "012025.01")

# Function to display help
show_help() {
    echo -e "${BLUE}Control Core BOM Manager${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  validate                Validate BOM integrity and versions"
    echo "  update                  Update BOM with current version"
    echo "  check-images            Check if all images exist in registry"
    echo "  generate-offline        Generate offline deployment package"
    echo "  verify-deployment       Verify deployment readiness"
    echo "  lock-dependencies       Lock all dependencies to exact versions"
    echo "  export-helm-values     Export BOM as Helm values"
    echo "  audit-security         Audit BOM for security vulnerabilities"
    echo "  help                    Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 validate"
    echo "  $0 update"
    echo "  $0 check-images"
    echo "  $0 generate-offline"
    echo "  $0 verify-deployment"
}

# Function to validate BOM
validate_bom() {
    echo -e "${BLUE}Validating BOM for version $CURRENT_VERSION${NC}"
    
    if [ ! -f "$BOM_FILE" ]; then
        echo -e "${RED}❌ BOM file not found: $BOM_FILE${NC}"
        exit 1
    fi
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required but not installed${NC}"
        exit 1
    fi
    
    # Validate JSON structure
    if ! jq empty "$BOM_FILE" 2>/dev/null; then
        echo -e "${RED}❌ BOM file is not valid JSON${NC}"
        exit 1
    fi
    
    # Check version consistency
    local bom_version=$(jq -r '.metadata.component.version' "$BOM_FILE")
    if [ "$bom_version" != "$CURRENT_VERSION" ]; then
        echo -e "${YELLOW}⚠️  BOM version ($bom_version) doesn't match current version ($CURRENT_VERSION)${NC}"
        echo -e "${BLUE}Run '$0 update' to sync versions${NC}"
    else
        echo -e "${GREEN}✅ BOM version matches current version${NC}"
    fi
    
    # Validate required components
    local required_components=(
        "cc-frontend"
        "cc-pap-api"
        "cc-bouncer"
        "cc-opal"
        "cc-pap"
        "cc-bouncer"
        "opal-server"
        "postgresql"
        "redis"
        "nginx"
    )
    
    echo -e "${BLUE}Validating required components...${NC}"
    for component in "${required_components[@]}"; do
        if jq -e ".components[] | select(.name == \"$component\")" "$BOM_FILE" > /dev/null; then
            local version=$(jq -r ".components[] | select(.name == \"$component\") | .version" "$BOM_FILE")
            echo -e "  ${GREEN}✅${NC} $component: $version"
        else
            echo -e "  ${RED}❌${NC} $component: Missing from BOM"
        fi
    done
    
    # Check approval status
    local approval_status=$(jq -r '.approvalStatus' "$BOM_FILE")
    if [ "$approval_status" = "approved" ]; then
        echo -e "${GREEN}✅ BOM is approved for deployment${NC}"
    else
        echo -e "${RED}❌ BOM is not approved for deployment${NC}"
        exit 1
    fi
    
    # Check offline compatibility
    local offline_compatible=$(jq -r '.offlineCompatible' "$BOM_FILE")
    if [ "$offline_compatible" = "true" ]; then
        echo -e "${GREEN}✅ BOM is offline compatible${NC}"
    else
        echo -e "${RED}❌ BOM is not offline compatible${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ BOM validation completed successfully${NC}"
}

# Function to update BOM with current version
update_bom() {
    echo -e "${BLUE}Updating BOM to version $CURRENT_VERSION${NC}"
    
    if [ ! -f "$BOM_FILE" ]; then
        echo -e "${RED}❌ BOM file not found: $BOM_FILE${NC}"
        exit 1
    fi
    
    # Update main version
    jq ".metadata.component.version = \"$CURRENT_VERSION\"" "$BOM_FILE" > "$BOM_FILE.tmp" && mv "$BOM_FILE.tmp" "$BOM_FILE"
    
    # Update Control Core components to current version
    local cc_components=(
        "cc-frontend"
        "cc-pap-api"
        "cc-bouncer"
        "cc-opal"
        "cc-pap"
        "cc-bouncer"
    )
    
    for component in "${cc_components[@]}"; do
        # Update version
        jq ".components[] |= if .name == \"$component\" then .version = \"$CURRENT_VERSION\" else . end" "$BOM_FILE" > "$BOM_FILE.tmp" && mv "$BOM_FILE.tmp" "$BOM_FILE"
        
        # Update image tag
        jq ".components[] |= if .name == \"$component\" then (.properties[] |= if .name == \"tag\" then .value = \"$CURRENT_VERSION\" else . end) else . end" "$BOM_FILE" > "$BOM_FILE.tmp" && mv "$BOM_FILE.tmp" "$BOM_FILE"
        
        # Update full image name
        jq ".components[] |= if .name == \"$component\" then (.properties[] |= if .name == \"image\" then .value = (.value | split(\":\")[0] + \":$CURRENT_VERSION\") else . end) else . end" "$BOM_FILE" > "$BOM_FILE.tmp" && mv "$BOM_FILE.tmp" "$BOM_FILE"
    done
    
    # Update timestamp
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    jq ".metadata.timestamp = \"$timestamp\"" "$BOM_FILE" > "$BOM_FILE.tmp" && mv "$BOM_FILE.tmp" "$BOM_FILE"
    jq ".lastValidated = \"$timestamp\"" "$BOM_FILE" > "$BOM_FILE.tmp" && mv "$BOM_FILE.tmp" "$BOM_FILE"
    
    echo -e "${GREEN}✅ BOM updated to version $CURRENT_VERSION${NC}"
}

# Function to check if images exist in registry
check_images() {
    echo -e "${BLUE}Checking image availability in registries${NC}"
    
    if [ ! -f "$BOM_FILE" ]; then
        echo -e "${RED}❌ BOM file not found: $BOM_FILE${NC}"
        exit 1
    fi
    
    # Check if docker is available
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker not available, skipping image checks${NC}"
        return 0
    fi
    
    # Extract images from BOM
    local images=$(jq -r '.components[] | select(.properties[] | select(.name == "image")) | .properties[] | select(.name == "image") | .value' "$BOM_FILE")
    
    echo -e "${BLUE}Checking ${#images[@]} images...${NC}"
    for image in $images; do
        echo -n "  Checking $image... "
        if docker manifest inspect "$image" > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${RED}❌${NC}"
        fi
    done
}

# Function to generate offline deployment package
generate_offline() {
    echo -e "${BLUE}Generating offline deployment package${NC}"
    
    local package_dir="$VERSION_MGMT_DIR/offline-packages/control-core-$CURRENT_VERSION"
    mkdir -p "$package_dir"
    
    # Copy BOM
    cp "$BOM_FILE" "$package_dir/"
    
    # Copy helm charts
    cp -r "$PROJECT_ROOT/cc-infra/helm-chart" "$package_dir/"
    
    # Copy deployment scripts
    cp "$PROJECT_ROOT/start-controlcore.sh" "$package_dir/"
    cp "$PROJECT_ROOT/setup-databases.sh" "$PROJECT_ROOT/version-manager.sh" "$package_dir/"
    
    # Create image list for offline loading
    echo -e "${BLUE}Creating image list for offline deployment...${NC}"
    jq -r '.components[] | select(.properties[] | select(.name == "image")) | .properties[] | select(.name == "image") | .value' "$BOM_FILE" > "$package_dir/images.txt"
    
    # Create offline deployment script
    cat > "$package_dir/offline-deploy.sh" << 'EOF'
#!/bin/bash
# Offline Control Core Deployment Script
# This script deploys Control Core using pre-downloaded images

set -e

echo "Control Core Offline Deployment"
echo "================================"

# Load images
if [ -f "images.txt" ]; then
    echo "Loading container images..."
    while IFS= read -r image; do
        echo "Loading $image..."
        docker load < "images/${image//[\/:]/_}.tar"
    done < images.txt
fi

# Deploy using helm
echo "Deploying Control Core..."
helm install controlcore ./helm-chart/controlcore --values ./helm-chart/controlcore/values-offline.yaml

echo "Deployment completed!"
EOF
    
    chmod +x "$package_dir/offline-deploy.sh"
    
    echo -e "${GREEN}✅ Offline package created: $package_dir${NC}"
    echo -e "${BLUE}Package contents:${NC}"
    ls -la "$package_dir"
}

# Function to verify deployment readiness
verify_deployment() {
    echo -e "${BLUE}Verifying deployment readiness${NC}"
    
    # Validate BOM first
    validate_bom
    
    # Check required files
    local required_files=(
        "$PROJECT_ROOT/cc-infra/helm-chart/controlcore/Chart.yaml"
        "$PROJECT_ROOT/cc-infra/helm-chart/controlcore/values.yaml"
        "$PROJECT_ROOT/start-controlcore.sh"
    )
    
    echo -e "${BLUE}Checking required files...${NC}"
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "  ${GREEN}✅${NC} $file"
        else
            echo -e "  ${RED}❌${NC} $file"
        fi
    done
    
    # Check helm chart
    if command -v helm &> /dev/null; then
        echo -e "${BLUE}Validating Helm chart...${NC}"
        if helm lint "$PROJECT_ROOT/cc-infra/helm-chart/controlcore" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✅${NC} Helm chart is valid"
        else
            echo -e "  ${RED}❌${NC} Helm chart validation failed"
        fi
    fi
    
    echo -e "${GREEN}✅ Deployment readiness verification completed${NC}"
}

# Function to lock dependencies
lock_dependencies() {
    echo -e "${BLUE}Locking all dependencies to exact versions${NC}"
    
    # Update BOM with locked versions
    update_bom
    
    # Update helm values to use exact versions
    local helm_values="$PROJECT_ROOT/cc-infra/helm-chart/controlcore/values.yaml"
    
    if [ -f "$helm_values" ]; then
        echo -e "${BLUE}Updating Helm values with locked versions...${NC}"
        
        # Read components from BOM and update helm values
        local components=$(jq -r '.components[] | select(.name | startswith("cc-")) | "\(.name):\(.version)"' "$BOM_FILE")
        
        for component_info in $components; do
            local component_name=$(echo "$component_info" | cut -d':' -f1)
            local component_version=$(echo "$component_info" | cut -d':' -f2)
            
            # Map component names to helm values paths
            case $component_name in
                "cc-frontend")
                    sed -i.bak "s/tag: latest/tag: $component_version/g" "$helm_values"
                    ;;
                "cc-pap-api")
                    sed -i.bak "s/tag: latest/tag: $component_version/g" "$helm_values"
                    ;;
                "cc-bouncer")
                    sed -i.bak "s/tag: latest/tag: $component_version/g" "$helm_values"
                    ;;
            esac
        done
        
        rm -f "$helm_values.bak"
        echo -e "${GREEN}✅ Helm values updated with locked versions${NC}"
    fi
    
    echo -e "${GREEN}✅ All dependencies locked to exact versions${NC}"
}

# Function to export BOM as Helm values
export_helm_values() {
    echo -e "${BLUE}Exporting BOM as Helm values${NC}"
    
    local output_file="$VERSION_MGMT_DIR/helm-values-from-bom.yaml"
    
    cat > "$output_file" << EOF
# Helm values generated from BOM
# Version: $CURRENT_VERSION
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

global:
  version: "$CURRENT_VERSION"
  bomVersion: "$CURRENT_VERSION"
  offlineMode: true

# Image versions from BOM
images:
EOF
    
    # Extract image information from BOM
    jq -r '.components[] | select(.properties[] | select(.name == "image")) | "  \(.name): \(.properties[] | select(.name == "image") | .value)"' "$BOM_FILE" >> "$output_file"
    
    echo -e "${GREEN}✅ Helm values exported: $output_file${NC}"
}

# Function to audit security
audit_security() {
    echo -e "${BLUE}Auditing BOM for security vulnerabilities${NC}"
    
    # Check for known vulnerable base images
    local vulnerable_images=(
        "alpine:3.15"
        "ubuntu:20.04"
        "node:16"
    )
    
    echo -e "${BLUE}Checking for known vulnerable base images...${NC}"
    for vulnerable_image in "${vulnerable_images[@]}"; do
        if jq -e ".components[] | select(.properties[] | select(.name == \"image\" and .value | contains(\"$vulnerable_image\")))" "$BOM_FILE" > /dev/null; then
            echo -e "  ${YELLOW}⚠️${NC} Potentially vulnerable image found: $vulnerable_image"
        fi
    done
    
    # Check image digest availability
    echo -e "${BLUE}Checking image digest availability...${NC}"
    local components_without_digest=$(jq -r '.components[] | select(.properties[] | select(.name == "digest" and .value == "")) | .name' "$BOM_FILE")
    
    if [ -n "$components_without_digest" ]; then
        echo -e "  ${YELLOW}⚠️${NC} Components without digest:"
        for component in $components_without_digest; do
            echo -e "    - $component"
        done
    else
        echo -e "  ${GREEN}✅${NC} All components have digests"
    fi
    
    echo -e "${GREEN}✅ Security audit completed${NC}"
}

# Main script logic
case "${1:-help}" in
    validate)
        validate_bom
        ;;
    update)
        update_bom
        ;;
    check-images)
        check_images
        ;;
    generate-offline)
        generate_offline
        ;;
    verify-deployment)
        verify_deployment
        ;;
    lock-dependencies)
        lock_dependencies
        ;;
    export-helm-values)
        export_helm_values
        ;;
    audit-security)
        audit_security
        ;;
    help|*)
        show_help
        ;;
esac
