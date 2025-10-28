package controlcore.policy.templates.collaboration

# Policy to enforce collaboration and sharing tool behavior requirements
# This policy ensures secure and compliant use of collaboration tools

default allow = false

# Allow file sharing if security requirements are met
allow {
  input.action == "share_file"
  input.resource.type == "collaboration_file"
  input.context.file_classification == "public"
  input.context.recipients_authorized
  input.context.sharing_permissions_valid
}

# Enhanced security for sensitive files
allow {
  input.action == "share_file"
  input.resource.type == "collaboration_file"
  input.context.file_classification == "confidential"
  input.context.recipients_authorized
  input.context.encryption_enabled
  input.context.access_controls_configured
  input.context.audit_logging_enabled
}

# Deny sharing of restricted files
deny {
  input.action == "share_file"
  input.resource.type == "collaboration_file"
  input.context.file_classification == "restricted"
}

# External sharing restrictions
deny {
  input.action == "share_file"
  input.resource.type == "collaboration_file"
  input.context.external_sharing_enabled
  input.context.file_classification == "internal"
}

# Collaboration workspace access
allow {
  input.action == "access_workspace"
  input.resource.type == "collaboration_workspace"
  input.context.workspace_membership_verified
  input.context.workspace_permissions_valid
  input.context.mfa_required
}

# Real-time collaboration controls
allow {
  input.action == "collaborate_realtime"
  input.resource.type == "collaboration_document"
  input.context.collaboration_permissions_valid
  input.context.version_control_enabled
  input.context.change_tracking_enabled
}

# Meeting and video conferencing security
allow {
  input.action == "join_meeting"
  input.resource.type == "video_conference"
  input.context.meeting_authentication_valid
  input.context.recording_consent_obtained
  input.context.participant_verification_enabled
}

# Screen sharing controls
deny {
  input.action == "share_screen"
  input.resource.type == "video_conference"
  input.context.sensitive_data_visible
}

# Chat and messaging security
allow {
  input.action == "send_message"
  input.resource.type == "chat_message"
  input.context.message_encryption_enabled
  input.context.recipient_authorized
  input.context.content_filtering_enabled
}

# Data retention and compliance
allow {
  input.action == "delete_collaboration_data"
  input.resource.type == "collaboration_data"
  input.context.retention_period_expired
  input.context.legal_hold_not_applicable
  input.context.backup_verified
}

# Example of how to use this policy:
# input = {
#   "user": {"id": "team_member", "roles": ["collaborator"]},
#   "action": "share_file",
#   "resource": {
#     "id": "project_document_v2",
#     "type": "collaboration_file",
#     "file_name": "project_plan.docx"
#   },
#   "context": {
#     "file_classification": "confidential",
#     "recipients_authorized": true,
#     "encryption_enabled": true,
#     "access_controls_configured": true,
#     "audit_logging_enabled": true,
#     "external_sharing_enabled": false
#   }
# }
