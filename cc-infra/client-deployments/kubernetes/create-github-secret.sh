#!/bin/bash
# Create GitHub token secret for PAP server
# Usage: GITHUB_TOKEN=your_token_here ./create-github-secret.sh

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Please set GITHUB_TOKEN environment variable"
    echo "Usage: GITHUB_TOKEN=your_token_here ./create-github-secret.sh"
    exit 1
fi

echo "🔐 Creating GitHub token secret..."
kubectl create secret generic cc-pap-github-token \
    --from-literal=token="$GITHUB_TOKEN" \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secret 'cc-pap-github-token' created successfully"
echo "You can now deploy the PAP server stack." 