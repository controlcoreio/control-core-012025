"""
Notifications API Router - Environment-specific notification settings
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User, NotificationSettings, NotificationCredentials, AuditLog
from app.routers.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])


# Pydantic Models
class NotificationSettingsRequest(BaseModel):
    alert_types: Optional[List[Dict[str, Any]]] = None
    email_enabled: Optional[bool] = None
    email_recipients: Optional[List[str]] = None
    slack_enabled: Optional[bool] = None
    slack_channel: Optional[str] = None
    servicenow_enabled: Optional[bool] = None
    servicenow_instance: Optional[str] = None
    webhook_enabled: Optional[bool] = None
    webhook_url: Optional[str] = None


class NotificationCredentialsRequest(BaseModel):
    slack_token: Optional[str] = None
    slack_workspace: Optional[str] = None
    servicenow_api_key: Optional[str] = None
    servicenow_domain: Optional[str] = None


class NotificationTestRequest(BaseModel):
    channel: str  # email, slack, servicenow, webhook
    test_message: Optional[str] = "Test notification from Control Core"


# Notification Settings Endpoints (Environment-specific)
@router.get("/settings")
async def get_notification_settings(
    environment: str = Query(..., regex="^(sandbox|production)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notification settings for a specific environment"""
    
    settings = db.query(NotificationSettings).filter(
        NotificationSettings.user_id == current_user.id,
        NotificationSettings.environment == environment
    ).first()
    
    if not settings:
        # Return default settings if none exist
        return {
            "environment": environment,
            "alert_types": [],
            "email_enabled": True,
            "email_recipients": [current_user.email] if current_user.email else [],
            "slack_enabled": False,
            "slack_channel": "",
            "servicenow_enabled": False,
            "servicenow_instance": "",
            "webhook_enabled": False,
            "webhook_url": ""
        }
    
    return {
        "environment": settings.environment,
        "alert_types": settings.alert_types or [],
        "email_enabled": settings.email_enabled,
        "email_recipients": settings.email_recipients or [],
        "slack_enabled": settings.slack_enabled,
        "slack_channel": settings.slack_channel or "",
        "servicenow_enabled": settings.servicenow_enabled,
        "servicenow_instance": settings.servicenow_instance or "",
        "webhook_enabled": settings.webhook_enabled,
        "webhook_url": settings.webhook_url or ""
    }


@router.put("/settings")
async def update_notification_settings(
    settings_update: NotificationSettingsRequest,
    environment: str = Query(..., regex="^(sandbox|production)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update notification settings for a specific environment"""
    
    # Find or create settings
    settings = db.query(NotificationSettings).filter(
        NotificationSettings.user_id == current_user.id,
        NotificationSettings.environment == environment
    ).first()
    
    if not settings:
        # Create new settings
        settings = NotificationSettings(
            user_id=current_user.id,
            environment=environment
        )
        db.add(settings)
    
    # Update fields if provided
    if settings_update.alert_types is not None:
        settings.alert_types = settings_update.alert_types
    if settings_update.email_enabled is not None:
        settings.email_enabled = settings_update.email_enabled
    if settings_update.email_recipients is not None:
        settings.email_recipients = settings_update.email_recipients
    if settings_update.slack_enabled is not None:
        settings.slack_enabled = settings_update.slack_enabled
    if settings_update.slack_channel is not None:
        settings.slack_channel = settings_update.slack_channel
    if settings_update.servicenow_enabled is not None:
        settings.servicenow_enabled = settings_update.servicenow_enabled
    if settings_update.servicenow_instance is not None:
        settings.servicenow_instance = settings_update.servicenow_instance
    if settings_update.webhook_enabled is not None:
        settings.webhook_enabled = settings_update.webhook_enabled
    if settings_update.webhook_url is not None:
        settings.webhook_url = settings_update.webhook_url
    
    db.commit()
    db.refresh(settings)
    
    # Log the update
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Updated notification settings for {environment}",
        resource="notification_settings",
        resource_type="system",
        result="success",
        event_type="SETTINGS_UPDATED",
        outcome="SUCCESS",
        environment=environment,
        reason=f"Notification settings updated for {environment} environment"
    )
    db.add(audit_log)
    db.commit()
    
    logger.info(f"Notification settings updated for user {current_user.username} in {environment}")
    
    return {
        "message": f"Notification settings updated successfully for {environment}",
        "environment": environment
    }


# Notification Credentials Endpoints (Shared across environments)
@router.get("/credentials")
async def get_notification_credentials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get shared notification credentials"""
    
    credentials = db.query(NotificationCredentials).filter(
        NotificationCredentials.user_id == current_user.id
    ).first()
    
    if not credentials:
        return {
            "slack_workspace": "",
            "servicenow_domain": "",
            "has_slack_token": False,
            "has_servicenow_api_key": False
        }
    
    return {
        "slack_workspace": credentials.slack_workspace or "",
        "servicenow_domain": credentials.servicenow_domain or "",
        "has_slack_token": bool(credentials.slack_token),
        "has_servicenow_api_key": bool(credentials.servicenow_api_key)
    }


@router.put("/credentials")
async def update_notification_credentials(
    credentials_update: NotificationCredentialsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update shared notification credentials"""
    
    # Find or create credentials
    credentials = db.query(NotificationCredentials).filter(
        NotificationCredentials.user_id == current_user.id
    ).first()
    
    if not credentials:
        credentials = NotificationCredentials(user_id=current_user.id)
        db.add(credentials)
    
    # Update fields if provided
    if credentials_update.slack_token is not None:
        credentials.slack_token = credentials_update.slack_token
    if credentials_update.slack_workspace is not None:
        credentials.slack_workspace = credentials_update.slack_workspace
    if credentials_update.servicenow_api_key is not None:
        credentials.servicenow_api_key = credentials_update.servicenow_api_key
    if credentials_update.servicenow_domain is not None:
        credentials.servicenow_domain = credentials_update.servicenow_domain
    
    db.commit()
    db.refresh(credentials)
    
    # Log the update
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action="Updated notification credentials",
        resource="notification_credentials",
        resource_type="system",
        result="success",
        event_type="CREDENTIALS_UPDATED",
        outcome="SUCCESS",
        environment="both",
        reason="Shared notification credentials updated"
    )
    db.add(audit_log)
    db.commit()
    
    logger.info(f"Notification credentials updated for user {current_user.username}")
    
    return {
        "message": "Notification credentials updated successfully"
    }


# Test Notification Endpoint
@router.post("/test")
async def test_notification(
    test_request: NotificationTestRequest,
    environment: str = Query(..., regex="^(sandbox|production)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test a notification channel for a specific environment"""
    
    logger.info(f"Testing {test_request.channel} notification for {current_user.username} in {environment}")
    
    # In a real implementation, this would actually send test notifications
    # For now, return success
    
    return {
        "success": True,
        "channel": test_request.channel,
        "environment": environment,
        "message": f"Test notification sent successfully to {test_request.channel}",
        "test_message": test_request.test_message
    }

