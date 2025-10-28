#!/bin/bash

# Control Core Docker Compose Script (Delegation)
# This script delegates to the docker-compose file in cc-infra

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

# Check if docker-compose file exists
if [ ! -f "$INFRA_DIR/docker-compose/controlcore-compose.yml" ]; then
    echo -e "${RED}❌ Docker Compose file not found: $INFRA_DIR/docker-compose/controlcore-compose.yml${NC}"
    exit 1
fi

# Delegate to docker-compose with the cc-infra file
exec docker-compose -f "$INFRA_DIR/docker-compose/controlcore-compose.yml" "$@"
