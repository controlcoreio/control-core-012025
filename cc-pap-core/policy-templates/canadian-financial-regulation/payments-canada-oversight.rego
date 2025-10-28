package controlcore.policy.templates.canadian_financial_regulation.payments_canada

# Payments Canada Oversight and Real-Time Rail Requirements
# Enforces payment system rules and RTR (Real-Time Rail) compliance

default allow = false

# RTR participation requirements
rtr_participant_requirements {
    input.action == "join_real_time_rail"
    input.resource.type == "payment_system_membership"
    not input.context.payments_canada_approved
}

# Payment finality and irrevocability
payment_finality_enforcement {
    input.action == "reverse_rtr_payment"
    input.resource.type == "real_time_payment"
    input.context.payment_finalized == true
}

# Liquidity requirements for RTR participants
rtr_liquidity_requirements {
    input.action == "send_rtr_payment"
    input.resource.type == "real_time_payment"
    input.context.available_liquidity_cad < input.context.payment_amount_cad
}

# Payment fraud controls
payment_fraud_controls_required {
    input.action == "process_high_value_payment"
    input.resource.type == "payment_transaction"
    input.context.payment_amount_cad > 25000
    input.context.fraud_score > 0.7
}

# Bulk clearing file validation
bulk_clearing_validation {
    input.action == "submit_clearing_file"
    input.resource.type == "clearing_batch"
    input.context.file_validation_passed == false
}

# Allow with proper payment controls
allow {
    input.action == "send_rtr_payment"
    input.resource.type == "real_time_payment"
    input.context.available_liquidity_cad >= input.context.payment_amount_cad
    input.context.fraud_checks_passed == true
    input.context.sanctions_screening_clear == true
}

allow {
    input.action == "process_high_value_payment"
    input.resource.type == "payment_transaction"
    input.context.fraud_score <= 0.7
    input.context.payment_limit_check_passed == true
    input.context.dual_authorization_obtained == true
}

