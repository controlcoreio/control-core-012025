from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import TenantUser
from app.schemas import TenantUserResponse
from app.services.auth_service import AuthService
from typing import Optional
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter()

# Mock user for development
class MockUser:
    def __init__(self, id: str, email: str, name: str):
        self.id = id
        self.email = email
        self.name = name

def get_current_user(request: Request) -> MockUser:
    """Get current user (mock implementation)"""
    # In a real implementation, this would validate JWT token
    # For now, return a mock user
    return MockUser(
        id="user_123",
        email="user@example.com",
        name="Test User"
    )

@router.get("/me", response_model=TenantUserResponse)
async def get_current_user_info(
    request: Request,
    current_user = Depends(get_current_user)
):
    """Get current user information"""
    # In a real implementation, this would get user from database
    # For now, return mock data
    return TenantUserResponse(
        id="user_123",
        tenant_id="tenant_123",
        user_id="user_123",
        email=current_user.email,
        name=current_user.name,
        role="admin",
        is_active=True,
        created_at="2024-01-15T10:30:00Z",
        last_login="2024-01-15T10:30:00Z"
    )

@router.post("/login")
async def login(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    """User login"""
    auth_service = AuthService(db)
    
    # In a real implementation, this would validate credentials
    # For now, return mock response
    return {
        "access_token": "mock_access_token",
        "refresh_token": "mock_refresh_token",
        "token_type": "bearer",
        "expires_in": 3600
    }

@router.post("/logout")
async def logout(
    current_user = Depends(get_current_user)
):
    """User logout"""
    # In a real implementation, this would invalidate tokens
    return {"message": "Logged out successfully"}

@router.post("/refresh")
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    auth_service = AuthService(db)
    
    # In a real implementation, this would validate refresh token
    # For now, return mock response
    return {
        "access_token": "new_mock_access_token",
        "token_type": "bearer",
        "expires_in": 3600
    }

@router.get("/tenants")
async def get_user_tenants(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's tenants"""
    # In a real implementation, this would query the database
    # For now, return mock data
    return [
        {
            "id": "tenant_123",
            "name": "My Company",
            "domain": "mycompany.controlcore.io",
            "plan_type": "pro",
            "status": "active"
        }
    ]

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
