# Control Core Dependency Management
This document describes the comprehensive dependency management system for Control Core, ensuring version consistency, security, and compatibility across all components.
## Overview
Control Core uses a multi-layered dependency management system that:
- **Tracks all dependencies** across Node.js, Python, and Go components
- **Validates version consistency** against the Bill of Materials (BOM)
- **Detects compatibility issues** between components
- **Audits for security vulnerabilities**
- **Generates comprehensive reports** for compliance and maintenance
## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Dependency Management                    │
├─────────────────────────────────────────────────────────────┤
│  Version Manager  │  BOM Manager  │  Dependency Tracker     │
├─────────────────────────────────────────────────────────────┤
│  Component Scanner │  Compatibility Check │  Security Audit │
├─────────────────────────────────────────────────────────────┤
│  Node.js (package.json) │ Python (requirements.txt) │ Go (go.mod) │
└─────────────────────────────────────────────────────────────┘
```
## Components
### 1. Dependency Tracker (`dependency-tracker.sh`)
The core dependency management tool that scans, validates, and tracks all dependencies.
#### Features:

- **Multi-language support**: Node.js, Python, Go
- **Version conflict detection**: Identifies inconsistent versions across components
- **Security auditing**: Checks for known vulnerabilities
- **Compatibility matrix**: Generates version compatibility reports
- **Export capabilities**: Creates detailed dependency reports
#### Usage:

```bash
# Scan all components for dependencies

./dependency-tracker.sh scan
# Validate dependencies against BOM

./dependency-tracker.sh validate
# Check component compatibility

./dependency-tracker.sh check-compatibility
# Audit for security issues

./dependency-tracker.sh audit-security
# Export comprehensive report

./dependency-tracker.sh export-report
```
### 2. BOM Manager (`bom-manager.sh`)
Manages the Bill of Materials with exact versions and dependencies.
#### Features:

- **Version locking**: Ensures exact version consistency
- **Image validation**: Verifies container image availability
- **Offline deployment**: Generates offline deployment packages
- **Security validation**: Ensures no internal artifacts leak
### 3. Version Manager (`version-manager.sh`)
Enhanced version management with dependency integration.
#### New Commands:

```bash
# Scan dependencies

./version-manager.sh scan-deps
# Validate dependency versions

./version-manager.sh validate-deps
# Check component compatibility

./version-manager.sh check-compatibility
# Audit for security issues

./version-manager.sh audit-security
# Export dependency report

./version-manager.sh export-deps-report
```
## Dependency Types
### 1. Runtime Dependencies

Essential dependencies required for application execution:
- **Framework libraries**: React, Express, Flask, Gin
- **Database drivers**: PostgreSQL, Redis clients
- **Authentication**: JWT, OAuth libraries
- **Utility libraries**: Lodash, Axios, Requests
### 2. Development Dependencies

Dependencies used during development and testing:
- **Build tools**: Webpack, Babel, TypeScript
- **Testing frameworks**: Jest, Pytest, Go testing
- **Linting tools**: ESLint, Prettier, Go fmt
- **Documentation tools**: JSDoc, Sphinx
### 3. System Dependencies

External system dependencies:
- **Container images**: PostgreSQL, Redis, OPAL
- **Kubernetes resources**: Ingress controllers, storage classes
- **Operating system**: Linux distributions, kernel versions
## Supported Technologies
### Node.js Components

- **cc-pap**: Policy Administration Point frontend
- **acme-consulting-demo-frontend**: Demo application frontend
**Files scanned**: `package.json`
**Dependencies tracked**: `dependencies`, `devDependencies`
### Python Components

- **cc-pap-api**: Policy Administration Point API
- **cc-pap-pro-tenant**: Pro tenant service
- **cc-signup-service**: User signup service
- **acme-consulting-demo-api**: Demo application API
- **opal**: OPAL server and client
**Files scanned**: `requirements.txt`
**Dependencies tracked**: All pip packages with version constraints
### Go Components

- **cc-bouncer**: Policy Enforcement Point
**Files scanned**: `go.mod`
**Dependencies tracked**: All Go modules with versions
## Version Management Strategy
### 1. Version Locking

All dependencies are locked to exact versions:
```json
{
  "dependencies": {
    "react": "18.2.0",        // Exact version
    "axios": "1.4.0",         // Exact version
    "lodash": "4.17.21"       // Exact version
  }
}
```
### 2. BOM Consistency

All component versions must match the BOM:
```json
{
  "components": [
    {
      "name": "cc-frontend",
      "version": "012025.01",  // Must match BOM
      "dependencies": [
        {
          "name": "react",
          "version": "18.2.0",  // Must match BOM
          "approved": true
        }
      ]
    }
  ]
}
```
### 3. Compatibility Matrix

Generated compatibility matrix ensures component interoperability:
```json
{
  "compatibility": {
    "cc-frontend": {
      "react": "18.2.0",
      "compatibleWith": ["cc-pap-api:012025.01"]
    },
    "cc-pap-api": {
      "fastapi": "0.100.0",
      "compatibleWith": ["cc-frontend:012025.01", "cc-bouncer:012025.01"]
    }
  }
}
```
## Security Management
### 1. Vulnerability Scanning

Automated scanning for known security issues:

```bash
# Known vulnerable packages

vulnerable_packages=(
    "axios:<0.21.1"
    "lodash:<4.17.21"
    "moment:<2.29.2"
    "request:<2.88.0"
)
```
### 2. Dependency Approval

All dependencies must be approved before inclusion:
```json
{
  "approvalStatus": "approved",
  "securityScan": "passed",
  "lastValidated": "2025-01-25T00:00:00Z"
}
```
### 3. Supply Chain Security

- **Digest verification**: All container images include SHA256 digests
- **Source validation**: Dependencies from trusted sources only
- **License compliance**: All dependencies have compatible licenses
## Workflow Integration
### 1. Development Workflow

```bash
# 1. Scan dependencies after changes

./dependency-tracker.sh scan
# 2. Validate against BOM

./dependency-tracker.sh validate
# 3. Check compatibility

./dependency-tracker.sh check-compatibility
# 4. Audit security

./dependency-tracker.sh audit-security
```
### 2. Release Workflow

```bash
# 1. Update version

./version-manager.sh bump patch
# 2. Update all components (includes dependency validation)

./version-manager.sh update
# 3. Generate BOM

./bom-manager.sh update
# 4. Validate deployment

./deployment-validator.sh pre-deployment
# 5. Create customer package

./create-customer-package.sh --version 012025.02
```
### 3. CI/CD Integration

```yaml
# .github/workflows/dependency-check.yml

name: Dependency Management
on: [push, pull_request]
jobs:
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Scan Dependencies
        run: ./cc-infra/version-management/scripts/dependency-tracker.sh scan
      
      - name: Validate Dependencies
        run: ./cc-infra/version-management/scripts/dependency-tracker.sh validate
      
      - name: Check Compatibility
        run: ./cc-infra/version-management/scripts/dependency-tracker.sh check-compatibility
      
      - name: Security Audit
        run: ./cc-infra/version-management/scripts/dependency-tracker.sh audit-security
```
## Reporting and Monitoring
### 1. Dependency Reports

Comprehensive JSON and Markdown reports:
```json
{
  "report": {
    "version": "1.0",
    "generated": "2025-01-25T00:00:00Z",
    "controlCoreVersion": "012025.01"
  },
  "summary": {
    "totalComponents": 8,
    "totalDependencies": 156,
    "conflicts": 0,
    "warnings": 2
  }
}
```
### 2. Compatibility Matrix

```json
{
  "compatibility": {
    "components": {
      "cc-frontend": {
        "dependencies": ["react:18.2.0", "axios:1.4.0"],
        "compatibleWith": ["cc-pap-api:012025.01"]
      }
    },
    "conflicts": [],
    "warnings": []
  }
}
```
### 3. Security Report

```json
{
  "security": {
    "scanDate": "2025-01-25T00:00:00Z",
    "vulnerabilities": [],
    "approvedDependencies": 156,
    "pendingApproval": 0
  }
}
```
## Best Practices
### 1. Dependency Management

- **Always use exact versions**: No floating tags or version ranges
- **Regular scanning**: Scan dependencies after any changes
- **Security first**: Audit dependencies before approval
- **Documentation**: Document all dependency decisions
### 2. Version Consistency

- **BOM alignment**: All versions must match the BOM
- **Cross-component compatibility**: Ensure component interoperability
- **Testing**: Test with exact dependency versions
- **Rollback capability**: Maintain ability to rollback versions
### 3. Security Practices

- **Vulnerability scanning**: Regular security audits
- **Approval process**: All dependencies must be approved
- **License compliance**: Verify license compatibility
- **Supply chain**: Use trusted dependency sources
## Troubleshooting
### Common Issues
1. **Version Conflicts**
   ```bash
   # Check for conflicts
   ./dependency-tracker.sh check-compatibility
   
   # Resolve by updating to consistent versions
   ./version-manager.sh update
   ```
2. **Security Vulnerabilities**
   ```bash
   # Run security audit
   ./dependency-tracker.sh audit-security
   
   # Update vulnerable dependencies
   # Update package files and re-scan
   ./dependency-tracker.sh scan
   ```
3. **BOM Validation Failures**
   ```bash
   # Validate dependencies
   ./dependency-tracker.sh validate
   
   # Update BOM
   ./bom-manager.sh update
   ```
### Debug Commands

```bash
# Export detailed report

./dependency-tracker.sh export-report
# Check specific component

jq '.components["cc-frontend"]' dependency-registry.json
# View compatibility issues

jq '.conflicts' compatibility-matrix.json
# Check security issues

jq '.security' dependency-report-*.json
```
## Integration with Customer Deployments
### 1. Customer Package Validation

```bash
# Validate customer package has no internal dependencies

./deployment-validator.sh customer-package ./customer-package
# Ensure all dependencies are version-locked

./bom-manager.sh validate
```
### 2. Offline Deployment Support

```bash
# Generate offline package with locked dependencies

./bom-manager.sh generate-offline
# Verify offline compatibility

./bom-manager.sh verify-deployment
```
## Future Enhancements
### 1. Automated Updates

- **Dependency update automation**: Automated security updates
- **Version bump automation**: Automated patch version updates
- **Compatibility testing**: Automated compatibility validation
### 2. Enhanced Security

- **Real-time vulnerability scanning**: Continuous security monitoring
- **License compliance automation**: Automated license checking
- **Supply chain validation**: Enhanced supply chain security
### 3. Advanced Analytics

- **Dependency usage analytics**: Usage patterns and optimization
- **Performance impact analysis**: Dependency performance impact
- **Cost optimization**: Dependency cost analysis
---
**Control Core Dependency Management** - Comprehensive, secure, and automated dependency management for enterprise deployments.
