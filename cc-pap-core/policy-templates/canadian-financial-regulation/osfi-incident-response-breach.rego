package controlcore.policy.templates.canadian_financial_regulation.osfi_incident

# OSFI Incident Response and Breach Notification Requirements
# Enforces incident response, breach notification, and crisis management controls

default allow = false

# OSFI notification required for material incidents
osfi_notification_required {
    input.action == "classify_security_incident"
    input.resource.type == "security_incident"
    input.context.incident_severity == "critical"
    input.context.customer_impact_count > 10000
    not input.context.osfi_notification_sent
}

# Executive crisis team activation
crisis_team_activation_required {
    input.action == "manage_security_incident"
    input.resource.type == "major_incident"
    input.context.incident_severity in ["critical", "major"]
    input.context.business_impact_duration_hours > 4
    not input.context.executive_crisis_team_activated
}

# Customer notification for data breaches
customer_notification_required {
    input.action == "respond_to_data_breach"
    input.resource.type == "privacy_breach"
    input.context.records_affected > 500
    not input.context.customer_notification_plan_executed
}

# Privacy Commissioner notification (PIPEDA)
privacy_commissioner_notification_required {
    input.action == "report_privacy_breach"
    input.resource.type == "privacy_breach"
    input.context.real_risk_of_significant_harm == true
    not input.context.privacy_commissioner_notified
}

# Forensic investigation required
forensic_investigation_required {
    input.action == "investigate_security_incident"
    input.resource.type == "cyber_attack"
    input.context.potential_data_exfiltration == true
    not input.context.forensic_investigation_initiated
}

# Post-incident review and lessons learned
post_incident_review_required {
    input.action == "close_security_incident"
    input.resource.type == "major_incident"
    input.context.days_since_incident_resolved < 30
    not input.context.post_incident_review_completed
}

# Allow with proper incident response procedures
allow {
    input.action == "classify_security_incident"
    input.resource.type == "security_incident"
    input.context.severity_assessment_completed == true
    input.user.role in ["ciso", "security_operations_manager", "incident_commander"]
}

allow {
    input.action == "respond_to_data_breach"
    input.resource.type == "privacy_breach"
    input.context.customer_notification_plan_executed == true
    input.context.privacy_commissioner_notified == true
    input.context.osfi_notification_sent == true
    input.context.executive_team_informed == true
}

allow {
    input.action == "manage_security_incident"
    input.resource.type == "major_incident"
    input.context.executive_crisis_team_activated == true
    input.context.ir_playbook_followed == true
    input.context.continuous_status_updates_enabled == true
}

