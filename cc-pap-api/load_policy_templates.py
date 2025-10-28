#!/usr/bin/env python3
"""
Policy Template Loader

This script loads all policy templates from the file system into the database,
including their metadata from .meta.json files.
"""

import json
import os
import sys
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add app directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.models import Base, PolicyTemplate
from app.database import database_url, engine as db_engine

def load_templates_from_filesystem(db_session=None):
    """Load all policy templates from the filesystem into the database
    
    Args:
        db_session: Optional SQLAlchemy session. If None, creates a new session.
    
    Returns:
        tuple: (loaded_count, updated_count, error_count) or None if templates dir not found
    """
    
    # Get templates directory
    templates_dir = Path(__file__).parent.parent / 'cc-pap-core' / 'policy-templates'
    
    if not templates_dir.exists():
        print(f"❌ Templates directory not found: {templates_dir}")
        return None
    
    print(f"📂 Loading templates from: {templates_dir}")
    
    # If no session provided, create one (for standalone execution)
    close_session = False
    if db_session is None:
        engine = db_engine
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        close_session = True
    else:
        db = db_session
    
    try:
        # Find all .rego files
        rego_files = list(templates_dir.rglob('*.rego'))
        total = len(rego_files)
        loaded = 0
        updated = 0
        errors = 0
        
        print(f"\n🔍 Found {total} policy template files\n")
        
        for rego_path in sorted(rego_files):
            try:
                # Get relative path and category
                relative_path = rego_path.relative_to(templates_dir)
                category = str(relative_path.parent)
                template_name = rego_path.stem
                
                # Read rego content
                with open(rego_path, 'r', encoding='utf-8') as f:
                    rego_content = f.read()
                
                # Try to load metadata
                meta_path = rego_path.with_suffix('.meta.json')
                metadata = {}
                
                if meta_path.exists():
                    with open(meta_path, 'r', encoding='utf-8') as f:
                        metadata = json.load(f)
                    print(f"  ✅ {template_name} (with metadata)")
                else:
                    print(f"  ⚠️  {template_name} (no metadata)")
                
                # Extract description from metadata or rego comments
                description = metadata.get('summary', '')
                if not description:
                    # Try to extract from rego comments
                    lines = rego_content.split('\n')
                    comments = [line.strip('# ').strip() for line in lines if line.strip().startswith('#')]
                    description = ' '.join(comments[:3]) if comments else f"{template_name} policy"
                
                # Check if template already exists
                existing = db.query(PolicyTemplate).filter(
                    PolicyTemplate.name == template_name
                ).first()
                
                if existing:
                    # Update existing template
                    existing.description = description
                    existing.category = category
                    existing.subcategory = metadata.get('tags', [None])[0] if metadata.get('tags') else None
                    existing.template_content = rego_content
                    existing.template_metadata = metadata
                    updated += 1
                else:
                    # Create new template
                    new_template = PolicyTemplate(
                        name=template_name,
                        description=description,
                        category=category,
                        subcategory=metadata.get('tags', [None])[0] if metadata.get('tags') else None,
                        template_content=rego_content,
                        template_metadata=metadata,
                        variables=[],  # Can be extracted from rego if needed
                        created_by='system'
                    )
                    db.add(new_template)
                    loaded += 1
                
            except Exception as e:
                print(f"  ❌ Error processing {rego_path.name}: {str(e)}")
                errors += 1
        
        # Commit changes (only if we own the session)
        if close_session:
            db.commit()
        
        print(f"\n{'='*60}")
        print(f"📊 Summary:")
        print(f"  ✅ Loaded new: {loaded}")
        print(f"  🔄 Updated: {updated}")
        print(f"  ❌ Errors: {errors}")
        print(f"  📁 Total: {total}")
        print(f"{'='*60}\n")
        
        return (loaded, updated, errors)
        
    except Exception as e:
        print(f"\n❌ Database error: {str(e)}")
        if close_session:
            db.rollback()
        raise
    finally:
        if close_session:
            db.close()

if __name__ == '__main__':
    print("🚀 Policy Template Loader")
    print("=" * 60)
    load_templates_from_filesystem()
    print("\n✨ Template loading complete!")
