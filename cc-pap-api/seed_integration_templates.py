#!/usr/bin/env python3
"""
Seed Integration Templates in Database
Populates the database with pre-configured integration templates
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import engine, get_db
from app.models import IntegrationTemplate, ConnectionType
from app.data.integration_templates import ALL_TEMPLATES
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_integration_templates():
    """Seed integration templates in the database"""
    db = next(get_db())
    
    try:
        # Check if templates already exist
        existing_templates = db.query(IntegrationTemplate).count()
        if existing_templates > 0:
            logger.info(f"Found {existing_templates} existing templates. Skipping seed.")
            return
        
        logger.info("Seeding integration templates...")
        
        # Create database templates from code templates
        for template in ALL_TEMPLATES:
            db_template = IntegrationTemplate(
                name=template.name,
                description=template.description,
                connection_type=template.connection_type.lower(),
                provider=template.provider,
                template_config={
                    'configuration_template': template.configuration_template,
                    'credentials_template': template.credentials_template,
                    'attribute_mappings': template.attribute_mappings,
                    'setup_instructions': template.setup_instructions
                },
                required_credentials=list(template.credentials_template.keys()),
                attribute_mappings=template.attribute_mappings,
                is_built_in=True,
                is_active=template.is_active
            )
            
            db.add(db_template)
        
        db.commit()
        logger.info(f"Successfully seeded {len(ALL_TEMPLATES)} integration templates")
        
    except Exception as e:
        logger.error(f"Failed to seed integration templates: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_integration_templates()
