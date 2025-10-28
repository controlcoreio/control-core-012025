package controlcore.policy.templates.canadian_financial_regulation.osfi_d11

# OSFI Guideline D-11: Data Governance and Management
# Enforces data governance, quality, and management requirements

default allow = false

# Data quality standards for regulatory reporting
data_quality_standards_required {
    input.action == "submit_regulatory_report"
    input.resource.type == "osfi_report"
    input.context.data_quality_score < 0.95
}

# Data lineage documentation for critical data elements
data_lineage_required {
    input.action == "use_data_for_decision"
    input.resource.type == "critical_data_element"
    not input.context.data_lineage_documented
}

# Data stewardship and ownership
data_steward_assignment_required {
    input.action == "create_new_data_domain"
    input.resource.type == "data_domain"
    not input.context.data_steward_assigned
}

# Data retention requirements
data_retention_compliance {
    input.action == "delete_customer_data"
    input.resource.type == "customer_record"
    input.context.retention_period_completed == false
}

# Data access controls for sensitive information
sensitive_data_access_control {
    input.action == "access_data"
    input.resource.type == "sensitive_data"
    input.resource.data_classification == "confidential"
    not input.user.authorized_for_sensitive_data
}

# Data security for cloud storage
cloud_data_security_required {
    input.action == "store_data_in_cloud"
    input.resource.type == "customer_data"
    input.context.cloud_provider_jurisdiction != "Canada"
    not input.context.data_sovereignty_waiver_approved
}

# Data integration controls
data_integration_controls_required {
    input.action == "integrate_data_source"
    input.resource.type == "external_data_feed"
    not input.context.data_quality_validation_configured
}

# Allow with proper data governance
allow {
    input.action == "submit_regulatory_report"
    input.resource.type == "osfi_report"
    input.context.data_quality_score >= 0.95
    input.context.data_reconciliation_completed == true
    input.user.role in ["chief_data_officer", "regulatory_reporting_manager"]
}

allow {
    input.action == "access_data"
    input.resource.type == "sensitive_data"
    input.user.authorized_for_sensitive_data == true
    input.context.business_purpose_documented == true
    input.context.access_logged == true
}

allow {
    input.action == "delete_customer_data"
    input.resource.type == "customer_record"
    input.context.retention_period_completed == true
    input.context.legal_hold_check_passed == true
    input.user.role in ["data_governance_manager", "privacy_officer"]
}

