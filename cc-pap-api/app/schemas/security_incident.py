"""
Security Incident Schemas for PAP API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class IncidentSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class IncidentStatus(str, Enum):
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    CLOSED = "closed"
    FALSE_POSITIVE = "false_positive"

class IncidentComponent(str, Enum):
    PAP = "pap"
    BOUNCER = "bouncer"
    OPAL = "opal"
    BUSINESS_ADMIN = "business_admin"

class IncidentType(str, Enum):
    DATA_BREACH = "data_breach"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    POLICY_VIOLATION = "policy_violation"
    SYSTEM_COMPROMISE = "system_compromise"
    NETWORK_INTRUSION = "network_intrusion"
    ACCOUNT_COMPROMISE = "account_compromise"
    SYNC_FAILURE = "sync_failure"
    VULNERABILITY_DETECTED = "vulnerability_detected"
    DATA_ACCESS_ANOMALY = "data_access_anomaly"
    MALWARE = "malware"
    DOS_ATTACK = "dos_attack"
    PRIVILEGE_ESCALATION = "privilege_escalation"

class TimelineEvent(BaseModel):
    timestamp: datetime
    action: str
    actor: str
    details: str
    metadata: Optional[Dict[str, Any]] = None

class SecurityIncidentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    severity: IncidentSeverity
    incident_type: IncidentType
    affected_systems: Optional[List[str]] = Field(default_factory=list)
    affected_users: Optional[List[str]] = Field(default_factory=list)
    response_actions: Optional[List[str]] = Field(default_factory=list)
    indicators: Optional[Dict[str, Any]] = Field(default_factory=dict)
    timeline: Optional[List[TimelineEvent]] = Field(default_factory=list)

class SecurityIncidentCreate(SecurityIncidentBase):
    id: Optional[str] = None
    status: IncidentStatus = IncidentStatus.DETECTED
    component: IncidentComponent = IncidentComponent.PAP
    detected_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    detected_by: Optional[str] = None
    assigned_to: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    crm_ticket_id: Optional[str] = None

class SecurityIncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    incident_type: Optional[IncidentType] = None
    affected_systems: Optional[List[str]] = None
    affected_users: Optional[List[str]] = None
    response_actions: Optional[List[str]] = None
    indicators: Optional[Dict[str, Any]] = None
    assigned_to: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    crm_ticket_id: Optional[str] = None
    resolution_notes: Optional[str] = None

class SecurityIncidentResponse(SecurityIncidentBase):
    id: str
    tenant_id: str
    status: IncidentStatus
    component: IncidentComponent
    detected_at: datetime
    detected_by: Optional[str]
    assigned_to: Optional[str]
    sla_deadline: Optional[datetime]
    crm_ticket_id: Optional[str]
    resolution_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    is_overdue: bool = False

    class Config:
        from_attributes = True

class SecurityIncidentSummary(BaseModel):
    id: str
    title: str
    severity: IncidentSeverity
    status: IncidentStatus
    component: IncidentComponent
    detected_at: datetime
    is_overdue: bool = False

class SecurityIncidentFilter(BaseModel):
    severity: Optional[List[IncidentSeverity]] = None
    status: Optional[List[IncidentStatus]] = None
    component: Optional[List[IncidentComponent]] = None
    incident_type: Optional[List[IncidentType]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    has_crm_ticket: Optional[bool] = None
    is_overdue: Optional[bool] = None

class SecurityMetrics(BaseModel):
    total_incidents: int
    critical_incidents: int
    high_incidents: int
    medium_incidents: int
    low_incidents: int
    active_incidents: int
    resolved_incidents: int
    overdue_incidents: int
    average_response_time: float  # in minutes
    sla_compliance: float  # percentage

class ComponentHealth(BaseModel):
    name: str
    component: IncidentComponent
    status: str  # healthy, warning, critical, unknown
    active_incidents: int
    total_incidents: int
    last_health_check: datetime
    uptime: float  # percentage
    last_incident: Optional[str] = None

class IncidentStatistics(BaseModel):
    by_severity: Dict[str, int]
    by_status: Dict[str, int]
    by_component: Dict[str, int]
    by_type: Dict[str, int]
    trends: List[Dict[str, Any]]

class IncidentAssignment(BaseModel):
    incident_id: str
    assignee: str
    assigned_by: str
    notes: Optional[str] = None

class IncidentComment(BaseModel):
    incident_id: str
    comment: str
    author: str
    is_internal: bool = False

class IncidentEscalation(BaseModel):
    incident_id: str
    escalation_reason: str
    escalated_by: str
    escalated_to: List[str]
    urgency_level: str  # low, medium, high, critical

class SecurityAlertConfig(BaseModel):
    alert_type: str
    severity_threshold: IncidentSeverity
    enabled: bool
    channels: Dict[str, bool]  # email, slack, webhook, in_app
    escalation_rules: Optional[Dict[str, Any]] = None
    cooldown_minutes: Optional[int] = None
    custom_message: Optional[str] = None
