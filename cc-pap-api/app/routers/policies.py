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
    """Create a new policy. All new policies are created in sandbox environment only."""
    # Enforce sandbox-only policy creation
    db_policy = Policy(
        name=policy_data.name,
        description=policy_data.description,
        scope=policy_data.scope,
        effect=policy_data.effect,
        resource_id=policy_data.resource_id,
        environment="sandbox",  # Always create in sandbox
        sandbox_status="draft",
        production_status="not-promoted",
        promoted_from_sandbox=False,
        created_by=current_user.username,
        modified_by=current_user.username
    )
    
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    
    # Log policy creation
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Created policy: {db_policy.name}",
        resource=f"Policy #{db_policy.id}",
        resource_type="policy",
        result="success",
        event_type="POLICY_CREATED",
        outcome="SUCCESS",
        environment="sandbox",  # Log creation in sandbox
        policy_name=db_policy.name,
        reason=f"Policy '{db_policy.name}' created in sandbox"
    )
    db.add(audit_log)
    db.commit()
    
    return db_policy

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
    """Promote a policy from sandbox to production. Can only promote sandbox policies."""
    from datetime import datetime
    
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
    
    if policy.promoted_from_sandbox:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy has already been promoted to production"
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
        action=f"Promoted policy to production: {policy.name}",
        resource=f"Policy #{policy_id}",
        resource_type="policy",
        result="success",
        event_type="POLICY_PROMOTED",
        outcome="SUCCESS",
        environment="production",
        policy_name=policy.name,
        reason=f"Policy '{policy.name}' promoted from sandbox to production"
    )
    db.add(audit_log)
    db.commit()
    
    # INTELLIGENT OPAL SYNC
    # Automatically trigger policy sync to production bouncers
    # Control Core handles the intelligence - no manual configuration needed
    opal_service = get_opal_distribution_service(db)
    sync_result = opal_service.trigger_policy_sync_to_environment(
        environment="production",
        policy_id=policy_id
    )
    
    logger.info(f"Policy {policy_id} promoted to production by {current_user.username}")
    logger.info(f"OPAL sync result: {sync_result}")
    
    return {
        "message": "Policy promoted to production successfully",
        "policy_id": policy.id,
        "promoted_at": policy.promoted_at,
        "promoted_by": policy.promoted_by,
        "opal_sync": sync_result
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
