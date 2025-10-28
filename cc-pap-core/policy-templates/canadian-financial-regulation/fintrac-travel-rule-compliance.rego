package controlcore.policy.templates.canadian_financial_regulation.fintrac_travel_rule

# FINTRAC Travel Rule for Virtual Asset Transfers
# Enforces originator and beneficiary information requirements for crypto transfers

default allow = false

# Travel rule applies to virtual asset transfers >= $1,000 CAD
travel_rule_threshold_met {
    input.action == "initiate_crypto_transfer"
    input.resource.type == "virtual_asset_transfer"
    input.context.transfer_amount_cad >= 1000
}

# Originator information must be collected
originator_information_required {
    travel_rule_threshold_met
    not input.context.originator_name_collected
}

originator_information_required {
    travel_rule_threshold_met
    not input.context.originator_address_collected
}

# Beneficiary information must be transmitted
beneficiary_information_required {
    travel_rule_threshold_met
    not input.context.beneficiary_name_transmitted
}

# VASP verification for receiving institution
vasp_verification_required {
    input.action == "send_crypto_to_external_vasp"
    input.resource.type == "virtual_asset_transfer"
    travel_rule_threshold_met
    not input.context.receiving_vasp_verified
}

# Record keeping for travel rule compliance
travel_rule_record_keeping {
    input.action == "process_crypto_transfer"
    input.resource.type == "virtual_asset_transfer"
    travel_rule_threshold_met
    not input.context.travel_rule_data_recorded
}

# Suspicious crypto transfer reporting
suspicious_crypto_transaction {
    input.action == "process_crypto_transfer"
    input.resource.type == "virtual_asset_transfer"
    input.context.transaction_pattern == "suspicious"
}

# Allow with travel rule compliance
allow {
    input.action == "initiate_crypto_transfer"
    input.resource.type == "virtual_asset_transfer"
    input.context.transfer_amount_cad < 1000
}

allow {
    input.action == "initiate_crypto_transfer"
    input.resource.type == "virtual_asset_transfer"
    input.context.transfer_amount_cad >= 1000
    input.context.originator_name_collected == true
    input.context.originator_address_collected == true
    input.context.beneficiary_name_transmitted == true
    input.context.receiving_vasp_verified == true
    input.context.travel_rule_data_recorded == true
}

