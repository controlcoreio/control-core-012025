package controlcore.policy.templates.canadian_financial_regulation.data_residency

# Canadian Data Residency and Sovereignty Requirements
# Enforces data localization requirements for Canadian financial institutions

default allow = false

# Customer data must reside in Canada
canadian_data_residency_required {
    input.action == "store_customer_data"
    input.resource.type == "customer_personal_information"
    input.context.storage_jurisdiction != "Canada"
    not input.context.data_sovereignty_exception_approved
}

# Cloud region restrictions
cloud_region_enforcement {
    input.action == "deploy_workload"
    input.resource.type == "cloud_resource"
    input.context.contains_customer_data == true
    input.context.cloud_region not in ["ca-central-1", "ca-west-1"]
}

# Backup and disaster recovery in Canada
backup_location_compliance {
    input.action == "configure_backup"
    input.resource.type == "data_backup"
    input.context.contains_customer_data == true
    input.context.backup_location_jurisdiction != "Canada"
}

# Data transfer outside Canada requires approval
cross_border_data_transfer {
    input.action == "transfer_data_internationally"
    input.resource.type == "customer_data_export"
    input.context.destination_jurisdiction != "Canada"
    not input.context.privacy_impact_assessment_approved
}

# Cloud provider data center location verification
data_center_location_verification {
    input.action == "sign_cloud_contract"
    input.resource.type == "cloud_service_agreement"
    input.context.customer_data_processing == true
    not input.context.canadian_data_center_confirmed
}

# Allow with data sovereignty controls
allow {
    input.action == "store_customer_data"
    input.resource.type == "customer_personal_information"
    input.context.storage_jurisdiction == "Canada"
    input.context.encryption_enabled == true
}

allow {
    input.action == "deploy_workload"
    input.resource.type == "cloud_resource"
    input.context.cloud_region in ["ca-central-1", "ca-west-1"]
    input.context.data_residency_controls_enabled == true
}

allow {
    input.action == "transfer_data_internationally"
    input.resource.type == "customer_data_export"
    input.context.privacy_impact_assessment_approved == true
    input.context.data_protection_agreement_signed == true
    input.context.regulatory_notification_sent == true
    input.user.role in ["chief_privacy_officer", "chief_data_officer"]
}

