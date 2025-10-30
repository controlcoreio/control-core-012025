#!/usr/bin/env python3
"""
Database Migration: Notification Settings Environment Isolation

This migration creates tables for environment-specific notification settings
and shared notification credentials.

Migration: Add notification_settings and notification_credentials tables
Date: 2025-01-30
Author: Control Core Team
"""

import sys
import os
from sqlalchemy import inspect, text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine

def table_exists(table_name):
    """Check if a table exists"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def run_migration():
    """Execute the migration"""
    print("🚀 Starting migration: Notification Settings Environment Isolation")
    print("=" * 60)
    
    with engine.begin() as conn:
        try:
            # Create notification_settings table
            if not table_exists('notification_settings'):
                conn.execute(text("""
                    CREATE TABLE notification_settings (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        environment VARCHAR NOT NULL,
                        alert_types JSONB DEFAULT '[]'::jsonb,
                        email_enabled BOOLEAN DEFAULT TRUE,
                        email_recipients JSONB DEFAULT '[]'::jsonb,
                        slack_enabled BOOLEAN DEFAULT FALSE,
                        slack_channel VARCHAR,
                        servicenow_enabled BOOLEAN DEFAULT FALSE,
                        servicenow_instance VARCHAR,
                        webhook_enabled BOOLEAN DEFAULT FALSE,
                        webhook_url VARCHAR,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT unique_user_environment UNIQUE (user_id, environment)
                    )
                """))
                print("✅ Created notification_settings table")
                
                # Create index for faster lookups
                conn.execute(text("""
                    CREATE INDEX idx_notification_settings_user_env 
                    ON notification_settings(user_id, environment)
                """))
                print("✅ Created index on notification_settings")
            else:
                print("ℹ️  notification_settings table already exists, skipping")
            
            # Create notification_credentials table
            if not table_exists('notification_credentials'):
                conn.execute(text("""
                    CREATE TABLE notification_credentials (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                        slack_token VARCHAR,
                        slack_workspace VARCHAR,
                        servicenow_api_key VARCHAR,
                        servicenow_domain VARCHAR,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                print("✅ Created notification_credentials table")
            else:
                print("ℹ️  notification_credentials table already exists, skipping")
            
            print("\n✅ Migration completed successfully!")
            print(f"\n📊 Summary:")
            print(f"   - Created notification_settings table (environment-specific)")
            print(f"   - Created notification_credentials table (shared credentials)")
            print(f"   - Notification settings can now be managed per environment")
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

