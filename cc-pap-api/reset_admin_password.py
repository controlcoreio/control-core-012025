#!/usr/bin/env python3
"""
Emergency Admin Password Reset Tool

Use this script if you're locked out of the admin account.
This should ONLY be used in emergencies.

Usage:
    python reset_admin_password.py [new_password]

If no password is provided, resets to default: SecurePass2025!
"""

import sys
import bcrypt
from app.database import SessionLocal
from app.models import User

def reset_password(new_password="SecurePass2025!"):
    """Reset admin password to specified password"""
    print("🔐 Control Core Admin Password Reset")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        # Find admin user
        user = db.query(User).filter(User.username == 'ccadmin').first()
        
        if not user:
            print("❌ Admin user 'ccadmin' not found in database")
            print("   The database might be empty or corrupted")
            return False
        
        # Hash new password
        new_password_hash = bcrypt.hashpw(
            new_password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Update user
        user.password_hash = new_password_hash
        user.force_password_change = True
        user.status = 'active'
        db.commit()
        
        print(f"✅ Password reset successful!")
        print(f"   Username: ccadmin")
        print(f"   New password: {new_password}")
        print(f"   Status: active")
        print(f"   Force password change: Yes")
        print("")
        print("You can now log in at: http://localhost:5173/login")
        print("You will be prompted to change your password on first login.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error resetting password: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        password = sys.argv[1]
        print(f"Resetting password to custom value...")
    else:
        password = "SecurePass2025!"
        print(f"Resetting password to default: {password}")
    
    print("")
    success = reset_password(password)
    sys.exit(0 if success else 1)

