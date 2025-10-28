package controlcore.policy.templates.canadian_financial_regulation.osfi_b13

# OSFI Guideline B-13: Technology and Cyber Risk Management
# Enforces technology and cyber security risk management requirements for Canadian financial institutions

default allow = false

# Cyber security controls must be in place
cyber_security_controls_required {
    input.action == "access_critical_system"
    input.resource.type == "core_banking_system"
    not input.context.cyber_controls_implemented
}

# Third-party technology risk assessment required
third_party_risk_assessment_required {
    input.action == "onboard_technology_vendor"
    input.resource.type == "third_party_service"
    not input.context.vendor_risk_assessment_completed
}

# Incident response plan must be active
incident_response_required {
    input.action == "detect_security_incident"
    input.resource.type == "security_event"
    input.context.incident_severity in ["high", "critical"]
    not input.context.incident_response_plan_activated
}

# Cyber resilience testing required annually
cyber_resilience_testing_required {
    input.action == "deploy_critical_system"
    input.resource.type == "production_infrastructure"
    input.context.days_since_last_resilience_test > 365
}

# Executive oversight for major technology decisions
executive_oversight_required {
    input.action == "approve_technology_investment"
    input.resource.type == "technology_project"
    input.resource.budget_cad >= 1000000
    input.user.role != "cio"
    input.user.role != "ceo"
}

# Data center controls for critical systems
data_center_controls_required {
    input.action == "access_data_center"
    input.resource.type == "physical_infrastructure"
    input.resource.classification == "tier_3_plus"
    not input.context.multi_factor_auth_enabled
}

# Change management for production systems
change_management_required {
    input.action == "deploy_to_production"
    input.resource.type == "application_code"
    input.resource.criticality == "high"
    not input.context.change_approval_obtained
}

# Business continuity and disaster recovery
bcdr_plan_required {
    input.action == "modify_bcdr_plan"
    input.resource.type == "continuity_plan"
    not input.context.annual_bcdr_test_completed
}

# Technology risk reporting to board
board_reporting_required {
    input.action == "submit_risk_report"
    input.resource.type == "board_report"
    input.context.report_type == "technology_risk"
    input.context.quarter_end == true
    not input.user.authorized_for_board_reports
}

# Allow with all controls in place
allow {
    input.action == "access_critical_system"
    input.resource.type == "core_banking_system"
    input.context.cyber_controls_implemented == true
    input.user.mfa_verified == true
    input.context.system_patching_current == true
}

allow {
    input.action == "onboard_technology_vendor"
    input.resource.type == "third_party_service"
    input.context.vendor_risk_assessment_completed == true
    input.context.vendor_due_diligence_passed == true
    input.context.contract_review_completed == true
}

allow {
    input.action == "deploy_to_production"
    input.resource.type == "application_code"
    input.context.change_approval_obtained == true
    input.context.security_testing_passed == true
    input.context.backup_verified == true
}

