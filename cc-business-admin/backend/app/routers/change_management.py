"""
Change Management API endpoints for Control Core Business Admin
SOC2-compliant change management with approval workflows
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.change_management_service import (
    ChangeManagementService, 
    ChangeRequest, 
    ChangeType, 
    ChangePriority, 
    ChangeStatus,
    get_change_management_service
)
from app.schemas.change_management import (
    ChangeRequestCreate,
    ChangeRequestResponse,
    ChangeRequestUpdate,
    ApprovalRequest,
    ApprovalResponse,
    ChangeStatistics,
    ChangeListResponse
)

router = APIRouter(prefix="/api/v1/change-management", tags=["Change Management"])

@router.post("/change-requests", response_model=ChangeRequestResponse)
async def create_change_request(
    change_request: ChangeRequestCreate,
    db: Session = Depends(get_db),
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Create a new change request"""
    try:
        created_change = change_service.create_change_request(
            title=change_request.title,
            description=change_request.description,
            change_type=ChangeType(change_request.change_type),
            priority=ChangePriority(change_request.priority),
            requester=change_request.requester,
            requester_email=change_request.requester_email,
            target_components=change_request.target_components,
            target_environments=change_request.target_environments,
            estimated_effort=change_request.estimated_effort,
            business_justification=change_request.business_justification,
            risk_assessment=change_request.risk_assessment,
            rollback_plan=change_request.rollback_plan,
            testing_plan=change_request.testing_plan,
            compliance_impact=change_request.compliance_impact
        )
        
        return ChangeRequestResponse.from_change_request(created_change)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create change request: {str(e)}"
        )

@router.get("/change-requests", response_model=ChangeListResponse)
async def get_change_requests(
    status: Optional[str] = None,
    change_type: Optional[str] = None,
    priority: Optional[str] = None,
    requester: Optional[str] = None,
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Get change requests with optional filtering"""
    try:
        # Convert string parameters to enums
        status_filter = ChangeStatus(status) if status else None
        type_filter = ChangeType(change_type) if change_type else None
        priority_filter = ChangePriority(priority) if priority else None
        
        changes = change_service.get_change_requests(
            status=status_filter,
            change_type=type_filter,
            priority=priority_filter,
            requester=requester
        )
        
        return ChangeListResponse(
            changes=[ChangeRequestResponse.from_change_request(change) for change in changes],
            total_count=len(changes)
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid parameter value: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve change requests: {str(e)}"
        )

@router.get("/change-requests/{change_id}", response_model=ChangeRequestResponse)
async def get_change_request(
    change_id: str,
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Get a specific change request by ID"""
    change_request = change_service.get_change_request(change_id)
    
    if not change_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Change request not found: {change_id}"
        )
    
    return ChangeRequestResponse.from_change_request(change_request)

@router.post("/change-requests/{change_id}/approve", response_model=ApprovalResponse)
async def approve_change_request(
    change_id: str,
    approval_request: ApprovalRequest,
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Approve a change request"""
    try:
        success = change_service.approve_change(
            change_id=change_id,
            approver=approval_request.approver,
            comments=approval_request.comments,
            justification=approval_request.justification
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to approve change request"
            )
        
        return ApprovalResponse(
            success=True,
            message="Change request approved successfully",
            approved_at=datetime.utcnow()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve change request: {str(e)}"
        )

@router.post("/change-requests/{change_id}/reject", response_model=ApprovalResponse)
async def reject_change_request(
    change_id: str,
    approval_request: ApprovalRequest,
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Reject a change request"""
    try:
        success = change_service.reject_change(
            change_id=change_id,
            approver=approval_request.approver,
            comments=approval_request.comments,
            justification=approval_request.justification
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to reject change request"
            )
        
        return ApprovalResponse(
            success=True,
            message="Change request rejected successfully",
            approved_at=datetime.utcnow()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject change request: {str(e)}"
        )

@router.post("/change-requests/{change_id}/schedule")
async def schedule_change_request(
    change_id: str,
    scheduled_start: datetime,
    scheduled_end: datetime,
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Schedule a change request for implementation"""
    try:
        success = change_service.schedule_change(
            change_id=change_id,
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to schedule change request"
            )
        
        return {"message": "Change request scheduled successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule change request: {str(e)}"
        )

@router.post("/change-requests/{change_id}/start")
async def start_change_implementation(
    change_id: str,
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Start implementing a change request"""
    try:
        success = change_service.start_change_implementation(change_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to start change implementation"
            )
        
        return {"message": "Change implementation started successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start change implementation: {str(e)}"
        )

@router.post("/change-requests/{change_id}/complete")
async def complete_change_implementation(
    change_id: str,
    success: bool = True,
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Complete change implementation"""
    try:
        result = change_service.complete_change_implementation(change_id, success)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to complete change implementation"
            )
        
        return {"message": f"Change implementation {'completed' if success else 'failed'} successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete change implementation: {str(e)}"
        )

@router.get("/change-requests/{change_id}/approvals")
async def get_change_approvals(
    change_id: str,
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Get approval records for a change request"""
    try:
        approvals = change_service.get_approval_records(change_id)
        
        return {
            "change_id": change_id,
            "approvals": [
                {
                    "approval_id": approval.approval_id,
                    "approver": approval.approver,
                    "stage": approval.stage,
                    "status": approval.status.value,
                    "comments": approval.comments,
                    "approved_at": approval.approved_at.isoformat() if approval.approved_at else None,
                    "justification": approval.justification
                }
                for approval in approvals
            ]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve approvals: {str(e)}"
        )

@router.get("/statistics", response_model=ChangeStatistics)
async def get_change_statistics(
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Get change management statistics"""
    try:
        stats = change_service.get_change_statistics()
        
        return ChangeStatistics(
            total_changes=stats["total_changes"],
            by_status=stats["by_status"],
            by_type=stats["by_type"],
            by_priority=stats["by_priority"],
            pending_approvals=stats["pending_approvals"],
            overdue_approvals=stats["overdue_approvals"],
            average_approval_time=stats["average_approval_time"]
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )

@router.get("/workflows")
async def get_approval_workflows(
    change_service: ChangeManagementService = Depends(get_change_management_service)
):
    """Get available approval workflows"""
    try:
        workflows = list(change_service.approval_workflows.values())
        
        return {
            "workflows": [
                {
                    "workflow_id": workflow.workflow_id,
                    "change_type": workflow.change_type.value,
                    "priority": workflow.priority.value,
                    "approval_stages": workflow.approval_stages,
                    "auto_approval_threshold": workflow.auto_approval_threshold.value if workflow.auto_approval_threshold else None,
                    "escalation_rules": workflow.escalation_rules,
                    "notification_settings": workflow.notification_settings
                }
                for workflow in workflows
            ]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve workflows: {str(e)}"
        )
