#!/bin/bash

# Control Core Version Manager (Delegation Script)
# This script delegates to the version management tools in cc-infra

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Version management directory
VERSION_MGMT_DIR="cc-infra/version-management"

# Check if version management directory exists
if [ ! -d "$VERSION_MGMT_DIR" ]; then
    echo -e "${RED}❌ Version management directory not found: $VERSION_MGMT_DIR${NC}"
    exit 1
fi

# Delegate to the actual version manager
exec "$VERSION_MGMT_DIR/scripts/version-manager.sh" "$@"