#!/bin/bash

# Control Core Database Setup Script (Delegation)
# This script delegates to the database setup script in cc-infra

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Infrastructure directory
INFRA_DIR="cc-infra"

# Check if infrastructure directory exists
if [ ! -d "$INFRA_DIR" ]; then
    echo -e "${RED}❌ Infrastructure directory not found: $INFRA_DIR${NC}"
    exit 1
fi

# Delegate to the actual database setup script
exec "$INFRA_DIR/scripts/setup-databases.sh" "$@"