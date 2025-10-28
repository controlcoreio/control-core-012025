package controlcore.policy.templates.cloud_security

# Policy to enforce cloud infrastructure security requirements
# This policy ensures comprehensive security across cloud environments

default allow = false

# Allow cloud resource access if security requirements are met
allow {
  input.action == "access_cloud_resource"
  input.resource.type == "cloud_infrastructure"
  input.context.authentication_valid
  input.context.authorization_verified
  input.context.network_security_enabled
  input.context.encryption_enabled
}

# Cloud resource provisioning security
allow {
  input.action == "provision_cloud_resource"
  input.resource.type == "cloud_infrastructure"
  input.context.security_scan_passed
  input.context.compliance_verified
  input.context.cost_approval_obtained
  input.context.resource_tagging_complete
}

# Network security and segmentation
deny {
  input.action == "access_cloud_resource"
  input.resource.type == "cloud_infrastructure"
  input.context.network_segment == "dmz"
  not input.context.firewall_rules_configured
}

deny {
  input.action == "access_cloud_resource"
  input.resource.type == "cloud_infrastructure"
  input.context.network_segment == "private"
  not input.context.vpn_connection_established
}

# Identity and access management
deny {
  input.action == "access_cloud_resource"
  input.resource.type == "cloud_infrastructure"
  not input.context.mfa_enabled
}

deny {
  input.action == "access_cloud_resource"
  input.resource.type == "cloud_infrastructure"
  not input.context.principle_of_least_privilege
}

# Data protection and encryption
deny {
  input.action == "store_data"
  input.resource.type == "cloud_infrastructure"
  input.context.data_classification == "sensitive"
  not input.context.encryption_at_rest_enabled
}

deny {
  input.action == "transfer_data"
  input.resource.type == "cloud_infrastructure"
  input.context.data_classification == "sensitive"
  not input.context.encryption_in_transit_enabled
}

# Monitoring and logging
allow {
  input.action == "monitor_cloud_resource"
  input.resource.type == "cloud_infrastructure"
  input.context.monitoring_enabled
  input.context.logging_enabled
  input.context.alerting_configured
}

# Compliance and governance
deny {
  input.action == "deploy_cloud_resource"
  input.resource.type == "cloud_infrastructure"
  not input.context.compliance_scan_passed
}

deny {
  input.action == "deploy_cloud_resource"
  input.resource.type == "cloud_infrastructure"
  not input.context.governance_policies_applied
}

# Disaster recovery and backup
allow {
  input.action == "backup_cloud_resource"
  input.resource.type == "cloud_infrastructure"
  input.context.backup_strategy_defined
  input.context.recovery_time_objective_met
  input.context.recovery_point_objective_met
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "cloud_engineer", "roles": ["cloud_admin"]},
#   "action": "access_cloud_resource",
#   "resource": {
#     "id": "production_database",
#     "type": "cloud_infrastructure",
#     "service": "rds"
#   },
#   "context": {
#     "authentication_valid": true,
#     "authorization_verified": true,
#     "network_security_enabled": true,
#     "encryption_enabled": true,
#     "network_segment": "private",
#     "vpn_connection_established": true,
#     "mfa_enabled": true,
#     "principle_of_least_privilege": true
#   }
# }
