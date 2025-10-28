"""
Data Retention Service for Control Core Business Admin
Implements SOC2-compliant automated data lifecycle management
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

class DataType(str, Enum):
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

class RetentionAction(str, Enum):
    DELETE = "delete"
    ARCHIVE = "archive"
    ANONYMIZE = "anonymize"
    MOVE_TO_COLD_STORAGE = "move_to_cold_storage"
    ENCRYPT_AND_STORE = "encrypt_and_store"

class DataClassification(str, Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

class RetentionStatus(str, Enum):
    ACTIVE = "active"
    PENDING_REVIEW = "pending_review"
    SCHEDULED_FOR_DELETION = "scheduled_for_deletion"
    ARCHIVED = "archived"
    DELETED = "deleted"
    ANONYMIZED = "anonymized"

@dataclass
class RetentionPolicy:
    policy_id: str
    name: str
    description: str
    data_type: DataType
    data_classification: DataClassification
    retention_period_days: int
    retention_action: RetentionAction
    legal_hold_exceptions: List[str]
    auto_execution_enabled: bool
    notification_before_action: bool
    notification_days_before: int
    created_at: datetime
    updated_at: datetime
    created_by: str
    is_active: bool

@dataclass
class DataAsset:
    asset_id: str
    name: str
    data_type: DataType
    data_classification: DataClassification
    location: str
    size_bytes: int
    record_count: int
    created_at: datetime
    last_accessed: datetime
    retention_policy_id: str
    retention_status: RetentionStatus
    scheduled_action_date: Optional[datetime]
    tags: List[str]
    metadata: Dict[str, Any]

@dataclass
class RetentionActionRecord:
    action_id: str
    asset_id: str
    policy_id: str
    action_type: RetentionAction
    scheduled_date: datetime
    executed_date: Optional[datetime]
    status: str  # "scheduled", "executing", "completed", "failed"
    error_message: Optional[str]
    executed_by: Optional[str]
    backup_location: Optional[str]

@dataclass
class DataInventory:
    inventory_id: str
    name: str
    description: str
    data_type: DataType
    location: str
    classification: DataClassification
    record_count: int
    size_bytes: int
    created_at: datetime
    last_modified: datetime
    retention_policy_applied: bool
    compliance_status: str

class DataRetentionService:
    """
    SOC2-compliant data retention and lifecycle management service
    Implements automated data lifecycle management with compliance tracking
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.retention_policies: Dict[str, RetentionPolicy] = {}
        self.data_assets: Dict[str, DataAsset] = {}
        self.retention_actions: Dict[str, RetentionActionRecord] = {}
        self.data_inventory: Dict[str, DataInventory] = {}
        
        # Configuration
        self.auto_execution_enabled = os.getenv('DATA_RETENTION_AUTO_EXECUTION', 'true').lower() == 'true'
        self.notification_enabled = os.getenv('DATA_RETENTION_NOTIFICATIONS', 'true').lower() == 'true'
        self.backup_before_deletion = os.getenv('DATA_RETENTION_BACKUP_BEFORE_DELETION', 'true').lower() == 'true'
        
        # Legal hold settings
        self.legal_hold_enabled = os.getenv('DATA_RETENTION_LEGAL_HOLD_ENABLED', 'true').lower() == 'true'
        self.legal_hold_recipients = os.getenv('DATA_RETENTION_LEGAL_HOLD_EMAILS', 'legal@controlcore.io,compliance@controlcore.io').split(',')
        
        # Initialize default policies
        self._initialize_default_policies()
        self._initialize_sample_data()
        
        logger.info("DataRetentionService initialized with SOC2 compliance")

    def _initialize_default_policies(self):
        """Initialize default data retention policies"""
        
        policies = [
            # User Data Policy
            RetentionPolicy(
                policy_id="policy_user_data",
                name="User Data Retention Policy",
                description="Retention policy for user personal data in accordance with GDPR and SOC2 requirements",
                data_type=DataType.USER_DATA,
                data_classification=DataClassification.CONFIDENTIAL,
                retention_period_days=2555,  # 7 years for business records
                retention_action=RetentionAction.ANONYMIZE,
                legal_hold_exceptions=["active_accounts", "pending_legal_cases"],
                auto_execution_enabled=True,
                notification_before_action=True,
                notification_days_before=30,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                created_by="compliance@controlcore.io",
                is_active=True
            ),
            
            # Audit Logs Policy
            RetentionPolicy(
                policy_id="policy_audit_logs",
                name="Audit Logs Retention Policy",
                description="Retention policy for audit logs required for SOC2 compliance",
                data_type=DataType.AUDIT_LOGS,
                data_classification=DataClassification.RESTRICTED,
                retention_period_days=2190,  # 6 years for compliance
                retention_action=RetentionAction.ARCHIVE,
                legal_hold_exceptions=["security_incidents", "compliance_audits"],
                auto_execution_enabled=True,
                notification_before_action=True,
                notification_days_before=7,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                created_by="compliance@controlcore.io",
                is_active=True
            ),
            
            # Telemetry Data Policy
            RetentionPolicy(
                policy_id="policy_telemetry_data",
                name="Telemetry Data Retention Policy",
                description="Retention policy for operational telemetry data",
                data_type=DataType.TELEMETRY_DATA,
                data_classification=DataClassification.INTERNAL,
                retention_period_days=365,  # 1 year for operational analysis
                retention_action=RetentionAction.DELETE,
                legal_hold_exceptions=[],
                auto_execution_enabled=True,
                notification_before_action=False,
                notification_days_before=0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                created_by="operations@controlcore.io",
                is_active=True
            ),
            
            # Policy Data Policy
            RetentionPolicy(
                policy_id="policy_policy_data",
                name="Policy Data Retention Policy",
                description="Retention policy for policy configuration data",
                data_type=DataType.POLICY_DATA,
                data_classification=DataClassification.CONFIDENTIAL,
                retention_period_days=1825,  # 5 years for policy history
                retention_action=RetentionAction.ARCHIVE,
                legal_hold_exceptions=["active_policies", "policy_versions"],
                auto_execution_enabled=True,
                notification_before_action=True,
                notification_days_before=14,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                created_by="security@controlcore.io",
                is_active=True
            ),
            
            # Access Logs Policy
            RetentionPolicy(
                policy_id="policy_access_logs",
                name="Access Logs Retention Policy",
                description="Retention policy for access logs required for security monitoring",
                data_type=DataType.ACCESS_LOGS,
                data_classification=DataClassification.RESTRICTED,
                retention_period_days=1095,  # 3 years for security analysis
                retention_action=RetentionAction.ARCHIVE,
                legal_hold_exceptions=["security_incidents", "forensic_investigations"],
                auto_execution_enabled=True,
                notification_before_action=True,
                notification_days_before=7,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                created_by="security@controlcore.io",
                is_active=True
            ),
            
            # Error Logs Policy
            RetentionPolicy(
                policy_id="policy_error_logs",
                name="Error Logs Retention Policy",
                description="Retention policy for application error logs",
                data_type=DataType.ERROR_LOGS,
                data_classification=DataClassification.INTERNAL,
                retention_period_days=90,  # 3 months for debugging
                retention_action=RetentionAction.DELETE,
                legal_hold_exceptions=["critical_errors", "security_errors"],
                auto_execution_enabled=True,
                notification_before_action=False,
                notification_days_before=0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                created_by="operations@controlcore.io",
                is_active=True
            ),
            
            # Backup Data Policy
            RetentionPolicy(
                policy_id="policy_backup_data",
                name="Backup Data Retention Policy",
                description="Retention policy for system backup data",
                data_type=DataType.BACKUP_DATA,
                data_classification=DataClassification.RESTRICTED,
                retention_period_days=2555,  # 7 years for disaster recovery
                retention_action=RetentionAction.MOVE_TO_COLD_STORAGE,
                legal_hold_exceptions=["critical_systems", "compliance_data"],
                auto_execution_enabled=True,
                notification_before_action=True,
                notification_days_before=30,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                created_by="operations@controlcore.io",
                is_active=True
            ),
            
            # Temporary Data Policy
            RetentionPolicy(
                policy_id="policy_temporary_data",
                name="Temporary Data Retention Policy",
                description="Retention policy for temporary and cache data",
                data_type=DataType.TEMPORARY_DATA,
                data_classification=DataClassification.INTERNAL,
                retention_period_days=7,  # 1 week for temporary files
                retention_action=RetentionAction.DELETE,
                legal_hold_exceptions=[],
                auto_execution_enabled=True,
                notification_before_action=False,
                notification_days_before=0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                created_by="operations@controlcore.io",
                is_active=True
            )
        ]
        
        for policy in policies:
            self.retention_policies[policy.policy_id] = policy

    def _initialize_sample_data(self):
        """Initialize with sample data assets and inventory"""
        
        # Sample data assets
        sample_assets = [
            DataAsset(
                asset_id="asset_user_data_001",
                name="User Profiles Database",
                data_type=DataType.USER_DATA,
                data_classification=DataClassification.CONFIDENTIAL,
                location="cc-pap-api-db/users",
                size_bytes=1073741824,  # 1GB
                record_count=50000,
                created_at=datetime.utcnow() - timedelta(days=1000),
                last_accessed=datetime.utcnow() - timedelta(days=1),
                retention_policy_id="policy_user_data",
                retention_status=RetentionStatus.ACTIVE,
                scheduled_action_date=datetime.utcnow() + timedelta(days=1555),
                tags=["active", "user_data"],
                metadata={"database": "postgresql", "table": "users"}
            ),
            DataAsset(
                asset_id="asset_audit_logs_001",
                name="Audit Logs Archive",
                data_type=DataType.AUDIT_LOGS,
                data_classification=DataClassification.RESTRICTED,
                location="cc-bouncer-logs/audit",
                size_bytes=536870912,  # 512MB
                record_count=1000000,
                created_at=datetime.utcnow() - timedelta(days=1800),
                last_accessed=datetime.utcnow() - timedelta(days=30),
                retention_policy_id="policy_audit_logs",
                retention_status=RetentionStatus.SCHEDULED_FOR_DELETION,
                scheduled_action_date=datetime.utcnow() + timedelta(days=30),
                tags=["archive", "compliance"],
                metadata={"format": "json", "compression": "gzip"}
            ),
            DataAsset(
                asset_id="asset_telemetry_001",
                name="Telemetry Data Store",
                data_type=DataType.TELEMETRY_DATA,
                data_classification=DataClassification.INTERNAL,
                location="cc-business-admin/telemetry",
                size_bytes=268435456,  # 256MB
                record_count=500000,
                created_at=datetime.utcnow() - timedelta(days=300),
                last_accessed=datetime.utcnow() - timedelta(days=1),
                retention_policy_id="policy_telemetry_data",
                retention_status=RetentionStatus.ACTIVE,
                scheduled_action_date=datetime.utcnow() + timedelta(days=65),
                tags=["operational", "metrics"],
                metadata={"storage": "timeseries", "retention": "rolling"}
            )
        ]
        
        for asset in sample_assets:
            self.data_assets[asset.asset_id] = asset
        
        # Sample data inventory
        sample_inventory = [
            DataInventory(
                inventory_id="inventory_001",
                name="Production Database Inventory",
                description="Complete inventory of production database assets",
                data_type=DataType.USER_DATA,
                location="Production PostgreSQL Cluster",
                classification=DataClassification.CONFIDENTIAL,
                record_count=150000,
                size_bytes=2147483648,  # 2GB
                created_at=datetime.utcnow() - timedelta(days=365),
                last_modified=datetime.utcnow() - timedelta(days=1),
                retention_policy_applied=True,
                compliance_status="compliant"
            ),
            DataInventory(
                inventory_id="inventory_002",
                name="Log Storage Inventory",
                description="Inventory of all log storage systems",
                data_type=DataType.AUDIT_LOGS,
                location="Centralized Log Storage",
                classification=DataClassification.RESTRICTED,
                record_count=5000000,
                size_bytes=10737418240,  # 10GB
                created_at=datetime.utcnow() - timedelta(days=180),
                last_modified=datetime.utcnow() - timedelta(days=1),
                retention_policy_applied=True,
                compliance_status="compliant"
            )
        ]
        
        for inventory in sample_inventory:
            self.data_inventory[inventory.inventory_id] = inventory

    def create_retention_policy(
        self,
        name: str,
        description: str,
        data_type: DataType,
        data_classification: DataClassification,
        retention_period_days: int,
        retention_action: RetentionAction,
        legal_hold_exceptions: List[str],
        auto_execution_enabled: bool = True,
        notification_before_action: bool = True,
        notification_days_before: int = 30,
        created_by: str = "admin@controlcore.io"
    ) -> RetentionPolicy:
        """Create a new data retention policy"""
        
        policy_id = f"policy_{data_type.value}_{len(self.retention_policies) + 1}"
        current_time = datetime.utcnow()
        
        policy = RetentionPolicy(
            policy_id=policy_id,
            name=name,
            description=description,
            data_type=data_type,
            data_classification=data_classification,
            retention_period_days=retention_period_days,
            retention_action=retention_action,
            legal_hold_exceptions=legal_hold_exceptions,
            auto_execution_enabled=auto_execution_enabled,
            notification_before_action=notification_before_action,
            notification_days_before=notification_days_before,
            created_at=current_time,
            updated_at=current_time,
            created_by=created_by,
            is_active=True
        )
        
        self.retention_policies[policy_id] = policy
        
        # Apply policy to existing data assets
        self._apply_policy_to_existing_assets(policy)
        
        logger.info(f"Retention policy created: {policy_id} - {name}")
        return policy

    def _apply_policy_to_existing_assets(self, policy: RetentionPolicy):
        """Apply new retention policy to existing data assets"""
        
        for asset in self.data_assets.values():
            if asset.data_type == policy.data_type and not asset.retention_policy_id:
                asset.retention_policy_id = policy.policy_id
                asset.retention_status = RetentionStatus.ACTIVE
                
                # Calculate scheduled action date
                if asset.created_at:
                    asset.scheduled_action_date = asset.created_at + timedelta(days=policy.retention_period_days)
                
                logger.info(f"Applied policy {policy.policy_id} to asset {asset.asset_id}")

    def register_data_asset(
        self,
        name: str,
        data_type: DataType,
        data_classification: DataClassification,
        location: str,
        size_bytes: int,
        record_count: int,
        tags: List[str] = None,
        metadata: Dict[str, Any] = None
    ) -> DataAsset:
        """Register a new data asset for retention management"""
        
        asset_id = f"asset_{data_type.value}_{len(self.data_assets) + 1:03d}"
        current_time = datetime.utcnow()
        
        # Find applicable retention policy
        applicable_policy = None
        for policy in self.retention_policies.values():
            if (policy.data_type == data_type and 
                policy.is_active and 
                policy.data_classification == data_classification):
                applicable_policy = policy
                break
        
        # Calculate scheduled action date
        scheduled_action_date = None
        if applicable_policy:
            scheduled_action_date = current_time + timedelta(days=applicable_policy.retention_period_days)
        
        asset = DataAsset(
            asset_id=asset_id,
            name=name,
            data_type=data_type,
            data_classification=data_classification,
            location=location,
            size_bytes=size_bytes,
            record_count=record_count,
            created_at=current_time,
            last_accessed=current_time,
            retention_policy_id=applicable_policy.policy_id if applicable_policy else None,
            retention_status=RetentionStatus.ACTIVE,
            scheduled_action_date=scheduled_action_date,
            tags=tags or [],
            metadata=metadata or {}
        )
        
        self.data_assets[asset_id] = asset
        
        logger.info(f"Data asset registered: {asset_id} - {name}")
        return asset

    def execute_retention_actions(self) -> Dict[str, Any]:
        """Execute scheduled retention actions"""
        
        if not self.auto_execution_enabled:
            logger.info("Auto execution is disabled, skipping retention actions")
            return {"status": "disabled", "actions_executed": 0}
        
        current_time = datetime.utcnow()
        executed_actions = 0
        failed_actions = 0
        action_results = []
        
        # Find assets that need retention actions
        for asset in self.data_assets.values():
            if (asset.scheduled_action_date and 
                asset.scheduled_action_date <= current_time and
                asset.retention_status in [RetentionStatus.ACTIVE, RetentionStatus.SCHEDULED_FOR_DELETION]):
                
                # Check for legal hold exceptions
                if self._is_asset_on_legal_hold(asset):
                    logger.info(f"Asset {asset.asset_id} is on legal hold, skipping retention action")
                    continue
                
                # Execute retention action
                action_result = self._execute_asset_retention_action(asset)
                action_results.append(action_result)
                
                if action_result["success"]:
                    executed_actions += 1
                else:
                    failed_actions += 1
        
        logger.info(f"Retention actions executed: {executed_actions} successful, {failed_actions} failed")
        
        return {
            "status": "completed",
            "actions_executed": executed_actions,
            "actions_failed": failed_actions,
            "action_results": action_results
        }

    def _is_asset_on_legal_hold(self, asset: DataAsset) -> bool:
        """Check if asset is subject to legal hold"""
        
        if not self.legal_hold_enabled:
            return False
        
        policy = self.retention_policies.get(asset.retention_policy_id)
        if not policy:
            return False
        
        # Check if any legal hold exceptions apply
        for exception in policy.legal_hold_exceptions:
            if exception in asset.tags:
                return True
        
        return False

    def _execute_asset_retention_action(self, asset: DataAsset) -> Dict[str, Any]:
        """Execute retention action for a specific asset"""
        
        policy = self.retention_policies.get(asset.retention_policy_id)
        if not policy:
            return {"success": False, "error": "Policy not found"}
        
        action_id = str(uuid.uuid4())
        current_time = datetime.utcnow()
        
        # Create action record
        action_record = RetentionActionRecord(
            action_id=action_id,
            asset_id=asset.asset_id,
            policy_id=policy.policy_id,
            action_type=policy.retention_action,
            scheduled_date=asset.scheduled_action_date,
            executed_date=current_time,
            status="executing",
            error_message=None,
            executed_by="system",
            backup_location=None
        )
        
        self.retention_actions[action_id] = action_record
        
        try:
            # Execute the retention action
            if policy.retention_action == RetentionAction.DELETE:
                self._delete_asset(asset)
                asset.retention_status = RetentionStatus.DELETED
            elif policy.retention_action == RetentionAction.ARCHIVE:
                backup_location = self._archive_asset(asset)
                asset.retention_status = RetentionStatus.ARCHIVED
                action_record.backup_location = backup_location
            elif policy.retention_action == RetentionAction.ANONYMIZE:
                self._anonymize_asset(asset)
                asset.retention_status = RetentionStatus.ANONYMIZED
            elif policy.retention_action == RetentionAction.MOVE_TO_COLD_STORAGE:
                cold_storage_location = self._move_to_cold_storage(asset)
                asset.retention_status = RetentionStatus.ARCHIVED
                action_record.backup_location = cold_storage_location
            
            action_record.status = "completed"
            
            logger.info(f"Retention action completed for asset {asset.asset_id}: {policy.retention_action.value}")
            
            return {
                "success": True,
                "action_id": action_id,
                "asset_id": asset.asset_id,
                "action_type": policy.retention_action.value,
                "status": "completed"
            }
            
        except Exception as e:
            action_record.status = "failed"
            action_record.error_message = str(e)
            
            logger.error(f"Retention action failed for asset {asset.asset_id}: {e}")
            
            return {
                "success": False,
                "action_id": action_id,
                "asset_id": asset.asset_id,
                "error": str(e),
                "status": "failed"
            }

    def _delete_asset(self, asset: DataAsset):
        """Delete a data asset"""
        # In a real implementation, this would actually delete the data
        logger.info(f"Deleting asset {asset.asset_id} at location {asset.location}")

    def _archive_asset(self, asset: DataAsset) -> str:
        """Archive a data asset"""
        # In a real implementation, this would archive the data
        backup_location = f"archive/{asset.asset_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        logger.info(f"Archiving asset {asset.asset_id} to {backup_location}")
        return backup_location

    def _anonymize_asset(self, asset: DataAsset):
        """Anonymize a data asset"""
        # In a real implementation, this would anonymize the data
        logger.info(f"Anonymizing asset {asset.asset_id}")

    def _move_to_cold_storage(self, asset: DataAsset) -> str:
        """Move asset to cold storage"""
        # In a real implementation, this would move to cold storage
        cold_storage_location = f"cold-storage/{asset.asset_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        logger.info(f"Moving asset {asset.asset_id} to cold storage at {cold_storage_location}")
        return cold_storage_location

    def get_retention_policies(self) -> List[RetentionPolicy]:
        """Get all retention policies"""
        return list(self.retention_policies.values())

    def get_data_assets(
        self,
        data_type: Optional[DataType] = None,
        status: Optional[RetentionStatus] = None,
        classification: Optional[DataClassification] = None
    ) -> List[DataAsset]:
        """Get data assets with optional filtering"""
        
        assets = list(self.data_assets.values())
        
        if data_type:
            assets = [a for a in assets if a.data_type == data_type]
        if status:
            assets = [a for a in assets if a.retention_status == status]
        if classification:
            assets = [a for a in assets if a.data_classification == classification]
        
        return sorted(assets, key=lambda x: x.created_at, reverse=True)

    def get_retention_statistics(self) -> Dict[str, Any]:
        """Get data retention statistics"""
        
        total_assets = len(self.data_assets)
        total_policies = len(self.retention_policies)
        
        stats = {
            "total_assets": total_assets,
            "total_policies": total_policies,
            "assets_by_status": {},
            "assets_by_type": {},
            "assets_by_classification": {},
            "upcoming_actions": 0,
            "overdue_actions": 0,
            "total_data_size_bytes": 0,
            "total_record_count": 0
        }
        
        current_time = datetime.utcnow()
        
        for asset in self.data_assets.values():
            # Count by status
            status = asset.retention_status.value
            stats["assets_by_status"][status] = stats["assets_by_status"].get(status, 0) + 1
            
            # Count by type
            data_type = asset.data_type.value
            stats["assets_by_type"][data_type] = stats["assets_by_type"].get(data_type, 0) + 1
            
            # Count by classification
            classification = asset.data_classification.value
            stats["assets_by_classification"][classification] = stats["assets_by_classification"].get(classification, 0) + 1
            
            # Calculate totals
            stats["total_data_size_bytes"] += asset.size_bytes
            stats["total_record_count"] += asset.record_count
            
            # Count upcoming and overdue actions
            if asset.scheduled_action_date:
                days_until_action = (asset.scheduled_action_date - current_time).days
                if days_until_action <= 30:
                    stats["upcoming_actions"] += 1
                if days_until_action < 0:
                    stats["overdue_actions"] += 1
        
        # Convert bytes to human readable format
        stats["total_data_size_gb"] = round(stats["total_data_size_bytes"] / (1024**3), 2)
        
        return stats

    def get_upcoming_retention_actions(self, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """Get assets with upcoming retention actions"""
        
        current_time = datetime.utcnow()
        cutoff_date = current_time + timedelta(days=days_ahead)
        
        upcoming_actions = []
        
        for asset in self.data_assets.values():
            if (asset.scheduled_action_date and 
                asset.scheduled_action_date <= cutoff_date and
                asset.retention_status in [RetentionStatus.ACTIVE, RetentionStatus.SCHEDULED_FOR_DELETION]):
                
                policy = self.retention_policies.get(asset.retention_policy_id)
                
                upcoming_actions.append({
                    "asset_id": asset.asset_id,
                    "asset_name": asset.name,
                    "data_type": asset.data_type.value,
                    "classification": asset.data_classification.value,
                    "scheduled_date": asset.scheduled_action_date,
                    "days_until_action": (asset.scheduled_action_date - current_time).days,
                    "action_type": policy.retention_action.value if policy else "unknown",
                    "policy_name": policy.name if policy else "No Policy",
                    "size_bytes": asset.size_bytes,
                    "record_count": asset.record_count
                })
        
        return sorted(upcoming_actions, key=lambda x: x["scheduled_date"])

    def place_legal_hold(
        self,
        asset_id: str,
        legal_hold_reason: str,
        placed_by: str,
        expiration_date: Optional[datetime] = None
    ) -> bool:
        """Place a legal hold on a data asset"""
        
        if asset_id not in self.data_assets:
            logger.error(f"Asset not found: {asset_id}")
            return False
        
        asset = self.data_assets[asset_id]
        
        # Add legal hold tag
        if "legal_hold" not in asset.tags:
            asset.tags.append("legal_hold")
        
        # Update metadata
        asset.metadata["legal_hold"] = {
            "reason": legal_hold_reason,
            "placed_by": placed_by,
            "placed_at": datetime.utcnow(),
            "expiration_date": expiration_date
        }
        
        logger.info(f"Legal hold placed on asset {asset_id}: {legal_hold_reason}")
        return True

    def remove_legal_hold(self, asset_id: str, removed_by: str) -> bool:
        """Remove legal hold from a data asset"""
        
        if asset_id not in self.data_assets:
            logger.error(f"Asset not found: {asset_id}")
            return False
        
        asset = self.data_assets[asset_id]
        
        # Remove legal hold tag
        if "legal_hold" in asset.tags:
            asset.tags.remove("legal_hold")
        
        # Update metadata
        if "legal_hold" in asset.metadata:
            asset.metadata["legal_hold"]["removed_by"] = removed_by
            asset.metadata["legal_hold"]["removed_at"] = datetime.utcnow()
        
        logger.info(f"Legal hold removed from asset {asset_id} by {removed_by}")
        return True

# Global data retention service instance
data_retention_service = None

def get_data_retention_service(db: Session) -> DataRetentionService:
    """Get data retention service instance"""
    global data_retention_service
    if data_retention_service is None:
        data_retention_service = DataRetentionService(db)
    return data_retention_service
