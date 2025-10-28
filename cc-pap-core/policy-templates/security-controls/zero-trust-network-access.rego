package cc.policies.zero_trust.zero_trust_network_access

# Zero Trust Network Access
# Never trust, always verify network access

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
    "policy": "zero-trust-network-access",
    "category": "Security Controls",
    "audit_required": audit_required
}
