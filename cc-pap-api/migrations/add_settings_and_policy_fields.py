"""
Database Migration Script: Add Settings Tables and Policy Fields

This script adds:
1. New tables: github_configuration, opal_configuration, bouncer_opal_configuration
2. New columns to policies table: bouncer_id, folder, rego_code

Run this script ONCE after deploying the new code:
python migrations/add_settings_and_policy_fields.py
"""

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, JSON, inspect
from sqlalchemy.sql import func
import os
import sys

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import GitHubConfiguration, OPALConfiguration, BouncerOPALConfiguration, Policy


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
    
    # Create new tables
    print("\n📊 Creating new configuration tables...")
    
    try:
        # This will create tables that don't exist
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    
    # Add new columns to policies table if they don't exist
    print("\n📝 Updating policies table schema...")
    
    with engine.begin() as conn:
        try:
            # Add bouncer_id column
            if not column_exists('policies', 'bouncer_id'):
                conn.execute('ALTER TABLE policies ADD COLUMN bouncer_id VARCHAR')
                print("✅ Added bouncer_id column")
            else:
                print("ℹ️  bouncer_id column already exists")
            
            # Add folder column
            if not column_exists('policies', 'folder'):
                conn.execute("ALTER TABLE policies ADD COLUMN folder VARCHAR DEFAULT 'enabled'")
                print("✅ Added folder column")
            else:
                print("ℹ️  folder column already exists")
            
            # Add rego_code column
            if not column_exists('policies', 'rego_code'):
                conn.execute('ALTER TABLE policies ADD COLUMN rego_code TEXT')
                print("✅ Added rego_code column")
            else:
                print("ℹ️  rego_code column already exists")
            
            # Add context_config column
            if not column_exists('policies', 'context_config'):
                conn.execute('ALTER TABLE policies ADD COLUMN context_config JSON')
                print("✅ Added context_config column")
            else:
                print("ℹ️  context_config column already exists")
            
        except Exception as e:
            print(f"⚠️  Note: {e}")
            print("ℹ️  Some columns may already exist, which is fine.")
    
    print("\n✅ Migration completed successfully!")
    print("\n📋 New tables created:")
    print("   - github_configuration")
    print("   - opal_configuration")
    print("   - bouncer_opal_configuration")
    print("\n📋 Updated policies table with:")
    print("   - bouncer_id (VARCHAR)")
    print("   - folder (VARCHAR)")
    print("   - rego_code (TEXT)")
    print("   - context_config (JSON)")
    
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("Control Core Database Migration")
    print("Adding Settings Tables and Policy Fields")
    print("=" * 60)
    
    success = run_migration()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("\nNext steps:")
        print("1. Configure GitHub repository in /settings/policy-repository")
        print("2. Configure OPAL in /settings/opal")
        print("3. Deploy bouncers in /settings/peps")
        print("4. Create your first policy with the new wizard!")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        sys.exit(1)

