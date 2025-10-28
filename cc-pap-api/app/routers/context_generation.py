"""
Context Generation API endpoints for Control Core PAP
Provides advanced context generation and ingestion capabilities
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import json
import uuid
from datetime import datetime

from app.database import get_db
from app.models import Policy, User, ProtectedResource
from app.templates.context_aware_templates import template_manager, ContextAwarePolicyTemplate
from app.schemas import PolicyCreate, PolicyUpdate

router = APIRouter()

# Pydantic models for context generation
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

class SecurityPolicyRequest(BaseModel):
    id: str
    name: str
    description: str
    rules: List[Dict[str, Any]]
    permissions: List[str]
    priority: int = 1
    enabled: bool = True

class ContextGenerationRequest(BaseModel):
    template_id: str
    user_id: str
    resource_id: str
    context_sources: List[ContextSourceRequest]
    context_rules: List[ContextRuleRequest]
    security_policies: List[SecurityPolicyRequest]
    custom_config: Optional[Dict[str, Any]] = {}

class ContextGenerationResponse(BaseModel):
    policy_id: str
    rego_policy: str
    context_config: Dict[str, Any]
    template_used: str
    generated_at: datetime
    context_sources_count: int
    context_rules_count: int
    security_policies_count: int

class ContextTestRequest(BaseModel):
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

@router.get("/templates", response_model=List[Dict[str, Any]])
async def get_context_templates():
    """Get all available context-aware policy templates"""
    try:
        templates = template_manager.get_all_templates()
        return templates
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve templates: {str(e)}"
        )

@router.get("/templates/{template_id}", response_model=Dict[str, Any])
async def get_context_template(template_id: str):
    """Get a specific context-aware policy template"""
    try:
        template = template_manager.get_template(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template {template_id} not found"
            )
        return template.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve template: {str(e)}"
        )

@router.get("/templates/category/{category}", response_model=List[Dict[str, Any]])
async def get_templates_by_category(category: str):
    """Get context templates by category"""
    try:
        templates = template_manager.get_templates_by_category(category)
        return templates
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve templates by category: {str(e)}"
        )

@router.post("/generate", response_model=ContextGenerationResponse)
async def generate_context_aware_policy(
    request: ContextGenerationRequest,
    db: Session = Depends(get_db)
):
    """Generate a context-aware policy from template"""
    try:
        # Get the template
        template = template_manager.get_template(request.template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template {request.template_id} not found"
            )
        
        # Create custom template with user-provided configuration
        custom_template = template_manager.create_custom_template({
            "template_id": f"custom-{request.template_id}-{uuid.uuid4().hex[:8]}",
            "name": f"Custom {template.name}",
            "description": f"Custom context-aware policy based on {template.name}",
            "category": template.category,
            "context_sources": [source.dict() for source in request.context_sources],
            "context_rules": [rule.dict() for rule in request.context_rules],
            "security_policies": [policy.dict() for policy in request.security_policies]
        })
        
        # Generate Rego policy
        rego_policy = template_manager.generate_rego_policy(custom_template)
        
        # Generate context configuration
        context_config = template_manager.generate_context_config(custom_template)
        
        # Create policy in database
        policy_data = PolicyCreate(
            name=f"Context-Aware Policy - {custom_template.name}",
            description=custom_template.description,
            rego_code=rego_policy,
            category=template.category,
            environment="production",
            is_active=True,
            context_config=context_config
        )
        
        # Save policy to database
        policy = Policy(
            id=str(uuid.uuid4()),
            name=policy_data.name,
            description=policy_data.description,
            rego_code=policy_data.rego_code,
            category=policy_data.category,
            environment=policy_data.environment,
            is_active=policy_data.is_active,
            context_config=json.dumps(context_config),
            created_by=request.user_id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(policy)
        db.commit()
        db.refresh(policy)
        
        return ContextGenerationResponse(
            policy_id=policy.id,
            rego_policy=rego_policy,
            context_config=context_config,
            template_used=request.template_id,
            generated_at=datetime.now(),
            context_sources_count=len(request.context_sources),
            context_rules_count=len(request.context_rules),
            security_policies_count=len(request.security_policies)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate context-aware policy: {str(e)}"
        )

@router.post("/test", response_model=ContextTestResponse)
async def test_context_generation(request: ContextTestRequest):
    """Test context generation with sample data"""
    try:
        import time
        start_time = time.time()
        
        # Simulate context ingestion (in real implementation, this would call the Bouncer)
        enriched_context = {
            "user_context": {
                "profile": request.user.get("profile", {}),
                "permissions": request.user.get("permissions", []),
                "security_clearance": request.user.get("security_clearance", "standard")
            },
            "resource_context": {
                "type": request.resource.get("type", "unknown"),
                "classification": request.resource.get("classification", "public"),
                "owner": request.resource.get("owner", "system")
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
                "network": request.context.get("network", "internal")
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
                "security": {"level": "standard"}
            })
        
        # Determine security level
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
        
    except Exception as e:
        return ContextTestResponse(
            success=False,
            enriched_context={},
            sources_used=[],
            security_level="error",
            processing_time=0.0,
            errors=[str(e)]
        )

@router.get("/sources", response_model=List[Dict[str, Any]])
async def get_context_sources():
    """Get available context sources"""
    try:
        # This would typically come from a database or configuration
        sources = [
            {
                "id": "user-profile-api",
                "name": "User Profile API",
                "type": "api",
                "description": "Fetches user profile information",
                "permissions": ["context.source.api", "context.read"],
                "rate_limit": 100,
                "timeout": 30
            },
            {
                "id": "security-context-db",
                "name": "Security Context Database",
                "type": "database",
                "description": "Accesses security context and risk scores",
                "permissions": ["context.source.database", "context.read"],
                "rate_limit": 50,
                "timeout": 15
            },
            {
                "id": "ai-model-metadata",
                "name": "AI Model Metadata",
                "type": "api",
                "description": "Retrieves AI model capabilities and limitations",
                "permissions": ["context.source.api", "context.read"],
                "rate_limit": 200,
                "timeout": 20
            },
            {
                "id": "conversation-history",
                "name": "Conversation History",
                "type": "stream",
                "description": "Real-time conversation context",
                "permissions": ["context.source.stream", "context.read"],
                "rate_limit": 1000,
                "timeout": 5
            }
        ]
        return sources
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve context sources: {str(e)}"
        )

@router.post("/sources", response_model=Dict[str, Any])
async def create_context_source(source: ContextSourceRequest):
    """Create a new context source"""
    try:
        # In a real implementation, this would save to database
        source_data = source.dict()
        source_data["id"] = str(uuid.uuid4())
        source_data["created_at"] = datetime.now().isoformat()
        
        return {
            "message": "Context source created successfully",
            "source": source_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create context source: {str(e)}"
        )

@router.get("/rules", response_model=List[Dict[str, Any]])
async def get_context_rules():
    """Get available context rules"""
    try:
        # This would typically come from a database
        rules = [
            {
                "id": "user-context-enrichment",
                "name": "User Context Enrichment",
                "description": "Enriches context with user profile information",
                "source": "user-profile-api",
                "target": "user_context",
                "conditions": {
                    "user.role": ["admin", "developer", "analyst"],
                    "resource.type": "ai_agent"
                },
                "transform": {
                    "mapping": {
                        "user_profile": "profile",
                        "user_permissions": "permissions"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 1,
                "enabled": True
            },
            {
                "id": "security-context-enrichment",
                "name": "Security Context Enrichment",
                "description": "Adds security context including threat levels",
                "source": "security-context-db",
                "target": "security_context",
                "conditions": {
                    "user.role": ["admin", "security_analyst"],
                    "action.name": ["generate", "analyze"]
                },
                "transform": {
                    "mapping": {
                        "threat_level": "current_threat",
                        "compliance_status": "compliance"
                    }
                },
                "permissions": ["context.ingest", "context.security.read"],
                "priority": 2,
                "enabled": True
            }
        ]
        return rules
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve context rules: {str(e)}"
        )

@router.post("/rules", response_model=Dict[str, Any])
async def create_context_rule(rule: ContextRuleRequest):
    """Create a new context rule"""
    try:
        # In a real implementation, this would save to database
        rule_data = rule.dict()
        rule_data["id"] = str(uuid.uuid4())
        rule_data["created_at"] = datetime.now().isoformat()
        
        return {
            "message": "Context rule created successfully",
            "rule": rule_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create context rule: {str(e)}"
        )

@router.get("/security-policies", response_model=List[Dict[str, Any]])
async def get_security_policies():
    """Get available security policies"""
    try:
        # This would typically come from a database
        policies = [
            {
                "id": "sensitive-data-protection",
                "name": "Sensitive Data Protection",
                "description": "Protects sensitive data in context",
                "rules": [
                    {
                        "type": "mask",
                        "condition": {
                            "field": "password",
                            "context": "user_context"
                        },
                        "action": {
                            "fields": ["password", "token", "secret"]
                        },
                        "permissions": ["context.security.mask"]
                    }
                ],
                "permissions": ["context.security.*"],
                "priority": 1,
                "enabled": True
            },
            {
                "id": "content-filtering",
                "name": "Content Filtering",
                "description": "Filters inappropriate content",
                "rules": [
                    {
                        "type": "deny",
                        "condition": {
                            "field": "content",
                            "contains": ["PII", "sensitive"]
                        },
                        "action": {
                            "fields": ["content"],
                            "reason": "Contains sensitive information"
                        },
                        "permissions": ["context.security.filter"]
                    }
                ],
                "permissions": ["context.security.*"],
                "priority": 2,
                "enabled": True
            }
        ]
        return policies
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve security policies: {str(e)}"
        )

@router.post("/security-policies", response_model=Dict[str, Any])
async def create_security_policy(policy: SecurityPolicyRequest):
    """Create a new security policy"""
    try:
        # In a real implementation, this would save to database
        policy_data = policy.dict()
        policy_data["id"] = str(uuid.uuid4())
        policy_data["created_at"] = datetime.now().isoformat()
        
        return {
            "message": "Security policy created successfully",
            "policy": policy_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create security policy: {str(e)}"
        )

@router.get("/examples", response_model=List[Dict[str, Any]])
async def get_context_examples():
    """Get context generation examples"""
    try:
        examples = [
            {
                "id": "ai-agent-context",
                "name": "AI Agent Context Example",
                "description": "Example of context generation for AI agents",
                "template_id": "ai-context-template",
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
                "rego_example": """
package controlcore.policy

import rego.v1

default allow := false

allow if {
    user_has_permissions(input.user)
    resource_access_allowed(input.resource)
    action_permitted(input.action)
    context_conditions_met(input.context)
}

user_has_permissions(user) if {
    user.roles[_] in ["admin", "developer", "analyst"]
}

context_conditions_met(context) if {
    context.ingestion_enabled == true
    context.security_level in ["admin", "developer", "analyst"]
    count(context.sources) > 0
}
"""
            },
            {
                "id": "llm-context",
                "name": "LLM Context Example",
                "description": "Example of context generation for LLM services",
                "template_id": "llm-context-template",
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
                "rego_example": """
package controlcore.policy

import rego.v1

default allow := false

allow if {
    user_has_permissions(input.user)
    llm_context_valid(input.context)
    prompt_safe(input.context.prompt)
}

llm_context_valid(context) if {
    context.prompt_length < 4000
    context.safety_score > 0.8
    not contains_sensitive_data(context.prompt)
}

prompt_safe(prompt) if {
    not contains(prompt, "PII")
    not contains(prompt, "sensitive")
    not contains(prompt, "confidential")
}
"""
            }
        ]
        return examples
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve context examples: {str(e)}"
        )
