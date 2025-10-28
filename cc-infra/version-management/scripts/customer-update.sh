#!/bin/bash

# Control Core Customer Update Script
# This script helps customers update their Control Core deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Current version
CURRENT_VERSION=$(cat VERSION 2>/dev/null || echo "012025")

# Function to display help
show_help() {
    echo -e "${BLUE}Control Core Customer Update Script${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  check                 Check for available updates"
    echo "  update               Update to latest version"
    echo "  rollback             Rollback to previous version"
    echo "  status               Show current version and status"
    echo "  release-notes        Show release notes for current version"
    echo "  backup               Create backup before update"
    echo "  restore <backup>     Restore from backup"
    echo "  help                 Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 check"
    echo "  $0 update"
    echo "  $0 status"
    echo "  $0 release-notes"
}

# Function to check for updates
check_updates() {
    echo -e "${BLUE}Checking for Control Core updates...${NC}"
    
    # In a real implementation, this would check a remote registry
    # For now, we'll simulate checking for updates
    local latest_version="012025"
    local current_version=$CURRENT_VERSION
    
    if [ "$current_version" = "$latest_version" ]; then
        echo -e "${GREEN}✅ Control Core is up to date (version $current_version)${NC}"
    else
        echo -e "${YELLOW}🔄 Update available: $current_version → $latest_version${NC}"
        echo -e "${BLUE}Run '$0 update' to update to the latest version${NC}"
    fi
}

# Function to show current status
show_status() {
    echo -e "${BLUE}Control Core Status${NC}"
    echo ""
    echo -e "${BLUE}Current Version: ${GREEN}$CURRENT_VERSION${NC}"
    echo -e "${BLUE}Release Date: ${GREEN}January 2025${NC}"
    echo ""
    
    # Check service status
    echo -e "${BLUE}Service Status:${NC}"
    
    # Check PAP API
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅${NC} PAP API: Running"
    else
        echo -e "  ${RED}❌${NC} PAP API: Not running"
    fi
    
    # Check Bouncer
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅${NC} Bouncer: Running"
    else
        echo -e "  ${RED}❌${NC} Bouncer: Not running"
    fi
    
    # Check OPAL
    if curl -f http://localhost:7000/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅${NC} OPAL Server: Running"
    else
        echo -e "  ${RED}❌${NC} OPAL Server: Not running"
    fi
}

# Function to show release notes
show_release_notes() {
    if [ -f "RELEASE_NOTES.md" ]; then
        echo -e "${BLUE}Control Core Release Notes${NC}"
        echo ""
        cat RELEASE_NOTES.md
    else
        echo -e "${RED}❌ Release notes not found${NC}"
    fi
}

# Function to create backup
create_backup() {
    local backup_dir="backups/control-core-$(date +%Y%m%d-%H%M%S)"
    
    echo -e "${BLUE}Creating backup...${NC}"
    mkdir -p "$backup_dir"
    
    # Backup configuration files
    cp docker-compose.yml "$backup_dir/" 2>/dev/null || true
    cp .env "$backup_dir/" 2>/dev/null || true
    cp VERSION "$backup_dir/" 2>/dev/null || true
    
    # Backup database (if accessible)
    if docker ps | grep -q postgres; then
        echo -e "${YELLOW}Backing up databases...${NC}"
        docker-compose exec -T postgres pg_dump -U postgres control_core_pap_db > "$backup_dir/pap_db.sql" 2>/dev/null || true
        docker-compose exec -T postgres pg_dump -U postgres control_core_pap_pro_tenant_db > "$backup_dir/pap_pro_tenant_db.sql" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Backup created: $backup_dir${NC}"
    echo "$backup_dir"
}

# Function to update Control Core
update_control_core() {
    echo -e "${BLUE}Updating Control Core...${NC}"
    
    # Create backup first
    local backup_dir=$(create_backup)
    
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose down
    
    echo -e "${YELLOW}Pulling latest images...${NC}"
    docker-compose pull
    
    echo -e "${YELLOW}Starting updated services...${NC}"
    docker-compose up -d
    
    echo -e "${BLUE}Waiting for services to be ready...${NC}"
    sleep 30
    
    # Check service health
    echo -e "${BLUE}Verifying update...${NC}"
    show_status
    
    echo -e "${GREEN}✅ Control Core updated successfully!${NC}"
    echo -e "${BLUE}Backup location: $backup_dir${NC}"
}

# Function to rollback
rollback_control_core() {
    local backup_dir=$1
    
    if [ -z "$backup_dir" ]; then
        echo -e "${RED}❌ Backup directory is required${NC}"
        echo "Usage: $0 rollback <backup_directory>"
        exit 1
    fi
    
    if [ ! -d "$backup_dir" ]; then
        echo -e "${RED}❌ Backup directory not found: $backup_dir${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Rolling back Control Core...${NC}"
    
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose down
    
    echo -e "${YELLOW}Restoring configuration...${NC}"
    cp "$backup_dir/docker-compose.yml" . 2>/dev/null || true
    cp "$backup_dir/.env" . 2>/dev/null || true
    cp "$backup_dir/VERSION" . 2>/dev/null || true
    
    echo -e "${YELLOW}Starting services...${NC}"
    docker-compose up -d
    
    echo -e "${GREEN}✅ Control Core rolled back successfully!${NC}"
}

# Function to restore from backup
restore_backup() {
    local backup_dir=$1
    
    if [ -z "$backup_dir" ]; then
        echo -e "${RED}❌ Backup directory is required${NC}"
        echo "Usage: $0 restore <backup_directory>"
        exit 1
    fi
    
    if [ ! -d "$backup_dir" ]; then
        echo -e "${RED}❌ Backup directory not found: $backup_dir${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Restoring from backup: $backup_dir${NC}"
    
    # Restore configuration
    cp "$backup_dir/docker-compose.yml" . 2>/dev/null || true
    cp "$backup_dir/.env" . 2>/dev/null || true
    cp "$backup_dir/VERSION" . 2>/dev/null || true
    
    # Restore databases if available
    if [ -f "$backup_dir/pap_db.sql" ]; then
        echo -e "${YELLOW}Restoring databases...${NC}"
        docker-compose up -d postgres
        sleep 10
        docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS control_core_pap_db; CREATE DATABASE control_core_pap_db;"
        docker-compose exec -T postgres psql -U postgres control_core_pap_db < "$backup_dir/pap_db.sql"
    fi
    
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
}

# Main script logic
case "${1:-help}" in
    check)
        check_updates
        ;;
    update)
        update_control_core
        ;;
    rollback)
        rollback_control_core "$2"
        ;;
    status)
        show_status
        ;;
    release-notes)
        show_release_notes
        ;;
    backup)
        create_backup
        ;;
    restore)
        restore_backup "$2"
        ;;
    help|*)
        show_help
        ;;
esac
