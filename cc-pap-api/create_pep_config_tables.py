#!/usr/bin/env python3
"""
Create PEP Configuration Tables in Database
This script creates the global_pep_config and individual_pep_config tables
"""

from app.database import engine, Base
from app.models_config import GlobalPEPConfig, IndividualPEPConfig
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Create PEP configuration tables"""
    try:
        logger.info("Creating PEP configuration tables...")
        
        # Create all tables from models_config
        Base.metadata.create_all(bind=engine)
        
        logger.info("✅ PEP configuration tables created successfully!")
        logger.info("  - global_pep_config")
        logger.info("  - individual_pep_config")
        
        return True
    except Exception as e:
        logger.error(f"❌ Error creating tables: {e}")
        return False

if __name__ == "__main__":
    success = create_tables()
    exit(0 if success else 1)

