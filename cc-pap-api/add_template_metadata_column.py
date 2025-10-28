#!/usr/bin/env python3
"""
Add template_metadata column to policy_templates table
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "control_core_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")

def add_template_metadata_column():
    """Add template_metadata column to policy_templates table if it doesn't exist."""
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("=" * 60)
        print("  Adding template_metadata column to policy_templates")
        print("=" * 60)
        print(f"\nDatabase: {DB_NAME}@{DB_HOST}:{DB_PORT}")
        
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='policy_templates' 
            AND column_name='template_metadata'
        """)
        
        if cursor.fetchone():
            print("\n✓ Column 'template_metadata' already exists")
        else:
            print("\n+ Adding 'template_metadata' column...")
            cursor.execute("""
                ALTER TABLE policy_templates 
                ADD COLUMN template_metadata JSONB DEFAULT '{}'::jsonb
            """)
            print("✓ Column 'template_metadata' added successfully")
        
        # Also check for old 'metadata' column
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='policy_templates' 
            AND column_name='metadata'
        """)
        
        if cursor.fetchone():
            print("\n⚠️  Old 'metadata' column found")
            print("   Migrating data to 'template_metadata'...")
            
            # Copy data from metadata to template_metadata
            cursor.execute("""
                UPDATE policy_templates 
                SET template_metadata = metadata 
                WHERE template_metadata = '{}'::jsonb 
                AND metadata IS NOT NULL
            """)
            
            rows_updated = cursor.rowcount
            print(f"✓ Migrated {rows_updated} rows")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        print("  Migration completed successfully!")
        print("=" * 60)
        
    except psycopg2.Error as e:
        print(f"\n❌ Database error: {e}")
        raise
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    add_template_metadata_column()

