"""
Data Retention API endpoints for Control Core Business Admin
SOC2-compliant data lifecycle management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.data_retention_service import (
    DataRetentionService,
    RetentionPolicy,
    DataAsset,
    DataType,
    DataClassification,
    RetentionAction,
    RetentionStatus,
    get_data_retention_service
)
from app.schemas.data_retention import (
    RetentionPolicyCreate,
    RetentionPolicyResponse,
    DataAssetCreate,
    DataAssetResponse,
    RetentionStatistics,
    UpcomingActionsResponse
)

router = APIRouter(prefix="/api/v1/data-retention", tags=["Data Retention"])

@router.post("/policies", response_model=RetentionPolicyResponse)
async def create_retention_policy(
    policy: RetentionPolicyCreate,
    db: Session = Depends(get_db),
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Create a new data retention policy"""
    try:
        created_policy = retention_service.create_retention_policy(
            name=policy.name,
            description=policy.description,
            data_type=DataType(policy.data_type),
            data_classification=DataClassification(policy.data_classification),
            retention_period_days=policy.retention_period_days,
            retention_action=RetentionAction(policy.retention_action),
            legal_hold_exceptions=policy.legal_hold_exceptions,
            auto_execution_enabled=policy.auto_execution_enabled,
            notification_before_action=policy.notification_before_action,
            notification_days_before=policy.notification_days_before,
            created_by=policy.created_by
        )
        
        return RetentionPolicyResponse.from_retention_policy(created_policy)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid parameter value: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create retention policy: {str(e)}"
        )

@router.get("/policies", response_model=List[RetentionPolicyResponse])
async def get_retention_policies(
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Get all retention policies"""
    try:
        policies = retention_service.get_retention_policies()
        
        return [RetentionPolicyResponse.from_retention_policy(policy) for policy in policies]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve retention policies: {str(e)}"
        )

@router.get("/policies/{policy_id}", response_model=RetentionPolicyResponse)
async def get_retention_policy(
    policy_id: str,
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Get a specific retention policy by ID"""
    policies = retention_service.get_retention_policies()
    policy = next((p for p in policies if p.policy_id == policy_id), None)
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Retention policy not found: {policy_id}"
        )
    
    return RetentionPolicyResponse.from_retention_policy(policy)

@router.post("/assets", response_model=DataAssetResponse)
async def register_data_asset(
    asset: DataAssetCreate,
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Register a new data asset for retention management"""
    try:
        created_asset = retention_service.register_data_asset(
            name=asset.name,
            data_type=DataType(asset.data_type),
            data_classification=DataClassification(asset.data_classification),
            location=asset.location,
            size_bytes=asset.size_bytes,
            record_count=asset.record_count,
            tags=asset.tags,
            metadata=asset.metadata
        )
        
        return DataAssetResponse.from_data_asset(created_asset)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid parameter value: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register data asset: {str(e)}"
        )

@router.get("/assets", response_model=List[DataAssetResponse])
async def get_data_assets(
    data_type: Optional[str] = None,
    status: Optional[str] = None,
    classification: Optional[str] = None,
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Get data assets with optional filtering"""
    try:
        # Convert string parameters to enums
        type_filter = DataType(data_type) if data_type else None
        status_filter = RetentionStatus(status) if status else None
        classification_filter = DataClassification(classification) if classification else None
        
        assets = retention_service.get_data_assets(
            data_type=type_filter,
            status=status_filter,
            classification=classification_filter
        )
        
        return [DataAssetResponse.from_data_asset(asset) for asset in assets]
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid parameter value: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve data assets: {str(e)}"
        )

@router.get("/assets/{asset_id}", response_model=DataAssetResponse)
async def get_data_asset(
    asset_id: str,
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Get a specific data asset by ID"""
    assets = retention_service.get_data_assets()
    asset = next((a for a in assets if a.asset_id == asset_id), None)
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Data asset not found: {asset_id}"
        )
    
    return DataAssetResponse.from_data_asset(asset)

@router.post("/actions/execute")
async def execute_retention_actions(
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Execute scheduled retention actions"""
    try:
        results = retention_service.execute_retention_actions()
        
        return {
            "status": results["status"],
            "actions_executed": results["actions_executed"],
            "actions_failed": results.get("actions_failed", 0),
            "action_results": results.get("action_results", [])
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute retention actions: {str(e)}"
        )

@router.get("/statistics", response_model=RetentionStatistics)
async def get_retention_statistics(
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Get data retention statistics"""
    try:
        stats = retention_service.get_retention_statistics()
        
        return RetentionStatistics(
            total_assets=stats["total_assets"],
            total_policies=stats["total_policies"],
            assets_by_status=stats["assets_by_status"],
            assets_by_type=stats["assets_by_type"],
            assets_by_classification=stats["assets_by_classification"],
            upcoming_actions=stats["upcoming_actions"],
            overdue_actions=stats["overdue_actions"],
            total_data_size_bytes=stats["total_data_size_bytes"],
            total_data_size_gb=stats["total_data_size_gb"],
            total_record_count=stats["total_record_count"]
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )

@router.get("/actions/upcoming", response_model=UpcomingActionsResponse)
async def get_upcoming_retention_actions(
    days_ahead: int = 30,
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Get assets with upcoming retention actions"""
    try:
        upcoming_actions = retention_service.get_upcoming_retention_actions(days_ahead)
        
        return UpcomingActionsResponse(
            actions=upcoming_actions,
            total_count=len(upcoming_actions),
            days_ahead=days_ahead
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve upcoming actions: {str(e)}"
        )

@router.post("/assets/{asset_id}/legal-hold")
async def place_legal_hold(
    asset_id: str,
    legal_hold_reason: str,
    placed_by: str,
    expiration_date: Optional[datetime] = None,
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Place a legal hold on a data asset"""
    try:
        success = retention_service.place_legal_hold(
            asset_id=asset_id,
            legal_hold_reason=legal_hold_reason,
            placed_by=placed_by,
            expiration_date=expiration_date
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to place legal hold"
            )
        
        return {"message": "Legal hold placed successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to place legal hold: {str(e)}"
        )

@router.delete("/assets/{asset_id}/legal-hold")
async def remove_legal_hold(
    asset_id: str,
    removed_by: str,
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Remove legal hold from a data asset"""
    try:
        success = retention_service.remove_legal_hold(
            asset_id=asset_id,
            removed_by=removed_by
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to remove legal hold"
            )
        
        return {"message": "Legal hold removed successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove legal hold: {str(e)}"
        )

@router.get("/inventory")
async def get_data_inventory(
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Get data inventory summary"""
    try:
        inventory = list(retention_service.data_inventory.values())
        
        return {
            "inventory": [
                {
                    "inventory_id": item.inventory_id,
                    "name": item.name,
                    "description": item.description,
                    "data_type": item.data_type.value,
                    "location": item.location,
                    "classification": item.classification.value,
                    "record_count": item.record_count,
                    "size_bytes": item.size_bytes,
                    "created_at": item.created_at.isoformat(),
                    "last_modified": item.last_modified.isoformat(),
                    "retention_policy_applied": item.retention_policy_applied,
                    "compliance_status": item.compliance_status
                }
                for item in inventory
            ],
            "total_count": len(inventory)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve data inventory: {str(e)}"
        )

@router.get("/compliance/report")
async def generate_compliance_report(
    retention_service: DataRetentionService = Depends(get_data_retention_service)
):
    """Generate data retention compliance report"""
    try:
        stats = retention_service.get_retention_statistics()
        upcoming_actions = retention_service.get_upcoming_retention_actions(30)
        
        # Calculate compliance score
        total_assets = stats["total_assets"]
        compliant_assets = stats["assets_by_status"].get("active", 0) + stats["assets_by_status"].get("archived", 0)
        compliance_score = (compliant_assets / total_assets * 100) if total_assets > 0 else 100
        
        return {
            "compliance_score": round(compliance_score, 2),
            "total_assets": total_assets,
            "compliant_assets": compliant_assets,
            "overdue_actions": stats["overdue_actions"],
            "upcoming_actions_count": len(upcoming_actions),
            "total_data_size_gb": stats["total_data_size_gb"],
            "retention_policies_active": stats["total_policies"],
            "compliance_status": "compliant" if compliance_score >= 95 else "needs_attention",
            "generated_at": datetime.utcnow().isoformat(),
            "recommendations": [
                "Review overdue retention actions" if stats["overdue_actions"] > 0 else None,
                "Update retention policies for new data types" if stats["total_policies"] < 5 else None,
                "Monitor upcoming retention actions" if len(upcoming_actions) > 10 else None
            ]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate compliance report: {str(e)}"
        )
