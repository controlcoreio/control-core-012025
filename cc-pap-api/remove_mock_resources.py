#!/usr/bin/env python3
"""
Remove mock Protected Resource data from the database without affecting other data.
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import ProtectedResource

def remove_mock_resources():
    """Remove all existing Protected Resource instances from the database."""
    session: Session = SessionLocal()
    try:
        # Count existing resources
        resource_count = session.query(ProtectedResource).count()
        print(f"Found {resource_count} existing Protected Resource(s) in the database.")
        
        if resource_count > 0:
            # Delete all resources
            session.query(ProtectedResource).delete()
            session.commit()
            print(f"✓ Successfully removed {resource_count} mock Protected Resource(s).")
            print("The /settings/resources page will now show empty state.")
        else:
            print("No Protected Resources found in the database.")
        
    except Exception as e:
        print(f"Error removing mock resources: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    print("Removing mock Protected Resource data from Control Core database...")
    remove_mock_resources()
    print("\nDone! Restart the API server if it's running.")

