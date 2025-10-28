package controlcore.policy.templates.ai_governance

# Policy to enforce AI ethics and responsible AI practices
# This policy ensures AI systems operate within ethical boundaries

default allow = false # Deny by default, require explicit ethical compliance

# Allow AI operations that meet ethical standards
allow {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.ethics_review_completed
  input.context.bias_assessment_passed
  input.context.fairness_verified
  input.context.transparency_ensured
  input.context.accountability_established
}

# Allow AI operations with proper oversight
allow {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.ethics_committee_approval
  input.context.human_oversight_enabled
  input.context.audit_trail_maintained
  input.context.explainability_provided
}

# Allow AI operations with proper consent
allow {
  input.action == "process_personal_data"
  input.resource.type == "ai_system"
  input.context.consent_obtained
  input.context.data_subject_rights_respected
  input.context.privacy_by_design_implemented
  input.context.data_minimization_applied
}

# Deny AI operations that violate ethical principles
deny {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.bias_detected
}

deny {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.discrimination_risk_high
}

deny {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.transparency_insufficient
}

deny {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.accountability_unclear
}

# Deny AI operations without proper oversight
deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  not input.context.human_oversight_enabled
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  not input.context.audit_trail_maintained
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  not input.context.explainability_provided
}

# Deny AI operations without proper consent
deny {
  input.action == "process_personal_data"
  input.resource.type == "ai_system"
  not input.context.consent_obtained
}

deny {
  input.action == "process_personal_data"
  input.resource.type == "ai_system"
  not input.context.data_subject_rights_respected
}

deny {
  input.action == "process_personal_data"
  input.resource.type == "ai_system"
  not input.context.privacy_by_design_implemented
}

# Require ethical review for high-risk AI
require_ethical_review {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.risk_level == "high"
  not input.context.ethics_review_completed
}

# Require bias assessment for AI models
require_bias_assessment {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.bias_assessment_required
  not input.context.bias_assessment_passed
}

# Require fairness verification for AI models
require_fairness_verification {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.fairness_verification_required
  not input.context.fairness_verified
}

# Require transparency for AI models
require_transparency {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.transparency_required
  not input.context.transparency_ensured
}

# Require accountability for AI models
require_accountability {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.accountability_required
  not input.context.accountability_established
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
#     "ethics_review_completed": true,
#     "bias_assessment_passed": true,
#     "fairness_verified": true,
#     "transparency_ensured": true,
#     "accountability_established": true,
#     "risk_level": "medium",
#     "bias_assessment_required": true,
#     "fairness_verification_required": true,
#     "transparency_required": true,
#     "accountability_required": true
#   }
# }
