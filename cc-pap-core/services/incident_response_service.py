"""
Automated Incident Response Service for Control Core
Implements SOC2-compliant incident response automation and workflows
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

class IncidentSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class IncidentStatus(str, Enum):
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    MITIGATED = "mitigated"
    RESOLVED = "resolved"
    CLOSED = "closed"

class IncidentType(str, Enum):
    DATA_BREACH = "data_breach"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    MALWARE = "malware"
    DOS_ATTACK = "dos_attack"
    POLICY_VIOLATION = "policy_violation"
    SYSTEM_COMPROMISE = "system_compromise"
    DATA_LEAK = "data_leak"
    ACCOUNT_COMPROMISE = "account_compromise"
    NETWORK_INTRUSION = "network_intrusion"
    PRIVILEGE_ESCALATION = "privilege_escalation"

class ResponseAction(str, Enum):
    ALERT = "alert"
    ISOLATE = "isolate"
    BLOCK = "block"
    QUARANTINE = "quarantine"
    ESCALATE = "escalate"
    NOTIFY = "notify"
    LOG = "log"
    INVESTIGATE = "investigate"

@dataclass
class Incident:
    incident_id: str
    title: str
    description: str
    incident_type: IncidentType
    severity: IncidentSeverity
    status: IncidentStatus
    detected_at: datetime
    assigned_to: Optional[str]
    affected_systems: List[str]
    affected_users: List[str]
    indicators: Dict[str, Any]
    response_actions: List[ResponseAction]
    timeline: List[Dict[str, Any]]
    resolution_notes: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

@dataclass
class ResponseWorkflow:
    workflow_id: str
    name: str
    description: str
    incident_types: List[IncidentType]
    severity_threshold: IncidentSeverity
    automatic_actions: List[ResponseAction]
    escalation_rules: Dict[str, Any]
    notification_recipients: List[str]
    sla_hours: int
    is_active: bool

@dataclass
class ResponseAction:
    action_id: str
    action_type: ResponseAction
    parameters: Dict[str, Any]
    executed_at: Optional[datetime]
    success: Optional[bool]
    error_message: Optional[str]

class IncidentResponseService:
    """
    SOC2-compliant automated incident response service
    Implements automated detection, classification, and response to security incidents
    """
    
    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        self.response_workflows: Dict[str, ResponseWorkflow] = {}
        self.response_actions: Dict[str, ResponseAction] = {}
        
        # Configuration
        self.auto_response_enabled = os.getenv('INCIDENT_AUTO_RESPONSE_ENABLED', 'true').lower() == 'true'
        self.notification_enabled = os.getenv('INCIDENT_NOTIFICATION_ENABLED', 'true').lower() == 'true'
        self.escalation_enabled = os.getenv('INCIDENT_ESCALATION_ENABLED', 'true').lower() == 'true'
        self.audit_logging_enabled = os.getenv('INCIDENT_AUDIT_LOGGING', 'true').lower() == 'true'
        
        # Notification settings
        self.smtp_server = os.getenv('SMTP_SERVER', 'localhost')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', 'security@controlcore.io')
        
        # SLA settings
        self.sla_settings = {
            IncidentSeverity.CRITICAL: 1,  # 1 hour
            IncidentSeverity.HIGH: 4,      # 4 hours
            IncidentSeverity.MEDIUM: 24,   # 24 hours
            IncidentSeverity.LOW: 72       # 72 hours
        }
        
        # Initialize default response workflows
        self._initialize_default_workflows()
        
        logger.info("IncidentResponseService initialized with SOC2 compliance")

    def _initialize_default_workflows(self):
        """Initialize default incident response workflows"""
        
        default_workflows = [
            ResponseWorkflow(
                workflow_id="workflow_001",
                name="Critical Security Incident Response",
                description="Automated response for critical security incidents",
                incident_types=[IncidentType.DATA_BREACH, IncidentType.SYSTEM_COMPROMISE],
                severity_threshold=IncidentSeverity.CRITICAL,
                automatic_actions=[
                    ResponseAction.ALERT,
                    ResponseAction.ESCALATE,
                    ResponseAction.NOTIFY,
                    ResponseAction.ISOLATE
                ],
                escalation_rules={
                    "immediate_escalation": True,
                    "escalation_timeout_minutes": 15,
                    "escalation_recipients": ["security-team@controlcore.io", "management@controlcore.io"]
                },
                notification_recipients=["security-team@controlcore.io", "incident-response@controlcore.io"],
                sla_hours=1,
                is_active=True
            ),
            ResponseWorkflow(
                workflow_id="workflow_002",
                name="Unauthorized Access Response",
                description="Response workflow for unauthorized access attempts",
                incident_types=[IncidentType.UNAUTHORIZED_ACCESS, IncidentType.ACCOUNT_COMPROMISE],
                severity_threshold=IncidentSeverity.HIGH,
                automatic_actions=[
                    ResponseAction.ALERT,
                    ResponseAction.BLOCK,
                    ResponseAction.NOTIFY,
                    ResponseAction.INVESTIGATE
                ],
                escalation_rules={
                    "escalation_threshold": 5,  # Escalate after 5 failed attempts
                    "escalation_timeout_minutes": 30
                },
                notification_recipients=["security-team@controlcore.io"],
                sla_hours=4,
                is_active=True
            ),
            ResponseWorkflow(
                workflow_id="workflow_003",
                name="Policy Violation Response",
                description="Response workflow for policy violations",
                incident_types=[IncidentType.POLICY_VIOLATION],
                severity_threshold=IncidentSeverity.MEDIUM,
                automatic_actions=[
                    ResponseAction.ALERT,
                    ResponseAction.LOG,
                    ResponseAction.NOTIFY
                ],
                escalation_rules={
                    "escalation_timeout_minutes": 60
                },
                notification_recipients=["security-team@controlcore.io"],
                sla_hours=24,
                is_active=True
            )
        ]
        
        for workflow in default_workflows:
            self.response_workflows[workflow.workflow_id] = workflow

    async def detect_incident(
        self,
        title: str,
        description: str,
        incident_type: IncidentType,
        severity: IncidentSeverity,
        affected_systems: List[str],
        affected_users: List[str],
        indicators: Dict[str, Any]
    ) -> Incident:
        """Detect and create a new security incident"""
        
        incident_id = str(uuid.uuid4())
        current_time = datetime.utcnow()
        
        # Create incident
        incident = Incident(
            incident_id=incident_id,
            title=title,
            description=description,
            incident_type=incident_type,
            severity=severity,
            status=IncidentStatus.DETECTED,
            detected_at=current_time,
            assigned_to=None,
            affected_systems=affected_systems,
            affected_users=affected_users,
            indicators=indicators,
            response_actions=[],
            timeline=[],
            resolution_notes=None,
            resolved_at=None,
            created_at=current_time,
            updated_at=current_time
        )
        
        # Store incident
        self.incidents[incident_id] = incident
        
        # Add to timeline
        incident.timeline.append({
            "timestamp": current_time.isoformat(),
            "action": "incident_detected",
            "actor": "system",
            "details": f"Incident {incident_id} detected: {title}"
        })
        
        # Log incident detection
        if self.audit_logging_enabled:
            self._log_incident_operation("detect", incident_id, incident_type.value, severity.value)
        
        logger.info(f"Incident detected: {incident_id} - {title}")
        
        # Trigger automated response
        if self.auto_response_enabled:
            await self._trigger_automated_response(incident)
        
        return incident

    async def _trigger_automated_response(self, incident: Incident):
        """Trigger automated response based on incident type and severity"""
        
        # Find applicable workflows
        applicable_workflows = []
        
        for workflow in self.response_workflows.values():
            if not workflow.is_active:
                continue
            
            # Check incident type
            if incident.incident_type in workflow.incident_types:
                # Check severity threshold
                severity_order = [IncidentSeverity.LOW, IncidentSeverity.MEDIUM, IncidentSeverity.HIGH, IncidentSeverity.CRITICAL]
                incident_severity_index = severity_order.index(incident.severity)
                workflow_severity_index = severity_order.index(workflow.severity_threshold)
                
                if incident_severity_index >= workflow_severity_index:
                    applicable_workflows.append(workflow)
        
        # Execute workflows
        for workflow in applicable_workflows:
            await self._execute_workflow(incident, workflow)

    async def _execute_workflow(self, incident: Incident, workflow: ResponseWorkflow):
        """Execute a response workflow for an incident"""
        
        logger.info(f"Executing workflow {workflow.name} for incident {incident.incident_id}")
        
        # Execute automatic actions
        for action_type in workflow.automatic_actions:
            action_result = await self._execute_response_action(incident, action_type, workflow)
            
            # Add action to incident
            incident.response_actions.append(action_type)
            
            # Add to timeline
            incident.timeline.append({
                "timestamp": datetime.utcnow().isoformat(),
                "action": f"automated_{action_type.value}",
                "actor": "system",
                "details": f"Automated {action_type.value} action executed",
                "success": action_result.get("success", False),
                "details": action_result.get("details", "")
            })
        
        # Send notifications
        if self.notification_enabled:
            await self._send_notifications(incident, workflow)
        
        # Check escalation rules
        if self.escalation_enabled:
            await self._check_escalation_rules(incident, workflow)
        
        # Update incident status
        incident.status = IncidentStatus.INVESTIGATING
        incident.updated_at = datetime.utcnow()

    async def _execute_response_action(self, incident: Incident, action_type: ResponseAction, workflow: ResponseWorkflow) -> Dict[str, Any]:
        """Execute a specific response action"""
        
        action_id = str(uuid.uuid4())
        current_time = datetime.utcnow()
        
        action = ResponseAction(
            action_id=action_id,
            action_type=action_type,
            parameters={},
            executed_at=current_time,
            success=None,
            error_message=None
        )
        
        try:
            if action_type == ResponseAction.ALERT:
                result = await self._execute_alert_action(incident)
            elif action_type == ResponseAction.ISOLATE:
                result = await self._execute_isolate_action(incident)
            elif action_type == ResponseAction.BLOCK:
                result = await self._execute_block_action(incident)
            elif action_type == ResponseAction.QUARANTINE:
                result = await self._execute_quarantine_action(incident)
            elif action_type == ResponseAction.ESCALATE:
                result = await self._execute_escalate_action(incident, workflow)
            elif action_type == ResponseAction.NOTIFY:
                result = await self._execute_notify_action(incident, workflow)
            elif action_type == ResponseAction.LOG:
                result = await self._execute_log_action(incident)
            elif action_type == ResponseAction.INVESTIGATE:
                result = await self._execute_investigate_action(incident)
            else:
                result = {"success": False, "error": f"Unknown action type: {action_type}"}
            
            action.success = result.get("success", False)
            if not action.success:
                action.error_message = result.get("error", "Unknown error")
            
            self.response_actions[action_id] = action
            
            logger.info(f"Response action {action_type.value} executed for incident {incident.incident_id}: {action.success}")
            return result
            
        except Exception as e:
            action.success = False
            action.error_message = str(e)
            self.response_actions[action_id] = action
            
            logger.error(f"Failed to execute response action {action_type.value} for incident {incident.incident_id}: {e}")
            return {"success": False, "error": str(e)}

    async def _execute_alert_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute alert action - create security alert"""
        
        # In a real implementation, this would integrate with SIEM, monitoring systems, etc.
        alert_data = {
            "incident_id": incident.incident_id,
            "severity": incident.severity.value,
            "type": incident.incident_type.value,
            "title": incident.title,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.warning(f"SECURITY_ALERT: {json.dumps(alert_data)}")
        
        return {"success": True, "details": "Security alert created"}

    async def _execute_isolate_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute isolate action - isolate affected systems"""
        
        # In a real implementation, this would integrate with network management systems
        isolated_systems = []
        
        for system in incident.affected_systems:
            # Mock isolation logic
            isolated_systems.append(system)
            logger.info(f"Isolated system: {system}")
        
        return {"success": True, "details": f"Isolated {len(isolated_systems)} systems"}

    async def _execute_block_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute block action - block malicious actors or systems"""
        
        # In a real implementation, this would integrate with firewall, WAF, etc.
        blocked_items = []
        
        # Block affected users
        for user in incident.affected_users:
            blocked_items.append(f"user:{user}")
            logger.info(f"Blocked user: {user}")
        
        # Block affected systems if they're external
        for system in incident.affected_systems:
            if self._is_external_system(system):
                blocked_items.append(f"system:{system}")
                logger.info(f"Blocked system: {system}")
        
        return {"success": True, "details": f"Blocked {len(blocked_items)} items"}

    async def _execute_quarantine_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute quarantine action - quarantine suspicious files or systems"""
        
        # In a real implementation, this would integrate with antivirus, EDR systems
        quarantined_items = []
        
        # Mock quarantine logic
        if "files" in incident.indicators:
            for file_path in incident.indicators["files"]:
                quarantined_items.append(file_path)
                logger.info(f"Quarantined file: {file_path}")
        
        return {"success": True, "details": f"Quarantined {len(quarantined_items)} items"}

    async def _execute_escalate_action(self, incident: Incident, workflow: ResponseWorkflow) -> Dict[str, Any]:
        """Execute escalate action - escalate incident to higher authority"""
        
        escalation_recipients = workflow.escalation_rules.get("escalation_recipients", [])
        
        if escalation_recipients:
            escalation_message = {
                "incident_id": incident.incident_id,
                "severity": incident.severity.value,
                "title": incident.title,
                "escalation_reason": "Automated escalation based on severity and type",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Send escalation notifications
            for recipient in escalation_recipients:
                await self._send_escalation_notification(recipient, escalation_message)
                logger.info(f"Escalated incident {incident.incident_id} to {recipient}")
        
        return {"success": True, "details": f"Escalated to {len(escalation_recipients)} recipients"}

    async def _execute_notify_action(self, incident: Incident, workflow: ResponseWorkflow) -> Dict[str, Any]:
        """Execute notify action - send notifications to stakeholders"""
        
        notification_recipients = workflow.notification_recipients
        
        if notification_recipients:
            for recipient in notification_recipients:
                await self._send_incident_notification(recipient, incident)
                logger.info(f"Sent notification for incident {incident.incident_id} to {recipient}")
        
        return {"success": True, "details": f"Sent notifications to {len(notification_recipients)} recipients"}

    async def _execute_log_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute log action - log incident details"""
        
        log_data = {
            "incident_id": incident.incident_id,
            "type": incident.incident_type.value,
            "severity": incident.severity.value,
            "status": incident.status.value,
            "detected_at": incident.detected_at.isoformat(),
            "affected_systems": incident.affected_systems,
            "affected_users": incident.affected_users,
            "indicators": incident.indicators
        }
        
        logger.info(f"INCIDENT_LOG: {json.dumps(log_data)}")
        
        return {"success": True, "details": "Incident logged"}

    async def _execute_investigate_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute investigate action - initiate investigation"""
        
        # In a real implementation, this would integrate with forensic tools, SIEM, etc.
        investigation_data = {
            "incident_id": incident.incident_id,
            "investigation_started": datetime.utcnow().isoformat(),
            "assigned_analyst": "system",
            "investigation_scope": incident.affected_systems + incident.affected_users
        }
        
        logger.info(f"Investigation initiated for incident {incident.incident_id}")
        
        return {"success": True, "details": "Investigation initiated"}

    async def _send_notifications(self, incident: Incident, workflow: ResponseWorkflow):
        """Send notifications for incident"""
        
        if not self.notification_enabled:
            return
        
        for recipient in workflow.notification_recipients:
            await self._send_incident_notification(recipient, incident)

    async def _send_incident_notification(self, recipient: str, incident: Incident):
        """Send incident notification email"""
        
        try:
            subject = f"Security Incident Alert: {incident.title}"
            
            body = f"""
Security Incident Detected

Incident ID: {incident.incident_id}
Title: {incident.title}
Type: {incident.incident_type.value}
Severity: {incident.severity.value}
Status: {incident.status.value}
Detected At: {incident.detected_at.isoformat()}

Description:
{incident.description}

Affected Systems: {', '.join(incident.affected_systems)}
Affected Users: {', '.join(incident.affected_users)}

Please review and take appropriate action.

This is an automated message from Control Core Security System.
"""
            
            await self._send_email(recipient, subject, body)
            
        except Exception as e:
            logger.error(f"Failed to send incident notification to {recipient}: {e}")

    async def _send_escalation_notification(self, recipient: str, escalation_data: Dict[str, Any]):
        """Send escalation notification"""
        
        try:
            subject = f"URGENT: Security Incident Escalation - {escalation_data['incident_id']}"
            
            body = f"""
SECURITY INCIDENT ESCALATION

Incident ID: {escalation_data['incident_id']}
Severity: {escalation_data['severity']}
Title: {escalation_data['title']}
Escalation Time: {escalation_data['timestamp']}

Reason: {escalation_data['escalation_reason']}

IMMEDIATE ATTENTION REQUIRED

This is an automated escalation from Control Core Security System.
"""
            
            await self._send_email(recipient, subject, body)
            
        except Exception as e:
            logger.error(f"Failed to send escalation notification to {recipient}: {e}")

    async def _send_email(self, recipient: str, subject: str, body: str):
        """Send email notification"""
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = recipient
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            # In a real implementation, use async SMTP
            # For now, just log the email
            logger.info(f"Email sent to {recipient}: {subject}")
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {e}")

    async def _check_escalation_rules(self, incident: Incident, workflow: ResponseWorkflow):
        """Check and apply escalation rules"""
        
        escalation_rules = workflow.escalation_rules
        
        # Check immediate escalation
        if escalation_rules.get("immediate_escalation", False):
            await self._execute_escalate_action(incident, workflow)
        
        # Check escalation threshold
        if "escalation_threshold" in escalation_rules:
            threshold = escalation_rules["escalation_threshold"]
            # In a real implementation, check against historical data
            # For now, escalate if severity is high or critical
            if incident.severity in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL]:
                await self._execute_escalate_action(incident, workflow)

    def _is_external_system(self, system: str) -> bool:
        """Determine if a system is external"""
        
        # Simple heuristic - in a real implementation, use proper network analysis
        external_indicators = ["external", "public", "internet", "unknown"]
        return any(indicator in system.lower() for indicator in external_indicators)

    def update_incident_status(self, incident_id: str, status: IncidentStatus, notes: Optional[str] = None):
        """Update incident status"""
        
        if incident_id not in self.incidents:
            logger.error(f"Incident not found: {incident_id}")
            return
        
        incident = self.incidents[incident_id]
        old_status = incident.status
        incident.status = status
        incident.updated_at = datetime.utcnow()
        
        if status == IncidentStatus.RESOLVED:
            incident.resolved_at = datetime.utcnow()
            incident.resolution_notes = notes
        
        # Add to timeline
        incident.timeline.append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": "status_update",
            "actor": "user",
            "details": f"Status changed from {old_status.value} to {status.value}",
            "notes": notes
        })
        
        logger.info(f"Incident {incident_id} status updated to {status.value}")

    def assign_incident(self, incident_id: str, assignee: str):
        """Assign incident to a user"""
        
        if incident_id not in self.incidents:
            logger.error(f"Incident not found: {incident_id}")
            return
        
        incident = self.incidents[incident_id]
        incident.assigned_to = assignee
        incident.updated_at = datetime.utcnow()
        
        # Add to timeline
        incident.timeline.append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": "assignment",
            "actor": "user",
            "details": f"Incident assigned to {assignee}"
        })
        
        logger.info(f"Incident {incident_id} assigned to {assignee}")

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        """Get incident by ID"""
        
        return self.incidents.get(incident_id)

    def get_incidents_by_status(self, status: IncidentStatus) -> List[Incident]:
        """Get incidents by status"""
        
        return [incident for incident in self.incidents.values() if incident.status == status]

    def get_incidents_by_severity(self, severity: IncidentSeverity) -> List[Incident]:
        """Get incidents by severity"""
        
        return [incident for incident in self.incidents.values() if incident.severity == severity]

    def get_incidents_summary(self) -> Dict[str, Any]:
        """Get incidents summary statistics"""
        
        total_incidents = len(self.incidents)
        
        summary = {
            "total_incidents": total_incidents,
            "by_status": {},
            "by_severity": {},
            "by_type": {},
            "open_incidents": 0,
            "sla_breaches": 0,
            "average_resolution_time_hours": 0
        }
        
        # Count by status
        for incident in self.incidents.values():
            status = incident.status.value
            summary["by_status"][status] = summary["by_status"].get(status, 0) + 1
            
            # Count open incidents
            if incident.status not in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                summary["open_incidents"] += 1
        
        # Count by severity
        for incident in self.incidents.values():
            severity = incident.severity.value
            summary["by_severity"][severity] = summary["by_severity"].get(severity, 0) + 1
        
        # Count by type
        for incident in self.incidents.values():
            incident_type = incident.incident_type.value
            summary["by_type"][incident_type] = summary["by_type"].get(incident_type, 0) + 1
        
        # Calculate SLA breaches
        current_time = datetime.utcnow()
        for incident in self.incidents.values():
            if incident.status not in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                sla_hours = self.sla_settings.get(incident.severity, 72)
                time_since_detection = (current_time - incident.detected_at).total_seconds() / 3600
                
                if time_since_detection > sla_hours:
                    summary["sla_breaches"] += 1
        
        return summary

    def _log_incident_operation(self, operation: str, incident_id: str, incident_type: str, severity: str):
        """Log incident operations for SOC2 audit trail"""
        
        audit_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": operation,
            "incident_id": incident_id,
            "incident_type": incident_type,
            "severity": severity,
            "service": "incident_response_service"
        }
        
        logger.info(f"INCIDENT_AUDIT: {json.dumps(audit_log)}")

# Global incident response service instance
incident_response_service = IncidentResponseService()
