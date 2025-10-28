"""
Create PEP Configuration Tables
Run this script to create the new configuration tables in the database
"""

from app.database import engine
from app.models_config import Base as ConfigBase

def create_config_tables():
    """Create all configuration tables"""
    print("Creating PEP configuration tables...")
    ConfigBase.metadata.create_all(bind=engine)
    print("✅ Configuration tables created successfully!")
    print("   - global_pep_config")
    print("   - individual_pep_config")

if __name__ == "__main__":
    create_config_tables()

