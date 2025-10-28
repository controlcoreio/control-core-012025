package controlcore.policy.templates.canadian_financial_regulation.fsra_ontario

# FSRA (Financial Services Regulatory Authority of Ontario) Consumer Protection
# Enforces consumer protection and fair treatment requirements

default allow = false

# Fair treatment of consumers
unfair_practice_prevention {
    input.action == "offer_financial_product"
    input.resource.type == "insurance_policy"
    input.context.pricing_discriminatory == true
}

# Complaint handling requirements
complaint_handling_required {
    input.action == "receive_customer_complaint"
    input.resource.type == "consumer_complaint"
    input.context.days_since_received > 30
    not input.context.complaint_resolved
}

# Disclosure requirements for complex products
disclosure_requirements {
    input.action == "sell_investment_product"
    input.resource.type == "insurance_investment"
    input.context.product_complexity == "high"
    not input.context.risk_disclosure_provided
}

# Vulnerable customer protection
vulnerable_customer_protection {
    input.action == "sell_financial_product"
    input.resource.type == "insurance_policy"
    input.context.customer_vulnerability_flag == true
    not input.context.enhanced_suitability_assessment_completed
}

# Allow with consumer protection compliance
allow {
    input.action == "offer_financial_product"
    input.resource.type == "insurance_policy"
    input.context.pricing_discriminatory == false
    input.context.fsra_product_approval_current == true
    input.context.disclosure_provided == true
}

