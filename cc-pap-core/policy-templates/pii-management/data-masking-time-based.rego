package controlcore.policy.templates.pii_management

# Policy to enforce time-based data masking for PII
# This policy masks sensitive data based on time conditions (business hours, after hours, etc.)

default allow = true # Allow access by default, but apply masking rules

# Mask PII during non-business hours
mask_pii {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.current_hour < 8 # Before 8 AM
  input.context.data_classification == "sensitive"
}

mask_pii {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.current_hour > 18 # After 6 PM
  input.context.data_classification == "sensitive"
}

mask_pii {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.current_day == "weekend"
  input.context.data_classification == "sensitive"
}

# Enhanced masking for high-risk PII during off-hours
enhanced_mask_pii {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.current_hour < 8
  input.context.data_classification == "restricted"
}

enhanced_mask_pii {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.current_hour > 18
  input.context.data_classification == "restricted"
}

# Allow full access during business hours for authorized users
allow_full_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.current_hour >= 8
  input.context.current_hour <= 18
  input.context.current_day != "weekend"
  input.user.roles[_] == "authorized_pii_access"
  input.context.business_justification_provided
}

# Emergency access override for critical situations
allow_emergency_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.emergency_override_approved
  input.user.roles[_] == "emergency_responder"
  input.context.emergency_reason_provided
}

# Time-based masking for different data types
mask_financial_data {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.context.current_hour < 9 # Financial data only after 9 AM
  input.context.data_classification == "sensitive"
}

mask_health_data {
  input.action == "access_pii"
  input.resource.type == "health_data"
  input.context.current_hour < 7 # Health data only after 7 AM
  input.context.data_classification == "sensitive"
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "analyst_1", "roles": ["data_analyst"]},
#   "action": "access_pii",
#   "resource": {
#     "id": "customer_profile_123",
#     "type": "personal_data",
#     "data_type": "customer_profile"
#   },
#   "context": {
#     "current_hour": 22,
#     "current_day": "weekday",
#     "data_classification": "sensitive",
#     "business_justification_provided": false
#   }
# }
