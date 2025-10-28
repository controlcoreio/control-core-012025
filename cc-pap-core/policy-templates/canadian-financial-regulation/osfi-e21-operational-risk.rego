package controlcore.policy.templates.canadian_financial_regulation.osfi_e21

# OSFI Guideline E-21: Operational Risk Management
# Enforces operational risk management framework requirements for Canadian FRFIs

default allow = false

# Operational risk assessment required for new products
operational_risk_assessment_required {
    input.action == "launch_new_product"
    input.resource.type == "financial_product"
    not input.context.operational_risk_assessment_completed
}

# Process risk controls for critical workflows
process_risk_controls_required {
    input.action == "execute_process"
    input.resource.type == "critical_business_process"
    input.resource.transaction_volume_daily > 10000
    not input.context.process_controls_validated
}

# People risk - key person dependency
key_person_dependency_risk {
    input.action == "assign_critical_function"
    input.resource.type == "business_function"
    input.context.single_person_dependency == true
    not input.context.succession_plan_documented
}

# Systems risk - technology failure impact
systems_failure_impact_assessment {
    input.action == "deploy_system_change"
    input.resource.type == "core_system"
    input.resource.customer_impact_if_failed == "high"
    not input.context.failure_impact_analysis_completed
}

# External events risk monitoring
external_event_risk_monitoring {
    input.action == "continue_operations"
    input.resource.type == "business_operations"
    input.context.external_threat_level == "elevated"
    not input.context.heightened_monitoring_enabled
}

# Operational loss event reporting
operational_loss_reporting_required {
    input.action == "record_operational_loss"
    input.resource.type == "loss_event"
    input.context.loss_amount_cad >= 10000
    not input.context.reported_to_risk_committee
}

# Risk appetite threshold monitoring
risk_appetite_threshold_exceeded {
    input.action == "approve_risk_exception"
    input.resource.type == "risk_acceptance"
    input.context.residual_risk_score > input.context.risk_appetite_threshold
    input.user.role != "cro"
}

# Business continuity activation
business_continuity_activation {
    input.action == "activate_bcp"
    input.resource.type == "continuity_plan"
    input.context.disruption_severity in ["major", "severe"]
    not input.user.authorized_for_bcp_activation
}

# Allow with proper controls and approvals
allow {
    input.action == "launch_new_product"
    input.resource.type == "financial_product"
    input.context.operational_risk_assessment_completed == true
    input.context.product_committee_approved == true
    input.context.compliance_review_passed == true
}

allow {
    input.action == "execute_process"
    input.resource.type == "critical_business_process"
    input.context.process_controls_validated == true
    input.context.dual_control_applied == true
}

allow {
    input.action == "approve_risk_exception"
    input.resource.type == "risk_acceptance"
    input.user.role == "cro"
    input.context.residual_risk_score <= input.context.risk_appetite_threshold
    input.context.executive_committee_informed == true
}

allow {
    input.action == "activate_bcp"
    input.resource.type == "continuity_plan"
    input.user.authorized_for_bcp_activation == true
    input.context.executive_team_notified == true
    input.context.regulator_notification_prepared == true
}

