"""
Data Minimization Service for Control Core
Implements SOC2-compliant data minimization and privacy controls
"""

import os
import json
import logging
import re
import hashlib
from typing import Dict, Any, Optional, List, Set, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

logger = logging.getLogger(__name__)

class DataType(str, Enum):
    PII = "pii"
    FINANCIAL = "financial"
    HEALTH = "health"
    CONTACT = "contact"
    IDENTIFIER = "identifier"
    LOCATION = "location"
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"

class DataSensitivity(str, Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

class MinimizationAction(str, Enum):
    COLLECT = "collect"
    MASK = "mask"
    ANONYMIZE = "anonymize"
    PSEUDONYMIZE = "pseudonymize"
    DELETE = "delete"
    REDACT = "redact"

@dataclass
class DataField:
    field_name: str
    data_type: DataType
    sensitivity: DataSensitivity
    is_required: bool
    retention_days: Optional[int]
    minimization_action: MinimizationAction
    collection_purpose: str
    legal_basis: str

@dataclass
class MinimizationRule:
    rule_id: str
    name: str
    description: str
    data_types: List[DataType]
    patterns: List[str]
    action: MinimizationAction
    conditions: Dict[str, Any]
    priority: int
    is_active: bool
    created_at: datetime

@dataclass
class MinimizationResult:
    original_data: Dict[str, Any]
    minimized_data: Dict[str, Any]
    fields_processed: List[str]
    actions_taken: List[MinimizationAction]
    anonymization_mapping: Dict[str, str]
    compliance_score: float
    processed_at: datetime

class DataMinimizationService:
    """
    SOC2-compliant data minimization service
    Implements GDPR/CCPA compliant data minimization and privacy controls
    """
    
    def __init__(self):
        # PII detection patterns
        self.pii_patterns = {
            DataType.PII: [
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
                r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
                r'\b\d{3}\.\d{2}\.\d{4}\b',  # SSN with dots
                r'\b\d{9}\b',  # 9-digit number (potential SSN)
            ],
            DataType.FINANCIAL: [
                r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',  # Credit card
                r'\b\d{13,19}\b',  # Credit card number
                r'\b\d{3}-\d{7}-\d{1}\b',  # Bank routing number
            ],
            DataType.CONTACT: [
                r'\b\d{3}-\d{3}-\d{4}\b',  # Phone number
                r'\b\(\d{3}\)\s?\d{3}-\d{4}\b',  # Phone with parentheses
                r'\b\d{3}\.\d{3}\.\d{4}\b',  # Phone with dots
            ],
            DataType.IDENTIFIER: [
                r'\b[A-Za-z]{2}\d{6}\b',  # Driver's license
                r'\b\d{10}\b',  # 10-digit identifier
                r'\b[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}\b',  # UUID
            ],
            DataType.LOCATION: [
                r'\b\d{1,5}\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b',  # Street address
                r'\b\d{5}(?:-\d{4})?\b',  # ZIP code
                r'\b[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b',  # City, State ZIP
            ]
        }
        
        # Data field definitions
        self.data_fields: Dict[str, DataField] = {}
        
        # Minimization rules
        self.minimization_rules: List[MinimizationRule] = []
        
        # Anonymization mapping (for pseudonymization)
        self.anonymization_mapping: Dict[str, str] = {}
        
        # Configuration
        self.default_retention_days = int(os.getenv('DEFAULT_DATA_RETENTION_DAYS', '365'))
        self.minimization_enabled = os.getenv('DATA_MINIMIZATION_ENABLED', 'true').lower() == 'true'
        self.audit_logging_enabled = os.getenv('DATA_MINIMIZATION_AUDIT_LOGGING', 'true').lower() == 'true'
        
        # Initialize default rules
        self._initialize_default_rules()
        self._initialize_default_fields()
        
        logger.info("DataMinimizationService initialized with SOC2 compliance")

    def _initialize_default_rules(self):
        """Initialize default data minimization rules"""
        
        default_rules = [
            MinimizationRule(
                rule_id="rule_001",
                name="Email Address Minimization",
                description="Anonymize email addresses in logs and telemetry",
                data_types=[DataType.PII],
                patterns=[r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'],
                action=MinimizationAction.ANONYMIZE,
                conditions={"context": ["log", "telemetry", "audit"]},
                priority=1,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            MinimizationRule(
                rule_id="rule_002",
                name="Phone Number Masking",
                description="Mask phone numbers in non-essential contexts",
                data_types=[DataType.CONTACT],
                patterns=[r'\b\d{3}-\d{3}-\d{4}\b', r'\b\(\d{3}\)\s?\d{3}-\d{4}\b'],
                action=MinimizationAction.MASK,
                conditions={"context": ["log", "telemetry"], "sensitivity": ["internal", "public"]},
                priority=2,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            MinimizationRule(
                rule_id="rule_003",
                name="Financial Data Protection",
                description="Redact financial information completely",
                data_types=[DataType.FINANCIAL],
                patterns=[r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b'],
                action=MinimizationAction.REDACT,
                conditions={"context": ["log", "telemetry", "audit"]},
                priority=1,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            MinimizationRule(
                rule_id="rule_004",
                name="IP Address Anonymization",
                description="Anonymize IP addresses for privacy",
                data_types=[DataType.TECHNICAL],
                patterns=[r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'],
                action=MinimizationAction.ANONYMIZE,
                conditions={"context": ["log", "telemetry"]},
                priority=3,
                is_active=True,
                created_at=datetime.utcnow()
            )
        ]
        
        self.minimization_rules.extend(default_rules)

    def _initialize_default_fields(self):
        """Initialize default data field definitions"""
        
        default_fields = [
            DataField(
                field_name="email",
                data_type=DataType.PII,
                sensitivity=DataSensitivity.CONFIDENTIAL,
                is_required=True,
                retention_days=365,
                minimization_action=MinimizationAction.ANONYMIZE,
                collection_purpose="user_authentication",
                legal_basis="consent"
            ),
            DataField(
                field_name="phone",
                data_type=DataType.CONTACT,
                sensitivity=DataSensitivity.CONFIDENTIAL,
                is_required=False,
                retention_days=365,
                minimization_action=MinimizationAction.MASK,
                collection_purpose="user_contact",
                legal_basis="consent"
            ),
            DataField(
                field_name="ip_address",
                data_type=DataType.TECHNICAL,
                sensitivity=DataSensitivity.INTERNAL,
                is_required=True,
                retention_days=90,
                minimization_action=MinimizationAction.ANONYMIZE,
                collection_purpose="security_monitoring",
                legal_basis="legitimate_interest"
            ),
            DataField(
                field_name="user_agent",
                data_type=DataType.TECHNICAL,
                sensitivity=DataSensitivity.INTERNAL,
                is_required=False,
                retention_days=90,
                minimization_action=MinimizationAction.MASK,
                collection_purpose="security_monitoring",
                legal_basis="legitimate_interest"
            ),
            DataField(
                field_name="policy_content",
                data_type=DataType.TECHNICAL,
                sensitivity=DataSensitivity.RESTRICTED,
                is_required=True,
                retention_days=2555,  # 7 years
                minimization_action=MinimizationAction.COLLECT,
                collection_purpose="service_provision",
                legal_basis="contract"
            )
        ]
        
        for field in default_fields:
            self.data_fields[field.field_name] = field

    def detect_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Detect sensitive data in the input data"""
        
        detected_data = {}
        
        for field_name, field_value in data.items():
            if isinstance(field_value, str):
                detected_patterns = []
                
                for data_type, patterns in self.pii_patterns.items():
                    for pattern in patterns:
                        if re.search(pattern, field_value, re.IGNORECASE):
                            detected_patterns.append({
                                "data_type": data_type.value,
                                "pattern": pattern,
                                "matches": re.findall(pattern, field_value, re.IGNORECASE)
                            })
                
                if detected_patterns:
                    detected_data[field_name] = detected_patterns
        
        return detected_data

    def minimize_data(
        self,
        data: Dict[str, Any],
        context: str = "default",
        purpose: str = "general",
        legal_basis: str = "legitimate_interest"
    ) -> MinimizationResult:
        """Apply data minimization rules to input data"""
        
        if not self.minimization_enabled:
            logger.warning("Data minimization is disabled")
            return MinimizationResult(
                original_data=data,
                minimized_data=data,
                fields_processed=[],
                actions_taken=[],
                anonymization_mapping={},
                compliance_score=0.0,
                processed_at=datetime.utcnow()
            )
        
        minimized_data = data.copy()
        fields_processed = []
        actions_taken = []
        anonymization_mapping = {}
        
        # Apply field-specific rules first
        for field_name, field_value in data.items():
            if field_name in self.data_fields:
                field_def = self.data_fields[field_name]
                processed_value, action = self._apply_field_minimization(
                    field_name, field_value, field_def, context, purpose, legal_basis
                )
                
                if processed_value != field_value:
                    minimized_data[field_name] = processed_value
                    fields_processed.append(field_name)
                    if action not in actions_taken:
                        actions_taken.append(action)
        
        # Apply pattern-based rules
        for rule in sorted(self.minimization_rules, key=lambda x: x.priority):
            if not rule.is_active:
                continue
            
            # Check rule conditions
            if not self._check_rule_conditions(rule, context, purpose, legal_basis):
                continue
            
            # Apply rule to all string fields
            for field_name, field_value in minimized_data.items():
                if isinstance(field_value, str):
                    processed_value = self._apply_pattern_rule(field_value, rule)
                    
                    if processed_value != field_value:
                        minimized_data[field_name] = processed_value
                        if field_name not in fields_processed:
                            fields_processed.append(field_name)
                        if rule.action not in actions_taken:
                            actions_taken.append(rule.action)
        
        # Calculate compliance score
        compliance_score = self._calculate_compliance_score(data, minimized_data, fields_processed)
        
        # Log minimization operation
        if self.audit_logging_enabled:
            self._log_minimization_operation(data, minimized_data, fields_processed, actions_taken)
        
        result = MinimizationResult(
            original_data=data,
            minimized_data=minimized_data,
            fields_processed=fields_processed,
            actions_taken=actions_taken,
            anonymization_mapping=anonymization_mapping,
            compliance_score=compliance_score,
            processed_at=datetime.utcnow()
        )
        
        logger.info(f"Data minimization completed: {len(fields_processed)} fields processed, score: {compliance_score:.2f}")
        return result

    def _apply_field_minimization(
        self,
        field_name: str,
        field_value: Any,
        field_def: DataField,
        context: str,
        purpose: str,
        legal_basis: str
    ) -> Tuple[Any, MinimizationAction]:
        """Apply minimization to a specific field based on its definition"""
        
        # Check if collection is necessary for this purpose
        if not self._is_collection_necessary(field_def, purpose, legal_basis):
            return "[REDACTED]", MinimizationAction.DELETE
        
        # Apply field-specific minimization action
        if field_def.minimization_action == MinimizationAction.ANONYMIZE:
            return self._anonymize_value(field_value), MinimizationAction.ANONYMIZE
        elif field_def.minimization_action == MinimizationAction.MASK:
            return self._mask_value(field_value), MinimizationAction.MASK
        elif field_def.minimization_action == MinimizationAction.PSEUDONYMIZE:
            return self._pseudonymize_value(field_value), MinimizationAction.PSEUDONYMIZE
        elif field_def.minimization_action == MinimizationAction.REDACT:
            return "[REDACTED]", MinimizationAction.REDACT
        else:
            return field_value, MinimizationAction.COLLECT

    def _apply_pattern_rule(self, value: str, rule: MinimizationRule) -> str:
        """Apply a pattern-based minimization rule"""
        
        processed_value = value
        
        for pattern in rule.patterns:
            if rule.action == MinimizationAction.ANONYMIZE:
                processed_value = re.sub(pattern, lambda m: self._generate_anonymized_value(m.group()), processed_value)
            elif rule.action == MinimizationAction.MASK:
                processed_value = re.sub(pattern, "[MASKED]", processed_value)
            elif rule.action == MinimizationAction.REDACT:
                processed_value = re.sub(pattern, "[REDACTED]", processed_value)
        
        return processed_value

    def _check_rule_conditions(self, rule: MinimizationRule, context: str, purpose: str, legal_basis: str) -> bool:
        """Check if rule conditions are met"""
        
        conditions = rule.conditions
        
        # Check context condition
        if "context" in conditions:
            allowed_contexts = conditions["context"]
            if isinstance(allowed_contexts, list) and context not in allowed_contexts:
                return False
        
        # Check sensitivity condition
        if "sensitivity" in conditions:
            # This would need to be determined from the data context
            pass
        
        return True

    def _is_collection_necessary(self, field_def: DataField, purpose: str, legal_basis: str) -> bool:
        """Determine if data collection is necessary for the given purpose"""
        
        # Check if field is required
        if field_def.is_required:
            return True
        
        # Check purpose alignment
        if field_def.collection_purpose != purpose:
            return False
        
        # Check legal basis alignment
        if field_def.legal_basis != legal_basis:
            return False
        
        return True

    def _anonymize_value(self, value: Any) -> str:
        """Anonymize a value using hashing"""
        
        if isinstance(value, str):
            # Create a hash of the value
            hash_value = hashlib.sha256(value.encode()).hexdigest()[:8]
            return f"anon_{hash_value}"
        else:
            return "anon_data"

    def _mask_value(self, value: Any) -> str:
        """Mask a value by showing only partial information"""
        
        if isinstance(value, str):
            if len(value) <= 4:
                return "*" * len(value)
            else:
                return value[:2] + "*" * (len(value) - 4) + value[-2:]
        else:
            return "[MASKED]"

    def _pseudonymize_value(self, value: Any) -> str:
        """Pseudonymize a value using consistent mapping"""
        
        if isinstance(value, str):
            # Check if we already have a pseudonym for this value
            if value in self.anonymization_mapping:
                return self.anonymization_mapping[value]
            
            # Generate new pseudonym
            pseudonym = f"pseudo_{len(self.anonymization_mapping) + 1:06d}"
            self.anonymization_mapping[value] = pseudonym
            return pseudonym
        else:
            return "[PSEUDONYMIZED]"

    def _generate_anonymized_value(self, original: str) -> str:
        """Generate an anonymized value for a matched pattern"""
        
        if "@" in original:  # Email address
            return f"user{hash(original) % 10000}@example.com"
        elif "-" in original and len(original) == 11:  # Phone number
            return "XXX-XXX-XXXX"
        elif len(original) == 16 and original.replace("-", "").replace(" ", "").isdigit():  # Credit card
            return "XXXX-XXXX-XXXX-XXXX"
        else:
            return "[ANONYMIZED]"

    def _calculate_compliance_score(self, original: Dict[str, Any], minimized: Dict[str, Any], fields_processed: List[str]) -> float:
        """Calculate compliance score based on minimization effectiveness"""
        
        total_fields = len(original)
        if total_fields == 0:
            return 1.0
        
        # Fields that were minimized
        minimized_fields = len(fields_processed)
        
        # Fields that contain sensitive data but weren't processed
        sensitive_unprocessed = 0
        for field_name, field_value in original.items():
            if field_name not in fields_processed:
                detected = self.detect_sensitive_data({field_name: field_value})
                if detected:
                    sensitive_unprocessed += 1
        
        # Calculate score
        if total_fields == 0:
            score = 1.0
        else:
            score = (minimized_fields + (total_fields - sensitive_unprocessed)) / total_fields
        
        return min(1.0, max(0.0, score))

    def add_data_field(self, field: DataField):
        """Add a new data field definition"""
        
        self.data_fields[field.field_name] = field
        logger.info(f"Added data field definition: {field.field_name}")

    def add_minimization_rule(self, rule: MinimizationRule):
        """Add a new minimization rule"""
        
        self.minimization_rules.append(rule)
        # Sort by priority
        self.minimization_rules.sort(key=lambda x: x.priority)
        logger.info(f"Added minimization rule: {rule.name}")

    def update_minimization_rule(self, rule_id: str, updates: Dict[str, Any]):
        """Update an existing minimization rule"""
        
        for rule in self.minimization_rules:
            if rule.rule_id == rule_id:
                for key, value in updates.items():
                    if hasattr(rule, key):
                        setattr(rule, key, value)
                logger.info(f"Updated minimization rule: {rule_id}")
                return
        
        logger.warning(f"Minimization rule not found: {rule_id}")

    def delete_minimization_rule(self, rule_id: str):
        """Delete a minimization rule"""
        
        self.minimization_rules = [rule for rule in self.minimization_rules if rule.rule_id != rule_id]
        logger.info(f"Deleted minimization rule: {rule_id}")

    def get_minimization_summary(self) -> Dict[str, Any]:
        """Get summary of data minimization configuration"""
        
        return {
            "total_fields": len(self.data_fields),
            "total_rules": len(self.minimization_rules),
            "active_rules": len([rule for rule in self.minimization_rules if rule.is_active]),
            "data_types_covered": list(set([field.data_type.value for field in self.data_fields.values()])),
            "minimization_enabled": self.minimization_enabled,
            "audit_logging_enabled": self.audit_logging_enabled,
            "anonymization_mappings": len(self.anonymization_mapping)
        }

    def _log_minimization_operation(self, original: Dict[str, Any], minimized: Dict[str, Any], fields_processed: List[str], actions_taken: List[MinimizationAction]):
        """Log data minimization operation for audit trail"""
        
        audit_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "data_minimization",
            "fields_processed": fields_processed,
            "actions_taken": [action.value for action in actions_taken],
            "original_fields_count": len(original),
            "minimized_fields_count": len(minimized),
            "service": "data_minimization_service"
        }
        
        logger.info(f"DATA_MINIMIZATION_AUDIT: {json.dumps(audit_log)}")

# Global data minimization service instance
data_minimization_service = DataMinimizationService()
