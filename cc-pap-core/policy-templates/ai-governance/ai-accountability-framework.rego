package controlcore.policy.templates.ai_governance

# Policy to establish AI system accountability framework
# This policy ensures clear accountability for AI system decisions and actions

default allow = false # Deny by default, require explicit accountability

# Allow AI operations with proper accountability
allow {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.accountability_framework_established
  input.context.responsible_party_identified
  input.context.decision_audit_trail_enabled
  input.context.liability_framework_defined
}

# Allow AI operations with proper oversight
allow {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.human_oversight_required
  input.context.oversight_mechanism_implemented
  input.context.escalation_procedures_defined
  input.context.review_process_established
}

# Allow AI operations with proper documentation
allow {
  input.action == "make_ai_decision"
  input.resource.type == "ai_system"
  input.context.decision_documented
  input.context.rationale_provided
  input.context.impact_assessed
  input.context.stakeholders_notified
}

# Deny AI operations without proper accountability
deny {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  not input.context.accountability_framework_established
}

deny {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  not input.context.responsible_party_identified
}

deny {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  not input.context.decision_audit_trail_enabled
}

deny {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  not input.context.liability_framework_defined
}

# Deny AI operations without proper oversight
deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  not input.context.human_oversight_required
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  not input.context.oversight_mechanism_implemented
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  not input.context.escalation_procedures_defined
}

deny {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  not input.context.review_process_established
}

# Deny AI operations without proper documentation
deny {
  input.action == "make_ai_decision"
  input.resource.type == "ai_system"
  not input.context.decision_documented
}

deny {
  input.action == "make_ai_decision"
  input.resource.type == "ai_system"
  not input.context.rationale_provided
}

deny {
  input.action == "make_ai_decision"
  input.resource.type == "ai_system"
  not input.context.impact_assessed
}

deny {
  input.action == "make_ai_decision"
  input.resource.type == "ai_system"
  not input.context.stakeholders_notified
}

# Require accountability for high-risk AI
require_accountability {
  input.action == "deploy_ai_model"
  input.resource.type == "ai_model"
  input.context.risk_level == "high"
  not input.context.accountability_framework_established
}

# Require oversight for autonomous AI
require_oversight {
  input.action == "execute_ai_agent"
  input.resource.type == "ai_agent"
  input.context.autonomy_level == "high"
  not input.context.human_oversight_required
}

# Require documentation for critical decisions
require_documentation {
  input.action == "make_ai_decision"
  input.resource.type == "ai_system"
  input.context.decision_impact == "critical"
  not input.context.decision_documented
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "ai_engineer", "roles": ["ai_developer"]},
#   "action": "deploy_ai_model",
#   "resource": {
#     "id": "autonomous_vehicle_ai",
#     "type": "ai_model",
#     "version": "2.0"
#   },
#   "context": {
#     "accountability_framework_established": true,
#     "responsible_party_identified": true,
#     "decision_audit_trail_enabled": true,
#     "liability_framework_defined": true,
#     "risk_level": "high",
#     "autonomy_level": "high",
#     "decision_impact": "critical"
#   }
# }
