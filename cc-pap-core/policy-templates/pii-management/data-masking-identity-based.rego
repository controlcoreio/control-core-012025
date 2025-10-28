package controlcore.policy.templates.pii_management

# Policy to enforce identity-based data masking for PII
# This policy masks sensitive data based on user identity, roles, and clearance levels

default allow = true # Allow access by default, but apply masking rules

# Mask PII for users without proper clearance
mask_pii {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "restricted"
  not input.user.roles[_] == "restricted_data_access"
}

mask_pii {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.data_classification == "confidential"
  not input.user.roles[_] == "confidential_data_access"
}

# Enhanced masking for external users
enhanced_mask_pii {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.user_type == "external"
  input.context.data_classification == "sensitive"
}

# Mask PII for users from different departments
mask_cross_department_pii {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.department != input.resource.owner_department
  input.context.data_classification == "confidential"
  not input.user.roles[_] == "cross_department_access"
}

# Mask PII for users without specific certifications
mask_pii_no_certification {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.requires_certification
  not input.user.certifications[_] == input.context.required_certification
}

# Mask PII for users without proper training
mask_pii_no_training {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.requires_training
  not input.user.training_completed[_] == input.context.required_training
}

# Allow full access for authorized users with proper clearance
allow_full_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.roles[_] == "authorized_pii_access"
  input.user.clearance_level >= input.context.required_clearance_level
  input.context.business_justification_provided
}

# Allow access for data owners
allow_owner_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.id == input.resource.owner_id
  input.context.data_classification != "restricted"
}

# Allow access for data stewards
allow_steward_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.roles[_] == "data_steward"
  input.context.data_classification != "restricted"
}

# Mask PII for users with expired access
mask_pii_expired_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.access_expiry < input.context.current_timestamp
}

# Mask PII for users with suspended accounts
mask_pii_suspended_user {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.account_status == "suspended"
}

# Mask PII for users without proper authentication
mask_pii_unauthenticated {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  not input.user.authenticated
}

# Mask PII for users without MFA
mask_pii_no_mfa {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.requires_mfa
  not input.user.mfa_verified
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "analyst_1",
#     "roles": ["data_analyst"],
#     "department": "marketing",
#     "clearance_level": 2,
#     "certifications": ["data_privacy_101"],
#     "training_completed": ["pii_handling"],
#     "access_expiry": 1640995200,
#     "account_status": "active",
#     "authenticated": true,
#     "mfa_verified": true
#   },
#   "action": "access_pii",
#   "resource": {
#     "id": "customer_profile_123",
#     "type": "personal_data",
#     "owner_department": "sales",
#     "owner_id": "sales_rep_1"
#   },
#   "context": {
#     "data_classification": "confidential",
#     "requires_certification": true,
#     "required_certification": "data_privacy_advanced",
#     "requires_training": true,
#     "required_training": "advanced_pii_handling",
#     "required_clearance_level": 3,
#     "business_justification_provided": true,
#     "requires_mfa": true,
#     "current_timestamp": 1640995200
#   }
# }
