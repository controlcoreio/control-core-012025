package controlcore.policy.templates.api_gateway

# Policy for complex API Gateway access control scenarios
# This policy handles fine-grained access controls for internal and external parties
# with various business case access requirements

default allow = false

# Allow access to internal APIs based on employee role and department
allow {
  input.action == "access_internal_api"
  input.resource.type == "internal_api"
  input.user.employee_type == "internal"
  input.user.department in input.context.allowed_departments
  input.user.role in input.context.allowed_roles
  input.context.internal_api_authenticated
  input.context.department_access_approved
}

# Allow access to external APIs based on partner type and business relationship
allow {
  input.action == "access_external_api"
  input.resource.type == "external_api"
  input.user.partner_type in input.context.allowed_partner_types
  input.context.partner_relationship_active
  input.context.external_api_authenticated
  input.context.business_agreement_valid
  input.context.partner_quota_available
}

# Allow access to premium APIs based on subscription tier and usage limits
allow {
  input.action == "access_premium_api"
  input.resource.type == "premium_api"
  input.user.subscription_tier >= input.resource.required_tier
  input.context.subscription_active
  input.context.usage_within_limits
  input.context.premium_api_authenticated
  input.context.payment_status_current
}

# Allow access to business-specific APIs based on business unit and use case
allow {
  input.action == "access_business_api"
  input.resource.type == "business_api"
  input.user.business_unit in input.context.allowed_business_units
  input.context.business_use_case_approved
  input.context.business_api_authenticated
  input.context.business_quota_available
  input.context.business_hours_access
}

# Allow access to data APIs based on data classification and user clearance
allow {
  input.action == "access_data_api"
  input.resource.type == "data_api"
  input.user.data_clearance_level >= input.resource.required_clearance
  input.context.data_access_approved
  input.context.data_api_authenticated
  input.context.data_classification_match
  input.context.data_retention_compliant
}

# Allow access to integration APIs based on integration type and partner status
allow {
  input.action == "access_integration_api"
  input.resource.type == "integration_api"
  input.user.integration_type in input.context.allowed_integration_types
  input.context.integration_partnership_active
  input.context.integration_api_authenticated
  input.context.integration_quota_available
  input.context.integration_health_check_passed
}

# Deny access if user is not in allowed departments
deny {
  input.action == "access_internal_api"
  input.resource.type == "internal_api"
  not input.user.department in input.context.allowed_departments
}

# Deny access if partner relationship is not active
deny {
  input.action == "access_external_api"
  input.resource.type == "external_api"
  not input.context.partner_relationship_active
}

# Deny access if subscription tier is insufficient
deny {
  input.action == "access_premium_api"
  input.resource.type == "premium_api"
  input.user.subscription_tier < input.resource.required_tier
}

# Deny access if business use case is not approved
deny {
  input.action == "access_business_api"
  input.resource.type == "business_api"
  not input.context.business_use_case_approved
}

# Deny access if data clearance level is insufficient
deny {
  input.action == "access_data_api"
  input.resource.type == "data_api"
  input.user.data_clearance_level < input.resource.required_clearance
}

# Deny access if integration partnership is not active
deny {
  input.action == "access_integration_api"
  input.resource.type == "integration_api"
  not input.context.integration_partnership_active
}

# Require business hours access for business APIs
require_business_hours_access {
  input.action == "access_business_api"
  input.resource.type == "business_api"
  not input.context.business_hours_access
}

# Require data retention compliance
require_data_retention_compliance {
  input.action == "access_data_api"
  input.resource.type == "data_api"
  not input.context.data_retention_compliant
}

# Require integration health check
require_integration_health_check {
  input.action == "access_integration_api"
  input.resource.type == "integration_api"
  not input.context.integration_health_check_passed
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "user_789",
#     "employee_type": "internal",
#     "department": "engineering",
#     "role": "senior_engineer",
#     "partner_type": "premium_partner",
#     "subscription_tier": 3,
#     "business_unit": "product_development",
#     "data_clearance_level": 4,
#     "integration_type": "enterprise_integration"
#   },
#   "action": "access_internal_api",
#   "resource": {
#     "id": "api_001",
#     "type": "internal_api",
#     "api_name": "employee_management_api"
#   },
#   "context": {
#     "allowed_departments": ["engineering", "product", "operations"],
#     "allowed_roles": ["senior_engineer", "architect", "manager"],
#     "allowed_partner_types": ["premium_partner", "enterprise_partner"],
#     "allowed_business_units": ["product_development", "engineering", "operations"],
#     "allowed_integration_types": ["enterprise_integration", "api_integration"],
#     "internal_api_authenticated": true,
#     "department_access_approved": true,
#     "partner_relationship_active": true,
#     "external_api_authenticated": true,
#     "business_agreement_valid": true,
#     "partner_quota_available": true,
#     "subscription_active": true,
#     "usage_within_limits": true,
#     "premium_api_authenticated": true,
#     "payment_status_current": true,
#     "business_use_case_approved": true,
#     "business_api_authenticated": true,
#     "business_quota_available": true,
#     "business_hours_access": true,
#     "data_access_approved": true,
#     "data_api_authenticated": true,
#     "data_classification_match": true,
#     "data_retention_compliant": true,
#     "integration_partnership_active": true,
#     "integration_api_authenticated": true,
#     "integration_quota_available": true,
#     "integration_health_check_passed": true
#   }
# }
