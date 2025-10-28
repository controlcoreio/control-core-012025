package controlcore.policy.templates.pii_management

# Policy to enforce data masking for financial sensitive information
# This policy implements real-world banking security frameworks and compliance requirements

default allow = false # Deny by default, require explicit masking rules

# Social Insurance Number (SIN) masking based on PCI-DSS and PIPEDA requirements
mask_sin_full {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "sin"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["compliance_officer", "auditor", "senior_management"]
}

mask_sin_partial {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "sin"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["data_analyst", "customer_service"]
  input.context.business_justification_provided
}

# Social Security Number (SSN) masking based on SOX and HIPAA requirements
mask_ssn_full {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "ssn"
  input.context.data_classification == "restricted"
  input.user.clearance_level < 4
  input.context.requires_sox_compliance
}

mask_ssn_partial {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "ssn"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["hr_specialist", "benefits_admin"]
  input.context.hipaa_compliant_access
}

# Credit Card Number masking based on PCI-DSS Level 1 requirements
mask_credit_card_full {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "credit_card_number"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["payment_processor", "fraud_analyst", "compliance_officer"]
  input.context.pci_dss_level_1_required
}

mask_credit_card_partial {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "credit_card_number"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["customer_service", "billing_specialist"]
  input.context.pci_dss_compliant_access
  input.context.masked_digits >= 12 # Show only last 4 digits
}

# Bank Account Number masking based on FINTRAC and AML requirements
mask_account_number_full {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "bank_account_number"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["banking_officer", "aml_analyst", "compliance_officer"]
  input.context.fintrac_compliance_required
}

mask_account_number_partial {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "bank_account_number"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["account_manager", "customer_service"]
  input.context.aml_approved_access
  input.context.masked_digits >= 8 # Show only last 4 digits
}

# Date of Birth masking based on GDPR and PIPEDA requirements
mask_dob_full {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "date_of_birth"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["hr_specialist", "benefits_admin", "compliance_officer"]
  input.context.gdpr_compliance_required
}

mask_dob_partial {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "date_of_birth"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["customer_service", "marketing_analyst"]
  input.context.pipeda_compliant_access
  input.context.show_age_only # Show only age, not full DOB
}

# Driver's License Number masking based on state privacy laws
mask_dl_full {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "drivers_license"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["dmv_officer", "law_enforcement", "compliance_officer"]
  input.context.state_privacy_law_compliance
}

mask_dl_partial {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "drivers_license"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["insurance_agent", "verification_specialist"]
  input.context.verification_required
  input.context.masked_digits >= 6 # Show only last 4 digits
}

# Passport Number masking based on international privacy laws
mask_passport_full {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "passport_number"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["immigration_officer", "border_control", "compliance_officer"]
  input.context.international_privacy_compliance
}

mask_passport_partial {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "passport_number"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["travel_agent", "verification_specialist"]
  input.context.travel_verification_required
  input.context.masked_digits >= 6 # Show only last 4 digits
}

# Financial Transaction Amount masking based on AML and FINTRAC requirements
mask_transaction_amount_full {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "transaction_amount"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["fraud_analyst", "aml_analyst", "compliance_officer"]
  input.context.aml_threshold_exceeded
}

mask_transaction_amount_partial {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "transaction_amount"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["account_manager", "customer_service"]
  input.context.fintrac_approved_access
  input.context.show_range_only # Show amount range instead of exact amount
}

# Allow full access for authorized personnel with proper clearance
allow_full_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.roles[_] in ["compliance_officer", "auditor", "senior_management"]
  input.user.clearance_level >= 5
  input.context.audit_approved
  input.context.business_justification_provided
}

# Allow access for emergency situations with proper authorization
allow_emergency_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.roles[_] in ["emergency_responder", "law_enforcement"]
  input.context.emergency_override_approved
  input.context.emergency_reason_provided
  input.context.legal_authority_verified
}

# Deny access for users without proper training
deny_no_training {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.requires_privacy_training
  not input.user.training_completed[_] == "privacy_training"
}

# Deny access for users without proper certification
deny_no_certification {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.context.requires_certification
  not input.user.certifications[_] == input.context.required_certification
}

# Deny access for users in restricted locations
deny_restricted_location {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.location in ["public_network", "restricted_country"]
  input.context.data_classification == "restricted"
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "banking_officer_1",
#     "roles": ["banking_officer", "aml_analyst"],
#     "clearance_level": 4,
#     "location": "secure_office",
#     "training_completed": ["privacy_training", "aml_training"],
#     "certifications": ["aml_certification", "compliance_certification"]
#   },
#   "action": "access_pii",
#   "resource": {
#     "id": "customer_profile_123",
#     "type": "personal_data",
#     "data_type": "sin"
#   },
#   "context": {
#     "data_classification": "confidential",
#     "business_justification_provided": true,
#     "fintrac_compliance_required": true,
#     "aml_approved_access": true,
#     "requires_privacy_training": true,
#     "requires_certification": true,
#     "required_certification": "aml_certification"
#   }
# }
