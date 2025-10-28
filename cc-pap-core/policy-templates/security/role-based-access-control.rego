package controlcore.policy.templates.security

# Policy to enforce Role-Based Access Control (RBAC)
# This policy ensures users can only access resources based on their assigned roles

default allow = false # Deny by default, require explicit role-based authorization

# Allow access based on user roles
allow {
  input.action == "read_resource"
  input.resource.type == "protected_resource"
  input.user.roles[_] in ["viewer", "analyst", "administrator"]
}

allow {
  input.action == "modify_resource"
  input.resource.type == "protected_resource"
  input.user.roles[_] in ["editor", "administrator"]
}

allow {
  input.action == "delete_resource"
  input.resource.type == "protected_resource"
  input.user.roles[_] in ["administrator"]
}

# Allow access based on resource ownership
allow {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.id == input.resource.owner_id
  input.user.roles[_] in ["owner", "administrator"]
}

# Allow access based on department roles
allow {
  input.action == "access_resource"
  input.resource.type == "department_resource"
  input.user.department == input.resource.department
  input.user.roles[_] in ["department_member", "department_admin", "administrator"]
}

# Allow access based on project roles
allow {
  input.action == "access_resource"
  input.resource.type == "project_resource"
  input.user.id in input.resource.project_members
  input.user.roles[_] in ["project_member", "project_admin", "administrator"]
}

# Allow access based on clearance levels
allow {
  input.action == "access_resource"
  input.resource.type == "classified_resource"
  input.user.clearance_level >= input.resource.required_clearance_level
  input.user.roles[_] in ["cleared_user", "administrator"]
}

# Allow access based on certification requirements
allow {
  input.action == "access_resource"
  input.resource.type == "certified_resource"
  input.user.certifications[_] == input.resource.required_certification
  input.user.roles[_] in ["certified_user", "administrator"]
}

# Allow access based on training requirements
allow {
  input.action == "access_resource"
  input.resource.type == "training_required_resource"
  input.user.training_completed[_] == input.resource.required_training
  input.user.roles[_] in ["trained_user", "administrator"]
}

# Deny access for users without required roles
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  not input.user.roles[_] in ["viewer", "analyst", "editor", "administrator"]
}

deny {
  input.action == "modify_resource"
  input.resource.type == "protected_resource"
  not input.user.roles[_] in ["editor", "administrator"]
}

deny {
  input.action == "delete_resource"
  input.resource.type == "protected_resource"
  not input.user.roles[_] in ["administrator"]
}

# Deny access for users without required clearance
deny {
  input.action == "access_resource"
  input.resource.type == "classified_resource"
  input.user.clearance_level < input.resource.required_clearance_level
}

# Deny access for users without required certification
deny {
  input.action == "access_resource"
  input.resource.type == "certified_resource"
  not input.user.certifications[_] == input.resource.required_certification
}

# Deny access for users without required training
deny {
  input.action == "access_resource"
  input.resource.type == "training_required_resource"
  not input.user.training_completed[_] == input.resource.required_training
}

# Deny access for users with expired roles
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.role_expiry < input.context.current_timestamp
}

# Deny access for users with suspended roles
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.role_status == "suspended"
}

# Deny access for users with inactive roles
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.role_status == "inactive"
}

# Deny access for users with conflicting roles
deny {
  input.action == "access_resource"
  input.resource.type == "protected_resource"
  input.user.roles[_] == "conflicting_role"
  input.context.conflict_detected
}

# Example of how to use this policy:
# input = {
#   "user": {
#     "id": "user_123",
#     "roles": ["analyst", "department_member"],
#     "department": "engineering",
#     "clearance_level": 3,
#     "certifications": ["data_privacy_advanced"],
#     "training_completed": ["security_training"],
#     "role_expiry": 1640995200,
#     "role_status": "active"
#   },
#   "action": "read_resource",
#   "resource": {
#     "id": "resource_123",
#     "type": "protected_resource",
#     "owner_id": "user_456",
#     "department": "engineering",
#     "required_clearance_level": 2,
#     "required_certification": "data_privacy_advanced",
#     "required_training": "security_training"
#   },
#   "context": {
#     "current_timestamp": 1640995000,
#     "conflict_detected": false
#   }
# }
