# Control Core Version Management
This directory contains all version management tools, documentation, and scripts for Control Core.
## 📁 Directory Structure
```
cc-infra/version-management/
├── internal/                    # Internal development files (NOT shipped to customers)
│   ├── VERSION                 # Current internal version
│   └── INTERNAL_CHANGELOG.md   # Internal development changelog
├── customer/                   # Customer-facing files (shipped with containers)
│   ├── CUSTOMER_VERSION        # Current customer version
│   └── RELEASE_NOTES.md        # Customer release notes
├── scripts/                    # Version management scripts
│   ├── version-manager.sh      # Main version management script
│   ├── customer-update.sh      # Customer update script
│   └── create-customer-package.sh # Customer package creator
└── README.md                   # This file
```
## 🔢 Version Format
Control Core uses a quarterly release schedule with patch versions:
- **Format**: `QQYYYY.PP` (Quarter + Year + Patch)
- **Quarter**: 01 (Q1), 02 (Q2), 03 (Q3), 04 (Q4)
- **Year**: 4-digit year (e.g., 2025)
- **Patch**: 2-digit patch number (00-99)
### Examples:

- `012025.00` - Q1 2025, Initial Release
- `012025.01` - Q1 2025, Bug Fix #1
- `012025.02` - Q1 2025, Security Update
- `022025.00` - Q2 2025, New Quarterly Release
## 🚀 Usage
### From Project Root

```bash
# Use the delegation script in project root

./version-manager.sh current
./version-manager.sh status
./version-manager.sh bump patch
```
### Direct Usage

```bash
# Use scripts directly

cd cc-infra/version-management/scripts
./version-manager.sh current
./version-manager.sh status
./version-manager.sh bump patch
```
## 📋 Available Commands
### Version Management

```bash
# Show current internal version

./version-manager.sh current
# Show current customer version

./version-manager.sh customer
# Set new internal version

./version-manager.sh set 012025.01
# Set new customer version

./version-manager.sh set-customer 012025.01
# Bump version

./version-manager.sh bump quarter    # 012025.00 -> 022025.00
./version-manager.sh bump patch      # 012025.00 -> 012025.01
# Update all components

./version-manager.sh update
# Show component status

./version-manager.sh status
```
### Documentation

```bash
# Show internal changelog

./version-manager.sh changelog
# Show customer release notes

./version-manager.sh release-notes
```
### Release Management

```bash
# Create release package

./version-manager.sh release
```
## 🔄 Release Schedule
### Quarterly Releases (Major Features)

- **Q1 2025**: `012025.00` - Initial release
- **Q2 2025**: `022025.00` - Enhanced AI features
- **Q3 2025**: `032025.00` - Advanced compliance
- **Q4 2025**: `042025.00` - Performance optimizations
### Patch Releases (Bug Fixes & Security)

- **012025.01** - Bug fixes for Q1 2025
- **012025.02** - Security updates for Q1 2025
- **022025.01** - Bug fixes for Q2 2025
- **032025.01** - Bug fixes for Q3 2025
## 📦 Customer Package Management
### Create Customer Package

```bash
# Create customer package (excludes internal files)

./create-customer-package.sh
# Create package with specific version

./create-customer-package.sh --version 012025.01
# Create package in specific directory

./create-customer-package.sh --output /tmp/control-core
```
### Customer Updates

```bash
# Check for updates

./customer-update.sh check
# Update to latest version

./customer-update.sh update
# Show current status

./customer-update.sh status
# Show release notes

./customer-update.sh release-notes
# Create backup

./customer-update.sh backup
# Rollback to previous version

./customer-update.sh rollback <backup-directory>
```
## 🏗️ File Organization
### Internal Files (NOT Shipped)

- `internal/VERSION` - Current internal development version
- `internal/INTERNAL_CHANGELOG.md` - Internal development changelog
- `scripts/version-manager.sh` - Internal version management
- `scripts/create-customer-package.sh` - Package creation script
### Customer Files (Shipped)

- `customer/CUSTOMER_VERSION` - Current customer version
- `customer/RELEASE_NOTES.md` - Customer release notes
- `scripts/customer-update.sh` - Customer update script
## 🔒 Security Considerations
### Internal vs Customer Separation

- **Internal files** are never shipped to customers
- **Customer files** are included in customer packages
- **Scripts** are organized by audience (internal vs customer)
### Version Tracking

- Internal version tracks development progress
- Customer version tracks shipped releases
- Both versions can be different (e.g., internal: 012025.05, customer: 012025.01)
## 📝 Best Practices
### Version Management

1. **Quarterly Releases**: Plan major features for quarterly releases
2. **Patch Releases**: Use patch releases for bug fixes and security updates
3. **Version Sync**: Keep internal and customer versions in sync for releases
4. **Documentation**: Update changelog and release notes for each version
### Release Process

1. **Development**: Develop features in feature branches
2. **Testing**: Test thoroughly before release
3. **Version Bump**: Use appropriate bump type (quarter vs patch)
4. **Documentation**: Update changelog and release notes
5. **Package**: Create customer package
6. **Deploy**: Deploy to customers
### Customer Updates

1. **Backup**: Always create backup before updates
2. **Test**: Test updates in staging environment
3. **Rollback**: Have rollback plan ready
4. **Communication**: Notify customers of updates
## 🆘 Troubleshooting
### Common Issues

1. **Version Format**: Ensure version follows `QQYYYY.PP` format
2. **File Permissions**: Ensure scripts are executable (`chmod +x`)
3. **Path Issues**: Run scripts from correct directory
4. **Dependencies**: Ensure required tools are installed
### Getting Help

```bash
# Show help for version manager

./version-manager.sh help
# Show help for customer update

./customer-update.sh help
# Show help for package creation

./create-customer-package.sh --help
```
---
**Control Core Version Management** - Organized, efficient, and customer-focused version management for the Control Core platform.
