package controlcore.policy.templates.ai_tools

# Policy for RAG system real-time context enforcement
# This policy enables intelligent real-time decisions for RAG systems
# based on various integrations like IAM and other context sources

default allow = false

# Allow RAG system access based on real-time context and user permissions
allow {
  input.action == "access_rag_system"
  input.resource.type == "rag_system"
  input.context.user_authenticated
  input.context.user_has_rag_permissions
  input.context.rag_system_available
  input.context.real_time_context_valid
  input.context.iam_integration_active
  input.context.context_sources_available
}

# Allow RAG system data access based on real-time data classification
allow {
  input.action == "access_rag_system_data"
  input.resource.type == "rag_system_data"
  input.context.data_classification in input.context.allowed_data_classifications
  input.context.real_time_data_access_approved
  input.context.data_privacy_compliant
  input.context.iam_data_permissions_valid
  input.context.context_sources_authenticated
}

# Allow RAG system model access based on real-time model availability
allow {
  input.action == "access_rag_system_model"
  input.resource.type == "rag_system_model"
  input.context.model_available
  input.context.model_permissions_valid
  input.context.real_time_model_access_approved
  input.context.model_quota_available
  input.context.context_sources_healthy
}

# Allow RAG system workflow execution based on real-time workflow context
allow {
  input.action == "execute_rag_system_workflow"
  input.resource.type == "rag_system_workflow"
  input.context.workflow_available
  input.context.workflow_permissions_valid
  input.context.real_time_workflow_access_approved
  input.context.workflow_quota_available
  input.context.context_sources_workflow_ready
}

# Allow RAG system integration access based on real-time integration context
allow {
  input.action == "access_rag_system_integration"
  input.resource.type == "rag_system_integration"
  input.context.integration_available
  input.context.integration_permissions_valid
  input.context.real_time_integration_access_approved
  input.context.integration_quota_available
  input.context.context_sources_integration_ready
}

# Allow RAG system decision making based on real-time decision context
allow {
  input.action == "make_rag_system_decision"
  input.resource.type == "rag_system_decision"
  input.context.decision_context_valid
  input.context.decision_permissions_valid
  input.context.real_time_decision_access_approved
  input.context.decision_quota_available
  input.context.context_sources_decision_ready
}

# Deny access if user is not authenticated
deny {
  input.action == "access_rag_system"
  input.resource.type == "rag_system"
  not input.context.user_authenticated
}

# Deny access if user lacks RAG permissions
deny {
  input.action == "access_rag_system"
  input.resource.type == "rag_system"
  not input.context.user_has_rag_permissions
}

# Deny access if RAG system is not available
deny {
  input.action == "access_rag_system"
  input.resource.type == "rag_system"
  not input.context.rag_system_available
}

# Deny access if real-time context is not valid
deny {
  input.action == "access_rag_system"
  input.resource.type == "rag_system"
  not input.context.real_time_context_valid
}

# Deny access if IAM integration is not active
deny {
  input.action == "access_rag_system"
  input.resource.type == "rag_system"
  not input.context.iam_integration_active
}

# Deny access if context sources are not available
deny {
  input.action == "access_rag_system"
  input.resource.type == "rag_system"
  not input.context.context_sources_available
}

# Require data privacy compliance
require_data_privacy_compliance {
  input.action == "access_rag_system_data"
  input.resource.type == "rag_system_data"
  not input.context.data_privacy_compliant
}

# Require model quota availability
require_model_quota_availability {
  input.action == "access_rag_system_model"
  input.resource.type == "rag_system_model"
  not input.context.model_quota_available
}

# Require workflow quota availability
require_workflow_quota_availability {
  input.action == "execute_rag_system_workflow"
  input.resource.type == "rag_system_workflow"
  not input.context.workflow_quota_available
}

# Require integration quota availability
require_integration_quota_availability {
  input.action == "access_rag_system_integration"
  input.resource.type == "rag_system_integration"
  not input.context.integration_quota_available
}

# Require decision quota availability
require_decision_quota_availability {
  input.action == "make_rag_system_decision"
  input.resource.type == "rag_system_decision"
  not input.context.decision_quota_available
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "user_303",
#     "role": "data_scientist",
#     "permissions": ["rag_system_access", "rag_system_data_access", "rag_system_model_access"]
#   },
#   "action": "access_rag_system",
#   "resource": {
#     "id": "rag_system_001",
#     "type": "rag_system",
#     "system_name": "enterprise_knowledge_base"
#   },
#   "context": {
#     "allowed_data_classifications": ["public", "internal", "confidential"],
#     "user_authenticated": true,
#     "user_has_rag_permissions": true,
#     "rag_system_available": true,
#     "real_time_context_valid": true,
#     "iam_integration_active": true,
#     "context_sources_available": true,
#     "real_time_data_access_approved": true,
#     "data_privacy_compliant": true,
#     "iam_data_permissions_valid": true,
#     "context_sources_authenticated": true,
#     "model_available": true,
#     "model_permissions_valid": true,
#     "real_time_model_access_approved": true,
#     "model_quota_available": true,
#     "context_sources_healthy": true,
#     "workflow_available": true,
#     "workflow_permissions_valid": true,
#     "real_time_workflow_access_approved": true,
#     "workflow_quota_available": true,
#     "context_sources_workflow_ready": true,
#     "integration_available": true,
#     "integration_permissions_valid": true,
#     "real_time_integration_access_approved": true,
#     "integration_quota_available": true,
#     "context_sources_integration_ready": true,
#     "decision_context_valid": true,
#     "decision_permissions_valid": true,
#     "real_time_decision_access_approved": true,
#     "decision_quota_available": true,
#     "context_sources_decision_ready": true
#   }
# }
