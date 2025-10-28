package controlcore.policy.templates.compliance.fintrac

# Policy to enforce AML (Anti-Money Laundering) monitoring requirements
# This policy ensures compliance with Canadian AML regulations and FINTRAC requirements

default allow = true

# Enhanced due diligence required for high-risk customers
enhanced_due_diligence_required {
  input.action == "onboard_customer"
  input.resource.type == "customer_profile"
  input.context.customer_risk_level == "high"
}

enhanced_due_diligence_required {
  input.action == "onboard_customer"
  input.resource.type == "customer_profile"
  input.context.customer_type == "pep"
}

enhanced_due_diligence_required {
  input.action == "onboard_customer"
  input.resource.type == "customer_profile"
  input.context.customer_type == "non_resident"
}

# Continuous monitoring requirements for existing customers
continuous_monitoring_required {
  input.action == "update_customer_profile"
  input.resource.type == "customer_profile"
  input.context.customer_risk_level == "high"
}

continuous_monitoring_required {
  input.action == "update_customer_profile"
  input.resource.type == "customer_profile"
  input.context.customer_type == "pep"
}

# Transaction monitoring for suspicious activity patterns
suspicious_activity_detected {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.transaction_amount >= 10000
  input.context.currency == "CAD"
  input.context.customer_kyc_status != "verified"
}

suspicious_activity_detected {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.transaction_pattern == "structuring"
}

suspicious_activity_detected {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.transaction_pattern == "layering"
}

# Cross-border transaction monitoring
cross_border_monitoring_required {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.transaction_type == "international_transfer"
  input.context.transaction_amount >= 1000
}

# Cash transaction reporting requirements
cash_transaction_reporting_required {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.transaction_type == "cash"
  input.context.transaction_amount >= 10000
  input.context.currency == "CAD"
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "compliance_officer", "roles": ["compliance"]},
#   "action": "process_transaction",
#   "resource": {
#     "id": "txn_67890",
#     "type": "financial_transaction",
#     "amount": 15000,
#     "currency": "CAD"
#   },
#   "context": {
#     "transaction_amount": 15000,
#     "currency": "CAD",
#     "transaction_type": "cash",
#     "customer_kyc_status": "verified",
#     "transaction_pattern": "normal"
#   }
# }
