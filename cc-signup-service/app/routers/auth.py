from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserResponse
from datetime import datetime
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

def get_current_user(db: Session = Depends(get_db)) -> User:
    """Get current user (mock implementation)."""
    # In a real implementation, this would get the user from JWT token
    # For now, return a mock user
    return User(
        id=str(uuid.uuid4()),
        name="John Doe",
        email="john@example.com",
        subscription_tier="kickstart",
        created_at=datetime.now(),
        is_active=True
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        subscription_tier=current_user.subscription_tier,
        created_at=current_user.created_at
    )
