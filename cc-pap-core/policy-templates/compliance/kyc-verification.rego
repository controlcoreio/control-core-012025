package controlcore.policy.templates.compliance.kyc

# Policy to enforce KYC (Know Your Customer) verification requirements
# This policy ensures compliance with Canadian and US KYC regulations

default allow = false

# Allow customer onboarding if KYC requirements are met
allow {
  input.action == "onboard_customer"
  input.resource.type == "customer_profile"
  input.context.kyc_documents_provided
  input.context.identity_verified
  input.context.address_verified
  input.context.kyc_risk_assessment_completed
}

# Enhanced KYC requirements for high-risk customers
allow {
  input.action == "onboard_customer"
  input.resource.type == "customer_profile"
  input.context.customer_risk_level == "high"
  input.context.enhanced_kyc_completed
  input.context.source_of_funds_verified
  input.context.beneficial_ownership_verified
}

# PEP (Politically Exposed Person) specific requirements
allow {
  input.action == "onboard_customer"
  input.resource.type == "customer_profile"
  input.context.customer_type == "pep"
  input.context.pep_approval_obtained
  input.context.senior_management_approval
  input.context.enhanced_monitoring_enabled
}

# Corporate customer KYC requirements
allow {
  input.action == "onboard_customer"
  input.resource.type == "customer_profile"
  input.context.customer_type == "corporate"
  input.context.corporate_documents_verified
  input.context.beneficial_ownership_verified
  input.context.ubo_kyc_completed
}

# Deny onboarding if critical KYC requirements are missing
deny {
  input.action == "onboard_customer"
  input.resource.type == "customer_profile"
  not input.context.kyc_documents_provided
}

deny {
  input.action == "onboard_customer"
  input.resource.type == "customer_profile"
  not input.context.identity_verified
}

deny {
  input.action == "onboard_customer"
  input.resource.type == "customer_profile"
  input.context.customer_risk_level == "high"
  not input.context.enhanced_kyc_completed
}

# Ongoing KYC monitoring requirements
ongoing_kyc_required {
  input.action == "update_customer_profile"
  input.resource.type == "customer_profile"
  input.context.customer_risk_level == "high"
  input.context.kyc_review_due
}

ongoing_kyc_required {
  input.action == "update_customer_profile"
  input.resource.type == "customer_profile"
  input.context.customer_type == "pep"
  input.context.kyc_review_due
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "kyc_specialist", "roles": ["kyc"]},
#   "action": "onboard_customer",
#   "resource": {
#     "id": "customer_12345",
#     "type": "customer_profile",
#     "customer_id": "cust_12345"
#   },
#   "context": {
#     "customer_risk_level": "medium",
#     "customer_type": "individual",
#     "kyc_documents_provided": true,
#     "identity_verified": true,
#     "address_verified": true,
#     "kyc_risk_assessment_completed": true
#   }
# }
