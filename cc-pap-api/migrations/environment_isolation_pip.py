#!/usr/bin/env python3
"""
Database Migration: PIP Connection Environment Isolation

This migration removes support for "both" environment value in PIP connections.
It duplicates any connections with environment="both" into separate sandbox and production entries.

Migration: Remove "both" environment, enforce sandbox OR production
Date: 2025-01-30
Author: Control Core Team
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
    print("🚀 Starting migration: PIP Connection Environment Isolation")
    print("=" * 60)
    
    if not table_exists('pip_connections'):
        print("ℹ️  pip_connections table doesn't exist, skipping migration")
        return True
    
    with engine.begin() as conn:
        try:
            # Step 1: Find all connections with environment="both"
            result = conn.execute(text(
                "SELECT COUNT(*) FROM pip_connections WHERE environment = 'both'"
            ))
            both_count = result.scalar()
            
            if both_count > 0:
                print(f"📊 Found {both_count} PIP connections with environment='both'")
                print("🔄 Duplicating these connections for sandbox and production...")
                
                # Step 2: Get all "both" connections
                both_connections = conn.execute(text("""
                    SELECT id, name, description, connection_type, provider, status,
                           configuration, credentials, sandbox_endpoint, production_endpoint,
                           health_check_url, health_status, sync_enabled, sync_frequency,
                           created_by
                    FROM pip_connections 
                    WHERE environment = 'both'
                """)).fetchall()
                
                # Step 3: For each "both" connection, create sandbox and production versions
                for conn_data in both_connections:
                    # Create sandbox version
                    conn.execute(text("""
                        INSERT INTO pip_connections (
                            name, description, connection_type, provider, status,
                            configuration, credentials, environment,
                            sandbox_endpoint, production_endpoint,
                            health_check_url, health_status, sync_enabled, sync_frequency,
                            created_by, created_at, updated_at
                        ) VALUES (
                            :name, :description, :connection_type, :provider, :status,
                            :configuration, :credentials, 'sandbox',
                            :sandbox_endpoint, :production_endpoint,
                            :health_check_url, :health_status, :sync_enabled, :sync_frequency,
                            :created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                        )
                    """), {
                        'name': conn_data[1] + ' (Sandbox)',
                        'description': conn_data[2],
                        'connection_type': conn_data[3],
                        'provider': conn_data[4],
                        'status': conn_data[5],
                        'configuration': conn_data[6],
                        'credentials': conn_data[7],
                        'sandbox_endpoint': conn_data[8],
                        'production_endpoint': conn_data[9],
                        'health_check_url': conn_data[10],
                        'health_status': conn_data[11],
                        'sync_enabled': conn_data[12],
                        'sync_frequency': conn_data[13],
                        'created_by': conn_data[14]
                    })
                    
                    # Create production version
                    conn.execute(text("""
                        INSERT INTO pip_connections (
                            name, description, connection_type, provider, status,
                            configuration, credentials, environment,
                            sandbox_endpoint, production_endpoint,
                            health_check_url, health_status, sync_enabled, sync_frequency,
                            created_by, created_at, updated_at
                        ) VALUES (
                            :name, :description, :connection_type, :provider, :status,
                            :configuration, :credentials, 'production',
                            :sandbox_endpoint, :production_endpoint,
                            :health_check_url, :health_status, :sync_enabled, :sync_frequency,
                            :created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                        )
                    """), {
                        'name': conn_data[1] + ' (Production)',
                        'description': conn_data[2],
                        'connection_type': conn_data[3],
                        'provider': conn_data[4],
                        'status': conn_data[5],
                        'configuration': conn_data[6],
                        'credentials': conn_data[7],
                        'sandbox_endpoint': conn_data[8],
                        'production_endpoint': conn_data[9],
                        'health_check_url': conn_data[10],
                        'health_status': conn_data[11],
                        'sync_enabled': conn_data[12],
                        'sync_frequency': conn_data[13],
                        'created_by': conn_data[14]
                    })
                    
                    print(f"  ✅ Duplicated '{conn_data[1]}' for sandbox and production")
                
                # Step 4: Delete the original "both" connections
                conn.execute(text("DELETE FROM pip_connections WHERE environment = 'both'"))
                print(f"🗑️  Removed {both_count} original 'both' environment connections")
            else:
                print("ℹ️  No PIP connections with environment='both' found")
            
            # Step 5: Update any NULL environments to 'sandbox' as default
            result = conn.execute(text(
                "SELECT COUNT(*) FROM pip_connections WHERE environment IS NULL"
            ))
            null_count = result.scalar()
            
            if null_count > 0:
                conn.execute(text(
                    "UPDATE pip_connections SET environment = 'sandbox' WHERE environment IS NULL"
                ))
                print(f"📝 Updated {null_count} NULL environments to 'sandbox'")
            
            # Step 6: Make environment column NOT NULL if not already
            conn.execute(text(
                "ALTER TABLE pip_connections ALTER COLUMN environment SET NOT NULL"
            ))
            print("✅ Made environment column NOT NULL")
            
            print("\n✅ Migration completed successfully!")
            print(f"\n📊 Summary:")
            print(f"   - Migrated {both_count} 'both' environment connections")
            print(f"   - Updated {null_count} NULL environment connections")
            print(f"   - Environment is now required (sandbox or production only)")
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

