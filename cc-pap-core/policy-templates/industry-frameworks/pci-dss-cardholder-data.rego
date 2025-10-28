package cc.policies.pci_dss.pci_dss_cardholder_data

# PCI-DSS Cardholder Data Protection
# Protect cardholder data per PCI-DSS requirements

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
    "policy": "pci-dss-cardholder-data",
    "category": "Industry Frameworks",
    "audit_required": audit_required
}
