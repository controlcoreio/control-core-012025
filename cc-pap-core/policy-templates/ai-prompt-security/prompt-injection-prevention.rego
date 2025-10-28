package cc.policies.ai_prompt_security.prompt_injection_prevention

# Prompt Injection Prevention Policy
# Protects against prompt injection attacks on AI systems

import rego.v1

# Default allow with security checks
default allow = true

# Deny if prompt contains injection patterns
deny {
    input.prompt.injection_patterns != null
    count(input.prompt.injection_patterns) > 0
}

# Deny if prompt contains system commands
deny {
    input.prompt.contains_system_commands == true
    input.user.role != "system_administrator"
}

# Deny if prompt contains role manipulation
deny {
    input.prompt.role_manipulation == true
    input.user.role != "system_administrator"
}

# Deny if prompt contains context manipulation
deny {
    input.prompt.context_manipulation == true
    input.user.role != "system_administrator"
}

# Deny if prompt contains data extraction attempts
deny {
    input.prompt.data_extraction_attempt == true
    input.user.role != "data_administrator"
}

# Require input sanitization
require_input_sanitization {
    input.prompt.sanitized == false
    input.prompt.length > 1000
}

# Require prompt validation
require_prompt_validation {
    input.prompt.validated == false
    input.prompt.contains_user_input == true
}

# Require context isolation
require_context_isolation {
    input.prompt.context_isolated == false
    input.prompt.contains_sensitive_data == true
}

# Require rate limiting for suspicious prompts
require_rate_limiting {
    input.prompt.suspicious_patterns != null
    input.user.rate_limit_exceeded == true
}

# Audit requirements for prompt security
audit_required {
    input.prompt.injection_patterns != null
    input.prompt.contains_sensitive_data == true
}
