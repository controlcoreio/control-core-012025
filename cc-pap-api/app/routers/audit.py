from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogCreate, AuditLogResponse, EventType, Outcome
from app.routers.auth import get_current_user

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    event_type: Optional[EventType] = None,
    outcome: Optional[Outcome] = None,
    user: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit logs with optional filtering."""
    query = db.query(AuditLog)
    
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    
    if outcome:
        query = query.filter(AuditLog.outcome == outcome)
    
    if user:
        query = query.filter(AuditLog.user == user)
    
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    # Order by most recent first
    logs = query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()
    return logs

@router.get("/users/{user_id}/audit-logs", response_model=List[AuditLogResponse])
async def get_user_audit_logs(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit logs for a specific user - accessible to all authenticated users."""
    # Any authenticated user can view audit logs
    
    logs = db.query(AuditLog).filter(
        AuditLog.user_id == user_id
    ).order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()
    
    return logs

@router.get("/control-core/logs", response_model=List[AuditLogResponse])
async def get_control_core_audit_logs(
    skip: int = 0,
    limit: int = 100,
    event_type: Optional[str] = None,
    resource_type: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Control Core user activity audit logs - excludes access decisions."""
    # Filter out ACCESS_GRANTED and ACCESS_DENIED (those are for /audit page)
    query = db.query(AuditLog).filter(
        ~AuditLog.event_type.in_(['ACCESS_GRANTED', 'ACCESS_DENIED'])
    )
    
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    logs = query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()
    return logs

@router.delete("/logs/purge")
async def purge_old_logs(
    days: int = 365,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Purge audit logs older than specified days - Super Administrator only."""
    if current_user.role != "builtin_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    deleted_count = db.query(AuditLog).filter(
        AuditLog.timestamp < cutoff_date
    ).delete()
    
    db.commit()
    
    # Log the purge action
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Purged {deleted_count} audit logs older than {days} days",
        resource="Audit Logs",
        resource_type="system",
        result="success",
        event_type="SYSTEM_AUDIT_PURGE",
        outcome="SUCCESS"
    )
    db.add(audit_log)
    db.commit()
    
    return {"purged": deleted_count, "cutoff_date": cutoff_date}

@router.get("/export")
async def export_audit_logs(
    format: str = Query("json", description="Export format: json, csv"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export audit logs in specified format."""
    query = db.query(AuditLog)
    
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    logs = query.order_by(desc(AuditLog.timestamp)).all()
    
    return {
        "logs": logs,
        "exported_at": datetime.utcnow(),
        "format": format,
        "total_records": len(logs)
    }
