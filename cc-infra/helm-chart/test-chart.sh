#!/bin/bash
# Test script for the ControlCore Helm chart

set -e

echo "🔍 Linting Helm chart..."
helm lint ./controlcore

echo "🧪 Performing dry-run installation..."
helm install --dry-run --debug controlcore ./controlcore

echo "✅ Chart validation complete!"
echo "To install the chart, run:"
echo "  helm install controlcore ./controlcore"
echo ""
