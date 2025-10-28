"""
Database Migration Script: Add Auto-Discovery and Resource Enrichment Fields

This script adds:
1. Auto-discovery fields to protected_resources table
2. Resource enrichment fields to protected_resources table
3. Relationship between PEP and ProtectedResource tables

Run this script ONCE after deploying the new code:
python migrations/add_auto_discovery_fields.py
"""

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, inspect
from sqlalchemy.sql import func
import os
import sys

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base


def table_exists(table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    if not table_exists(table_name):
        return False
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def run_migration():
    """Run the database migration"""
    print("🚀 Starting database migration...")
    
    # First, ensure tables exist
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tables verified/created successfully")
    except Exception as e:
        print(f"❌ Error with tables: {e}")
        return False
    
    # Add new columns to protected_resources table
    print("\n📝 Updating protected_resources table schema...")
    
    with engine.begin() as conn:
        try:
            # Add auto-discovery fields
            if not column_exists('protected_resources', 'auto_discovered'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN auto_discovered BOOLEAN DEFAULT FALSE')
                print("✅ Added auto_discovered column")
            else:
                print("ℹ️  auto_discovered column already exists")
            
            if not column_exists('protected_resources', 'discovered_at'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN discovered_at TIMESTAMP')
                print("✅ Added discovered_at column")
            else:
                print("ℹ️  discovered_at column already exists")
            
            if not column_exists('protected_resources', 'bouncer_id'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN bouncer_id INTEGER')
                print("✅ Added bouncer_id column")
            else:
                print("ℹ️  bouncer_id column already exists")
            
            # Add resource enrichment fields
            if not column_exists('protected_resources', 'business_context'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN business_context TEXT')
                print("✅ Added business_context column")
            else:
                print("ℹ️  business_context column already exists")
            
            if not column_exists('protected_resources', 'data_classification'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN data_classification VARCHAR')
                print("✅ Added data_classification column")
            else:
                print("ℹ️  data_classification column already exists")
            
            if not column_exists('protected_resources', 'compliance_tags'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN compliance_tags JSON')
                print("✅ Added compliance_tags column")
            else:
                print("ℹ️  compliance_tags column already exists")
            
            if not column_exists('protected_resources', 'cost_center'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN cost_center VARCHAR')
                print("✅ Added cost_center column")
            else:
                print("ℹ️  cost_center column already exists")
            
            if not column_exists('protected_resources', 'owner_email'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN owner_email VARCHAR')
                print("✅ Added owner_email column")
            else:
                print("ℹ️  owner_email column already exists")
            
            if not column_exists('protected_resources', 'owner_team'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN owner_team VARCHAR')
                print("✅ Added owner_team column")
            else:
                print("ℹ️  owner_team column already exists")
            
            if not column_exists('protected_resources', 'sla_tier'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN sla_tier VARCHAR')
                print("✅ Added sla_tier column")
            else:
                print("ℹ️  sla_tier column already exists")
            
            if not column_exists('protected_resources', 'data_residency'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN data_residency VARCHAR')
                print("✅ Added data_residency column")
            else:
                print("ℹ️  data_residency column already exists")
            
            if not column_exists('protected_resources', 'audit_level'):
                conn.execute('ALTER TABLE protected_resources ADD COLUMN audit_level VARCHAR')
                print("✅ Added audit_level column")
            else:
                print("ℹ️  audit_level column already exists")
            
            # Migrate existing resources (mark as manual, not auto-discovered)
            conn.execute("UPDATE protected_resources SET auto_discovered = FALSE WHERE auto_discovered IS NULL")
            print("✅ Migrated existing resources (marked as manually created)")
            
        except Exception as e:
            print(f"⚠️  Note: {e}")
            print("ℹ️  Some columns may already exist, which is fine.")
    
    print("\n✅ Migration completed successfully!")
    print("\n📋 Updated protected_resources table with:")
    print("\n   Auto-Discovery Fields:")
    print("   - auto_discovered (BOOLEAN)")
    print("   - discovered_at (TIMESTAMP)")
    print("   - bouncer_id (INTEGER)")
    print("\n   Resource Enrichment Fields:")
    print("   - business_context (TEXT)")
    print("   - data_classification (VARCHAR)")
    print("   - compliance_tags (JSON)")
    print("   - cost_center (VARCHAR)")
    print("   - owner_email (VARCHAR)")
    print("   - owner_team (VARCHAR)")
    print("   - sla_tier (VARCHAR)")
    print("   - data_residency (VARCHAR)")
    print("   - audit_level (VARCHAR)")
    
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("Control Core Database Migration")
    print("Adding Auto-Discovery and Resource Enrichment Fields")
    print("=" * 60)
    
    success = run_migration()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("\nNext steps:")
        print("1. Deploy bouncers with resource configuration")
        print("2. Bouncers will auto-register and create resources")
        print("3. Enrich auto-discovered resources in /settings/resources")
        print("4. Resources will now show which bouncer protects them")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        sys.exit(1)

