package cc.policies

# Control Core Policy Templates
# This file contains example Rego policies for Control Core

# Default allow policy
default allow = false

# Admin access policy
allow {
    input.user.role == "admin"
}

# User access policy
allow {
    input.user.role == "user"
    input.action == "read"
}

# Resource access policy
allow {
    input.user.department == input.resource.department
    input.action in ["read", "write"]
}

# Time-based access policy
allow {
    input.user.role == "user"
    input.action == "read"
    input.context.time >= "09:00"
    input.context.time <= "17:00"
}

# Location-based access policy
allow {
    input.user.role == "user"
    input.action == "read"
    input.context.location == "office"
}

# AI agent access policy
allow {
    input.user.role == "ai_agent"
    input.action == "read"
    input.resource.type == "ai_data"
}

# Compliance policy
allow {
    input.user.role == "compliance"
    input.action in ["read", "audit"]
    input.resource.classification in ["public", "internal"]
}
