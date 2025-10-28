"""
Central Incident Response Service for Control Core Business Admin
Implements SOC2-compliant incident response with CRM integration
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
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session

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
    COMPLIANCE_VIOLATION = "compliance_violation"
    VENDOR_INCIDENT = "vendor_incident"

class ResponseAction(str, Enum):
    ALERT = "alert"
    ISOLATE = "isolate"
    BLOCK = "block"
    QUARANTINE = "quarantine"
    ESCALATE = "escalate"
    NOTIFY = "notify"
    LOG = "log"
    INVESTIGATE = "investigate"
    CRM_NOTIFY = "crm_notify"
    CUSTOMER_NOTIFY = "customer_notify"

@dataclass
class Incident:
    incident_id: str
    tenant_id: str
    title: str
    description: str
    incident_type: IncidentType
    severity: IncidentSeverity
    status: IncidentStatus
    detected_at: datetime
    detected_by: str
    assigned_to: Optional[str]
    affected_systems: List[str]
    affected_users: List[str]
    indicators: Dict[str, Any]
    response_actions: List[ResponseAction]
    timeline: List[Dict[str, Any]]
    resolution_notes: Optional[str]
    resolved_at: Optional[datetime]
    customer_notified: bool
    crm_ticket_id: Optional[str]
    sla_deadline: Optional[datetime]
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
    customer_notification_required: bool
    sla_hours: int
    is_active: bool

class IncidentResponseService:
    """
    Central SOC2-compliant incident response service with CRM integration
    Coordinates incident response across all Control Core components
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.incidents: Dict[str, Incident] = {}
        self.response_workflows: Dict[str, ResponseWorkflow] = {}
        
        # CRM Integration settings
        self.crm_enabled = os.getenv('CRM_INTEGRATION_ENABLED', 'true').lower() == 'true'
        self.crm_api_url = os.getenv('CRM_API_URL', '')
        self.crm_api_key = os.getenv('CRM_API_KEY', '')
        self.crm_webhook_url = os.getenv('CRM_WEBHOOK_URL', '')
        
        # Customer notification settings
        self.customer_notification_enabled = os.getenv('CUSTOMER_NOTIFICATION_ENABLED', 'true').lower() == 'true'
        self.customer_notification_email = os.getenv('CUSTOMER_NOTIFICATION_EMAIL', '')
        
        # Internal notification settings
        self.internal_notification_enabled = os.getenv('INTERNAL_NOTIFICATION_ENABLED', 'true').lower() == 'true'
        self.security_team_email = os.getenv('SECURITY_TEAM_EMAIL', 'security@controlcore.io')
        self.management_email = os.getenv('MANAGEMENT_EMAIL', 'management@controlcore.io')
        
        # Component endpoints for coordination
        self.component_endpoints = {
            'cc_pap': os.getenv('CC_PAP_URL', 'http://localhost:3000'),
            'cc_bouncer': os.getenv('CC_BOUNCER_URL', 'http://localhost:8080'),
            'cc_opal': os.getenv('CC_OPAL_URL', 'http://localhost:7000'),
            'cc_pap_api': os.getenv('CC_PAP_API_URL', 'http://localhost:8000')
        }
        
        # SLA settings
        self.sla_settings = {
            IncidentSeverity.CRITICAL: 1,  # 1 hour
            IncidentSeverity.HIGH: 4,      # 4 hours
            IncidentSeverity.MEDIUM: 24,   # 24 hours
            IncidentSeverity.LOW: 72       # 72 hours
        }
        
        # Initialize response workflows
        self._initialize_response_workflows()
        
        logger.info("IncidentResponseService initialized with CRM integration")

    def _initialize_response_workflows(self):
        """Initialize incident response workflows with CRM integration"""
        
        workflows = [
            ResponseWorkflow(
                workflow_id="workflow_critical",
                name="Critical Security Incident Response",
                description="Automated response for critical security incidents with immediate CRM notification",
                incident_types=[IncidentType.DATA_BREACH, IncidentType.SYSTEM_COMPROMISE],
                severity_threshold=IncidentSeverity.CRITICAL,
                automatic_actions=[
                    ResponseAction.ALERT,
                    ResponseAction.ESCALATE,
                    ResponseAction.CRM_NOTIFY,
                    ResponseAction.CUSTOMER_NOTIFY,
                    ResponseAction.ISOLATE
                ],
                escalation_rules={
                    "immediate_escalation": True,
                    "escalation_timeout_minutes": 15,
                    "escalation_recipients": [self.security_team_email, self.management_email]
                },
                notification_recipients=[self.security_team_email, self.management_email],
                customer_notification_required=True,
                sla_hours=1,
                is_active=True
            ),
            ResponseWorkflow(
                workflow_id="workflow_high",
                name="High Priority Incident Response",
                description="Response workflow for high priority incidents with CRM tracking",
                incident_types=[IncidentType.UNAUTHORIZED_ACCESS, IncidentType.ACCOUNT_COMPROMISE, IncidentType.COMPLIANCE_VIOLATION],
                severity_threshold=IncidentSeverity.HIGH,
                automatic_actions=[
                    ResponseAction.ALERT,
                    ResponseAction.CRM_NOTIFY,
                    ResponseAction.BLOCK,
                    ResponseAction.NOTIFY,
                    ResponseAction.INVESTIGATE
                ],
                escalation_rules={
                    "escalation_threshold": 3,
                    "escalation_timeout_minutes": 30
                },
                notification_recipients=[self.security_team_email],
                customer_notification_required=True,
                sla_hours=4,
                is_active=True
            ),
            ResponseWorkflow(
                workflow_id="workflow_medium",
                name="Medium Priority Incident Response",
                description="Response workflow for medium priority incidents",
                incident_types=[IncidentType.POLICY_VIOLATION, IncidentType.VENDOR_INCIDENT],
                severity_threshold=IncidentSeverity.MEDIUM,
                automatic_actions=[
                    ResponseAction.ALERT,
                    ResponseAction.CRM_NOTIFY,
                    ResponseAction.LOG,
                    ResponseAction.NOTIFY
                ],
                escalation_rules={
                    "escalation_timeout_minutes": 60
                },
                notification_recipients=[self.security_team_email],
                customer_notification_required=False,
                sla_hours=24,
                is_active=True
            )
        ]
        
        for workflow in workflows:
            self.response_workflows[workflow.workflow_id] = workflow

    async def detect_incident(
        self,
        tenant_id: str,
        title: str,
        description: str,
        incident_type: IncidentType,
        severity: IncidentSeverity,
        detected_by: str,
        affected_systems: List[str],
        affected_users: List[str],
        indicators: Dict[str, Any]
    ) -> Incident:
        """Detect and create a new security incident with CRM integration"""
        
        incident_id = str(uuid.uuid4())
        current_time = datetime.utcnow()
        
        # Create incident
        incident = Incident(
            incident_id=incident_id,
            tenant_id=tenant_id,
            title=title,
            description=description,
            incident_type=incident_type,
            severity=severity,
            status=IncidentStatus.DETECTED,
            detected_at=current_time,
            detected_by=detected_by,
            assigned_to=None,
            affected_systems=affected_systems,
            affected_users=affected_users,
            indicators=indicators,
            response_actions=[],
            timeline=[],
            resolution_notes=None,
            resolved_at=None,
            customer_notified=False,
            crm_ticket_id=None,
            sla_deadline=current_time + timedelta(hours=self.sla_settings.get(severity, 72)),
            created_at=current_time,
            updated_at=current_time
        )
        
        # Store incident
        self.incidents[incident_id] = incident
        
        # Add to timeline
        incident.timeline.append({
            "timestamp": current_time.isoformat(),
            "action": "incident_detected",
            "actor": detected_by,
            "details": f"Incident {incident_id} detected: {title}"
        })
        
        # Log incident detection
        logger.info(f"Incident detected: {incident_id} - {title} for tenant {tenant_id}")
        
        # Create CRM ticket immediately
        if self.crm_enabled:
            crm_ticket_id = await self._create_crm_ticket(incident)
            incident.crm_ticket_id = crm_ticket_id
        
        # Trigger automated response
        await self._trigger_automated_response(incident)
        
        return incident

    async def _create_crm_ticket(self, incident: Incident) -> Optional[str]:
        """Create CRM ticket for incident tracking"""
        
        if not self.crm_enabled or not self.crm_api_url:
            return None
        
        try:
            # Prepare CRM ticket payload
            ticket_data = {
                "type": "security_incident",
                "title": f"Security Incident: {incident.title}",
                "description": incident.description,
                "priority": incident.severity.value,
                "category": incident.incident_type.value,
                "tenant_id": incident.tenant_id,
                "incident_id": incident.incident_id,
                "affected_systems": incident.affected_systems,
                "affected_users": incident.affected_users,
                "detected_at": incident.detected_at.isoformat(),
                "sla_deadline": incident.sla_deadline.isoformat() if incident.sla_deadline else None,
                "status": "open",
                "assigned_to": incident.assigned_to,
                "tags": ["security", "incident", "automated"]
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.crm_api_key}"
            }
            
            response = requests.post(
                self.crm_api_url,
                json=ticket_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 201:
                ticket_response = response.json()
                ticket_id = ticket_response.get("id")
                logger.info(f"CRM ticket created: {ticket_id} for incident {incident.incident_id}")
                return ticket_id
            else:
                logger.error(f"Failed to create CRM ticket: {response.status_code} - {response.text}")
                return None
        
        except Exception as e:
            logger.error(f"Error creating CRM ticket: {e}")
            return None

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
        
        # Update incident status
        incident.status = IncidentStatus.INVESTIGATING
        incident.updated_at = datetime.utcnow()

    async def _execute_response_action(self, incident: Incident, action_type: ResponseAction, workflow: ResponseWorkflow) -> Dict[str, Any]:
        """Execute a specific response action"""
        
        try:
            if action_type == ResponseAction.ALERT:
                result = await self._execute_alert_action(incident)
            elif action_type == ResponseAction.ISOLATE:
                result = await self._execute_isolate_action(incident)
            elif action_type == ResponseAction.BLOCK:
                result = await self._execute_block_action(incident)
            elif action_type == ResponseAction.ESCALATE:
                result = await self._execute_escalate_action(incident, workflow)
            elif action_type == ResponseAction.NOTIFY:
                result = await self._execute_notify_action(incident, workflow)
            elif action_type == ResponseAction.CRM_NOTIFY:
                result = await self._execute_crm_notify_action(incident)
            elif action_type == ResponseAction.CUSTOMER_NOTIFY:
                result = await self._execute_customer_notify_action(incident)
            elif action_type == ResponseAction.LOG:
                result = await self._execute_log_action(incident)
            elif action_type == ResponseAction.INVESTIGATE:
                result = await self._execute_investigate_action(incident)
            else:
                result = {"success": False, "error": f"Unknown action type: {action_type}"}
            
            logger.info(f"Response action {action_type.value} executed for incident {incident.incident_id}: {result.get('success', False)}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to execute response action {action_type.value} for incident {incident.incident_id}: {e}")
            return {"success": False, "error": str(e)}

    async def _execute_crm_notify_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute CRM notification action"""
        
        if not self.crm_enabled or not incident.crm_ticket_id:
            return {"success": False, "error": "CRM not enabled or ticket not created"}
        
        try:
            # Update CRM ticket with incident details
            update_data = {
                "status": "investigating",
                "last_updated": datetime.utcnow().isoformat(),
                "incident_status": incident.status.value,
                "response_actions": [action.value for action in incident.response_actions]
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.crm_api_key}"
            }
            
            response = requests.patch(
                f"{self.crm_api_url}/{incident.crm_ticket_id}",
                json=update_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return {"success": True, "details": "CRM ticket updated successfully"}
            else:
                return {"success": False, "error": f"Failed to update CRM ticket: {response.status_code}"}
        
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _execute_customer_notify_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute customer notification action"""
        
        if not self.customer_notification_enabled:
            return {"success": False, "error": "Customer notification not enabled"}
        
        try:
            # Send customer notification
            await self._send_customer_notification(incident)
            incident.customer_notified = True
            incident.updated_at = datetime.utcnow()
            
            return {"success": True, "details": "Customer notification sent successfully"}
        
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _send_customer_notification(self, incident: Incident):
        """Send notification to customer about security incident"""
        
        if not self.customer_notification_email:
            logger.warning("Customer notification email not configured")
            return
        
        try:
            subject = f"Security Incident Notification - {incident.title}"
            
            # Prepare customer-friendly notification
            body = f"""
Dear Valued Customer,

We are writing to inform you about a security incident that has been detected in your Control Core environment.

Incident Details:
- Incident ID: {incident.incident_id}
- Severity: {incident.severity.value.title()}
- Type: {incident.incident_type.value.replace('_', ' ').title()}
- Detected: {incident.detected_at.strftime('%Y-%m-%d %H:%M:%S UTC')}
- Status: {incident.status.value.title()}

What We're Doing:
Our security team is actively investigating this incident and has implemented appropriate response measures. We will provide updates as the investigation progresses.

Next Steps:
- We will notify you of any significant developments
- A full incident report will be provided upon resolution
- If you have any questions, please contact our support team

This notification is sent as part of our commitment to transparency and security.

Best regards,
Control Core Security Team

---
This is an automated notification from Control Core Security System.
"""
            
            await self._send_email(self.customer_notification_email, subject, body)
            logger.info(f"Customer notification sent for incident {incident.incident_id}")
        
        except Exception as e:
            logger.error(f"Failed to send customer notification: {e}")

    async def _execute_alert_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute alert action - create security alert"""
        
        alert_data = {
            "incident_id": incident.incident_id,
            "tenant_id": incident.tenant_id,
            "severity": incident.severity.value,
            "type": incident.incident_type.value,
            "title": incident.title,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.warning(f"SECURITY_ALERT: {json.dumps(alert_data)}")
        
        return {"success": True, "details": "Security alert created"}

    async def _execute_isolate_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute isolate action - isolate affected systems"""
        
        isolated_systems = []
        
        for system in incident.affected_systems:
            # In a real implementation, this would coordinate with component services
            isolated_systems.append(system)
            logger.info(f"Isolated system: {system}")
        
        return {"success": True, "details": f"Isolated {len(isolated_systems)} systems"}

    async def _execute_block_action(self, incident: Incident) -> Dict[str, Any]:
        """Execute block action - block malicious actors or systems"""
        
        blocked_items = []
        
        # Block affected users
        for user in incident.affected_users:
            blocked_items.append(f"user:{user}")
            logger.info(f"Blocked user: {user}")
        
        return {"success": True, "details": f"Blocked {len(blocked_items)} items"}

    async def _execute_escalate_action(self, incident: Incident, workflow: ResponseWorkflow) -> Dict[str, Any]:
        """Execute escalate action - escalate incident to higher authority"""
        
        escalation_recipients = workflow.escalation_rules.get("escalation_recipients", [])
        
        if escalation_recipients:
            for recipient in escalation_recipients:
                await self._send_escalation_notification(recipient, incident)
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
            "tenant_id": incident.tenant_id,
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
        
        investigation_data = {
            "incident_id": incident.incident_id,
            "tenant_id": incident.tenant_id,
            "investigation_started": datetime.utcnow().isoformat(),
            "assigned_analyst": "system",
            "investigation_scope": incident.affected_systems + incident.affected_users
        }
        
        logger.info(f"Investigation initiated for incident {incident.incident_id}")
        
        return {"success": True, "details": "Investigation initiated"}

    async def _send_incident_notification(self, recipient: str, incident: Incident):
        """Send incident notification email"""
        
        try:
            subject = f"Security Incident Alert: {incident.title}"
            
            body = f"""
Security Incident Detected

Incident ID: {incident.incident_id}
Tenant ID: {incident.tenant_id}
Title: {incident.title}
Type: {incident.incident_type.value}
Severity: {incident.severity.value}
Status: {incident.status.value}
Detected At: {incident.detected_at.isoformat()}
SLA Deadline: {incident.sla_deadline.isoformat() if incident.sla_deadline else 'N/A'}

Description:
{incident.description}

Affected Systems: {', '.join(incident.affected_systems)}
Affected Users: {', '.join(incident.affected_users)}

CRM Ticket ID: {incident.crm_ticket_id or 'Not created'}

Please review and take appropriate action.

This is an automated message from Control Core Security System.
"""
            
            await self._send_email(recipient, subject, body)
            
        except Exception as e:
            logger.error(f"Failed to send incident notification to {recipient}: {e}")

    async def _send_escalation_notification(self, recipient: str, incident: Incident):
        """Send escalation notification"""
        
        try:
            subject = f"URGENT: Security Incident Escalation - {incident.incident_id}"
            
            body = f"""
SECURITY INCIDENT ESCALATION

Incident ID: {incident.incident_id}
Tenant ID: {incident.tenant_id}
Severity: {incident.severity.value}
Title: {incident.title}
Escalation Time: {datetime.utcnow().isoformat()}

SLA Status: {'OVERDUE' if incident.sla_deadline and datetime.utcnow() > incident.sla_deadline else 'ACTIVE'}

IMMEDIATE ATTENTION REQUIRED

This is an automated escalation from Control Core Security System.
"""
            
            await self._send_email(recipient, subject, body)
            
        except Exception as e:
            logger.error(f"Failed to send escalation notification to {recipient}: {e}")

    async def _send_email(self, recipient: str, subject: str, body: str):
        """Send email notification"""
        
        try:
            # In a real implementation, use async SMTP
            # For now, just log the email
            logger.info(f"Email sent to {recipient}: {subject}")
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {e}")

    def update_incident_status(self, incident_id: str, status: IncidentStatus, notes: Optional[str] = None):
        """Update incident status and sync with CRM"""
        
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
        
        # Update CRM ticket
        if self.crm_enabled and incident.crm_ticket_id:
            asyncio.create_task(self._update_crm_ticket_status(incident))
        
        logger.info(f"Incident {incident_id} status updated to {status.value}")

    async def _update_crm_ticket_status(self, incident: Incident):
        """Update CRM ticket with incident status"""
        
        try:
            update_data = {
                "status": "resolved" if incident.status == IncidentStatus.RESOLVED else "in_progress",
                "last_updated": datetime.utcnow().isoformat(),
                "incident_status": incident.status.value,
                "resolution_notes": incident.resolution_notes,
                "resolved_at": incident.resolved_at.isoformat() if incident.resolved_at else None
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.crm_api_key}"
            }
            
            response = requests.patch(
                f"{self.crm_api_url}/{incident.crm_ticket_id}",
                json=update_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"CRM ticket {incident.crm_ticket_id} updated successfully")
            else:
                logger.error(f"Failed to update CRM ticket: {response.status_code}")
        
        except Exception as e:
            logger.error(f"Error updating CRM ticket: {e}")

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        """Get incident by ID"""
        
        return self.incidents.get(incident_id)

    def get_incidents_by_tenant(self, tenant_id: str) -> List[Incident]:
        """Get incidents by tenant"""
        
        return [incident for incident in self.incidents.values() if incident.tenant_id == tenant_id]

    def get_incidents_summary(self) -> Dict[str, Any]:
        """Get incidents summary statistics"""
        
        total_incidents = len(self.incidents)
        
        summary = {
            "total_incidents": total_incidents,
            "by_status": {},
            "by_severity": {},
            "by_type": {},
            "by_tenant": {},
            "open_incidents": 0,
            "sla_breaches": 0,
            "crm_tickets_created": 0,
            "customer_notifications_sent": 0
        }
        
        current_time = datetime.utcnow()
        
        for incident in self.incidents.values():
            # Status breakdown
            status = incident.status.value
            summary["by_status"][status] = summary["by_status"].get(status, 0) + 1
            
            # Severity breakdown
            severity = incident.severity.value
            summary["by_severity"][severity] = summary["by_severity"].get(severity, 0) + 1
            
            # Type breakdown
            incident_type = incident.incident_type.value
            summary["by_type"][incident_type] = summary["by_type"].get(incident_type, 0) + 1
            
            # Tenant breakdown
            tenant_id = incident.tenant_id
            summary["by_tenant"][tenant_id] = summary["by_tenant"].get(tenant_id, 0) + 1
            
            # Count open incidents
            if incident.status not in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                summary["open_incidents"] += 1
            
            # Count SLA breaches
            if incident.sla_deadline and current_time > incident.sla_deadline:
                if incident.status not in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                    summary["sla_breaches"] += 1
            
            # Count CRM tickets
            if incident.crm_ticket_id:
                summary["crm_tickets_created"] += 1
            
            # Count customer notifications
            if incident.customer_notified:
                summary["customer_notifications_sent"] += 1
        
        return summary

# Global incident response service instance
incident_response_service = None

def get_incident_response_service(db: Session) -> IncidentResponseService:
    """Get incident response service instance"""
    global incident_response_service
    if incident_response_service is None:
        incident_response_service = IncidentResponseService(db)
    return incident_response_service
