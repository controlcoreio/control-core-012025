package controlcore.policy.templates.open_banking

# Policy to enforce FDX (Financial Data Exchange) compliance requirements
# This policy ensures compliance with open banking standards and data sharing protocols

default allow = false

# Allow data sharing if FDX compliance requirements are met
allow {
  input.action == "share_financial_data"
  input.resource.type == "financial_data"
  input.context.fdx_consent_valid
  input.context.data_scope_authorized
  input.context.recipient_authorized
  input.context.data_encryption_enabled
}

# FDX consent management
allow {
  input.action == "grant_consent"
  input.resource.type == "financial_data"
  input.context.consent_granularity == "transaction_level"
  input.context.consent_duration <= 90 # Maximum 90 days
  input.context.consent_revocation_enabled
}

# Data minimization and purpose limitation
deny {
  input.action == "share_financial_data"
  input.resource.type == "financial_data"
  input.context.data_scope > input.context.authorized_scope
}

deny {
  input.action == "share_financial_data"
  input.resource.type == "financial_data"
  input.context.data_purpose != input.context.consent_purpose
}

# FDX security requirements
allow {
  input.action == "access_financial_data"
  input.resource.type == "financial_data"
  input.context.fdx_authentication_valid
  input.context.fdx_authorization_verified
  input.context.transport_security_enabled
  input.context.api_version_supported
}

# Data portability and user rights
allow {
  input.action == "export_financial_data"
  input.resource.type == "financial_data"
  input.context.user_consent_obtained
  input.context.data_format_standardized
  input.context.export_complete
}

# Third-party provider requirements
deny {
  input.action == "access_financial_data"
  input.resource.type == "financial_data"
  input.context.third_party_provider
  not input.context.fdx_certification_valid
}

deny {
  input.action == "access_financial_data"
  input.resource.type == "financial_data"
  input.context.third_party_provider
  not input.context.liability_insurance_verified
}

# Real-time payment security
allow {
  input.action == "process_payment"
  input.resource.type == "payment_transaction"
  input.context.fdx_payment_consent_valid
  input.context.amount_within_limits
  input.context.recipient_verified
  input.context.fraud_detection_enabled
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "fintech_app", "roles": ["data_aggregator"]},
#   "action": "share_financial_data",
#   "resource": {
#     "id": "account_balance_123",
#     "type": "financial_data",
#     "data_type": "account_balance"
#   },
#   "context": {
#     "fdx_consent_valid": true,
#     "data_scope_authorized": true,
#     "recipient_authorized": true,
#     "data_encryption_enabled": true,
#     "data_scope": "account_balance",
#     "authorized_scope": "account_balance",
#     "data_purpose": "financial_planning",
#     "consent_purpose": "financial_planning"
#   }
# }
