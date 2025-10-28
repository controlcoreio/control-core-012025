#!/bin/bash

# Control Core Integrated Release Manager
# This script orchestrates the complete release process with dependency management

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

# Function to display help
show_help() {
    echo -e "${BLUE}Control Core Integrated Release Manager${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  full-release <version>     Complete release process"
    echo "  dependency-check          Comprehensive dependency validation"
    echo "  security-audit            Complete security audit"
    echo "  customer-package <version> Create customer package"
    echo "  deployment-validate       Validate deployment readiness"
    echo "  help                      Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 full-release 012025.02"
    echo "  $0 dependency-check"
    echo "  $0 security-audit"
    echo "  $0 customer-package 012025.02"
}

# Function to run dependency check
run_dependency_check() {
    echo -e "${BLUE}Running comprehensive dependency check...${NC}"
    echo ""
    
    # Step 1: Scan dependencies
    echo -e "${BLUE}Step 1: Scanning dependencies...${NC}"
    "$SCRIPT_DIR/dependency-tracker.sh" scan
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Dependency scan failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 2: Validate dependencies
    echo -e "${BLUE}Step 2: Validating dependencies...${NC}"
    "$SCRIPT_DIR/dependency-tracker.sh" validate
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Dependency validation failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 3: Check compatibility
    echo -e "${BLUE}Step 3: Checking compatibility...${NC}"
    "$SCRIPT_DIR/dependency-tracker.sh" check-compatibility
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Compatibility check failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 4: Generate matrix
    echo -e "${BLUE}Step 4: Generating compatibility matrix...${NC}"
    "$SCRIPT_DIR/dependency-tracker.sh" generate-matrix
    echo ""
    
    echo -e "${GREEN}✅ Dependency check completed successfully${NC}"
}

# Function to run security audit
run_security_audit() {
    echo -e "${BLUE}Running comprehensive security audit...${NC}"
    echo ""
    
    # Step 1: Dependency security audit
    echo -e "${BLUE}Step 1: Auditing dependencies for security issues...${NC}"
    "$SCRIPT_DIR/dependency-tracker.sh" audit-security
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Dependency security audit failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 2: BOM security audit
    echo -e "${BLUE}Step 2: Auditing BOM for security issues...${NC}"
    "$SCRIPT_DIR/bom-manager.sh" audit-security
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ BOM security audit failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 3: Deployment security validation
    echo -e "${BLUE}Step 3: Validating deployment security...${NC}"
    "$SCRIPT_DIR/deployment-validator.sh" check-internal-leaks
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Deployment security validation failed${NC}"
        exit 1
    fi
    echo ""
    
    echo -e "${GREEN}✅ Security audit completed successfully${NC}"
}

# Function to create customer package
create_customer_package() {
    local version=${1:-$CURRENT_VERSION}
    
    echo -e "${BLUE}Creating customer package for version $version...${NC}"
    echo ""
    
    # Step 1: Validate deployment readiness
    echo -e "${BLUE}Step 1: Validating deployment readiness...${NC}"
    "$SCRIPT_DIR/deployment-validator.sh" pre-deployment
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Deployment validation failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 2: Validate customer package
    echo -e "${BLUE}Step 2: Validating customer package...${NC}"
    "$SCRIPT_DIR/deployment-validator.sh" customer-package "$VERSION_MGMT_DIR/customer-packages/control-core-$version"
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Customer package validation failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 3: Create customer package
    echo -e "${BLUE}Step 3: Creating customer package...${NC}"
    "$SCRIPT_DIR/create-customer-package.sh" --version "$version"
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Customer package creation failed${NC}"
        exit 1
    fi
    echo ""
    
    echo -e "${GREEN}✅ Customer package created successfully${NC}"
}

# Function to validate deployment readiness
validate_deployment() {
    echo -e "${BLUE}Validating deployment readiness...${NC}"
    echo ""
    
    # Step 1: BOM validation
    echo -e "${BLUE}Step 1: Validating BOM...${NC}"
    "$SCRIPT_DIR/bom-manager.sh" validate
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ BOM validation failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 2: Dependency validation
    echo -e "${BLUE}Step 2: Validating dependencies...${NC}"
    "$SCRIPT_DIR/dependency-tracker.sh" validate
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Dependency validation failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 3: Helm chart validation
    echo -e "${BLUE}Step 3: Validating helm charts...${NC}"
    "$SCRIPT_DIR/deployment-validator.sh" validate-helm-chart
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Helm chart validation failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 4: Security validation
    echo -e "${BLUE}Step 4: Validating security...${NC}"
    "$SCRIPT_DIR/deployment-validator.sh" check-internal-leaks
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Security validation failed${NC}"
        exit 1
    fi
    echo ""
    
    echo -e "${GREEN}✅ Deployment validation completed successfully${NC}"
}

# Function to run full release process
run_full_release() {
    local new_version=$1
    
    if [ -z "$new_version" ]; then
        echo -e "${RED}❌ Version is required${NC}"
        echo "Usage: $0 full-release <version>"
        exit 1
    fi
    
    echo -e "${BLUE}Starting full release process for version $new_version...${NC}"
    echo ""
    
    # Step 1: Pre-release validation
    echo -e "${BLUE}Step 1: Pre-release validation...${NC}"
    run_dependency_check
    run_security_audit
    echo ""
    
    # Step 2: Update version
    echo -e "${BLUE}Step 2: Updating version to $new_version...${NC}"
    "$SCRIPT_DIR/version-manager.sh" set "$new_version"
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Version update failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 3: Update all components
    echo -e "${BLUE}Step 3: Updating all components...${NC}"
    "$SCRIPT_DIR/version-manager.sh" update
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Component update failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 4: Update BOM
    echo -e "${BLUE}Step 4: Updating BOM...${NC}"
    "$SCRIPT_DIR/bom-manager.sh" update
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ BOM update failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 5: Lock dependencies
    echo -e "${BLUE}Step 5: Locking dependencies...${NC}"
    "$SCRIPT_DIR/bom-manager.sh" lock-dependencies
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Dependency locking failed${NC}"
        exit 1
    fi
    echo ""
    
    # Step 6: Post-release validation
    echo -e "${BLUE}Step 6: Post-release validation...${NC}"
    validate_deployment
    echo ""
    
    # Step 7: Create customer package
    echo -e "${BLUE}Step 7: Creating customer package...${NC}"
    create_customer_package "$new_version"
    echo ""
    
    # Step 8: Export reports
    echo -e "${BLUE}Step 8: Exporting reports...${NC}"
    "$SCRIPT_DIR/dependency-tracker.sh" export-report
    "$SCRIPT_DIR/bom-manager.sh" export-helm-values
    echo ""
    
    echo -e "${GREEN}✅ Full release process completed successfully${NC}"
    echo -e "${GREEN}✅ Version $new_version is ready for deployment${NC}"
    echo ""
    echo -e "${BLUE}Release Summary:${NC}"
    echo -e "  Version: $new_version"
    echo -e "  Customer Package: $VERSION_MGMT_DIR/customer-packages/control-core-$new_version"
    echo -e "  BOM: Updated and validated"
    echo -e "  Dependencies: Scanned and locked"
    echo -e "  Security: Audited and approved"
    echo -e "  Deployment: Validated and ready"
}

# Function to show status
show_status() {
    echo -e "${BLUE}Control Core Release Status${NC}"
    echo ""
    
    # Show current version
    echo -e "${BLUE}Current Version: ${GREEN}$CURRENT_VERSION${NC}"
    echo ""
    
    # Show BOM status
    echo -e "${BLUE}BOM Status:${NC}"
    "$SCRIPT_DIR/bom-manager.sh" validate
    echo ""
    
    # Show dependency status
    echo -e "${BLUE}Dependency Status:${NC}"
    "$SCRIPT_DIR/dependency-tracker.sh" validate
    echo ""
    
    # Show deployment status
    echo -e "${BLUE}Deployment Status:${NC}"
    "$SCRIPT_DIR/deployment-validator.sh" pre-deployment
    echo ""
    
    echo -e "${GREEN}✅ Status check completed${NC}"
}

# Main script logic
case "${1:-help}" in
    full-release)
        run_full_release "$2"
        ;;
    dependency-check)
        run_dependency_check
        ;;
    security-audit)
        run_security_audit
        ;;
    customer-package)
        create_customer_package "$2"
        ;;
    deployment-validate)
        validate_deployment
        ;;
    status)
        show_status
        ;;
    help|*)
        show_help
        ;;
esac
