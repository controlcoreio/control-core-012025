package controlcore.policy.templates.security

# Policy to enforce Zero Trust Architecture principles
# This policy implements the "never trust, always verify" principle

default allow = false # Deny by default, require explicit verification

# Allow access only with complete verification
allow {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  # Identity verification
  input.user.authenticated
  input.user.identity_verified
  input.user.mfa_verified
  # Device verification
  input.device.trusted
  input.device.compliant
  input.device.encrypted
  # Network verification
  input.network.secure
  input.network.monitored
  # Context verification
  input.context.risk_assessed
  input.context.behavior_analyzed
}

# Enhanced verification for high-risk resources
allow {
  input.action == "access_resource"
  input.resource.type == "high_risk_resource"
  # Identity verification
  input.user.authenticated
  input.user.identity_verified
  input.user.mfa_verified
  input.user.biometric_verified
  # Device verification
  input.device.trusted
  input.device.compliant
  input.device.encrypted
  input.device.managed
  # Network verification
  input.network.secure
  input.network.monitored
  input.network.segmented
  # Context verification
  input.context.risk_assessed
  input.context.behavior_analyzed
  input.context.threat_detected == false
}

# Continuous verification for ongoing access
allow {
  input.action == "continue_access"
  input.resource.type == "protected_resource"
  # Continuous identity verification
  input.user.authenticated
  input.user.identity_verified
  input.user.mfa_verified
  # Continuous device verification
  input.device.trusted
  input.device.compliant
  input.device.encrypted
  # Continuous network verification
  input.network.secure
  input.network.monitored
  # Continuous context verification
  input.context.risk_assessed
  input.context.behavior_analyzed
  input.context.session_valid
  input.context.activity_normal
}

# Deny access for unverified entities
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  not input.user.authenticated
}

deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  not input.user.identity_verified
}

deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  not input.user.mfa_verified
}

deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  not input.device.trusted
}

deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  not input.device.compliant
}

deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  not input.network.secure
}

deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  not input.context.risk_assessed
}

# Deny access for suspicious behavior
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.context.suspicious_behavior_detected
}

deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.context.threat_detected
}

deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.context.anomaly_detected
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "user_123",
#     "authenticated": true,
#     "identity_verified": true,
#     "mfa_verified": true,
#     "biometric_verified": true
#   },
#   "device": {
#     "id": "device_456",
#     "trusted": true,
#     "compliant": true,
#     "encrypted": true,
#     "managed": true
#   },
#   "network": {
#     "id": "network_789",
#     "secure": true,
#     "monitored": true,
#     "segmented": true
#   },
#   "action": "access_resource",
#   "resource": {
#     "id": "resource_123",
#     "type": "protected_resource"
#   },
#   "context": {
#     "risk_assessed": true,
#     "behavior_analyzed": true,
#     "session_valid": true,
#     "activity_normal": true,
#     "suspicious_behavior_detected": false,
#     "threat_detected": false,
#     "anomaly_detected": false
#   }
# }
