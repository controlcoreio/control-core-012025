package controlcore.policy.templates.template_manager

# Policy Template Registry - Centralized management of all policy templates
# This policy ensures all policy template capabilities are managed in one location

default allow = false # Deny by default, require explicit template registration

# Template registration and management
template_registered {
  input.action == "register_template"
  input.resource.type == "policy_template"
  input.template.id != ""
  input.template.name != ""
  input.template.category != ""
  input.template.version != ""
  input.template.status == "active"
}

template_updated {
  input.action == "update_template"
  input.resource.type == "policy_template"
  input.template.id != ""
  input.template.version != ""
  input.template.status in ["active", "draft", "deprecated"]
}

template_deprecated {
  input.action == "deprecate_template"
  input.resource.type == "policy_template"
  input.template.id != ""
  input.template.status == "deprecated"
  input.context.deprecation_reason != ""
}

# Template categorization and organization
template_categorized {
  input.action == "categorize_template"
  input.resource.type == "policy_template"
  input.template.category in ["compliance", "security", "ai_governance", "pii_management", "data_protection"]
  input.template.subcategory != ""
  input.template.tags != []
}

# Template validation and testing
template_validated {
  input.action == "validate_template"
  input.resource.type == "policy_template"
  input.template.syntax_valid
  input.template.logic_valid
  input.template.compliance_valid
  input.template.security_valid
}

template_tested {
  input.action == "test_template"
  input.resource.type == "policy_template"
  input.template.test_cases_defined
  input.template.test_results_passed
  input.template.performance_validated
}

# Template deployment and lifecycle management
template_deployed {
  input.action == "deploy_template"
  input.resource.type == "policy_template"
  input.template.status == "active"
  input.template.validated
  input.template.tested
  input.context.deployment_approved
}

template_retired {
  input.action == "retire_template"
  input.resource.type == "policy_template"
  input.template.status == "deprecated"
  input.context.retirement_reason != ""
  input.context.migration_path_provided
}

# Template access and usage tracking
template_accessed {
  input.action == "access_template"
  input.resource.type == "policy_template"
  input.template.status == "active"
  input.user.roles[_] in ["template_user", "template_admin", "administrator"]
}

template_used {
  input.action == "use_template"
  input.resource.type == "policy_template"
  input.template.status == "active"
  input.template.validated
  input.user.roles[_] in ["template_user", "template_admin", "administrator"]
  input.context.usage_justified
}

# Template versioning and compatibility
template_versioned {
  input.action == "version_template"
  input.resource.type == "policy_template"
  input.template.version != ""
  input.template.previous_version != ""
  input.template.compatibility_maintained
}

template_compatible {
  input.action == "check_compatibility"
  input.resource.type == "policy_template"
  input.template.version != ""
  input.template.target_version != ""
  input.template.compatibility_status == "compatible"
}

# Template metadata and documentation
template_documented {
  input.action == "document_template"
  input.resource.type == "policy_template"
  input.template.documentation_complete
  input.template.examples_provided
  input.template.usage_guide_available
}

template_metadata_updated {
  input.action == "update_metadata"
  input.resource.type == "policy_template"
  input.template.metadata_updated
  input.template.tags_updated
  input.template.categories_updated
}

# Template security and compliance
template_secure {
  input.action == "secure_template"
  input.resource.type == "policy_template"
  input.template.security_reviewed
  input.template.vulnerability_assessed
  input.template.security_controls_implemented
}

template_compliant {
  input.action == "compliance_check"
  input.resource.type == "policy_template"
  input.template.compliance_frameworks_met
  input.template.regulatory_requirements_satisfied
  input.template.audit_trail_maintained
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "template_admin",
#     "roles": ["template_admin", "administrator"]
#   },
#   "action": "register_template",
#   "resource": {
#     "id": "template_123",
#     "type": "policy_template"
#   },
#   "template": {
#     "id": "fintrac-str-triggers",
#     "name": "FINTRAC STR Triggers",
#     "category": "compliance",
#     "subcategory": "financial",
#     "version": "1.0.0",
#     "status": "active",
#     "tags": ["fintrac", "aml", "compliance"],
#     "syntax_valid": true,
#     "logic_valid": true,
#     "compliance_valid": true,
#     "security_valid": true,
#     "test_cases_defined": true,
#     "test_results_passed": true,
#     "performance_validated": true,
#     "documentation_complete": true,
#     "examples_provided": true,
#     "usage_guide_available": true,
#     "security_reviewed": true,
#     "vulnerability_assessed": true,
#     "security_controls_implemented": true,
#     "compliance_frameworks_met": true,
#     "regulatory_requirements_satisfied": true,
#     "audit_trail_maintained": true
#   },
#   "context": {
#     "deployment_approved": true,
#     "usage_justified": true,
#     "compatibility_status": "compatible"
#   }
# }
