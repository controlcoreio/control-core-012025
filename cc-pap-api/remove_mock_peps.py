#!/usr/bin/env python3
"""
Remove mock PEP data from the database without affecting other data.
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import PEP

def remove_mock_peps():
    """Remove all existing PEP (Bouncer) instances from the database."""
    session: Session = SessionLocal()
    try:
        # Count existing PEPs
        pep_count = session.query(PEP).count()
        print(f"Found {pep_count} existing PEP(s) in the database.")
        
        if pep_count > 0:
            # Delete all PEPs
            session.query(PEP).delete()
            session.commit()
            print(f"✓ Successfully removed {pep_count} mock PEP(s).")
            print("The /settings/peps page will now show the onboarding guide.")
        else:
            print("No PEPs found in the database.")
        
    except Exception as e:
        print(f"Error removing mock PEPs: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    print("Removing mock PEP data from Control Core database...")
    remove_mock_peps()
    print("\nDone! Restart the API server if it's running.")

