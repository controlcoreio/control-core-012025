package controlcore.policy.templates.canadian_financial_regulation.amf_quebec

# AMF (Autorité des marchés financiers) Quebec Financial Institution Oversight
# Enforces AMF regulatory requirements for Quebec financial institutions

default allow = false

# AMF licensing requirements
amf_license_validation {
    input.action == "provide_financial_service"
    input.resource.type == "financial_service"
    input.context.service_jurisdiction == "Quebec"
    not input.context.amf_license_current
}

# French language requirements (Bill 96)
french_language_compliance {
    input.action == "communicate_with_customer"
    input.resource.type == "customer_communication"
    input.context.customer_language_preference == "French"
    input.context.communication_language != "French"
}

# Quebec consumer protection (Bill 141)
quebec_consumer_protection {
    input.action == "market_financial_product"
    input.resource.type == "investment_product"
    input.context.target_market_jurisdiction == "Quebec"
    not input.context.quebec_disclosure_requirements_met
}

# Allow with AMF compliance
allow {
    input.action == "provide_financial_service"
    input.resource.type == "financial_service"
    input.context.service_jurisdiction == "Quebec"
    input.context.amf_license_current == true
    input.context.french_service_available == true
}

