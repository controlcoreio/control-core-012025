package controlcore.policy.templates.pii_management

# Policy to enforce data masking for banking compliance requirements
# This policy implements Basel III, SOX, PCI-DSS, and international banking standards

default allow = false # Deny by default, require explicit compliance verification

# Basel III Capital Adequacy - Risk Weighted Assets masking
mask_rwa_full {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "risk_weighted_assets"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["risk_manager", "capital_adequacy_officer", "regulatory_compliance"]
  input.context.basel_iii_compliance_required
}

mask_rwa_partial {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "risk_weighted_assets"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["financial_analyst", "audit_specialist"]
  input.context.basel_iii_approved_access
  input.context.show_tier_1_capital_only
}

# SOX Section 404 - Internal Controls masking
mask_internal_controls_full {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "internal_controls"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["internal_auditor", "sox_compliance_officer", "senior_management"]
  input.context.sox_404_compliance_required
}

mask_internal_controls_partial {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "internal_controls"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["compliance_analyst", "risk_assessor"]
  input.context.sox_approved_access
  input.context.show_control_framework_only
}

# PCI-DSS Level 1 - Cardholder Data masking
mask_cardholder_data_full {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "cardholder_data"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["payment_security_officer", "pci_compliance_officer", "fraud_analyst"]
  input.context.pci_dss_level_1_required
}

mask_cardholder_data_partial {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "cardholder_data"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["customer_service", "billing_specialist"]
  input.context.pci_dss_approved_access
  input.context.masked_pan_required # Primary Account Number masking
}

# AML/KYC - Suspicious Activity Report (SAR) masking
mask_sar_full {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "suspicious_activity_report"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["aml_analyst", "compliance_officer", "law_enforcement"]
  input.context.fintrac_sar_compliance_required
}

mask_sar_partial {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "suspicious_activity_report"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["risk_analyst", "compliance_specialist"]
  input.context.aml_approved_access
  input.context.show_risk_indicators_only
}

# FATCA/CRS - Tax Information masking
mask_tax_information_full {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "tax_information"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["tax_compliance_officer", "fatca_specialist", "senior_management"]
  input.context.fatca_crs_compliance_required
}

mask_tax_information_partial {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "tax_information"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["tax_analyst", "compliance_specialist"]
  input.context.fatca_approved_access
  input.context.show_tax_residency_only
}

# GDPR Article 32 - Personal Data masking
mask_personal_data_full {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "personal_information"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["dpo", "privacy_officer", "compliance_officer"]
  input.context.gdpr_article_32_compliance_required
}

mask_personal_data_partial {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.resource.data_type == "personal_information"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["data_analyst", "marketing_specialist"]
  input.context.gdpr_approved_access
  input.context.show_anonymized_data_only
}

# MiFID II - Investment Services masking
mask_investment_data_full {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "investment_services"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["investment_advisor", "mifid_compliance_officer", "senior_management"]
  input.context.mifid_ii_compliance_required
}

mask_investment_data_partial {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "investment_services"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["portfolio_analyst", "compliance_specialist"]
  input.context.mifid_approved_access
  input.context.show_product_suitability_only
}

# PSD2 - Payment Services masking
mask_payment_services_full {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "payment_services"
  input.context.data_classification == "restricted"
  input.user.roles[_] not in ["payment_services_officer", "psd2_compliance_officer", "senior_management"]
  input.context.psd2_compliance_required
}

mask_payment_services_partial {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.resource.data_type == "payment_services"
  input.context.data_classification == "confidential"
  input.user.roles[_] in ["payment_analyst", "compliance_specialist"]
  input.context.psd2_approved_access
  input.context.show_transaction_limits_only
}

# Allow full access for regulatory compliance officers
allow_regulatory_access {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.user.roles[_] in ["regulatory_compliance", "senior_management", "audit_officer"]
  input.user.clearance_level >= 5
  input.context.regulatory_audit_approved
  input.context.business_justification_provided
}

# Allow access for emergency regulatory situations
allow_emergency_regulatory_access {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.user.roles[_] in ["emergency_compliance_officer", "regulatory_emergency_responder"]
  input.context.emergency_regulatory_override_approved
  input.context.regulatory_emergency_reason_provided
  input.context.legal_authority_verified
}

# Deny access for users without proper regulatory training
deny_no_regulatory_training {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.context.requires_regulatory_training
  not input.user.training_completed[_] == "regulatory_compliance_training"
}

# Deny access for users without proper regulatory certification
deny_no_regulatory_certification {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.context.requires_regulatory_certification
  not input.user.certifications[_] == input.context.required_regulatory_certification
}

# Deny access for users in non-compliant jurisdictions
deny_non_compliant_jurisdiction {
  input.action == "access_pii"
  input.resource.type == "financial_data"
  input.user.country in ["non_compliant_jurisdiction_1", "non_compliant_jurisdiction_2"]
  input.context.data_classification == "restricted"
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "compliance_officer_1",
#     "roles": ["compliance_officer", "aml_analyst"],
#     "clearance_level": 5,
#     "country": "Canada",
#     "training_completed": ["regulatory_compliance_training", "aml_training"],
#     "certifications": ["aml_certification", "basel_iii_certification"]
#   },
#   "action": "access_pii",
#   "resource": {
#     "id": "financial_data_123",
#     "type": "financial_data",
#     "data_type": "risk_weighted_assets"
#   },
#   "context": {
#     "data_classification": "confidential",
#     "basel_iii_compliance_required": true,
#     "basel_iii_approved_access": true,
#     "show_tier_1_capital_only": true,
#     "regulatory_audit_approved": true,
#     "business_justification_provided": true,
#     "requires_regulatory_training": true,
#     "requires_regulatory_certification": true,
#     "required_regulatory_certification": "basel_iii_certification"
#   }
# }
