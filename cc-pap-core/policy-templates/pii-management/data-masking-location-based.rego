package controlcore.policy.templates.pii_management

# Policy to enforce location-based data masking for PII
# This policy masks sensitive data based on user location, network, and geographic restrictions

default allow = true # Allow access by default, but apply masking rules

# Mask PII for users in restricted locations
mask_pii_restricted_location {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.location in ["restricted_country", "high_risk_jurisdiction"]
  input.context.data_classification == "sensitive"
}

# Mask PII for users outside authorized regions
mask_pii_unauthorized_region {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.location not in input.context.authorized_regions
  input.context.data_classification == "confidential"
}

# Mask PII for users in public networks
mask_pii_public_network {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.network_type == "public"
  input.context.data_classification == "sensitive"
}

# Mask PII for users in unsecured networks
mask_pii_unsecured_network {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.network_security_level < input.context.required_security_level
  input.context.data_classification == "confidential"
}

# Enhanced masking for cross-border data transfers
enhanced_mask_cross_border {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.location != input.resource.data_residency_country
  input.context.data_classification == "restricted"
  input.context.cross_border_transfer_restricted
}

# Mask PII for users in high-risk countries
mask_pii_high_risk_country {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.country in ["high_risk_country_1", "high_risk_country_2"]
  input.context.data_classification == "sensitive"
}

# Mask PII for users in countries without adequate data protection
mask_pii_inadequate_protection {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.country in ["inadequate_protection_country_1", "inadequate_protection_country_2"]
  input.context.data_classification == "personal"
}

# Allow full access for users in authorized locations
allow_full_access_authorized_location {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.location in input.context.authorized_locations
  input.user.network_type == "corporate"
  input.context.business_justification_provided
}

# Allow access for users in secure corporate networks
allow_secure_corporate_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.network_type == "corporate"
  input.user.network_security_level >= input.context.required_security_level
  input.user.location in input.context.corporate_locations
}

# Mask PII for users in mobile networks
mask_pii_mobile_network {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.network_type == "mobile"
  input.context.data_classification == "restricted"
}

# Mask PII for users in VPN-restricted locations
mask_pii_vpn_restricted {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.location in input.context.vpn_restricted_locations
  input.context.data_classification == "confidential"
}

# Allow access for users with proper VPN
allow_vpn_access {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.vpn_connected
  input.user.vpn_security_level >= input.context.required_vpn_security
  input.context.business_justification_provided
}

# Mask PII for users in countries with data localization requirements
mask_pii_data_localization {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.country in input.context.data_localization_countries
  input.resource.data_residency_country != input.user.country
  input.context.data_classification == "personal"
}

# Mask PII for users in countries with strict data protection laws
mask_pii_strict_protection {
  input.action == "access_pii"
  input.resource.type == "personal_data"
  input.user.country in ["EU", "UK", "Canada"]
  input.context.data_classification == "personal"
  not input.context.gdpr_compliant_transfer
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "analyst_1",
#     "location": "remote_office",
#     "country": "Canada",
#     "network_type": "corporate",
#     "network_security_level": 5,
#     "vpn_connected": true,
#     "vpn_security_level": 4
#   },
#   "action": "access_pii",
#   "resource": {
#     "id": "customer_profile_123",
#     "type": "personal_data",
#     "data_residency_country": "Canada"
#   },
#   "context": {
#     "data_classification": "confidential",
#     "authorized_regions": ["Canada", "US", "EU"],
#     "authorized_locations": ["headquarters", "remote_office"],
#     "corporate_locations": ["headquarters", "remote_office"],
#     "required_security_level": 4,
#     "required_vpn_security": 3,
#     "business_justification_provided": true,
#     "cross_border_transfer_restricted": false,
#     "vpn_restricted_locations": ["public_cafe", "airport"],
#     "data_localization_countries": ["Russia", "China"],
#     "data_localization_countries": ["EU", "UK", "Canada"],
#     "gdpr_compliant_transfer": true
#   }
# }
