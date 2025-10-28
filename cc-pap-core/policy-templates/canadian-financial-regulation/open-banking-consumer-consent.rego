package controlcore.policy.templates.canadian_financial_regulation.open_banking_consent

# Canadian Open Banking Consumer Consent Framework
# Enforces consent requirements for financial data sharing

default allow = false

# Explicit consent required for data sharing
explicit_consent_required {
    input.action == "share_financial_data"
    input.resource.type == "customer_banking_data"
    not input.context.customer_consent_obtained
}

# Consent scope limitations
consent_scope_validation {
    input.action == "access_customer_data"
    input.resource.type == "banking_data"
    input.context.requested_data_scope not in input.context.consented_data_scopes
}

# Consent expiry and renewal
consent_expiry_check {
    input.action == "share_financial_data"
    input.resource.type == "customer_banking_data"
    input.context.consent_expired == true
}

# Third-party access controls
third_party_api_access {
    input.action == "grant_api_access"
    input.resource.type == "banking_api"
    input.context.third_party_type == "fintech"
    not input.context.accreditation_verified
}

# Consumer right to revoke consent
consent_revocation_enforcement {
    input.action == "access_customer_data"
    input.resource.type == "banking_data"
    input.context.consent_revoked == true
}

# Allow with valid consent
allow {
    input.action == "share_financial_data"
    input.resource.type == "customer_banking_data"
    input.context.customer_consent_obtained == true
    input.context.consent_expired == false
    input.context.data_minimization_applied == true
    input.context.purpose_limitation_enforced == true
}

allow {
    input.action == "grant_api_access"
    input.resource.type == "banking_api"
    input.context.accreditation_verified == true
    input.context.security_assessment_passed == true
    input.context.data_sharing_agreement_signed == true
}

