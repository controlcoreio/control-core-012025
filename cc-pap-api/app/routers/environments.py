from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Environment, User
from app.schemas import EnvironmentCreate, EnvironmentResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/environments", tags=["environments"])

@router.get("/", response_model=List[EnvironmentResponse])
async def get_environments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all environments."""
    environments = db.query(Environment).all()
    return environments
