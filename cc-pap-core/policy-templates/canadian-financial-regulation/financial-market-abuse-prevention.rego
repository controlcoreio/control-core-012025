package controlcore.policy.templates.canadian_financial_regulation.market_abuse

# Financial Market Abuse and Insider Trading Prevention
# Enforces controls to prevent market manipulation and insider trading

default allow = false

# Insider trading prevention
insider_trading_prevention {
    input.action == "execute_trade"
    input.resource.type == "securities_order"
    input.user.insider_status == true
    input.context.blackout_period_active == true
}

# Material non-public information (MNPI) controls
mnpi_access_controls {
    input.action == "access_mnpi"
    input.resource.type == "confidential_information"
    input.context.information_classification == "material_non_public"
    not input.user.authorized_for_mnpi
}

# Chinese wall between divisions
chinese_wall_enforcement {
    input.action == "share_client_information"
    input.resource.type == "client_data"
    input.user.division == "investment_banking"
    input.context.target_division == "trading"
}

# Market manipulation detection
market_manipulation_prevention {
    input.action == "place_market_order"
    input.resource.type == "trading_order"
    input.context.order_pattern == "suspicious"
    input.context.manipulation_risk_score > 0.8
}

# Pre-clearance for employee trading
employee_trading_preclearance {
    input.action == "employee_personal_trade"
    input.resource.type == "employee_securities_order"
    input.user.role in ["portfolio_manager", "analyst", "trader"]
    not input.context.preclearance_approved
}

# Allow with proper controls
allow {
    input.action == "execute_trade"
    input.resource.type == "securities_order"
    input.user.insider_status == true
    input.context.blackout_period_active == false
    input.context.preclearance_approved == true
    input.context.trading_plan_10b5_1_active == true
}

allow {
    input.action == "access_mnpi"
    input.resource.type == "confidential_information"
    input.user.authorized_for_mnpi == true
    input.context.business_need_documented == true
    input.context.access_logged_for_surveillance == true
}

