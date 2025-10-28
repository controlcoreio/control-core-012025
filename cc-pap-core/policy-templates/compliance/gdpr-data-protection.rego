package cc.policies.compliance.gdpr_data_protection

# GDPR Data Protection Policy
# Ensures compliance with GDPR data protection requirements

import rego.v1

# Default deny
default allow = false

# Allow if user has explicit consent
allow {
    input.user.consent.gdpr == true
    input.user.consent.specific == true
    input.user.consent.informed == true
    input.user.consent.freely_given == true
}

# Allow if processing is necessary for contract
allow {
    input.processing.purpose == "contract_fulfillment"
    input.processing.necessary == true
    input.processing.legitimate_interest == true
}

# Allow if processing is necessary for legal obligation
allow {
    input.processing.purpose == "legal_obligation"
    input.processing.necessary == true
    input.processing.legal_basis != null
}

# Deny if data subject has withdrawn consent
deny {
    input.user.consent.withdrawn == true
    input.processing.purpose == "consent_based"
}

# Deny if data is sensitive and lacks explicit consent
deny {
    input.data.sensitive == true
    input.user.consent.explicit == false
}

# Require data minimization
require_data_minimization {
    input.processing.data_minimization == false
    input.processing.purpose != "legal_obligation"
}

# Require purpose limitation
require_purpose_limitation {
    input.processing.purpose != input.processing.original_purpose
    input.user.consent.purpose_change == false
}

# Require data portability
require_data_portability {
    input.user.request.type == "data_portability"
    input.user.consent.gdpr == true
}

# Require right to be forgotten
require_right_to_be_forgotten {
    input.user.request.type == "erasure"
    input.user.consent.withdrawn == true
}

# Audit requirements for GDPR
audit_required {
    input.processing.purpose in ["consent_based", "legitimate_interest"]
    input.data.sensitive == true
}
