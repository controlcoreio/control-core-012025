from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User, AuditLog, GitHubConfiguration, OPALConfiguration, Policy, ProtectedResource
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


# GITHUB CONFIG ENDPOINTS (Frontend compatibility)
# These endpoints provide the same functionality as /github endpoints
# but match the frontend's expected paths

@router.get("/github-config")
async def get_github_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get GitHub configuration (frontend compatibility endpoint)."""
    config = db.query(GitHubConfiguration).first()
    
    if not config:
        return {
            "configured": False,
            "repo_url": "",
            "branch": "main",
            "connection_status": "disconnected",
            "note": "No GitHub configuration found"
        }
    
    return {
        "configured": True,
        "repo_url": config.repo_url,
        "branch": config.branch,
        "auto_sync": config.auto_sync,
        "sync_interval": config.sync_interval,
        "connection_status": config.connection_status,
        "last_sync_time": config.last_sync_time.isoformat() if config.last_sync_time else None,
        "webhook_url": config.webhook_url,
        # Don't expose sensitive fields in plain text
        "access_token": "***" if config.access_token else "",
        "webhook_secret": "***" if config.webhook_secret else ""
    }


class GitHubConfigRequest(BaseModel):
    repo_url: str
    branch: str = "main"
    access_token: str
    auto_sync: bool = True
    sync_interval: int = 5
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    connection_status: Optional[str] = None


@router.put("/github-config")
async def update_github_config(
    config: GitHubConfigRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update GitHub configuration (frontend compatibility endpoint)."""
    from datetime import datetime
    
    # Check if configuration exists
    existing_config = db.query(GitHubConfiguration).first()
    
    if existing_config:
        # Update existing configuration
        existing_config.repo_url = config.repo_url
        existing_config.branch = config.branch
        if config.access_token and config.access_token != "***":
            existing_config.access_token = config.access_token
        existing_config.auto_sync = config.auto_sync
        existing_config.sync_interval = config.sync_interval
        if config.webhook_url:
            existing_config.webhook_url = config.webhook_url
        if config.webhook_secret and config.webhook_secret != "***":
            existing_config.webhook_secret = config.webhook_secret
        if config.connection_status:
            existing_config.connection_status = config.connection_status
        existing_config.updated_at = datetime.utcnow()
        
        logger.info(f"Updated GitHub configuration: {config.repo_url}")
    else:
        # Create new configuration
        new_config = GitHubConfiguration(
            repo_url=config.repo_url,
            branch=config.branch,
            access_token=config.access_token,
            auto_sync=config.auto_sync,
            sync_interval=config.sync_interval,
            webhook_url=config.webhook_url,
            webhook_secret=config.webhook_secret,
            connection_status=config.connection_status or "connected"
        )
        db.add(new_config)
        
        logger.info(f"Created GitHub configuration: {config.repo_url}")
    
    # Also update user's github_repo field for backward compatibility
    current_user.github_repo = config.repo_url
    
    db.commit()
    
    # Log configuration save
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Updated GitHub repository configuration: {config.repo_url}",
        resource="github_configuration",
        resource_type="system",
        result="success",
        event_type="GITHUB_CONFIGURED",
        outcome="SUCCESS",
        environment="both",
        reason=f"GitHub repository configured for policy storage"
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "success": True,
        "message": "GitHub configuration saved successfully",
        "repo_url": config.repo_url,
        "branch": config.branch,
        "connection_status": config.connection_status or "connected",
        "persisted": True
    }


class GitHubTestRequest(BaseModel):
    repo_url: str
    branch: str = "main"
    access_token: str


@router.post("/github-config/test")
async def test_github_connection(
    test_config: GitHubTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test GitHub connection before saving."""
    try:
        # Import GitHub library
        from github import Github, GithubException
        
        # Validate inputs
        if not test_config.repo_url or not test_config.access_token:
            return {
                "success": False,
                "error": "Repository URL and access token are required"
            }
        
        # Initialize GitHub client
        github_client = Github(test_config.access_token)
        
        # Extract owner and repo from URL
        # Expected formats:
        # - https://github.com/owner/repo
        # - https://github.com/owner/repo.git
        repo_url = test_config.repo_url.replace('https://github.com/', '').replace('.git', '').strip('/')
        
        # Test connection by getting repo info
        repo = github_client.get_repo(repo_url)
        
        # Test branch access
        try:
            branch = repo.get_branch(test_config.branch)
            branch_exists = True
        except GithubException as e:
            if e.status == 404:
                branch_exists = False
            else:
                raise
        
        # Get user info to verify token
        user = github_client.get_user()
        
        logger.info(f"GitHub connection test successful for {repo_url} by {current_user.username}")
        
        return {
            "success": True,
            "message": f"Successfully connected to {repo.full_name}",
            "details": {
                "repo_name": repo.full_name,
                "repo_private": repo.private,
                "branch_exists": branch_exists,
                "branch_name": test_config.branch,
                "authenticated_user": user.login,
                "has_write_access": repo.permissions.push
            }
        }
        
    except GithubException as e:
        error_msg = "GitHub API error"
        if e.status == 401:
            error_msg = "Authentication failed. Please check your access token."
        elif e.status == 404:
            error_msg = "Repository not found. Please check the URL and your access permissions."
        elif e.status == 403:
            error_msg = "Access forbidden. Your token may not have sufficient permissions."
        else:
            error_msg = f"GitHub API error: {str(e)}"
        
        logger.warning(f"GitHub connection test failed for {test_config.repo_url}: {error_msg}")
        
        return {
            "success": False,
            "error": error_msg
        }
        
    except Exception as e:
        error_msg = f"Connection test failed: {str(e)}"
        logger.error(f"GitHub connection test error: {error_msg}")
        
        return {
            "success": False,
            "error": error_msg
        }


@router.post("/github-config/sync")
async def sync_github_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger synchronization of policies with GitHub repository.
    
    This endpoint:
    1. Validates folder structure integrity
    2. Detects unauthorized changes made directly to GitHub
    3. Syncs all policies (drafts, sandbox, production) to GitHub
    4. Reports issues via audit logs
    """
    from datetime import datetime
    from app.services.github_service import GitHubService
    
    try:
        # Get GitHub configuration
        config = db.query(GitHubConfiguration).first()
        
        if not config:
            return {
                "success": False,
                "error": "GitHub is not configured. Please configure GitHub settings first."
            }
        
        if config.connection_status != 'connected':
            return {
                "success": False,
                "error": "GitHub is not connected. Please test and save the connection first."
            }
        
        # Initialize GitHub service
        github_service = GitHubService(db)
        
        if not github_service.is_configured():
            return {
                "success": False,
                "error": "GitHub service initialization failed. Check your access token and repository URL."
            }
        
        # Step 1: Validate folder structure
        logger.info("Validating GitHub folder structure...")
        folder_validation = github_service.validate_folder_structure()
        
        warnings = []
        security_alerts = []
        
        if not folder_validation.get("valid"):
            # Try to create missing folders
            if "missing_folders" in folder_validation and folder_validation["missing_folders"]:
                logger.warning(f"Missing folders detected: {folder_validation['missing_folders']}")
                warnings.append(f"Missing folders detected and created: {', '.join(folder_validation['missing_folders'])}")
                
                # Create folder structure
                if github_service.create_folder_structure():
                    logger.info("Successfully created missing folder structure")
                    warnings.append("Folder structure was incomplete and has been repaired")
                else:
                    return {
                        "success": False,
                        "error": "Failed to create required folder structure in GitHub repository"
                    }
        
        # Step 2: Get all policies from database
        from app.models import Policy
        policies = db.query(Policy).filter(
            Policy.rego_code.isnot(None),  # Only sync policies with Rego code
            Policy.status != 'archived'     # Don't sync archived policies
        ).all()
        
        policy_ids = [p.id for p in policies]
        
        # Step 3: Detect unauthorized changes
        logger.info("Checking for unauthorized changes in GitHub...")
        unauthorized_check = github_service.detect_unauthorized_changes(policy_ids)
        
        if unauthorized_check.get("has_unauthorized_changes"):
            unauthorized_files = unauthorized_check.get("unauthorized_files", [])
            security_alerts.append(f"⚠️ Detected {len(unauthorized_files)} unauthorized file(s) in GitHub repository")
            
            # Log detailed security audit for each unauthorized file
            for unauth_file in unauthorized_files:
                audit_log = AuditLog(
                    user_id=current_user.id,
                    user=current_user.username,
                    action=f"Unauthorized GitHub change detected: {unauth_file['name']}",
                    resource="github_repository",
                    resource_type="security",
                    result="warning",
                    event_type="CONFIG_CHANGE",
                    outcome="WARNING",
                    environment="both",
                    reason=f"Unauthorized file detected in {unauth_file['folder']}: {unauth_file['reason']}"
                )
                db.add(audit_log)
            
            db.commit()
            logger.warning(f"Unauthorized changes detected: {unauthorized_check['message']}")
        
        # Step 4: Sync all policies to GitHub
        synced_count = 0
        failed_count = 0
        synced_by_environment = {
            "draft": 0,
            "sandbox": 0,
            "production": 0
        }
        
        for policy in policies:
            try:
                # Determine folder based on policy status and environment
                if policy.status == "draft":
                    folder = "policies/drafts"
                    env_key = "draft"
                elif policy.environment == "sandbox":
                    folder = f"policies/sandbox/{'enabled' if policy.status == 'enabled' else 'disabled'}"
                    env_key = "sandbox"
                elif policy.environment == "production":
                    folder = f"policies/production/{'enabled' if policy.status == 'enabled' else 'disabled'}"
                    env_key = "production"
                else:
                    # Default fallback
                    folder = "policies/drafts"
                    env_key = "draft"
                
                # Sync policy to GitHub
                success = github_service.save_policy_to_github(
                    policy_id=policy.id,
                    rego_code=policy.rego_code,
                    folder=folder,
                    policy_name=policy.name
                )
                
                if success:
                    synced_count += 1
                    synced_by_environment[env_key] += 1
                else:
                    failed_count += 1
                    
            except Exception as e:
                logger.error(f"Failed to sync policy {policy.id}: {e}")
                failed_count += 1
        
        # Update last sync time in configuration
        config.last_sync_time = datetime.utcnow()
        db.commit()
        
        # Log sync action with details
        sync_status = "success" if failed_count == 0 else "partial"
        audit_log = AuditLog(
            user_id=current_user.id,
            user=current_user.username,
            action=f"Manual GitHub sync: {synced_count} synced, {failed_count} failed",
            resource="github_sync",
            resource_type="system",
            result=sync_status,
            event_type="CONFIG_CHANGE",
            outcome="SUCCESS" if failed_count == 0 else "PARTIAL",
            environment="both",
            reason=f"Manual sync: {synced_by_environment['draft']} drafts, {synced_by_environment['sandbox']} sandbox, {synced_by_environment['production']} production"
        )
        db.add(audit_log)
        db.commit()
        
        logger.info(f"GitHub sync completed: {synced_count} synced, {failed_count} failed")
        
        return {
            "success": True,
            "message": f"Synchronized {synced_count} policies to GitHub",
            "synced_count": synced_count,
            "failed_count": failed_count,
            "total_policies": len(policies),
            "synced_by_environment": synced_by_environment,
            "last_sync_time": config.last_sync_time.isoformat() if config.last_sync_time else None,
            "warnings": warnings,
            "security_alerts": security_alerts,
            "unauthorized_files": unauthorized_check.get("unauthorized_files", []) if unauthorized_check.get("has_unauthorized_changes") else [],
            "folder_validation": {
                "valid": folder_validation.get("valid", False),
                "missing_folders": folder_validation.get("missing_folders", [])
            }
        }
        
    except Exception as e:
        error_msg = f"Sync failed: {str(e)}"
        logger.error(error_msg)
        
        # Log error to audit log
        audit_log = AuditLog(
            user_id=current_user.id,
            user=current_user.username,
            action=f"GitHub sync failed",
            resource="github_sync",
            resource_type="system",
            result="error",
            event_type="CONFIG_CHANGE",
            outcome="FAILURE",
            environment="both",
            reason=error_msg
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "success": False,
            "error": error_msg
        }


@router.get("/github-config/tamper-check")
async def check_github_tampering(
    resource_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Detect unauthorized modifications to policy files in GitHub.
    
    SOC2 Security Control: Ensures policies are only modified through Control Plane.
    
    Args:
        resource_id: Optional - check specific resource, or all if not provided
        
    Returns:
        Tamper detection results with unauthorized files
    """
    from app.services.github_validator import get_github_validator_from_db
    
    github_validator = get_github_validator_from_db(db)
    
    if not github_validator:
        return {
            "configured": False,
            "error": "GitHub not configured"
        }
    
    # Get resources to check
    if resource_id:
        resources = [db.query(ProtectedResource).get(resource_id)]
        if not resources[0]:
            raise HTTPException(404, "Resource not found")
    else:
        resources = db.query(ProtectedResource).all()
    
    all_unauthorized_files = []
    resources_checked = 0
    
    for resource in resources:
        if not resource:
            continue
        
        # Get all policy IDs for this resource
        policies = db.query(Policy).filter(
            Policy.resource_id == resource.id
        ).all()
        known_policy_ids = {p.id for p in policies}
        
        # Check for unauthorized files
        result = github_validator.detect_unauthorized_files(
            resource_name=resource.name,
            known_policy_ids=known_policy_ids
        )
        
        if result.get("has_unauthorized_files"):
            for file in result.get("unauthorized_files", []):
                file["resource_name"] = resource.name
                all_unauthorized_files.append(file)
                
                # Log each unauthorized file to audit trail
                audit_log = AuditLog(
                    user_id=current_user.id,
                    user=current_user.username,
                    action=f"Tamper detected: {file['name']} in {file['folder']}",
                    resource="github_repository",
                    resource_type="security",
                    result="warning",
                    event_type="CONFIG_CHANGE",
                    outcome="WARNING",
                    environment="both",
                    reason=f"Unauthorized file: {file['reason']} (Severity: {file['severity']})"
                )
                db.add(audit_log)
        
        resources_checked += 1
    
    db.commit()
    
    # Summary
    has_violations = len(all_unauthorized_files) > 0
    
    logger.info(f"Tamper check completed: {resources_checked} resources checked, {len(all_unauthorized_files)} violations")
    
    return {
        "has_violations": has_violations,
        "resources_checked": resources_checked,
        "total_unauthorized_files": len(all_unauthorized_files),
        "unauthorized_files": all_unauthorized_files,
        "severity_summary": {
            "critical": sum(1 for f in all_unauthorized_files if f.get("severity") == "CRITICAL"),
            "high": sum(1 for f in all_unauthorized_files if f.get("severity") == "HIGH"),
            "medium": sum(1 for f in all_unauthorized_files if f.get("severity") == "MEDIUM")
        },
        "message": f"Found {len(all_unauthorized_files)} unauthorized file(s)" 
                  if has_violations 
                  else "No unauthorized files detected"
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
