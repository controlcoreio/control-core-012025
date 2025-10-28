"""
Change Management Service for Control Core Business Admin
Implements SOC2-compliant approval workflows for system changes
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class ChangeType(str, Enum):
    CODE_CHANGE = "code_change"
    INFRASTRUCTURE_CHANGE = "infrastructure_change"
    CONFIGURATION_CHANGE = "configuration_change"
    SECURITY_CHANGE = "security_change"
    DEPLOYMENT_CHANGE = "deployment_change"
    POLICY_CHANGE = "policy_change"
    ACCESS_CHANGE = "access_change"

class ChangePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class ChangeStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    DELEGATED = "delegated"

@dataclass
class ChangeRequest:
    change_id: str
    title: str
    description: str
    change_type: ChangeType
    priority: ChangePriority
    status: ChangeStatus
    requester: str
    requester_email: str
    target_components: List[str]
    target_environments: List[str]
    estimated_effort: int  # hours
    business_justification: str
    risk_assessment: str
    rollback_plan: str
    testing_plan: str
    documentation_required: bool
    security_review_required: bool
    compliance_impact: List[str]
    created_at: datetime
    updated_at: datetime
    scheduled_start: Optional[datetime]
    scheduled_end: Optional[datetime]
    actual_start: Optional[datetime]
    actual_end: Optional[datetime]

@dataclass
class ApprovalWorkflow:
    workflow_id: str
    change_type: ChangeType
    priority: ChangePriority
    approval_stages: List[Dict[str, Any]]
    auto_approval_threshold: Optional[ChangePriority]
    escalation_rules: Dict[str, Any]
    notification_settings: Dict[str, Any]

@dataclass
class ApprovalStage:
    stage_id: str
    stage_name: str
    approvers: List[str]
    approval_type: str  # "any", "all", "sequential"
    timeout_hours: int
    escalation_to: Optional[str]
    required_justifications: List[str]

@dataclass
class ApprovalRecord:
    approval_id: str
    change_id: str
    approver: str
    approver_email: str
    stage: str
    status: ApprovalStatus
    comments: Optional[str]
    approved_at: Optional[datetime]
    delegated_to: Optional[str]
    justification: Optional[str]

class ChangeManagementService:
    """
    SOC2-compliant change management service
    Implements controlled change management with approval workflows
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.change_requests: Dict[str, ChangeRequest] = {}
        self.approval_workflows: Dict[str, ApprovalWorkflow] = {}
        self.approval_records: Dict[str, ApprovalRecord] = {}
        
        # Configuration
        self.auto_approval_enabled = os.getenv('CHANGE_AUTO_APPROVAL_ENABLED', 'false').lower() == 'true'
        self.escalation_enabled = os.getenv('CHANGE_ESCALATION_ENABLED', 'true').lower() == 'true'
        self.notification_enabled = os.getenv('CHANGE_NOTIFICATION_ENABLED', 'true').lower() == 'true'
        
        # Approval timeout settings
        self.approval_timeouts = {
            ChangePriority.EMERGENCY: 1,  # 1 hour
            ChangePriority.CRITICAL: 4,   # 4 hours
            ChangePriority.HIGH: 24,      # 24 hours
            ChangePriority.MEDIUM: 48,    # 48 hours
            ChangePriority.LOW: 72        # 72 hours
        }
        
        # Initialize default workflows
        self._initialize_default_workflows()
        self._initialize_sample_data()
        
        logger.info("ChangeManagementService initialized with SOC2 compliance")

    def _initialize_default_workflows(self):
        """Initialize default approval workflows for different change types"""
        
        workflows = [
            # Code Change Workflow
            ApprovalWorkflow(
                workflow_id="workflow_code_change",
                change_type=ChangeType.CODE_CHANGE,
                priority=ChangePriority.MEDIUM,  # Default priority
                approval_stages=[
                    {
                        "stage_id": "stage_1",
                        "stage_name": "Technical Review",
                        "approvers": ["tech-lead@controlcore.io"],
                        "approval_type": "any",
                        "timeout_hours": 24,
                        "escalation_to": "engineering-manager@controlcore.io",
                        "required_justifications": ["code_quality", "security_impact"]
                    },
                    {
                        "stage_id": "stage_2",
                        "stage_name": "Security Review",
                        "approvers": ["security-team@controlcore.io"],
                        "approval_type": "any",
                        "timeout_hours": 48,
                        "escalation_to": "security-manager@controlcore.io",
                        "required_justifications": ["security_assessment"]
                    }
                ],
                auto_approval_threshold=ChangePriority.LOW,
                escalation_rules={
                    "timeout_escalation": True,
                    "escalation_recipients": ["change-manager@controlcore.io"]
                },
                notification_settings={
                    "email_notifications": True,
                    "slack_notifications": True,
                    "approval_reminders": True
                }
            ),
            
            # Security Change Workflow
            ApprovalWorkflow(
                workflow_id="workflow_security_change",
                change_type=ChangeType.SECURITY_CHANGE,
                priority=ChangePriority.HIGH,
                approval_stages=[
                    {
                        "stage_id": "stage_1",
                        "stage_name": "Security Team Review",
                        "approvers": ["security-team@controlcore.io", "security-manager@controlcore.io"],
                        "approval_type": "all",
                        "timeout_hours": 12,
                        "escalation_to": "ciso@controlcore.io",
                        "required_justifications": ["security_impact", "compliance_impact"]
                    },
                    {
                        "stage_id": "stage_2",
                        "stage_name": "CISO Approval",
                        "approvers": ["ciso@controlcore.io"],
                        "approval_type": "any",
                        "timeout_hours": 24,
                        "escalation_to": "cto@controlcore.io",
                        "required_justifications": ["business_justification"]
                    }
                ],
                auto_approval_threshold=None,  # No auto-approval for security changes
                escalation_rules={
                    "timeout_escalation": True,
                    "escalation_recipients": ["cto@controlcore.io", "compliance@controlcore.io"]
                },
                notification_settings={
                    "email_notifications": True,
                    "slack_notifications": True,
                    "approval_reminders": True,
                    "urgent_notifications": True
                }
            ),
            
            # Infrastructure Change Workflow
            ApprovalWorkflow(
                workflow_id="workflow_infrastructure_change",
                change_type=ChangeType.INFRASTRUCTURE_CHANGE,
                priority=ChangePriority.HIGH,
                approval_stages=[
                    {
                        "stage_id": "stage_1",
                        "stage_name": "DevOps Review",
                        "approvers": ["devops-team@controlcore.io"],
                        "approval_type": "any",
                        "timeout_hours": 24,
                        "escalation_to": "devops-manager@controlcore.io",
                        "required_justifications": ["infrastructure_impact", "rollback_plan"]
                    },
                    {
                        "stage_id": "stage_2",
                        "stage_name": "Change Management Board",
                        "approvers": ["change-manager@controlcore.io", "cto@controlcore.io"],
                        "approval_type": "all",
                        "timeout_hours": 48,
                        "escalation_to": "ceo@controlcore.io",
                        "required_justifications": ["business_justification", "risk_assessment"]
                    }
                ],
                auto_approval_threshold=None,
                escalation_rules={
                    "timeout_escalation": True,
                    "escalation_recipients": ["ceo@controlcore.io"]
                },
                notification_settings={
                    "email_notifications": True,
                    "slack_notifications": True,
                    "approval_reminders": True
                }
            ),
            
            # Policy Change Workflow
            ApprovalWorkflow(
                workflow_id="workflow_policy_change",
                change_type=ChangeType.POLICY_CHANGE,
                priority=ChangePriority.HIGH,
                approval_stages=[
                    {
                        "stage_id": "stage_1",
                        "stage_name": "Legal Review",
                        "approvers": ["legal-team@controlcore.io"],
                        "approval_type": "any",
                        "timeout_hours": 48,
                        "escalation_to": "legal-manager@controlcore.io",
                        "required_justifications": ["legal_impact", "compliance_impact"]
                    },
                    {
                        "stage_id": "stage_2",
                        "stage_name": "Compliance Review",
                        "approvers": ["compliance@controlcore.io", "privacy-officer@controlcore.io"],
                        "approval_type": "all",
                        "timeout_hours": 72,
                        "escalation_to": "ciso@controlcore.io",
                        "required_justifications": ["compliance_assessment", "privacy_impact"]
                    }
                ],
                auto_approval_threshold=None,
                escalation_rules={
                    "timeout_escalation": True,
                    "escalation_recipients": ["ciso@controlcore.io", "cto@controlcore.io"]
                },
                notification_settings={
                    "email_notifications": True,
                    "slack_notifications": True,
                    "approval_reminders": True
                }
            )
        ]
        
        for workflow in workflows:
            self.approval_workflows[f"{workflow.change_type.value}_{workflow.priority.value}"] = workflow

    def _initialize_sample_data(self):
        """Initialize with sample change requests"""
        
        sample_changes = [
            ChangeRequest(
                change_id="CHG-001",
                title="Update Authentication Service to Support MFA",
                description="Implement multi-factor authentication support in the authentication service to enhance security",
                change_type=ChangeType.SECURITY_CHANGE,
                priority=ChangePriority.HIGH,
                status=ChangeStatus.PENDING_APPROVAL,
                requester="john.doe@controlcore.io",
                requester_email="john.doe@controlcore.io",
                target_components=["cc-pap-api", "cc-bouncer"],
                target_environments=["production", "staging"],
                estimated_effort=40,
                business_justification="Enhance security posture and meet customer requirements for MFA",
                risk_assessment="Low risk - well-tested implementation with rollback plan",
                rollback_plan="Disable MFA feature flag and revert to previous authentication method",
                testing_plan="Unit tests, integration tests, and security penetration testing",
                documentation_required=True,
                security_review_required=True,
                compliance_impact=["SOC2 Security Controls", "GDPR Data Protection"],
                created_at=datetime.utcnow() - timedelta(days=2),
                updated_at=datetime.utcnow() - timedelta(days=1),
                scheduled_start=datetime.utcnow() + timedelta(days=7),
                scheduled_end=datetime.utcnow() + timedelta(days=9),
                actual_start=None,
                actual_end=None
            ),
            ChangeRequest(
                change_id="CHG-002",
                title="Deploy New Policy Engine Version",
                description="Deploy version 2.1.0 of the policy engine with performance improvements",
                change_type=ChangeType.DEPLOYMENT_CHANGE,
                priority=ChangePriority.MEDIUM,
                status=ChangeStatus.APPROVED,
                requester="jane.smith@controlcore.io",
                requester_email="jane.smith@controlcore.io",
                target_components=["cc-bouncer", "cc-opal"],
                target_environments=["production"],
                estimated_effort=8,
                business_justification="Performance improvements will reduce policy evaluation latency by 30%",
                risk_assessment="Medium risk - new version with proven testing in staging",
                rollback_plan="Revert to previous policy engine version using blue-green deployment",
                testing_plan="Load testing, performance testing, and regression testing completed",
                documentation_required=True,
                security_review_required=False,
                compliance_impact=["SOC2 Processing Integrity"],
                created_at=datetime.utcnow() - timedelta(days=5),
                updated_at=datetime.utcnow() - timedelta(hours=6),
                scheduled_start=datetime.utcnow() + timedelta(hours=12),
                scheduled_end=datetime.utcnow() + timedelta(hours=16),
                actual_start=None,
                actual_end=None
            )
        ]
        
        for change in sample_changes:
            self.change_requests[change.change_id] = change

    def create_change_request(
        self,
        title: str,
        description: str,
        change_type: ChangeType,
        priority: ChangePriority,
        requester: str,
        requester_email: str,
        target_components: List[str],
        target_environments: List[str],
        estimated_effort: int,
        business_justification: str,
        risk_assessment: str,
        rollback_plan: str,
        testing_plan: str,
        compliance_impact: List[str]
    ) -> ChangeRequest:
        """Create a new change request"""
        
        change_id = f"CHG-{len(self.change_requests) + 1:03d}"
        current_time = datetime.utcnow()
        
        # Determine initial status based on auto-approval rules
        initial_status = ChangeStatus.PENDING_APPROVAL
        if self.auto_approval_enabled:
            workflow_key = f"{change_type.value}_{priority.value}"
            workflow = self.approval_workflows.get(workflow_key)
            if workflow and workflow.auto_approval_threshold:
                if self._is_priority_auto_approvable(priority, workflow.auto_approval_threshold):
                    initial_status = ChangeStatus.APPROVED
        
        change_request = ChangeRequest(
            change_id=change_id,
            title=title,
            description=description,
            change_type=change_type,
            priority=priority,
            status=initial_status,
            requester=requester,
            requester_email=requester_email,
            target_components=target_components,
            target_environments=target_environments,
            estimated_effort=estimated_effort,
            business_justification=business_justification,
            risk_assessment=risk_assessment,
            rollback_plan=rollback_plan,
            testing_plan=testing_plan,
            documentation_required=change_type in [ChangeType.SECURITY_CHANGE, ChangeType.POLICY_CHANGE],
            security_review_required=change_type == ChangeType.SECURITY_CHANGE,
            compliance_impact=compliance_impact,
            created_at=current_time,
            updated_at=current_time,
            scheduled_start=None,
            scheduled_end=None,
            actual_start=None,
            actual_end=None
        )
        
        self.change_requests[change_id] = change_request
        
        # Start approval workflow if not auto-approved
        if initial_status == ChangeStatus.PENDING_APPROVAL:
            self._start_approval_workflow(change_request)
        
        logger.info(f"Change request created: {change_id} - {title}")
        return change_request

    def _is_priority_auto_approvable(self, priority: ChangePriority, threshold: ChangePriority) -> bool:
        """Check if priority is auto-approvable based on threshold"""
        
        priority_order = [ChangePriority.LOW, ChangePriority.MEDIUM, ChangePriority.HIGH, ChangePriority.CRITICAL, ChangePriority.EMERGENCY]
        priority_index = priority_order.index(priority)
        threshold_index = priority_order.index(threshold)
        
        return priority_index <= threshold_index

    def _start_approval_workflow(self, change_request: ChangeRequest):
        """Start the approval workflow for a change request"""
        
        workflow_key = f"{change_request.change_type.value}_{change_request.priority.value}"
        workflow = self.approval_workflows.get(workflow_key)
        
        if not workflow:
            logger.warning(f"No workflow found for {workflow_key}")
            return
        
        # Create approval records for first stage
        first_stage = workflow.approval_stages[0]
        for approver in first_stage["approvers"]:
            approval_record = ApprovalRecord(
                approval_id=str(uuid.uuid4()),
                change_id=change_request.change_id,
                approver=approver,
                approver_email=approver,
                stage=first_stage["stage_name"],
                status=ApprovalStatus.PENDING,
                comments=None,
                approved_at=None,
                delegated_to=None,
                justification=None
            )
            
            self.approval_records[approval_record.approval_id] = approval_record
        
        # Send notifications
        if self.notification_enabled:
            self._send_approval_notifications(change_request, first_stage)

    def approve_change(
        self,
        change_id: str,
        approver: str,
        comments: Optional[str] = None,
        justification: Optional[str] = None
    ) -> bool:
        """Approve a change request"""
        
        if change_id not in self.change_requests:
            logger.error(f"Change request not found: {change_id}")
            return False
        
        change_request = self.change_requests[change_id]
        
        # Find pending approval record for this approver
        pending_approval = None
        for approval in self.approval_records.values():
            if (approval.change_id == change_id and 
                approval.approver == approver and 
                approval.status == ApprovalStatus.PENDING):
                pending_approval = approval
                break
        
        if not pending_approval:
            logger.error(f"No pending approval found for {approver} on change {change_id}")
            return False
        
        # Update approval record
        pending_approval.status = ApprovalStatus.APPROVED
        pending_approval.comments = comments
        pending_approval.justification = justification
        pending_approval.approved_at = datetime.utcnow()
        
        # Check if all required approvals are complete
        if self._check_stage_completion(change_request, pending_approval.stage):
            self._advance_to_next_stage(change_request)
        
        change_request.updated_at = datetime.utcnow()
        
        logger.info(f"Change request {change_id} approved by {approver}")
        return True

    def reject_change(
        self,
        change_id: str,
        approver: str,
        comments: str,
        justification: Optional[str] = None
    ) -> bool:
        """Reject a change request"""
        
        if change_id not in self.change_requests:
            logger.error(f"Change request not found: {change_id}")
            return False
        
        change_request = self.change_requests[change_id]
        
        # Find pending approval record for this approver
        pending_approval = None
        for approval in self.approval_records.values():
            if (approval.change_id == change_id and 
                approval.approver == approver and 
                approval.status == ApprovalStatus.PENDING):
                pending_approval = approval
                break
        
        if not pending_approval:
            logger.error(f"No pending approval found for {approver} on change {change_id}")
            return False
        
        # Update approval record
        pending_approval.status = ApprovalStatus.REJECTED
        pending_approval.comments = comments
        pending_approval.justification = justification
        pending_approval.approved_at = datetime.utcnow()
        
        # Reject the change request
        change_request.status = ChangeStatus.REJECTED
        change_request.updated_at = datetime.utcnow()
        
        logger.info(f"Change request {change_id} rejected by {approver}")
        return True

    def _check_stage_completion(self, change_request: ChangeRequest, stage: str) -> bool:
        """Check if all approvals for a stage are complete"""
        
        workflow_key = f"{change_request.change_type.value}_{change_request.priority.value}"
        workflow = self.approval_workflows.get(workflow_key)
        
        if not workflow:
            return False
        
        # Find the stage configuration
        stage_config = None
        for stage_cfg in workflow.approval_stages:
            if stage_cfg["stage_name"] == stage:
                stage_config = stage_cfg
                break
        
        if not stage_config:
            return False
        
        # Get all approval records for this stage
        stage_approvals = [
            approval for approval in self.approval_records.values()
            if approval.change_id == change_request.change_id and approval.stage == stage
        ]
        
        # Check completion based on approval type
        if stage_config["approval_type"] == "all":
            return all(approval.status == ApprovalStatus.APPROVED for approval in stage_approvals)
        elif stage_config["approval_type"] == "any":
            return any(approval.status == ApprovalStatus.APPROVED for approval in stage_approvals)
        else:  # sequential
            return all(approval.status == ApprovalStatus.APPROVED for approval in stage_approvals)

    def _advance_to_next_stage(self, change_request: ChangeRequest):
        """Advance to the next approval stage or complete the change request"""
        
        workflow_key = f"{change_request.change_type.value}_{change_request.priority.value}"
        workflow = self.approval_workflows.get(workflow_key)
        
        if not workflow:
            return
        
        # Find current stage index
        current_stage = None
        current_stage_index = -1
        
        for approval in self.approval_records.values():
            if (approval.change_id == change_request.change_id and 
                approval.status == ApprovalStatus.APPROVED):
                for i, stage_cfg in enumerate(workflow.approval_stages):
                    if stage_cfg["stage_name"] == approval.stage:
                        if i > current_stage_index:
                            current_stage_index = i
                            current_stage = stage_cfg
                        break
        
        # Check if there's a next stage
        next_stage_index = current_stage_index + 1
        if next_stage_index < len(workflow.approval_stages):
            # Create approval records for next stage
            next_stage = workflow.approval_stages[next_stage_index]
            for approver in next_stage["approvers"]:
                approval_record = ApprovalRecord(
                    approval_id=str(uuid.uuid4()),
                    change_id=change_request.change_id,
                    approver=approver,
                    approver_email=approver,
                    stage=next_stage["stage_name"],
                    status=ApprovalStatus.PENDING,
                    comments=None,
                    approved_at=None,
                    delegated_to=None,
                    justification=None
                )
                
                self.approval_records[approval_record.approval_id] = approval_record
            
            # Send notifications for next stage
            if self.notification_enabled:
                self._send_approval_notifications(change_request, next_stage)
        else:
            # All stages complete, approve the change request
            change_request.status = ChangeStatus.APPROVED
            logger.info(f"Change request {change_request.change_id} fully approved")

    def _send_approval_notifications(self, change_request: ChangeRequest, stage_config: Dict[str, Any]):
        """Send notifications for approval requests"""
        
        # In a real implementation, this would send actual notifications
        logger.info(f"Sending approval notifications for change {change_request.change_id} to {stage_config['approvers']}")

    def get_change_request(self, change_id: str) -> Optional[ChangeRequest]:
        """Get a change request by ID"""
        
        return self.change_requests.get(change_id)

    def get_change_requests(
        self,
        status: Optional[ChangeStatus] = None,
        change_type: Optional[ChangeType] = None,
        priority: Optional[ChangePriority] = None,
        requester: Optional[str] = None
    ) -> List[ChangeRequest]:
        """Get change requests with optional filtering"""
        
        changes = list(self.change_requests.values())
        
        if status:
            changes = [c for c in changes if c.status == status]
        if change_type:
            changes = [c for c in changes if c.change_type == change_type]
        if priority:
            changes = [c for c in changes if c.priority == priority]
        if requester:
            changes = [c for c in changes if c.requester == requester]
        
        return sorted(changes, key=lambda x: x.created_at, reverse=True)

    def get_approval_records(self, change_id: str) -> List[ApprovalRecord]:
        """Get approval records for a change request"""
        
        return [
            approval for approval in self.approval_records.values()
            if approval.change_id == change_id
        ]

    def get_change_statistics(self) -> Dict[str, Any]:
        """Get change management statistics"""
        
        total_changes = len(self.change_requests)
        
        stats = {
            "total_changes": total_changes,
            "by_status": {},
            "by_type": {},
            "by_priority": {},
            "pending_approvals": 0,
            "overdue_approvals": 0,
            "average_approval_time": 0.0
        }
        
        for change in self.change_requests.values():
            # Count by status
            status = change.status.value
            stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
            
            # Count by type
            change_type = change.change_type.value
            stats["by_type"][change_type] = stats["by_type"].get(change_type, 0) + 1
            
            # Count by priority
            priority = change.priority.value
            stats["by_priority"][priority] = stats["by_priority"].get(priority, 0) + 1
        
        # Count pending and overdue approvals
        current_time = datetime.utcnow()
        for approval in self.approval_records.values():
            if approval.status == ApprovalStatus.PENDING:
                stats["pending_approvals"] += 1
                
                # Check if overdue (mock calculation)
                if hasattr(approval, 'created_at'):
                    time_since_created = current_time - approval.created_at
                    if time_since_created.total_seconds() > 24 * 3600:  # 24 hours
                        stats["overdue_approvals"] += 1
        
        return stats

    def schedule_change(
        self,
        change_id: str,
        scheduled_start: datetime,
        scheduled_end: datetime
    ) -> bool:
        """Schedule a change request for implementation"""
        
        if change_id not in self.change_requests:
            logger.error(f"Change request not found: {change_id}")
            return False
        
        change_request = self.change_requests[change_id]
        
        if change_request.status != ChangeStatus.APPROVED:
            logger.error(f"Change request {change_id} is not approved for scheduling")
            return False
        
        change_request.scheduled_start = scheduled_start
        change_request.scheduled_end = scheduled_end
        change_request.updated_at = datetime.utcnow()
        
        logger.info(f"Change request {change_id} scheduled from {scheduled_start} to {scheduled_end}")
        return True

    def start_change_implementation(self, change_id: str) -> bool:
        """Start implementing a scheduled change request"""
        
        if change_id not in self.change_requests:
            logger.error(f"Change request not found: {change_id}")
            return False
        
        change_request = self.change_requests[change_id]
        
        if change_request.status != ChangeStatus.APPROVED:
            logger.error(f"Change request {change_id} is not approved for implementation")
            return False
        
        change_request.status = ChangeStatus.IN_PROGRESS
        change_request.actual_start = datetime.utcnow()
        change_request.updated_at = datetime.utcnow()
        
        logger.info(f"Change request {change_id} implementation started")
        return True

    def complete_change_implementation(self, change_id: str, success: bool = True) -> bool:
        """Complete change implementation"""
        
        if change_id not in self.change_requests:
            logger.error(f"Change request not found: {change_id}")
            return False
        
        change_request = self.change_requests[change_id]
        
        if change_request.status != ChangeStatus.IN_PROGRESS:
            logger.error(f"Change request {change_id} is not in progress")
            return False
        
        change_request.status = ChangeStatus.COMPLETED if success else ChangeStatus.FAILED
        change_request.actual_end = datetime.utcnow()
        change_request.updated_at = datetime.utcnow()
        
        logger.info(f"Change request {change_id} implementation {'completed' if success else 'failed'}")
        return True

# Global change management service instance
change_management_service = None

def get_change_management_service(db: Session) -> ChangeManagementService:
    """Get change management service instance"""
    global change_management_service
    if change_management_service is None:
        change_management_service = ChangeManagementService(db)
    return change_management_service
