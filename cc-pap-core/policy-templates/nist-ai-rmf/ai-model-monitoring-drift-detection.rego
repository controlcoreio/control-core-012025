package cc.policies.nist_ai_rmf.ai_model_monitoring_drift_detection

# NIST AI RMF - AI Model Monitoring and Drift Detection Policy
# Implements continuous monitoring requirements for AI model performance and drift

import rego.v1

# Default deny
default allow = false
default drift_detected = false

# Drift detection thresholds
drift_thresholds := {
    "data_drift": 0.15,      # 15% acceptable data drift
    "concept_drift": 0.10,    # 10% acceptable concept drift
    "performance_drift": 0.05 # 5% acceptable performance drift
}

# Performance metric thresholds
performance_thresholds := {
    "accuracy": 0.90,
    "precision": 0.85,
    "recall": 0.85,
    "f1_score": 0.85,
    "auc_roc": 0.88
}

# Check if monitoring is properly configured
monitoring_configured := {
    input.ai_model.monitoring.enabled == true
    input.ai_model.monitoring.metrics_tracked
    count(input.ai_model.monitoring.metrics_tracked) >= 3
    input.ai_model.monitoring.frequency_minutes <= 60
}

# Detect data drift (input distribution changes)
data_drift_acceptable := {
    input.ai_model.metrics.data_drift_score <= drift_thresholds.data_drift
}

# Detect concept drift (input-output relationship changes)
concept_drift_acceptable := {
    input.ai_model.metrics.concept_drift_score <= drift_thresholds.concept_drift
}

# Detect performance drift (model accuracy degradation)
performance_drift_acceptable := {
    input.ai_model.metrics.performance_drift_score <= drift_thresholds.performance_drift
}

# Validate current performance meets thresholds
performance_acceptable := {
    current_metrics := input.ai_model.current_performance
    
    all_metrics_pass := [metric |
        metric := current_metrics[m]
        threshold := performance_thresholds[m]
        metric >= threshold
    ]
    
    count(all_metrics_pass) >= 4  # At least 4 out of 5 metrics must pass
}

# Check for alert acknowledgment
alerts_acknowledged := {
    input.ai_model.alerts.pending_count == 0
} {
    input.ai_model.alerts.oldest_unacknowledged_hours <= 24
}

# Verify retraining schedule
retraining_schedule_current := {
    input.ai_model.retraining.scheduled == true
    input.ai_model.retraining.last_retrain_date
    
    days_since_retrain := (time.now_ns() - time.parse_rfc3339_ns(input.ai_model.retraining.last_retrain_date)) / (24 * 60 * 60 * 1000000000)
    days_since_retrain <= input.ai_model.retraining.max_days_between_retraining
}

# Check if baseline comparison is available
baseline_comparison_available := {
    input.ai_model.baseline.established == true
    input.ai_model.baseline.metrics
    count(input.ai_model.baseline.metrics) > 0
}

# Calculate overall drift score
overall_drift_score := score {
    data_weight := 0.35
    concept_weight := 0.35
    performance_weight := 0.30
    
    data_score := input.ai_model.metrics.data_drift_score * data_weight
    concept_score := input.ai_model.metrics.concept_drift_score * concept_weight
    performance_score := input.ai_model.metrics.performance_drift_score * performance_weight
    
    score := data_score + concept_score + performance_score
}

# Determine drift severity
drift_severity := level {
    score := overall_drift_score
    level := score <= 0.05 ? "none" :
             score <= 0.10 ? "low" :
             score <= 0.15 ? "medium" :
             score <= 0.20 ? "high" : "critical"
}

# Allow if all monitoring checks pass
allow {
    input.action == "use_model"
    monitoring_configured
    data_drift_acceptable
    concept_drift_acceptable
    performance_drift_acceptable
    performance_acceptable
    alerts_acknowledged
    baseline_comparison_available
}

# Allow with warnings for development environment
allow {
    input.action == "use_model"
    input.environment == "development"
    monitoring_configured
    performance_acceptable
}

# Allow if drift detected but mitigation plan exists
allow {
    input.action == "use_model"
    monitoring_configured
    drift_severity in ["low", "medium"]
    input.ai_model.drift_mitigation_plan.exists == true
    input.ai_model.drift_mitigation_plan.approved == true
}

# Deny if monitoring not configured
deny {
    input.action == "use_model"
    input.environment == "production"
    not monitoring_configured
}

# Deny if critical drift detected
deny {
    input.action == "use_model"
    input.environment == "production"
    drift_severity == "critical"
}

# Deny if performance below thresholds
deny {
    input.action == "use_model"
    input.environment == "production"
    not performance_acceptable
}

# Deny if unacknowledged critical alerts
deny {
    input.action == "use_model"
    input.environment == "production"
    input.ai_model.alerts.critical_unacknowledged_count > 0
}

# Required actions based on drift detection
required_actions := actions {
    drift_severity == "critical"
    actions := ["immediate_model_review", "stop_predictions", "investigate_drift_cause", "retrain_model"]
} else := actions {
    drift_severity == "high"
    actions := ["schedule_retraining", "increase_monitoring_frequency", "review_input_data"]
} else := actions {
    drift_severity == "medium"
    actions := ["monitor_closely", "prepare_retraining_plan"]
} else := actions {
    not performance_acceptable
    actions := ["performance_analysis", "model_tuning", "consider_retraining"]
} else := actions {
    actions := []
}

# Determine if retraining is required
retraining_required := {
    drift_severity in ["high", "critical"]
} {
    not performance_acceptable
} {
    not retraining_schedule_current
}

# Audit requirements
audit_required {
    drift_severity in ["medium", "high", "critical"]
} {
    retraining_required
} {
    input.ai_model.alerts.critical_unacknowledged_count > 0
}

# Response with comprehensive monitoring status
response := {
    "allow": allow,
    "drift_detected": drift_severity != "none",
    "drift_severity": drift_severity,
    "overall_drift_score": overall_drift_score,
    "data_drift_acceptable": data_drift_acceptable,
    "concept_drift_acceptable": concept_drift_acceptable,
    "performance_drift_acceptable": performance_drift_acceptable,
    "performance_acceptable": performance_acceptable,
    "retraining_required": retraining_required,
    "required_actions": required_actions,
    "monitoring_status": monitoring_configured,
    "audit_required": audit_required
}

