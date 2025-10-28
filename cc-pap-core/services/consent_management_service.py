"""
User Consent Management Service for Control Core
Implements SOC2-compliant user consent tracking and management
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

logger = logging.getLogger(__name__)

class ConsentType(str, Enum):
    DATA_PROCESSING = "data_processing"
    DATA_STORAGE = "data_storage"
    DATA_SHARING = "data_sharing"
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    PROFILING = "profiling"
    LOCATION_TRACKING = "location_tracking"
    COOKIES = "cookies"
    THIRD_PARTY = "third_party"

class ConsentStatus(str, Enum):
    GRANTED = "granted"
    DENIED = "denied"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"
    PENDING = "pending"

class ConsentPurpose(str, Enum):
    SERVICE_PROVISION = "service_provision"
    LEGAL_COMPLIANCE = "legal_compliance"
    LEGITIMATE_INTEREST = "legitimate_interest"
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    SECURITY = "security"

@dataclass
class ConsentRecord:
    consent_id: str
    user_id: str
    consent_type: ConsentType
    consent_status: ConsentStatus
    purpose: ConsentPurpose
    granted_at: Optional[datetime]
    withdrawn_at: Optional[datetime]
    expires_at: Optional[datetime]
    ip_address: str
    user_agent: str
    consent_method: str  # web_form, api, email, etc.
    version: str
    language: str
    legal_basis: str
    data_categories: List[str]
    processing_activities: List[str]
    retention_period: Optional[int]  # days
    created_at: datetime
    updated_at: datetime

@dataclass
class ConsentRequest:
    user_id: str
    consent_type: ConsentType
    purpose: ConsentPurpose
    data_categories: List[str]
    processing_activities: List[str]
    retention_period: Optional[int]
    legal_basis: str
    ip_address: str
    user_agent: str
    language: str = "en"

class ConsentManagementService:
    """
    SOC2-compliant consent management service
    Implements GDPR/CCPA compliant consent tracking and management
    """
    
    def __init__(self):
        self.consent_records: Dict[str, ConsentRecord] = {}
        self.consent_requests: Dict[str, ConsentRequest] = {}
        
        # Consent configuration
        self.default_retention_period = int(os.getenv('DEFAULT_CONSENT_RETENTION_DAYS', '365'))
        self.consent_expiry_days = int(os.getenv('CONSENT_EXIRY_DAYS', '365'))
        self.audit_logging_enabled = os.getenv('CONSENT_AUDIT_LOGGING', 'true').lower() == 'true'
        
        logger.info("ConsentManagementService initialized with SOC2 compliance")

    def request_consent(self, consent_request: ConsentRequest) -> ConsentRecord:
        """Request user consent for data processing"""
        
        consent_id = str(uuid.uuid4())
        current_time = datetime.utcnow()
        
        # Create consent record
        consent_record = ConsentRecord(
            consent_id=consent_id,
            user_id=consent_request.user_id,
            consent_type=consent_request.consent_type,
            consent_status=ConsentStatus.PENDING,
            purpose=consent_request.purpose,
            granted_at=None,
            withdrawn_at=None,
            expires_at=current_time + timedelta(days=self.consent_expiry_days),
            ip_address=consent_request.ip_address,
            user_agent=consent_request.user_agent,
            consent_method="api_request",
            version="1.0",
            language=consent_request.language,
            legal_basis=consent_request.legal_basis,
            data_categories=consent_request.data_categories,
            processing_activities=consent_request.processing_activities,
            retention_period=consent_request.retention_period or self.default_retention_period,
            created_at=current_time,
            updated_at=current_time
        )
        
        # Store consent record
        self.consent_records[consent_id] = consent_record
        self.consent_requests[consent_id] = consent_request
        
        # Log consent request
        if self.audit_logging_enabled:
            self._log_consent_operation("request", consent_id, consent_request.user_id, consent_request.consent_type.value)
        
        logger.info(f"Consent requested: {consent_id} for user {consent_request.user_id}")
        return consent_record

    def grant_consent(
        self,
        consent_id: str,
        user_id: str,
        ip_address: str,
        user_agent: str,
        consent_method: str = "web_form"
    ) -> bool:
        """Grant user consent"""
        
        if consent_id not in self.consent_records:
            logger.error(f"Consent record not found: {consent_id}")
            return False
        
        consent_record = self.consent_records[consent_id]
        
        # Verify user ID matches
        if consent_record.user_id != user_id:
            logger.error(f"User ID mismatch for consent: {consent_id}")
            return False
        
        # Check if consent has expired
        if consent_record.expires_at and datetime.utcnow() > consent_record.expires_at:
            consent_record.consent_status = ConsentStatus.EXPIRED
            logger.warning(f"Consent has expired: {consent_id}")
            return False
        
        # Update consent record
        consent_record.consent_status = ConsentStatus.GRANTED
        consent_record.granted_at = datetime.utcnow()
        consent_record.consent_method = consent_method
        consent_record.updated_at = datetime.utcnow()
        
        # Update IP and user agent
        consent_record.ip_address = ip_address
        consent_record.user_agent = user_agent
        
        # Log consent grant
        if self.audit_logging_enabled:
            self._log_consent_operation("grant", consent_id, user_id, consent_record.consent_type.value)
        
        logger.info(f"Consent granted: {consent_id} for user {user_id}")
        return True

    def deny_consent(
        self,
        consent_id: str,
        user_id: str,
        ip_address: str,
        user_agent: str,
        consent_method: str = "web_form"
    ) -> bool:
        """Deny user consent"""
        
        if consent_id not in self.consent_records:
            logger.error(f"Consent record not found: {consent_id}")
            return False
        
        consent_record = self.consent_records[consent_id]
        
        # Verify user ID matches
        if consent_record.user_id != user_id:
            logger.error(f"User ID mismatch for consent: {consent_id}")
            return False
        
        # Update consent record
        consent_record.consent_status = ConsentStatus.DENIED
        consent_record.consent_method = consent_method
        consent_record.updated_at = datetime.utcnow()
        
        # Update IP and user agent
        consent_record.ip_address = ip_address
        consent_record.user_agent = user_agent
        
        # Log consent denial
        if self.audit_logging_enabled:
            self._log_consent_operation("deny", consent_id, user_id, consent_record.consent_type.value)
        
        logger.info(f"Consent denied: {consent_id} for user {user_id}")
        return True

    def withdraw_consent(
        self,
        consent_id: str,
        user_id: str,
        ip_address: str,
        user_agent: str,
        consent_method: str = "web_form"
    ) -> bool:
        """Withdraw user consent"""
        
        if consent_id not in self.consent_records:
            logger.error(f"Consent record not found: {consent_id}")
            return False
        
        consent_record = self.consent_records[consent_id]
        
        # Verify user ID matches
        if consent_record.user_id != user_id:
            logger.error(f"User ID mismatch for consent: {consent_id}")
            return False
        
        # Update consent record
        consent_record.consent_status = ConsentStatus.WITHDRAWN
        consent_record.withdrawn_at = datetime.utcnow()
        consent_record.consent_method = consent_method
        consent_record.updated_at = datetime.utcnow()
        
        # Update IP and user agent
        consent_record.ip_address = ip_address
        consent_record.user_agent = user_agent
        
        # Log consent withdrawal
        if self.audit_logging_enabled:
            self._log_consent_operation("withdraw", consent_id, user_id, consent_record.consent_type.value)
        
        logger.info(f"Consent withdrawn: {consent_id} for user {user_id}")
        return True

    def get_user_consents(self, user_id: str) -> List[ConsentRecord]:
        """Get all consent records for a user"""
        
        user_consents = []
        for consent_record in self.consent_records.values():
            if consent_record.user_id == user_id:
                user_consents.append(consent_record)
        
        return sorted(user_consents, key=lambda x: x.created_at, reverse=True)

    def get_active_consents(self, user_id: str) -> List[ConsentRecord]:
        """Get all active (granted) consent records for a user"""
        
        active_consents = []
        current_time = datetime.utcnow()
        
        for consent_record in self.consent_records.values():
            if (consent_record.user_id == user_id and 
                consent_record.consent_status == ConsentStatus.GRANTED and
                (not consent_record.expires_at or consent_record.expires_at > current_time)):
                active_consents.append(consent_record)
        
        return active_consents

    def check_consent(
        self,
        user_id: str,
        consent_type: ConsentType,
        purpose: ConsentPurpose
    ) -> bool:
        """Check if user has granted consent for specific purpose"""
        
        current_time = datetime.utcnow()
        
        for consent_record in self.consent_records.values():
            if (consent_record.user_id == user_id and
                consent_record.consent_type == consent_type and
                consent_record.purpose == purpose and
                consent_record.consent_status == ConsentStatus.GRANTED and
                (not consent_record.expires_at or consent_record.expires_at > current_time)):
                return True
        
        return False

    def get_consent_summary(self, user_id: str) -> Dict[str, Any]:
        """Get consent summary for a user"""
        
        user_consents = self.get_user_consents(user_id)
        active_consents = self.get_active_consents(user_id)
        
        summary = {
            "user_id": user_id,
            "total_consents": len(user_consents),
            "active_consents": len(active_consents),
            "consent_types": {},
            "purposes": {},
            "status_breakdown": {
                "granted": 0,
                "denied": 0,
                "withdrawn": 0,
                "expired": 0,
                "pending": 0
            },
            "recent_activity": []
        }
        
        # Count by type and purpose
        for consent in user_consents:
            # Count by type
            consent_type = consent.consent_type.value
            summary["consent_types"][consent_type] = summary["consent_types"].get(consent_type, 0) + 1
            
            # Count by purpose
            purpose = consent.purpose.value
            summary["purposes"][purpose] = summary["purposes"].get(purpose, 0) + 1
            
            # Count by status
            status = consent.consent_status.value
            summary["status_breakdown"][status] = summary["status_breakdown"].get(status, 0) + 1
        
        # Get recent activity (last 10)
        recent_consents = sorted(user_consents, key=lambda x: x.updated_at, reverse=True)[:10]
        for consent in recent_consents:
            summary["recent_activity"].append({
                "consent_id": consent.consent_id,
                "consent_type": consent.consent_type.value,
                "purpose": consent.purpose.value,
                "status": consent.consent_status.value,
                "updated_at": consent.updated_at.isoformat()
            })
        
        return summary

    def expire_consents(self) -> int:
        """Expire consents that have passed their expiry date"""
        
        current_time = datetime.utcnow()
        expired_count = 0
        
        for consent_record in self.consent_records.values():
            if (consent_record.expires_at and 
                consent_record.expires_at <= current_time and
                consent_record.consent_status == ConsentStatus.GRANTED):
                
                consent_record.consent_status = ConsentStatus.EXPIRED
                consent_record.updated_at = current_time
                expired_count += 1
                
                # Log consent expiry
                if self.audit_logging_enabled:
                    self._log_consent_operation("expire", consent_record.consent_id, consent_record.user_id, consent_record.consent_type.value)
        
        if expired_count > 0:
            logger.info(f"Expired {expired_count} consent records")
        
        return expired_count

    def cleanup_expired_consents(self, days_after_expiry: int = 30) -> int:
        """Remove consent records that expired more than N days ago"""
        
        cutoff_time = datetime.utcnow() - timedelta(days=days_after_expiry)
        removed_count = 0
        
        consent_ids_to_remove = []
        
        for consent_id, consent_record in self.consent_records.items():
            if (consent_record.expires_at and 
                consent_record.expires_at <= cutoff_time and
                consent_record.consent_status == ConsentStatus.EXPIRED):
                
                consent_ids_to_remove.append(consent_id)
        
        # Remove expired consents
        for consent_id in consent_ids_to_remove:
            del self.consent_records[consent_id]
            if consent_id in self.consent_requests:
                del self.consent_requests[consent_id]
            removed_count += 1
        
        if removed_count > 0:
            logger.info(f"Cleaned up {removed_count} expired consent records")
        
        return removed_count

    def _log_consent_operation(self, operation: str, consent_id: str, user_id: str, consent_type: str):
        """Log consent operations for SOC2 audit trail"""
        
        audit_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": operation,
            "consent_id": consent_id,
            "user_id": user_id,
            "consent_type": consent_type,
            "service": "consent_management_service"
        }
        
        logger.info(f"CONSENT_AUDIT: {json.dumps(audit_log)}")

    def export_user_consents(self, user_id: str) -> Dict[str, Any]:
        """Export all consent data for a user (GDPR Article 20)"""
        
        user_consents = self.get_user_consents(user_id)
        
        export_data = {
            "user_id": user_id,
            "export_date": datetime.utcnow().isoformat(),
            "consent_records": []
        }
        
        for consent in user_consents:
            export_data["consent_records"].append(asdict(consent))
        
        return export_data

    def get_consent_statistics(self) -> Dict[str, Any]:
        """Get consent management statistics"""
        
        total_consents = len(self.consent_records)
        
        stats = {
            "total_consents": total_consents,
            "status_breakdown": {
                "granted": 0,
                "denied": 0,
                "withdrawn": 0,
                "expired": 0,
                "pending": 0
            },
            "type_breakdown": {},
            "purpose_breakdown": {},
            "recent_activity": {
                "last_24_hours": 0,
                "last_7_days": 0,
                "last_30_days": 0
            }
        }
        
        current_time = datetime.utcnow()
        last_24h = current_time - timedelta(hours=24)
        last_7d = current_time - timedelta(days=7)
        last_30d = current_time - timedelta(days=30)
        
        for consent in self.consent_records.values():
            # Status breakdown
            status = consent.consent_status.value
            stats["status_breakdown"][status] = stats["status_breakdown"].get(status, 0) + 1
            
            # Type breakdown
            consent_type = consent.consent_type.value
            stats["type_breakdown"][consent_type] = stats["type_breakdown"].get(consent_type, 0) + 1
            
            # Purpose breakdown
            purpose = consent.purpose.value
            stats["purpose_breakdown"][purpose] = stats["purpose_breakdown"].get(purpose, 0) + 1
            
            # Recent activity
            if consent.created_at >= last_24h:
                stats["recent_activity"]["last_24_hours"] += 1
            if consent.created_at >= last_7d:
                stats["recent_activity"]["last_7_days"] += 1
            if consent.created_at >= last_30d:
                stats["recent_activity"]["last_30_days"] += 1
        
        return stats

# Global consent management service instance
consent_management_service = ConsentManagementService()
