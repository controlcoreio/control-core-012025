package controlcore.policy.templates.network_security

# Policy to enforce network endpoint and microservice security requirements
# This policy ensures secure communication between microservices and network endpoints

default allow = false

# Allow microservice communication if security requirements are met
allow {
  input.action == "communicate_with_service"
  input.resource.type == "microservice"
  input.context.service_authentication_valid
  input.context.service_authorization_verified
  input.context.network_encryption_enabled
  input.context.service_mesh_configured
}

# Service-to-service authentication
deny {
  input.action == "communicate_with_service"
  input.resource.type == "microservice"
  not input.context.mutual_tls_enabled
}

deny {
  input.action == "communicate_with_service"
  input.resource.type == "microservice"
  not input.context.service_identity_verified
}

# Network segmentation and isolation
deny {
  input.action == "access_network_endpoint"
  input.resource.type == "network_endpoint"
  input.context.network_segment == "dmz"
  not input.context.firewall_rules_applied
}

deny {
  input.action == "access_network_endpoint"
  input.resource.type == "network_endpoint"
  input.context.network_segment == "internal"
  not input.context.vpn_required
}

# API gateway security
allow {
  input.action == "access_api_gateway"
  input.resource.type == "api_gateway"
  input.context.rate_limiting_enabled
  input.context.ddos_protection_enabled
  input.context.waf_rules_applied
  input.context.ssl_termination_enabled
}

# Load balancer security
allow {
  input.action == "access_load_balancer"
  input.resource.type == "load_balancer"
  input.context.health_checks_enabled
  input.context.ssl_offloading_enabled
  input.context.sticky_sessions_disabled
}

# Service discovery and registration
deny {
  input.action == "register_service"
  input.resource.type == "microservice"
  not input.context.service_identity_verified
}

deny {
  input.action == "register_service"
  input.resource.type == "microservice"
  not input.context.service_health_verified
}

# Circuit breaker and resilience
allow {
  input.action == "call_service"
  input.resource.type == "microservice"
  input.context.circuit_breaker_enabled
  input.context.retry_policy_configured
  input.context.timeout_configured
}

# Monitoring and observability
allow {
  input.action == "monitor_service"
  input.resource.type == "microservice"
  input.context.metrics_collection_enabled
  input.context.distributed_tracing_enabled
  input.context.log_aggregation_enabled
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "service_a", "roles": ["microservice"]},
#   "action": "communicate_with_service",
#   "resource": {
#     "id": "user_service",
#     "type": "microservice",
#     "service_name": "user-management"
#   },
#   "context": {
#     "service_authentication_valid": true,
#     "service_authorization_verified": true,
#     "network_encryption_enabled": true,
#     "service_mesh_configured": true,
#     "mutual_tls_enabled": true,
#     "service_identity_verified": true
#   }
# }
