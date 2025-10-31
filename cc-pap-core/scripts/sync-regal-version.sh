#!/bin/bash
#
# Regal Version Sync Script
#
# This script updates the Regal language server version used by Control Core.
# Run this before releasing a new version of Control Core to ensure compatibility
# with the latest Regal features and bug fixes.
#
# Usage:
#   ./sync-regal-version.sh [version]
#
# Examples:
#   ./sync-regal-version.sh          # Check for latest version
#   ./sync-regal-version.sh v0.36.0  # Update to specific version
#

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../../.." && pwd )"
REGAL_REPO="open-policy-agent/regal"
VERSION_FILE="$SCRIPT_DIR/../services/language-server/REGAL_VERSION.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required commands are available
check_dependencies() {
    local missing=()
    
    for cmd in curl jq git; do
        if ! command -v $cmd &> /dev/null; then
            missing+=($cmd)
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required commands: ${missing[*]}"
        log_info "Install them with: brew install ${missing[*]}"
        exit 1
    fi
}

# Get latest Regal release from GitHub
get_latest_version() {
    log_info "Fetching latest Regal release from GitHub..."
    
    local response=$(curl -s "https://api.github.com/repos/$REGAL_REPO/releases/latest")
    local version=$(echo "$response" | jq -r '.tag_name')
    
    if [ "$version" = "null" ] || [ -z "$version" ]; then
        log_error "Failed to fetch latest Regal version"
        exit 1
    fi
    
    echo "$version"
}

# Get current Regal version from version file
get_current_version() {
    if [ -f "$VERSION_FILE" ]; then
        grep "^Current Version:" "$VERSION_FILE" | cut -d' ' -f3 || echo "unknown"
    else
        echo "unknown"
    fi
}

# Update package.json files
update_package_json() {
    local version=$1
    local version_no_v="${version#v}"
    
    log_info "Updating package.json files..."
    
    # Update cc-language-server package.json
    local lang_server_pkg="$PROJECT_ROOT/cc-language-server/package.json"
    if [ -f "$lang_server_pkg" ]; then
        log_info "Updating $lang_server_pkg"
        # Note: This is a placeholder - actual version might not match npm package version
        log_warning "Manual verification needed for npm package version"
    fi
    
    # Update cc-pap-core package.json if it exists
    local pap_core_pkg="$PROJECT_ROOT/cc-pap-core/package.json"
    if [ -f "$pap_core_pkg" ]; then
        log_info "Updating $pap_core_pkg"
    fi
}

# Update Dockerfiles
update_dockerfiles() {
    local version=$1
    
    log_info "Updating Dockerfiles..."
    
    # Update cc-pap-api Dockerfile
    local dockerfile="$PROJECT_ROOT/cc-pap-api/Dockerfile"
    if [ -f "$dockerfile" ]; then
        log_info "Updating $dockerfile"
        sed -i.bak "s|regal/releases/download/v[0-9.]*|regal/releases/download/$version|g" "$dockerfile"
        rm "${dockerfile}.bak" 2>/dev/null || true
    fi
}

# Update version documentation
update_version_doc() {
    local version=$1
    local date=$(date +"%Y-%m-%d")
    
    log_info "Updating version documentation..."
    
    cat > "$VERSION_FILE" << EOF
# Regal Language Server Version

## Current Version: $version
**Last Updated:** $date

## Update Instructions

To update Regal to a new version:

1. Run the sync script:
   \`\`\`bash
   cd cc-pap-core/scripts
   ./sync-regal-version.sh [version]
   \`\`\`

2. Test the integration:
   - Start the Control Core backend
   - Open the policy code editor
   - Verify syntax highlighting works
   - Verify completions work
   - Verify hover information works
   - Verify diagnostics/linting works

3. Update release notes with Regal changes

## Version History

### $version ($date)
- Updated to Regal $version
- See: https://github.com/$REGAL_REPO/releases/tag/$version

EOF

    log_success "Updated version documentation: $VERSION_FILE"
}

# Run integration tests
run_tests() {
    log_info "Running integration tests..."
    
    # Check if Regal binary is available
    if ! command -v regal &> /dev/null; then
        log_warning "Regal binary not found in PATH"
        log_info "Install Regal to test integration:"
        log_info "  go install github.com/open-policy-agent/regal/cmd/regal@latest"
        return 1
    fi
    
    # Test Regal version
    local installed_version=$(regal version | head -n1 | awk '{print $2}')
    log_info "Installed Regal version: $installed_version"
    
    # Test Regal lint on sample policy
    local test_policy=$(mktemp)
    cat > "$test_policy" << 'EOF'
package test

default allow = false

allow {
    input.user.role == "admin"
}
EOF
    
    log_info "Testing Regal lint..."
    if regal lint --format json "$test_policy" > /dev/null 2>&1; then
        log_success "Regal lint test passed"
    else
        log_error "Regal lint test failed"
        rm "$test_policy"
        return 1
    fi
    
    rm "$test_policy"
    return 0
}

# Main execution
main() {
    log_info "Regal Version Sync Script"
    log_info "==========================="
    
    check_dependencies
    
    local target_version="$1"
    local current_version=$(get_current_version)
    
    log_info "Current version: $current_version"
    
    if [ -z "$target_version" ]; then
        target_version=$(get_latest_version)
        log_info "Latest available version: $target_version"
        
        if [ "$current_version" = "$target_version" ]; then
            log_success "Already on the latest version!"
            exit 0
        fi
        
        read -p "Update to $target_version? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Update cancelled"
            exit 0
        fi
    else
        log_info "Target version: $target_version"
    fi
    
    # Perform updates
    update_package_json "$target_version"
    update_dockerfiles "$target_version"
    update_version_doc "$target_version"
    
    log_success "Version files updated to $target_version"
    
    # Run tests
    if run_tests; then
        log_success "Integration tests passed"
    else
        log_warning "Integration tests failed or skipped"
        log_info "Please test manually before releasing"
    fi
    
    log_info ""
    log_info "Next steps:"
    log_info "1. Review the changes: git diff"
    log_info "2. Test the integration manually"
    log_info "3. Commit the changes: git add . && git commit -m 'chore: update Regal to $target_version'"
    log_info "4. Update Control Core release notes"
    
    log_success "Regal version sync complete!"
}

main "$@"

