from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum

class PlanType(str, Enum):
    PRO = "pro"
    CUSTOM = "custom"

class TenantStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"
    PENDING = "pending"

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    VIEWER = "viewer"

# Tenant Schemas
class TenantBase(BaseModel):
    name: str
    domain: str
    subdomain: str
    plan_type: PlanType

class TenantCreate(TenantBase):
    stripe_price_id: str

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    limits: Optional[Dict[str, Any]] = None

class TenantResponse(TenantBase):
    id: str
    status: TenantStatus
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None
    config: Dict[str, Any] = {}
    limits: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True

# Tenant User Schemas
class TenantUserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.USER

class TenantUserCreate(TenantUserBase):
    pass

class TenantUserResponse(TenantUserBase):
    id: str
    tenant_id: str
    user_id: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Policy Schemas
class PolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    policy_content: str
    category: Optional[str] = None
    tags: List[str] = []

class PolicyCreate(PolicyBase):
    pass

class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    policy_content: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class PolicyResponse(PolicyBase):
    id: str
    tenant_id: str
    status: str
    version: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    priority: int = 0
    
    class Config:
        from_attributes = True

# Resource Schemas
class ResourceBase(BaseModel):
    name: str
    url: str
    resource_type: str
    description: Optional[str] = None
    config: Dict[str, Any] = {}

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    is_protected: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None

class ResourceResponse(ResourceBase):
    id: str
    tenant_id: str
    is_protected: bool
    created_at: datetime
    updated_at: datetime
    health_check_url: Optional[str] = None
    last_health_check: Optional[datetime] = None
    health_status: str = "unknown"
    
    class Config:
        from_attributes = True

# Bouncer Schemas
class BouncerBase(BaseModel):
    name: str
    target_hosts: List[str] = []
    config: Dict[str, Any] = {}

class BouncerCreate(BouncerBase):
    pass

class BouncerUpdate(BaseModel):
    name: Optional[str] = None
    target_hosts: Optional[List[str]] = None
    config: Optional[Dict[str, Any]] = None

class BouncerResponse(BouncerBase):
    id: str
    tenant_id: str
    bouncer_id: str
    status: str
    version: str
    created_at: datetime
    updated_at: datetime
    last_sync: Optional[datetime] = None
    policies: List[str] = []
    
    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogBase(BaseModel):
    action: str
    resource: Optional[str] = None
    result: str
    details: Dict[str, Any] = {}

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: str
    tenant_id: str
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Metrics Schemas
class MetricBase(BaseModel):
    metric_name: str
    metric_value: str
    metric_type: str
    labels: Dict[str, Any] = {}

class MetricCreate(MetricBase):
    pass

class MetricResponse(MetricBase):
    id: str
    tenant_id: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Subscription Schemas
class SubscriptionBase(BaseModel):
    plan_type: PlanType
    status: str

class SubscriptionResponse(SubscriptionBase):
    id: str
    tenant_id: str
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_policies: int
    total_resources: int
    total_bouncers: int
    active_bouncers: int
    total_users: int
    recent_audit_logs: int
    policy_evaluations_today: int
    average_response_time: float

class TenantDashboard(BaseModel):
    tenant: TenantResponse
    stats: DashboardStats
    recent_activities: List[AuditLogResponse]
    health_status: Dict[str, str]

# Health Check Schemas
class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, str]
    tenant_id: Optional[str] = None

class SystemStatus(BaseModel):
    system: str
    version: str
    environment: str
    tenant_count: int
    active_tenants: int
    total_policies: int
    total_bouncers: int

# --- Bouncer Connection Schemas ---
class BouncerConnectionBase(BaseModel):
    name: str
    bouncer_host: str
    bouncer_port: int
    connection_type: str  # http, https, tcp, tls
    config: Optional[Dict[str, Any]] = {}
    security_config: Optional[Dict[str, Any]] = {}
    monitoring_config: Optional[Dict[str, Any]] = {}

class BouncerConnectionCreate(BouncerConnectionBase):
    pass

class BouncerConnectionUpdate(BouncerConnectionBase):
    name: Optional[str] = None
    bouncer_host: Optional[str] = None
    bouncer_port: Optional[int] = None
    connection_type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    security_config: Optional[Dict[str, Any]] = None
    monitoring_config: Optional[Dict[str, Any]] = None

class BouncerConnectionResponse(BouncerConnectionBase):
    id: str
    tenant_id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_sync: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Bouncer Certificate Schemas ---
class BouncerCertificateBase(BaseModel):
    name: str
    type: str  # client, server, ca
    subject: Optional[str] = None
    issuer: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    certificate_data: Optional[Dict[str, Any]] = {}

class BouncerCertificateCreate(BouncerCertificateBase):
    pass

class BouncerCertificateResponse(BouncerCertificateBase):
    id: str
    connection_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Bouncer Metrics Schemas ---
class BouncerMetricsBase(BaseModel):
    metric_name: str
    metric_value: str
    metric_type: str  # counter, gauge, histogram
    labels: Optional[Dict[str, Any]] = {}
    timestamp: Optional[datetime] = None

class BouncerMetricsCreate(BouncerMetricsBase):
    pass

class BouncerMetricsResponse(BouncerMetricsBase):
    id: str
    connection_id: str

    class Config:
        from_attributes = True
