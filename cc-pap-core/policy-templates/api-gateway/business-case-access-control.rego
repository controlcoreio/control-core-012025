package controlcore.policy.templates.api_gateway

# Policy for business case access control in API Gateway environments
# This policy handles complex business scenarios with fine-grained access controls
# for different business cases and use cases

default allow = false

# Allow access to customer onboarding APIs based on business case and user role
allow {
  input.action == "access_customer_onboarding_api"
  input.resource.type == "customer_onboarding_api"
  input.user.role in input.context.allowed_onboarding_roles
  input.context.onboarding_business_case_approved
  input.context.customer_onboarding_authenticated
  input.context.onboarding_quota_available
  input.context.onboarding_workflow_active
}

# Allow access to payment processing APIs based on business case and compliance
allow {
  input.action == "access_payment_processing_api"
  input.resource.type == "payment_processing_api"
  input.user.payment_clearance_level >= input.resource.required_clearance
  input.context.payment_business_case_approved
  input.context.payment_processing_authenticated
  input.context.pci_compliance_valid
  input.context.payment_quota_available
  input.context.payment_workflow_active
}

# Allow access to analytics APIs based on business case and data access rights
allow {
  input.action == "access_analytics_api"
  input.resource.type == "analytics_api"
  input.user.analytics_permissions[_] in input.context.required_analytics_permissions
  input.context.analytics_business_case_approved
  input.context.analytics_authenticated
  input.context.data_privacy_compliant
  input.context.analytics_quota_available
  input.context.analytics_workflow_active
}

# Allow access to reporting APIs based on business case and reporting rights
allow {
  input.action == "access_reporting_api"
  input.resource.type == "reporting_api"
  input.user.reporting_permissions[_] in input.context.required_reporting_permissions
  input.context.reporting_business_case_approved
  input.context.reporting_authenticated
  input.context.reporting_compliance_valid
  input.context.reporting_quota_available
  input.context.reporting_workflow_active
}

# Allow access to integration APIs based on business case and integration rights
allow {
  input.action == "access_integration_api"
  input.resource.type == "integration_api"
  input.user.integration_permissions[_] in input.context.required_integration_permissions
  input.context.integration_business_case_approved
  input.context.integration_authenticated
  input.context.integration_compliance_valid
  input.context.integration_quota_available
  input.context.integration_workflow_active
}

# Allow access to workflow APIs based on business case and workflow rights
allow {
  input.action == "access_workflow_api"
  input.resource.type == "workflow_api"
  input.user.workflow_permissions[_] in input.context.required_workflow_permissions
  input.context.workflow_business_case_approved
  input.context.workflow_authenticated
  input.context.workflow_compliance_valid
  input.context.workflow_quota_available
  input.context.workflow_workflow_active
}

# Deny access if business case is not approved
deny {
  input.action == "access_customer_onboarding_api"
  input.resource.type == "customer_onboarding_api"
  not input.context.onboarding_business_case_approved
}

# Deny access if payment clearance level is insufficient
deny {
  input.action == "access_payment_processing_api"
  input.resource.type == "payment_processing_api"
  input.user.payment_clearance_level < input.resource.required_clearance
}

# Deny access if analytics permissions are insufficient
deny {
  input.action == "access_analytics_api"
  input.resource.type == "analytics_api"
  not input.user.analytics_permissions[_] in input.context.required_analytics_permissions
}

# Deny access if reporting permissions are insufficient
deny {
  input.action == "access_reporting_api"
  input.resource.type == "reporting_api"
  not input.user.reporting_permissions[_] in input.context.required_reporting_permissions
}

# Deny access if integration permissions are insufficient
deny {
  input.action == "access_integration_api"
  input.resource.type == "integration_api"
  not input.user.integration_permissions[_] in input.context.required_integration_permissions
}

# Deny access if workflow permissions are insufficient
deny {
  input.action == "access_workflow_api"
  input.resource.type == "workflow_api"
  not input.user.workflow_permissions[_] in input.context.required_workflow_permissions
}

# Require PCI compliance for payment processing
require_pci_compliance {
  input.action == "access_payment_processing_api"
  input.resource.type == "payment_processing_api"
  not input.context.pci_compliance_valid
}

# Require data privacy compliance for analytics
require_data_privacy_compliance {
  input.action == "access_analytics_api"
  input.resource.type == "analytics_api"
  not input.context.data_privacy_compliant
}

# Require reporting compliance
require_reporting_compliance {
  input.action == "access_reporting_api"
  input.resource.type == "reporting_api"
  not input.context.reporting_compliance_valid
}

# Require integration compliance
require_integration_compliance {
  input.action == "access_integration_api"
  input.resource.type == "integration_api"
  not input.context.integration_compliance_valid
}

# Require workflow compliance
require_workflow_compliance {
  input.action == "access_workflow_api"
  input.resource.type == "workflow_api"
  not input.context.workflow_compliance_valid
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "user_101",
#     "role": "business_analyst",
#     "payment_clearance_level": 3,
#     "analytics_permissions": ["read_analytics", "export_analytics"],
#     "reporting_permissions": ["generate_reports", "export_reports"],
#     "integration_permissions": ["api_integration", "data_integration"],
#     "workflow_permissions": ["workflow_execution", "workflow_management"]
#   },
#   "action": "access_analytics_api",
#   "resource": {
#     "id": "analytics_api_001",
#     "type": "analytics_api",
#     "api_name": "business_analytics_api"
#   },
#   "context": {
#     "allowed_onboarding_roles": ["business_analyst", "customer_success", "sales"],
#     "required_analytics_permissions": ["read_analytics", "export_analytics"],
#     "required_reporting_permissions": ["generate_reports", "export_reports"],
#     "required_integration_permissions": ["api_integration", "data_integration"],
#     "required_workflow_permissions": ["workflow_execution", "workflow_management"],
#     "onboarding_business_case_approved": true,
#     "customer_onboarding_authenticated": true,
#     "onboarding_quota_available": true,
#     "onboarding_workflow_active": true,
#     "payment_business_case_approved": true,
#     "payment_processing_authenticated": true,
#     "pci_compliance_valid": true,
#     "payment_quota_available": true,
#     "payment_workflow_active": true,
#     "analytics_business_case_approved": true,
#     "analytics_authenticated": true,
#     "data_privacy_compliant": true,
#     "analytics_quota_available": true,
#     "analytics_workflow_active": true,
#     "reporting_business_case_approved": true,
#     "reporting_authenticated": true,
#     "reporting_compliance_valid": true,
#     "reporting_quota_available": true,
#     "reporting_workflow_active": true,
#     "integration_business_case_approved": true,
#     "integration_authenticated": true,
#     "integration_compliance_valid": true,
#     "integration_quota_available": true,
#     "integration_workflow_active": true,
#     "workflow_business_case_approved": true,
#     "workflow_authenticated": true,
#     "workflow_compliance_valid": true,
#     "workflow_quota_available": true,
#     "workflow_workflow_active": true
#   }
# }
