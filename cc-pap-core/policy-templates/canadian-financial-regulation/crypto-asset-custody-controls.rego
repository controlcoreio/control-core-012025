package controlcore.policy.templates.canadian_financial_regulation.crypto_custody

# Crypto Asset Custody and Wallet Controls (Canadian Framework)
# Enforces custody requirements for virtual asset service providers

default allow = false

# Cold wallet storage for customer assets
cold_wallet_requirement {
    input.action == "store_customer_crypto"
    input.resource.type == "crypto_wallet"
    input.context.wallet_type == "hot_wallet"
    input.context.asset_value_cad > 1000000
}

# Multi-signature requirements for large transfers
multisig_requirement {
    input.action == "transfer_crypto_assets"
    input.resource.type == "crypto_withdrawal"
    input.context.transfer_amount_cad > 100000
    input.context.signature_count < 3
}

# Segregation of customer and corporate assets
asset_segregation_required {
    input.action == "commingle_assets"
    input.resource.type == "crypto_wallet"
    input.context.wallet_contains_customer_assets == true
    input.context.wallet_contains_corporate_assets == true
}

# Proof of reserves requirements
proof_of_reserves_validation {
    input.action == "publish_asset_report"
    input.resource.type == "reserve_attestation"
    input.context.days_since_last_attestation > 90
}

# Private key management
private_key_security {
    input.action == "access_private_key"
    input.resource.type == "wallet_private_key"
    input.context.wallet_value_cad > 500000
    not input.context.hsm_protected
}

# Allow with proper custody controls
allow {
    input.action == "store_customer_crypto"
    input.resource.type == "crypto_wallet"
    input.context.wallet_type == "cold_wallet"
    input.context.custody_insurance_active == true
    input.context.asset_segregation_verified == true
}

allow {
    input.action == "transfer_crypto_assets"
    input.resource.type == "crypto_withdrawal"
    input.context.transfer_amount_cad > 100000
    input.context.signature_count >= 3
    input.context.withdrawal_whitelist_verified == true
    input.context.fraud_screening_passed == true
}

