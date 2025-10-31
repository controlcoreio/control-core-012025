# Regal Language Server Version

## Current Version: v0.36.0
**Last Updated:** 2025-01-31

## About Regal

Regal is the official linter and language server for Rego (Open Policy Agent's policy language). It provides:

- **Linting**: Static analysis to catch bugs and enforce best practices
- **Language Server**: LSP implementation for IDE integration
- **Formatting**: Consistent code style enforcement
- **Diagnostics**: Real-time error detection and reporting

**Official Repository**: https://github.com/open-policy-agent/regal

## Update Instructions

To update Regal to a new version:

1. Run the sync script:
   ```bash
   cd cc-pap-core/scripts
   ./sync-regal-version.sh [version]
   ```

2. Test the integration:
   - Start the Control Core backend
   - Open the policy code editor
   - Verify syntax highlighting works
   - Verify completions work
   - Verify hover information works
   - Verify diagnostics/linting works

3. Update release notes with Regal changes

## Manual Update Process

If the sync script cannot be used, follow these manual steps:

### 1. Update package.json Files
Update the Regal dependency version in:
- `cc-language-server/package.json`
- `cc-pap-core/package.json` (if applicable)

### 2. Update Dockerfiles
Update Regal binary download URLs in:
- `cc-pap-api/Dockerfile`

Example:
```dockerfile
curl -fsSL "https://github.com/open-policy-agent/regal/releases/download/v0.36.0/regal_Linux_x86_64.tar.gz"
```

### 3. Update BOM and Version Management
Update the version in:
- `cc-infra/version-management/BOM.json`
- `cc-infra/version-management/DEPENDENCY_UPDATE_v2025.01.md`

### 4. Test Integration
```bash
# Test Regal binary
regal version

# Test linting
regal lint path/to/policy.rego

# Test language server
regal language-server
```

## Integration Architecture

Control Core integrates Regal in two ways:

### 1. Backend Linting Service
**Location**: `cc-pap-api/app/services/production_regal_linter.py`

The backend spawns Regal as a subprocess to:
- Validate policies before deployment
- Format policies according to best practices
- Provide linting feedback in the API

### 2. Frontend Language Server
**Location**: `cc-pap-core/services/language-server/`

The frontend integrates Regal's LSP to provide:
- Real-time syntax checking in Monaco editor
- IntelliSense completions for Rego keywords and functions
- Hover documentation for built-in functions
- Go-to-definition for rules and variables
- Code formatting on save

## Version History

### v0.36.0 (2025-01-31)
- Initial integration with Control Core
- Moved language server from cc-language-server to cc-pap-core for shared access
- Created LSP proxy for Monaco editor integration
- Automated sync script for future updates
- See: https://github.com/open-policy-agent/regal/releases/tag/v0.36.0

## Compatibility

### OPA Compatibility
Regal v0.36.0 supports OPA versions:
- v0.68.0 and above
- Compatible with OPA v1.0+ features

### Control Core Components
- **cc-pap**: Monaco editor with Regal LSP
- **cc-pap-api**: Backend validation service
- **cc-pap-core**: Shared language server services

## Troubleshooting

### Regal Binary Not Found
If you see "regal not found" errors:

1. Verify installation:
   ```bash
   which regal
   regal version
   ```

2. Install Regal:
   ```bash
   go install github.com/open-policy-agent/regal/cmd/regal@latest
   ```

3. Or download binary directly:
   ```bash
   curl -L -o regal https://github.com/open-policy-agent/regal/releases/download/v0.36.0/regal_Darwin_arm64
   chmod +x regal
   sudo mv regal /usr/local/bin/
   ```

### Language Server Not Connecting
If Monaco editor shows connection errors:

1. Check backend logs for Regal LSP errors
2. Verify Regal can start in language server mode:
   ```bash
   regal language-server
   ```
3. Check firewall/security settings

### Linting Performance Issues
If linting is slow:

1. Enable caching in production_regal_linter.py
2. Increase timeout values if needed
3. Check for very large policy files

## Resources

- **Regal Documentation**: https://docs.styra.com/regal
- **Regal Rules**: https://docs.styra.com/regal/rules
- **OPA Documentation**: https://www.openpolicyagent.org/docs/latest/
- **Control Core Rego Guidelines**: See cc-docs/app/guides/rego-guidelines/

