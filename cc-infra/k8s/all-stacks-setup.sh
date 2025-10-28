#!/bin/bash
# All Stacks Setup Script
# 
# This script sets up all stacks: ACME, ControlCore, and Policy Admin

set -e

echo "🚀 Setting up all stacks..."

# Check for GitHub token secret
if ! kubectl get secret cc-pap-github-token >/dev/null 2>&1; then
    echo "⚠️  GitHub token secret not found!"
    echo "   Please create it first: GITHUB_TOKEN=your_token ./create-github-secret.sh"
    echo "   Continuing without GitHub token (PAP server may fail to start)"
    echo ""
fi

# Check if kind cluster exists
if ! kind get clusters | grep -q "acme-local"; then
    echo "📦 Creating kind cluster..."
    kind create cluster --name acme-local
else
    echo "✅ Kind cluster 'acme-local' already exists"
fi

# Set kubectl context
echo "🔧 Setting kubectl context..."
kubectl config use-context kind-acme-local

# Set ECR and image info for Policy Admin
ECR_REGISTRY="061730756658.dkr.ecr.ca-central-1.amazonaws.com"
ECR_REPO="controlcoreio/policy-admin"
ECR_SERVER_IMAGE_TAG="policy-admin-server-controlcoreio"
ECR_CLIENT_IMAGE_TAG="policy-admin-client-controlcoreio"
LOCAL_API_IMAGE="cc-policy-admin-api-policy_admin_api:latest"

# Create ECR registry secret (if AWS credentials are available)
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "Creating ECR registry secret in Kubernetes..."
    kubectl delete secret ecr-registry-secret --ignore-not-found
    kubectl create secret docker-registry ecr-registry-secret \
      --docker-server=$ECR_REGISTRY \
      --docker-username=AWS \
      --docker-password="$(aws ecr get-login-password --region ca-central-1)" \
      --docker-email=local@local.com
else
    echo "AWS credentials not found, skipping ECR secret creation."
fi

# Load all Docker images
echo "📥 Loading all Docker images into kind cluster..."
echo "   Loading ACME demo images..."
kind load docker-image acme-consulting-demo-api-api:latest --name acme-local
kind load docker-image acme-consulting-demo-frontend-acme-consulting-demo-frontend:latest --name acme-local
kind load docker-image cc-http-sidecar-pep:latest --name acme-local

echo "   Loading ControlCore images..."
kind load docker-image cc-bouncer:latest --name acme-local

echo "   Loading Policy Admin images..."
kind load docker-image $ECR_REGISTRY/$ECR_REPO:$ECR_SERVER_IMAGE_TAG --name acme-local
kind load docker-image $ECR_REGISTRY/$ECR_REPO:$ECR_CLIENT_IMAGE_TAG --name acme-local
kind load docker-image $LOCAL_API_IMAGE --name acme-local

echo ""
echo "🚀 Deploying all stacks..."

# Deploy ACME stack first (includes database)
echo "   1. Deploying ACME stack..."
kubectl apply -f acme-stack.yaml

# Deploy ControlCore stack
echo "   2. Deploying ControlCore stack..."
kubectl apply -f controlcore-stack.yaml

# Deploy Policy Admin stack
echo "   3. Deploying Policy Admin stack..."
kubectl apply -f policy-admin-stack.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for all deployments to be ready..."

echo "   Waiting for ACME stack..."
kubectl wait --for=condition=available --timeout=120s deployment/postgres-db-local
kubectl wait --for=condition=available --timeout=120s deployment/acme-api-local
kubectl wait --for=condition=available --timeout=120s deployment/acme-frontend-local

echo "   Waiting for ControlCore stack..."
kubectl wait --for=condition=available --timeout=120s deployment/cc-bouncer

echo "   Waiting for Policy Admin stack..."
kubectl wait --for=condition=available --timeout=120s deployment/cc-pap-local
kubectl wait --for=condition=available --timeout=120s deployment/cc-pap-api-local
kubectl wait --for=condition=available --timeout=120s deployment/cc-opal-local

# Seed the database
echo "🌱 Seeding database with client data..."
kubectl apply -f db-seed-job.yaml
kubectl wait --for=condition=complete --timeout=60s job/db-seed-job

echo ""
echo "🎉 All stacks are ready!"
echo ""
echo "Access your applications:"
echo "ACME Demo Stack:"
echo "  Frontend: http://localhost:30300"
echo "  API:      http://localhost:30800"
echo ""
echo "ControlCore Stack:"
echo "  PDP Service: http://localhost:30900"
echo ""
echo "Policy Admin Stack:"
echo "  Policy Admin Server: http://localhost:30702"
echo "  Policy Admin Client: http://localhost:30766"
echo "  Policy Admin API:    http://localhost:30901"
echo "  OPA Service:         http://localhost:30181"
echo ""
echo "Useful commands:"
echo "  kubectl get pods                                 # Check all pod status"
echo "  kubectl get pods -l stack=controlcore-stack     # Check ControlCore pods"
echo "  kubectl get pods -l env=local-dev               # Check ACME demo pods"
echo "" 