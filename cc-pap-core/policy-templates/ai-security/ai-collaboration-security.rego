package controlcore.policy.templates.ai_security

# Policy to enforce collaboration security for AI tools
# This policy ensures secure collaboration when AI tools are used in team environments

default allow = false # Deny by default, require explicit collaboration security measures

# Allow AI collaboration with proper security measures
allow {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.collaboration_encryption_enabled
  input.context.collaboration_authentication_required
  input.context.collaboration_authorization_verified
  input.context.collaboration_audit_logging_enabled
  input.context.collaboration_session_management_enabled
}

# Enhanced protection for sensitive AI collaboration
allow {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.data_classification == "sensitive"
  input.context.collaboration_pii_detection_enabled
  input.context.collaboration_data_masking_enabled
  input.context.collaboration_response_filtering_enabled
  input.context.collaboration_context_filtering_enabled
  input.context.collaboration_decision_filtering_enabled
}

# Allow AI collaboration with proper access controls
allow {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.user.roles[_] in ["collaboration_user", "team_member", "project_member"]
  input.context.user_authentication_verified
  input.context.collaboration_authorization_verified
  input.context.collaboration_session_management_enabled
  input.context.collaboration_rate_limiting_enabled
}

# Deny AI collaboration without proper encryption
deny {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  not input.context.collaboration_encryption_enabled
}

deny {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  not input.context.collaboration_authentication_required
}

deny {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  not input.context.collaboration_authorization_verified
}

# Deny AI collaboration for sensitive data without proper protection
deny {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.data_classification == "sensitive"
  not input.context.collaboration_pii_detection_enabled
}

deny {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.data_classification == "sensitive"
  not input.context.collaboration_data_masking_enabled
}

deny {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.data_classification == "sensitive"
  not input.context.collaboration_response_filtering_enabled
}

# Deny AI collaboration without proper collaboration protection
deny {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.collaboration_protection_required
  not input.context.collaboration_decision_filtering_enabled
}

deny {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.collaboration_protection_required
  not input.context.collaboration_context_filtering_enabled
}

# Require collaboration data anonymization
require_collaboration_data_anonymization {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.data_classification == "personal"
  not input.context.collaboration_data_anonymization_enabled
}

# Require collaboration data pseudonymization
require_collaboration_data_pseudonymization {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.data_classification == "confidential"
  not input.context.collaboration_data_pseudonymization_enabled
}

# Require collaboration decision sanitization
require_collaboration_decision_sanitization {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.collaboration_decision_sanitization_required
  not input.context.collaboration_decision_sanitization_enabled
}

# Require collaboration response filtering
require_collaboration_response_filtering {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.collaboration_response_filtering_required
  not input.context.collaboration_response_filtering_enabled
}

# Require collaboration decision transparency
require_collaboration_decision_transparency {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.collaboration_decision_transparency_required
  not input.context.collaboration_decision_transparency_enabled
}

# Require collaboration accountability
require_collaboration_accountability {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.collaboration_accountability_required
  not input.context.collaboration_accountability_enabled
}

# Require collaboration human oversight
require_collaboration_human_oversight {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.collaboration_human_oversight_required
  not input.context.collaboration_human_oversight_enabled
}

# Require collaboration team authorization
require_collaboration_team_authorization {
  input.action == "collaborate_with_ai"
  input.resource.type == "ai_collaboration_tool"
  input.context.collaboration_team_authorization_required
  not input.context.collaboration_team_authorization_enabled
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "team_member_1",
#     "roles": ["collaboration_user", "team_member"]
#   },
#   "action": "collaborate_with_ai",
#   "resource": {
#     "id": "team_ai_collaboration",
#     "type": "ai_collaboration_tool",
#     "tool_name": "enterprise_ai_collaboration_platform"
#   },
#   "context": {
#     "collaboration_encryption_enabled": true,
#     "collaboration_authentication_required": true,
#     "collaboration_authorization_verified": true,
#     "collaboration_audit_logging_enabled": true,
#     "collaboration_session_management_enabled": true,
#     "data_classification": "sensitive",
#     "collaboration_pii_detection_enabled": true,
#     "collaboration_data_masking_enabled": true,
#     "collaboration_response_filtering_enabled": true,
#     "collaboration_context_filtering_enabled": true,
#     "collaboration_decision_filtering_enabled": true,
#     "user_authentication_verified": true,
#     "collaboration_authorization_verified": true,
#     "collaboration_session_management_enabled": true,
#     "collaboration_rate_limiting_enabled": true,
#     "collaboration_protection_required": true,
#     "collaboration_data_anonymization_enabled": true,
#     "collaboration_data_pseudonymization_enabled": true,
#     "collaboration_decision_sanitization_required": true,
#     "collaboration_decision_sanitization_enabled": true,
#     "collaboration_response_filtering_required": true,
#     "collaboration_decision_transparency_required": true,
#     "collaboration_decision_transparency_enabled": true,
#     "collaboration_accountability_required": true,
#     "collaboration_accountability_enabled": true,
#     "collaboration_human_oversight_required": true,
#     "collaboration_human_oversight_enabled": true,
#     "collaboration_team_authorization_required": true,
#     "collaboration_team_authorization_enabled": true
#   }
# }
