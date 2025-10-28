#!/bin/bash

# Control Core PAP API Deployment with Template Loading
# This script ensures policy templates are loaded during deployment

set -e  # Exit on error

echo "============================================================"
echo "  Control Core PAP API - Deployment with Templates"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found. Creating one..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate
print_success "Virtual environment activated"

# Install/update dependencies
print_status "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
print_success "Dependencies installed"

# Check database connection
print_status "Checking database connection..."
python3 << EOF
import psycopg2
import os
import sys

try:
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "control_core_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password")
    )
    conn.close()
    print("✓ Database connection successful")
    sys.exit(0)
except Exception as e:
    print(f"✗ Database connection failed: {e}")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
    print_error "Cannot connect to database. Please ensure PostgreSQL is running."
    exit 1
fi

# Run database migrations (add template_metadata column if needed)
print_status "Running database migrations..."
python3 add_template_metadata_column.py
print_success "Database migrations completed"

# Load policy templates
print_status "Loading policy templates..."
python3 load_policy_templates.py

if [ $? -eq 0 ]; then
    print_success "Policy templates loaded successfully"
else
    print_error "Failed to load policy templates"
    exit 1
fi

# Verify templates were loaded
print_status "Verifying templates..."
TEMPLATE_COUNT=$(python3 << EOF
import psycopg2
import os

try:
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "control_core_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password")
    )
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM policy_templates")
    count = cursor.fetchone()[0]
    print(count)
    cursor.close()
    conn.close()
except Exception as e:
    print("0")
EOF
)

if [ "$TEMPLATE_COUNT" -gt 0 ]; then
    print_success "$TEMPLATE_COUNT templates loaded in database"
else
    print_warning "No templates found in database"
fi

echo ""
echo "============================================================"
echo "  Deployment Complete!"
echo "============================================================"
echo ""
echo "✓ Virtual environment: activated"
echo "✓ Dependencies: installed"
echo "✓ Database: connected"
echo "✓ Migrations: completed"
echo "✓ Templates: $TEMPLATE_COUNT loaded"
echo ""
echo "To start the API server:"
echo "  cd $SCRIPT_DIR"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload"
echo ""
echo "Templates available at: http://localhost:8000/policies/templates/"
echo "Frontend access at: http://localhost:5173/policies/templates"
echo ""

