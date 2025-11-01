#!/usr/bin/env python3
"""
Add sidecar columns to existing PEP configuration tables
"""

from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_sidecar_columns():
    """Add sidecar-specific columns to existing tables"""
    try:
        with engine.connect() as conn:
            # Start a transaction
            with conn.begin():
                logger.info("Adding sidecar columns to global_pep_config...")
                
                # Add columns to global_pep_config
                try:
                    conn.execute(text("ALTER TABLE global_pep_config ADD COLUMN default_sidecar_port INTEGER DEFAULT 8080"))
                    logger.info("  ✓ Added default_sidecar_port")
                except Exception as e:
                    logger.info(f"  - default_sidecar_port already exists or error: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE global_pep_config ADD COLUMN sidecar_injection_mode VARCHAR DEFAULT 'automatic'"))
                    logger.info("  ✓ Added sidecar_injection_mode")
                except Exception as e:
                    logger.info(f"  - sidecar_injection_mode already exists or error: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE global_pep_config ADD COLUMN sidecar_namespace_selector VARCHAR"))
                    logger.info("  ✓ Added sidecar_namespace_selector")
                except Exception as e:
                    logger.info(f"  - sidecar_namespace_selector already exists or error: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE global_pep_config ADD COLUMN sidecar_resource_limits_cpu VARCHAR DEFAULT '500m'"))
                    logger.info("  ✓ Added sidecar_resource_limits_cpu")
                except Exception as e:
                    logger.info(f"  - sidecar_resource_limits_cpu already exists or error: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE global_pep_config ADD COLUMN sidecar_resource_limits_memory VARCHAR DEFAULT '256Mi'"))
                    logger.info("  ✓ Added sidecar_resource_limits_memory")
                except Exception as e:
                    logger.info(f"  - sidecar_resource_limits_memory already exists or error: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE global_pep_config ADD COLUMN sidecar_init_container_enabled BOOLEAN DEFAULT TRUE"))
                    logger.info("  ✓ Added sidecar_init_container_enabled")
                except Exception as e:
                    logger.info(f"  - sidecar_init_container_enabled already exists or error: {e}")
                
                logger.info("\nAdding sidecar columns to individual_pep_config...")
                
                # Add columns to individual_pep_config
                try:
                    conn.execute(text("ALTER TABLE individual_pep_config ADD COLUMN sidecar_port_override INTEGER"))
                    logger.info("  ✓ Added sidecar_port_override")
                except Exception as e:
                    logger.info(f"  - sidecar_port_override already exists or error: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE individual_pep_config ADD COLUMN sidecar_traffic_mode VARCHAR DEFAULT 'iptables'"))
                    logger.info("  ✓ Added sidecar_traffic_mode")
                except Exception as e:
                    logger.info(f"  - sidecar_traffic_mode already exists or error: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE individual_pep_config ADD COLUMN sidecar_resource_cpu_override VARCHAR"))
                    logger.info("  ✓ Added sidecar_resource_cpu_override")
                except Exception as e:
                    logger.info(f"  - sidecar_resource_cpu_override already exists or error: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE individual_pep_config ADD COLUMN sidecar_resource_memory_override VARCHAR"))
                    logger.info("  ✓ Added sidecar_resource_memory_override")
                except Exception as e:
                    logger.info(f"  - sidecar_resource_memory_override already exists or error: {e}")
                
            logger.info("\n✅ All sidecar columns added successfully!")
            return True
            
    except Exception as e:
        logger.error(f"\n❌ Error adding columns: {e}")
        return False

if __name__ == "__main__":
    success = add_sidecar_columns()
    exit(0 if success else 1)

