package cc.policies.ai_governance.decision_transparency

# AI Decision Transparency Policy
# Ensures AI decisions are transparent and explainable

import rego.v1

# Default allow with transparency requirements
default allow = true

# Require explanation for high-impact decisions
require_explanation {
    input.decision.impact_level == "high"
    input.decision.explanation == null
}

# Require explanation for decisions affecting protected classes
require_explanation {
    input.decision.affects_protected_class == true
    input.decision.explanation == null
}

# Require explanation for decisions with confidence below threshold
require_explanation {
    input.decision.confidence < 0.8
    input.decision.explanation == null
}

# Allow with explanation
allow {
    input.decision.explanation != null
    input.decision.explanation.confidence >= 0.7
}

# Deny if explanation is insufficient
deny {
    input.decision.explanation != null
    input.decision.explanation.confidence < 0.5
}

# Require human review for certain decision types
require_human_review {
    input.decision.type in ["loan_approval", "hiring_decision", "medical_diagnosis"]
    input.decision.confidence < 0.9
}

# Audit requirements for transparency
audit_required {
    input.decision.impact_level in ["medium", "high"]
    input.decision.explanation != null
}
