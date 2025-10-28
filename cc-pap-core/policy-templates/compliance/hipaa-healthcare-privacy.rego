package cc.policies.compliance.hipaa_healthcare_privacy

# HIPAA Healthcare Privacy Policy
# Ensures compliance with HIPAA healthcare privacy requirements

import rego.v1

# Default deny
default allow = false

# Allow if user is authorized healthcare provider
allow {
    input.user.role == "healthcare_provider"
    input.user.hipaa_authorized == true
    input.user.minimum_necessary == true
}

# Allow if user is patient accessing own data
allow {
    input.user.role == "patient"
    input.user.patient_id == input.resource.patient_id
    input.user.consent.hipaa == true
}

# Allow if user is authorized business associate
allow {
    input.user.role == "business_associate"
    input.user.baa_signed == true
    input.user.hipaa_trained == true
}

# Deny if user lacks minimum necessary access
deny {
    input.user.minimum_necessary == false
    input.user.role != "patient"
}

# Deny if user is not HIPAA trained
deny {
    input.user.hipaa_trained == false
    input.user.role in ["healthcare_provider", "business_associate"]
}

# Deny if patient has not consented
deny {
    input.user.role == "patient"
    input.user.consent.hipaa == false
}

# Require audit trail for PHI access
require_audit_trail {
    input.resource.phi == true
    input.user.role != "patient"
}

# Require encryption for PHI transmission
require_encryption {
    input.resource.phi == true
    input.transmission.encrypted == false
}

# Require access controls for PHI storage
require_access_controls {
    input.resource.phi == true
    input.storage.access_controlled == false
}

# Audit requirements for HIPAA
audit_required {
    input.resource.phi == true
    input.user.role in ["healthcare_provider", "business_associate"]
}
