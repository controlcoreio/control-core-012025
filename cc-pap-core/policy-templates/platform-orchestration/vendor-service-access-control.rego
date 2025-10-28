package controlcore.policy.templates.platform_orchestration

# Policy for platform orchestration with vendor service access control
# This policy enables platform owners to control access to external vendor services
# based on company IAM groups and roles without manual cloud infrastructure management

default allow = false

# Allow access to vendor services based on IAM group membership
allow {
  input.action == "access_vendor_service"
  input.resource.type == "vendor_service"
  input.user.iam_groups[_] in input.context.allowed_iam_groups
  input.context.vendor_service_approved
  input.context.platform_access_enabled
}

# Allow access to specific vendor capabilities based on user roles
allow {
  input.action == "access_vendor_capability"
  input.resource.type == "vendor_capability"
  input.user.iam_roles[_] in input.context.allowed_iam_roles
  input.context.capability_access_approved
  input.context.user_has_required_permissions
}

# Allow access to orchestrated features based on business unit
allow {
  input.action == "access_orchestrated_feature"
  input.resource.type == "orchestrated_feature"
  input.user.business_unit in input.context.allowed_business_units
  input.context.feature_access_approved
  input.context.user_has_feature_permissions
}

# Allow access to vendor APIs based on department and clearance level
allow {
  input.action == "access_vendor_api"
  input.resource.type == "vendor_api"
  input.user.department in input.context.allowed_departments
  input.user.clearance_level >= input.context.required_clearance_level
  input.context.api_access_approved
  input.context.vendor_api_authenticated
}

# Deny access if vendor service is not approved
deny {
  input.action == "access_vendor_service"
  input.resource.type == "vendor_service"
  not input.context.vendor_service_approved
}

# Deny access if user is not in allowed IAM groups
deny {
  input.action == "access_vendor_service"
  input.resource.type == "vendor_service"
  not input.user.iam_groups[_] in input.context.allowed_iam_groups
}

# Deny access if platform access is disabled
deny {
  input.action == "access_vendor_service"
  input.resource.type == "vendor_service"
  not input.context.platform_access_enabled
}

# Deny access if capability is not approved
deny {
  input.action == "access_vendor_capability"
  input.resource.type == "vendor_capability"
  not input.context.capability_access_approved
}

# Deny access if user lacks required permissions
deny {
  input.action == "access_vendor_capability"
  input.resource.type == "vendor_capability"
  not input.context.user_has_required_permissions
}

# Require vendor service authentication
require_vendor_authentication {
  input.action == "access_vendor_service"
  input.resource.type == "vendor_service"
  not input.context.vendor_service_authenticated
}

# Require platform access approval
require_platform_access_approval {
  input.action == "access_orchestrated_feature"
  input.resource.type == "orchestrated_feature"
  not input.context.platform_access_approved
}

# Require business unit authorization
require_business_unit_authorization {
  input.action == "access_orchestrated_feature"
  input.resource.type == "orchestrated_feature"
  not input.context.business_unit_authorized
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "user_123",
#     "iam_groups": ["platform_engineers", "devops_team"],
#     "iam_roles": ["senior_engineer", "platform_admin"],
#     "business_unit": "engineering",
#     "department": "platform_engineering",
#     "clearance_level": 5
#   },
#   "action": "access_vendor_service",
#   "resource": {
#     "id": "vendor_service_001",
#     "type": "vendor_service",
#     "vendor_name": "external_vendor_a"
#   },
#   "context": {
#     "allowed_iam_groups": ["platform_engineers", "devops_team", "senior_managers"],
#     "allowed_iam_roles": ["senior_engineer", "platform_admin", "architect"],
#     "allowed_business_units": ["engineering", "product", "operations"],
#     "allowed_departments": ["platform_engineering", "devops", "security"],
#     "required_clearance_level": 3,
#     "vendor_service_approved": true,
#     "platform_access_enabled": true,
#     "capability_access_approved": true,
#     "user_has_required_permissions": true,
#     "feature_access_approved": true,
#     "user_has_feature_permissions": true,
#     "api_access_approved": true,
#     "vendor_api_authenticated": true,
#     "vendor_service_authenticated": true,
#     "platform_access_approved": true,
#     "business_unit_authorized": true
#   }
# }
