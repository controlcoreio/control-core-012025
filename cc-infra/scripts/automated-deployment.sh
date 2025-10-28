#!/bin/bash

# Control Core Automated Deployment Script
# Integrates with signup service and BAC logging
# Handles all deployment types: Kickstart, Pro, Custom

# --- Configuration ---
CONTROL_CORE_VERSION="012025.01"
DEPLOYMENT_MODE=""
TIER=""
CUSTOMER_ID=""
DEPLOYMENT_ID=""
DOMAIN=""
REGION="us-east-1"
SSL_MODE="letsencrypt"
PERFORMANCE_MODE="standard"
BAC_API_URL="http://localhost:8001"  # Business Admin Console API
STRIPE_WEBHOOK_SECRET="whsec_..."

# --- Colors for better output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Utility Functions ---
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ERROR: $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} WARNING: $1"
}

# --- BAC Integration Functions ---
log_to_bac() {
    local event_type="$1"
    local deployment_id="$2"
    local status="$3"
    local message="$4"
    
    local payload=$(cat <<EOF
{
    "event_type": "$event_type",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "deployment_id": "$deployment_id",
    "customer_id": "$CUSTOMER_ID",
    "tier": "$TIER",
    "status": "$status",
    "message": "$message",
    "deployment_mode": "$DEPLOYMENT_MODE",
    "domain": "$DOMAIN",
    "region": "$REGION"
}
EOF
)
    
    curl -s -X POST "$BAC_API_URL/api/events/deployment" \
        -H "Content-Type: application/json" \
        -d "$payload" > /dev/null 2>&1 || log_warn "Failed to log to BAC"
}

# --- Deployment Functions ---
deploy_kickstart() {
    log "Deploying Kickstart tier (Hybrid: Control Plane hosted, Bouncer self-hosted)"
    log_to_bac "deployment_started" "$DEPLOYMENT_ID" "in_progress" "Starting Kickstart deployment"
    
    # Create Bouncer-only deployment
    cat > docker-compose.yml <<EOF
version: '3.8'

services:
  # Control Core Bouncer (PEP) - Self-hosted
  cc-bouncer:
    image: controlcore/cc-bouncer:${CONTROL_CORE_VERSION}
    container_name: cc-bouncer-${DEPLOYMENT_ID}
    ports:
      - "8080:8080"
    environment:
      - BOUNCER_PORT=8080
      - TARGET_HOST=app.controlcore.io:443
      - PAP_API_URL=https://app.controlcore.io/api
      - OPAL_SERVER_URL=https://app.controlcore.io/opal
      - TENANT_ID=${CUSTOMER_ID}
      - API_KEY=${CUSTOMER_ID}_api_key
      - LOG_ENABLED=true
      - CACHE_ENABLED=true
      - DEPLOYMENT_ID=${DEPLOYMENT_ID}
      - TIER=kickstart
    volumes:
      - ./cc-data/bouncer:/app/data
      - ./cc-logs/bouncer:/app/logs
    networks:
      - controlcore-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  controlcore-network:
    driver: bridge
EOF

    # Deploy Bouncer
    docker-compose up -d
    log_success "Kickstart deployment completed"
    
    # Log completion to BAC
    log_to_bac "deployment_completed" "$DEPLOYMENT_ID" "success" "Kickstart deployment completed successfully"
    
    return 0
}

deploy_pro() {
    log "Deploying Pro tier (Hybrid: Control Plane hosted, Bouncer self-hosted with monitoring)"
    log_to_bac "deployment_started" "$DEPLOYMENT_ID" "in_progress" "Starting Pro deployment"
    
    # Create Bouncer + Monitoring deployment
    cat > docker-compose.yml <<EOF
version: '3.8'

services:
  # Control Core Bouncer (PEP) - Self-hosted
  cc-bouncer:
    image: controlcore/cc-bouncer:${CONTROL_CORE_VERSION}
    container_name: cc-bouncer-${DEPLOYMENT_ID}
    ports:
      - "8080:8080"
    environment:
      - BOUNCER_PORT=8080
      - TARGET_HOST=app.controlcore.io:443
      - PAP_API_URL=https://app.controlcore.io/api
      - OPAL_SERVER_URL=https://app.controlcore.io/opal
      - TENANT_ID=${CUSTOMER_ID}
      - API_KEY=${CUSTOMER_ID}_api_key
      - LOG_ENABLED=true
      - CACHE_ENABLED=true
      - DEPLOYMENT_ID=${DEPLOYMENT_ID}
      - TIER=pro
      - USAGE_TRACKING=true
      - MULTI_TENANT=true
    volumes:
      - ./cc-data/bouncer:/app/data
      - ./cc-logs/bouncer:/app/logs
    networks:
      - controlcore-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Monitoring and Analytics
  cc-monitoring:
    image: controlcore/cc-monitoring:${CONTROL_CORE_VERSION}
    container_name: cc-monitoring-${DEPLOYMENT_ID}
    ports:
      - "3001:3001"
    environment:
      - MONITORING_PORT=3001
      - DEPLOYMENT_ID=${DEPLOYMENT_ID}
      - CUSTOMER_ID=${CUSTOMER_ID}
      - TIER=pro
      - USAGE_TRACKING=true
      - BAC_API_URL=${BAC_API_URL}
    volumes:
      - ./cc-data/monitoring:/app/data
      - ./cc-logs/monitoring:/app/logs
    depends_on:
      - cc-bouncer
    networks:
      - controlcore-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  controlcore-network:
    driver: bridge
EOF

    # Deploy Bouncer + Monitoring
    docker-compose up -d
    log_success "Pro deployment completed"
    
    # Log completion to BAC
    log_to_bac "deployment_completed" "$DEPLOYMENT_ID" "success" "Pro deployment completed successfully"
    
    return 0
}

deploy_custom() {
    log "Deploying Custom tier (Fully self-hosted with all components)"
    log_to_bac "deployment_started" "$DEPLOYMENT_ID" "in_progress" "Starting Custom deployment"
    
    # Create full-stack deployment
    cat > docker-compose.yml <<EOF
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    container_name: cc-db-${DEPLOYMENT_ID}
    environment:
      - POSTGRES_DB=control_core_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - ./cc-data/postgres:/var/lib/postgresql/data
    networks:
      - controlcore-network
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7
    container_name: cc-redis-${DEPLOYMENT_ID}
    ports:
      - "6379:6379"
    volumes:
      - ./cc-data/redis:/data
    networks:
      - controlcore-network
    restart: unless-stopped

  # Control Core PAP API
  cc-pap-api:
    image: controlcore/cc-pap-api:${CONTROL_CORE_VERSION}
    container_name: cc-pap-api-${DEPLOYMENT_ID}
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/control_core_db
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${CUSTOMER_ID}_secret_key
      - ENVIRONMENT=production
      - LOG_LEVEL=info
      - DEPLOYMENT_ID=${DEPLOYMENT_ID}
      - CUSTOMER_ID=${CUSTOMER_ID}
      - TIER=custom
      - BAC_API_URL=${BAC_API_URL}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./cc-data/api:/app/data
      - ./cc-logs/api:/app/logs
    networks:
      - controlcore-network
    restart: unless-stopped

  # Control Core Frontend (Policy Admin UI)
  cc-frontend:
    image: controlcore/cc-pap:${CONTROL_CORE_VERSION}
    container_name: cc-frontend-${DEPLOYMENT_ID}
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://cc-pap-api:8000
      - NODE_ENV=production
      - DEPLOYMENT_ID=${DEPLOYMENT_ID}
      - CUSTOMER_ID=${CUSTOMER_ID}
      - TIER=custom
    depends_on:
      - cc-pap-api
    volumes:
      - ./cc-data/frontend:/app/data
      - ./cc-logs/frontend:/app/logs
    networks:
      - controlcore-network
    restart: unless-stopped

  # Control Core Bouncer (PEP)
  cc-bouncer:
    image: controlcore/cc-bouncer:${CONTROL_CORE_VERSION}
    container_name: cc-bouncer-${DEPLOYMENT_ID}
    ports:
      - "8080:8080"
    environment:
      - BOUNCER_PORT=8080
      - TARGET_HOST=cc-pap-api:8000
      - PAP_API_URL=http://cc-pap-api:8000
      - OPAL_SERVER_URL=http://cc-opal:7000
      - TENANT_ID=${CUSTOMER_ID}
      - API_KEY=${CUSTOMER_ID}_api_key
      - LOG_ENABLED=true
      - CACHE_ENABLED=true
      - DEPLOYMENT_ID=${DEPLOYMENT_ID}
      - TIER=custom
    depends_on:
      - cc-pap-api
      - cc-opal
    volumes:
      - ./cc-data/bouncer:/app/data
      - ./cc-logs/bouncer:/app/logs
    networks:
      - controlcore-network
    restart: unless-stopped

  # OPAL Server for Policy Synchronization
  cc-opal:
    image: permitio/opal-server:latest
    container_name: cc-opal-${DEPLOYMENT_ID}
    ports:
      - "7000:7000"
    environment:
      - OPAL_POLICY_REPO_URL=https://github.com/controlcore/policies
      - OPAL_DATA_SOURCES_CONFIG=./config/data-sources.json
      - PAP_API_URL=http://cc-pap-api:8000
      - DEPLOYMENT_ID=${DEPLOYMENT_ID}
      - CUSTOMER_ID=${CUSTOMER_ID}
    volumes:
      - ./cc-opal/config:/app/config
      - ./cc-data/opal:/app/data
    networks:
      - controlcore-network
    restart: unless-stopped

  # Monitoring and Analytics
  cc-monitoring:
    image: controlcore/cc-monitoring:${CONTROL_CORE_VERSION}
    container_name: cc-monitoring-${DEPLOYMENT_ID}
    ports:
      - "3001:3001"
    environment:
      - MONITORING_PORT=3001
      - DEPLOYMENT_ID=${DEPLOYMENT_ID}
      - CUSTOMER_ID=${CUSTOMER_ID}
      - TIER=custom
      - BAC_API_URL=${BAC_API_URL}
    volumes:
      - ./cc-data/monitoring:/app/data
      - ./cc-logs/monitoring:/app/logs
    depends_on:
      - cc-pap-api
      - cc-bouncer
    networks:
      - controlcore-network
    restart: unless-stopped

  # Backup Service
  cc-backup:
    image: controlcore/cc-backup:${CONTROL_CORE_VERSION}
    container_name: cc-backup-${DEPLOYMENT_ID}
    environment:
      - BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
      - DEPLOYMENT_ID=${DEPLOYMENT_ID}
      - CUSTOMER_ID=${CUSTOMER_ID}
      - TIER=custom
      - BAC_API_URL=${BAC_API_URL}
    volumes:
      - ./cc-backups:/app/backups
      - ./cc-data:/app/data:ro
    depends_on:
      - postgres
      - cc-pap-api
    networks:
      - controlcore-network
    restart: unless-stopped

networks:
  controlcore-network:
    driver: bridge
EOF

    # Deploy full stack
    docker-compose up -d
    log_success "Custom deployment completed"
    
    # Log completion to BAC
    log_to_bac "deployment_completed" "$DEPLOYMENT_ID" "success" "Custom deployment completed successfully"
    
    return 0
}

# --- SSL Configuration ---
setup_ssl() {
    if [ "$SSL_MODE" = "letsencrypt" ] && [ -n "$DOMAIN" ]; then
        log "Setting up SSL certificates for $DOMAIN"
        
        # Install certbot if not present
        if ! command -v certbot &> /dev/null; then
            log "Installing certbot..."
            if command -v apt-get &> /dev/null; then
                apt-get update && apt-get install -y certbot
            elif command -v yum &> /dev/null; then
                yum install -y certbot
            else
                log_warn "Cannot install certbot automatically. Please install manually."
            fi
        fi
        
        # Generate SSL certificate
        certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email "admin@controlcore.io"
        
        if [ $? -eq 0 ]; then
            log_success "SSL certificate generated for $DOMAIN"
            log_to_bac "ssl_configured" "$DEPLOYMENT_ID" "success" "SSL certificate configured for $DOMAIN"
        else
            log_error "Failed to generate SSL certificate for $DOMAIN"
            log_to_bac "ssl_failed" "$DEPLOYMENT_ID" "error" "Failed to configure SSL for $DOMAIN"
        fi
    fi
}

# --- Health Check ---
check_deployment_health() {
    log "Checking deployment health..."
    
    local health_checks=0
    local total_checks=0
    
    # Check based on deployment mode
    case "$DEPLOYMENT_MODE" in
        "kickstart")
            total_checks=1
            if curl -f http://localhost:8080/health > /dev/null 2>&1; then
                health_checks=$((health_checks + 1))
            fi
            ;;
        "pro")
            total_checks=2
            if curl -f http://localhost:8080/health > /dev/null 2>&1; then
                health_checks=$((health_checks + 1))
            fi
            if curl -f http://localhost:3001/health > /dev/null 2>&1; then
                health_checks=$((health_checks + 1))
            fi
            ;;
        "custom")
            total_checks=5
            if curl -f http://localhost:3000/health > /dev/null 2>&1; then
                health_checks=$((health_checks + 1))
            fi
            if curl -f http://localhost:8000/health > /dev/null 2>&1; then
                health_checks=$((health_checks + 1))
            fi
            if curl -f http://localhost:8080/health > /dev/null 2>&1; then
                health_checks=$((health_checks + 1))
            fi
            if curl -f http://localhost:7000/health > /dev/null 2>&1; then
                health_checks=$((health_checks + 1))
            fi
            if curl -f http://localhost:3001/health > /dev/null 2>&1; then
                health_checks=$((health_checks + 1))
            fi
            ;;
    esac
    
    if [ $health_checks -eq $total_checks ]; then
        log_success "All health checks passed ($health_checks/$total_checks)"
        log_to_bac "health_check_passed" "$DEPLOYMENT_ID" "success" "All services healthy"
        return 0
    else
        log_error "Health check failed ($health_checks/$total_checks services healthy)"
        log_to_bac "health_check_failed" "$DEPLOYMENT_ID" "error" "Health check failed: $health_checks/$total_checks"
        return 1
    fi
}

# --- Main Deployment Logic ---
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --tier)
                TIER="$2"
                shift 2
                ;;
            --customer-id)
                CUSTOMER_ID="$2"
                shift 2
                ;;
            --deployment-id)
                DEPLOYMENT_ID="$2"
                shift 2
                ;;
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --ssl-mode)
                SSL_MODE="$2"
                shift 2
                ;;
            --performance-mode)
                PERFORMANCE_MODE="$2"
                shift 2
                ;;
            --bac-api-url)
                BAC_API_URL="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option $1"
                exit 1
                ;;
        esac
    done
    
    # Validate required parameters
    if [ -z "$TIER" ] || [ -z "$CUSTOMER_ID" ] || [ -z "$DEPLOYMENT_ID" ]; then
        log_error "Missing required parameters: --tier, --customer-id, --deployment-id"
        exit 1
    fi
    
    # Set deployment mode based on tier
    case "$TIER" in
        "kickstart"|"pro")
            DEPLOYMENT_MODE="hybrid"
            ;;
        "custom")
            DEPLOYMENT_MODE="custom"
            ;;
        *)
            log_error "Invalid tier: $TIER. Must be kickstart, pro, or custom"
            exit 1
            ;;
    esac
    
    log "Starting automated deployment for $TIER tier"
    log "Customer ID: $CUSTOMER_ID"
    log "Deployment ID: $DEPLOYMENT_ID"
    log "Domain: ${DOMAIN:-'localhost'}"
    log "Region: $REGION"
    
    # Create deployment directory
    mkdir -p "deployments/$DEPLOYMENT_ID"
    cd "deployments/$DEPLOYMENT_ID"
    
    # Create data directories
    mkdir -p cc-data/{postgres,redis,api,frontend,bouncer,opal,monitoring}
    mkdir -p cc-logs/{api,frontend,bouncer,opal,monitoring}
    mkdir -p cc-backups
    mkdir -p cc-opal/config
    
    # Deploy based on tier
    case "$TIER" in
        "kickstart")
            deploy_kickstart
            ;;
        "pro")
            deploy_pro
            ;;
        "custom")
            deploy_custom
            ;;
    esac
    
    # Setup SSL if domain provided
    if [ -n "$DOMAIN" ]; then
        setup_ssl
    fi
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 30
    
    # Check deployment health
    if check_deployment_health; then
        log_success "Deployment completed successfully!"
        
        # Generate access information
        echo ""
        echo -e "${GREEN}🎉 Control Core Deployment Complete!${NC}"
        echo ""
        echo -e "${BLUE}Access Information:${NC}"
        
        case "$TIER" in
            "kickstart"|"pro")
                echo -e "  Control Plane: ${GREEN}https://app.controlcore.io${NC} (Hosted)"
                echo -e "  Bouncer: ${GREEN}http://localhost:8080${NC} (Local)"
                if [ "$TIER" = "pro" ]; then
                    echo -e "  Monitoring: ${GREEN}http://localhost:3001${NC} (Local)"
                fi
                ;;
            "custom")
                echo -e "  Control Plane: ${GREEN}http://localhost:3000${NC} (Local)"
                echo -e "  API: ${GREEN}http://localhost:8000${NC} (Local)"
                echo -e "  Bouncer: ${GREEN}http://localhost:8080${NC} (Local)"
                echo -e "  OPAL: ${GREEN}http://localhost:7000${NC} (Local)"
                echo -e "  Monitoring: ${GREEN}http://localhost:3001${NC} (Local)"
                ;;
        esac
        
        echo ""
        echo -e "${BLUE}Default Credentials:${NC}"
        echo -e "  Email: ${YELLOW}admin@controlcore.io${NC}"
        echo -e "  Password: ${YELLOW}admin123${NC}"
        echo ""
        echo -e "${YELLOW}Remember to change your default password immediately!${NC}"
        
        # Log final success to BAC
        log_to_bac "deployment_success" "$DEPLOYMENT_ID" "success" "Deployment completed successfully for $TIER tier"
        
    else
        log_error "Deployment health check failed"
        log_to_bac "deployment_failed" "$DEPLOYMENT_ID" "error" "Deployment health check failed"
        exit 1
    fi
}

# Run main function
main "$@"
