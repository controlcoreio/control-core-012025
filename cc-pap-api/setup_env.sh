#!/bin/bash

# Control Core PAP API - Environment Setup Script

echo "========================================"
echo "Control Core PAP API - Environment Setup"
echo "========================================"
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✓ .env file found"
else
    echo "⚠ .env file not found"
    echo "Creating .env from env.example..."
    cp env.example .env
    echo "✓ .env file created"
fi

echo ""
echo "IMPORTANT: Before running init_db.py, you must set:"
echo ""
echo "  1. CC_BUILTIN_ADMIN_USER - System administrator username"
echo "  2. CC_BUILTIN_ADMIN_PASS - System administrator password"
echo ""
echo "These can be set in your .env file or as environment variables."
echo ""
echo "Example:"
echo "  export CC_BUILTIN_ADMIN_USER='your_username'"
echo "  export CC_BUILTIN_ADMIN_PASS='your_secure_password'"
echo ""
echo "========================================"

