"""
Pydantic schemas for Change Management API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ChangeTypeEnum(str, Enum):
    CODE_CHANGE = "code_change"
    INFRASTRUCTURE_CHANGE = "infrastructure_change"
    CONFIGURATION_CHANGE = "configuration_change"
    SECURITY_CHANGE = "security_change"
    DEPLOYMENT_CHANGE = "deployment_change"
    POLICY_CHANGE = "policy_change"
    ACCESS_CHANGE = "access_change"

class ChangePriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class ChangeStatusEnum(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ChangeRequestCreate(BaseModel):
    title: str = Field(..., description="Change request title")
    description: str = Field(..., description="Detailed description of the change")
    change_type: ChangeTypeEnum = Field(..., description="Type of change")
    priority: ChangePriorityEnum = Field(..., description="Priority level")
    requester: str = Field(..., description="Email of the person requesting the change")
    requester_email: str = Field(..., description="Email address of the requester")
    target_components: List[str] = Field(..., description="Components affected by the change")
    target_environments: List[str] = Field(..., description="Environments where change will be applied")
    estimated_effort: int = Field(..., ge=1, description="Estimated effort in hours")
    business_justification: str = Field(..., description="Business justification for the change")
    risk_assessment: str = Field(..., description="Risk assessment of the change")
    rollback_plan: str = Field(..., description="Plan for rolling back the change")
    testing_plan: str = Field(..., description="Testing plan for the change")
    compliance_impact: List[str] = Field(default=[], description="Compliance impacts of the change")

class ChangeRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_effort: Optional[int] = Field(None, ge=1)
    business_justification: Optional[str] = None
    risk_assessment: Optional[str] = None
    rollback_plan: Optional[str] = None
    testing_plan: Optional[str] = None
    compliance_impact: Optional[List[str]] = None

class ApprovalRequest(BaseModel):
    approver: str = Field(..., description="Email of the approver")
    comments: Optional[str] = Field(None, description="Comments from the approver")
    justification: Optional[str] = Field(None, description="Justification for the decision")

class ChangeRequestResponse(BaseModel):
    change_id: str
    title: str
    description: str
    change_type: ChangeTypeEnum
    priority: ChangePriorityEnum
    status: ChangeStatusEnum
    requester: str
    requester_email: str
    target_components: List[str]
    target_environments: List[str]
    estimated_effort: int
    business_justification: str
    risk_assessment: str
    rollback_plan: str
    testing_plan: str
    documentation_required: bool
    security_review_required: bool
    compliance_impact: List[str]
    created_at: datetime
    updated_at: datetime
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None

    @classmethod
    def from_change_request(cls, change_request):
        return cls(
            change_id=change_request.change_id,
            title=change_request.title,
            description=change_request.description,
            change_type=ChangeTypeEnum(change_request.change_type.value),
            priority=ChangePriorityEnum(change_request.priority.value),
            status=ChangeStatusEnum(change_request.status.value),
            requester=change_request.requester,
            requester_email=change_request.requester_email,
            target_components=change_request.target_components,
            target_environments=change_request.target_environments,
            estimated_effort=change_request.estimated_effort,
            business_justification=change_request.business_justification,
            risk_assessment=change_request.risk_assessment,
            rollback_plan=change_request.rollback_plan,
            testing_plan=change_request.testing_plan,
            documentation_required=change_request.documentation_required,
            security_review_required=change_request.security_review_required,
            compliance_impact=change_request.compliance_impact,
            created_at=change_request.created_at,
            updated_at=change_request.updated_at,
            scheduled_start=change_request.scheduled_start,
            scheduled_end=change_request.scheduled_end,
            actual_start=change_request.actual_start,
            actual_end=change_request.actual_end
        )

class ApprovalResponse(BaseModel):
    success: bool
    message: str
    approved_at: Optional[datetime] = None

class ChangeStatistics(BaseModel):
    total_changes: int
    by_status: Dict[str, int]
    by_type: Dict[str, int]
    by_priority: Dict[str, int]
    pending_approvals: int
    overdue_approvals: int
    average_approval_time: float

class ChangeListResponse(BaseModel):
    changes: List[ChangeRequestResponse]
    total_count: int
