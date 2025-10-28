#!/usr/bin/env python3
"""
Database Migration Template
Copy this file and modify for your schema changes.

Migration: [DESCRIBE WHAT THIS MIGRATION DOES]
Date: YYYY-MM-DD
Author: [YOUR NAME]
"""

import sys
import os
from sqlalchemy import inspect, text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine

def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return False
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def table_exists(table_name):
    """Check if a table exists"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def run_migration():
    """Execute the migration"""
    print("🚀 Starting migration: [MIGRATION NAME]")
    print("=" * 60)
    
    with engine.begin() as conn:
        try:
            # Example: Add a new column
            if not column_exists('users', 'new_column'):
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN new_column VARCHAR DEFAULT 'default_value'"
                ))
                print("✅ Added new_column to users table")
            else:
                print("ℹ️  new_column already exists, skipping")
            
            # Example: Create a new table
            if not table_exists('new_table'):
                conn.execute(text("""
                    CREATE TABLE new_table (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                print("✅ Created new_table")
            else:
                print("ℹ️  new_table already exists, skipping")
            
            print("\n✅ Migration completed successfully!")
            return True
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            print("\nTo rollback, restore from backup:")
            print("  docker exec -i cc-db psql -U postgres control_core_db < backup.sql")
            return False
    
    print("=" * 60)

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)

