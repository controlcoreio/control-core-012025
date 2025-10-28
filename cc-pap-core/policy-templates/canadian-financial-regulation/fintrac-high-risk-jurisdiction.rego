package controlcore.policy.templates.canadian_financial_regulation.fintrac_high_risk_jurisdiction

# FINTRAC High-Risk Jurisdiction Monitoring and Enhanced Due Diligence
# Enforces enhanced scrutiny for transactions involving high-risk countries

default allow = false

# Enhanced due diligence for high-risk jurisdictions
high_risk_jurisdiction_edd_required {
    input.action == "process_international_transfer"
    input.resource.type == "cross_border_payment"
    input.context.destination_country in data.fintrac.high_risk_jurisdictions
    not input.context.enhanced_due_diligence_completed
}

# FATF blacklist countries - transactions prohibited
fatf_blacklist_prohibition {
    input.action == "process_international_transfer"
    input.resource.type == "cross_border_payment"
    input.context.destination_country in data.fintrac.fatf_blacklist
}

# Sanctions screening required
sanctions_screening_required {
    input.action == "process_international_payment"
    input.resource.type == "wire_transfer"
    input.context.destination_country != "Canada"
    not input.context.sanctions_screening_completed
}

# Enhanced monitoring for high-risk corridors
high_risk_corridor_monitoring {
    input.action == "transfer_to_high_risk_corridor"
    input.resource.type == "remittance"
    input.context.risk_corridor in ["Canada-Iran", "Canada-North Korea", "Canada-Syria"]
    not input.context.compliance_officer_approved
}

# PEP (Politically Exposed Person) enhanced scrutiny
pep_transaction_approval_required {
    input.action == "process_transaction"
    input.resource.type == "financial_transaction"
    input.context.customer_pep_status in ["foreign_pep", "domestic_pep", "hio"]
    input.context.transaction_amount_cad > 10000
    not input.context.senior_management_approved
}

# Allow with proper controls
allow {
    input.action == "process_international_transfer"
    input.resource.type == "cross_border_payment"
    input.context.destination_country in data.fintrac.high_risk_jurisdictions
    input.context.enhanced_due_diligence_completed == true
    input.context.sanctions_screening_completed == true
    input.context.source_of_funds_verified == true
    input.context.compliance_officer_approved == true
}

allow {
    input.action == "process_transaction"
    input.resource.type == "financial_transaction"
    input.context.customer_pep_status in ["foreign_pep", "domestic_pep"]
    input.context.transaction_amount_cad > 10000
    input.context.senior_management_approved == true
    input.context.pep_enhanced_monitoring_active == true
}

