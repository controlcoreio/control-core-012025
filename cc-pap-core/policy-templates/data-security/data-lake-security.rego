package controlcore.policy.templates.data_security

# Policy to enforce data lake and data store security requirements
# This policy ensures comprehensive data protection across storage systems

default allow = false

# Allow data access if security requirements are met
allow {
  input.action == "access_data"
  input.resource.type == "data_lake"
  input.context.authentication_valid
  input.context.authorization_verified
  input.context.data_classification_authorized
  input.context.encryption_enabled
}

# Data classification and handling
deny {
  input.action == "access_data"
  input.resource.type == "data_lake"
  input.context.data_classification == "confidential"
  not input.context.need_to_know_verified
}

deny {
  input.action == "access_data"
  input.resource.type == "data_lake"
  input.context.data_classification == "restricted"
  not input.context.clearance_level_verified
}

# Data encryption requirements
deny {
  input.action == "store_data"
  input.resource.type == "data_lake"
  input.context.data_classification == "sensitive"
  not input.context.encryption_at_rest_enabled
}

deny {
  input.action == "transfer_data"
  input.resource.type == "data_lake"
  input.context.data_classification == "sensitive"
  not input.context.encryption_in_transit_enabled
}

# Data retention and lifecycle management
allow {
  input.action == "delete_data"
  input.resource.type == "data_lake"
  input.context.retention_period_expired
  input.context.legal_hold_not_applicable
  input.context.backup_verified
}

# Data lineage and provenance
allow {
  input.action == "modify_data"
  input.resource.type == "data_lake"
  input.context.data_lineage_tracked
  input.context.change_audit_enabled
  input.context.version_control_enabled
}

# Cross-border data transfer restrictions
deny {
  input.action == "transfer_data"
  input.resource.type == "data_lake"
  input.context.destination_country == "restricted_jurisdiction"
  input.context.data_classification == "personal"
}

# Data anonymization and pseudonymization
allow {
  input.action == "share_data"
  input.resource.type == "data_lake"
  input.context.data_anonymized
  input.context.re_identification_risk_assessed
  input.context.consent_obtained
}

# Data quality and integrity
deny {
  input.action == "modify_data"
  input.resource.type == "data_lake"
  input.context.data_integrity_check_failed
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "data_analyst", "roles": ["data_scientist"]},
#   "action": "access_data",
#   "resource": {
#     "id": "customer_analytics_dataset",
#     "type": "data_lake",
#     "dataset": "customer_behavior"
#   },
#   "context": {
#     "authentication_valid": true,
#     "authorization_verified": true,
#     "data_classification_authorized": true,
#     "encryption_enabled": true,
#     "data_classification": "confidential",
#     "need_to_know_verified": true
#   }
# }
