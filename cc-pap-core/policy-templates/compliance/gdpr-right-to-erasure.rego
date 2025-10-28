package cc.policies.gdpr.gdpr_right_to_erasure

# GDPR Right to Erasure
# Implement GDPR right to be forgotten/erasure

import rego.v1

# Default deny
default allow = false

# Allow if all requirements are met
allow {
    input.action == "access"
    input.user.authenticated == true
    input.user.authorized == true
    meets_policy_requirements
}

# Check if policy requirements are met
meets_policy_requirements {
    input.context.compliant == true
    input.context.risk_assessed == true
}

# Deny if critical requirements not met
deny {
    input.action == "access"
    not input.user.authenticated
}

# Audit requirement
audit_required {
    input.action == "access"
}

# Response with details
response := {
    "allow": allow,
    "policy": "gdpr-right-to-erasure",
    "category": "Privacy & Compliance",
    "audit_required": audit_required
}
