"""
Comprehensive Context Policy Examples for Control Core
These examples demonstrate the advanced context generation and ingestion capabilities
that make Control Core the most powerful PBAC platform.
"""

# AI Agent Context-Aware Policy Example
AI_AGENT_CONTEXT_POLICY = """
package controlcore.policy

import rego.v1

# AI Agent Context-Aware Policy
# This policy demonstrates advanced context ingestion for AI agents

default allow := false

# Main authorization decision
allow if {
    # User has required permissions
    user_has_permissions(input.user)
    
    # Resource access is allowed
    resource_access_allowed(input.resource)
    
    # Action is permitted
    action_permitted(input.action)
    
    # Context conditions are met
    context_conditions_met(input.context)
    
    # AI-specific conditions are satisfied
    ai_conditions_met(input.context)
}

# User permission check with context awareness
user_has_permissions(user) if {
    user.roles[_] in ["admin", "developer", "analyst"]
    user.security_clearance in ["high", "medium", "low"]
}

# Resource access with context filtering
resource_access_allowed(resource) if {
    resource.type == "ai_agent"
    resource.classification in ["public", "internal", "confidential"]
    
    # Check if user has access to this classification level
    user_has_classification_access(input.user, resource.classification)
}

# Action permission with context awareness
action_permitted(action) if {
    action.name in ["generate", "analyze", "classify", "respond"]
    action.type in ["read", "write", "execute"]
    
    # Check if action is allowed for this user in this context
    action_allowed_for_context(input.user, action, input.context)
}

# Context conditions check
context_conditions_met(context) if {
    # Context ingestion is enabled
    context.ingestion_enabled == true
    
    # Security level is appropriate
    context.security_level in ["admin", "developer", "analyst"]
    
    # Context sources are available
    count(context.sources) > 0
    
    # Context data is valid
    context_data_valid(context)
}

# AI-specific conditions
ai_conditions_met(context) if {
    # AI model context is available
    context.model_context.available == true
    
    # Model capabilities match requirements
    model_capabilities_sufficient(context.model_context)
    
    # Conversation context is appropriate
    conversation_context_valid(context.conversation_context)
}

# User classification access check
user_has_classification_access(user, classification) if {
    user.security_clearance == "high"
    classification in ["public", "internal", "confidential", "secret"]
} else {
    user.security_clearance == "medium"
    classification in ["public", "internal", "confidential"]
} else {
    user.security_clearance == "low"
    classification == "public"
}

# Action allowed for context
action_allowed_for_context(user, action, context) if {
    # Admin can perform any action
    user.roles[_] == "admin"
} else {
    # Developer can perform most actions
    user.roles[_] == "developer"
    action.name in ["generate", "analyze", "classify"]
} else {
    # Analyst can perform read-only actions
    user.roles[_] == "analyst"
    action.name in ["analyze", "classify"]
}

# Context data validation
context_data_valid(context) if {
    # User context is present
    context.user_context.available == true
    
    # Security context is appropriate
    context.security_context.available == true
    
    # Model context is available
    context.model_context.available == true
}

# Model capabilities check
model_capabilities_sufficient(model_context) if {
    model_context.capabilities[_] in ["text_generation", "analysis", "classification"]
    model_context.performance.score > 0.8
    model_context.limitations.acknowledged == true
}

# Conversation context validation
conversation_context_valid(conversation_context) if {
    conversation_context.history_length < 100
    conversation_context.sentiment in ["positive", "neutral", "negative"]
    not contains_sensitive_data(conversation_context.history)
}

# Content injection rules
content_injection_rules := {
    "pre_prompt": [
        {
            "type": "context_enrichment",
            "source": "user_profile",
            "target": "prompt_context",
            "fields": ["user_preferences", "security_clearance", "domain_knowledge"]
        },
        {
            "type": "security_context",
            "source": "security_context",
            "target": "security_guidelines",
            "fields": ["threat_level", "compliance_requirements", "data_classification"]
        }
    ],
    "post_response": [
        {
            "type": "response_filtering",
            "source": "compliance_rules",
            "target": "filtered_response",
            "fields": ["sensitive_data", "pii", "confidential_information"]
        },
        {
            "type": "content_sanitization",
            "source": "security_policies",
            "target": "sanitized_response",
            "fields": ["malicious_content", "inappropriate_language", "bias_indicators"]
        }
    ]
}

# Security policies
security_policies := {
    "data_masking": [
        {
            "field": "password",
            "action": "mask",
            "pattern": "***"
        },
        {
            "field": "api_key",
            "action": "mask",
            "pattern": "***"
        }
    ],
    "content_filtering": [
        {
            "field": "response",
            "action": "filter",
            "rules": ["no_pii", "no_sensitive_data", "no_malicious_content"]
        }
    ],
    "access_control": [
        {
            "field": "confidential_data",
            "action": "restrict",
            "condition": "user.security_clearance != 'high'"
        }
    ]
}

# Helper functions
contains_sensitive_data(text) if {
    contains(text, "password")
} else {
    contains(text, "ssn")
} else {
    contains(text, "credit_card")
}
"""

# LLM Context-Aware Policy Example
LLM_CONTEXT_POLICY = """
package controlcore.policy

import rego.v1

# LLM Context-Aware Policy
# This policy demonstrates advanced context management for LLM services

default allow := false

# Main authorization decision
allow if {
    # User has required permissions
    user_has_permissions(input.user)
    
    # LLM resource access is allowed
    llm_resource_access_allowed(input.resource)
    
    # LLM action is permitted
    llm_action_permitted(input.action)
    
    # Context conditions are met
    llm_context_conditions_met(input.context)
    
    # Prompt safety is validated
    prompt_safety_validated(input.context.prompt)
}

# User permission check for LLM
user_has_permissions(user) if {
    user.roles[_] in ["admin", "developer", "analyst", "user"]
    user.llm_access_level in ["full", "limited", "basic"]
}

# LLM resource access check
llm_resource_access_allowed(resource) if {
    resource.type == "llm"
    resource.model_capabilities[_] in ["text_generation", "completion", "analysis"]
    resource.rate_limit_available == true
}

# LLM action permission check
llm_action_permitted(action) if {
    action.name in ["generate", "complete", "summarize", "translate", "analyze"]
    action.type in ["read", "write"]
    
    # Check if action is allowed for user's access level
    action_allowed_for_llm_access_level(input.user.llm_access_level, action)
}

# LLM context conditions
llm_context_conditions_met(context) if {
    # Prompt context is available
    context.prompt_context.available == true
    
    # Knowledge context is appropriate
    context.knowledge_context.available == true
    
    # Compliance context is valid
    context.compliance_context.available == true
    
    # Template context is available
    context.template_context.available == true
}

# Prompt safety validation
prompt_safety_validated(prompt) if {
    # Prompt length is within limits
    prompt.length < 4000
    
    # Prompt doesn't contain sensitive data
    not contains_sensitive_data(prompt.content)
    
    # Prompt doesn't contain malicious content
    not contains_malicious_content(prompt.content)
    
    # Prompt follows safety guidelines
    follows_safety_guidelines(prompt.content)
}

# Action allowed for LLM access level
action_allowed_for_llm_access_level(access_level, action) if {
    access_level == "full"
} else {
    access_level == "limited"
    action.name in ["generate", "complete", "summarize"]
} else {
    access_level == "basic"
    action.name in ["generate", "complete"]
}

# Content injection rules for LLM
llm_content_injection_rules := {
    "pre_prompt": [
        {
            "type": "prompt_enrichment",
            "source": "prompt_context",
            "target": "enriched_prompt",
            "fields": ["user_intent", "domain_knowledge", "conversation_history"]
        },
        {
            "type": "knowledge_injection",
            "source": "knowledge_context",
            "target": "knowledge_base",
            "fields": ["relevant_documents", "domain_expertise", "factual_data"]
        }
    ],
    "post_response": [
        {
            "type": "response_filtering",
            "source": "compliance_rules",
            "target": "filtered_response",
            "fields": ["inappropriate_content", "sensitive_data", "bias_indicators"]
        },
        {
            "type": "template_application",
            "source": "template_context",
            "target": "formatted_response",
            "fields": ["approved_templates", "formatting_guidelines", "style_guide"]
        }
    ]
}

# LLM security policies
llm_security_policies := {
    "content_filtering": [
        {
            "field": "response",
            "action": "filter",
            "rules": ["no_pii", "no_sensitive_data", "no_inappropriate_content"]
        }
    ],
    "prompt_sanitization": [
        {
            "field": "prompt",
            "action": "sanitize",
            "rules": ["remove_sensitive_data", "validate_safety", "check_guidelines"]
        }
    ],
    "response_validation": [
        {
            "field": "response",
            "action": "validate",
            "rules": ["check_accuracy", "verify_compliance", "ensure_appropriateness"]
        }
    ]
}

# Helper functions
contains_sensitive_data(content) if {
    contains(content, "password")
} else {
    contains(content, "ssn")
} else {
    contains(content, "credit_card")
}

contains_malicious_content(content) if {
    contains(content, "malware")
} else {
    contains(content, "virus")
} else {
    contains(content, "exploit")
}

follows_safety_guidelines(content) if {
    not contains(content, "harmful")
    not contains(content, "dangerous")
    not contains(content, "illegal")
}
"""

# RAG System Context-Aware Policy Example
RAG_CONTEXT_POLICY = """
package controlcore.policy

import rego.v1

# RAG System Context-Aware Policy
# This policy demonstrates advanced context management for RAG systems

default allow := false

# Main authorization decision
allow if {
    # User has required permissions
    user_has_permissions(input.user)
    
    # RAG resource access is allowed
    rag_resource_access_allowed(input.resource)
    
    # RAG action is permitted
    rag_action_permitted(input.action)
    
    # Context conditions are met
    rag_context_conditions_met(input.context)
    
    # Document access is authorized
    document_access_authorized(input.context.document_context)
}

# User permission check for RAG
user_has_permissions(user) if {
    user.roles[_] in ["admin", "developer", "analyst", "researcher"]
    user.document_access_level in ["full", "limited", "restricted"]
}

# RAG resource access check
rag_resource_access_allowed(resource) if {
    resource.type == "rag"
    resource.capabilities[_] in ["document_retrieval", "vector_search", "semantic_search"]
    resource.performance.available == true
}

# RAG action permission check
rag_action_permitted(action) if {
    action.name in ["retrieve", "search", "query", "analyze", "summarize"]
    action.type in ["read", "search"]
    
    # Check if action is allowed for user's document access level
    action_allowed_for_document_access_level(input.user.document_access_level, action)
}

# RAG context conditions
rag_context_conditions_met(context) if {
    # Document context is available
    context.document_context.available == true
    
    # Access context is appropriate
    context.access_context.available == true
    
    # Retrieval context is valid
    context.retrieval_context.available == true
    
    # User preferences are considered
    context.user_preferences.available == true
}

# Document access authorization
document_access_authorized(document_context) if {
    # User has permission for document classification
    user_has_document_classification_access(input.user, document_context.classification)
    
    # Document is not restricted
    not document_restricted(document_context)
    
    # User has access to document owner
    user_has_owner_access(input.user, document_context.owner)
}

# Action allowed for document access level
action_allowed_for_document_access_level(access_level, action) if {
    access_level == "full"
} else {
    access_level == "limited"
    action.name in ["retrieve", "search", "query"]
} else {
    access_level == "restricted"
    action.name in ["search", "query"]
}

# User document classification access
user_has_document_classification_access(user, classification) if {
    user.document_access_level == "full"
    classification in ["public", "internal", "confidential", "secret"]
} else {
    user.document_access_level == "limited"
    classification in ["public", "internal", "confidential"]
} else {
    user.document_access_level == "restricted"
    classification == "public"
}

# Document restriction check
document_restricted(document_context) if {
    document_context.restricted == true
} else {
    document_context.access_level == "secret"
    input.user.document_access_level != "full"
}

# User owner access check
user_has_owner_access(user, owner) if {
    user.id == owner
} else {
    user.roles[_] == "admin"
} else {
    user.document_access_level == "full"
}

# RAG content injection rules
rag_content_injection_rules := {
    "pre_retrieval": [
        {
            "type": "document_context_enrichment",
            "source": "document_context",
            "target": "enriched_document_context",
            "fields": ["permissions", "classification", "access_level", "owner"]
        },
        {
            "type": "user_access_context",
            "source": "access_context",
            "target": "user_access_rules",
            "fields": ["permissions", "visibility", "restrictions"]
        }
    ],
    "post_retrieval": [
        {
            "type": "document_filtering",
            "source": "retrieved_documents",
            "target": "filtered_documents",
            "fields": ["sensitive_sections", "confidential_data", "restricted_content"]
        },
        {
            "type": "content_sanitization",
            "source": "document_content",
            "target": "sanitized_content",
            "fields": ["pii", "sensitive_data", "confidential_information"]
        }
    ]
}

# RAG security policies
rag_security_policies := {
    "document_access_control": [
        {
            "field": "document_content",
            "action": "restrict",
            "condition": "user.document_access_level < document.classification_level"
        }
    ],
    "content_filtering": [
        {
            "field": "retrieved_content",
            "action": "filter",
            "rules": ["no_sensitive_data", "no_confidential_info", "no_restricted_content"]
        }
    ],
    "access_auditing": [
        {
            "field": "access_log",
            "action": "log",
            "fields": ["user_id", "document_id", "action", "timestamp", "result"]
        }
    ]
}
"""

# Context Configuration Examples
CONTEXT_CONFIG_EXAMPLES = {
    "ai_agent": {
        "enabled": True,
        "max_context_size": 2048 * 1024,  # 2MB
        "timeout_seconds": 30,
        "allowed_sources": ["api", "database", "stream"],
        "data_sources": [
            {
                "id": "user-profile-api",
                "name": "User Profile API",
                "type": "api",
                "url": "https://api.company.com/user-profile",
                "auth_type": "bearer",
                "permissions": ["context.source.api", "context.read"],
                "rate_limit": 100,
                "timeout": 30,
                "enabled": True
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
                "enabled": True
            }
        ],
        "ingestion_rules": [
            {
                "id": "user-context-enrichment",
                "name": "User Context Enrichment",
                "description": "Enriches AI context with user profile information",
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
                        "security_clearance": "clearance_level"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 1,
                "enabled": True
            }
        ],
        "security_policies": [
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
                            "fields": ["password", "token", "secret"]
                        },
                        "permissions": ["context.security.mask"]
                    }
                ],
                "permissions": ["context.security.*"],
                "priority": 1,
                "enabled": True
            }
        ]
    },
    "llm": {
        "enabled": True,
        "max_context_size": 4096 * 1024,  # 4MB
        "timeout_seconds": 45,
        "allowed_sources": ["api", "database", "file"],
        "data_sources": [
            {
                "id": "prompt-context-api",
                "name": "Prompt Context API",
                "type": "api",
                "url": "https://prompt-context.company.com/api",
                "auth_type": "bearer",
                "permissions": ["context.source.api", "context.read"],
                "rate_limit": 500,
                "timeout": 30,
                "enabled": True
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
                "enabled": True
            }
        ],
        "ingestion_rules": [
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
                        "conversation_history": "history"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 1,
                "enabled": True
            }
        ],
        "security_policies": [
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
            }
        ]
    },
    "rag": {
        "enabled": True,
        "max_context_size": 8192 * 1024,  # 8MB
        "timeout_seconds": 60,
        "allowed_sources": ["database", "stream"],
        "data_sources": [
            {
                "id": "document-vector-db",
                "name": "Document Vector Database",
                "type": "database",
                "url": "pinecone://vector-db:443/vectors",
                "auth_type": "api_key",
                "permissions": ["context.source.database", "context.read"],
                "rate_limit": 200,
                "timeout": 30,
                "enabled": True
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
                "enabled": True
            }
        ],
        "ingestion_rules": [
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
                        "access_level": "access_level"
                    }
                },
                "permissions": ["context.ingest", "context.read"],
                "priority": 1,
                "enabled": True
            }
        ],
        "security_policies": [
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
                    }
                ],
                "permissions": ["context.security.*"],
                "priority": 1,
                "enabled": True
            }
        ]
    }
}

# Export all examples
CONTEXT_POLICY_EXAMPLES = {
    "ai_agent": AI_AGENT_CONTEXT_POLICY,
    "llm": LLM_CONTEXT_POLICY,
    "rag": RAG_CONTEXT_POLICY
}

# Usage examples
USAGE_EXAMPLES = {
    "ai_agent": {
        "description": "AI Agent Context-Aware Policy",
        "use_cases": [
            "AI chatbot with user context awareness",
            "AI assistant with security clearance",
            "AI model with conversation history",
            "AI agent with compliance requirements"
        ],
        "context_sources": [
            "User profile API",
            "Security context database",
            "AI model metadata",
            "Conversation history stream"
        ],
        "features": [
            "User context enrichment",
            "Security context filtering",
            "Model capability validation",
            "Conversation context management"
        ]
    },
    "llm": {
        "description": "LLM Context-Aware Policy",
        "use_cases": [
            "LLM with prompt context enrichment",
            "LLM with knowledge base integration",
            "LLM with compliance filtering",
            "LLM with response templating"
        ],
        "context_sources": [
            "Prompt context API",
            "Knowledge base",
            "Compliance rules engine",
            "Response templates"
        ],
        "features": [
            "Prompt enrichment",
            "Knowledge injection",
            "Compliance context",
            "Response templating"
        ]
    },
    "rag": {
        "description": "RAG System Context-Aware Policy",
        "use_cases": [
            "RAG with document access control",
            "RAG with user permission filtering",
            "RAG with retrieval history",
            "RAG with content sanitization"
        ],
        "context_sources": [
            "Document vector database",
            "Document metadata API",
            "User access context",
            "Retrieval history stream"
        ],
        "features": [
            "Document context enrichment",
            "User access control",
            "Retrieval history context",
            "Content filtering"
        ]
    }
}
