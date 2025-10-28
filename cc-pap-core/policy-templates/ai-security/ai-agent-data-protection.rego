package controlcore.policy.templates.ai_security

# Policy to enforce data protection for AI Agents
# This policy ensures sensitive data is properly protected in AI agent implementations

default allow = false # Deny by default, require explicit data protection measures

# Allow AI agent access with proper data protection
allow {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_encryption_enabled
  input.context.agent_data_encryption_enabled
  input.context.agent_communication_encrypted
  input.context.agent_audit_logging_enabled
  input.context.agent_decision_logging_enabled
}

# Enhanced protection for sensitive AI agent operations
allow {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.data_classification == "sensitive"
  input.context.agent_pii_detection_enabled
  input.context.agent_data_masking_enabled
  input.context.agent_response_filtering_enabled
  input.context.agent_context_filtering_enabled
  input.context.agent_decision_filtering_enabled
}

# Allow AI agent access with proper access controls
allow {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.user.roles[_] in ["agent_user", "agent_operator", "agent_administrator"]
  input.context.user_authentication_verified
  input.context.agent_authorization_verified
  input.context.agent_session_management_enabled
  input.context.agent_rate_limiting_enabled
}

# Deny AI agent access without proper encryption
deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  not input.context.agent_encryption_enabled
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  not input.context.agent_data_encryption_enabled
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  not input.context.agent_communication_encrypted
}

# Deny AI agent access for sensitive data without proper protection
deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.data_classification == "sensitive"
  not input.context.agent_pii_detection_enabled
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.data_classification == "sensitive"
  not input.context.agent_data_masking_enabled
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.data_classification == "sensitive"
  not input.context.agent_response_filtering_enabled
}

# Deny AI agent access without proper agent protection
deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_protection_required
  not input.context.agent_decision_filtering_enabled
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_protection_required
  not input.context.agent_context_filtering_enabled
}

# Require agent data anonymization
require_agent_data_anonymization {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.data_classification == "personal"
  not input.context.agent_data_anonymization_enabled
}

# Require agent data pseudonymization
require_agent_data_pseudonymization {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.data_classification == "confidential"
  not input.context.agent_data_pseudonymization_enabled
}

# Require agent decision sanitization
require_agent_decision_sanitization {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_decision_sanitization_required
  not input.context.agent_decision_sanitization_enabled
}

# Require agent response filtering
require_agent_response_filtering {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_response_filtering_required
  not input.context.agent_response_filtering_enabled
}

# Require agent decision transparency
require_agent_decision_transparency {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_decision_transparency_required
  not input.context.agent_decision_transparency_enabled
}

# Require agent accountability
require_agent_accountability {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_accountability_required
  not input.context.agent_accountability_enabled
}

# Require agent human oversight
require_agent_human_oversight {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_human_oversight_required
  not input.context.agent_human_oversight_enabled
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "agent_operator_1",
#     "roles": ["agent_user", "agent_operator"]
#   },
#   "action": "execute_ai_agent",
#   "resource": {
#     "id": "customer_service_agent",
#     "type": "ai_agent",
#     "agent_name": "enterprise_customer_service_agent"
#   },
#   "context": {
#     "agent_encryption_enabled": true,
#     "agent_data_encryption_enabled": true,
#     "agent_communication_encrypted": true,
#     "agent_audit_logging_enabled": true,
#     "agent_decision_logging_enabled": true,
#     "data_classification": "sensitive",
#     "agent_pii_detection_enabled": true,
#     "agent_data_masking_enabled": true,
#     "agent_response_filtering_enabled": true,
#     "agent_context_filtering_enabled": true,
#     "agent_decision_filtering_enabled": true,
#     "user_authentication_verified": true,
#     "agent_authorization_verified": true,
#     "agent_session_management_enabled": true,
#     "agent_rate_limiting_enabled": true,
#     "agent_protection_required": true,
#     "agent_data_anonymization_enabled": true,
#     "agent_data_pseudonymization_enabled": true,
#     "agent_decision_sanitization_required": true,
#     "agent_decision_sanitization_enabled": true,
#     "agent_response_filtering_required": true,
#     "agent_decision_transparency_required": true,
#     "agent_decision_transparency_enabled": true,
#     "agent_accountability_required": true,
#     "agent_accountability_enabled": true,
#     "agent_human_oversight_required": true,
#     "agent_human_oversight_enabled": true
#   }
# }
