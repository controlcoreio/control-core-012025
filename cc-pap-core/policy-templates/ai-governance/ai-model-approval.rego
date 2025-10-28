package cc.policies.ai_governance.model_approval

# AI Model Approval Policy
# Ensures AI models are properly approved before deployment

import rego.v1

# Default deny
default allow = false

# Allow if model is approved
allow {
    input.model.approval_status == "approved"
    input.model.approval_date != null
    input.model.approved_by != null
}

# Allow if model is in testing phase with proper oversight
allow {
    input.model.approval_status == "testing"
    input.model.testing_oversight == true
    input.user.role in ["ai_governance", "model_approver", "admin"]
}

# Deny if model has known issues
deny {
    input.model.known_issues != null
    count(input.model.known_issues) > 0
}

# Deny if model lacks required documentation
deny {
    not input.model.documentation_complete
}

# Deny if model hasn't passed bias testing
deny {
    not input.model.bias_testing_passed
}

# Deny if model hasn't passed security review
deny {
    not input.model.security_review_passed
}

# Require additional approval for high-risk models
require_additional_approval {
    input.model.risk_level == "high"
    input.model.approval_status != "approved"
    input.user.role != "senior_approver"
}

# Audit requirements
audit_required {
    input.model.risk_level in ["medium", "high"]
    input.action in ["deploy", "modify", "retire"]
}
