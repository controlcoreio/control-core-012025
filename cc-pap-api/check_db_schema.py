#!/usr/bin/env python3
"""
Database Schema Validation Script
This script verifies that the database schema matches the SQLAlchemy models.
Run this before deploying to production to catch schema mismatches.
"""

import sys
import os
from sqlalchemy import inspect, text
from app.database import engine
from app.models import User, Policy, ProtectedResource, PEP, AuditLog

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def get_model_columns(model):
    """Get expected columns from SQLAlchemy model"""
    return {c.name: str(c.type) for c in model.__table__.columns}

def get_db_columns(table_name):
    """Get actual columns from database"""
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return None
    return {c['name']: str(c['type']) for c in inspector.get_columns(table_name)}

def validate_schema():
    """Validate that database schema matches models"""
    print("🔍 Validating database schema...")
    print("=" * 60)
    
    models_to_check = [
        ('users', User),
        ('policies', Policy),
        ('protected_resources', ProtectedResource),
        ('peps', PEP),
        ('audit_logs', AuditLog),
    ]
    
    all_valid = True
    
    for table_name, model in models_to_check:
        print(f"\n📊 Checking table: {table_name}")
        
        expected_columns = get_model_columns(model)
        actual_columns = get_db_columns(table_name)
        
        if actual_columns is None:
            print(f"   {RED}❌ Table '{table_name}' does not exist!{RESET}")
            all_valid = False
            continue
        
        # Check for missing columns
        missing = set(expected_columns.keys()) - set(actual_columns.keys())
        if missing:
            print(f"   {RED}❌ Missing columns: {', '.join(missing)}{RESET}")
            all_valid = False
        
        # Check for extra columns (might be okay)
        extra = set(actual_columns.keys()) - set(expected_columns.keys())
        if extra:
            print(f"   {YELLOW}⚠️  Extra columns: {', '.join(extra)}{RESET}")
        
        if not missing and not extra:
            print(f"   {GREEN}✅ Schema matches{RESET}")
    
    print("\n" + "=" * 60)
    
    if all_valid:
        print(f"{GREEN}✅ All database schemas are valid!{RESET}")
        return 0
    else:
        print(f"{RED}❌ Database schema validation FAILED!{RESET}")
        print(f"\n{YELLOW}To fix schema issues:{RESET}")
        print("   1. Development: Set CC_DROP_TABLES=true and restart")
        print("   2. Production: Run database migrations")
        print("   3. Check migrations in cc-pap-api/migrations/")
        return 1

if __name__ == "__main__":
    sys.exit(validate_schema())

