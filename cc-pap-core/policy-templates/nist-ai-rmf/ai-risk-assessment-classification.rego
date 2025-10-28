package cc.policies.nist_ai_rmf.ai_risk_assessment_classification

# NIST AI RMF - AI Risk Assessment and Classification Policy
# Implements NIST AI Risk Management Framework for AI system risk assessment

import rego.v1

# Default deny
default allow = false
default risk_classification = "high"

# Risk classification levels
risk_levels := {
    "low": {"score_min": 0, "score_max": 30},
    "medium": {"score_min": 31, "score_max": 60},
    "high": {"score_min": 61, "score_max": 85},
    "critical": {"score_min": 86, "score_max": 100}
}

# Calculate risk score based on NIST AI RMF factors
risk_score := score {
    impact_score := calculate_impact_score
    likelihood_score := calculate_likelihood_score
    exposure_score := calculate_exposure_score
    
    score := (impact_score * 0.4) + (likelihood_score * 0.35) + (exposure_score * 0.25)
}

# Calculate impact score
calculate_impact_score := score {
    factors := {
        "affects_critical_infrastructure": 25,
        "affects_human_safety": 30,
        "affects_civil_rights": 25,
        "affects_financial_systems": 20
    }
    
    matched := [factors[key] | 
        input.ai_system.impact_areas[key] == true
        factors[key]
    ]
    
    score := sum(matched)
}

# Calculate likelihood score
calculate_likelihood_score := score {
    base_score := 0
    
    # Model complexity increases likelihood of issues
    complexity_score := input.ai_system.model_complexity * 10
    
    # Lack of validation increases risk
    validation_score := input.ai_system.validation_level == "none" ? 30 : 
                       input.ai_system.validation_level == "basic" ? 15 : 0
    
    # Data quality issues increase risk
    data_quality_score := input.ai_system.data_quality_score < 70 ? 25 : 
                         input.ai_system.data_quality_score < 85 ? 10 : 0
    
    score := complexity_score + validation_score + data_quality_score
}

# Calculate exposure score
calculate_exposure_score := score {
    # Number of users/systems affected
    user_score := input.ai_system.user_count > 1000000 ? 30 :
                 input.ai_system.user_count > 100000 ? 20 :
                 input.ai_system.user_count > 10000 ? 10 : 5
    
    # Deployment scope
    scope_score := input.ai_system.deployment_scope == "public" ? 25 :
                  input.ai_system.deployment_scope == "organization" ? 15 : 5
    
    score := user_score + scope_score
}

# Determine risk classification
risk_classification := level {
    score := risk_score
    level := [l | 
        risk_levels[l]
        score >= risk_levels[l].score_min
        score <= risk_levels[l].score_max
    ][0]
}

# Allow if risk is properly assessed and classified
allow {
    input.action == "deploy_ai_system"
    risk_classification
    input.ai_system.risk_assessment_completed == true
    input.ai_system.risk_mitigation_plan_approved == true
    
    # Low and medium risk can be deployed with standard approval
    risk_classification in ["low", "medium"]
    input.approvals.technical_lead == true
}

# High risk requires additional approvals
allow {
    input.action == "deploy_ai_system"
    risk_classification == "high"
    input.ai_system.risk_assessment_completed == true
    input.ai_system.risk_mitigation_plan_approved == true
    input.approvals.technical_lead == true
    input.approvals.security_officer == true
    input.approvals.compliance_officer == true
}

# Critical risk requires executive approval
allow {
    input.action == "deploy_ai_system"
    risk_classification == "critical"
    input.ai_system.risk_assessment_completed == true
    input.ai_system.risk_mitigation_plan_approved == true
    input.ai_system.independent_review_completed == true
    input.approvals.technical_lead == true
    input.approvals.security_officer == true
    input.approvals.compliance_officer == true
    input.approvals.ciso == true
    input.approvals.executive_sponsor == true
}

# Deny if risk assessment is incomplete
deny {
    input.action == "deploy_ai_system"
    input.ai_system.risk_assessment_completed != true
}

# Deny if critical risk without proper approvals
deny {
    input.action == "deploy_ai_system"
    risk_classification == "critical"
    not input.approvals.ciso
}

# Required monitoring for deployed systems
require_monitoring {
    risk_classification in ["high", "critical"]
    input.ai_system.continuous_monitoring_enabled != true
}

# Audit trail required for all AI system deployments
audit_required {
    input.action == "deploy_ai_system"
}

# Response with risk details
response := {
    "allow": allow,
    "risk_score": risk_score,
    "risk_classification": risk_classification,
    "required_approvals": required_approvals,
    "monitoring_required": require_monitoring,
    "audit_required": audit_required
}

# Define required approvals based on risk level
required_approvals := approvals {
    risk_classification == "low"
    approvals := ["technical_lead"]
} else := approvals {
    risk_classification == "medium"
    approvals := ["technical_lead"]
} else := approvals {
    risk_classification == "high"
    approvals := ["technical_lead", "security_officer", "compliance_officer"]
} else := approvals {
    risk_classification == "critical"
    approvals := ["technical_lead", "security_officer", "compliance_officer", "ciso", "executive_sponsor"]
}

