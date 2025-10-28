from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class PolicyStatus(str, Enum):
    ENABLED = "enabled"
    DISABLED = "disabled"
    DRAFT = "draft"
    ARCHIVED = "archived"

class PolicyEffect(str, Enum):
    ALLOW = "allow"
    DENY = "deny"

class EventType(str, Enum):
    # Authentication Events
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    USER_LOGIN_FAILED = "USER_LOGIN_FAILED"
    USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED"
    USER_MFA_ENABLED = "USER_MFA_ENABLED"
    USER_MFA_DISABLED = "USER_MFA_DISABLED"
    
    # User Management Events
    USER_CREATED = "USER_CREATED"
    USER_UPDATED = "USER_UPDATED"
    USER_DELETED = "USER_DELETED"
    USER_SUSPENDED = "USER_SUSPENDED"
    USER_ACTIVATED = "USER_ACTIVATED"
    USER_ROLE_CHANGED = "USER_ROLE_CHANGED"
    
    # Policy Events
    POLICY_CREATED = "POLICY_CREATED"
    POLICY_UPDATED = "POLICY_UPDATED"
    POLICY_DELETED = "POLICY_DELETED"
    POLICY_ENABLED = "POLICY_ENABLED"
    POLICY_DISABLED = "POLICY_DISABLED"
    POLICY_DEPLOYED = "POLICY_DEPLOYED"
    POLICY_MODIFIED = "POLICY_MODIFIED"
    
    # Resource Events
    RESOURCE_CREATED = "RESOURCE_CREATED"
    RESOURCE_UPDATED = "RESOURCE_UPDATED"
    RESOURCE_DELETED = "RESOURCE_DELETED"
    
    # PEP/Bouncer Events
    PEP_DEPLOYED = "PEP_DEPLOYED"
    PEP_UPDATED = "PEP_UPDATED"
    PEP_DELETED = "PEP_DELETED"
    PEP_STATUS_CHANGED = "PEP_STATUS_CHANGED"
    
    # System Events
    SYSTEM_VERSION_UPDATE = "SYSTEM_VERSION_UPDATE"
    SYSTEM_CONFIG_CHANGED = "SYSTEM_CONFIG_CHANGED"
    SYSTEM_BACKUP_CREATED = "SYSTEM_BACKUP_CREATED"
    SYSTEM_AUDIT_PURGE = "SYSTEM_AUDIT_PURGE"
    
    # Access Decision Events (for /audit page - different from /settings/users)
    ACCESS_GRANTED = "ACCESS_GRANTED"
    ACCESS_DENIED = "ACCESS_DENIED"

class Outcome(str, Enum):
    PERMIT = "PERMIT"
    DENY = "DENY"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"

# User Management Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    username: str
    role: str = "user"
    status: UserStatus = UserStatus.ACTIVE
    mfa_enabled: bool = False
    permissions: List[str] = []
    subscription_tier: str = "kickstart"
    deployment_model: str = "hosted"
    github_repo: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    status: Optional[UserStatus] = None
    mfa_enabled: Optional[bool] = None
    permissions: Optional[List[str]] = None
    subscription_tier: Optional[str] = None
    deployment_model: Optional[str] = None
    github_repo: Optional[str] = None

class UserResponse(UserBase):
    id: int
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    force_password_change: Optional[bool] = False
    user_source: Optional[str] = "local"
    active_sessions: Optional[int] = 0
    last_activity: Optional[datetime] = None
    last_ip_address: Optional[str] = None
    
    class Config:
        from_attributes = True

# Authentication Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    force_password_change: Optional[bool] = False

class TokenData(BaseModel):
    username: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# Policy Management Schemas
class PolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    scope: List[str] = []
    effect: PolicyEffect
    resource_id: Optional[str] = None

class PolicyCreate(PolicyBase):
    rego_code: Optional[str] = None
    bouncer_id: Optional[str] = None
    status: Optional[str] = "enabled"
    folder: Optional[str] = "enabled"

class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[PolicyStatus] = None
    sandbox_status: Optional[str] = None
    production_status: Optional[str] = None
    scope: Optional[List[str]] = None
    effect: Optional[PolicyEffect] = None
    resource_id: Optional[str] = None

class PolicyResponse(PolicyBase):
    id: int
    status: PolicyStatus
    sandbox_status: str
    production_status: str
    version: str
    created_by: str
    modified_by: str
    created_at: datetime
    last_modified: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Resource Protection Schemas
class ProtectedResourceBase(BaseModel):
    name: str
    url: str
    original_host: Optional[str] = None
    original_host_production: Optional[str] = None
    default_security_posture: str = "deny-all"
    description: Optional[str] = None
    environment: str = "sandbox"

class ProtectedResourceCreate(ProtectedResourceBase):
    pass

class ProtectedResourceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    original_host: Optional[str] = None
    original_host_production: Optional[str] = None
    default_security_posture: Optional[str] = None
    description: Optional[str] = None
    environment: Optional[str] = None

class ProtectedResourceResponse(ProtectedResourceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    auto_discovered: bool = False
    discovered_at: Optional[datetime] = None
    bouncer_id: Optional[int] = None
    business_context: Optional[str] = None
    data_classification: Optional[str] = None
    compliance_tags: Optional[List[str]] = []
    cost_center: Optional[str] = None
    owner_email: Optional[str] = None
    owner_team: Optional[str] = None
    sla_tier: Optional[str] = None
    data_residency: Optional[str] = None
    audit_level: Optional[str] = None
    
    class Config:
        from_attributes = True

class ResourceEnrichmentRequest(BaseModel):
    business_context: Optional[str] = None
    data_classification: Optional[str] = None
    compliance_tags: Optional[List[str]] = None
    cost_center: Optional[str] = None
    owner_email: Optional[str] = None
    owner_team: Optional[str] = None
    sla_tier: Optional[str] = None
    data_residency: Optional[str] = None
    audit_level: Optional[str] = None

# PEP Management Schemas (The Bouncer)
class PEPBase(BaseModel):
    name: str
    environment: str
    max_capacity: float = 100.0

class PEPCreate(PEPBase):
    # Enhanced Bouncer Configuration
    deployment_mode: str = "reverse-proxy"  # reverse-proxy, sidecar
    target_url: Optional[str] = None
    proxy_url: Optional[str] = None
    
    # DNS Configuration (for reverse-proxy mode)
    dns_domain: Optional[str] = None
    dns_subdomain: Optional[str] = None
    dns_provider: str = "Cloudflare"
    dns_ttl: int = 300
    dns_cname_record: Optional[str] = None
    dns_a_record: Optional[str] = None
    
    # SSL Configuration
    ssl_enabled: bool = True
    ssl_certificate_type: str = "letsencrypt"  # letsencrypt, custom, self-signed
    ssl_certificate_path: Optional[str] = None
    ssl_key_path: Optional[str] = None
    ssl_auto_renew: bool = True
    
    # Traffic Configuration
    ingress_enabled: bool = True
    egress_enabled: bool = True
    rate_limit_per_minute: int = 1000
    max_connections: int = 500
    timeout_seconds: int = 30
    retry_attempts: int = 3
    
    # Bouncer-specific settings
    bouncer_id: Optional[str] = None
    bouncer_version: str = "v2.1.0"

class PEPUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    environment: Optional[str] = None
    max_capacity: Optional[float] = None
    
    # Enhanced Bouncer Configuration
    deployment_mode: Optional[str] = None
    target_url: Optional[str] = None
    proxy_url: Optional[str] = None
    
    # DNS Configuration
    dns_domain: Optional[str] = None
    dns_subdomain: Optional[str] = None
    dns_provider: Optional[str] = None
    dns_ttl: Optional[int] = None
    dns_cname_record: Optional[str] = None
    dns_a_record: Optional[str] = None
    
    # SSL Configuration
    ssl_enabled: Optional[bool] = None
    ssl_certificate_type: Optional[str] = None
    ssl_certificate_path: Optional[str] = None
    ssl_key_path: Optional[str] = None
    ssl_auto_renew: Optional[bool] = None
    
    # Traffic Configuration
    ingress_enabled: Optional[bool] = None
    egress_enabled: Optional[bool] = None
    rate_limit_per_minute: Optional[int] = None
    max_connections: Optional[int] = None
    timeout_seconds: Optional[int] = None
    retry_attempts: Optional[int] = None
    
    # Bouncer-specific settings
    bouncer_id: Optional[str] = None
    bouncer_version: Optional[str] = None

class PEPResponse(PEPBase):
    id: int
    status: str
    current_load: float
    response_time: float
    last_health_check: Optional[datetime]
    
    # Enhanced Bouncer Configuration
    deployment_mode: str
    target_url: Optional[str]
    proxy_url: Optional[str]
    
    # DNS Configuration
    dns_domain: Optional[str]
    dns_subdomain: Optional[str]
    dns_provider: str
    dns_ttl: int
    dns_cname_record: Optional[str]
    dns_a_record: Optional[str]
    
    # SSL Configuration
    ssl_enabled: bool
    ssl_certificate_type: str
    ssl_certificate_path: Optional[str]
    ssl_key_path: Optional[str]
    ssl_auto_renew: bool
    
    # Traffic Configuration
    ingress_enabled: bool
    egress_enabled: bool
    rate_limit_per_minute: int
    max_connections: int
    timeout_seconds: int
    retry_attempts: int
    
    # Bouncer-specific settings
    bouncer_id: Optional[str]
    bouncer_version: str
    resources_protected: int
    requests_per_hour: int
    
    # Health check and connection status
    is_connected: bool = False
    intercepting_traffic: bool = False
    last_heartbeat: Optional[datetime] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Bouncer Auto-Registration Schemas
class ResourceInfo(BaseModel):
    name: str
    type: str  # api, webapp, database, ai-agent, mcp-server
    target_host: str
    original_host_url: Optional[str] = None
    deployment_url: Optional[str] = None
    default_security_posture: str = "deny-all"

class DeploymentInfo(BaseModel):
    platform: str  # kubernetes, docker, binary
    version: str
    environment: str  # dev, staging, prod

class BouncerRegistrationRequest(BaseModel):
    bouncer_id: str
    bouncer_name: str
    bouncer_type: str  # reverse-proxy, sidecar
    tenant_id: str
    resource: ResourceInfo
    deployment_info: DeploymentInfo

# Environment Management Schemas
class EnvironmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str

class EnvironmentCreate(EnvironmentBase):
    pass

class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    type: Optional[str] = None

class EnvironmentResponse(EnvironmentBase):
    id: int
    status: str
    pdp_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Audit and Monitoring Schemas
class AuditLogBase(BaseModel):
    user: str
    action: str
    resource: Optional[str] = None
    result: str
    event_type: EventType
    outcome: Outcome
    policy_name: Optional[str] = None
    reason: Optional[str] = None
    source_ip: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: int
    timestamp: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

# Integration Schemas
class IntegrationBase(BaseModel):
    name: str
    type: str
    configuration: Dict[str, Any] = {}

class IntegrationCreate(IntegrationBase):
    pass

class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None

class IntegrationResponse(IntegrationBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Decision Engine Schemas
class DecisionRequest(BaseModel):
    user: str
    resource: str
    action: str
    context: Dict[str, Any] = {}

class DecisionResponse(BaseModel):
    decision: str  # PERMIT, DENY
    reason: Optional[str] = None
    policy_name: Optional[str] = None
    evaluation_time: float

# Policy Template Schemas
class PolicyTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    template_content: str
    variables: List[str] = []
    template_metadata: Optional[Dict[str, Any]] = {}

class PolicyTemplateCreate(PolicyTemplateBase):
    pass

class PolicyTemplateResponse(PolicyTemplateBase):
    id: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard and Analytics Schemas
class DashboardStats(BaseModel):
    total_policies: int
    active_peps: int
    policies_with_issues: int
    recent_activities: int

class PolicyAnalytics(BaseModel):
    policy_id: int
    evaluation_count: int
    average_response_time: float
    success_rate: float

# OPAL Integration Schemas
class OPALConfig(BaseModel):
    opal_server_url: str
    opal_token: str
    policy_repo_url: str
    data_repo_url: Optional[str] = None
    sync_interval: int = 60  # seconds

class OPALStatus(BaseModel):
    status: str
    last_sync: Optional[datetime]
    sync_errors: List[str] = []
    policies_synced: int
    data_sources_synced: int

# --- AI Agent Control Schemas ---
class AIAgentBase(BaseModel):
    name: str
    type: str  # llm, rag, custom, prompt_engine
    provider: str  # openai, anthropic, google, azure, custom
    model: Optional[str] = None
    endpoint: str
    capabilities: Optional[List[str]] = []
    context_window: Optional[int] = 4096
    max_tokens: Optional[int] = 2048
    temperature: Optional[float] = 0.7
    status: Optional[str] = "active"

class AIAgentCreate(AIAgentBase):
    api_key: Optional[str] = None

class AIAgentUpdate(AIAgentBase):
    name: Optional[str] = None
    type: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    endpoint: Optional[str] = None
    capabilities: Optional[List[str]] = None
    context_window: Optional[int] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    status: Optional[str] = None
    api_key: Optional[str] = None

class AIAgentResponse(AIAgentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Content Injection Schemas ---
class ContentInjectionBase(BaseModel):
    name: str
    type: str  # prompt_modification, context_addition, response_filtering, data_masking
    target_agent_id: int
    injection_point: str  # pre_prompt, post_prompt, pre_response, post_response
    content_template: str
    conditions: Optional[Dict[str, Any]] = {}
    priority: Optional[int] = 100
    status: Optional[str] = "active"

class ContentInjectionCreate(ContentInjectionBase):
    pass

class ContentInjectionUpdate(ContentInjectionBase):
    name: Optional[str] = None
    type: Optional[str] = None
    target_agent_id: Optional[int] = None
    injection_point: Optional[str] = None
    content_template: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    priority: Optional[int] = None
    status: Optional[str] = None

class ContentInjectionResponse(ContentInjectionBase):
    id: int
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- RAG System Schemas ---
class RAGSystemBase(BaseModel):
    name: str
    type: str  # vector_db, knowledge_base, document_store
    provider: str  # pinecone, weaviate, chroma, elasticsearch
    endpoint: str
    collection_name: Optional[str] = None
    embedding_model: Optional[str] = "text-embedding-ada-002"
    chunk_size: Optional[int] = 1000
    chunk_overlap: Optional[int] = 200
    retrieval_strategy: Optional[str] = "similarity"
    max_results: Optional[int] = 5
    similarity_threshold: Optional[float] = 0.7
    status: Optional[str] = "active"

class RAGSystemCreate(RAGSystemBase):
    api_key: Optional[str] = None

class RAGSystemUpdate(RAGSystemBase):
    name: Optional[str] = None
    type: Optional[str] = None
    provider: Optional[str] = None
    endpoint: Optional[str] = None
    collection_name: Optional[str] = None
    embedding_model: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    retrieval_strategy: Optional[str] = None
    max_results: Optional[int] = None
    similarity_threshold: Optional[float] = None
    status: Optional[str] = None
    api_key: Optional[str] = None

class RAGSystemResponse(RAGSystemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Context Engineering Schemas ---
class ContextRuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    agent_id: int
    rag_system_id: Optional[int] = None
    rule_type: str  # context_filtering, data_enrichment, prompt_engineering
    conditions: Optional[Dict[str, Any]] = {}
    actions: Optional[Dict[str, Any]] = {}
    priority: Optional[int] = 100
    status: Optional[str] = "active"

class ContextRuleCreate(ContextRuleBase):
    pass

class ContextRuleUpdate(ContextRuleBase):
    name: Optional[str] = None
    description: Optional[str] = None
    agent_id: Optional[int] = None
    rag_system_id: Optional[int] = None
    rule_type: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    actions: Optional[Dict[str, Any]] = None
    priority: Optional[int] = None
    status: Optional[str] = None

class ContextRuleResponse(ContextRuleBase):
    id: int
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- AI Policy Template Schemas ---
class AIPolicyTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str  # AI_Safety, AI_Governance, AI_Compliance, AI_Security
    subcategory: Optional[str] = None
    use_case: str  # customer_service, content_generation, data_analysis, code_generation
    template_content: str
    injection_templates: Optional[List[Dict[str, Any]]] = []
    context_rules: Optional[List[Dict[str, Any]]] = []
    variables: Optional[List[str]] = []

class AIPolicyTemplateCreate(AIPolicyTemplateBase):
    pass

class AIPolicyTemplateUpdate(AIPolicyTemplateBase):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    use_case: Optional[str] = None
    template_content: Optional[str] = None
    injection_templates: Optional[List[Dict[str, Any]]] = None
    context_rules: Optional[List[Dict[str, Any]]] = None
    variables: Optional[List[str]] = None

class AIPolicyTemplateResponse(AIPolicyTemplateBase):
    id: int
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- AI Content Processing Schemas ---
class AIRequest(BaseModel):
    agent_id: int
    prompt: str
    context: Optional[Dict[str, Any]] = {}
    user_id: str
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class AIResponse(BaseModel):
    response: str
    agent_id: int
    processing_time: float
    tokens_used: Optional[int] = None
    content_injections_applied: List[str] = []
    context_rules_applied: List[str] = []
    metadata: Optional[Dict[str, Any]] = {}

class ContentInjectionRequest(BaseModel):
    agent_id: int
    original_content: str
    injection_type: str
    user_context: Dict[str, Any]
    session_context: Optional[Dict[str, Any]] = None

class ContentInjectionResult(BaseModel):
    modified_content: str
    injections_applied: List[Dict[str, Any]]
    confidence_score: float
    processing_time: float

# --- Stripe Integration Schemas ---
class StripeProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    tier: str  # kickstart, pro, custom
    features: Optional[List[str]] = []
    limits: Optional[Dict[str, Any]] = {}
    status: Optional[str] = "active"

class StripeProductCreate(StripeProductBase):
    pass

class StripeProductResponse(StripeProductBase):
    id: int
    stripe_product_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StripePriceBase(BaseModel):
    amount: int  # Amount in cents
    currency: str = "usd"
    interval: str  # month, year, one_time
    interval_count: Optional[int] = 1
    trial_period_days: Optional[int] = 0
    status: Optional[str] = "active"

class StripePriceCreate(StripePriceBase):
    product_id: int

class StripePriceResponse(StripePriceBase):
    id: int
    stripe_price_id: str
    product_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubscriptionBase(BaseModel):
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: Optional[bool] = False
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None

class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: str
    stripe_subscription_id: str
    stripe_customer_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaymentMethodBase(BaseModel):
    type: str  # card, bank_account
    brand: Optional[str] = None
    last4: Optional[str] = None
    exp_month: Optional[int] = None
    exp_year: Optional[int] = None
    is_default: Optional[bool] = False

class PaymentMethodResponse(PaymentMethodBase):
    id: int
    user_id: str
    stripe_payment_method_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Auth0 Integration Schemas ---
class Auth0UserBase(BaseModel):
    auth0_user_id: str
    email: str
    email_verified: Optional[bool] = False
    connection: str
    last_login: Optional[datetime] = None
    login_count: Optional[int] = 0

class Auth0UserCreate(Auth0UserBase):
    user_id: str

class Auth0UserResponse(Auth0UserBase):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MagicLinkRequest(BaseModel):
    email: str
    redirect_url: Optional[str] = None

class MagicLinkResponse(BaseModel):
    message: str
    expires_in: int  # seconds

class MagicLinkVerify(BaseModel):
    token: str

class PasskeyBase(BaseModel):
    credential_id: str
    public_key: str
    counter: Optional[int] = 0
    name: str

class PasskeyCreate(PasskeyBase):
    pass

class PasskeyResponse(PasskeyBase):
    id: int
    user_id: str
    created_at: datetime
    last_used: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- SAML Integration Schemas ---
class SAMLProviderBase(BaseModel):
    name: str
    entity_id: str
    sso_url: str
    x509_cert: str
    attribute_mapping: Optional[Dict[str, Any]] = {}
    status: Optional[str] = "active"

class SAMLProviderCreate(SAMLProviderBase):
    pass

class SAMLProviderResponse(SAMLProviderBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SAMLUserBase(BaseModel):
    saml_name_id: str
    attributes: Optional[Dict[str, Any]] = {}
    last_login: Optional[datetime] = None

class SAMLUserCreate(SAMLUserBase):
    user_id: str
    saml_provider_id: int

class SAMLUserResponse(SAMLUserBase):
    id: int
    user_id: str
    saml_provider_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Subscription Management Schemas ---
class SubscriptionCreate(BaseModel):
    price_id: str
    payment_method_id: Optional[str] = None
    trial_period_days: Optional[int] = None

class SubscriptionUpdate(BaseModel):
    cancel_at_period_end: Optional[bool] = None
    payment_method_id: Optional[str] = None

class CheckoutSessionRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str
    trial_period_days: Optional[int] = None

class CheckoutSessionResponse(BaseModel):
    session_id: str
    session_url: str
    expires_at: datetime

# --- User Registration with Stripe ---
class UserRegistration(BaseModel):
    name: str
    email: str
    company: Optional[str] = None
    tier: str = "kickstart"  # kickstart, pro, custom
    password: Optional[str] = None  # For username/password auth
    magic_link: Optional[bool] = True  # Default to magic link

class UserRegistrationResponse(BaseModel):
    user_id: str
    email: str
    tier: str
    requires_payment: bool
    checkout_session_id: Optional[str] = None
    checkout_url: Optional[str] = None
    magic_link_sent: bool = False

# --- PIP (Policy Information Point) Schemas ---
class ConnectionType(str, Enum):
    IAM = "iam"
    ERP = "erp"
    CRM = "crm"
    MCP = "mcp"
    CUSTOM = "custom"

class ConnectionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PENDING = "pending"

class PIPConnectionBase(BaseModel):
    name: str
    description: Optional[str] = None
    connection_type: ConnectionType
    provider: str
    configuration: Dict[str, Any]
    credentials: Dict[str, Any]
    health_check_url: Optional[str] = None
    sync_enabled: bool = True
    sync_frequency: int = 300

class PIPConnectionCreate(PIPConnectionBase):
    pass

class PIPConnectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, Any]] = None
    health_check_url: Optional[str] = None
    sync_enabled: Optional[bool] = None
    sync_frequency: Optional[int] = None

class PIPConnectionResponse(PIPConnectionBase):
    id: int
    status: ConnectionStatus
    health_status: str
    last_health_check: Optional[datetime] = None
    last_sync: Optional[datetime] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AttributeMappingBase(BaseModel):
    source_attribute: str
    target_attribute: str
    transformation_rule: Dict[str, Any] = {}
    is_required: bool = False
    is_sensitive: bool = False
    data_type: str = "string"
    validation_rules: List[Dict[str, Any]] = []

class AttributeMappingCreate(AttributeMappingBase):
    connection_id: int

class AttributeMappingUpdate(BaseModel):
    source_attribute: Optional[str] = None
    target_attribute: Optional[str] = None
    transformation_rule: Optional[Dict[str, Any]] = None
    is_required: Optional[bool] = None
    is_sensitive: Optional[bool] = None
    data_type: Optional[str] = None
    validation_rules: Optional[List[Dict[str, Any]]] = None

class AttributeMappingResponse(AttributeMappingBase):
    id: int
    connection_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PIPSyncLogResponse(BaseModel):
    id: int
    connection_id: int
    sync_type: str
    status: str
    records_processed: int
    records_synced: int
    records_failed: int
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MCPConnectionBase(BaseModel):
    name: str
    description: Optional[str] = None
    mcp_server_url: str
    mcp_server_type: str
    configuration: Dict[str, Any]
    credentials: Dict[str, Any]
    sync_enabled: bool = True
    sync_frequency: int = 300

class MCPConnectionCreate(MCPConnectionBase):
    pass

class MCPConnectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    mcp_server_url: Optional[str] = None
    mcp_server_type: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, Any]] = None
    sync_enabled: Optional[bool] = None
    sync_frequency: Optional[int] = None

class MCPConnectionResponse(MCPConnectionBase):
    id: int
    status: ConnectionStatus
    health_status: str
    last_health_check: Optional[datetime] = None
    last_sync: Optional[datetime] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MCPToolBase(BaseModel):
    tool_name: str
    tool_description: Optional[str] = None
    tool_schema: Dict[str, Any]
    is_enabled: bool = True

class MCPToolCreate(MCPToolBase):
    connection_id: int

class MCPToolUpdate(BaseModel):
    tool_name: Optional[str] = None
    tool_description: Optional[str] = None
    tool_schema: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None

class MCPToolResponse(MCPToolBase):
    id: int
    connection_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MCPResourceBase(BaseModel):
    resource_uri: str
    resource_name: str
    resource_type: str
    resource_metadata: Dict[str, Any] = {}
    is_enabled: bool = True

class MCPResourceCreate(MCPResourceBase):
    connection_id: int

class MCPResourceUpdate(BaseModel):
    resource_uri: Optional[str] = None
    resource_name: Optional[str] = None
    resource_type: Optional[str] = None
    resource_metadata: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None

class MCPResourceResponse(MCPResourceBase):
    id: int
    connection_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IntegrationTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    connection_type: ConnectionType
    provider: str
    template_config: Dict[str, Any]
    required_credentials: List[str] = []
    attribute_mappings: List[Dict[str, Any]] = []
    is_built_in: bool = True
    is_active: bool = True

class IntegrationTemplateCreate(IntegrationTemplateBase):
    pass

class IntegrationTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    template_config: Optional[Dict[str, Any]] = None
    required_credentials: Optional[List[str]] = None
    attribute_mappings: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None

class IntegrationTemplateResponse(IntegrationTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- PIP Health Check Schemas ---
class HealthCheckRequest(BaseModel):
    connection_id: int
    check_type: str = "full"  # full, quick, credentials

class HealthCheckResponse(BaseModel):
    connection_id: int
    status: str  # healthy, unhealthy, unknown
    response_time: float
    error_message: Optional[str] = None
    checked_at: datetime
    details: Dict[str, Any] = {}

# --- PIP Sync Schemas ---
class SyncRequest(BaseModel):
    connection_id: int
    sync_type: str = "incremental"  # full, incremental, health_check
    force: bool = False

class SyncResponse(BaseModel):
    connection_id: int
    sync_id: int
    status: str
    records_processed: int
    records_synced: int
    records_failed: int
    duration_seconds: float
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

# --- PIP Test Connection Schemas ---
class TestConnectionRequest(BaseModel):
    connection_type: ConnectionType
    provider: str
    configuration: Dict[str, Any]
    credentials: Dict[str, Any]

class TestConnectionResponse(BaseModel):
    success: bool
    status: str
    response_time: float
    error_message: Optional[str] = None
    details: Dict[str, Any] = {}
    tested_at: datetime

# --- Auth-Specific Configuration Schemas ---
class APIKeyAuthConfig(BaseModel):
    """API Key authentication configuration"""
    api_base_url: str
    api_key: str
    header_name: str = "X-API-Key"  # or "Authorization"
    header_prefix: Optional[str] = None  # e.g., "ApiKey" for "ApiKey {key}"

class BearerTokenAuthConfig(BaseModel):
    """Bearer Token authentication configuration"""
    api_base_url: str
    bearer_token: str
    header_name: str = "Authorization"

class BasicAuthConfig(BaseModel):
    """Username/Password authentication configuration"""
    login_url: str
    api_base_url: Optional[str] = None
    username: str
    password: str
    auth_header_name: str = "Authorization"  # For session token after login
    session_token_path: Optional[str] = None  # JSON path to extract token from login response

class OAuthAuthConfig(BaseModel):
    """OAuth 2.0 authentication configuration"""
    auth_url: str
    token_url: str
    api_base_url: Optional[str] = None
    client_id: str
    client_secret: str
    scopes: str
    redirect_uri: Optional[str] = None

class CertificateAuthConfig(BaseModel):
    """Client Certificate authentication configuration"""
    api_base_url: str
    certificate: str  # PEM format
    private_key: str  # PEM format
    passphrase: Optional[str] = None
    ca_bundle: Optional[str] = None  # Optional CA bundle for verification
