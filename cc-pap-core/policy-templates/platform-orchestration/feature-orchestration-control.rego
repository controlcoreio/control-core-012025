package controlcore.policy.templates.platform_orchestration

# Policy for feature orchestration control in platform environments
# This policy enables fine-grained control over feature access and orchestration
# based on user roles, business context, and platform capabilities

default allow = false

# Allow access to orchestrated features based on user role and business context
allow {
  input.action == "access_orchestrated_feature"
  input.resource.type == "orchestrated_feature"
  input.user.role in input.context.allowed_roles
  input.context.feature_available
  input.context.user_has_feature_access
  input.context.business_context_valid
}

# Allow access to platform capabilities based on user permissions
allow {
  input.action == "access_platform_capability"
  input.resource.type == "platform_capability"
  input.user.permissions[_] in input.context.required_permissions
  input.context.capability_enabled
  input.context.user_has_capability_access
  input.context.platform_health_check_passed
}

# Allow access to vendor integrations based on integration type and user clearance
allow {
  input.action == "access_vendor_integration"
  input.resource.type == "vendor_integration"
  input.user.integration_clearance[_] == input.resource.integration_type
  input.context.integration_approved
  input.context.vendor_authentication_valid
  input.context.integration_health_check_passed
}

# Allow access to orchestrated workflows based on workflow permissions
allow {
  input.action == "execute_orchestrated_workflow"
  input.resource.type == "orchestrated_workflow"
  input.user.workflow_permissions[_] == input.resource.workflow_id
  input.context.workflow_approved
  input.context.workflow_environment_ready
  input.context.user_has_workflow_execution_rights
}

# Allow access to platform services based on service tier and user subscription
allow {
  input.action == "access_platform_service"
  input.resource.type == "platform_service"
  input.user.subscription_tier >= input.resource.required_tier
  input.context.service_available
  input.context.user_has_service_access
  input.context.service_quota_available
}

# Deny access if feature is not available
deny {
  input.action == "access_orchestrated_feature"
  input.resource.type == "orchestrated_feature"
  not input.context.feature_available
}

# Deny access if user lacks required permissions
deny {
  input.action == "access_platform_capability"
  input.resource.type == "platform_capability"
  not input.user.permissions[_] in input.context.required_permissions
}

# Deny access if integration is not approved
deny {
  input.action == "access_vendor_integration"
  input.resource.type == "vendor_integration"
  not input.context.integration_approved
}

# Deny access if workflow is not approved
deny {
  input.action == "execute_orchestrated_workflow"
  input.resource.type == "orchestrated_workflow"
  not input.context.workflow_approved
}

# Deny access if user subscription tier is insufficient
deny {
  input.action == "access_platform_service"
  input.resource.type == "platform_service"
  input.user.subscription_tier < input.resource.required_tier
}

# Require business context validation
require_business_context_validation {
  input.action == "access_orchestrated_feature"
  input.resource.type == "orchestrated_feature"
  not input.context.business_context_valid
}

# Require platform health check
require_platform_health_check {
  input.action == "access_platform_capability"
  input.resource.type == "platform_capability"
  not input.context.platform_health_check_passed
}

# Require vendor authentication
require_vendor_authentication {
  input.action == "access_vendor_integration"
  input.resource.type == "vendor_integration"
  not input.context.vendor_authentication_valid
}

# Require workflow environment readiness
require_workflow_environment_readiness {
  input.action == "execute_orchestrated_workflow"
  input.resource.type == "orchestrated_workflow"
  not input.context.workflow_environment_ready
}

# Require service quota availability
require_service_quota_availability {
  input.action == "access_platform_service"
  input.resource.type == "platform_service"
  not input.context.service_quota_available
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "user_456",
#     "role": "platform_engineer",
#     "permissions": ["feature_access", "capability_management", "workflow_execution"],
#     "integration_clearance": ["vendor_a", "vendor_b", "vendor_c"],
#     "workflow_permissions": ["workflow_001", "workflow_002"],
#     "subscription_tier": 3
#   },
#   "action": "access_orchestrated_feature",
#   "resource": {
#     "id": "feature_001",
#     "type": "orchestrated_feature",
#     "feature_name": "advanced_analytics"
#   },
#   "context": {
#     "allowed_roles": ["platform_engineer", "platform_admin", "architect"],
#     "required_permissions": ["feature_access", "capability_management"],
#     "feature_available": true,
#     "user_has_feature_access": true,
#     "business_context_valid": true,
#     "capability_enabled": true,
#     "user_has_capability_access": true,
#     "platform_health_check_passed": true,
#     "integration_approved": true,
#     "vendor_authentication_valid": true,
#     "integration_health_check_passed": true,
#     "workflow_approved": true,
#     "workflow_environment_ready": true,
#     "user_has_workflow_execution_rights": true,
#     "service_available": true,
#     "user_has_service_access": true,
#     "service_quota_available": true
#   }
# }
