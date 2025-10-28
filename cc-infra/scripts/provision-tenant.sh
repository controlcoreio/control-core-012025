#!/bin/bash

# Control Core Pro Tenant Provisioning Script
# This script provides a backup method for manual tenant provisioning
# when the automated Kubernetes provisioning fails

set -e

# Configuration
NAMESPACE_PREFIX="tenant-"
HELM_CHART_PATH="/app/helm-charts/controlcore"
BASE_DOMAIN="app.controlcore.io"
SSL_EMAIL="admin@controlcore.io"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --tenant-id ID          Tenant ID (required)"
    echo "  -n, --company-name NAME     Company name (required)"
    echo "  -s, --subdomain SUBDOMAIN   Subdomain (optional, will be generated if not provided)"
    echo "  -c, --stripe-customer ID    Stripe customer ID (required)"
    echo "  -u, --stripe-subscription ID Stripe subscription ID (required)"
    echo "  -d, --dry-run              Perform a dry run without making changes"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -t tenant-123 -n 'Acme Corp' -c cus_123 -u sub_123"
    echo "  $0 --tenant-id tenant-456 --company-name 'Tech Startup' --stripe-customer cus_456 --stripe-subscription sub_456"
}

# Parse command line arguments
TENANT_ID=""
COMPANY_NAME=""
SUBDOMAIN=""
STRIPE_CUSTOMER_ID=""
STRIPE_SUBSCRIPTION_ID=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tenant-id)
            TENANT_ID="$2"
            shift 2
            ;;
        -n|--company-name)
            COMPANY_NAME="$2"
            shift 2
            ;;
        -s|--subdomain)
            SUBDOMAIN="$2"
            shift 2
            ;;
        -c|--stripe-customer)
            STRIPE_CUSTOMER_ID="$2"
            shift 2
            ;;
        -u|--stripe-subscription)
            STRIPE_SUBSCRIPTION_ID="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$TENANT_ID" || -z "$COMPANY_NAME" || -z "$STRIPE_CUSTOMER_ID" || -z "$STRIPE_SUBSCRIPTION_ID" ]]; then
    log_error "Missing required parameters"
    usage
    exit 1
fi

# Generate subdomain if not provided
if [[ -z "$SUBDOMAIN" ]]; then
    # Convert company name to valid subdomain
    SUBDOMAIN=$(echo "$COMPANY_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    SUBDOMAIN="${SUBDOMAIN}.${BASE_DOMAIN}"
fi

# Generate namespace
NAMESPACE="${NAMESPACE_PREFIX}${TENANT_ID:0:8}"

log_info "Starting Pro tenant provisioning"
log_info "Tenant ID: $TENANT_ID"
log_info "Company Name: $COMPANY_NAME"
log_info "Subdomain: $SUBDOMAIN"
log_info "Namespace: $NAMESPACE"
log_info "Stripe Customer: $STRIPE_CUSTOMER_ID"
log_info "Stripe Subscription: $STRIPE_SUBSCRIPTION_ID"

if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "DRY RUN MODE - No changes will be made"
fi

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "kubectl is available and cluster is accessible"
}

# Function to check if Helm is available
check_helm() {
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed or not in PATH"
        exit 1
    fi
    
    log_success "Helm is available"
}

# Function to create namespace
create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would create namespace $NAMESPACE"
        return 0
    fi
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE already exists"
    else
        kubectl create namespace "$NAMESPACE"
        log_success "Created namespace: $NAMESPACE"
    fi
}

# Function to generate Helm values
generate_helm_values() {
    log_info "Generating Helm values for tenant"
    
    local values_file="/tmp/tenant-${TENANT_ID}-values.yaml"
    
    cat > "$values_file" << EOF
tenant:
  id: "$TENANT_ID"
  name: "$COMPANY_NAME"
  subdomain: "$SUBDOMAIN"
  tier: "pro"
  stripe_customer_id: "$STRIPE_CUSTOMER_ID"
  stripe_subscription_id: "$STRIPE_SUBSCRIPTION_ID"

database:
  host: "postgres-${TENANT_ID:0:8}"
  port: 5432
  name: "controlcore-${TENANT_ID:0:8}"
  username: "cc_${TENANT_ID:0:8}"
  password: "$(openssl rand -base64 32)"
  postgres_password: "$(openssl rand -base64 32)"

redis:
  host: "redis-${TENANT_ID:0:8}"
  port: 6379
  password: "$(openssl rand -base64 32)"

opa:
  host: "opa-${TENANT_ID:0:8}"
  port: 8181

opal:
  host: "opal-${TENANT_ID:0:8}"
  port: 7002

telemetry:
  endpoint: "http://cc-business-admin:8001"
  api_key: "your-telemetry-api-key"

image:
  tag: "latest"
EOF
    
    log_success "Generated Helm values file: $values_file"
    echo "$values_file"
}

# Function to deploy with Helm
deploy_with_helm() {
    local values_file="$1"
    local release_name="tenant-${TENANT_ID:0:8}"
    
    log_info "Deploying tenant with Helm"
    log_info "Release name: $release_name"
    log_info "Chart path: $HELM_CHART_PATH"
    log_info "Values file: $values_file"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy with Helm"
        helm template "$release_name" "$HELM_CHART_PATH" --values "$values_file" --namespace "$NAMESPACE"
        return 0
    fi
    
    # Deploy with Helm
    helm install "$release_name" "$HELM_CHART_PATH" \
        --namespace "$NAMESPACE" \
        --values "$values_file" \
        --wait \
        --timeout 10m
    
    log_success "Helm deployment completed"
}

# Function to configure DNS
configure_dns() {
    log_info "Configuring DNS for subdomain: $SUBDOMAIN"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would configure DNS for $SUBDOMAIN"
        return 0
    fi
    
    # Get load balancer IP
    local lb_ip
    lb_ip=$(kubectl get service -n "$NAMESPACE" -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}')
    
    if [[ -z "$lb_ip" ]]; then
        log_warning "Load balancer IP not found, DNS configuration skipped"
        return 0
    fi
    
    log_info "Load balancer IP: $lb_ip"
    
    # Configure DNS based on provider
    local dns_provider="${DNS_PROVIDER:-cloudflare}"
    
    case "$dns_provider" in
        "cloudflare")
            configure_cloudflare_dns "$SUBDOMAIN" "$lb_ip"
            ;;
        "route53")
            configure_route53_dns "$SUBDOMAIN" "$lb_ip"
            ;;
        *)
            log_warning "DNS provider $dns_provider not supported, skipping DNS configuration"
            ;;
    esac
}

# Function to configure Cloudflare DNS
configure_cloudflare_dns() {
    local subdomain="$1"
    local ip="$2"
    
    log_info "Configuring Cloudflare DNS for $subdomain -> $ip"
    
    if [[ -z "$DNS_API_KEY" || -z "$DNS_ZONE_ID" ]]; then
        log_warning "Cloudflare API credentials not configured, skipping DNS setup"
        return 0
    fi
    
    # Create DNS record via Cloudflare API
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$DNS_ZONE_ID/dns_records" \
        -H "Authorization: Bearer $DNS_API_KEY" \
        -H "Content-Type: application/json" \
        --data "{\"type\":\"A\",\"name\":\"$subdomain\",\"content\":\"$ip\",\"ttl\":300,\"proxied\":true}"
    
    log_success "DNS record created for $subdomain"
}

# Function to configure Route53 DNS
configure_route53_dns() {
    local subdomain="$1"
    local ip="$2"
    
    log_info "Configuring Route53 DNS for $subdomain -> $ip"
    
    if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" || -z "$DNS_ZONE_ID" ]]; then
        log_warning "AWS credentials not configured, skipping DNS setup"
        return 0
    fi
    
    # Create DNS record via Route53 API
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$DNS_ZONE_ID" \
        --change-batch "{
            \"Changes\": [{
                \"Action\": \"CREATE\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$subdomain\",
                    \"Type\": \"A\",
                    \"TTL\": 300,
                    \"ResourceRecords\": [{\"Value\": \"$ip\"}]
                }
            }]
        }"
    
    log_success "DNS record created for $subdomain"
}

# Function to request SSL certificate
request_ssl_certificate() {
    log_info "Requesting SSL certificate for $SUBDOMAIN"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would request SSL certificate for $SUBDOMAIN"
        return 0
    fi
    
    # Create cert-manager Certificate resource
    cat << EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ${TENANT_ID}-tls
  namespace: $NAMESPACE
spec:
  secretName: ${TENANT_ID}-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - $SUBDOMAIN
EOF
    
    log_success "SSL certificate requested for $SUBDOMAIN"
}

# Function to wait for deployment
wait_for_deployment() {
    log_info "Waiting for deployment to be ready"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would wait for deployment"
        return 0
    fi
    
    # Wait for all deployments to be ready
    kubectl wait --for=condition=available --timeout=300s deployment --all -n "$NAMESPACE"
    
    log_success "Deployment is ready"
}

# Function to initialize tenant data
initialize_tenant_data() {
    log_info "Initializing tenant data"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would initialize tenant data"
        return 0
    fi
    
    # Get the service URL
    local service_url
    service_url=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}')
    
    if [[ -n "$service_url" ]]; then
        service_url="https://$service_url"
    else
        service_url="http://localhost:3000"
    fi
    
    # Call tenant initialization API
    curl -X POST "$service_url/api/tenant/initialize" \
        -H "Content-Type: application/json" \
        -d "{
            \"tenant_id\": \"$TENANT_ID\",
            \"company_name\": \"$COMPANY_NAME\",
            \"stripe_customer_id\": \"$STRIPE_CUSTOMER_ID\",
            \"stripe_subscription_id\": \"$STRIPE_SUBSCRIPTION_ID\"
        }" || log_warning "Failed to initialize tenant data via API"
    
    log_success "Tenant data initialized"
}

# Function to cleanup on failure
cleanup_on_failure() {
    log_error "Provisioning failed, cleaning up resources"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would cleanup resources"
        return 0
    fi
    
    # Delete Helm release
    helm uninstall "tenant-${TENANT_ID:0:8}" --namespace "$NAMESPACE" || true
    
    # Delete namespace
    kubectl delete namespace "$NAMESPACE" || true
    
    log_info "Cleanup completed"
}

# Main provisioning function
main() {
    log_info "Starting Pro tenant provisioning process"
    
    # Set up error handling
    trap cleanup_on_failure ERR
    
    # Check prerequisites
    check_kubectl
    check_helm
    
    # Provisioning steps
    create_namespace
    
    local values_file
    values_file=$(generate_helm_values)
    
    deploy_with_helm "$values_file"
    
    # Wait a bit for services to start
    sleep 30
    
    configure_dns
    request_ssl_certificate
    wait_for_deployment
    initialize_tenant_data
    
    # Clean up temporary files
    rm -f "$values_file"
    
    log_success "Pro tenant provisioning completed successfully!"
    log_info "Tenant URL: https://$SUBDOMAIN"
    log_info "Namespace: $NAMESPACE"
    
    # Display access information
    echo ""
    echo "=== PROVISIONING COMPLETE ==="
    echo "Tenant ID: $TENANT_ID"
    echo "Company: $COMPANY_NAME"
    echo "Subdomain: $SUBDOMAIN"
    echo "Access URL: https://$SUBDOMAIN"
    echo "Namespace: $NAMESPACE"
    echo ""
    echo "Next steps:"
    echo "1. Verify DNS propagation: nslookup $SUBDOMAIN"
    echo "2. Check SSL certificate: curl -I https://$SUBDOMAIN"
    echo "3. Test tenant access: curl https://$SUBDOMAIN/health"
    echo "4. Send welcome email to customer"
    echo ""
}

# Run main function
main "$@"
