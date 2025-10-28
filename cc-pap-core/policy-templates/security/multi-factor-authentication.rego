package controlcore.policy.templates.security

# Policy to enforce Multi-Factor Authentication (MFA) requirements
# This policy ensures MFA is required for sensitive operations and resources

default allow = false # Deny by default, require MFA verification

# Allow access with proper MFA verification
allow {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.mfa_verified
  input.user.mfa_method in ["sms", "email", "authenticator", "hardware_token", "biometric"]
  input.user.mfa_timestamp > input.context.session_start_time
}

# Enhanced MFA for high-risk resources
allow {
  input.action == "access_resource"
  input.resource.type == "high_risk_resource"
  input.user.mfa_verified
  input.user.mfa_method in ["authenticator", "hardware_token", "biometric"]
  input.user.mfa_timestamp > input.context.session_start_time
  input.user.mfa_strength >= 3 # High strength MFA required
}

# Allow access for critical operations with strong MFA
allow {
  input.action == "critical_operation"
  input.resource.type == "critical_resource"
  input.user.mfa_verified
  input.user.mfa_method in ["hardware_token", "biometric"]
  input.user.mfa_timestamp > input.context.session_start_time
  input.user.mfa_strength >= 4 # Very high strength MFA required
}

# Allow access for administrative operations with administrative MFA
allow {
  input.action == "administrative_operation"
  input.resource.type == "administrative_resource"
  input.user.mfa_verified
  input.user.mfa_method in ["hardware_token", "biometric"]
  input.user.mfa_timestamp > input.context.session_start_time
  input.user.mfa_strength >= 4
  input.user.roles[_] == "administrator"
}

# Deny access without MFA
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  not input.user.mfa_verified
}

deny {
  input.action == "access_resource"
  input.resource.type == "high_risk_resource"
  not input.user.mfa_verified
}

deny {
  input.action == "critical_operation"
  input.resource.type == "critical_resource"
  not input.user.mfa_verified
}

deny {
  input.action == "administrative_operation"
  input.resource.type == "administrative_resource"
  not input.user.mfa_verified
}

# Deny access with weak MFA methods for high-risk resources
deny {
  input.action == "access_resource"
  input.resource.type == "high_risk_resource"
  input.user.mfa_verified
  input.user.mfa_method in ["sms", "email"]
  input.user.mfa_strength < 3
}

# Deny access with expired MFA
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.mfa_verified
  input.user.mfa_timestamp <= input.context.session_start_time
}

# Deny access with MFA from untrusted device
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.mfa_verified
  not input.device.trusted
}

# Deny access with MFA from untrusted network
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.mfa_verified
  not input.network.trusted
}

# Require MFA for specific user roles
require_mfa {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.roles[_] in ["administrator", "power_user", "data_analyst"]
  not input.user.mfa_verified
}

# Require MFA for specific operations
require_mfa {
  input.action in ["modify_data", "delete_data", "export_data", "admin_operation"]
  input.resource.type == "protected_resource"
  not input.user.mfa_verified
}

# Require MFA for specific data classifications
require_mfa {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.context.data_classification in ["confidential", "restricted", "sensitive"]
  not input.user.mfa_verified
}

# Require MFA for external users
require_mfa {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.user_type == "external"
  not input.user.mfa_verified
}

# Require MFA for remote access
require_mfa {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.location == "remote"
  not input.user.mfa_verified
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "user_123",
#     "mfa_verified": true,
#     "mfa_method": "authenticator",
#     "mfa_timestamp": 1640995200,
#     "mfa_strength": 4,
#     "roles": ["administrator"],
#     "user_type": "internal",
#     "location": "office"
#   },
#   "device": {
#     "id": "device_456",
#     "trusted": true
#   },
#   "network": {
#     "id": "network_789",
#     "trusted": true
#   },
#   "action": "administrative_operation",
#   "resource": {
#     "id": "resource_123",
#     "type": "administrative_resource"
#   },
#   "context": {
#     "session_start_time": 1640995000,
#     "data_classification": "confidential"
#   }
# }
