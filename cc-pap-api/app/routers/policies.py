from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Policy, User, AuditLog
from app.schemas import PolicyCreate, PolicyUpdate, PolicyResponse, UserResponse, EventType, Outcome
from app.routers.auth import get_current_user
from app.services.regal_linter import get_regal_linter
from app.services.production_regal_linter import get_production_regal_linter
from app.services.opal_distribution import get_opal_distribution_service
from app.middleware.rate_limiter import rate_limit
from app.middleware.security import InputValidator, get_audit_logger
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/policies", tags=["policies"])


# Request/Response models for new endpoints
class RegoValidationRequest(BaseModel):
    code: str


class PolicyDraftCreate(BaseModel):
    name: str
    description: str
    resource_id: str
    bouncer_id: str
    rego_code: str
    effect: str
    status: str = "draft"
    folder: str = "drafts"

@router.get("/", response_model=List[PolicyResponse])
async def get_policies(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    environment: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all policies with optional filtering by environment."""
    query = db.query(Policy)
    
    if status:
        query = query.filter(Policy.status == status)
    
    # Filter by environment - show policies created in or promoted to that environment
    if environment == "sandbox":
        query = query.filter(
            (Policy.environment == "sandbox") | 
            (Policy.environment == "both")
        )
    elif environment == "production":
        query = query.filter(
            (Policy.environment == "production") | 
            (Policy.environment == "both") |
            (Policy.promoted_from_sandbox == True)
        )
    
    policies = query.offset(skip).limit(limit).all()
    return policies

@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific policy by ID."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    return policy

@router.post("/", response_model=PolicyResponse)
async def create_policy(
    policy_data: PolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new policy. All new policies are created in sandbox environment only.
    
    REQUIRES: resource_id (which resource this policy protects)
    COMMITS TO: policies/{resource-name}/sandbox/draft/policy_{id}.rego in GitHub
    """
    from app.services.github_writer import get_github_writer_for_bouncer
    
    # 1. Validate resource_id is provided
    if not policy_data.resource_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="resource_id is required - must select a resource for this policy"
        )
    
    # 2. Validate resource exists and has bouncer
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == policy_data.resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    if not resource.bouncer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resource has no bouncer deployed - cannot create policy"
        )
    
    # 3. Save policy to database (always starts as sandbox draft)
    db_policy = Policy(
        name=policy_data.name,
        description=policy_data.description,
        scope=policy_data.scope,
        effect=policy_data.effect,
        resource_id=resource.id,
        resource_name=resource.name,  # Denormalize for convenience
        environment="sandbox",  # Always create in sandbox
        sandbox_status="draft",
        production_status="not-promoted",
        promoted_from_sandbox=False,
        rego_code=policy_data.rego_code or "",
        created_by=current_user.username,
        modified_by=current_user.username
    )
    
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    
    # 4. Commit .rego file to GitHub
    folder_path = f"policies/{resource.name}/sandbox/draft"
    github_writer = get_github_writer_for_bouncer(resource.bouncer_id, db)
    
    if github_writer:
        # Generate rego code if not provided
        rego_code = db_policy.rego_code or generate_basic_rego(db_policy)
        
        result = github_writer.commit_policy(
            policy_id=db_policy.id,
            rego_code=rego_code,
            folder_path=folder_path,
            commit_message=f"Create draft policy: {db_policy.name}",
            policy_name=db_policy.name
        )
        
        if not result["success"]:
            # GitHub commit failed - log warning but don't fail policy creation
            logger.warning(f"GitHub commit failed for policy {db_policy.id}: {result.get('error')}")
            # Still continue - policy exists in DB, can commit to GitHub later
    else:
        logger.warning(f"GitHub not configured for bouncer {resource.bouncer_id}")
    
    # 5. Log policy creation
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Created policy for {resource.name}",
        resource=f"Policy #{db_policy.id}",
        resource_type="policy",
        result="success",
        event_type="POLICY_CREATED",
        outcome="SUCCESS",
        environment="sandbox",
        policy_name=db_policy.name,
        reason=f"Policy '{db_policy.name}' created in sandbox draft for {resource.name}"
    )
    db.add(audit_log)
    db.commit()
    
    logger.info(f"Policy {db_policy.id} created for resource {resource.name} - committed to {folder_path}")
    
    return db_policy


def generate_basic_rego(policy: Policy) -> str:
    """Generate basic Rego code from policy data."""
    return f"""package controlcore.policies.policy_{policy.id}

import future.keywords.if
import future.keywords.in

default {policy.effect} = false

{policy.effect} if {{
    # Policy: {policy.name}
    # Resource: {policy.resource_name}
    # Environment: {policy.environment}
    
    # Add your policy rules here
    true
}}
"""

@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: int,
    policy_data: PolicyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing policy."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    # Update fields if provided
    update_data = policy_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(policy, field, value)
    
    policy.modified_by = current_user.username
    
    db.commit()
    db.refresh(policy)
    
    # Log policy modification
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Updated policy: {policy.name}",
        resource=f"Policy #{policy_id}",
        resource_type="policy",
        result="success",
        event_type="POLICY_UPDATED",
        outcome="SUCCESS",
        policy_name=policy.name,
        reason=f"Policy '{policy.name}' modified successfully"
    )
    db.add(audit_log)
    db.commit()
    
    return policy

@router.delete("/{policy_id}")
async def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a policy."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    policy_name = policy.name
    db.delete(policy)
    db.commit()
    
    # Log policy deletion
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Deleted policy: {policy_name}",
        resource=f"Policy #{policy_id}",
        resource_type="policy",
        result="success",
        event_type="POLICY_DELETED",
        outcome="SUCCESS",
        policy_name=policy_name,
        reason=f"Policy '{policy_name}' deleted successfully"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Policy deleted successfully"}

@router.post("/{policy_id}/promote")
async def promote_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Promote a policy from sandbox to production.
    
    COPIES: policies/{resource}/sandbox/enabled/ → policies/{resource}/production/enabled/
    Bouncer's OPAL will detect change and load policy in production environment.
    """
    from datetime import datetime
    from app.services.github_writer import get_github_writer_for_bouncer
    
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    # Only allow promotion from sandbox to production
    if policy.environment != "sandbox":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only promote policies from sandbox environment"
        )
    
    # Get resource for folder path
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == policy.resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated resource not found"
        )
    
    if policy.promoted_from_sandbox:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy has already been promoted to production"
        )
    
    # Commit .rego file to production folder in GitHub
    production_folder_path = f"policies/{resource.name}/production/enabled"
    github_writer = get_github_writer_for_bouncer(resource.bouncer_id, db)
    
    if not github_writer:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub not configured for this bouncer"
        )
    
    # Generate rego code if not in policy
    rego_code = policy.rego_code or generate_basic_rego(policy)
    
    # Write to production folder (OPAL in production bouncer will detect this)
    result = github_writer.commit_policy(
        policy_id=policy.id,
        rego_code=rego_code,
        folder_path=production_folder_path,
        commit_message=f"Promote to production: {policy.name}",
        policy_name=policy.name
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to commit to GitHub: {result.get('error')}"
        )
    
    # Mark policy as promoted and available in both environments
    policy.environment = "both"  # Now available in both sandbox and production
    policy.production_status = "enabled"
    policy.sandbox_status = "enabled"
    policy.promoted_from_sandbox = True
    policy.promoted_at = datetime.utcnow()
    policy.promoted_by = current_user.username
    policy.modified_by = current_user.username
    
    db.commit()
    db.refresh(policy)
    
    # Log policy promotion
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Promoted policy to production: {policy.name} (Resource: {resource.name})",
        resource=f"Policy #{policy_id}",
        resource_type="policy",
        result="success",
        event_type="POLICY_PROMOTED",
        outcome="SUCCESS",
        environment="production",
        policy_name=policy.name,
        reason=f"Policy '{policy.name}' promoted to production - committed to {production_folder_path}"
    )
    db.add(audit_log)
    db.commit()
    
    logger.info(f"Policy {policy_id} promoted to production by {current_user.username} - committed to {production_folder_path}")
    logger.info(f"Production bouncer's OPAL will detect change and load policy")
    
    return {
        "message": "Policy promoted to production successfully",
        "policy_id": policy.id,
        "promoted_at": policy.promoted_at,
        "promoted_by": policy.promoted_by,
        "github_path": f"{production_folder_path}/policy_{policy.id}.rego",
        "commit_sha": result.get("commit_sha")
    }

@router.post("/{policy_id}/enable")
async def enable_policy_in_sandbox(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enable a draft policy in sandbox.
    
    MOVES: policies/{resource}/sandbox/draft/ → policies/{resource}/sandbox/enabled/
    Bouncer's OPAL will detect change and load policy into OPA.
    """
    from datetime import datetime
    from app.services.github_writer import get_github_writer_for_bouncer
    
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    if policy.sandbox_status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft policies can be enabled"
        )
    
    if policy.environment != "sandbox":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy must be in sandbox to enable"
        )
    
    # Get resource for folder path
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == policy.resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated resource not found"
        )
    
    # Get GitHub writer
    github_writer = get_github_writer_for_bouncer(resource.bouncer_id, db)
    if not github_writer:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub not configured for this bouncer"
        )
    
    # Move file in GitHub: draft → enabled
    from_folder = f"policies/{resource.name}/sandbox/draft"
    to_folder = f"policies/{resource.name}/sandbox/enabled"
    
    result = github_writer.move_policy(
        policy_id=policy.id,
        from_folder=from_folder,
        to_folder=to_folder,
        commit_message=f"Enable policy in sandbox: {policy.name}"
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enable policy in GitHub: {result.get('error')}"
        )
    
    # Update database
    policy.sandbox_status = "enabled"
    policy.status = "enabled"  # Update main status field too
    policy.modified_by = current_user.username
    db.commit()
    db.refresh(policy)
    
    # Log policy enablement
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Enabled policy in sandbox: {policy.name} (Resource: {resource.name})",
        resource=f"Policy #{policy_id}",
        resource_type="policy",
        result="success",
        event_type="POLICY_ENABLED",
        outcome="SUCCESS",
        environment="sandbox",
        policy_name=policy.name,
        reason=f"Policy '{policy.name}' enabled in sandbox - moved to {to_folder}"
    )
    db.add(audit_log)
    db.commit()
    
    logger.info(f"Policy {policy_id} enabled in sandbox - moved from {from_folder} to {to_folder}")
    
    return {
        "success": True,
        "message": "Policy enabled in sandbox",
        "policy_id": policy.id,
        "github_path": f"{to_folder}/policy_{policy.id}.rego"
    }


@router.post("/{policy_id}/disable")
async def disable_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Disable an enabled policy.
    
    MOVES: policies/{resource}/{environment}/enabled/ → policies/{resource}/{environment}/disabled/
    Bouncer's OPAL will detect change and unload policy from OPA.
    """
    from datetime import datetime
    from app.services.github_writer import get_github_writer_for_bouncer
    
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    # Check if policy is enabled in either environment
    if policy.sandbox_status != "enabled" and policy.production_status != "enabled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only enabled policies can be disabled"
        )
    
    # Get resource for folder path
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == policy.resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated resource not found"
        )
    
    # Get GitHub writer
    github_writer = get_github_writer_for_bouncer(resource.bouncer_id, db)
    if not github_writer:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub not configured for this bouncer"
        )
    
    # Determine which environment to disable
    # For "both" environment policies, disable in both
    environments_to_disable = []
    if policy.environment == "sandbox" or policy.environment == "both":
        if policy.sandbox_status == "enabled":
            environments_to_disable.append("sandbox")
    if policy.environment == "production" or policy.environment == "both":
        if policy.production_status == "enabled":
            environments_to_disable.append("production")
    
    # Move files in GitHub for each environment
    for env in environments_to_disable:
        from_folder = f"policies/{resource.name}/{env}/enabled"
        to_folder = f"policies/{resource.name}/{env}/disabled"
        
        result = github_writer.move_policy(
            policy_id=policy.id,
            from_folder=from_folder,
            to_folder=to_folder,
            commit_message=f"Disable policy in {env}: {policy.name}"
        )
        
        if not result["success"]:
            logger.error(f"Failed to disable policy {policy_id} in {env}: {result.get('error')}")
            # Continue with other environments
    
    # Update database status
    if "sandbox" in environments_to_disable:
        policy.sandbox_status = "disabled"
    if "production" in environments_to_disable:
        policy.production_status = "disabled"
    
    # Update main status if disabled in all environments
    if policy.sandbox_status == "disabled" and policy.production_status != "enabled":
        policy.status = "disabled"
    
    policy.modified_by = current_user.username
    db.commit()
    db.refresh(policy)
    
    # Log policy disablement
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Disabled policy: {policy.name} (Resource: {resource.name})",
        resource=f"Policy #{policy_id}",
        resource_type="policy",
        result="success",
        event_type="POLICY_DISABLED",
        outcome="SUCCESS",
        environment=",".join(environments_to_disable),
        policy_name=policy.name,
        reason=f"Policy '{policy.name}' disabled in {', '.join(environments_to_disable)}"
    )
    db.add(audit_log)
    db.commit()
    
    logger.info(f"Policy {policy_id} disabled in {', '.join(environments_to_disable)}")
    
    return {
        "success": True,
        "message": f"Policy disabled in {', '.join(environments_to_disable)}",
        "policy_id": policy.id,
        "environments": environments_to_disable
    }


@router.get("/promoted", response_model=List[PolicyResponse])
async def get_promoted_policies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all policies that have been promoted to production."""
    policies = db.query(Policy).filter(
        Policy.promoted_from_sandbox == True
    ).offset(skip).limit(limit).all()
    
    return policies

@router.get("/{policy_id}/versions")
async def get_policy_versions(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get version history for a policy."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    # For now, return current version info
    # In a full implementation, you'd have a separate versions table
    return {
        "policy_id": policy_id,
        "current_version": policy.version,
        "versions": [
            {
                "version": policy.version,
                "created_at": policy.created_at,
                "modified_by": policy.modified_by,
                "status": policy.status
            }
        ]
    }

@router.get("/templates", response_model=List[dict])
@router.get("/templates/", response_model=List[dict])
async def get_policy_templates(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get available policy templates (public endpoint)."""
    from app.models import PolicyTemplate
    
    query = db.query(PolicyTemplate)
    
    if category:
        query = query.filter(PolicyTemplate.category == category)
    
    if subcategory:
        query = query.filter(PolicyTemplate.subcategory == subcategory)
    
    templates = query.all()
    
    return [
        {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "category": template.category,
            "subcategory": template.subcategory,
            "template_content": template.template_content,
            "variables": template.variables,
            "metadata": template.template_metadata or {},
            "template_metadata": template.template_metadata or {},  # Include both for compatibility
            "created_by": template.created_by,
            "created_at": template.created_at
        }
        for template in templates
    ]

@router.post("/validate")
async def validate_policy(
    policy_content: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validate policy syntax and logic."""
    # This would integrate with OPA for policy validation
    # For now, return a mock validation result
    return {
        "valid": True,
        "errors": [],
        "warnings": [],
        "suggestions": [
            "Consider adding more specific conditions",
            "Review resource targeting for better performance"
        ]
    }

@router.get("/analytics/{policy_id}")
async def get_policy_analytics(
    policy_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get analytics for a specific policy."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    # Get audit logs for this policy
    from datetime import datetime, timedelta
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    audit_logs = db.query(AuditLog).filter(
        AuditLog.policy_name == policy.name,
        AuditLog.timestamp >= start_date,
        AuditLog.timestamp <= end_date
    ).all()
    
    total_evaluations = len(audit_logs)
    permitted = len([log for log in audit_logs if log.outcome == Outcome.PERMIT])
    denied = len([log for log in audit_logs if log.outcome == Outcome.DENY])
    
    return {
        "policy_id": policy_id,
        "policy_name": policy.name,
        "period": f"Last {days} days",
        "total_evaluations": total_evaluations,
        "permitted": permitted,
        "denied": denied,
        "permit_rate": round((permitted / total_evaluations * 100) if total_evaluations > 0 else 0, 2),
        "deny_rate": round((denied / total_evaluations * 100) if total_evaluations > 0 else 0, 2),
        "average_response_time": "45.2ms"  # This would be calculated from actual data
    }


@router.post("/validate-rego")
@rate_limit("rego_validation", {"requests": 100, "window": 3600})  # 100 validations per hour
async def validate_rego_code(
    request: RegoValidationRequest,
    current_user: User = Depends(get_current_user)
):
    """Validate Rego code using production-grade Regal linter with caching and monitoring."""
    try:
        # Input validation
        validator = InputValidator()
        sanitized_code = validator.sanitize_input(request.code)
        
        # Use production linter
        linter = get_production_regal_linter()
        result = await linter.validate_rego(sanitized_code, use_cache=True)
        
        # Log validation for audit
        audit_logger = get_audit_logger()
        await audit_logger.log_security_event(
            event_type="rego_validation",
            user_id=current_user.id,
            client_ip="unknown",  # Would be extracted from request
            details={
                "validation_status": result.status.value,
                "violations_count": len(result.violations),
                "execution_time": result.execution_time,
                "cached": result.cached
            },
            severity="info"
        )
        
        return {
            "valid": result.status.value in ["valid"],
            "violations": result.violations,
            "summary": result.summary,
            "execution_time": result.execution_time,
            "cached": result.cached,
            "status": result.status.value,
            "metadata": result.metadata
        }
        
    except Exception as e:
        logger.error(f"Rego validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate Rego code"
        )

@router.post("/format-rego")
@rate_limit("rego_validation", {"requests": 50, "window": 3600})  # 50 formats per hour
async def format_rego_code(
    request: RegoValidationRequest,
    current_user: User = Depends(get_current_user)
):
    """Format Rego code using production-grade Regal formatter."""
    try:
        # Input validation
        validator = InputValidator()
        sanitized_code = validator.sanitize_input(request.code)
        
        # Use production linter for formatting
        linter = get_production_regal_linter()
        success, formatted_code = await linter.format_rego(sanitized_code)
        
        if success:
            return {
                "success": True,
                "formatted_code": formatted_code,
                "original_size": len(request.code),
                "formatted_size": len(formatted_code)
            }
        else:
            return {
                "success": False,
                "error": formatted_code,
                "original_code": request.code
            }
        
    except Exception as e:
        logger.error(f"Rego formatting error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to format Rego code"
        )

@router.get("/rego-linter/health")
async def get_rego_linter_health():
    """Get Regal linter health status and metrics."""
    try:
        linter = get_production_regal_linter()
        health_status = await linter.health_check()
        return health_status
        
    except Exception as e:
        logger.error(f"Regal linter health check error: {e}")
        return {
            "status": "unhealthy",
            "regal_available": False,
            "error": str(e)
        }

@router.get("/rego-linter/metrics")
@rate_limit("rego_validation", {"requests": 10, "window": 3600})  # 10 metrics requests per hour
async def get_rego_linter_metrics():
    """Get detailed Regal linter performance metrics."""
    try:
        linter = get_production_regal_linter()
        metrics = linter.get_metrics()
        return {
            "timestamp": datetime.now().isoformat(),
            "metrics": metrics,
            "version": "1.0.0"
        }
        
    except Exception as e:
        logger.error(f"Regal linter metrics error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get linter metrics"
        )


@router.post("/drafts", response_model=PolicyResponse)
async def save_policy_draft(
    policy_data: PolicyDraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save policy as draft in GitHub drafts/ folder."""
    from app.services.github_service import GitHubService
    
    db_policy = Policy(
        name=policy_data.name,
        description=policy_data.description,
        status="draft",
        scope=[],  # drafts don't have scope yet
        effect=policy_data.effect,
        resource_id=policy_data.resource_id,
        created_by=current_user.username,
        modified_by=current_user.username
    )
    
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    
    # Sync to GitHub drafts/ folder
    try:
        github_service = GitHubService(db)
        if github_service.is_configured():
            success = github_service.save_policy_to_github(
                policy_id=db_policy.id,
                rego_code=policy_data.rego_code,
                folder='drafts',
                policy_name=db_policy.name
            )
            if not success:
                print(f"Warning: Failed to sync policy {db_policy.id} to GitHub")
        else:
            print("Warning: GitHub not configured, policy saved to database only")
    except Exception as e:
        print(f"Error syncing policy {db_policy.id} to GitHub: {e}")
        # Don't fail the request if GitHub sync fails
    
    # Log draft creation
    audit_log = AuditLog(
        user=current_user.username,
        action="create_draft",
        resource=f"policy/{db_policy.id}",
        result="success",
        event_type=EventType.POLICY_CREATED,
        outcome=Outcome.SUCCESS,
        policy_name=db_policy.name,
        reason=f"Policy draft '{db_policy.name}' created successfully"
    )
    db.add(audit_log)
    db.commit()
    
    return db_policy


@router.post("/drafts/{policy_id}/promote")
async def promote_draft_to_sandbox(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Promote draft to sandbox enabled policies."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    if policy.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft policies can be promoted"
        )
    
    # Update policy status
    policy.status = "enabled"
    policy.sandbox_status = "enabled"
    policy.modified_by = current_user.username
    db.commit()
    
    # Move from drafts/ to enabled/ in GitHub
    from app.services.github_service import GitHubService
    try:
        github_service = GitHubService(db)
        if github_service.is_configured():
            success = github_service.move_policy(
                policy_id=policy_id,
                from_folder='drafts',
                to_folder='enabled',
                policy_name=policy.name
            )
            if not success:
                print(f"Warning: Failed to move policy {policy_id} in GitHub")
        else:
            print("Warning: GitHub not configured, policy status updated in database only")
    except Exception as e:
        print(f"Error moving policy {policy_id} in GitHub: {e}")
        # Don't fail the request if GitHub sync fails
    
    # Log draft promotion
    audit_log = AuditLog(
        user=current_user.username,
        action="promote_draft",
        resource=f"policy/{policy_id}",
        result="success",
        event_type=EventType.POLICY_MODIFIED,
        outcome=Outcome.SUCCESS,
        policy_name=policy.name,
        reason=f"Policy '{policy.name}' promoted from draft to sandbox"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Policy promoted to sandbox successfully", "policy": policy}
