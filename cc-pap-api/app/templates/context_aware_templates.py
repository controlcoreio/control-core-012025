"""
Context-Aware Policy Templates for Control Core PAP
These templates demonstrate the advanced context generation and ingestion capabilities
that make Control Core the most powerful PBAC platform.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json

class ContextAwarePolicyTemplate:
    """Base class for context-aware policy templates"""
    
    def __init__(self, template_id: str, name: str, description: str, category: str):
        self.template_id = template_id
        self.name = name
        self.description = description
        self.category = category
        self.context_sources = []
        self.context_rules = []
        self.security_policies = []
        self.created_at = datetime.now()
        self.version = "1.0.0"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "template_id": self.template_id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "context_sources": self.context_sources,
            "context_rules": self.context_rules,
            "security_policies": self.security_policies,
            "created_at": self.created_at.isoformat(),
            "version": self.version
        }

class AIContextTemplate(ContextAwarePolicyTemplate):
    """AI Agent Context-Aware Policy Template"""
    
    def __init__(self):
        super().__init__(
            template_id="ai-context-template",
            name="AI Agent Context-Aware Policy",
            description="Advanced policy template for AI agents with context ingestion from multiple sources",
            category="ai_agent"
        )
        self._setup_context_sources()
        self._setup_context_rules()
        self._setup_security_policies()
    
    def _setup_context_sources(self):
        """Setup context sources for AI agent policies"""
        self.context_sources = [
            {
                "id": "user-profile-api",
                "name": "User Profile API",
                "type": "api",
                "url": "https://api.company.com/user-profile",
                "auth_type": "bearer",
                "permissions": ["context.source.api", "context.read"],
                "rate_limit": 100,
                "timeout": 30,
                "enabled": True,
                "description": "Fetches user profile information including roles, preferences, and security clearance"
            },
            {
                "id": "security-context-db",
                "name": "Security Context Database",
                "type": "database",
                "url": "postgresql://security-db:5432/security_context",
                "auth_type": "basic",
                "permissions": ["context.source.database", "context.read"],
                "rate_limit": 50,
                "timeout": 15,
                "enabled": True,
                "description": "Accesses security context including risk scores, threat levels, and compliance status"
            },
            {
                "id": "ai-model-metadata",
                "name": "AI Model Metadata",
                "type": "api",
                "url": "https://ai-models.company.com/metadata",
                "auth_type": "oauth2",
                "permissions": ["context.source.api", "context.read"],
                "rate_limit": 200,
                "timeout": 20,
                "enabled": True,
                "description": "Retrieves AI model capabilities, limitations, and current performance metrics"
            },
            {
                "id": "conversation-history",
                "name": "Conversation History",
                "type": "stream",
                "url": "kafka://conversation-stream:9092/conversations",
                "auth_type": "none",
                "permissions": ["context.source.stream", "context.read"],
                "rate_limit": 1000,
                "timeout": 5,
                "enabled": True,
                "description": "Real-time conversation context and history for AI decision making"
            }
        ]
    
    def _setup_context_rules(self):
        """Setup context ingestion rules"""
        self.context_rules = [
            {
                "id": "user-context-enrichment",
                "name": "User Context Enrichment",
                "description": "Enriches AI context with user profile and security information",
                "source": "user-profile-api",
                "target": "user_context",
                "conditions": {
                    "user.role": ["admin", "developer", "analyst"],
                    "resource.type": "ai_agent"
                },
                "transform": {
                    "mapping": {
                        "user_profile": "profile",
                        "user_permissions": "permissions",
                        "security_clearance": "clearance_level",
                        "risk_score": "user_risk"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 1,
                "enabled": True
            },
            {
                "id": "security-context-enrichment",
                "name": "Security Context Enrichment",
                "description": "Adds security context including threat levels and compliance status",
                "source": "security-context-db",
                "target": "security_context",
                "conditions": {
                    "user.role": ["admin", "security_analyst"],
                    "action.name": ["generate", "analyze", "classify"]
                },
                "transform": {
                    "mapping": {
                        "threat_level": "current_threat",
                        "compliance_status": "compliance",
                        "risk_indicators": "risk_factors"
                    }
                },
                "permissions": ["context.ingest", "context.security.read"],
                "priority": 2,
                "enabled": True
            },
            {
                "id": "ai-model-context",
                "name": "AI Model Context",
                "description": "Provides AI model capabilities and limitations context",
                "source": "ai-model-metadata",
                "target": "model_context",
                "conditions": {
                    "resource.type": "ai_agent",
                    "action.name": ["generate", "analyze"]
                },
                "transform": {
                    "mapping": {
                        "model_capabilities": "capabilities",
                        "model_limitations": "limitations",
                        "performance_metrics": "performance"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 3,
                "enabled": True
            },
            {
                "id": "conversation-context",
                "name": "Conversation Context",
                "description": "Adds real-time conversation context for AI decision making",
                "source": "conversation-history",
                "target": "conversation_context",
                "conditions": {
                    "resource.type": "ai_agent",
                    "action.name": ["generate", "respond"]
                },
                "transform": {
                    "mapping": {
                        "conversation_history": "history",
                        "current_topic": "topic",
                        "sentiment_analysis": "sentiment"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 4,
                "enabled": True
            }
        ]
    
    def _setup_security_policies(self):
        """Setup security policies for context ingestion"""
        self.security_policies = [
            {
                "id": "sensitive-data-protection",
                "name": "Sensitive Data Protection",
                "description": "Protects sensitive data in AI context",
                "rules": [
                    {
                        "type": "mask",
                        "condition": {
                            "field": "password",
                            "context": "user_context"
                        },
                        "action": {
                            "fields": ["password", "token", "secret", "api_key"]
                        },
                        "permissions": ["context.security.mask"]
                    },
                    {
                        "type": "encrypt",
                        "condition": {
                            "field": "personal_data",
                            "context": "user_context"
                        },
                        "action": {
                            "fields": ["ssn", "credit_card", "bank_account"]
                        },
                        "permissions": ["context.security.encrypt"]
                    }
                ],
                "permissions": ["context.security.*"],
                "priority": 1,
                "enabled": True
            },
            {
                "id": "ai-context-filtering",
                "name": "AI Context Filtering",
                "description": "Filters context based on AI model capabilities and user permissions",
                "rules": [
                    {
                        "type": "allow",
                        "condition": {
                            "user.role": "admin",
                            "context": "model_context"
                        },
                        "action": {
                            "fields": ["*"]
                        },
                        "permissions": ["context.security.admin"]
                    },
                    {
                        "type": "deny",
                        "condition": {
                            "user.role": "viewer",
                            "context": "security_context"
                        },
                        "action": {
                            "fields": ["threat_level", "risk_indicators"]
                        },
                        "permissions": ["context.security.viewer"]
                    }
                ],
                "permissions": ["context.security.*"],
                "priority": 2,
                "enabled": True
            }
        ]

class LLMContextTemplate(ContextAwarePolicyTemplate):
    """LLM Context-Aware Policy Template"""
    
    def __init__(self):
        super().__init__(
            template_id="llm-context-template",
            name="LLM Context-Aware Policy",
            description="Advanced policy template for LLM services with prompt context and response filtering",
            category="llm"
        )
        self._setup_context_sources()
        self._setup_context_rules()
        self._setup_security_policies()
    
    def _setup_context_sources(self):
        """Setup context sources for LLM policies"""
        self.context_sources = [
            {
                "id": "prompt-context-api",
                "name": "Prompt Context API",
                "type": "api",
                "url": "https://prompt-context.company.com/api",
                "auth_type": "bearer",
                "permissions": ["context.source.api", "context.read"],
                "rate_limit": 500,
                "timeout": 30,
                "enabled": True,
                "description": "Provides prompt context including user intent, domain knowledge, and conversation history"
            },
            {
                "id": "knowledge-base",
                "name": "Knowledge Base",
                "type": "database",
                "url": "elasticsearch://knowledge-base:9200/knowledge",
                "auth_type": "basic",
                "permissions": ["context.source.database", "context.read"],
                "rate_limit": 100,
                "timeout": 20,
                "enabled": True,
                "description": "Accesses organizational knowledge base for context-aware responses"
            },
            {
                "id": "compliance-rules",
                "name": "Compliance Rules Engine",
                "type": "api",
                "url": "https://compliance.company.com/rules",
                "auth_type": "oauth2",
                "permissions": ["context.source.api", "context.read"],
                "rate_limit": 50,
                "timeout": 15,
                "enabled": True,
                "description": "Retrieves compliance rules and regulatory requirements for content filtering"
            },
            {
                "id": "response-templates",
                "name": "Response Templates",
                "type": "file",
                "url": "file:///templates/response-templates.json",
                "auth_type": "none",
                "permissions": ["context.source.file", "context.read"],
                "rate_limit": 1000,
                "timeout": 5,
                "enabled": True,
                "description": "Accesses approved response templates and formatting guidelines"
            }
        ]
    
    def _setup_context_rules(self):
        """Setup context ingestion rules for LLM"""
        self.context_rules = [
            {
                "id": "prompt-enrichment",
                "name": "Prompt Enrichment",
                "description": "Enriches prompts with user context and domain knowledge",
                "source": "prompt-context-api",
                "target": "prompt_context",
                "conditions": {
                    "resource.type": "llm",
                    "action.name": ["generate", "complete", "summarize"]
                },
                "transform": {
                    "mapping": {
                        "user_intent": "intent",
                        "domain_knowledge": "knowledge",
                        "conversation_history": "history",
                        "user_preferences": "preferences"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 1,
                "enabled": True
            },
            {
                "id": "knowledge-enrichment",
                "name": "Knowledge Enrichment",
                "description": "Adds relevant knowledge base information to context",
                "source": "knowledge-base",
                "target": "knowledge_context",
                "conditions": {
                    "resource.type": "llm",
                    "action.name": ["generate", "answer", "explain"]
                },
                "transform": {
                    "mapping": {
                        "relevant_documents": "documents",
                        "domain_expertise": "expertise",
                        "factual_data": "facts"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 2,
                "enabled": True
            },
            {
                "id": "compliance-context",
                "name": "Compliance Context",
                "description": "Adds compliance rules and regulatory context",
                "source": "compliance-rules",
                "target": "compliance_context",
                "conditions": {
                    "user.role": ["admin", "compliance_officer"],
                    "resource.type": "llm"
                },
                "transform": {
                    "mapping": {
                        "regulatory_requirements": "requirements",
                        "compliance_rules": "rules",
                        "approval_workflow": "workflow"
                    }
                },
                "permissions": ["context.ingest", "context.security.read"],
                "priority": 3,
                "enabled": True
            },
            {
                "id": "response-template-context",
                "name": "Response Template Context",
                "description": "Provides approved response templates and formatting",
                "source": "response-templates",
                "target": "template_context",
                "conditions": {
                    "resource.type": "llm",
                    "action.name": ["generate", "respond"]
                },
                "transform": {
                    "mapping": {
                        "approved_templates": "templates",
                        "formatting_guidelines": "formatting",
                        "style_guide": "style"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 4,
                "enabled": True
            }
        ]
    
    def _setup_security_policies(self):
        """Setup security policies for LLM context"""
        self.security_policies = [
            {
                "id": "content-filtering",
                "name": "Content Filtering",
                "description": "Filters inappropriate or sensitive content",
                "rules": [
                    {
                        "type": "deny",
                        "condition": {
                            "field": "content",
                            "contains": ["PII", "sensitive", "confidential"]
                        },
                        "action": {
                            "fields": ["content"],
                            "reason": "Contains sensitive information"
                        },
                        "permissions": ["context.security.filter"]
                    }
                ],
                "permissions": ["context.security.*"],
                "priority": 1,
                "enabled": True
            },
            {
                "id": "response-sanitization",
                "name": "Response Sanitization",
                "description": "Sanitizes LLM responses based on user permissions",
                "rules": [
                    {
                        "type": "mask",
                        "condition": {
                            "user.role": "viewer",
                            "field": "response"
                        },
                        "action": {
                            "fields": ["internal_data", "sensitive_analysis"]
                        },
                        "permissions": ["context.security.mask"]
                    }
                ],
                "permissions": ["context.security.*"],
                "priority": 2,
                "enabled": True
            }
        ]

class RAGContextTemplate(ContextAwarePolicyTemplate):
    """RAG System Context-Aware Policy Template"""
    
    def __init__(self):
        super().__init__(
            template_id="rag-context-template",
            name="RAG System Context-Aware Policy",
            description="Advanced policy template for RAG systems with document context and retrieval filtering",
            category="rag"
        )
        self._setup_context_sources()
        self._setup_context_rules()
        self._setup_security_policies()
    
    def _setup_context_sources(self):
        """Setup context sources for RAG policies"""
        self.context_sources = [
            {
                "id": "document-vector-db",
                "name": "Document Vector Database",
                "type": "database",
                "url": "pinecone://vector-db:443/vectors",
                "auth_type": "api_key",
                "permissions": ["context.source.database", "context.read"],
                "rate_limit": 200,
                "timeout": 30,
                "enabled": True,
                "description": "Accesses document vectors and embeddings for similarity search"
            },
            {
                "id": "document-metadata-api",
                "name": "Document Metadata API",
                "type": "api",
                "url": "https://metadata.company.com/api",
                "auth_type": "bearer",
                "permissions": ["context.source.api", "context.read"],
                "rate_limit": 100,
                "timeout": 20,
                "enabled": True,
                "description": "Retrieves document metadata including permissions, classification, and access levels"
            },
            {
                "id": "user-access-context",
                "name": "User Access Context",
                "type": "api",
                "url": "https://access.company.com/context",
                "auth_type": "oauth2",
                "permissions": ["context.source.api", "context.read"],
                "rate_limit": 150,
                "timeout": 15,
                "enabled": True,
                "description": "Provides user access permissions and document visibility rules"
            },
            {
                "id": "retrieval-history",
                "name": "Retrieval History",
                "type": "stream",
                "url": "kafka://retrieval-stream:9092/retrievals",
                "auth_type": "none",
                "permissions": ["context.source.stream", "context.read"],
                "rate_limit": 500,
                "timeout": 10,
                "enabled": True,
                "description": "Real-time retrieval history for context-aware document selection"
            }
        ]
    
    def _setup_context_rules(self):
        """Setup context ingestion rules for RAG"""
        self.context_rules = [
            {
                "id": "document-context-enrichment",
                "name": "Document Context Enrichment",
                "description": "Enriches retrieval context with document metadata and permissions",
                "source": "document-metadata-api",
                "target": "document_context",
                "conditions": {
                    "resource.type": "rag",
                    "action.name": ["retrieve", "search", "query"]
                },
                "transform": {
                    "mapping": {
                        "document_permissions": "permissions",
                        "document_classification": "classification",
                        "access_level": "access_level",
                        "document_owner": "owner"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 1,
                "enabled": True
            },
            {
                "id": "user-access-context",
                "name": "User Access Context",
                "description": "Adds user access permissions and document visibility rules",
                "source": "user-access-context",
                "target": "access_context",
                "conditions": {
                    "resource.type": "rag",
                    "action.name": ["retrieve", "search"]
                },
                "transform": {
                    "mapping": {
                        "user_permissions": "permissions",
                        "document_visibility": "visibility",
                        "access_restrictions": "restrictions"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 2,
                "enabled": True
            },
            {
                "id": "retrieval-history-context",
                "name": "Retrieval History Context",
                "description": "Provides retrieval history for context-aware document selection",
                "source": "retrieval-history",
                "target": "retrieval_context",
                "conditions": {
                    "resource.type": "rag",
                    "action.name": ["retrieve", "search", "query"]
                },
                "transform": {
                    "mapping": {
                        "previous_retrievals": "history",
                        "user_preferences": "preferences",
                        "search_patterns": "patterns"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 3,
                "enabled": True
            }
        ]
    
    def _setup_security_policies(self):
        """Setup security policies for RAG context"""
        self.security_policies = [
            {
                "id": "document-access-control",
                "name": "Document Access Control",
                "description": "Controls access to documents based on user permissions and classification",
                "rules": [
                    {
                        "type": "deny",
                        "condition": {
                            "user.role": "viewer",
                            "document.classification": "confidential"
                        },
                        "action": {
                            "fields": ["document_content"],
                            "reason": "Insufficient permissions for confidential documents"
                        },
                        "permissions": ["context.security.access"]
                    },
                    {
                        "type": "allow",
                        "condition": {
                            "user.role": "admin",
                            "document.classification": "public"
                        },
                        "action": {
                            "fields": ["*"]
                        },
                        "permissions": ["context.security.admin"]
                    }
                ],
                "permissions": ["context.security.*"],
                "priority": 1,
                "enabled": True
            },
            {
                "id": "content-filtering-rag",
                "name": "Content Filtering for RAG",
                "description": "Filters retrieved content based on user permissions and document classification",
                "rules": [
                    {
                        "type": "mask",
                        "condition": {
                            "user.role": "analyst",
                            "document.classification": "internal"
                        },
                        "action": {
                            "fields": ["sensitive_sections", "confidential_data"]
                        },
                        "permissions": ["context.security.mask"]
                    }
                ],
                "permissions": ["context.security.*"],
                "priority": 2,
                "enabled": True
            }
        ]

class ContextTemplateManager:
    """Manager for context-aware policy templates"""
    
    def __init__(self):
        self.templates = {
            "ai_agent": AIContextTemplate(),
            "llm": LLMContextTemplate(),
            "rag": RAGContextTemplate()
        }
    
    def get_template(self, template_id: str) -> Optional[ContextAwarePolicyTemplate]:
        """Get a specific template by ID"""
        return self.templates.get(template_id)
    
    def get_all_templates(self) -> List[Dict[str, Any]]:
        """Get all available templates"""
        return [template.to_dict() for template in self.templates.values()]
    
    def get_templates_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get templates by category"""
        return [
            template.to_dict() 
            for template in self.templates.values() 
            if template.category == category
        ]
    
    def create_custom_template(self, template_data: Dict[str, Any]) -> ContextAwarePolicyTemplate:
        """Create a custom context-aware template"""
        template = ContextAwarePolicyTemplate(
            template_id=template_data["template_id"],
            name=template_data["name"],
            description=template_data["description"],
            category=template_data["category"]
        )
        
        template.context_sources = template_data.get("context_sources", [])
        template.context_rules = template_data.get("context_rules", [])
        template.security_policies = template_data.get("security_policies", [])
        
        return template
    
    def generate_rego_policy(self, template: ContextAwarePolicyTemplate) -> str:
        """Generate Rego policy code from template"""
        rego_policy = f"""package controlcore.policy

import rego.v1

# Context-aware policy for {template.name}
# Generated from template: {template.template_id}

# Default deny
default allow := false

# Allow access if all conditions are met
allow if {{
    # User has required permissions
    user_has_permissions(input.user)
    
    # Resource access is allowed
    resource_access_allowed(input.resource)
    
    # Action is permitted
    action_permitted(input.action)
    
    # Context conditions are met
    context_conditions_met(input.context)
}}

# User permission check
user_has_permissions(user) if {{
    user.roles[_] in ["admin", "developer", "analyst"]
}}

# Resource access check
resource_access_allowed(resource) if {{
    resource.type in ["ai_agent", "llm", "rag"]
}}

# Action permission check
action_permitted(action) if {{
    action.name in ["generate", "analyze", "retrieve", "query"]
}}

# Context conditions check
context_conditions_met(context) if {{
    # Check if context ingestion is enabled
    context.ingestion_enabled == true
    
    # Check security level
    context.security_level in ["admin", "developer", "analyst"]
    
    # Check context sources
    count(context.sources) > 0
}}

# Content injection rules
content_injection_rules := {{
    "pre_prompt": [
        {{
            "type": "context_enrichment",
            "source": "user_profile",
            "target": "prompt_context"
        }}
    ],
    "post_response": [
        {{
            "type": "response_filtering",
            "source": "compliance_rules",
            "target": "filtered_response"
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
            "rules": ["no_pii", "no_sensitive_data"]
        }}
    ]
}}
"""
        return rego_policy
    
    def generate_context_config(self, template: ContextAwarePolicyTemplate) -> Dict[str, Any]:
        """Generate context configuration from template"""
        return {
            "enabled": True,
            "max_context_size": 1024 * 1024,  # 1MB
            "timeout_seconds": 30,
            "allowed_sources": [source["type"] for source in template.context_sources],
            "permission_levels": {
                "admin": "full",
                "developer": "limited",
                "analyst": "read_only",
                "viewer": "view_only"
            },
            "data_sources": template.context_sources,
            "ingestion_rules": template.context_rules,
            "security_policies": template.security_policies
        }

# Global template manager instance
template_manager = ContextTemplateManager()
