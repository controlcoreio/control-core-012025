from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum

Base = declarative_base()

class TenantStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"
    PENDING = "pending"

class PlanType(str, Enum):
    PRO = "pro"
    CUSTOM = "custom"

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=False)
    subdomain = Column(String, unique=True, index=True, nullable=False)
    plan_type = Column(String, nullable=False)  # pro, custom
    status = Column(String, default=TenantStatus.PENDING)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime, nullable=True)
    
    # Tenant configuration
    config = Column(JSON, default={})
    limits = Column(JSON, default={})
    context_configuration = Column(JSON, default={})
    
    # Relationships
    users = relationship("TenantUser", back_populates="tenant")
    policies = relationship("TenantPolicy", back_populates="tenant")
    resources = relationship("TenantResource", back_populates="tenant")
    bouncers = relationship("TenantBouncer", back_populates="tenant")
    audit_logs = relationship("TenantAuditLog", back_populates="tenant")

class TenantUser(Base):
    __tablename__ = "tenant_users"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    user_id = Column(String, nullable=False)  # External user ID from Auth0
    email = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="admin")  # admin, user, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")

class TenantPolicy(Base):
    __tablename__ = "tenant_policies"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    policy_content = Column(Text, nullable=False)
    status = Column(String, default="draft")  # draft, active, inactive
    version = Column(String, default="1.0.0")
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Policy metadata
    tags = Column(JSON, default=[])
    category = Column(String, nullable=True)
    priority = Column(Integer, default=0)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="policies")

class TenantResource(Base):
    __tablename__ = "tenant_resources"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)  # api, ai_agent, llm, rag, git
    description = Column(Text, nullable=True)
    is_protected = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Resource configuration
    config = Column(JSON, default={})
    health_check_url = Column(String, nullable=True)
    last_health_check = Column(DateTime, nullable=True)
    health_status = Column(String, default="unknown")  # healthy, unhealthy, unknown
    
    # Relationships
    tenant = relationship("Tenant", back_populates="resources")

class TenantBouncer(Base):
    __tablename__ = "tenant_bouncers"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    bouncer_id = Column(String, unique=True, nullable=False)
    status = Column(String, default="inactive")  # active, inactive, error
    version = Column(String, default="latest")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_sync = Column(DateTime, nullable=True)
    
    # Bouncer configuration
    config = Column(JSON, default={})
    target_hosts = Column(JSON, default=[])
    policies = Column(JSON, default=[])
    
    # Relationships
    tenant = relationship("Tenant", back_populates="bouncers")

class TenantAuditLog(Base):
    __tablename__ = "tenant_audit_logs"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    user_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    resource = Column(String, nullable=True)
    result = Column(String, nullable=False)  # success, failure
    details = Column(JSON, default={})
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime, default=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="audit_logs")

class TenantMetrics(Base):
    __tablename__ = "tenant_metrics"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    metric_name = Column(String, nullable=False)
    metric_value = Column(String, nullable=False)
    metric_type = Column(String, nullable=False)  # counter, gauge, histogram
    labels = Column(JSON, default={})
    timestamp = Column(DateTime, default=func.now())
    
    # Relationships
    tenant = relationship("Tenant")

class TenantSubscription(Base):
    __tablename__ = "tenant_subscriptions"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    plan_type = Column(String, nullable=False)
    status = Column(String, default="active")  # active, canceled, past_due
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant")

class TenantBouncerConnection(Base):
    __tablename__ = "tenant_bouncer_connections"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    bouncer_host = Column(String, nullable=False)
    bouncer_port = Column(Integer, nullable=False)
    connection_type = Column(String, nullable=False)  # http, https, tcp, tls
    status = Column(String, default="pending")  # pending, active, inactive, error
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_sync = Column(DateTime, nullable=True)
    
    # Connection configuration
    config = Column(JSON, default={})
    security_config = Column(JSON, default={})
    monitoring_config = Column(JSON, default={})
    
    # Relationships
    tenant = relationship("Tenant")
    certificates = relationship("TenantBouncerCertificate", back_populates="connection")
    metrics = relationship("TenantBouncerMetrics", back_populates="connection")

class TenantBouncerCertificate(Base):
    __tablename__ = "tenant_bouncer_certificates"
    
    id = Column(String, primary_key=True, index=True)
    connection_id = Column(String, ForeignKey("tenant_bouncer_connections.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # client, server, ca
    subject = Column(String, nullable=True)
    issuer = Column(String, nullable=True)
    valid_from = Column(DateTime, nullable=True)
    valid_to = Column(DateTime, nullable=True)
    status = Column(String, default="active")  # active, expired, revoked
    created_at = Column(DateTime, default=func.now())
    
    # Certificate data
    certificate_data = Column(JSON, default={})
    
    # Relationships
    connection = relationship("TenantBouncerConnection", back_populates="certificates")

class TenantBouncerMetrics(Base):
    __tablename__ = "tenant_bouncer_metrics"
    
    id = Column(String, primary_key=True, index=True)
    connection_id = Column(String, ForeignKey("tenant_bouncer_connections.id"), nullable=False)
    metric_name = Column(String, nullable=False)
    metric_value = Column(String, nullable=False)
    metric_type = Column(String, nullable=False)  # counter, gauge, histogram
    labels = Column(JSON, default={})
    timestamp = Column(DateTime, default=func.now())
    
    # Relationships
    connection = relationship("TenantBouncerConnection", back_populates="metrics")
