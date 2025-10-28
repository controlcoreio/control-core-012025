package controlcore.policy.templates.compliance.fintrac

# Policy to enforce FINTRAC Suspicious Transaction Report (STR) triggers
# This policy monitors transactions for patterns that require STR submission
# to FINTRAC under Canadian AML/ATF regulations

default allow = true # Allow transactions by default, but flag for STR review

# Flag transaction for STR if it meets FINTRAC criteria
str_required {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.transaction_amount >= 10000 # CAD $10,000 threshold
  input.context.currency == "CAD"
}

str_required {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.suspicious_patterns[_] == "structuring"
}

str_required {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.suspicious_patterns[_] == "layering"
}

str_required {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.suspicious_patterns[_] == "integration"
}

# Enhanced STR triggers based on customer risk profile
str_required {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.customer_risk_level == "high"
  input.context.transaction_amount >= 5000 # Lower threshold for high-risk customers
}

# STR required for transactions involving PEPs (Politically Exposed Persons)
str_required {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.customer_type == "pep"
  input.context.transaction_amount >= 1000 # Lower threshold for PEPs
}

# STR required for transactions to/from high-risk jurisdictions
str_required {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.destination_country in ["high_risk_jurisdiction"]
  input.context.transaction_amount >= 1000
}

# STR required for unusual transaction patterns
str_required {
  input.action == "process_transaction"
  input.resource.type == "financial_transaction"
  input.context.transaction_frequency == "unusual"
  input.context.transaction_amount >= 5000
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "bank_teller", "roles": ["teller"]},
#   "action": "process_transaction",
#   "resource": {
#     "id": "txn_12345",
#     "type": "financial_transaction",
#     "amount": 15000,
#     "currency": "CAD"
#   },
#   "context": {
#     "transaction_amount": 15000,
#     "currency": "CAD",
#     "customer_risk_level": "medium",
#     "suspicious_patterns": ["structuring"],
#     "destination_country": "CA"
#   }
# }
