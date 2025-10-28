from typing import Dict, Any
import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Policy, AuditLog
from app.schemas import DecisionRequest, DecisionResponse, EventType, Outcome
from app.routers.auth import get_current_user, is_builtin_admin

router = APIRouter(prefix="/decisions", tags=["decisions"])

@router.post("/evaluate", response_model=DecisionResponse)
async def evaluate_decision(
    decision_request: DecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Evaluate an access decision based on policies and context."""
    start_time = time.time()
    
    # RBAC Bypass for System Administrator
    # System administrators have unlimited access and bypass all policy checks
    if is_builtin_admin(current_user):
        decision = "PERMIT"
        reason = "System administrator - bypasses all RBAC checks"
        policy_name = "SYSTEM_ADMIN_BYPASS"
        
        evaluation_time = (time.time() - start_time) * 1000
        
        # Log the decision
        audit_log = AuditLog(
            user=current_user.username,
            action=decision_request.action,
            resource=decision_request.resource,
            result="success",
            event_type=EventType.ACCESS_GRANTED,
            outcome=Outcome.PERMIT,
            policy_name=policy_name,
            reason=reason,
            source_ip="127.0.0.1"
        )
        
        db.add(audit_log)
        db.commit()
        
        return DecisionResponse(
            decision=decision,
            reason=reason,
            policy_name=policy_name,
            evaluation_time_ms=evaluation_time
        )
    
    # Get applicable policies for regular users
    policies = db.query(Policy).filter(
        Policy.status == "enabled",
        Policy.resource_id == decision_request.resource
    ).all()
    
    decision = "DENY"  # Default deny
    reason = "No applicable policies found"
    policy_name = None
    
    # Simple policy evaluation logic
    for policy in policies:
        if policy.effect == "allow":
            if current_user.role in policy.scope or "all" in policy.scope:
                decision = "PERMIT"
                reason = f"Policy {policy.name} allows access"
                policy_name = policy.name
                break
        elif policy.effect == "deny":
            if current_user.role in policy.scope or "all" in policy.scope:
                decision = "DENY"
                reason = f"Policy {policy.name} denies access"
                policy_name = policy.name
                break
    
    evaluation_time = (time.time() - start_time) * 1000
    
    # Log the decision
    audit_log = AuditLog(
        user=current_user.username,
        action=decision_request.action,
        resource=decision_request.resource,
        result="success" if decision == "PERMIT" else "failure",
        event_type=EventType.ACCESS_GRANTED if decision == "PERMIT" else EventType.ACCESS_DENIED,
        outcome=Outcome.PERMIT if decision == "PERMIT" else Outcome.DENY,
        policy_name=policy_name,
        reason=reason,
        source_ip="127.0.0.1"
    )
    
    db.add(audit_log)
    db.commit()
    
    return DecisionResponse(
        decision=decision,
        reason=reason,
        policy_name=policy_name,
        evaluation_time=evaluation_time
    )
