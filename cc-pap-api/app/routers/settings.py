from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User, AuditLog, GitHubConfiguration, OPALConfiguration
from app.routers.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])


# Request/Response models
class EnvironmentSettings(BaseModel):
    sandbox_api_key: Optional[str] = None
    production_api_key: Optional[str] = None
    # Note: GitHub repo is universal setting in Controls Repository
    # Uses folder structure: policies/sandbox/ and policies/production/


class EnvironmentConfigResponse(BaseModel):
    environment: str
    api_key_configured: bool
    github_repo: Optional[str]
    opal_server_url: Optional[str]


@router.get("/environments", response_model=Dict[str, EnvironmentConfigResponse])
async def get_environment_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get environment-specific settings for sandbox and production."""
    # Get GitHub configuration (universal for both environments)
    github_config = db.query(GitHubConfiguration).first()
    github_repo = github_config.repo_url if github_config else current_user.github_repo
    
    sandbox_config = {
        "environment": "sandbox",
        "api_key_configured": bool(current_user.api_key_sandbox),
        "github_repo": github_repo,  # Same repo, uses policies/sandbox/ folder
        "opal_server_url": None
    }
    
    production_config = {
        "environment": "production",
        "api_key_configured": bool(current_user.api_key_production),
        "github_repo": github_repo,  # Same repo, uses policies/production/ folder
        "opal_server_url": None
    }
    
    return {
        "sandbox": sandbox_config,
        "production": production_config
    }


@router.put("/environments")
async def update_environment_settings(
    settings: EnvironmentSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update environment-specific settings (API keys only - GitHub is in Controls Repository)."""
    # Update sandbox API key
    if settings.sandbox_api_key is not None:
        current_user.api_key_sandbox = settings.sandbox_api_key
    
    # Update production API key
    if settings.production_api_key is not None:
        current_user.api_key_production = settings.production_api_key
    
    db.commit()
    db.refresh(current_user)
    
    # Log settings update
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action="Updated environment API keys",
        resource="environment_settings",
        resource_type="system",
        result="success",
        event_type="SETTINGS_UPDATED",
        outcome="SUCCESS",
        environment="both",
        reason="Environment API keys updated"
    )
    db.add(audit_log)
    db.commit()
    
    logger.info(f"Environment API keys updated by {current_user.username}")
    
    return {
        "message": "Environment API keys updated successfully",
        "sandbox_configured": bool(current_user.api_key_sandbox),
        "production_configured": bool(current_user.api_key_production)
    }


@router.get("/environments/{environment}")
async def get_environment_config(
    environment: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get configuration for a specific environment."""
    if environment not in ["sandbox", "production"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid environment. Use 'sandbox' or 'production'"
        )
    
    if environment == "sandbox":
        return {
            "environment": "sandbox",
            "api_key_configured": bool(current_user.api_key_sandbox),
            "github_repo": current_user.github_repo_sandbox or current_user.github_repo,
            "deployment_model": current_user.deployment_model,
            "subscription_tier": current_user.subscription_tier
        }
    else:  # production
        return {
            "environment": "production",
            "api_key_configured": bool(current_user.api_key_production),
            "github_repo": current_user.github_repo_production or current_user.github_repo,
            "deployment_model": current_user.deployment_model,
            "subscription_tier": current_user.subscription_tier
        }


@router.post("/environments/{environment}/api-key")
async def generate_environment_api_key(
    environment: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a new API key for a specific environment."""
    import secrets
    
    if environment not in ["sandbox", "production"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid environment. Use 'sandbox' or 'production'"
        )
    
    # Generate new API key with environment prefix (like Stripe)
    prefix = "sk_test_" if environment == "sandbox" else "sk_live_"
    api_key = f"{prefix}{secrets.token_urlsafe(32)}"
    
    # Update the appropriate API key
    if environment == "sandbox":
        current_user.api_key_sandbox = api_key
    else:
        current_user.api_key_production = api_key
    
    db.commit()
    
    # Log API key generation
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Generated new {environment} API key",
        resource=f"{environment}_api_key",
        resource_type="system",
        result="success",
        event_type="API_KEY_GENERATED",
        outcome="SUCCESS",
        environment=environment,
        reason=f"New API key generated for {environment} environment"
    )
    db.add(audit_log)
    db.commit()
    
    logger.info(f"New {environment} API key generated for {current_user.username}")
    
    return {
        "message": f"New {environment} API key generated",
        "api_key": api_key,
        "environment": environment
    }


@router.get("/github")
async def get_github_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get GitHub configuration for policy storage (universal repo with folder structure)."""
    config = db.query(GitHubConfiguration).first()
    
    if not config:
        return {
            "configured": False,
            "repo_url": current_user.github_repo,
            "note": "Single repo used for both environments via folder structure"
        }
    
    return {
        "configured": True,
        "repo_url": config.repo_url,
        "branch": config.branch,
        "auto_sync": config.auto_sync,
        "sync_interval": config.sync_interval,
        "connection_status": config.connection_status,
        "last_sync_time": config.last_sync_time,
        "folder_structure": {
            "sandbox": "policies/sandbox/",
            "production": "policies/production/"
        },
        "note": "Single repo with intelligent folder routing per environment"
    }


@router.post("/github")
async def save_github_configuration(
    repo_url: str,
    branch: str = "main",
    access_token: str = None,
    auto_sync: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save GitHub configuration to database for persistence."""
    from datetime import datetime
    
    # Check if configuration exists
    existing_config = db.query(GitHubConfiguration).first()
    
    if existing_config:
        # Update existing configuration
        existing_config.repo_url = repo_url
        existing_config.branch = branch
        if access_token:
            existing_config.access_token = access_token  # Should be encrypted in production
        existing_config.auto_sync = auto_sync
        existing_config.updated_at = datetime.utcnow()
        
        logger.info(f"Updated GitHub configuration: {repo_url}")
    else:
        # Create new configuration
        new_config = GitHubConfiguration(
            repo_url=repo_url,
            branch=branch,
            access_token=access_token or "",  # Should be encrypted in production
            auto_sync=auto_sync,
            connection_status="connected"
        )
        db.add(new_config)
        
        logger.info(f"Created GitHub configuration: {repo_url}")
    
    # Also update user's github_repo field for backward compatibility
    current_user.github_repo = repo_url
    
    db.commit()
    
    # Log configuration save
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Configured GitHub repository: {repo_url}",
        resource="github_configuration",
        resource_type="system",
        result="success",
        event_type="GITHUB_CONFIGURED",
        outcome="SUCCESS",
        environment="both",
        reason=f"GitHub repository configured with folder structure for dual environments"
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "message": "GitHub configuration saved successfully",
        "repo_url": repo_url,
        "branch": branch,
        "auto_sync": auto_sync,
        "folder_structure": {
            "sandbox": "policies/sandbox/",
            "production": "policies/production/"
        },
        "persisted": True
    }


@router.get("/opal")
async def get_opal_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get OPAL configuration."""
    config = db.query(OPALConfiguration).first()
    
    if not config:
        return {
            "configured": False
        }
    
    return {
        "configured": True,
        "server_url": config.server_url,
        "client_url": config.client_url,
        "broadcast_channel": config.broadcast_channel,
        "data_update_interval": config.data_update_interval,
        "enable_statistics": config.enable_statistics,
        "connection_status": config.connection_status
    }
