#!/bin/bash

# Test script for acme-stack Helm chart
# This script validates the Helm chart without installing it

echo "Testing acme-stack Helm chart..."

# Validate the chart
echo "Validating chart..."
helm lint .

# Check template rendering
echo "Checking template rendering..."
helm template test-release . --debug

echo "Test completed."