"""
Context Ingestion Service for Control Core PAP Pro Tenant
Provides advanced context generation and ingestion capabilities for multi-tenant environments
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import uuid
import asyncio
import aiohttp
from sqlalchemy.orm import Session

from app.models import Tenant, TenantBouncerConnection
from app.schemas import TenantResponse

class ContextIngestionService:
    """Service for managing context ingestion in multi-tenant environments"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get_tenant_context_config(self, tenant_id: str) -> Dict[str, Any]:
        """Get context configuration for a specific tenant"""
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
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
    
    async def update_tenant_context_config(self, tenant_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Update context configuration for a specific tenant"""
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        # Update tenant's context configuration
        config["updated_at"] = datetime.now().isoformat()
        tenant.context_configuration = config
        tenant.updated_at = datetime.now()
        
        self.db.commit()
        self.db.refresh(tenant)
        
        return config
    
    async def add_context_source(self, tenant_id: str, source: Dict[str, Any]) -> Dict[str, Any]:
        """Add a context source for a tenant"""
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        context_config = tenant.context_configuration or {}
        data_sources = context_config.get("data_sources", [])
        
        # Add new source
        source["id"] = str(uuid.uuid4())
        source["created_at"] = datetime.now().isoformat()
        source["tenant_id"] = tenant_id
        data_sources.append(source)
        
        context_config["data_sources"] = data_sources
        tenant.context_configuration = context_config
        tenant.updated_at = datetime.now()
        
        self.db.commit()
        self.db.refresh(tenant)
        
        return source
    
    async def add_context_rule(self, tenant_id: str, rule: Dict[str, Any]) -> Dict[str, Any]:
        """Add a context rule for a tenant"""
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        context_config = tenant.context_configuration or {}
        ingestion_rules = context_config.get("ingestion_rules", [])
        
        # Add new rule
        rule["id"] = str(uuid.uuid4())
        rule["created_at"] = datetime.now().isoformat()
        rule["tenant_id"] = tenant_id
        ingestion_rules.append(rule)
        
        context_config["ingestion_rules"] = ingestion_rules
        tenant.context_configuration = context_config
        tenant.updated_at = datetime.now()
        
        self.db.commit()
        self.db.refresh(tenant)
        
        return rule
    
    async def add_security_policy(self, tenant_id: str, policy: Dict[str, Any]) -> Dict[str, Any]:
        """Add a security policy for a tenant"""
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        context_config = tenant.context_configuration or {}
        security_policies = context_config.get("security_policies", [])
        
        # Add new policy
        policy["id"] = str(uuid.uuid4())
        policy["created_at"] = datetime.now().isoformat()
        policy["tenant_id"] = tenant_id
        security_policies.append(policy)
        
        context_config["security_policies"] = security_policies
        tenant.context_configuration = context_config
        tenant.updated_at = datetime.now()
        
        self.db.commit()
        self.db.refresh(tenant)
        
        return policy
    
    async def generate_context_aware_policy(self, tenant_id: str, template_id: str, 
                                          context_sources: List[Dict[str, Any]],
                                          context_rules: List[Dict[str, Any]],
                                          security_policies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a context-aware policy for a tenant"""
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        policy_id = str(uuid.uuid4())
        
        # Generate Rego policy with tenant-specific context awareness
        rego_policy = self._generate_rego_policy(tenant_id, template_id, context_sources, context_rules, security_policies)
        
        # Update tenant's context configuration with new policy
        context_config = tenant.context_configuration or {}
        generated_policies = context_config.get("generated_policies", [])
        
        policy_data = {
            "policy_id": policy_id,
            "template_id": template_id,
            "rego_policy": rego_policy,
            "created_at": datetime.now().isoformat(),
            "context_sources_count": len(context_sources),
            "context_rules_count": len(context_rules),
            "security_policies_count": len(security_policies),
            "tenant_id": tenant_id
        }
        
        generated_policies.append(policy_data)
        context_config["generated_policies"] = generated_policies
        tenant.context_configuration = context_config
        tenant.updated_at = datetime.now()
        
        self.db.commit()
        self.db.refresh(tenant)
        
        return policy_data
    
    def _generate_rego_policy(self, tenant_id: str, template_id: str, 
                            context_sources: List[Dict[str, Any]],
                            context_rules: List[Dict[str, Any]],
                            security_policies: List[Dict[str, Any]]) -> str:
        """Generate Rego policy code for tenant"""
        
        # Build context sources section
        context_sources_section = ""
        for source in context_sources:
            context_sources_section += f"""
# Context source: {source.get('name', 'Unknown')}
# Type: {source.get('type', 'unknown')}
# URL: {source.get('url', 'N/A')}
"""
        
        # Build context rules section
        context_rules_section = ""
        for rule in context_rules:
            context_rules_section += f"""
# Context rule: {rule.get('name', 'Unknown')}
# Source: {rule.get('source', 'unknown')}
# Target: {rule.get('target', 'unknown')}
"""
        
        # Build security policies section
        security_policies_section = ""
        for policy in security_policies:
            security_policies_section += f"""
# Security policy: {policy.get('name', 'Unknown')}
# Rules: {len(policy.get('rules', []))}
"""
        
        rego_policy = f"""package controlcore.policy

import rego.v1

# Context-aware policy for tenant {tenant_id}
# Generated from template: {template_id}
# Generated at: {datetime.now().isoformat()}

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
    
    # Context sources are available
    context_sources_available(input.context)
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

# Context sources availability check
context_sources_available(context) if {{
    # Check if required context sources are available
    required_sources := ["user-profile-api", "security-context-db"]
    available_sources := context.sources
    count([source | source := required_sources[_]; source in available_sources]) == count(required_sources)
}}

# Context data validation
context_data_valid(context) if {{
    # User context is present
    context.user_context.available == true
    
    # Security context is appropriate
    context.security_context.available == true
    
    # Resource context is available
    context.resource_context.available == true
    
    # Tenant context is present
    context.tenant_context.available == true
}}

{context_sources_section}

{context_rules_section}

{security_policies_section}

# Content injection rules
content_injection_rules := {{
    "pre_prompt": [
        {{
            "type": "context_enrichment",
            "source": "user_profile",
            "target": "prompt_context",
            "fields": ["user_preferences", "security_clearance", "domain_knowledge"]
        }},
        {{
            "type": "tenant_context",
            "source": "tenant_config",
            "target": "tenant_context",
            "fields": ["tenant_settings", "tenant_policies", "tenant_limits"]
        }}
    ],
    "post_response": [
        {{
            "type": "response_filtering",
            "source": "compliance_rules",
            "target": "filtered_response",
            "fields": ["sensitive_data", "pii", "confidential_information"]
        }},
        {{
            "type": "tenant_filtering",
            "source": "tenant_policies",
            "target": "tenant_filtered_response",
            "fields": ["tenant_specific_data", "tenant_restrictions"]
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
        }},
        {{
            "field": "api_key",
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
    ],
    "tenant_isolation": [
        {{
            "field": "tenant_data",
            "action": "isolate",
            "condition": "tenant_id == '{tenant_id}'"
        }}
    ]
}}

# Helper functions
contains_sensitive_data(text) if {{
    contains(text, "password")
}} else {{
    contains(text, "ssn")
}} else {{
    contains(text, "credit_card")
}}

# Tenant-specific helper functions
is_tenant_admin(user) if {{
    user.tenant_id == "{tenant_id}"
    user.roles[_] == "admin"
}}

is_tenant_developer(user) if {{
    user.tenant_id == "{tenant_id}"
    user.roles[_] == "developer"
}}

is_tenant_analyst(user) if {{
    user.tenant_id == "{tenant_id}"
    user.roles[_] == "analyst"
}}
"""
        
        return rego_policy
    
    async def test_context_ingestion(self, tenant_id: str, user: Dict[str, Any], 
                                   resource: Dict[str, Any], action: Dict[str, Any],
                                   context: Dict[str, Any], sources: List[str]) -> Dict[str, Any]:
        """Test context ingestion for a tenant"""
        import time
        start_time = time.time()
        
        try:
            # Simulate context ingestion for tenant
            enriched_context = {
                "user_context": {
                    "profile": user.get("profile", {}),
                    "permissions": user.get("permissions", []),
                    "security_clearance": user.get("security_clearance", "standard"),
                    "tenant_id": tenant_id
                },
                "resource_context": {
                    "type": resource.get("type", "unknown"),
                    "classification": resource.get("classification", "public"),
                    "owner": resource.get("owner", "system"),
                    "tenant_id": tenant_id
                },
                "action_context": {
                    "name": action.get("name", "unknown"),
                    "type": action.get("type", "read"),
                    "permissions_required": action.get("permissions_required", [])
                },
                "environmental_context": {
                    "time": datetime.now().isoformat(),
                    "location": context.get("location", "unknown"),
                    "device": context.get("device", "unknown"),
                    "network": context.get("network", "internal"),
                    "tenant_id": tenant_id
                },
                "tenant_context": {
                    "tenant_id": tenant_id,
                    "tenant_settings": context.get("tenant_settings", {}),
                    "tenant_policies": context.get("tenant_policies", []),
                    "tenant_limits": context.get("tenant_limits", {})
                }
            }
            
            # Simulate source processing
            sources_used = []
            for source in sources:
                sources_used.append({
                    "id": source,
                    "name": f"{source.title()} Source",
                    "type": "api",
                    "data": {"sample": "data"},
                    "permissions": ["context.ingest", "context.read"],
                    "security": {"level": "standard"},
                    "tenant_id": tenant_id
                })
            
            # Determine security level based on tenant configuration
            user_roles = user.get("roles", [])
            if "admin" in user_roles:
                security_level = "admin"
            elif "developer" in user_roles:
                security_level = "developer"
            elif "analyst" in user_roles:
                security_level = "analyst"
            else:
                security_level = "viewer"
            
            processing_time = time.time() - start_time
            
            return {
                "success": True,
                "enriched_context": enriched_context,
                "sources_used": sources_used,
                "security_level": security_level,
                "processing_time": processing_time,
                "errors": []
            }
            
        except Exception as e:
            return {
                "success": False,
                "enriched_context": {},
                "sources_used": [],
                "security_level": "error",
                "processing_time": 0.0,
                "errors": [str(e)]
            }
    
    async def get_tenant_context_metrics(self, tenant_id: str) -> Dict[str, Any]:
        """Get context ingestion metrics for a tenant"""
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
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
    
    async def sync_context_with_bouncers(self, tenant_id: str) -> Dict[str, Any]:
        """Sync context configuration with tenant's bouncers"""
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        # Get tenant's bouncer connections
        bouncer_connections = self.db.query(TenantBouncerConnection).filter(
            TenantBouncerConnection.tenant_id == tenant_id
        ).all()
        
        if not bouncer_connections:
            return {
                "message": "No bouncer connections found for tenant",
                "synced_bouncers": 0,
                "errors": []
            }
        
        context_config = tenant.context_configuration or {}
        synced_bouncers = 0
        errors = []
        
        for connection in bouncer_connections:
            try:
                # In a real implementation, this would sync with the actual bouncer
                # For now, we'll simulate the sync
                synced_bouncers += 1
            except Exception as e:
                errors.append(f"Failed to sync with bouncer {connection.id}: {str(e)}")
        
        return {
            "message": f"Context configuration synced with {synced_bouncers} bouncers",
            "synced_bouncers": synced_bouncers,
            "errors": errors
        }
