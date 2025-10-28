
export const ENVIRONMENTS = [
  { value: "sandbox", label: "Sandbox" },
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
];

export const SAMPLE_REGO_CODE = `package authz.access_control

import rego.v1

# Default deny
default allow := false

# Allow admins to access everything
allow if {
    input.user.role == "admin"
}

# Allow users to read their own data
allow if {
    input.action == "read"
    input.resource.owner == input.user.id
}

# Allow managers to read data from their department
allow if {
    input.action == "read"
    input.user.role == "manager"
    input.resource.department == input.user.department
}

# Allow users to create new resources
allow if {
    input.action == "create"
    input.user.role in ["user", "manager", "admin"]
}

# Deny write access to sensitive resources for regular users
deny if {
    input.action in ["update", "delete"]
    input.resource.classification == "sensitive"
    input.user.role == "user"
}

# Business hours check
business_hours if {
    hour := time.clock(time.now_ns())[0]
    hour >= 9
    hour <= 17
}

# Allow sensitive operations only during business hours
allow if {
    input.action in ["update", "delete"]
    input.resource.classification == "sensitive"
    input.user.role in ["manager", "admin"]
    business_hours
}`;
