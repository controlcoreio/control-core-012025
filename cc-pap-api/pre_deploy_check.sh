#!/bin/bash

# Pre-Deployment Validation Script
# Run this script before EVERY deployment to production
# It validates database schema, environment variables, and critical configurations

set -e

echo "🔍 Control Core Pre-Deployment Validation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Check Database Schema
echo "1️⃣  Validating Database Schema..."
if python check_db_schema.py; then
    echo -e "   ${GREEN}✅ Database schema is valid${NC}"
else
    echo -e "   ${RED}❌ Database schema validation FAILED${NC}"
    echo -e "   ${RED}   DO NOT DEPLOY until this is fixed!${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Check Required Environment Variables
echo "2️⃣  Checking Required Environment Variables..."
REQUIRED_VARS=(
    "DATABASE_URL"
    "SECRET_KEY"
    "JWT_SECRET_KEY"
    "CC_BUILTIN_ADMIN_USER"
    "CC_BUILTIN_ADMIN_PASS"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "   ${RED}❌ Missing: $var${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "   ${GREEN}✅ Set: $var${NC}"
    fi
done
echo ""

# 3. Check Database Connection
echo "3️⃣  Testing Database Connection..."
if python -c "from app.database import engine; engine.connect(); print('Connected')" 2>/dev/null; then
    echo -e "   ${GREEN}✅ Database connection successful${NC}"
else
    echo -e "   ${RED}❌ Cannot connect to database${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Verify Admin User Can Be Created
echo "4️⃣  Verifying Admin User Setup..."
if [ "$CC_BUILTIN_ADMIN_PASS" == "SecurePass2025!" ] || [ "$CC_BUILTIN_ADMIN_PASS" == "admin123" ]; then
    echo -e "   ${YELLOW}⚠️  WARNING: Using default password!${NC}"
    echo -e "   ${YELLOW}   Change CC_BUILTIN_ADMIN_PASS before production deployment${NC}"
fi
echo ""

# 5. Check for Pending Migrations
echo "5️⃣  Checking for Pending Migrations..."
MIGRATION_COUNT=$(find migrations/ -name "*.py" -not -name "__init__.py" -not -name "migration_template.py" -not -name "README.md" | wc -l)
echo -e "   ℹ️  Found $MIGRATION_COUNT migration scripts"
echo -e "   ${YELLOW}   Ensure all migrations have been applied!${NC}"
echo ""

# Summary
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Pre-deployment validation PASSED${NC}"
    echo -e "${GREEN}   Safe to deploy to production${NC}"
    exit 0
else
    echo -e "${RED}❌ Pre-deployment validation FAILED${NC}"
    echo -e "${RED}   Found $ERRORS critical issue(s)${NC}"
    echo -e "${RED}   DO NOT DEPLOY until all issues are resolved!${NC}"
    exit 1
fi

