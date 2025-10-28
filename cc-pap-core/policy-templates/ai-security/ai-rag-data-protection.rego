package controlcore.policy.templates.ai_security

# Policy to enforce data protection for RAG (Retrieval-Augmented Generation) systems
# This policy ensures sensitive data is properly protected in RAG implementations

default allow = false # Deny by default, require explicit data protection measures

# Allow RAG access with proper data protection
allow {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.data_encryption_enabled
  input.context.vector_embeddings_encrypted
  input.context.source_documents_encrypted
  input.context.query_logging_enabled
  input.context.audit_trail_maintained
}

# Enhanced protection for sensitive RAG queries
allow {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.data_classification == "sensitive"
  input.context.rag_encryption_enabled
  input.context.vector_search_encrypted
  input.context.response_filtering_enabled
  input.context.pii_detection_enabled
  input.context.data_masking_enabled
}

# Allow RAG access with proper access controls
allow {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.user.roles[_] in ["rag_user", "data_analyst", "researcher"]
  input.context.user_authentication_verified
  input.context.query_authorization_verified
  input.context.session_management_enabled
}

# Deny RAG access without proper encryption
deny {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  not input.context.data_encryption_enabled
}

deny {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  not input.context.vector_embeddings_encrypted
}

deny {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  not input.context.source_documents_encrypted
}

# Deny RAG access for sensitive data without proper protection
deny {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.data_classification == "sensitive"
  not input.context.rag_encryption_enabled
}

deny {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.data_classification == "sensitive"
  not input.context.vector_search_encrypted
}

deny {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.data_classification == "sensitive"
  not input.context.response_filtering_enabled
}

# Deny RAG access without proper PII protection
deny {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.pii_detection_required
  not input.context.pii_detection_enabled
}

deny {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.pii_detection_required
  not input.context.data_masking_enabled
}

# Require data anonymization for RAG systems
require_data_anonymization {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.data_classification == "personal"
  not input.context.data_anonymization_enabled
}

# Require data pseudonymization for RAG systems
require_data_pseudonymization {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.data_classification == "confidential"
  not input.context.data_pseudonymization_enabled
}

# Require query sanitization for RAG systems
require_query_sanitization {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.query_sanitization_required
  not input.context.query_sanitization_enabled
}

# Require response filtering for RAG systems
require_response_filtering {
  input.action == "query_rag_system"
  input.resource.type == "rag_system"
  input.context.response_filtering_required
  not input.context.response_filtering_enabled
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "researcher_1",
#     "roles": ["rag_user", "data_analyst"]
#   },
#   "action": "query_rag_system",
#   "resource": {
#     "id": "corporate_rag_system",
#     "type": "rag_system",
#     "system_name": "enterprise_knowledge_base"
#   },
#   "context": {
#     "data_encryption_enabled": true,
#     "vector_embeddings_encrypted": true,
#     "source_documents_encrypted": true,
#     "query_logging_enabled": true,
#     "audit_trail_maintained": true,
#     "data_classification": "sensitive",
#     "rag_encryption_enabled": true,
#     "vector_search_encrypted": true,
#     "response_filtering_enabled": true,
#     "pii_detection_enabled": true,
#     "data_masking_enabled": true,
#     "user_authentication_verified": true,
#     "query_authorization_verified": true,
#     "session_management_enabled": true,
#     "pii_detection_required": true,
#     "data_anonymization_enabled": true,
#     "data_pseudonymization_enabled": true,
#     "query_sanitization_required": true,
#     "query_sanitization_enabled": true,
#     "response_filtering_required": true
#   }
# }
