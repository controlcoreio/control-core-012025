package controlcore.policy.templates.pii_management

# Policy to enforce conditional data masking for PII
# This policy masks sensitive data based on multiple conditions (time, identity, location, context)

default allow = true # Allow access by default, but apply masking rules

# Complex conditional masking based on multiple factors
mask_pii_complex_conditions {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "restricted"
  # Time condition: after hours
  input.context.current_hour > 18
  # Identity condition: external user
  input.user.user_type == "external"
  # Location condition: public network
  input.user.network_type == "public"
}

# Conditional masking for high-risk scenarios
mask_pii_high_risk_scenario {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "confidential"
  # Time condition: weekend
  input.context.current_day == "weekend"
  # Identity condition: no proper clearance
  not input.user.roles[_] == "confidential_data_access"
  # Location condition: restricted country
  input.user.country in ["restricted_country_1", "restricted_country_2"]
}

# Conditional masking for cross-border scenarios
mask_pii_cross_border_scenario {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "personal"
  # Time condition: business hours
  input.context.current_hour >= 9
  input.context.current_hour <= 17
  # Identity condition: external user
  input.user.user_type == "external"
  # Location condition: different country
  input.user.country != input.resource.data_residency_country
  # Context condition: no business justification
  not input.context.business_justification_provided
}

# Conditional masking for emergency scenarios
mask_pii_emergency_scenario {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "restricted"
  # Time condition: after hours
  input.context.current_hour > 20
  # Identity condition: not emergency responder
  not input.user.roles[_] == "emergency_responder"
  # Location condition: public network
  input.user.network_type == "public"
  # Context condition: no emergency override
  not input.context.emergency_override_approved
}

# Conditional masking for compliance scenarios
mask_pii_compliance_scenario {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "personal"
  # Time condition: business hours
  input.context.current_hour >= 8
  input.context.current_hour <= 18
  # Identity condition: no proper certification
  not input.user.certifications[_] == input.context.required_certification
  # Location condition: corporate network
  input.user.network_type == "corporate"
  # Context condition: requires compliance training
  input.context.requires_compliance_training
  not input.user.training_completed[_] == input.context.required_compliance_training
}

# Conditional masking for security scenarios
mask_pii_security_scenario {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "sensitive"
  # Time condition: any time
  true
  # Identity condition: no MFA
  not input.user.mfa_verified
  # Location condition: any location
  true
  # Context condition: requires MFA
  input.context.requires_mfa
}

# Conditional masking for audit scenarios
mask_pii_audit_scenario {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "confidential"
  # Time condition: business hours
  input.context.current_hour >= 9
  input.context.current_hour <= 17
  # Identity condition: not auditor
  not input.user.roles[_] == "auditor"
  # Location condition: corporate network
  input.user.network_type == "corporate"
  # Context condition: audit in progress
  input.context.audit_in_progress
}

# Allow access with proper conditions
allow_conditional_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "confidential"
  # Time condition: business hours
  input.context.current_hour >= 8
  input.context.current_hour <= 18
  # Identity condition: proper clearance
  input.user.roles[_] == "confidential_data_access"
  # Location condition: corporate network
  input.user.network_type == "corporate"
  # Context condition: business justification
  input.context.business_justification_provided
}

# Allow emergency access with proper conditions
allow_emergency_conditional_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "restricted"
  # Time condition: any time
  true
  # Identity condition: emergency responder
  input.user.roles[_] == "emergency_responder"
  # Location condition: any location
  true
  # Context condition: emergency override
  input.context.emergency_override_approved
  input.context.emergency_reason_provided
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "analyst_1",
#     "user_type": "internal",
#     "roles": ["data_analyst"],
#     "country": "Canada",
#     "network_type": "corporate",
#     "mfa_verified": true,
#     "certifications": ["data_privacy_advanced"],
#     "training_completed": ["compliance_training"]
#   },
#   "action": "access_pii",
#   "resource": {
#     "id": "customer_profile_123",
#     "type": "personal_data",
#     "data_residency_country": "Canada"
#   },
#   "context": {
#     "data_classification": "confidential",
#     "current_hour": 14,
#     "current_day": "weekday",
#     "business_justification_provided": true,
#     "requires_mfa": true,
#     "requires_compliance_training": true,
#     "required_certification": "data_privacy_advanced",
#     "required_compliance_training": "compliance_training",
#     "audit_in_progress": false,
#     "emergency_override_approved": false
#   }
# }
