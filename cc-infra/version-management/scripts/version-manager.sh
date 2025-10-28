#!/bin/bash

# Control Core Version Manager
# This script manages versions across all Control Core components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Current version (relative to script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_MGMT_DIR="$(dirname "$SCRIPT_DIR")"
INTERNAL_DIR="$VERSION_MGMT_DIR/internal"
CUSTOMER_DIR="$VERSION_MGMT_DIR/customer"

CURRENT_VERSION=$(cat "$INTERNAL_DIR/VERSION" 2>/dev/null || echo "012025.00")
CUSTOMER_VERSION=$(cat "$CUSTOMER_DIR/CUSTOMER_VERSION" 2>/dev/null || echo "012025.00")

# Component directories (relative to project root)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
COMPONENTS=(
    "$PROJECT_ROOT/cc-pap"
    "$PROJECT_ROOT/cc-pap-pro-tenant"
    "$PROJECT_ROOT/cc-bouncer"
    "$PROJECT_ROOT/cc-pap-api"
    "$PROJECT_ROOT/acme-consulting-demo-api"
    "$PROJECT_ROOT/acme-consulting-demo-frontend"
)

# Function to display help
show_help() {
    echo -e "${BLUE}Control Core Version Manager${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  current                 Show current internal version"
    echo "  customer                Show current customer version"
    echo "  set <version>           Set new internal version"
    echo "  set-customer <version>  Set new customer version"
    echo "  bump [quarter|patch]    Bump internal version"
    echo "  update                  Update all components to current version"
    echo "  status                  Show version status of all components"
    echo "  changelog               Show internal changelog"
    echo "  release-notes          Show customer release notes"
    echo "  release                 Create release"
    echo "  scan-deps               Scan all dependencies"
    echo "  validate-deps           Validate dependency versions"
    echo "  check-compatibility     Check component compatibility"
    echo "  audit-security          Audit dependencies for security issues"
    echo "  export-deps-report      Export dependency report"
    echo "  help                    Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 current"
    echo "  $0 set 022025.00"
    echo "  $0 bump quarter"
    echo "  $0 bump patch"
    echo "  $0 update"
    echo "  $0 status"
}

# Function to get current version
get_current_version() {
    echo -e "${BLUE}Current Internal Version: ${GREEN}$CURRENT_VERSION${NC}"
}

# Function to get customer version
get_customer_version() {
    echo -e "${BLUE}Current Customer Version: ${GREEN}$CUSTOMER_VERSION${NC}"
}

# Function to set new version
set_version() {
    local new_version=$1
    
    if [ -z "$new_version" ]; then
        echo -e "${RED}❌ Version is required${NC}"
        echo "Usage: $0 set <version>"
        exit 1
    fi
    
    # Validate version format (MMYYYY.PP)
    if [[ ! $new_version =~ ^[0-9]{6}\.[0-9]{2}$ ]]; then
        echo -e "${RED}❌ Invalid version format. Use MMMMYY.PP (e.g., 012025.00)${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Setting version to: ${GREEN}$new_version${NC}"
    echo "$new_version" > "$INTERNAL_DIR/VERSION"
    
    # Update package.json files
    for component in "${COMPONENTS[@]}"; do
        if [ -d "$component" ]; then
            if [ -f "$component/package.json" ]; then
                echo -e "${YELLOW}Updating $component/package.json${NC}"
                # Update version in package.json using sed
                sed -i.bak "s/\"version\": \".*\"/\"version\": \"$new_version\"/" "$component/package.json"
                rm -f "$component/package.json.bak"
            fi
        fi
    done
    
    echo -e "${GREEN}✅ Version updated to $new_version${NC}"
}

# Function to bump version
bump_version() {
    local bump_type=${1:-patch}
    local current_quarter=$(echo $CURRENT_VERSION | cut -c1-2)
    local current_year=$(echo $CURRENT_VERSION | cut -c3-6)
    local current_patch=$(echo $CURRENT_VERSION | cut -d'.' -f2)
    
    case $bump_type in
        quarter)
            # Bump to next quarter (Q1->Q2->Q3->Q4->Q1 next year)
            new_quarter=$((current_quarter + 1))
            if [ $new_quarter -gt 4 ]; then
                new_quarter=1
                new_year=$((current_year + 1))
            else
                new_year=$current_year
            fi
            new_version=$(printf "%02d%04d.00" $new_quarter $new_year)
            ;;
        patch)
            # Bump patch version (bug fixes, security updates)
            new_patch=$((current_patch + 1))
            if [ $new_patch -gt 99 ]; then
                echo -e "${RED}❌ Patch version cannot exceed 99. Consider a new quarter release.${NC}"
                exit 1
            fi
            new_version=$(printf "%02d%04d.%02d" $current_quarter $current_year $new_patch)
            ;;
        *)
            echo -e "${RED}❌ Invalid bump type. Use 'quarter' or 'patch'${NC}"
            echo -e "${BLUE}quarter: New quarterly release (012025.00 -> 022025.00)${NC}"
            echo -e "${BLUE}patch: Bug fix or security update (012025.00 -> 012025.01)${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${BLUE}Bumping version from $CURRENT_VERSION to $new_version${NC}"
    set_version "$new_version"
}

# Function to update all components
update_components() {
    echo -e "${BLUE}Updating all components to version $CURRENT_VERSION${NC}"
    
    # First, scan dependencies to ensure consistency
    echo -e "${BLUE}Scanning dependencies before update...${NC}"
    "$SCRIPT_DIR/dependency-tracker.sh" scan
    
    for component in "${COMPONENTS[@]}"; do
        if [ -d "$component" ]; then
            echo -e "${YELLOW}Updating $component...${NC}"
            
            # Update package.json if it exists
            if [ -f "$component/package.json" ]; then
                sed -i.bak "s/\"version\": \".*\"/\"version\": \"$CURRENT_VERSION\"/" "$component/package.json"
                rm -f "$component/package.json.bak"
                echo -e "${GREEN}✅ Updated $component/package.json${NC}"
            fi
            
            # Update Dockerfile if it exists
            if [ -f "$component/Dockerfile" ]; then
                # Add version label to Dockerfile
                if ! grep -q "LABEL version=" "$component/Dockerfile"; then
                    echo "LABEL version=\"$CURRENT_VERSION\"" >> "$component/Dockerfile"
                    echo -e "${GREEN}✅ Added version label to $component/Dockerfile${NC}"
                fi
            fi
            
            # Update requirements.txt version comments if it exists
            if [ -f "$component/requirements.txt" ]; then
                # Add version comment if not present
                if ! grep -q "# Control Core Version" "$component/requirements.txt"; then
                    echo "" >> "$component/requirements.txt"
                    echo "# Control Core Version: $CURRENT_VERSION" >> "$component/requirements.txt"
                    echo -e "${GREEN}✅ Added version comment to $component/requirements.txt${NC}"
                else
                    sed -i.bak "s/# Control Core Version: .*/# Control Core Version: $CURRENT_VERSION/" "$component/requirements.txt"
                    rm -f "$component/requirements.txt.bak"
                    echo -e "${GREEN}✅ Updated version comment in $component/requirements.txt${NC}"
                fi
            fi
            
            # Update go.mod version if it exists
            if [ -f "$component/go.mod" ]; then
                # Add version comment if not present
                if ! grep -q "// Control Core Version" "$component/go.mod"; then
                    echo "" >> "$component/go.mod"
                    echo "// Control Core Version: $CURRENT_VERSION" >> "$component/go.mod"
                    echo -e "${GREEN}✅ Added version comment to $component/go.mod${NC}"
                else
                    sed -i.bak "s|// Control Core Version: .*|// Control Core Version: $CURRENT_VERSION|" "$component/go.mod"
                    rm -f "$component/go.mod.bak"
                    echo -e "${GREEN}✅ Updated version comment in $component/go.mod${NC}"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  Component $component not found${NC}"
        fi
    done
    
    # Update BOM with new version
    echo -e "${BLUE}Updating BOM...${NC}"
    "$SCRIPT_DIR/bom-manager.sh" update
    
    # Validate dependencies after update
    echo -e "${BLUE}Validating dependencies after update...${NC}"
    "$SCRIPT_DIR/dependency-tracker.sh" validate
    
    echo -e "${GREEN}✅ All components updated to version $CURRENT_VERSION${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}Control Core Version Status${NC}"
    echo ""
    echo -e "${BLUE}Current Version: ${GREEN}$CURRENT_VERSION${NC}"
    echo ""
    
    for component in "${COMPONENTS[@]}"; do
        if [ -d "$component" ]; then
            if [ -f "$component/package.json" ]; then
                local version=$(grep '"version"' "$component/package.json" | cut -d'"' -f4)
                echo -e "  ${GREEN}✅${NC} $component: $version"
            else
                echo -e "  ${YELLOW}⚠️${NC} $component: No package.json"
            fi
        else
            echo -e "  ${RED}❌${NC} $component: Not found"
        fi
    done
}

# Function to set customer version
set_customer_version() {
    local new_version=$1
    
    if [ -z "$new_version" ]; then
        echo -e "${RED}❌ Version is required${NC}"
        echo "Usage: $0 set-customer <version>"
        exit 1
    fi
    
    # Validate version format (MMYYYY.PP)
    if [[ ! $new_version =~ ^[0-9]{6}\.[0-9]{2}$ ]]; then
        echo -e "${RED}❌ Invalid version format. Use MMMMYY.PP (e.g., 012025.00)${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Setting customer version to: ${GREEN}$new_version${NC}"
    echo "$new_version" > "$CUSTOMER_DIR/CUSTOMER_VERSION"
    
    echo -e "${GREEN}✅ Customer version updated to $new_version${NC}"
}

# Function to show internal changelog
show_changelog() {
    if [ -f "$INTERNAL_DIR/INTERNAL_CHANGELOG.md" ]; then
        echo -e "${BLUE}Control Core Internal Development Changelog${NC}"
        echo ""
        cat "$INTERNAL_DIR/INTERNAL_CHANGELOG.md"
    else
        echo -e "${RED}❌ Internal changelog not found${NC}"
    fi
}

# Function to show customer release notes
show_release_notes() {
    if [ -f "$CUSTOMER_DIR/RELEASE_NOTES.md" ]; then
        echo -e "${BLUE}Control Core Customer Release Notes${NC}"
        echo ""
        cat "$CUSTOMER_DIR/RELEASE_NOTES.md"
    else
        echo -e "${RED}❌ Release notes not found${NC}"
    fi
}

# Function to create release
create_release() {
    echo -e "${BLUE}Creating Control Core Release $CURRENT_VERSION${NC}"
    
    # Create release directory
    local release_dir="releases/control-core-$CURRENT_VERSION"
    mkdir -p "$release_dir"
    
    # Copy components
    for component in "${COMPONENTS[@]}"; do
        if [ -d "$component" ]; then
            echo -e "${YELLOW}Copying $component...${NC}"
            cp -r "$component" "$release_dir/"
        fi
    done
    
    # Copy configuration files
    cp docker-compose.yml "$release_dir/"
    cp setup-databases.sh "$release_dir/"
    cp start-controlcore.sh "$release_dir/"
    cp VERSION "$release_dir/"
    cp CHANGELOG.md "$release_dir/"
    
    # Create release archive
    echo -e "${YELLOW}Creating release archive...${NC}"
    tar -czf "releases/control-core-$CURRENT_VERSION.tar.gz" -C releases "control-core-$CURRENT_VERSION"
    
    echo -e "${GREEN}✅ Release created: releases/control-core-$CURRENT_VERSION.tar.gz${NC}"
}

# Main script logic
case "${1:-help}" in
    current)
        get_current_version
        ;;
    customer)
        get_customer_version
        ;;
    set)
        set_version "$2"
        ;;
    set-customer)
        set_customer_version "$2"
        ;;
    bump)
        bump_version "$2"
        ;;
    update)
        update_components
        ;;
    status)
        show_status
        ;;
    changelog)
        show_changelog
        ;;
    release-notes)
        show_release_notes
        ;;
    release)
        create_release
        ;;
    scan-deps)
        "$SCRIPT_DIR/dependency-tracker.sh" scan
        ;;
    validate-deps)
        "$SCRIPT_DIR/dependency-tracker.sh" validate
        ;;
    check-compatibility)
        "$SCRIPT_DIR/dependency-tracker.sh" check-compatibility
        ;;
    audit-security)
        "$SCRIPT_DIR/dependency-tracker.sh" audit-security
        ;;
    export-deps-report)
        "$SCRIPT_DIR/dependency-tracker.sh" export-report
        ;;
    help|*)
        show_help
        ;;
esac
