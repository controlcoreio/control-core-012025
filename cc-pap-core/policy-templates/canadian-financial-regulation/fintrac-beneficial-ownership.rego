package controlcore.policy.templates.canadian_financial_regulation.fintrac_beneficial_ownership

# FINTRAC Beneficial Ownership Identification and Verification
# Enforces beneficial ownership transparency requirements

default allow = false

# Beneficial ownership identification required for entities
beneficial_ownership_required {
    input.action == "onboard_corporate_customer"
    input.resource.type == "business_account"
    not input.context.beneficial_owners_identified
}

# 25% ownership threshold
ownership_threshold_verification {
    input.action == "verify_beneficial_owner"
    input.resource.type == "entity_ownership"
    input.context.ownership_percentage >= 25
    not input.context.identity_verified
}

# Control determination for entities
control_determination_required {
    input.action == "onboard_corporate_customer"
    input.resource.type == "business_account"
    not input.context.control_person_identified
}

# Reasonable measures to obtain beneficial ownership
reasonable_measures_documented {
    input.action == "complete_kyc_entity"
    input.resource.type == "corporate_client"
    input.context.beneficial_owners_identified == false
    not input.context.reasonable_measures_documented
}

# Complex ownership structures require enhanced verification
complex_structure_verification {
    input.action == "onboard_corporate_customer"
    input.resource.type == "business_account"
    input.context.ownership_layers > 2
    not input.context.ownership_structure_chart_completed
}

# Allow with beneficial ownership compliance
allow {
    input.action == "onboard_corporate_customer"
    input.resource.type == "business_account"
    input.context.beneficial_owners_identified == true
    input.context.all_owners_verified == true
    input.context.control_person_identified == true
    input.context.ownership_documentation_retained == true
}

allow {
    input.action == "onboard_corporate_customer"
    input.resource.type == "business_account"
    input.context.beneficial_owners_identified == false
    input.context.reasonable_measures_documented == true
    input.context.senior_management_approved == true
    input.context.enhanced_monitoring_applied == true
}

