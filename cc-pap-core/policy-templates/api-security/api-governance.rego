package controlcore.policy.templates.api_security

# Policy to enforce API security and governance requirements
# This policy ensures APIs are secure, well-governed, and compliant

default allow = false

# Allow API access if security requirements are met
allow {
  input.action == "access_api"
  input.resource.type == "api_endpoint"
  input.context.authentication_valid
  input.context.authorization_verified
  input.context.rate_limit_compliant
  input.context.ssl_enabled
}

# API versioning and lifecycle management
allow {
  input.action == "deprecate_api"
  input.resource.type == "api_endpoint"
  input.context.deprecation_notice_period >= 90 # 90 days notice
  input.context.alternative_endpoint_provided
  input.context.migration_guide_available
}

# API security scanning and testing
allow {
  input.action == "deploy_api"
  input.resource.type == "api_endpoint"
  input.context.security_scan_passed
  input.context.penetration_testing_completed
  input.context.owasp_compliance_verified
  input.context.api_documentation_complete
}

# API data protection and privacy
deny {
  input.action == "access_api"
  input.resource.type == "api_endpoint"
  input.context.data_classification == "sensitive"
  not input.context.data_encryption_enabled
}

deny {
  input.action == "access_api"
  input.resource.type == "api_endpoint"
  input.context.data_classification == "pii"
  not input.context.privacy_controls_enabled
}

# API monitoring and observability
allow {
  input.action == "monitor_api"
  input.resource.type == "api_endpoint"
  input.context.monitoring_enabled
  input.context.alerting_configured
  input.context.metrics_collection_enabled
}

# API rate limiting and throttling
deny {
  input.action == "access_api"
  input.resource.type == "api_endpoint"
  input.context.request_rate > input.context.rate_limit
}

# API authentication and authorization
deny {
  input.action == "access_api"
  input.resource.type == "api_endpoint"
  not input.context.valid_api_key
}

deny {
  input.action == "access_api"
  input.resource.type == "api_endpoint"
  not input.context.scope_authorized
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "api_consumer", "roles": ["api_user"]},
#   "action": "access_api",
#   "resource": {
#     "id": "user-management-api",
#     "type": "api_endpoint",
#     "version": "v2"
#   },
#   "context": {
#     "authentication_valid": true,
#     "authorization_verified": true,
#     "rate_limit_compliant": true,
#     "ssl_enabled": true,
#     "data_classification": "public",
#     "valid_api_key": true,
#     "scope_authorized": true
#   }
# }
