#!/bin/bash

# Name of your kind cluster (default is 'kind')
KIND_CLUSTER_NAME="${1:-kind}"
# Architecture type (default is empty, which will use 'latest' tag)
ARCH_TYPE="${2:-}"

# Set the tag suffix based on architecture
TAG_SUFFIX=""
if [ "$ARCH_TYPE" = "arm64" ]; then
  TAG_SUFFIX="-arm64"
fi

# Login to AWS ECR
echo "Logging into AWS ECR..."
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin 061730756658.dkr.ecr.ca-central-1.amazonaws.com

# Pull required images from ECR
echo "Pulling required images from ECR with tag suffix: $TAG_SUFFIX"
docker pull 061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/acme-demo/frontend:latest$TAG_SUFFIX
docker pull 061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/acme-demo/backend-api:latest$TAG_SUFFIX
docker pull 061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/cc-frontend:latest$TAG_SUFFIX
docker pull 061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/policy-admin-server:latest$TAG_SUFFIX
docker pull 061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/cc-pap:latest$TAG_SUFFIX
docker pull 061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/cc-pap-api:latest$TAG_SUFFIX
docker pull 061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/cc-bouncer:latest$TAG_SUFFIX
docker pull permitio/opal-server:latest

# Get all local Docker image names containing 'controlcore'
echo "Fetching local Docker images containing 'controlcore'..."
IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>" | grep "controlcore")

# Check if any images are available
if [ -z "$IMAGES" ]; then
  echo "No local Docker images containing 'controlcore' found."
  exit 1
fi

# Loop through each image and load it into kind
for IMAGE in $IMAGES; do
  echo "Loading image $IMAGE into kind cluster..."
  kind load docker-image "$IMAGE" --name "$KIND_CLUSTER_NAME"
  if [ $? -ne 0 ]; then
    echo "Failed to load image: $IMAGE"
    exit 1
  fi
done

echo "All local Docker images containing 'controlcore' have been loaded into the kind cluster: $KIND_CLUSTER_NAME."
