#!/usr/bin/env python3
"""
Clean duplicate templates and reload all templates fresh
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

def clean_and_reload():
    """Clean all existing templates and reload from filesystem"""
    
    # Get templates directory
    templates_dir = Path(__file__).parent.parent / 'cc-pap-core' / 'policy-templates'
    
    if not templates_dir.exists():
        print(f"❌ Templates directory not found: {templates_dir}")
        return
    
    print(f"📂 Templates directory: {templates_dir}")
    
    # Create database connection
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    db = SessionLocal()
    
    try:
        # Step 1: Delete all existing templates
        existing_count = db.query(PolicyTemplate).count()
        print(f"\n🗑️  Deleting {existing_count} existing templates...")
        db.query(PolicyTemplate).delete()
        db.commit()
        print(f"✅ Deleted all existing templates")
        
        # Step 2: Load fresh templates
        rego_files = list(templates_dir.rglob('*.rego'))
        total = len(rego_files)
        loaded = 0
        errors = 0
        
        print(f"\n🔄 Loading {total} fresh templates...\n")
        
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
                
                # Extract description
                description = metadata.get('summary', '')
                if not description:
                    lines = rego_content.split('\n')
                    comments = [line.strip('# ').strip() for line in lines if line.strip().startswith('#')]
                    description = ' '.join(comments[:3]) if comments else f"{template_name} policy"
                
                # Create new template
                new_template = PolicyTemplate(
                    name=template_name,
                    description=description,
                    category=category,
                    subcategory=metadata.get('tags', [None])[0] if metadata.get('tags') else None,
                    template_content=rego_content,
                    template_metadata=metadata,
                    variables=[],
                    created_by='system'
                )
                db.add(new_template)
                loaded += 1
                
                if loaded % 20 == 0:
                    print(f"  Loaded {loaded}/{total}...")
                
            except Exception as e:
                print(f"  ❌ Error processing {rego_path.name}: {str(e)}")
                errors += 1
        
        # Commit all changes
        db.commit()
        
        # Verify
        final_count = db.query(PolicyTemplate).count()
        
        print(f"\n{'='*60}")
        print(f"📊 Summary:")
        print(f"  🗑️  Deleted: {existing_count} old templates")
        print(f"  ✅ Loaded: {loaded} new templates")
        print(f"  ❌ Errors: {errors}")
        print(f"  📁 Final count: {final_count}")
        print(f"{'='*60}\n")
        
        # Verify one template has full metadata
        test_template = db.query(PolicyTemplate).filter(PolicyTemplate.name == 'ai-accountability-framework').first()
        if test_template and test_template.template_metadata:
            tm = test_template.template_metadata
            print(f"✅ Verification: 'ai-accountability-framework' has:")
            print(f"   - {len(tm.get('use_cases', []))} use cases")
            print(f"   - {len(tm.get('conditions', []))} conditions")
            print(f"   - deployment_notes: {'Yes' if 'deployment_notes' in tm else 'No'}")
        
    except Exception as e:
        print(f"\n❌ Database error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    print("🚀 Clean and Reload Policy Templates")
    print("=" * 60)
    clean_and_reload()
    print("\n✨ Complete! Restart the API server to see changes.")

