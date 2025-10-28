"""
Context Ingestion API endpoints for Control Core PAP Pro Tenant
Provides advanced context generation and ingestion capabilities for multi-tenant environments
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import json
import uuid
from datetime import datetime

from app.database import get_db
from app.models import Tenant, TenantBouncerConnection, TenantBouncerCertificate, TenantBouncerMetrics
from app.schemas import TenantResponse

router = APIRouter()

# Pydantic models for context ingestion
class ContextSourceRequest(BaseModel):
    id: str
    name: str
    type: str  # api, database, file, stream
    url: str
    auth_type: str  # none, basic, bearer, oauth2
    credentials: Optional[Dict[str, Any]] = {}
    permissions: List[str] = []
    rate_limit: int = 100
    timeout: int = 30
    enabled: bool = True
    description: Optional[str] = None
    tenant_id: str

class ContextRuleRequest(BaseModel):
    id: str
    name: str
    description: str
    source: str
    target: str
    conditions: Dict[str, Any]
    transform: Dict[str, Any]
    permissions: List[str]
    priority: int = 1
    enabled: bool = True
    tenant_id: str

class SecurityPolicyRequest(BaseModel):
    id: str
    name: str
    description: str
    rules: List[Dict[str, Any]]
    permissions: List[str]
    priority: int = 1
    enabled: bool = True
    tenant_id: str

class ContextConfigurationRequest(BaseModel):
    tenant_id: str
    enabled: bool = True
    max_context_size: int = 1024 * 1024  # 1MB
    timeout_seconds: int = 30
    allowed_sources: List[str] = ["api", "database", "file", "stream"]
    permission_levels: Dict[str, str] = {
        "admin": "full",
        "developer": "limited",
        "analyst": "read_only",
        "viewer": "view_only"
    }
    data_sources: List[ContextSourceRequest] = []
    ingestion_rules: List[ContextRuleRequest] = []
    security_policies: List[SecurityPolicyRequest] = []

class ContextGenerationRequest(BaseModel):
    tenant_id: str
    template_id: str
    user_id: str
    resource_id: str
    context_sources: List[ContextSourceRequest]
    context_rules: List[ContextRuleRequest]
    security_policies: List[SecurityPolicyRequest]
    custom_config: Optional[Dict[str, Any]] = {}

class ContextTestRequest(BaseModel):
    tenant_id: str
    user: Dict[str, Any]
    resource: Dict[str, Any]
    action: Dict[str, Any]
    context: Dict[str, Any]
    sources: List[str]
    permissions: List[str]

class ContextTestResponse(BaseModel):
    success: bool
    enriched_context: Dict[str, Any]
    sources_used: List[Dict[str, Any]]
    security_level: str
    processing_time: float
    errors: List[str] = []

@router.get("/tenants/{tenant_id}/context/sources", response_model=List[Dict[str, Any]])
async def get_tenant_context_sources(tenant_id: str, db: Session = Depends(get_db)):
    """Get context sources for a specific tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Get tenant's context sources from configuration
        context_config = tenant.context_configuration or {}
        sources = context_config.get("data_sources", [])
        
        return sources
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve context sources: {str(e)}"
        )

@router.post("/tenants/{tenant_id}/context/sources", response_model=Dict[str, Any])
async def create_tenant_context_source(
    tenant_id: str,
    source: ContextSourceRequest,
    db: Session = Depends(get_db)
):
    """Create a new context source for a tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Update tenant's context configuration
        context_config = tenant.context_configuration or {}
        data_sources = context_config.get("data_sources", [])
        
        # Add new source
        source_data = source.dict()
        source_data["created_at"] = datetime.now().isoformat()
        data_sources.append(source_data)
        
        context_config["data_sources"] = data_sources
        tenant.context_configuration = context_config
        tenant.updated_at = datetime.now()
        
        db.commit()
        db.refresh(tenant)
        
        return {
            "message": "Context source created successfully",
            "source": source_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create context source: {str(e)}"
        )

@router.get("/tenants/{tenant_id}/context/rules", response_model=List[Dict[str, Any]])
async def get_tenant_context_rules(tenant_id: str, db: Session = Depends(get_db)):
    """Get context rules for a specific tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Get tenant's context rules from configuration
        context_config = tenant.context_configuration or {}
        rules = context_config.get("ingestion_rules", [])
        
        return rules
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve context rules: {str(e)}"
        )

@router.post("/tenants/{tenant_id}/context/rules", response_model=Dict[str, Any])
async def create_tenant_context_rule(
    tenant_id: str,
    rule: ContextRuleRequest,
    db: Session = Depends(get_db)
):
    """Create a new context rule for a tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Update tenant's context configuration
        context_config = tenant.context_configuration or {}
        ingestion_rules = context_config.get("ingestion_rules", [])
        
        # Add new rule
        rule_data = rule.dict()
        rule_data["created_at"] = datetime.now().isoformat()
        ingestion_rules.append(rule_data)
        
        context_config["ingestion_rules"] = ingestion_rules
        tenant.context_configuration = context_config
        tenant.updated_at = datetime.now()
        
        db.commit()
        db.refresh(tenant)
        
        return {
            "message": "Context rule created successfully",
            "rule": rule_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create context rule: {str(e)}"
        )

@router.get("/tenants/{tenant_id}/context/security-policies", response_model=List[Dict[str, Any]])
async def get_tenant_security_policies(tenant_id: str, db: Session = Depends(get_db)):
    """Get security policies for a specific tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Get tenant's security policies from configuration
        context_config = tenant.context_configuration or {}
        policies = context_config.get("security_policies", [])
        
        return policies
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve security policies: {str(e)}"
        )

@router.post("/tenants/{tenant_id}/context/security-policies", response_model=Dict[str, Any])
async def create_tenant_security_policy(
    tenant_id: str,
    policy: SecurityPolicyRequest,
    db: Session = Depends(get_db)
):
    """Create a new security policy for a tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Update tenant's context configuration
        context_config = tenant.context_configuration or {}
        security_policies = context_config.get("security_policies", [])
        
        # Add new policy
        policy_data = policy.dict()
        policy_data["created_at"] = datetime.now().isoformat()
        security_policies.append(policy_data)
        
        context_config["security_policies"] = security_policies
        tenant.context_configuration = context_config
        tenant.updated_at = datetime.now()
        
        db.commit()
        db.refresh(tenant)
        
        return {
            "message": "Security policy created successfully",
            "policy": policy_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create security policy: {str(e)}"
        )

@router.get("/tenants/{tenant_id}/context/config", response_model=Dict[str, Any])
async def get_tenant_context_config(tenant_id: str, db: Session = Depends(get_db)):
    """Get context configuration for a specific tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Get tenant's context configuration
        context_config = tenant.context_configuration or {}
        
        # Return default configuration if none exists
        if not context_config:
            context_config = {
                "enabled": True,
                "max_context_size": 1024 * 1024,  # 1MB
                "timeout_seconds": 30,
                "allowed_sources": ["api", "database", "file", "stream"],
                "permission_levels": {
                    "admin": "full",
                    "developer": "limited",
                    "analyst": "read_only",
                    "viewer": "view_only"
                },
                "data_sources": [],
                "ingestion_rules": [],
                "security_policies": []
            }
        
        return context_config
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve context configuration: {str(e)}"
        )

@router.put("/tenants/{tenant_id}/context/config", response_model=Dict[str, Any])
async def update_tenant_context_config(
    tenant_id: str,
    config: ContextConfigurationRequest,
    db: Session = Depends(get_db)
):
    """Update context configuration for a specific tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Update tenant's context configuration
        context_config = config.dict()
        context_config["updated_at"] = datetime.now().isoformat()
        
        tenant.context_configuration = context_config
        tenant.updated_at = datetime.now()
        
        db.commit()
        db.refresh(tenant)
        
        return {
            "message": "Context configuration updated successfully",
            "config": context_config
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update context configuration: {str(e)}"
        )

@router.post("/tenants/{tenant_id}/context/generate", response_model=Dict[str, Any])
async def generate_tenant_context_aware_policy(
    tenant_id: str,
    request: ContextGenerationRequest,
    db: Session = Depends(get_db)
):
    """Generate a context-aware policy for a tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Generate context-aware policy based on template and configuration
        policy_id = str(uuid.uuid4())
        
        # Create Rego policy with context awareness
        rego_policy = f"""package controlcore.policy

import rego.v1

# Context-aware policy for tenant {tenant_id}
# Generated from template: {request.template_id}

default allow := false

# Main authorization decision with context
allow if {{
    # User has required permissions
    user_has_permissions(input.user)
    
    # Resource access is allowed
    resource_access_allowed(input.resource)
    
    # Action is permitted
    action_permitted(input.action)
    
    # Context conditions are met
    context_conditions_met(input.context)
    
    # Tenant-specific conditions
    tenant_conditions_met(input.tenant_id)
}}

# User permission check
user_has_permissions(user) if {{
    user.roles[_] in ["admin", "developer", "analyst"]
    user.tenant_id == "{tenant_id}"
}}

# Resource access check
resource_access_allowed(resource) if {{
    resource.type in ["ai_agent", "llm", "rag", "api"]
    resource.tenant_id == "{tenant_id}"
}}

# Action permission check
action_permitted(action) if {{
    action.name in ["generate", "analyze", "retrieve", "query", "execute"]
    action.type in ["read", "write", "execute"]
}}

# Context conditions check
context_conditions_met(context) if {{
    # Context ingestion is enabled
    context.ingestion_enabled == true
    
    # Security level is appropriate
    context.security_level in ["admin", "developer", "analyst"]
    
    # Context sources are available
    count(context.sources) > 0
    
    # Context data is valid
    context_data_valid(context)
}}

# Tenant-specific conditions
tenant_conditions_met(tenant_id) if {{
    tenant_id == "{tenant_id}"
}}

# Context data validation
context_data_valid(context) if {{
    # User context is present
    context.user_context.available == true
    
    # Security context is appropriate
    context.security_context.available == true
    
    # Resource context is available
    context.resource_context.available == true
}}

# Content injection rules
content_injection_rules := {{
    "pre_prompt": [
        {{
            "type": "context_enrichment",
            "source": "user_profile",
            "target": "prompt_context",
            "fields": ["user_preferences", "security_clearance", "domain_knowledge"]
        }}
    ],
    "post_response": [
        {{
            "type": "response_filtering",
            "source": "compliance_rules",
            "target": "filtered_response",
            "fields": ["sensitive_data", "pii", "confidential_information"]
        }}
    ]
}}

# Security policies
security_policies := {{
    "data_masking": [
        {{
            "field": "password",
            "action": "mask",
            "pattern": "***"
        }}
    ],
    "content_filtering": [
        {{
            "field": "response",
            "action": "filter",
            "rules": ["no_pii", "no_sensitive_data", "no_malicious_content"]
        }}
    ]
}}
"""
        
        # Update tenant's context configuration with new policy
        context_config = tenant.context_configuration or {}
        context_config["generated_policies"] = context_config.get("generated_policies", [])
        context_config["generated_policies"].append({
            "policy_id": policy_id,
            "template_id": request.template_id,
            "rego_policy": rego_policy,
            "created_at": datetime.now().isoformat(),
            "context_sources_count": len(request.context_sources),
            "context_rules_count": len(request.context_rules),
            "security_policies_count": len(request.security_policies)
        })
        
        tenant.context_configuration = context_config
        tenant.updated_at = datetime.now()
        
        db.commit()
        db.refresh(tenant)
        
        return {
            "policy_id": policy_id,
            "rego_policy": rego_policy,
            "template_used": request.template_id,
            "generated_at": datetime.now().isoformat(),
            "context_sources_count": len(request.context_sources),
            "context_rules_count": len(request.context_rules),
            "security_policies_count": len(request.security_policies)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate context-aware policy: {str(e)}"
        )

@router.post("/tenants/{tenant_id}/context/test", response_model=ContextTestResponse)
async def test_tenant_context_generation(
    tenant_id: str,
    request: ContextTestRequest,
    db: Session = Depends(get_db)
):
    """Test context generation for a tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        import time
        start_time = time.time()
        
        # Simulate context ingestion for tenant
        enriched_context = {
            "user_context": {
                "profile": request.user.get("profile", {}),
                "permissions": request.user.get("permissions", []),
                "security_clearance": request.user.get("security_clearance", "standard"),
                "tenant_id": tenant_id
            },
            "resource_context": {
                "type": request.resource.get("type", "unknown"),
                "classification": request.resource.get("classification", "public"),
                "owner": request.resource.get("owner", "system"),
                "tenant_id": tenant_id
            },
            "action_context": {
                "name": request.action.get("name", "unknown"),
                "type": request.action.get("type", "read"),
                "permissions_required": request.action.get("permissions_required", [])
            },
            "environmental_context": {
                "time": datetime.now().isoformat(),
                "location": request.context.get("location", "unknown"),
                "device": request.context.get("device", "unknown"),
                "network": request.context.get("network", "internal"),
                "tenant_id": tenant_id
            }
        }
        
        # Simulate source processing
        sources_used = []
        for source in request.sources:
            sources_used.append({
                "id": source,
                "name": f"{source.title()} Source",
                "type": "api",
                "data": {"sample": "data"},
                "permissions": request.permissions,
                "security": {"level": "standard"},
                "tenant_id": tenant_id
            })
        
        # Determine security level based on tenant configuration
        user_roles = request.user.get("roles", [])
        if "admin" in user_roles:
            security_level = "admin"
        elif "developer" in user_roles:
            security_level = "developer"
        elif "analyst" in user_roles:
            security_level = "analyst"
        else:
            security_level = "viewer"
        
        processing_time = time.time() - start_time
        
        return ContextTestResponse(
            success=True,
            enriched_context=enriched_context,
            sources_used=sources_used,
            security_level=security_level,
            processing_time=processing_time,
            errors=[]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return ContextTestResponse(
            success=False,
            enriched_context={},
            sources_used=[],
            security_level="error",
            processing_time=0.0,
            errors=[str(e)]
        )

@router.get("/tenants/{tenant_id}/context/templates", response_model=List[Dict[str, Any]])
async def get_tenant_context_templates(tenant_id: str, db: Session = Depends(get_db)):
    """Get available context templates for a tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Return context templates available for the tenant
        templates = [
            {
                "template_id": "ai-context-template",
                "name": "AI Agent Context-Aware Policy",
                "description": "Advanced policy template for AI agents with context ingestion",
                "category": "ai_agent",
                "context_sources": [
                    "user-profile-api",
                    "security-context-db",
                    "ai-model-metadata",
                    "conversation-history"
                ],
                "context_rules": [
                    "user-context-enrichment",
                    "security-context-enrichment",
                    "ai-model-context",
                    "conversation-context"
                ],
                "security_policies": [
                    "sensitive-data-protection",
                    "ai-context-filtering"
                ],
                "tenant_id": tenant_id
            },
            {
                "template_id": "llm-context-template",
                "name": "LLM Context-Aware Policy",
                "description": "Advanced policy template for LLM services with prompt context",
                "category": "llm",
                "context_sources": [
                    "prompt-context-api",
                    "knowledge-base",
                    "compliance-rules",
                    "response-templates"
                ],
                "context_rules": [
                    "prompt-enrichment",
                    "knowledge-enrichment",
                    "compliance-context",
                    "response-template-context"
                ],
                "security_policies": [
                    "content-filtering",
                    "response-sanitization"
                ],
                "tenant_id": tenant_id
            },
            {
                "template_id": "rag-context-template",
                "name": "RAG System Context-Aware Policy",
                "description": "Advanced policy template for RAG systems with document context",
                "category": "rag",
                "context_sources": [
                    "document-vector-db",
                    "document-metadata-api",
                    "user-access-context",
                    "retrieval-history"
                ],
                "context_rules": [
                    "document-context-enrichment",
                    "user-access-context",
                    "retrieval-history-context"
                ],
                "security_policies": [
                    "document-access-control",
                    "content-filtering-rag"
                ],
                "tenant_id": tenant_id
            }
        ]
        
        return templates
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve context templates: {str(e)}"
        )

@router.get("/tenants/{tenant_id}/context/metrics", response_model=Dict[str, Any])
async def get_tenant_context_metrics(tenant_id: str, db: Session = Depends(get_db)):
    """Get context ingestion metrics for a tenant"""
    try:
        # Verify tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
        
        # Get tenant's context configuration
        context_config = tenant.context_configuration or {}
        
        # Calculate metrics
        data_sources_count = len(context_config.get("data_sources", []))
        ingestion_rules_count = len(context_config.get("ingestion_rules", []))
        security_policies_count = len(context_config.get("security_policies", []))
        generated_policies_count = len(context_config.get("generated_policies", []))
        
        return {
            "tenant_id": tenant_id,
            "context_enabled": context_config.get("enabled", False),
            "data_sources_count": data_sources_count,
            "ingestion_rules_count": ingestion_rules_count,
            "security_policies_count": security_policies_count,
            "generated_policies_count": generated_policies_count,
            "last_updated": tenant.updated_at.isoformat() if tenant.updated_at else None,
            "metrics": {
                "context_ingestion_requests": 0,  # Would be tracked in production
                "context_cache_hit_ratio": 0.85,  # Would be calculated from actual metrics
                "average_processing_time": 0.15,  # Would be calculated from actual metrics
                "security_violations": 0  # Would be tracked in production
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve context metrics: {str(e)}"
        )
