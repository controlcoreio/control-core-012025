package cc.policies.nist_ai_rmf.ai_trustworthiness_assessment

# AI Trustworthiness Assessment
# Assessment policy for AI system trustworthiness and reliability

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
    "policy": "ai-trustworthiness-assessment",
    "category": "NIST AI RMF",
    "audit_required": audit_required
}
