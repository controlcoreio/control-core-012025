#!/bin/bash

# Control Core Deployment Script
# Works with existing cc-infra structure and Helm charts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTROL_CORE_VERSION="012025.01"
DEPLOYMENT_MODE="custom"
DOMAIN="localhost"
NAMESPACE="controlcore"
SSL_MODE="self-signed"
PERFORMANCE_MODE="standard"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            DEPLOYMENT_MODE="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --namespace)
            NAMESPACE="$2"
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
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            show_help
            exit 1
            ;;
    esac
done

# Function to display help
show_help() {
    echo -e "${BLUE}Control Core Deployment Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --mode MODE              Deployment mode: custom, hybrid, kubernetes (default: custom)"
    echo "  --domain DOMAIN          Custom domain for production deployment"
    echo "  --namespace NAMESPACE    Kubernetes namespace (default: controlcore)"
    echo "  --ssl-mode MODE          SSL mode: self-signed, letsencrypt, disabled (default: self-signed)"
    echo "  --performance-mode MODE  Performance mode: minimal, standard, high (default: standard)"
    echo "  --help                   Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Custom deployment with Docker Compose"
    echo "  $0 --mode kubernetes                 # Kubernetes deployment with Helm"
    echo "  $0 --mode hybrid --domain mycompany.com"
    echo ""
    echo "Note: This script works with the existing cc-infra structure."
    echo "Make sure you're running this from the cc-infra directory."
}

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to log success
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to log warning
log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to log error
log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -d "helm-chart" ] || [ ! -d "docker-compose" ]; then
        log_error "Please run this script from the cc-infra directory"
        log_error "Expected to find helm-chart and docker-compose directories"
        log_error "Current directory: $(pwd)"
        exit 1
    fi
    
    # Check Docker for Docker Compose deployment
    if [ "$DEPLOYMENT_MODE" = "custom" ] || [ "$DEPLOYMENT_MODE" = "hybrid" ]; then
        if ! command -v docker &> /dev/null; then
            log_error "Docker is not installed. Please install Docker first."
            exit 1
        fi
        
        if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
            log_error "Docker Compose is not installed. Please install Docker Compose first."
            exit 1
        fi
        
        if ! docker info &> /dev/null; then
            log_error "Docker is not running. Please start Docker first."
            exit 1
        fi
    fi
    
    # Check Helm for Kubernetes deployment
    if [ "$DEPLOYMENT_MODE" = "kubernetes" ]; then
        if ! command -v helm &> /dev/null; then
            log_error "Helm is not installed. Please install Helm first."
            exit 1
        fi
        
        if ! command -v kubectl &> /dev/null; then
            log_error "kubectl is not installed. Please install kubectl first."
            exit 1
        fi
    fi
    
    log_success "Prerequisites check passed"
}

# Function to deploy with Docker Compose
deploy_docker_compose() {
    log "Deploying with Docker Compose..."
    
    # Copy the appropriate docker-compose file
    if [ "$DEPLOYMENT_MODE" = "hybrid" ]; then
        log "Configuring Hybrid deployment (Bouncer only)..."
        cp docker-compose/controlcore-compose.yml ./docker-compose.yml
        # Modify for hybrid mode - remove Control Plane services
        sed -i '/cc-pap-api:/,/^$/d' docker-compose.yml
        sed -i '/cc-pap:/,/^$/d' docker-compose.yml
        sed -i '/postgres:/,/^$/d' docker-compose.yml
        sed -i '/redis:/,/^$/d' docker-compose.yml
    else
        log "Configuring Custom deployment (full stack)..."
        cp docker-compose/controlcore-compose.yml ./docker-compose.yml
    fi
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    
    if [ "$DEPLOYMENT_MODE" = "custom" ]; then
        # Wait for database
        log "Waiting for database..."
        timeout 60 bash -c 'until docker-compose exec -T postgres pg_isready; do sleep 2; done'
        
        # Wait for Redis
        log "Waiting for Redis..."
        timeout 60 bash -c 'until docker-compose exec -T redis redis-cli ping; do sleep 2; done'
        
        # Wait for API
        log "Waiting for API..."
        timeout 120 bash -c 'until curl -f http://localhost:8000/health; do sleep 5; done'
        
        # Wait for Frontend
        log "Waiting for Frontend..."
        timeout 120 bash -c 'until curl -f http://localhost:3000; do sleep 5; done'
    fi
    
    # Wait for Bouncer
    log "Waiting for Bouncer..."
    timeout 120 bash -c 'until curl -f http://localhost:8080/health; do sleep 5; done'
    
    log_success "All services are healthy and running"
}

# Function to deploy with Kubernetes
deploy_kubernetes() {
    log "Deploying with Kubernetes Helm chart..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy with Helm
    helm upgrade --install controlcore helm-chart/controlcore \
        --namespace $NAMESPACE \
        --set global.domain=$DOMAIN \
        --set global.ssl.enabled=$([ "$SSL_MODE" != "disabled" ] && echo "true" || echo "false") \
        --set global.performance.mode=$PERFORMANCE_MODE \
        --wait
    
    log_success "Kubernetes deployment completed"
}

# Function to display deployment information
display_deployment_info() {
    log "Deployment completed successfully!"
    echo ""
    echo -e "${GREEN}🎉 Control Core is now running!${NC}"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    
    case $DEPLOYMENT_MODE in
        "hybrid")
            echo -e "  Control Plane: ${GREEN}https://app.controlcore.io${NC} (Hosted by Control Core)"
            echo -e "  Bouncer Health: ${GREEN}https://localhost:8080/health${NC} (Local deployment)"
            ;;
        "kubernetes")
            echo -e "  Control Plane: ${GREEN}https://$DOMAIN${NC} (or check ingress)"
            echo -e "  API Documentation: ${GREEN}https://$DOMAIN/docs${NC}"
            echo -e "  Bouncer Health: ${GREEN}https://$DOMAIN:8080/health${NC}"
            ;;
        *)
            echo -e "  Control Plane: ${GREEN}https://localhost:3000${NC}"
            echo -e "  API Documentation: ${GREEN}https://localhost:8000/docs${NC}"
            echo -e "  Bouncer Health: ${GREEN}https://localhost:8080/health${NC}"
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}Default Credentials:${NC}"
    echo -e "  Email: ${YELLOW}admin@controlcore.io${NC}"
    echo -e "  Password: ${YELLOW}admin123${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Please change the default password immediately after login${NC}"
    echo ""
    echo -e "${BLUE}Environment Management:${NC}"
    echo -e "  Sandbox Mode: ${GREEN}Active (default)${NC}"
    echo -e "  Production Mode: ${YELLOW}Switch via Control Plane UI${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. Login to Control Plane"
    echo -e "  2. Change default password"
    echo -e "  3. Create your first policy"
    echo -e "  4. Deploy Bouncer to your applications"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  View logs: ${GREEN}docker-compose logs${NC} or ${GREEN}kubectl logs -n $NAMESPACE${NC}"
    echo -e "  Stop: ${GREEN}docker-compose down${NC} or ${GREEN}helm uninstall controlcore -n $NAMESPACE${NC}"
}

# Main deployment function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Control Core Deployment                   ║"
    echo "║                  Deploy in under 30 minutes                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check prerequisites
    check_prerequisites
    
    # Deploy based on mode
    case $DEPLOYMENT_MODE in
        "kubernetes")
            deploy_kubernetes
            ;;
        "hybrid"|"custom")
            deploy_docker_compose
            ;;
        *)
            log_error "Unknown deployment mode: $DEPLOYMENT_MODE"
            log_error "Supported modes: custom, hybrid, kubernetes"
            exit 1
            ;;
    esac
    
    # Display deployment information
    display_deployment_info
}

# Run main function
main "$@"
