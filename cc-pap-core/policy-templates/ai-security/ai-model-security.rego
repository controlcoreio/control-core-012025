package controlcore.policy.templates.ai_security

# Policy to enforce AI model and agent security requirements
# This policy ensures AI models and agents operate within secure boundaries

default allow = false

# Allow AI model deployment if security requirements are met
allow {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.security_scan_passed
  input.context.model_signed
  input.context.vulnerability_assessment_completed
  input.context.access_controls_configured
}

# Allow AI agent execution if security policies are enforced
allow {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_authenticated
  input.context.rate_limits_enforced
  input.context.output_filtering_enabled
  input.context.audit_logging_enabled
}

# Deny AI model access if security requirements are not met
deny {
  input.action == "access_ai_model"
  input.resource.type == "ai_model"
  not input.context.model_encrypted
}

deny {
  input.action == "access_ai_model"
  input.resource.type == "ai_model"
  not input.context.access_controls_configured
}

# AI agent behavior restrictions
deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_capabilities contains "system_access"
  not input.context.supervisor_approval
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.agent_capabilities contains "data_modification"
  not input.context.data_protection_enabled
}

# Model versioning and rollback security
allow {
  input.action == "rollback_ai_model"
  input.resource.type == "ai_model"
  input.context.rollback_authorized
  input.context.previous_version_secure
  input.context.rollback_impact_assessed
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "ai_engineer", "roles": ["ai_developer"]},
#   "action": "deploy_ai_model",
#   "resource": {
#     "id": "fraud_detection_v3",
#     "type": "ai_model",
#     "version": "3.0"
#   },
#   "context": {
#     "security_scan_passed": true,
#     "model_signed": true,
#     "vulnerability_assessment_completed": true,
#     "access_controls_configured": true,
#     "model_encrypted": true
#   }
# }
