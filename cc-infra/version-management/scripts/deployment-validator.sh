#!/bin/bash

# Control Core Deployment Validator
# This script validates that deployments only use approved, version-locked components

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
    echo -e "${BLUE}Control Core Deployment Validator${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  validate-helm-chart    Validate helm chart for customer safety"
    echo "  validate-bom           Validate BOM integrity"
    echo "  check-internal-leaks   Check for internal artifact leaks"
    echo "  validate-images        Validate all container images"
    echo "  pre-deployment         Full pre-deployment validation"
    echo "  customer-package       Validate customer package"
    echo "  help                   Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 validate-helm-chart ./helm-chart"
    echo "  $0 check-internal-leaks"
    echo "  $0 pre-deployment"
    echo "  $0 customer-package ./customer-package"
}

# Function to validate helm chart
validate_helm_chart() {
    local chart_path=${1:-"$PROJECT_ROOT/cc-infra/helm-chart/controlcore"}
    
    echo -e "${BLUE}Validating helm chart: $chart_path${NC}"
    
    if [ ! -d "$chart_path" ]; then
        echo -e "${RED}❌ Helm chart directory not found: $chart_path${NC}"
        exit 1
    fi
    
    # Check for required files
    local required_files=(
        "Chart.yaml"
        "values.yaml"
        "values-offline.yaml"
    )
    
    echo -e "${BLUE}Checking required files...${NC}"
    for file in "${required_files[@]}"; do
        if [ -f "$chart_path/$file" ]; then
            echo -e "  ${GREEN}✅${NC} $file"
        else
            echo -e "  ${RED}❌${NC} $file"
            exit 1
        fi
    done
    
    # Check for forbidden files
    echo -e "${BLUE}Checking for forbidden internal artifacts...${NC}"
    local forbidden_patterns=(
        "BOM.json"
        "INTERNAL_CHANGELOG.md"
        "internal/"
        ".git/"
        "node_modules/"
        "test-"
        "*.log"
        "*.tmp"
        "*.bak"
    )
    
    for pattern in "${forbidden_patterns[@]}"; do
        if find "$chart_path" -name "*$pattern*" -type f -o -name "*$pattern*" -type d | grep -q .; then
            echo -e "  ${RED}❌${NC} Found forbidden pattern: $pattern"
            echo -e "${RED}❌ Helm chart contains internal artifacts - deployment blocked${NC}"
            exit 1
        fi
    done
    
    echo -e "  ${GREEN}✅${NC} No forbidden artifacts found"
    
    # Validate Chart.yaml
    echo -e "${BLUE}Validating Chart.yaml...${NC}"
    if [ -f "$chart_path/Chart.yaml" ]; then
        local chart_version=$(grep "^version:" "$chart_path/Chart.yaml" | awk '{print $2}')
        local app_version=$(grep "^appVersion:" "$chart_path/Chart.yaml" | awk '{print $2}')
        
        echo -e "  ${GREEN}✅${NC} Chart version: $chart_version"
        echo -e "  ${GREEN}✅${NC} App version: $app_version"
        
        if [ "$app_version" != "$CURRENT_VERSION" ]; then
            echo -e "  ${YELLOW}⚠️${NC} App version doesn't match current version"
        fi
    fi
    
    # Validate values files
    echo -e "${BLUE}Validating values files...${NC}"
    for values_file in "$chart_path/values.yaml" "$chart_path/values-offline.yaml"; do
        if [ -f "$values_file" ]; then
            echo -e "  ${BLUE}Checking $values_file...${NC}"
            
            # Check for version locking
            if grep -q "tag: latest" "$values_file"; then
                echo -e "    ${RED}❌${NC} Found 'latest' tag - version not locked"
                exit 1
            fi
            
            if grep -q "pullPolicy: Never" "$values_file"; then
                echo -e "    ${YELLOW}⚠️${NC} Found 'Never' pull policy - may not work in customer environments"
            fi
            
            # Check for internal references
            if grep -q "githubToken" "$values_file"; then
                echo -e "    ${YELLOW}⚠️${NC} Found githubToken reference - ensure it's empty for customers"
            fi
            
            echo -e "    ${GREEN}✅${NC} Values file validated"
        fi
    done
    
    echo -e "${GREEN}✅ Helm chart validation completed successfully${NC}"
}

# Function to validate BOM
validate_bom() {
    echo -e "${BLUE}Validating BOM integrity...${NC}"
    
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
    
    # Check approval status
    local approval_status=$(jq -r '.approvalStatus' "$BOM_FILE")
    if [ "$approval_status" != "approved" ]; then
        echo -e "${RED}❌ BOM is not approved for deployment${NC}"
        exit 1
    fi
    
    # Check offline compatibility
    local offline_compatible=$(jq -r '.offlineCompatible' "$BOM_FILE")
    if [ "$offline_compatible" != "true" ]; then
        echo -e "${RED}❌ BOM is not offline compatible${NC}"
        exit 1
    fi
    
    # Check deployment readiness
    local deployment_ready=$(jq -r '.deploymentReady' "$BOM_FILE")
    if [ "$deployment_ready" != "true" ]; then
        echo -e "${RED}❌ BOM is not deployment ready${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ BOM validation completed successfully${NC}"
}

# Function to check for internal leaks
check_internal_leaks() {
    echo -e "${BLUE}Checking for internal artifact leaks...${NC}"
    
    local search_path=${1:-"$PROJECT_ROOT/cc-infra/helm-chart"}
    
    # Define forbidden patterns
    local forbidden_patterns=(
        "BOM.json"
        "INTERNAL_CHANGELOG.md"
        "internal/"
        ".git/"
        "node_modules/"
        "test-"
        "*.log"
        "*.tmp"
        "*.bak"
        "*.swp"
        "*.swo"
        "README.md"
        "CHANGELOG.md"
        "LICENSE"
        "Makefile"
        "package*.json"
        "requirements.txt"
        "go.mod"
        "go.sum"
        "Dockerfile.dev"
        "docker-compose*.yml"
        "k8s/"
        "scripts/test-*"
    )
    
    local leaks_found=false
    
    for pattern in "${forbidden_patterns[@]}"; do
        if find "$search_path" -name "*$pattern*" -type f -o -name "*$pattern*" -type d | grep -q .; then
            echo -e "  ${RED}❌${NC} Found forbidden pattern: $pattern"
            find "$search_path" -name "*$pattern*" -type f -o -name "*$pattern*" -type d | while read -r item; do
                echo -e "    - $item"
            done
            leaks_found=true
        fi
    done
    
    if [ "$leaks_found" = true ]; then
        echo -e "${RED}❌ Internal artifacts found - deployment blocked${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ No internal artifacts found${NC}"
    fi
}

# Function to validate images
validate_images() {
    echo -e "${BLUE}Validating container images...${NC}"
    
    if [ ! -f "$BOM_FILE" ]; then
        echo -e "${RED}❌ BOM file not found: $BOM_FILE${NC}"
        exit 1
    fi
    
    # Extract images from BOM
    local images=$(jq -r '.components[] | select(.properties[] | select(.name == "image")) | .properties[] | select(.name == "image") | .value' "$BOM_FILE")
    
    echo -e "${BLUE}Validating ${#images[@]} images...${NC}"
    for image in $images; do
        echo -n "  Validating $image... "
        
        # Check if image has a specific tag (not 'latest')
        if [[ "$image" == *":latest" ]]; then
            echo -e "${RED}❌${NC} (uses 'latest' tag - not version locked)"
            exit 1
        fi
        
        # Check if image has a digest
        local digest=$(jq -r ".components[] | select(.properties[] | select(.name == \"image\" and .value == \"$image\")) | .properties[] | select(.name == \"digest\") | .value" "$BOM_FILE")
        if [ -z "$digest" ] || [ "$digest" = "null" ]; then
            echo -e "${YELLOW}⚠️${NC} (no digest found)"
        else
            echo -e "${GREEN}✅${NC} (has digest)"
        fi
    done
    
    echo -e "${GREEN}✅ Image validation completed${NC}"
}

# Function for pre-deployment validation
pre_deployment() {
    echo -e "${BLUE}Running pre-deployment validation...${NC}"
    echo ""
    
    # Validate BOM
    validate_bom
    echo ""
    
    # Check for internal leaks
    check_internal_leaks
    echo ""
    
    # Validate helm chart
    validate_helm_chart
    echo ""
    
    # Validate images
    validate_images
    echo ""
    
    echo -e "${GREEN}✅ Pre-deployment validation completed successfully${NC}"
    echo -e "${GREEN}✅ Deployment is approved and ready${NC}"
}

# Function to validate customer package
validate_customer_package() {
    local package_path=${1:-""}
    
    if [ -z "$package_path" ]; then
        echo -e "${RED}❌ Package path is required${NC}"
        echo "Usage: $0 customer-package <package-path>"
        exit 1
    fi
    
    if [ ! -d "$package_path" ]; then
        echo -e "${RED}❌ Package directory not found: $package_path${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Validating customer package: $package_path${NC}"
    
    # Check for required files
    local required_files=(
        "VERSION"
        "MANIFEST.json"
        "deploy.sh"
        "README.md"
        "SECURITY.md"
        "helm-chart/controlcore/Chart.yaml"
        "helm-chart/controlcore/values-customer.yaml"
    )
    
    echo -e "${BLUE}Checking required files...${NC}"
    for file in "${required_files[@]}"; do
        if [ -f "$package_path/$file" ]; then
            echo -e "  ${GREEN}✅${NC} $file"
        else
            echo -e "  ${RED}❌${NC} $file"
            exit 1
        fi
    done
    
    # Check for forbidden files
    echo -e "${BLUE}Checking for forbidden internal artifacts...${NC}"
    check_internal_leaks "$package_path"
    
    # Validate package manifest
    echo -e "${BLUE}Validating package manifest...${NC}"
    if [ -f "$package_path/MANIFEST.json" ]; then
        local package_version=$(jq -r '.package.version' "$package_path/MANIFEST.json")
        local package_type=$(jq -r '.package.type' "$package_path/MANIFEST.json")
        
        echo -e "  ${GREEN}✅${NC} Package version: $package_version"
        echo -e "  ${GREEN}✅${NC} Package type: $package_type"
        
        if [ "$package_type" != "customer-deployment" ]; then
            echo -e "  ${RED}❌${NC} Invalid package type"
            exit 1
        fi
    fi
    
    # Validate security features
    echo -e "${BLUE}Validating security features...${NC}"
    if [ -f "$package_path/MANIFEST.json" ]; then
        local offline_only=$(jq -r '.security.offlineOnly' "$package_path/MANIFEST.json")
        local version_locked=$(jq -r '.security.versionLocked' "$package_path/MANIFEST.json")
        local no_internal_artifacts=$(jq -r '.security.noInternalArtifacts' "$package_path/MANIFEST.json")
        
        if [ "$offline_only" = "true" ]; then
            echo -e "  ${GREEN}✅${NC} Offline only deployment"
        else
            echo -e "  ${RED}❌${NC} Not offline only"
            exit 1
        fi
        
        if [ "$version_locked" = "true" ]; then
            echo -e "  ${GREEN}✅${NC} Version locked"
        else
            echo -e "  ${RED}❌${NC} Not version locked"
            exit 1
        fi
        
        if [ "$no_internal_artifacts" = "true" ]; then
            echo -e "  ${GREEN}✅${NC} No internal artifacts"
        else
            echo -e "  ${RED}❌${NC} Internal artifacts present"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Customer package validation completed successfully${NC}"
}

# Main script logic
case "${1:-help}" in
    validate-helm-chart)
        validate_helm_chart "$2"
        ;;
    validate-bom)
        validate_bom
        ;;
    check-internal-leaks)
        check_internal_leaks "$2"
        ;;
    validate-images)
        validate_images
        ;;
    pre-deployment)
        pre_deployment
        ;;
    customer-package)
        validate_customer_package "$2"
        ;;
    help|*)
        show_help
        ;;
esac
