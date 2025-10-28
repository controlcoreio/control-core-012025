package controlcore.policy.templates.ai_security

# Policy to enforce data protection for Gen AI Chat systems
# This policy ensures sensitive data is properly protected in AI chat implementations

default allow = false # Deny by default, require explicit data protection measures

# Allow AI chat access with proper data protection
allow {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.conversation_encryption_enabled
  input.context.message_encryption_enabled
  input.context.context_encryption_enabled
  input.context.audit_logging_enabled
  input.context.conversation_history_encrypted
}

# Enhanced protection for sensitive AI chat conversations
allow {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.data_classification == "sensitive"
  input.context.pii_detection_enabled
  input.context.data_masking_enabled
  input.context.response_filtering_enabled
  input.context.context_filtering_enabled
  input.context.conversation_sanitization_enabled
}

# Allow AI chat access with proper access controls
allow {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.user.roles[_] in ["chat_user", "customer_service", "support_agent"]
  input.context.user_authentication_verified
  input.context.chat_authorization_verified
  input.context.session_management_enabled
  input.context.rate_limiting_enabled
}

# Deny AI chat access without proper encryption
deny {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  not input.context.conversation_encryption_enabled
}

deny {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  not input.context.message_encryption_enabled
}

deny {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  not input.context.context_encryption_enabled
}

# Deny AI chat access for sensitive data without proper protection
deny {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.data_classification == "sensitive"
  not input.context.pii_detection_enabled
}

deny {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.data_classification == "sensitive"
  not input.context.data_masking_enabled
}

deny {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.data_classification == "sensitive"
  not input.context.response_filtering_enabled
}

# Deny AI chat access without proper conversation protection
deny {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.conversation_protection_required
  not input.context.conversation_sanitization_enabled
}

deny {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.conversation_protection_required
  not input.context.context_filtering_enabled
}

# Require conversation anonymization for AI chat
require_conversation_anonymization {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.data_classification == "personal"
  not input.context.conversation_anonymization_enabled
}

# Require conversation pseudonymization for AI chat
require_conversation_pseudonymization {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.data_classification == "confidential"
  not input.context.conversation_pseudonymization_enabled
}

# Require message sanitization for AI chat
require_message_sanitization {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.message_sanitization_required
  not input.context.message_sanitization_enabled
}

# Require response filtering for AI chat
require_response_filtering {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.response_filtering_required
  not input.context.response_filtering_enabled
}

# Require conversation retention controls
require_conversation_retention_controls {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.conversation_retention_required
  not input.context.conversation_retention_controls_enabled
}

# Require conversation deletion controls
require_conversation_deletion_controls {
  input.action == "chat_with_ai"
  input.resource.type == "ai_chat_system"
  input.context.conversation_deletion_required
  not input.context.conversation_deletion_controls_enabled
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "customer_service_1",
#     "roles": ["chat_user", "customer_service"]
#   },
#   "action": "chat_with_ai",
#   "resource": {
#     "id": "customer_support_chat",
#     "type": "ai_chat_system",
#     "system_name": "enterprise_customer_support"
#   },
#   "context": {
#     "conversation_encryption_enabled": true,
#     "message_encryption_enabled": true,
#     "context_encryption_enabled": true,
#     "audit_logging_enabled": true,
#     "conversation_history_encrypted": true,
#     "data_classification": "sensitive",
#     "pii_detection_enabled": true,
#     "data_masking_enabled": true,
#     "response_filtering_enabled": true,
#     "context_filtering_enabled": true,
#     "conversation_sanitization_enabled": true,
#     "user_authentication_verified": true,
#     "chat_authorization_verified": true,
#     "session_management_enabled": true,
#     "rate_limiting_enabled": true,
#     "conversation_protection_required": true,
#     "conversation_anonymization_enabled": true,
#     "conversation_pseudonymization_enabled": true,
#     "message_sanitization_required": true,
#     "message_sanitization_enabled": true,
#     "response_filtering_required": true,
#     "conversation_retention_required": true,
#     "conversation_retention_controls_enabled": true,
#     "conversation_deletion_required": true,
#     "conversation_deletion_controls_enabled": true
#   }
# }
