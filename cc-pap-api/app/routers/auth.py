from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import bcrypt
import os
from jose import JWTError, jwt
from app.database import get_db
from app.models import User, AuditLog, UserSession
from app.schemas import LoginRequest, LoginResponse, UserResponse, UserCreate, TokenData
import hashlib
import uuid

router = APIRouter(prefix="/auth", tags=["authentication"])

# Security configuration
SECRET_KEY = "control-core-secret-key-2025"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using bcrypt."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, jti: str = None):
    """Create a JWT access token with unique JTI for session tracking."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)  # Match frontend session timeout
    
    # Add JTI (JWT ID) for session tracking
    if not jti:
        jti = str(uuid.uuid4())
    
    to_encode.update({
        "exp": expire,
        "jti": jti,
        "iat": datetime.utcnow()
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, jti, expire

def authenticate_user(db: Session, username: str, password: str):
    """Authenticate a user by username and password."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def is_builtin_admin(user: User) -> bool:
    """
    Check if the user is the builtin system administrator.
    System administrators bypass all RBAC checks.
    """
    return user.role == "builtin_admin"

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get the current authenticated user from JWT token and check if session is revoked."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    session_revoked_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session has been revoked. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        jti: str = payload.get("jti")
        
        if username is None:
            raise credentials_exception
        
        # Check if session is revoked (NIST/FedRAMP/SOC2 compliance)
        if jti:
            session = db.query(UserSession).filter(UserSession.jti == jti).first()
            if session and session.revoked:
                raise session_revoked_exception
            # If session doesn't exist and JTI is present, it might be an old token before session tracking
            # We'll allow it for backward compatibility, but log it
            if not session:
                print(f"Warning: Token with JTI {jti} has no session record")
        
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return access token."""
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        # Log failed login attempt
        failed_user = db.query(User).filter(User.username == login_data.username).first()
        failed_login_log = AuditLog(
            user_id=failed_user.id if failed_user else None,
            user=login_data.username,
            action=f"Failed login attempt for user: {login_data.username}",
            resource=f"User #{failed_user.id}" if failed_user else "Unknown User",
            resource_type="user",
            result="failure",
            event_type="USER_LOGIN_FAILED",
            outcome="FAILURE",
            reason="Incorrect username or password"
        )
        db.add(failed_login_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login and session info
    user.last_login = datetime.utcnow()
    user.last_activity = datetime.utcnow()
    user.active_sessions = (user.active_sessions or 0) + 1
    db.commit()
    
    # Log successful login
    login_audit_log = AuditLog(
        user_id=user.id,
        user=user.username,
        action=f"User logged in",
        resource=f"User #{user.id}",
        resource_type="user",
        result="success",
        event_type="USER_LOGIN",
        outcome="SUCCESS"
    )
    db.add(login_audit_log)
    db.commit()
    
    # Create access token with JTI for session tracking
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token, jti, expire_time = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Create session record for NIST/FedRAMP/SOC2 compliance
    token_hash = hashlib.sha256(access_token.encode()).hexdigest()
    user_session = UserSession(
        user_id=user.id,
        jti=jti,
        token_hash=token_hash,
        expires_at=expire_time,
        revoked=False
    )
    db.add(user_session)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "force_password_change": user.force_password_change if hasattr(user, 'force_password_change') else False
    }

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        name=user_data.name,
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password,
        role=user_data.role,
        status=user_data.status,
        mfa_enabled=user_data.mfa_enabled,
        permissions=user_data.permissions,
        subscription_tier=user_data.subscription_tier,
        deployment_model=user_data.deployment_model,
        github_repo=user_data.github_repo
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user

@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user, revoke session, and decrement session count."""
    # Revoke the current session token (NIST/FedRAMP/SOC2 compliance)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        jti = payload.get("jti")
        if jti:
            session = db.query(UserSession).filter(UserSession.jti == jti).first()
            if session:
                session.revoked = True
                session.revoked_at = datetime.utcnow()
                session.revoke_reason = "User logout"
    except Exception as e:
        print(f"Error revoking session on logout: {e}")
    
    # Decrement session count
    if current_user.active_sessions and current_user.active_sessions > 0:
        current_user.active_sessions -= 1
        db.commit()
    
    # Log logout
    logout_audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action="User logged out",
        resource=f"User #{current_user.id}",
        resource_type="user",
        result="success",
        event_type="USER_LOGOUT",
        outcome="SUCCESS"
    )
    db.add(logout_audit_log)
    db.commit()
    
    return {"message": "Successfully logged out"}

@router.post("/change-password")
async def change_password(
    password_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password and clear force_password_change flag."""
    # Verify current password
    if not verify_password(password_data["current_password"], current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data["new_password"])
    current_user.force_password_change = False
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.get("/users", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users - restricted to Super Administrator."""
    # Only builtin_admin can list users
    if current_user.role != "builtin_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    query = db.query(User)
    
    if status:
        query = query.filter(User.status == status)
    if role:
        query = query.filter(User.role == role)
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.post("/users/{user_id}/change-password")
async def admin_change_user_password(
    user_id: int,
    password_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin changes user password - for Super Administrator only."""
    if current_user.role != "builtin_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.password_hash = get_password_hash(password_data["new_password"])
    user.force_password_change = False  # Clear force flag
    db.commit()
    
    # Log audit event
    audit_log = AuditLog(
        user_id=current_user.id,
        action=f"Password changed for user {user.username}",
        resource=f"User #{user_id}",
        event_type="USER_PASSWORD_CHANGED",
        outcome="SUCCESS"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/users/{user_id}/mfa/enable")
async def enable_user_mfa(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable MFA for a user - Super Administrator only."""
    if current_user.role != "builtin_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.mfa_enabled = True
    db.commit()
    
    # Log audit event
    audit_log = AuditLog(
        user_id=current_user.id,
        action=f"MFA enabled for user {user.username}",
        resource=f"User #{user_id}",
        event_type="USER_MFA_ENABLED",
        outcome="SUCCESS"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "MFA enabled successfully"}

@router.post("/users/{user_id}/mfa/disable")
async def disable_user_mfa(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable MFA for a user - Super Administrator only."""
    if current_user.role != "builtin_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.mfa_enabled = False
    db.commit()
    
    # Log audit event
    audit_log = AuditLog(
        user_id=current_user.id,
        action=f"MFA disabled for user {user.username}",
        resource=f"User #{user_id}",
        event_type="USER_MFA_DISABLED",
        outcome="SUCCESS"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "MFA disabled successfully"}

@router.post("/users/{user_id}/kill-sessions")
async def kill_user_sessions(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kill all active sessions for a user - Super Administrator only (NIST/FedRAMP/SOC2 compliant)."""
    if current_user.role != "builtin_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Revoke ALL active sessions for this user (CRITICAL for security compliance)
    active_sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.revoked == False,
        UserSession.expires_at > datetime.utcnow()
    ).all()
    
    sessions_killed = 0
    for session in active_sessions:
        session.revoked = True
        session.revoked_at = datetime.utcnow()
        session.revoked_by = current_user.id
        session.revoke_reason = f"All sessions terminated by admin: {current_user.username}"
        sessions_killed += 1
    
    # Reset session counter
    previous_sessions = user.active_sessions or 0
    user.active_sessions = 0
    db.commit()
    
    # Log session termination
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Terminated all sessions for user: {user.username} ({sessions_killed} tokens revoked, {previous_sessions} counter reset)",
        resource=f"User #{user_id}",
        resource_type="user",
        result="success",
        event_type="USER_UPDATED",
        outcome="SUCCESS",
        reason=f"NIST/SOC2 compliance - forced session termination"
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "message": f"Successfully killed all sessions for {user.username}",
        "sessions_killed": sessions_killed,
        "tokens_revoked": sessions_killed,
        "previous_counter": previous_sessions
    }

@router.get("/auth-methods/stats")
async def get_auth_method_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get authentication method usage statistics - Super Administrator only."""
    if current_user.role != "builtin_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    total_users = db.query(User).count()
    mfa_enabled_users = db.query(User).filter(User.mfa_enabled == True).count()
    local_users = db.query(User).filter(User.user_source == "local").count()
    saml_users = db.query(User).filter(User.user_source == "saml").count()
    oidc_users = db.query(User).filter(User.user_source == "oidc").count()
    
    # Get passkey count from auth0 module
    from app.models import Passkey
    passkey_count = db.query(Passkey).count()
    
    return {
        "total_users": total_users,
        "password_auth": {
            "total": local_users,
            "percentage": round((local_users / total_users * 100) if total_users > 0 else 0, 1)
        },
        "mfa": {
            "enabled": mfa_enabled_users,
            "percentage": round((mfa_enabled_users / total_users * 100) if total_users > 0 else 0, 1)
        },
        "sso": {
            "saml": saml_users,
            "oidc": oidc_users,
            "total": saml_users + oidc_users,
            "percentage": round(((saml_users + oidc_users) / total_users * 100) if total_users > 0 else 0, 1)
        },
        "passkeys": {
            "total": passkey_count,
            "users_with_passkeys": passkey_count  # Simplified for now
        }
    }

# SSO Configuration
@router.get("/sso/status")
async def get_sso_status():
    """Check if SSO is configured and available."""
    # Check if SSO is configured by looking for environment variables
    saml_configured = bool(
        os.getenv("SAML_ENTITY_ID") and 
        os.getenv("SAML_SSO_URL") and 
        os.getenv("SAML_CERTIFICATE")
    )
    
    oidc_configured = bool(
        os.getenv("OIDC_CLIENT_ID") and 
        os.getenv("OIDC_CLIENT_SECRET") and 
        os.getenv("OIDC_ISSUER_URL")
    )
    
    return {
        "configured": saml_configured or oidc_configured,
        "saml_configured": saml_configured,
        "oidc_configured": oidc_configured,
        "providers": {
            "saml": saml_configured,
            "oidc": oidc_configured
        }
    }

@router.post("/sso/initiate")
async def initiate_sso():
    """Initiate SSO authentication flow."""
    # Check if SSO is configured
    saml_configured = bool(
        os.getenv("SAML_ENTITY_ID") and 
        os.getenv("SAML_SSO_URL") and 
        os.getenv("SAML_CERTIFICATE")
    )
    
    oidc_configured = bool(
        os.getenv("OIDC_CLIENT_ID") and 
        os.getenv("OIDC_CLIENT_SECRET") and 
        os.getenv("OIDC_ISSUER_URL")
    )
    
    if not (saml_configured or oidc_configured):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SSO is not configured"
        )
    
    # For now, we'll use OIDC if configured, otherwise SAML
    if oidc_configured:
        return initiate_oidc_sso()
    else:
        return initiate_saml_sso()

def initiate_oidc_sso():
    """Initiate OIDC SSO flow."""
    client_id = os.getenv("OIDC_CLIENT_ID")
    issuer_url = os.getenv("OIDC_ISSUER_URL")
    redirect_uri = os.getenv("OIDC_REDIRECT_URI", "http://localhost:3000/auth/callback")
    
    # Generate state parameter for security
    import secrets
    state = secrets.token_urlsafe(32)
    
    # Build authorization URL
    auth_url = f"{issuer_url}/authorize?" + "&".join([
        f"client_id={client_id}",
        f"redirect_uri={redirect_uri}",
        f"response_type=code",
        f"scope=openid profile email",
        f"state={state}"
    ])
    
    return {
        "auth_url": auth_url,
        "state": state,
        "provider": "oidc"
    }

def initiate_saml_sso():
    """Initiate SAML SSO flow."""
    sso_url = os.getenv("SAML_SSO_URL")
    entity_id = os.getenv("SAML_ENTITY_ID")
    
    # Generate SAML request (simplified)
    import secrets
    request_id = secrets.token_urlsafe(32)
    
    # In a real implementation, you would generate a proper SAML AuthnRequest
    # For now, we'll return a simple URL
    auth_url = f"{sso_url}?SAMLRequest={request_id}&RelayState={entity_id}"
    
    return {
        "auth_url": auth_url,
        "request_id": request_id,
        "provider": "saml"
    }

@router.post("/sso/callback")
async def sso_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    saml_response: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Handle SSO callback from identity provider."""
    try:
        if code and state:
            # OIDC callback
            return await handle_oidc_callback(code, state, db)
        elif saml_response:
            # SAML callback
            return await handle_saml_callback(saml_response, db)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid callback parameters"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SSO callback failed: {str(e)}"
        )

async def handle_oidc_callback(code: str, state: str, db: Session):
    """Handle OIDC callback."""
    # In a real implementation, you would:
    # 1. Exchange code for tokens
    # 2. Validate the state parameter
    # 3. Get user info from the ID token
    # 4. Create or update user in database
    # 5. Generate JWT token
    
    # For now, return a mock response
    return {
        "access_token": "mock_access_token",
        "token_type": "bearer",
        "user": {
            "id": "sso_user_1",
            "email": "user@example.com",
            "name": "SSO User",
            "role": "user",
            "permissions": ["read", "write"],
            "mfa_enabled": False,
            "username": "sso_user",
            "subscription_tier": "kickstart",
            "deployment_model": "hosted",
            "github_repo": None
        }
    }

async def handle_saml_callback(saml_response: str, db: Session):
    """Handle SAML callback."""
    # In a real implementation, you would:
    # 1. Parse and validate the SAML response
    # 2. Extract user attributes
    # 3. Create or update user in database
    # 4. Generate JWT token
    
    # For now, return a mock response
    return {
        "access_token": "mock_access_token",
        "token_type": "bearer",
        "user": {
            "id": "saml_user_1",
            "email": "user@company.com",
            "name": "SAML User",
            "role": "user",
            "permissions": ["read", "write"],
            "mfa_enabled": False,
            "username": "saml_user",
            "subscription_tier": "kickstart",
            "deployment_model": "hosted",
            "github_repo": None
        }
    }
