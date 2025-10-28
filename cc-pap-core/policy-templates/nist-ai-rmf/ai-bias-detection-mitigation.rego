package cc.policies.nist_ai_rmf.ai_bias_detection_mitigation

# NIST AI RMF - AI Bias Detection and Mitigation Policy
# Implements fairness and bias detection requirements from NIST AI RMF

import rego.v1

# Default deny
default allow = false
default bias_detected = true

# Define protected attributes for bias assessment
protected_attributes := [
    "race",
    "ethnicity",
    "gender",
    "age",
    "disability",
    "religion",
    "sexual_orientation",
    "national_origin"
]

# Fairness metrics thresholds
fairness_thresholds := {
    "demographic_parity": 0.8,  # 80% rule
    "equal_opportunity": 0.85,
    "disparate_impact": 0.8,
    "statistical_parity": 0.85
}

# Check if bias assessment has been performed
bias_assessment_complete := {
    input.ai_model.bias_assessment.completed == true
    input.ai_model.bias_assessment.date
    time.now_ns() - time.parse_rfc3339_ns(input.ai_model.bias_assessment.date) < (90 * 24 * 60 * 60 * 1000000000)  # Within 90 days
}

# Validate fairness metrics
fairness_metrics_acceptable := {
    all_metrics_pass := [metric |
        metric := input.ai_model.fairness_metrics[m]
        threshold := fairness_thresholds[m]
        metric >= threshold
    ]
    count(all_metrics_pass) == count(input.ai_model.fairness_metrics)
}

# Check for bias in protected attributes
no_significant_bias := {
    count([attr | 
        attr := protected_attributes[_]
        input.ai_model.bias_metrics[attr].bias_score > input.ai_model.bias_threshold
    ]) == 0
}

# Verify mitigation strategies are in place
mitigation_strategies_implemented := {
    input.ai_model.mitigation_strategies
    count(input.ai_model.mitigation_strategies) > 0
    
    # Must have at least one pre-processing and one post-processing mitigation
    has_preprocessing := count([s | 
        s := input.ai_model.mitigation_strategies[_]
        s.type == "preprocessing"
    ]) > 0
    
    has_postprocessing := count([s | 
        s := input.ai_model.mitigation_strategies[_]
        s.type == "postprocessing"
    ]) > 0
    
    has_preprocessing
    has_postprocessing
}

# Check if continuous monitoring is enabled
continuous_monitoring_active := {
    input.ai_model.monitoring.bias_detection_enabled == true
    input.ai_model.monitoring.alert_thresholds_configured == true
    input.ai_model.monitoring.frequency_hours <= 24  # At least daily
}

# Allow if all bias checks pass
allow {
    input.action in ["deploy_model", "update_model", "use_model"]
    bias_assessment_complete
    fairness_metrics_acceptable
    no_significant_bias
    mitigation_strategies_implemented
    continuous_monitoring_active
}

# Allow with warnings if minor issues exist
allow {
    input.action == "use_model"
    input.environment == "development"
    bias_assessment_complete
    input.ai_model.bias_review_scheduled == true
}

# Deny if bias assessment is outdated
deny {
    input.action in ["deploy_model", "update_model"]
    not bias_assessment_complete
}

# Deny if significant bias detected
deny {
    input.action in ["deploy_model", "update_model", "use_model"]
    not no_significant_bias
    input.environment == "production"
}

# Deny if mitigation strategies not implemented
deny {
    input.action in ["deploy_model", "update_model"]
    not mitigation_strategies_implemented
}

# Calculate overall bias risk score
bias_risk_score := score {
    # Assessment completeness (25%)
    assessment_score := bias_assessment_complete ? 0 : 25
    
    # Fairness metrics (30%)
    fairness_score := fairness_metrics_acceptable ? 0 : 30
    
    # Bias presence (30%)
    bias_score := no_significant_bias ? 0 : 30
    
    # Mitigation effectiveness (15%)
    mitigation_score := mitigation_strategies_implemented ? 0 : 15
    
    score := assessment_score + fairness_score + bias_score + mitigation_score
}

# Determine bias risk level
bias_risk_level := level {
    score := bias_risk_score
    level := score == 0 ? "minimal" :
             score <= 25 ? "low" :
             score <= 50 ? "medium" :
             score <= 75 ? "high" : "critical"
}

# Required actions based on bias detection
required_actions := actions {
    not fairness_metrics_acceptable
    actions := ["review_training_data", "implement_mitigation", "retest_fairness"]
} else := actions {
    not no_significant_bias
    actions := ["bias_mitigation_required", "protected_attribute_analysis", "model_retraining"]
} else := actions {
    not mitigation_strategies_implemented
    actions := ["implement_preprocessing_mitigation", "implement_postprocessing_mitigation", "validate_effectiveness"]
} else := actions {
    actions := []
}

# Audit requirements
audit_required {
    input.action in ["deploy_model", "update_model", "use_model"]
    bias_risk_level in ["medium", "high", "critical"]
}

# Response with comprehensive bias assessment
response := {
    "allow": allow,
    "bias_detected": not no_significant_bias,
    "bias_risk_score": bias_risk_score,
    "bias_risk_level": bias_risk_level,
    "fairness_metrics_pass": fairness_metrics_acceptable,
    "mitigation_required": count(required_actions) > 0,
    "required_actions": required_actions,
    "monitoring_status": continuous_monitoring_active,
    "audit_required": audit_required
}

