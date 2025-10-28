#!/bin/bash

# Control Core Dependency Tracker
# This script tracks all dependencies across all components and ensures version consistency

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

# Dependency tracking files
DEPENDENCY_REGISTRY="$VERSION_MGMT_DIR/dependency-registry.json"
VERSION_MATRIX="$VERSION_MGMT_DIR/version-matrix.json"
COMPATIBILITY_MATRIX="$VERSION_MGMT_DIR/compatibility-matrix.json"

# Function to display help
show_help() {
    echo -e "${BLUE}Control Core Dependency Tracker${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  scan                    Scan all components for dependencies"
    echo "  validate                Validate dependency versions against BOM"
    echo "  update-registry         Update dependency registry"
    echo "  check-compatibility     Check component compatibility"
    echo "  generate-matrix         Generate version compatibility matrix"
    echo "  audit-security          Audit dependencies for security issues"
    echo "  lock-dependencies       Lock all dependencies to approved versions"
    echo "  export-report           Export dependency report"
    echo "  help                    Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 scan"
    echo "  $0 validate"
    echo "  $0 check-compatibility"
    echo "  $0 audit-security"
}

# Function to scan all components for dependencies
scan_dependencies() {
    echo -e "${BLUE}Scanning all components for dependencies...${NC}"
    
    # Initialize dependency registry
    cat > "$DEPENDENCY_REGISTRY" << EOF
{
  "registry": {
    "version": "1.0",
    "generated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "controlCoreVersion": "$CURRENT_VERSION"
  },
  "components": {}
}
EOF
    
    # Define components to scan
    local components=(
        "cc-pap:package.json"
        "cc-pap-api:requirements.txt"
        "cc-bouncer:go.mod"
        "cc-pap-pro-tenant:requirements.txt"
        "cc-signup-service:requirements.txt"
        "acme-consulting-demo-api:requirements.txt"
        "acme-consulting-demo-frontend:package.json"
        "opal:requirements.txt"
    )
    
    for component_info in "${components[@]}"; do
        local component_name=$(echo "$component_info" | cut -d':' -f1)
        local dependency_file=$(echo "$component_info" | cut -d':' -f2)
        local component_path="$PROJECT_ROOT/$component_name"
        
        echo -e "${BLUE}Scanning $component_name...${NC}"
        
        if [ -d "$component_path" ]; then
            # Extract dependencies based on file type
            case $dependency_file in
                "package.json")
                    scan_nodejs_dependencies "$component_path" "$component_name"
                    ;;
                "requirements.txt")
                    scan_python_dependencies "$component_path" "$component_name"
                    ;;
                "go.mod")
                    scan_go_dependencies "$component_path" "$component_name"
                    ;;
            esac
        else
            echo -e "${YELLOW}⚠️  Component $component_name not found${NC}"
        fi
    done
    
    echo -e "${GREEN}✅ Dependency scan completed${NC}"
}

# Function to scan Node.js dependencies
scan_nodejs_dependencies() {
    local component_path="$1"
    local component_name="$2"
    local package_file="$component_path/package.json"
    
    if [ -f "$package_file" ]; then
        echo -e "  ${BLUE}Scanning Node.js dependencies...${NC}"
        
        # Extract dependencies using jq
        local dependencies=$(jq -r '.dependencies // {} | to_entries[] | "\(.key):\(.value)"' "$package_file" 2>/dev/null || echo "")
        local devDependencies=$(jq -r '.devDependencies // {} | to_entries[] | "\(.key):\(.value)"' "$package_file" 2>/dev/null || echo "")
        
        # Update registry
        jq ".components[\"$component_name\"] = {
            \"type\": \"nodejs\",
            \"dependencies\": [],
            \"devDependencies\": [],
            \"packageFile\": \"package.json\"
        }" "$DEPENDENCY_REGISTRY" > "$DEPENDENCY_REGISTRY.tmp" && mv "$DEPENDENCY_REGISTRY.tmp" "$DEPENDENCY_REGISTRY"
        
        # Add dependencies
        while IFS= read -r dep; do
            if [ -n "$dep" ]; then
                local dep_name=$(echo "$dep" | cut -d':' -f1)
                local dep_version=$(echo "$dep" | cut -d':' -f2)
                
                jq ".components[\"$component_name\"].dependencies += [{\"name\": \"$dep_name\", \"version\": \"$dep_version\", \"type\": \"runtime\"}]" \
                   "$DEPENDENCY_REGISTRY" > "$DEPENDENCY_REGISTRY.tmp" && mv "$DEPENDENCY_REGISTRY.tmp" "$DEPENDENCY_REGISTRY"
            fi
        done <<< "$dependencies"
        
        # Add dev dependencies
        while IFS= read -r dep; do
            if [ -n "$dep" ]; then
                local dep_name=$(echo "$dep" | cut -d':' -f1)
                local dep_version=$(echo "$dep" | cut -d':' -f2)
                
                jq ".components[\"$component_name\"].devDependencies += [{\"name\": \"$dep_name\", \"version\": \"$dep_version\", \"type\": \"development\"}]" \
                   "$DEPENDENCY_REGISTRY" > "$DEPENDENCY_REGISTRY.tmp" && mv "$DEPENDENCY_REGISTRY.tmp" "$DEPENDENCY_REGISTRY"
            fi
        done <<< "$devDependencies"
        
        echo -e "    ${GREEN}✅ Found $(echo "$dependencies" | wc -l) runtime dependencies${NC}"
        echo -e "    ${GREEN}✅ Found $(echo "$devDependencies" | wc -l) development dependencies${NC}"
    else
        echo -e "    ${YELLOW}⚠️  package.json not found${NC}"
    fi
}

# Function to scan Python dependencies
scan_python_dependencies() {
    local component_path="$1"
    local component_name="$2"
    local requirements_file="$component_path/requirements.txt"
    
    if [ -f "$requirements_file" ]; then
        echo -e "  ${BLUE}Scanning Python dependencies...${NC}"
        
        # Update registry
        jq ".components[\"$component_name\"] = {
            \"type\": \"python\",
            \"dependencies\": [],
            \"requirementsFile\": \"requirements.txt\"
        }" "$DEPENDENCY_REGISTRY" > "$DEPENDENCY_REGISTRY.tmp" && mv "$DEPENDENCY_REGISTRY.tmp" "$DEPENDENCY_REGISTRY"
        
        # Parse requirements.txt
        local dep_count=0
        while IFS= read -r line; do
            # Skip comments and empty lines
            if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
                local dep_name=$(echo "$line" | cut -d'=' -f1 | cut -d'>' -f1 | cut -d'<' -f1 | cut -d'!' -f1 | tr -d '[:space:]')
                local dep_version=$(echo "$line" | grep -o '[>=<]=[^[:space:]]*' | head -1 || echo "any")
                
                if [ -n "$dep_name" ]; then
                    jq ".components[\"$component_name\"].dependencies += [{\"name\": \"$dep_name\", \"version\": \"$dep_version\", \"type\": \"runtime\"}]" \
                       "$DEPENDENCY_REGISTRY" > "$DEPENDENCY_REGISTRY.tmp" && mv "$DEPENDENCY_REGISTRY.tmp" "$DEPENDENCY_REGISTRY"
                    ((dep_count++))
                fi
            fi
        done < "$requirements_file"
        
        echo -e "    ${GREEN}✅ Found $dep_count dependencies${NC}"
    else
        echo -e "    ${YELLOW}⚠️  requirements.txt not found${NC}"
    fi
}

# Function to scan Go dependencies
scan_go_dependencies() {
    local component_path="$1"
    local component_name="$2"
    local go_mod_file="$component_path/go.mod"
    
    if [ -f "$go_mod_file" ]; then
        echo -e "  ${BLUE}Scanning Go dependencies...${NC}"
        
        # Update registry
        jq ".components[\"$component_name\"] = {
            \"type\": \"go\",
            \"dependencies\": [],
            \"goModFile\": \"go.mod\"
        }" "$DEPENDENCY_REGISTRY" > "$DEPENDENCY_REGISTRY.tmp" && mv "$DEPENDENCY_REGISTRY.tmp" "$DEPENDENCY_REGISTRY"
        
        # Parse go.mod
        local dep_count=0
        while IFS= read -r line; do
            if [[ "$line" =~ ^[[:space:]]+[a-zA-Z0-9./-]+[[:space:]]+v[0-9] ]]; then
                local dep_name=$(echo "$line" | awk '{print $1}')
                local dep_version=$(echo "$line" | awk '{print $2}')
                
                jq ".components[\"$component_name\"].dependencies += [{\"name\": \"$dep_name\", \"version\": \"$dep_version\", \"type\": \"runtime\"}]" \
                   "$DEPENDENCY_REGISTRY" > "$DEPENDENCY_REGISTRY.tmp" && mv "$DEPENDENCY_REGISTRY.tmp" "$DEPENDENCY_REGISTRY"
                ((dep_count++))
            fi
        done < "$go_mod_file"
        
        echo -e "    ${GREEN}✅ Found $dep_count dependencies${NC}"
    else
        echo -e "    ${YELLOW}⚠️  go.mod not found${NC}"
    fi
}

# Function to validate dependency versions against BOM
validate_dependencies() {
    echo -e "${BLUE}Validating dependency versions against BOM...${NC}"
    
    if [ ! -f "$BOM_FILE" ]; then
        echo -e "${RED}❌ BOM file not found: $BOM_FILE${NC}"
        exit 1
    fi
    
    if [ ! -f "$DEPENDENCY_REGISTRY" ]; then
        echo -e "${RED}❌ Dependency registry not found. Run 'scan' first.${NC}"
        exit 1
    fi
    
    local validation_errors=0
    
    # Check each component's dependencies
    local components=$(jq -r '.components | keys[]' "$DEPENDENCY_REGISTRY")
    
    for component in $components; do
        echo -e "${BLUE}Validating $component...${NC}"
        
        # Get component dependencies
        local dependencies=$(jq -r ".components[\"$component\"].dependencies[]? | \"\(.name):\(.version)\"" "$DEPENDENCY_REGISTRY")
        
        for dep in $dependencies; do
            local dep_name=$(echo "$dep" | cut -d':' -f1)
            local dep_version=$(echo "$dep" | cut -d':' -f2)
            
            # Check if dependency is in BOM
            local bom_component=$(jq -r ".components[] | select(.name == \"$dep_name\") | .version" "$BOM_FILE")
            
            if [ -n "$bom_component" ] && [ "$bom_component" != "null" ]; then
                if [ "$dep_version" != "$bom_component" ]; then
                    echo -e "    ${RED}❌${NC} $dep_name: version mismatch (component: $dep_version, BOM: $bom_component)"
                    ((validation_errors++))
                else
                    echo -e "    ${GREEN}✅${NC} $dep_name: $dep_version (matches BOM)"
                fi
            else
                echo -e "    ${YELLOW}⚠️${NC} $dep_name: not in BOM (external dependency)"
            fi
        done
    done
    
    if [ $validation_errors -eq 0 ]; then
        echo -e "${GREEN}✅ All dependencies validated successfully${NC}"
    else
        echo -e "${RED}❌ Found $validation_errors validation errors${NC}"
        exit 1
    fi
}

# Function to check component compatibility
check_compatibility() {
    echo -e "${BLUE}Checking component compatibility...${NC}"
    
    if [ ! -f "$DEPENDENCY_REGISTRY" ]; then
        echo -e "${RED}❌ Dependency registry not found. Run 'scan' first.${NC}"
        exit 1
    fi
    
    # Create compatibility matrix
    cat > "$COMPATIBILITY_MATRIX" << EOF
{
  "compatibility": {
    "version": "1.0",
    "generated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "controlCoreVersion": "$CURRENT_VERSION"
  },
  "components": {},
  "conflicts": [],
  "warnings": []
}
EOF
    
    # Check for version conflicts
    local all_deps=$(jq -r '.components[] | .dependencies[]? | "\(.name):\(.version)"' "$DEPENDENCY_REGISTRY")
    local unique_deps=$(echo "$all_deps" | sort | uniq)
    
    for dep in $unique_deps; do
        local dep_name=$(echo "$dep" | cut -d':' -f1)
        local dep_version=$(echo "$dep" | cut -d':' -f2)
        
        # Find all components using this dependency
        local using_components=$(jq -r ".components | to_entries[] | select(.value.dependencies[]? | select(.name == \"$dep_name\")) | .key" "$DEPENDENCY_REGISTRY")
        
        # Check for version conflicts
        local versions=$(echo "$using_components" | while read -r comp; do
            jq -r ".components[\"$comp\"].dependencies[] | select(.name == \"$dep_name\") | .version" "$DEPENDENCY_REGISTRY"
        done | sort | uniq)
        
        local version_count=$(echo "$versions" | wc -l)
        
        if [ "$version_count" -gt 1 ]; then
            echo -e "${RED}❌ Version conflict: $dep_name has multiple versions${NC}"
            echo "$versions" | while read -r version; do
                echo -e "    - $version"
            done
            
            # Add to conflicts
            jq ".conflicts += [{\"dependency\": \"$dep_name\", \"versions\": $(echo "$versions" | jq -R . | jq -s .), \"components\": $(echo "$using_components" | jq -R . | jq -s .)}]" \
               "$COMPATIBILITY_MATRIX" > "$COMPATIBILITY_MATRIX.tmp" && mv "$COMPATIBILITY_MATRIX.tmp" "$COMPATIBILITY_MATRIX"
        else
            echo -e "${GREEN}✅ $dep_name: consistent version $dep_version${NC}"
        fi
    done
    
    echo -e "${GREEN}✅ Compatibility check completed${NC}"
}

# Function to generate version matrix
generate_matrix() {
    echo -e "${BLUE}Generating version compatibility matrix...${NC}"
    
    if [ ! -f "$DEPENDENCY_REGISTRY" ]; then
        echo -e "${RED}❌ Dependency registry not found. Run 'scan' first.${NC}"
        exit 1
    fi
    
    # Create version matrix
    cat > "$VERSION_MATRIX" << EOF
{
  "matrix": {
    "version": "1.0",
    "generated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "controlCoreVersion": "$CURRENT_VERSION"
  },
  "components": {},
  "dependencies": {},
  "recommendations": []
}
EOF
    
    # Generate matrix data
    local components=$(jq -r '.components | keys[]' "$DEPENDENCY_REGISTRY")
    
    for component in $components; do
        echo -e "${BLUE}Processing $component...${NC}"
        
        # Get component info
        local component_type=$(jq -r ".components[\"$component\"].type" "$DEPENDENCY_REGISTRY")
        local dependencies=$(jq -r ".components[\"$component\"].dependencies[]? | \"\(.name):\(.version)\"" "$DEPENDENCY_REGISTRY")
        
        # Add to matrix
        jq ".components[\"$component\"] = {
            \"type\": \"$component_type\",
            \"dependencies\": $(echo "$dependencies" | jq -R . | jq -s .),
            \"status\": \"validated\"
        }" "$VERSION_MATRIX" > "$VERSION_MATRIX.tmp" && mv "$VERSION_MATRIX.tmp" "$VERSION_MATRIX"
    done
    
    echo -e "${GREEN}✅ Version matrix generated${NC}"
}

# Function to audit dependencies for security issues
audit_security() {
    echo -e "${BLUE}Auditing dependencies for security issues...${NC}"
    
    if [ ! -f "$DEPENDENCY_REGISTRY" ]; then
        echo -e "${RED}❌ Dependency registry not found. Run 'scan' first.${NC}"
        exit 1
    fi
    
    local security_issues=0
    
    # Known vulnerable packages (example list)
    local vulnerable_packages=(
        "axios:<0.21.1"
        "lodash:<4.17.21"
        "moment:<2.29.2"
        "request:<2.88.0"
        "express:<4.17.3"
    )
    
    # Check each component
    local components=$(jq -r '.components | keys[]' "$DEPENDENCY_REGISTRY")
    
    for component in $components; do
        echo -e "${BLUE}Auditing $component...${NC}"
        
        local dependencies=$(jq -r ".components[\"$component\"].dependencies[]? | \"\(.name):\(.version)\"" "$DEPENDENCY_REGISTRY")
        
        for dep in $dependencies; do
            local dep_name=$(echo "$dep" | cut -d':' -f1)
            local dep_version=$(echo "$dep" | cut -d':' -f2)
            
            # Check against vulnerable packages list
            for vuln in "${vulnerable_packages[@]}"; do
                local vuln_name=$(echo "$vuln" | cut -d':' -f1)
                local vuln_version=$(echo "$vuln" | cut -d':' -f2)
                
                if [ "$dep_name" = "$vuln_name" ]; then
                    echo -e "    ${RED}❌${NC} $dep_name $dep_version: potentially vulnerable (check against $vuln_version)"
                    ((security_issues++))
                fi
            done
        done
    done
    
    if [ $security_issues -eq 0 ]; then
        echo -e "${GREEN}✅ No known security issues found${NC}"
    else
        echo -e "${RED}❌ Found $security_issues potential security issues${NC}"
        echo -e "${YELLOW}⚠️  Please review and update vulnerable dependencies${NC}"
    fi
}

# Function to export dependency report
export_report() {
    echo -e "${BLUE}Exporting dependency report...${NC}"
    
    local report_file="$VERSION_MGMT_DIR/dependency-report-$(date +%Y%m%d-%H%M%S).json"
    
    # Combine all data into a comprehensive report
    cat > "$report_file" << EOF
{
  "report": {
    "version": "1.0",
    "generated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "controlCoreVersion": "$CURRENT_VERSION",
    "generator": "dependency-tracker"
  },
  "dependencyRegistry": $(cat "$DEPENDENCY_REGISTRY" 2>/dev/null || echo "{}"),
  "versionMatrix": $(cat "$VERSION_MATRIX" 2>/dev/null || echo "{}"),
  "compatibilityMatrix": $(cat "$COMPATIBILITY_MATRIX" 2>/dev/null || echo "{}"),
  "bom": $(cat "$BOM_FILE" 2>/dev/null || echo "{}"),
  "summary": {
    "totalComponents": $(jq '.components | length' "$DEPENDENCY_REGISTRY" 2>/dev/null || echo "0"),
    "totalDependencies": $(jq '[.components[].dependencies[]?] | length' "$DEPENDENCY_REGISTRY" 2>/dev/null || echo "0"),
    "conflicts": $(jq '.conflicts | length' "$COMPATIBILITY_MATRIX" 2>/dev/null || echo "0"),
    "warnings": $(jq '.warnings | length' "$COMPATIBILITY_MATRIX" 2>/dev/null || echo "0")
  }
}
EOF
    
    echo -e "${GREEN}✅ Dependency report exported: $report_file${NC}"
    
    # Also create a human-readable summary
    local summary_file="$VERSION_MGMT_DIR/dependency-summary-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$summary_file" << EOF
# Control Core Dependency Report

**Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")  
**Control Core Version:** $CURRENT_VERSION

## Summary

- **Total Components:** $(jq '.components | length' "$DEPENDENCY_REGISTRY" 2>/dev/null || echo "0")
- **Total Dependencies:** $(jq '[.components[].dependencies[]?] | length' "$DEPENDENCY_REGISTRY" 2>/dev/null || echo "0")
- **Version Conflicts:** $(jq '.conflicts | length' "$COMPATIBILITY_MATRIX" 2>/dev/null || echo "0")
- **Warnings:** $(jq '.warnings | length' "$COMPATIBILITY_MATRIX" 2>/dev/null || echo "0")

## Components

$(jq -r '.components | to_entries[] | "- **\(.key)**: \(.value.type) (\((.value.dependencies | length)) dependencies)"' "$DEPENDENCY_REGISTRY" 2>/dev/null || echo "No components found")

## Version Conflicts

$(jq -r '.conflicts[]? | "- **\(.dependency)**: versions \(.versions | join(", "))" in components \(.components | join(", "))' "$COMPATIBILITY_MATRIX" 2>/dev/null || echo "No conflicts found")

## Recommendations

1. Resolve all version conflicts
2. Update vulnerable dependencies
3. Standardize dependency versions across components
4. Implement automated dependency scanning in CI/CD

---

**Generated by Control Core Dependency Tracker**
EOF
    
    echo -e "${GREEN}✅ Summary report exported: $summary_file${NC}"
}

# Main script logic
case "${1:-help}" in
    scan)
        scan_dependencies
        ;;
    validate)
        validate_dependencies
        ;;
    update-registry)
        scan_dependencies
        generate_matrix
        ;;
    check-compatibility)
        check_compatibility
        ;;
    generate-matrix)
        generate_matrix
        ;;
    audit-security)
        audit_security
        ;;
    lock-dependencies)
        scan_dependencies
        validate_dependencies
        check_compatibility
        ;;
    export-report)
        export_report
        ;;
    help|*)
        show_help
        ;;
esac
