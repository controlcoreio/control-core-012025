#!/bin/bash

# Run Database Migration for PEP Configuration Enhancement
# This script creates the necessary database tables for the new configuration fields

echo "🔧 Running PEP Configuration Enhancement Migration..."
echo ""

# Check if we're in the right directory
if [ ! -f "alembic.ini" ]; then
    echo "❌ Error: alembic.ini not found"
    echo "Please run this script from the cc-pap-api directory"
    exit 1
fi

# Check if virtual environment is activated (optional but recommended)
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Warning: Virtual environment not detected"
    echo "It's recommended to activate your virtual environment first:"
    echo "  source venv/bin/activate"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run the migration
echo "Running Alembic migration..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "New database tables and columns have been created:"
    echo "  - global_pep_config: Added sidecar-specific columns"
    echo "  - individual_pep_config: Added sidecar override columns"
    echo ""
    echo "You can now start the backend server:"
    echo "  uvicorn app.main:app --reload"
else
    echo ""
    echo "❌ Migration failed!"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check that you have the correct database URL in your environment"
    echo "2. Ensure the database is accessible"
    echo "3. Check the alembic/versions/ directory for migration files"
    echo "4. Try running: alembic current"
    echo "5. Check logs above for specific error messages"
    exit 1
fi

