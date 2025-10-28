param(
    [string]$KindClusterName = "kind",
    [string]$ArchType = ""
)

# Set the tag suffix based on architecture
$TagSuffix = ""
if ($ArchType -eq "arm64") {
    $TagSuffix = "-arm64"
}

# Login to AWS ECR
Write-Host "Logging into AWS ECR..."
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin 061730756658.dkr.ecr.ca-central-1.amazonaws.com

# Pull required images from ECR
Write-Host "Pulling required images from ECR with tag suffix: $TagSuffix"
docker pull "061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/acme-demo/frontend:latest$TagSuffix"
docker pull "061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/acme-demo/backend-api:latest$TagSuffix"
docker pull "061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/cc-frontend:latest$TagSuffix"
docker pull "061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/policy-admin-server:latest$TagSuffix"
docker pull "061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/cc-pap:latest$TagSuffix"
docker pull "061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/cc-pap-api:latest$TagSuffix"
docker pull "061730756658.dkr.ecr.ca-central-1.amazonaws.com/controlcoreio/cc-bouncer:latest$TagSuffix"
docker pull "permitio/opal-server:latest"

Write-Host "Fetching local Docker images containing 'controlcore'..."

# Get all local Docker images containing 'controlcore' (ignoring <none> tags)
$images = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -notmatch "<none>" -and $_ -match "controlcore" }

if (-not $images) {
    Write-Host "No local Docker images containing 'controlcore' found."
    exit 1
}

foreach ($image in $images) {
    Write-Host "Loading image $image into kind cluster..."
    kind load docker-image $image --name $KindClusterName

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to load image: $image"
        exit 1
    }
}

Write-Host "All local Docker images containing 'controlcore' have been loaded into the kind cluster: $KindClusterName."
