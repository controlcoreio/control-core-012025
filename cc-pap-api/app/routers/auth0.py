import os
import secrets
import hashlib
import base64
import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Auth0User, MagicLink, Passkey
from app.schemas import (
    Auth0UserResponse, MagicLinkRequest, MagicLinkResponse, MagicLinkVerify,
    PasskeyCreate, PasskeyResponse, UserResponse
)
from app.routers.auth import get_current_user
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/auth0", tags=["auth0"])

# Auth0 Configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "controlcore.auth0.com")
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID", "")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET", "")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", f"https://{AUTH0_DOMAIN}/api/v2/")

# Email Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@controlcore.io")

def generate_magic_link_token() -> str:
    """Generate a secure magic link token."""
    return secrets.token_urlsafe(32)

def send_magic_link_email(email: str, token: str, redirect_url: Optional[str] = None) -> bool:
    """Send magic link email."""
    try:
        # Create magic link URL
        base_url = os.getenv("FRONTEND_URL", "https://controlcore.io")
        magic_link_url = f"{base_url}/auth/magic-link?token={token}"
        
        if redirect_url:
            magic_link_url += f"&redirect_url={redirect_url}"
        
        # Create email content
        subject = "Your Control Core Magic Link"
        body = f"""
        <html>
        <body>
            <h2>Welcome to Control Core!</h2>
            <p>Click the link below to sign in to your Control Core account:</p>
            <p><a href="{magic_link_url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Sign In</a></p>
            <p>This link will expire in 15 minutes.</p>
            <p>If you didn't request this link, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The Control Core Team</p>
        </body>
        </html>
        """
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = email
        
        # Add HTML body
        html_part = MIMEText(body, "html")
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
        
    except Exception as e:
        print(f"Error sending magic link email: {e}")
        return False

@router.post("/magic-link", response_model=MagicLinkResponse)
async def send_magic_link(
    magic_link_data: MagicLinkRequest,
    db: Session = Depends(get_db)
):
    """Send a magic link to the user's email."""
    # Check if user exists
    user = db.query(User).filter(User.email == magic_link_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Generate magic link token
    token = generate_magic_link_token()
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    # Save magic link to database
    magic_link = MagicLink(
        email=magic_link_data.email,
        token=token,
        expires_at=expires_at
    )
    
    db.add(magic_link)
    db.commit()
    
    # Send magic link email
    email_sent = send_magic_link_email(
        magic_link_data.email, 
        token, 
        magic_link_data.redirect_url
    )
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send magic link email"
        )
    
    return MagicLinkResponse(
        message="Magic link sent to your email",
        expires_in=900  # 15 minutes
    )

@router.post("/magic-link/verify")
async def verify_magic_link(
    magic_link_data: MagicLinkVerify,
    db: Session = Depends(get_db)
):
    """Verify magic link token and authenticate user."""
    # Find magic link
    magic_link = db.query(MagicLink).filter(
        MagicLink.token == magic_link_data.token,
        MagicLink.used == False,
        MagicLink.expires_at > datetime.utcnow()
    ).first()
    
    if not magic_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired magic link"
        )
    
    # Get user
    user = db.query(User).filter(User.email == magic_link.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Mark magic link as used
    magic_link.used = True
    magic_link.used_at = datetime.utcnow()
    
    # Update user last login
    user.last_login = datetime.utcnow()
    
    # Create or update Auth0 user record
    auth0_user = db.query(Auth0User).filter(Auth0User.user_id == user.id).first()
    if not auth0_user:
        auth0_user = Auth0User(
            user_id=user.id,
            auth0_user_id=f"magic-link-{user.id}",
            email=user.email,
            email_verified=True,
            connection="magic-link",
            last_login=datetime.utcnow(),
            login_count=1
        )
        db.add(auth0_user)
    else:
        auth0_user.last_login = datetime.utcnow()
        auth0_user.login_count += 1
    
    db.commit()
    
    # Generate JWT token (simplified)
    from app.routers.auth import create_access_token
    from datetime import timedelta
    
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=30)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/passkeys/register/challenge")
async def generate_passkey_registration_challenge(
    request_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a WebAuthn challenge for passkey registration."""
    try:
        # Generate a random challenge
        challenge = secrets.token_bytes(32)
        challenge_b64 = base64.urlsafe_b64encode(challenge).decode('utf-8').rstrip('=')
        
        # Create user data for WebAuthn
        user_data = {
            "id": base64.urlsafe_b64encode(str(current_user.id).encode()).decode('utf-8').rstrip('='),
            "name": current_user.email,
            "display_name": current_user.name
        }
        
        # Store challenge temporarily (in production, use Redis or database)
        # For now, we'll return it directly and trust the client
        
        return {
            "challenge": challenge_b64,
            "user": user_data,
            "credential_id": secrets.token_urlsafe(32)  # Temporary ID for this registration
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate registration challenge: {str(e)}"
        )

@router.post("/passkeys/challenge")
async def generate_passkey_authentication_challenge(
    db: Session = Depends(get_db)
):
    """Generate a WebAuthn challenge for passkey authentication."""
    try:
        # Generate a random challenge
        challenge = secrets.token_bytes(32)
        challenge_b64 = base64.urlsafe_b64encode(challenge).decode('utf-8').rstrip('=')
        
        # Get all passkeys for allowCredentials (in production, you might want to filter by user)
        passkeys = db.query(Passkey).all()
        allow_credentials = []
        
        for passkey in passkeys:
            allow_credentials.append({
                "id": base64.urlsafe_b64encode(passkey.credential_id.encode()).decode('utf-8').rstrip('='),
                "type": "public-key",
                "transports": ["internal", "usb", "nfc", "ble"]
            })
        
        return {
            "challenge": challenge_b64,
            "allowCredentials": allow_credentials,
            "credential_id": secrets.token_urlsafe(32)  # Temporary ID for this authentication
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authentication challenge: {str(e)}"
        )

@router.post("/passkeys", response_model=PasskeyResponse)
async def register_passkey(
    passkey_data: PasskeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a new passkey for the user."""
    # Check if passkey already exists
    existing_passkey = db.query(Passkey).filter(
        Passkey.credential_id == passkey_data.credential_id
    ).first()
    
    if existing_passkey:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passkey already exists"
        )
    
    # Create passkey
    db_passkey = Passkey(
        user_id=current_user.id,
        credential_id=passkey_data.credential_id,
        public_key=passkey_data.public_key,
        counter=passkey_data.counter,
        name=passkey_data.name
    )
    
    db.add(db_passkey)
    db.commit()
    db.refresh(db_passkey)
    
    return db_passkey

@router.get("/passkeys", response_model=List[PasskeyResponse])
async def get_user_passkeys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get passkeys for the current user."""
    passkeys = db.query(Passkey).filter(Passkey.user_id == current_user.id).all()
    return passkeys

@router.delete("/passkeys/{passkey_id}")
async def delete_passkey(
    passkey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a passkey."""
    passkey = db.query(Passkey).filter(
        Passkey.id == passkey_id,
        Passkey.user_id == current_user.id
    ).first()
    
    if not passkey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Passkey not found"
        )
    
    db.delete(passkey)
    db.commit()
    
    return {"message": "Passkey deleted successfully"}

@router.post("/passkeys/authenticate")
async def authenticate_with_passkey(
    verification_data: dict,
    db: Session = Depends(get_db)
):
    """Authenticate user with passkey using WebAuthn verification."""
    try:
        # Extract verification data
        credential_id = verification_data.get("credential_id")
        authenticator_data = verification_data.get("authenticator_data")
        client_data_json = verification_data.get("client_data_json")
        signature = verification_data.get("signature")
        user_handle = verification_data.get("user_handle")
        
        if not all([credential_id, authenticator_data, client_data_json, signature]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required verification data"
            )
        
        # Find passkey by credential_id
        passkey = db.query(Passkey).filter(
            Passkey.credential_id == credential_id
        ).first()
        
        if not passkey:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid passkey"
            )
        
        # In a production implementation, you would:
        # 1. Verify the WebAuthn signature using the stored public key
        # 2. Verify the authenticator data
        # 3. Verify the client data JSON
        # 4. Check the challenge
        # 5. Verify the counter has increased
        
        # For now, we'll do basic validation and trust the client
        # This is a simplified implementation for development
        
        # Update passkey usage
        passkey.last_used = datetime.utcnow()
        passkey.counter += 1
        
        # Get user
        user = db.query(User).filter(User.id == passkey.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user last login
        user.last_login = datetime.utcnow()
        
        # Create or update Auth0 user record
        auth0_user = db.query(Auth0User).filter(Auth0User.user_id == user.id).first()
        if not auth0_user:
            auth0_user = Auth0User(
                user_id=user.id,
                auth0_user_id=f"passkey-{user.id}",
                email=user.email,
                email_verified=True,
                connection="passkey",
                last_login=datetime.utcnow(),
                login_count=1
            )
            db.add(auth0_user)
        else:
            auth0_user.last_login = datetime.utcnow()
            auth0_user.login_count += 1
        
        db.commit()
        
        # Generate JWT token
        from app.routers.auth import create_access_token
        from datetime import timedelta
        
        access_token, jti, expire = create_access_token(
            data={"sub": user.username},
            expires_delta=timedelta(minutes=30)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "permissions": user.permissions or ["read", "write"],
                "mfa_enabled": user.mfa_enabled,
                "username": user.username,
                "subscription_tier": user.subscription_tier,
                "deployment_model": user.deployment_model,
                "github_repo": user.github_repo
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Passkey authentication failed: {str(e)}"
        )

@router.get("/users", response_model=List[Auth0UserResponse])
async def get_auth0_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Auth0 users (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    auth0_users = db.query(Auth0User).all()
    return auth0_users

@router.get("/users/{user_id}", response_model=Auth0UserResponse)
async def get_auth0_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Auth0 user by user ID."""
    auth0_user = db.query(Auth0User).filter(Auth0User.user_id == user_id).first()
    
    if not auth0_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Auth0 user not found"
        )
    
    # Check if user can access this data
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return auth0_user

@router.post("/saml/login")
async def saml_login(
    saml_response: str,
    db: Session = Depends(get_db)
):
    """Handle SAML login response."""
    # In a real implementation, you would:
    # 1. Parse and validate the SAML response
    # 2. Extract user attributes
    # 3. Create or update user
    # 4. Generate JWT token
    
    # For now, return a placeholder
    return {
        "message": "SAML login not implemented yet",
        "saml_response": saml_response
    }

@router.get("/saml/metadata")
async def get_saml_metadata():
    """Get SAML metadata for Control Core."""
    # In a real implementation, you would generate SAML metadata
    return {
        "message": "SAML metadata not implemented yet"
    }
