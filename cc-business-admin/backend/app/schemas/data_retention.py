"""
Pydantic schemas for Data Retention API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class DataTypeEnum(str, Enum):
    USER_DATA = "user_data"
    AUDIT_LOGS = "audit_logs"
    TELEMETRY_DATA = "telemetry_data"
    POLICY_DATA = "policy_data"
    ACCESS_LOGS = "access_logs"
    ERROR_LOGS = "error_logs"
    BACKUP_DATA = "backup_data"
    TEMPORARY_DATA = "temporary_data"
    CACHE_DATA = "cache_data"
    ANALYTICS_DATA = "analytics_data"

class DataClassificationEnum(str, Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

class RetentionActionEnum(str, Enum):
    DELETE = "delete"
    ARCHIVE = "archive"
    ANONYMIZE = "anonymize"
    MOVE_TO_COLD_STORAGE = "move_to_cold_storage"
    ENCRYPT_AND_STORE = "encrypt_and_store"

class RetentionStatusEnum(str, Enum):
    ACTIVE = "active"
    PENDING_REVIEW = "pending_review"
    SCHEDULED_FOR_DELETION = "scheduled_for_deletion"
    ARCHIVED = "archived"
    DELETED = "deleted"
    ANONYMIZED = "anonymized"

class RetentionPolicyCreate(BaseModel):
    name: str = Field(..., description="Policy name")
    description: str = Field(..., description="Policy description")
    data_type: DataTypeEnum = Field(..., description="Type of data covered by this policy")
    data_classification: DataClassificationEnum = Field(..., description="Data classification level")
    retention_period_days: int = Field(..., ge=1, description="Retention period in days")
    retention_action: RetentionActionEnum = Field(..., description="Action to take after retention period")
    legal_hold_exceptions: List[str] = Field(default=[], description="Exceptions for legal hold")
    auto_execution_enabled: bool = Field(default=True, description="Enable automatic execution")
    notification_before_action: bool = Field(default=True, description="Send notifications before action")
    notification_days_before: int = Field(default=30, ge=0, description="Days before action to send notification")
    created_by: str = Field(default="admin@controlcore.io", description="Creator of the policy")

class RetentionPolicyResponse(BaseModel):
    policy_id: str
    name: str
    description: str
    data_type: DataTypeEnum
    data_classification: DataClassificationEnum
    retention_period_days: int
    retention_action: RetentionActionEnum
    legal_hold_exceptions: List[str]
    auto_execution_enabled: bool
    notification_before_action: bool
    notification_days_before: int
    created_at: datetime
    updated_at: datetime
    created_by: str
    is_active: bool

    @classmethod
    def from_retention_policy(cls, policy):
        return cls(
            policy_id=policy.policy_id,
            name=policy.name,
            description=policy.description,
            data_type=DataTypeEnum(policy.data_type.value),
            data_classification=DataClassificationEnum(policy.data_classification.value),
            retention_period_days=policy.retention_period_days,
            retention_action=RetentionActionEnum(policy.retention_action.value),
            legal_hold_exceptions=policy.legal_hold_exceptions,
            auto_execution_enabled=policy.auto_execution_enabled,
            notification_before_action=policy.notification_before_action,
            notification_days_before=policy.notification_days_before,
            created_at=policy.created_at,
            updated_at=policy.updated_at,
            created_by=policy.created_by,
            is_active=policy.is_active
        )

class DataAssetCreate(BaseModel):
    name: str = Field(..., description="Asset name")
    data_type: DataTypeEnum = Field(..., description="Type of data")
    data_classification: DataClassificationEnum = Field(..., description="Data classification level")
    location: str = Field(..., description="Physical or logical location of the asset")
    size_bytes: int = Field(..., ge=0, description="Size of the asset in bytes")
    record_count: int = Field(..., ge=0, description="Number of records in the asset")
    tags: Optional[List[str]] = Field(default=[], description="Tags for categorization")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")

class DataAssetResponse(BaseModel):
    asset_id: str
    name: str
    data_type: DataTypeEnum
    data_classification: DataClassificationEnum
    location: str
    size_bytes: int
    record_count: int
    created_at: datetime
    last_accessed: datetime
    retention_policy_id: Optional[str]
    retention_status: RetentionStatusEnum
    scheduled_action_date: Optional[datetime]
    tags: List[str]
    metadata: Dict[str, Any]

    @classmethod
    def from_data_asset(cls, asset):
        return cls(
            asset_id=asset.asset_id,
            name=asset.name,
            data_type=DataTypeEnum(asset.data_type.value),
            data_classification=DataClassificationEnum(asset.data_classification.value),
            location=asset.location,
            size_bytes=asset.size_bytes,
            record_count=asset.record_count,
            created_at=asset.created_at,
            last_accessed=asset.last_accessed,
            retention_policy_id=asset.retention_policy_id,
            retention_status=RetentionStatusEnum(asset.retention_status.value),
            scheduled_action_date=asset.scheduled_action_date,
            tags=asset.tags,
            metadata=asset.metadata
        )

class RetentionStatistics(BaseModel):
    total_assets: int
    total_policies: int
    assets_by_status: Dict[str, int]
    assets_by_type: Dict[str, int]
    assets_by_classification: Dict[str, int]
    upcoming_actions: int
    overdue_actions: int
    total_data_size_bytes: int
    total_data_size_gb: float
    total_record_count: int

class UpcomingAction(BaseModel):
    asset_id: str
    asset_name: str
    data_type: str
    classification: str
    scheduled_date: datetime
    days_until_action: int
    action_type: str
    policy_name: str
    size_bytes: int
    record_count: int

class UpcomingActionsResponse(BaseModel):
    actions: List[UpcomingAction]
    total_count: int
    days_ahead: int
