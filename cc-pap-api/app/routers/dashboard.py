from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models import User, Policy, PEP, AuditLog, ProtectedResource
from app.schemas import DashboardStats
from app.routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive dashboard statistics."""
    from datetime import datetime, timedelta
    from app.models import PIPConnection
    
    # Policy stats
    total_policies = db.query(Policy).count()
    active_policies = db.query(Policy).filter(Policy.status == "enabled").count()
    draft_policies = db.query(Policy).filter(Policy.status == "draft").count()
    
    # PEP stats
    total_peps = db.query(PEP).count()
    operational_peps = db.query(PEP).filter(PEP.status == "active").count()
    warning_peps = db.query(PEP).filter(PEP.status == "error").count()
    
    # PIP (Smart Connections) stats  
    total_connections = db.query(PIPConnection).count()
    active_connections = db.query(PIPConnection).filter(PIPConnection.status == "active").count()
    pending_connections = total_connections - active_connections
    
    # Authorization decisions (24h)
    yesterday = datetime.utcnow() - timedelta(days=1)
    auth_decisions = db.query(AuditLog).filter(
        AuditLog.timestamp >= yesterday,
        AuditLog.event_type.in_(["ACCESS_GRANTED", "ACCESS_DENIED"])
    ).count()
    
    allowed_count = db.query(AuditLog).filter(
        AuditLog.timestamp >= yesterday,
        AuditLog.outcome == "PERMIT"
    ).count()
    
    denied_count = db.query(AuditLog).filter(
        AuditLog.timestamp >= yesterday,
        AuditLog.outcome == "DENY"
    ).count()
    
    allowed_percentage = round((allowed_count / auth_decisions * 100) if auth_decisions > 0 else 0, 1)
    denied_percentage = round((denied_count / auth_decisions * 100) if auth_decisions > 0 else 0, 1)
    
    return {
        "totalPolicies": total_policies,
        "activePolicies": active_policies,
        "draftPolicies": draft_policies,
        "deployedPEPs": total_peps,
        "operationalPEPs": operational_peps,
        "warningPEPs": warning_peps,
        "smartConnections": total_connections,
        "activeConnections": active_connections,
        "pendingConnections": pending_connections,
        "authDecisions24h": auth_decisions,
        "allowedPercentage": allowed_percentage,
        "deniedPercentage": denied_percentage
    }
