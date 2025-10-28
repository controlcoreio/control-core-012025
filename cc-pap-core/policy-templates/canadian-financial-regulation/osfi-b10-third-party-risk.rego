package controlcore.policy.templates.canadian_financial_regulation.osfi_b10

# OSFI Guideline B-10: Outsourcing and Third-Party Risk Management
# Enforces third-party risk management and outsourcing requirements

default allow = false

# Third-party due diligence required
third_party_due_diligence_required {
    input.action == "engage_service_provider"
    input.resource.type == "outsourcing_arrangement"
    not input.context.due_diligence_completed
}

# Material outsourcing arrangements require board approval
board_approval_required {
    input.action == "sign_outsourcing_contract"
    input.resource.type == "material_outsourcing"
    input.resource.materiality_assessment == "material"
    not input.context.board_approved
}

# Ongoing monitoring of service provider performance
service_provider_monitoring_required {
    input.action == "renew_service_contract"
    input.resource.type == "service_provider"
    input.context.months_since_last_review > 12
}

# Data security requirements for offshore outsourcing
offshore_data_security_required {
    input.action == "transfer_data_offshore"
    input.resource.type == "customer_data"
    input.context.destination_jurisdiction != "Canada"
    not input.context.cross_border_safeguards_implemented
}

# Right to audit third-party service providers
right_to_audit_required {
    input.action == "execute_outsourcing_contract"
    input.resource.type == "service_agreement"
    not input.context.audit_rights_included
}

# Concentration risk - multiple services from single provider
concentration_risk_assessment {
    input.action == "add_service_from_provider"
    input.resource.type == "outsourcing_arrangement"
    input.context.provider_revenue_percentage > 5
    not input.context.concentration_risk_assessed
}

# Business continuity requirements for critical outsourced services
bcp_requirements_for_outsourcing {
    input.action == "outsource_critical_function"
    input.resource.type == "critical_service"
    not input.context.provider_bcp_validated
}

# Allow with proper risk management
allow {
    input.action == "engage_service_provider"
    input.resource.type == "outsourcing_arrangement"
    input.context.due_diligence_completed == true
    input.context.risk_assessment_approved == true
    input.context.contract_legal_review_passed == true
}

allow {
    input.action == "sign_outsourcing_contract"
    input.resource.type == "material_outsourcing"
    input.context.board_approved == true
    input.context.audit_rights_included == true
    input.context.termination_rights_documented == true
}

allow {
    input.action == "transfer_data_offshore"
    input.resource.type == "customer_data"
    input.context.cross_border_safeguards_implemented == true
    input.context.data_encryption_enabled == true
    input.context.privacy_assessment_completed == true
    input.context.osfi_notification_sent == true
}

