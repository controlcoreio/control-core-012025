package cc.policies.ai_risk_management.bias_detection

# AI Bias Detection Policy
# NIST Framework-based bias detection and mitigation

import rego.v1

# Default allow with bias monitoring
default allow = true

# Deny if bias detected above threshold
deny {
    input.model.bias_metrics.disparate_impact > 0.8
    input.model.bias_metrics.statistical_parity < 0.2
}

# Deny if model shows demographic bias
deny {
    input.model.bias_metrics.demographic_parity < 0.1
    input.decision.affects_protected_class == true
}

# Require bias testing for new models
require_bias_testing {
    input.model.bias_testing_complete == false
    input.model.risk_level in ["medium", "high"]
}

# Require bias monitoring for deployed models
require_bias_monitoring {
    input.model.deployment_status == "active"
    input.model.bias_monitoring_enabled == false
}

# Require bias mitigation for high-risk decisions
require_bias_mitigation {
    input.decision.risk_level == "high"
    input.decision.affects_protected_class == true
    input.model.bias_mitigation_applied == false
}

# Audit requirements for bias
audit_required {
    input.model.bias_metrics.disparate_impact > 0.5
    input.decision.affects_protected_class == true
}
