from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ProtectedResource, User, AuditLog
from app.schemas import ProtectedResourceCreate, ProtectedResourceUpdate, ProtectedResourceResponse, ResourceEnrichmentRequest
from app.routers.auth import get_current_user

router = APIRouter(prefix="/resources", tags=["resources"])

@router.get("/", response_model=List[ProtectedResourceResponse])
async def get_resources(
    skip: int = 0,
    limit: int = 100,
    environment: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all protected resources, optionally filtered by environment."""
    query = db.query(ProtectedResource)
    
    # Filter by environment if specified
    # Resources inherit environment from the bouncer that protects them
    if environment:
        from app.models import PEP
        # Get bouncers for this environment
        env_bouncer_ids = db.query(PEP.id).filter(PEP.environment == environment).all()
        bouncer_ids = [b[0] for b in env_bouncer_ids]
        
        # Filter resources by bouncer environment
        if bouncer_ids:
            query = query.filter(
                (ProtectedResource.bouncer_id.in_(bouncer_ids)) |
                (ProtectedResource.environment == environment)
            )
        else:
            # No bouncers for this environment yet, filter by resource environment field
            query = query.filter(ProtectedResource.environment == environment)
    
    resources = query.offset(skip).limit(limit).all()
    return resources

@router.get("/{resource_id}", response_model=ProtectedResourceResponse)
async def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific protected resource by ID."""
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    return resource

@router.post("/", response_model=ProtectedResourceResponse)
async def create_resource(
    resource_data: ProtectedResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new protected resource."""
    db_resource = ProtectedResource(
        name=resource_data.name,
        url=resource_data.url,
        original_host=resource_data.original_host,
        original_host_production=resource_data.original_host_production,
        default_security_posture=resource_data.default_security_posture,
        description=resource_data.description
    )
    
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    
    # Log resource creation
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Created protected resource: {db_resource.name}",
        resource=f"Resource #{db_resource.id}",
        resource_type="resource",
        result="success",
        event_type="RESOURCE_CREATED",
        outcome="SUCCESS",
        environment=db_resource.environment or "sandbox"
    )
    db.add(audit_log)
    db.commit()
    
    return db_resource

@router.put("/{resource_id}", response_model=ProtectedResourceResponse)
async def update_resource(
    resource_id: int,
    resource_data: ProtectedResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing protected resource."""
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Update fields if provided
    update_data = resource_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resource, field, value)
    
    db.commit()
    db.refresh(resource)
    
    # Log resource update
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Updated protected resource: {resource.name}",
        resource=f"Resource #{resource_id}",
        resource_type="resource",
        result="success",
        event_type="RESOURCE_UPDATED",
        outcome="SUCCESS",
        environment=resource.environment or "sandbox"
    )
    db.add(audit_log)
    db.commit()
    
    return resource

@router.put("/{resource_id}/enrich")
async def enrich_resource(
    resource_id: int,
    enrichment: ResourceEnrichmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enrich auto-discovered resource with metadata."""
    resource = db.query(ProtectedResource).filter(
        ProtectedResource.id == resource_id
    ).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Update enrichment fields
    for field, value in enrichment.dict(exclude_none=True).items():
        setattr(resource, field, value)
    
    db.commit()
    db.refresh(resource)
    
    # Log enrichment
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Enriched protected resource: {resource.name}",
        resource=f"Resource #{resource_id}",
        resource_type="resource",
        result="success",
        event_type="RESOURCE_UPDATED",
        outcome="SUCCESS",
        environment=resource.environment or "sandbox"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Resource enriched successfully", "resource": resource}

@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a protected resource."""
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    resource_name = resource.name
    resource_environment = resource.environment or "sandbox"
    db.delete(resource)
    db.commit()
    
    # Log resource deletion
    audit_log = AuditLog(
        user_id=current_user.id,
        user=current_user.username,
        action=f"Deleted protected resource: {resource_name}",
        resource=f"Resource #{resource_id}",
        resource_type="resource",
        result="success",
        event_type="RESOURCE_DELETED",
        outcome="SUCCESS",
        environment=resource_environment
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Resource deleted successfully"}

@router.post("/{resource_id}/test")
async def test_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test connectivity to a protected resource."""
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Simulate connectivity test
    return {
        "resource_id": resource_id,
        "name": resource.name,
        "url": resource.url,
        "status": "connected",
        "response_time": 45.2,
        "last_tested": "2024-01-15T10:30:00Z",
        "security_posture": resource.default_security_posture
    }

@router.post("/{resource_id}/protect")
async def protect_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enable protection for a resource using The Bouncer."""
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Simulate protection setup
    return {
        "resource_id": resource_id,
        "name": resource.name,
        "protection_status": "enabled",
        "bouncer_url": f"https://bouncer-{resource_id}.controlcore.io",
        "original_url": resource.url,
        "protected_url": f"https://bouncer-{resource_id}.controlcore.io{resource.url}",
        "policies_applied": 4,
        "protection_enabled_at": "2024-01-15T10:30:00Z"
    }


@router.get("/{resource_id}/schema")
async def get_resource_schema(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get resource schema and metadata for intelligent policy creation"""
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # In production, this would be learned/discovered from the resource
    # For now, return intelligent defaults based on resource type
    
    # Determine resource type from URL
    resource_type = "api"  # Default
    if "database" in resource.url.lower():
        resource_type = "database"
    elif "chatbot" in resource.url.lower() or "ai" in resource.url.lower():
        resource_type = "ai_service"
    elif "admin" in resource.url.lower():
        resource_type = "admin_panel"
    
    # Build schema based on type
    schema = {
        "resource_type": resource_type,
        "resource_id": resource.id,
        "resource_name": resource.name,
        "resource_url": resource.url,
        "available_actions": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "endpoints": [],
        "authentication_required": True,
        "data_classification": "sensitive",
        "learned_attributes": []
    }
    
    # Add type-specific metadata
    if resource_type == "api":
        schema["endpoints"] = ["/users", "/data", "/settings", "/admin"]
        schema["data_classification"] = "sensitive"
    elif resource_type == "ai_service":
        schema["endpoints"] = ["/chat", "/generate", "/analyze"]
        schema["data_classification"] = "highly_sensitive"
        schema["learned_attributes"] = [
            {"name": "prompt_content", "type": "string"},
            {"name": "model_id", "type": "string"},
            {"name": "conversation_id", "type": "string"}
        ]
    elif resource_type == "admin_panel":
        schema["endpoints"] = ["/dashboard", "/users", "/settings", "/audit"]
        schema["data_classification"] = "critical"
        schema["available_actions"] = ["GET", "POST", "PUT", "DELETE"]
    elif resource_type == "database":
        schema["available_actions"] = ["SELECT", "INSERT", "UPDATE", "DELETE"]
        schema["data_classification"] = "critical"
    
    return schema


@router.get("/{resource_id}/smart-suggestions")
async def get_smart_suggestions(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get smart policy suggestions based on resource type and classification"""
    resource = db.query(ProtectedResource).filter(ProtectedResource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Determine resource type
    resource_type = "api"
    if "database" in resource.url.lower():
        resource_type = "database"
    elif "chatbot" in resource.url.lower() or "ai" in resource.url.lower():
        resource_type = "ai_service"
    elif "admin" in resource.url.lower():
        resource_type = "admin_panel"
    
    suggestions = []
    
    # Time-based suggestions for sensitive resources
    if resource_type in ["admin_panel", "database", "ai_service"]:
        suggestions.append({
            "type": "condition",
            "priority": "high",
            "title": "Add time-based restriction",
            "description": "Restrict access to business hours for sensitive operations",
            "reason": f"{resource_type} operations should be time-restricted for audit and security",
            "implementation": {
                "attribute": "time.hour",
                "operator": "greater_than",
                "value": "8"
            }
        })
        suggestions.append({
            "type": "condition",
            "priority": "high",
            "title": "Restrict after-hours access",
            "description": "Prevent access during late night hours",
            "reason": "Reduce risk of unauthorized access during off-hours",
            "implementation": {
                "attribute": "time.hour",
                "operator": "less_than",
                "value": "22"
            }
        })
    
    # Authentication suggestions
    suggestions.append({
        "type": "attribute",
        "priority": "high",
        "title": "Verify user authentication",
        "description": "Ensure users are authenticated before granting access",
        "reason": "Authentication is critical for protected resources",
        "implementation": {
            "name": "user.authenticated"
        }
    })
    
    # Role-based access suggestions
    if resource_type == "admin_panel":
        suggestions.append({
            "type": "condition",
            "priority": "high",
            "title": "Require admin role",
            "description": "Only allow administrators to access admin panel",
            "reason": "Admin panels should only be accessible to administrators",
            "implementation": {
                "attribute": "user.role",
                "operator": "in",
                "value": "admin,superadmin"
            }
        })
        suggestions.append({
            "type": "effect",
            "priority": "high",
            "title": "Deny by default",
            "description": "Use deny effect for admin resources",
            "reason": "Admin resources are highly sensitive and should be deny-by-default",
            "implementation": {
                "effect": "deny"
            }
        })
    
    # AI service specific suggestions
    if resource_type == "ai_service":
        suggestions.append({
            "type": "condition",
            "priority": "medium",
            "title": "Monitor prompt content",
            "description": "Log all prompts sent to AI services",
            "reason": "AI interactions should be logged for compliance and audit",
            "implementation": {
                "attribute": "prompt.content",
                "operator": "not_equals",
                "value": ""
            }
        })
        suggestions.append({
            "type": "effect",
            "priority": "medium",
            "title": "Enable logging mode",
            "description": "Use log effect to monitor AI usage",
            "reason": "Track AI usage patterns without blocking access",
            "implementation": {
                "effect": "log"
            }
        })
        suggestions.append({
            "type": "compliance",
            "priority": "high",
            "title": "Data privacy compliance",
            "description": "Consider masking PII in AI responses",
            "reason": "AI services may expose sensitive data in responses",
            "implementation": {
                "effect": "mask"
            }
        })
    
    # Database specific suggestions
    if resource_type == "database":
        suggestions.append({
            "type": "condition",
            "priority": "high",
            "title": "Restrict destructive operations",
            "description": "Limit DELETE and DROP operations to specific users",
            "reason": "Prevent accidental data loss",
            "implementation": {
                "attribute": "action",
                "operator": "not_in",
                "value": "DELETE,DROP"
            }
        })
        suggestions.append({
            "type": "attribute",
            "priority": "high",
            "title": "Require clearance level",
            "description": "Check user clearance level for database access",
            "reason": "Database access requires proper authorization levels",
            "implementation": {
                "name": "user.clearance_level"
            }
        })
    
    # Geographic restrictions for all sensitive resources
    if resource_type in ["admin_panel", "database"]:
        suggestions.append({
            "type": "condition",
            "priority": "medium",
            "title": "Geographic restriction",
            "description": "Limit access to specific geographic regions",
            "reason": "Reduce attack surface by limiting geographic access",
            "implementation": {
                "attribute": "location.country",
                "operator": "in",
                "value": "US,CA,GB"
            }
        })
    
    # General security suggestions
    suggestions.append({
        "type": "condition",
        "priority": "medium",
        "title": "MFA verification",
        "description": "Require multi-factor authentication for access",
        "reason": "MFA significantly reduces unauthorized access risk",
        "implementation": {
            "attribute": "user.mfa_verified",
            "operator": "equals",
            "value": "true"
        }
    })
    
    return {
        "resource_id": resource.id,
        "resource_name": resource.name,
        "resource_type": resource_type,
        "suggestions": suggestions
    }
