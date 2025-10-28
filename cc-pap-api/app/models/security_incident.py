"""
Security Incident Model for PAP API
"""

from sqlalchemy import Column, String, Text, DateTime, JSON, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class SecurityIncident(Base):
    __tablename__ = "security_incidents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    
    # Incident details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False)  # critical, high, medium, low
    status = Column(String, nullable=False, default="detected")  # detected, investigating, resolved, closed
    incident_type = Column(String, nullable=False)  # data_breach, unauthorized_access, etc.
    component = Column(String, nullable=False, default="pap")  # pap, bouncer, opal, business_admin
    
    # Detection information
    detected_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    detected_by = Column(String, nullable=True)  # user email or system
    assigned_to = Column(String, nullable=True)  # assigned user email
    
    # Affected resources
    affected_systems = Column(JSON, nullable=True)  # List of affected system names
    affected_users = Column(JSON, nullable=True)  # List of affected user emails
    
    # Response information
    response_actions = Column(JSON, nullable=True)  # List of response actions taken
    indicators = Column(JSON, nullable=True)  # Additional incident indicators
    
    # SLA and tracking
    sla_deadline = Column(DateTime, nullable=True)
    crm_ticket_id = Column(String, nullable=True)
    
    # Timeline and notes
    timeline = Column(JSON, nullable=True)  # Array of timeline events
    resolution_notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<SecurityIncident(id='{self.id}', title='{self.title}', severity='{self.severity}')>"
    
    def to_dict(self):
        """Convert incident to dictionary for API responses."""
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "status": self.status,
            "incident_type": self.incident_type,
            "component": self.component,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "detected_by": self.detected_by,
            "assigned_to": self.assigned_to,
            "affected_systems": self.affected_systems or [],
            "affected_users": self.affected_users or [],
            "response_actions": self.response_actions or [],
            "indicators": self.indicators or {},
            "sla_deadline": self.sla_deadline.isoformat() if self.sla_deadline else None,
            "crm_ticket_id": self.crm_ticket_id,
            "timeline": self.timeline or [],
            "resolution_notes": self.resolution_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "is_overdue": self.sla_deadline and datetime.utcnow() > self.sla_deadline
        }
