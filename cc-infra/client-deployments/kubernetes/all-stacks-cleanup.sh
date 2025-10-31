#!/bin/bash

# All Stacks Cleanup Script
# This script cleans up all stacks: ACME, ControlCore, and Policy Admin

set -e

echo "🧹 Starting all stacks cleanup..."

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl not found. Please install kubectl first."
        exit 1
    fi
}

# Function to check if kind is available
check_kind() {
    if ! command -v kind &> /dev/null; then
        echo "❌ kind not found. Please install kind first."
        exit 1
    fi
}

# Delete Kubernetes resources
cleanup_k8s_resources() {
    echo "🗑️  Deleting all Kubernetes resources..."
    
    if kubectl get namespace default &> /dev/null; then
        # Delete Policy Admin stack
        if [ -f "policy-admin-stack.yaml" ]; then
            echo "   Deleting Policy Admin stack..."
            kubectl delete -f policy-admin-stack.yaml --ignore-not-found=true
        fi
        
        # Delete ControlCore stack
        if [ -f "controlcore-stack.yaml" ]; then
            echo "   Deleting ControlCore stack..."
            kubectl delete -f controlcore-stack.yaml --ignore-not-found=true
        fi
        
        # Delete ACME stack
        if [ -f "acme-stack.yaml" ]; then
            echo "   Deleting ACME stack..."
            kubectl delete -f acme-stack.yaml --ignore-not-found=true
        fi
        
        # Delete database seed job
        if [ -f "db-seed-job.yaml" ]; then
            echo "   Deleting database seed job..."
            kubectl delete -f db-seed-job.yaml --ignore-not-found=true
        fi
        
        # Clean up any remaining resources with labels
        echo "   Cleaning up any remaining labeled resources..."
        kubectl delete all,pvc,pv -l stack=controlcore-stack --ignore-not-found=true
        kubectl delete all,pvc,pv -l env=local-dev --ignore-not-found=true
        
        # Clean up any stuck pods
        kubectl delete pods --all --grace-period=0 --force --ignore-not-found=true
        
        echo "   ✅ All Kubernetes resources cleaned up"
    else
        echo "   ℹ️  No active Kubernetes context found"
    fi
}

# Delete kind cluster
cleanup_kind_cluster() {
    echo "🔥 Deleting kind cluster..."
    
    # List existing kind clusters
    existing_clusters=$(kind get clusters 2>/dev/null || echo "")
    
    if [ -n "$existing_clusters" ]; then
        echo "   Found kind clusters: $existing_clusters"
        
        # Delete each cluster (assuming cluster name might be 'acme-local' or similar)
        for cluster in $existing_clusters; do
            echo "   Deleting cluster: $cluster"
            kind delete cluster --name "$cluster"
        done
        
        echo "   ✅ Kind clusters deleted"
    else
        echo "   ℹ️  No kind clusters found"
    fi
}

# Clean up local data
cleanup_local_data() {
    echo "🧽 Cleaning up local data..."
    
    # Remove postgres data directory if it exists
    if [ -d "/tmp/postgres-data-local" ]; then
        echo "   Removing postgres data directory..."
        sudo rm -rf /tmp/postgres-data-local
        echo "   ✅ Postgres data cleaned up"
    else
        echo "   ℹ️  No postgres data directory found"
    fi
    
    # Clean up any Docker volumes that might be left behind
    echo "   Cleaning up Docker volumes..."
    docker volume prune -f &> /dev/null || echo "   ℹ️  Docker not available or no volumes to clean"
}

# Main cleanup process
main() {
    echo "🚀 All Stacks Cleanup"
    echo "===================="
    
    check_kubectl
    check_kind
    
    # Ask for confirmation
    read -p "⚠️  This will delete ALL stacks (ACME, ControlCore, Policy Admin) and the entire cluster. Continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cleanup cancelled"
        exit 0
    fi
    
    cleanup_k8s_resources
    cleanup_kind_cluster
    cleanup_local_data
    
    echo ""
    echo "🎉 All stacks cleanup completed successfully!"
    echo ""
    echo "📝 Summary:"
    echo "   - All Kubernetes resources deleted"
    echo "   - Kind cluster(s) deleted" 
    echo "   - Local data cleaned up"
    echo ""
    echo "💡 To recreate all stacks, run: ./all-stacks-setup.sh"
    echo "💡 To create individual stacks, check available setup scripts"
}

# Run main function
main "$@" 