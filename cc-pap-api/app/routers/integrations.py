from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Integration, User
from app.schemas import IntegrationResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/integrations", tags=["integrations"])

@router.get("/", response_model=List[IntegrationResponse])
async def get_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all integrations."""
    integrations = db.query(Integration).all()
    return integrations
