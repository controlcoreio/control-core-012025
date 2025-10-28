#!/usr/bin/env python3
"""
Comprehensive cleanup of ALL mock data from Control Core database.
This removes:
- Mock Policies
- Mock Audit Logs
- Mock PEPs (Bouncers)
- Mock Protected Resources
- Mock PIP Connections
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Policy, AuditLog, PEP, ProtectedResource, PIPConnection

def cleanup_all_mock_data():
    """Remove all mock data from the database."""
    session: Session = SessionLocal()
    try:
        print("=" * 60)
        print("COMPREHENSIVE MOCK DATA CLEANUP")
        print("=" * 60)
        
        # Count all items before deletion
        policy_count = session.query(Policy).count()
        audit_count = session.query(AuditLog).count()
        pep_count = session.query(PEP).count()
        resource_count = session.query(ProtectedResource).count()
        pip_count = session.query(PIPConnection).count()
        
        total_items = policy_count + audit_count + pep_count + resource_count + pip_count
        
        print(f"\nFound {total_items} total mock items:")
        print(f"  - Policies: {policy_count}")
        print(f"  - Audit Logs: {audit_count}")
        print(f"  - PEPs (Bouncers): {pep_count}")
        print(f"  - Protected Resources: {resource_count}")
        print(f"  - PIP Connections: {pip_count}")
        
        if total_items == 0:
            print("\n✓ Database is already clean - no mock data found.")
            return
        
        print(f"\nRemoving all {total_items} mock items...")
        
        # Delete all mock data
        session.query(AuditLog).delete()
        session.query(Policy).delete()
        session.query(PEP).delete()
        session.query(ProtectedResource).delete()
        session.query(PIPConnection).delete()
        
        session.commit()
        
        print("\n" + "=" * 60)
        print("✓ CLEANUP COMPLETE")
        print("=" * 60)
        print(f"\nSuccessfully removed all {total_items} mock items:")
        print(f"  ✓ {policy_count} Policies removed")
        print(f"  ✓ {audit_count} Audit Logs removed")
        print(f"  ✓ {pep_count} PEPs (Bouncers) removed")
        print(f"  ✓ {resource_count} Protected Resources removed")
        print(f"  ✓ {pip_count} PIP Connections removed")
        
        print("\n📊 Dashboard will now show:")
        print("  - Total Policies: 0")
        print("  - Deployed Bouncers: 0")
        print("  - Access Denials: 0")
        print("  - Policy Coverage: 0%")
        print("  - Authorization Requests: 0")
        
        print("\n✨ Application is clean and ready for production deployment!")
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    print("\n🧹 Starting comprehensive mock data cleanup...")
    cleanup_all_mock_data()
    print("\n✅ Done! Restart the API server to see changes.\n")

