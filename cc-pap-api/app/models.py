from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, JSON, Enum, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, foreign
from app.database import Base
import enum

# User Management Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    username = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    status = Column(String, nullable=False, default="active")  # active, inactive
    last_login = Column(DateTime)
    mfa_enabled = Column(Boolean, default=False)
    permissions = Column(JSON, default=list)
    subscription_tier = Column(String, default="kickstart")  # kickstart, pro, custom
    deployment_model = Column(String, default="hosted")  # hosted, self-hosted
    github_repo = Column(String)  # Single GitHub repo for all environments (uses folder structure)
    api_key_sandbox = Column(String)  # Sandbox environment API key
    api_key_production = Column(String)  # Production environment API key
    user_source = Column(String, default="local")  # local, saml, oidc, oauth2
    force_password_change = Column(Boolean, default=False)
    active_sessions = Column(Integer, default=0)
    last_activity = Column(DateTime)
    last_ip_address = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Session Management for NIST/FedRAMP/SOC2 Compliance
class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    jti = Column(String, nullable=False, unique=True, index=True)  # JWT ID - unique identifier for the token
    token_hash = Column(String, nullable=False)  # Hash of the actual token for verification
    ip_address = Column(String)
    user_agent = Column(String)
    created_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=False, index=True)
    revoked = Column(Boolean, default=False, index=True)
    revoked_at = Column(DateTime)
    revoked_by = Column(Integer, ForeignKey('users.id'))
    revoke_reason = Column(String)

# Policy Management Models
class Policy(Base):
    __tablename__ = "policies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, nullable=False, default="draft")  # enabled, disabled, draft, archived
    environment = Column(String, default="sandbox", index=True)  # sandbox, production, both
    sandbox_status = Column(String, default="not-promoted")  # enabled, disabled, draft, not-promoted
    production_status = Column(String, default="not-promoted")  # enabled, disabled, not-promoted
    promoted_from_sandbox = Column(Boolean, default=False, index=True)  # Track if policy was promoted
    promoted_at = Column(DateTime)  # When policy was promoted to production
    promoted_by = Column(String)  # User who promoted the policy
    scope = Column(JSON, default=list)
    effect = Column(String, nullable=False)  # allow, deny
    resource_id = Column(String)
    bouncer_id = Column(String)  # PEP binding - which bouncer enforces this policy
    folder = Column(String, default="enabled")  # enabled, disabled, drafts - GitHub folder location
    rego_code = Column(Text)  # Store the actual Rego code
    context_config = Column(JSON)  # Context enrichment, actions, and response modifications
    version = Column(String, default="1.0.0")
    created_by = Column(String, nullable=False)
    modified_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    last_modified = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Resource Protection Models
class ProtectedResource(Base):
    __tablename__ = "protected_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    original_host = Column(String)
    original_host_production = Column(String)
    default_security_posture = Column(String, default="deny-all")  # allow-all, deny-all
    description = Column(Text)
    environment = Column(String, default="sandbox")  # sandbox, production
    
    # Auto-discovery fields
    auto_discovered = Column(Boolean, default=False, index=True)
    discovered_at = Column(DateTime)
    bouncer_id = Column(Integer, ForeignKey('peps.id'), nullable=True, index=True)
    
    # Resource enrichment fields (user-configurable)
    business_context = Column(Text)  # Business purpose description
    data_classification = Column(String)  # public, internal, confidential, restricted
    compliance_tags = Column(JSON, default=list)  # GDPR, HIPAA, SOC2, etc.
    cost_center = Column(String)
    owner_email = Column(String)
    owner_team = Column(String)
    sla_tier = Column(String)  # gold, silver, bronze
    data_residency = Column(String)  # us, eu, asia-pacific, etc.
    audit_level = Column(String)  # none, basic, detailed, comprehensive
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationship
    bouncer = relationship("PEP", back_populates="protected_resources")

# PEP Management Models (The Bouncer)
class PEP(Base):
    __tablename__ = "peps"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="active")  # active, inactive, error
    environment = Column(String, nullable=False)
    current_load = Column(Float, default=0.0)
    max_capacity = Column(Float, default=100.0)
    response_time = Column(Float, default=0.0)
    last_health_check = Column(DateTime)
    
    # Enhanced Bouncer Configuration
    deployment_mode = Column(String, default="reverse-proxy")  # reverse-proxy, sidecar
    target_url = Column(String)  # URL of the resource being protected
    proxy_url = Column(String)   # Public URL for the Bouncer proxy
    
    # DNS Configuration (for reverse-proxy mode)
    dns_domain = Column(String)
    dns_subdomain = Column(String)
    dns_provider = Column(String, default="Cloudflare")
    dns_ttl = Column(Integer, default=300)
    dns_cname_record = Column(String)
    dns_a_record = Column(String)
    
    # SSL Configuration
    ssl_enabled = Column(Boolean, default=True)
    ssl_certificate_type = Column(String, default="letsencrypt")  # letsencrypt, custom, self-signed
    ssl_certificate_path = Column(String)
    ssl_key_path = Column(String)
    ssl_auto_renew = Column(Boolean, default=True)
    
    # Traffic Configuration
    ingress_enabled = Column(Boolean, default=True)
    egress_enabled = Column(Boolean, default=True)
    rate_limit_per_minute = Column(Integer, default=1000)
    max_connections = Column(Integer, default=500)
    timeout_seconds = Column(Integer, default=30)
    retry_attempts = Column(Integer, default=3)
    
    # Bouncer-specific settings
    bouncer_id = Column(String, unique=True, index=True)
    bouncer_version = Column(String, default="v2.1.0")
    resources_protected = Column(Integer, default=0)
    requests_per_hour = Column(Integer, default=0)
    
    # Health check and connection status
    is_connected = Column(Boolean, default=False)
    intercepting_traffic = Column(Boolean, default=False)
    last_heartbeat = Column(DateTime)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationship
    protected_resources = relationship("ProtectedResource", back_populates="bouncer")

# Environment Management Models
class Environment(Base):
    __tablename__ = "environments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, nullable=False, default="active")  # active, inactive
    pdp_count = Column(Integer, default=0)
    type = Column(String, nullable=False)  # development, production
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Audit and Monitoring Models
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    resource = Column(String)
    resource_type = Column(String)  # user, policy, pep, resource, system
    result = Column(String, nullable=False)  # success, failure
    event_type = Column(String, nullable=False, index=True)
    outcome = Column(String, nullable=False)  # PERMIT, DENY, SUCCESS, FAILURE
    policy_name = Column(String)
    reason = Column(Text)
    environment = Column(String, default="sandbox", index=True)  # sandbox, production
    source_ip = Column(String)
    user_agent = Column(String)
    session_id = Column(String)
    created_at = Column(DateTime, default=func.now())

# Integration Models
class Integration(Base):
    __tablename__ = "integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # pip, gateway, ai_agent
    status = Column(String, nullable=False, default="active")  # active, inactive, error
    configuration = Column(JSON)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Policy Templates Models
class PolicyTemplate(Base):
    __tablename__ = "policy_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String, nullable=False)  # Compliance, Security Framework, Industry Standard
    subcategory = Column(String)  # GDPR, HIPAA, SOC 2, NIST, ISO 27001, PCI DSS, Zero Trust
    template_content = Column(Text, nullable=False)
    variables = Column(JSON, default=list)
    template_metadata = Column(JSON, default=dict)  # Rich metadata: summary, detailed_description, use_cases, conditions, requirements, deployment_notes, compliance_frameworks, risk_level, version
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Decision Engine Models
class DecisionRequest(Base):
    __tablename__ = "decision_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    action = Column(String, nullable=False)
    context = Column(JSON, default=dict)
    decision = Column(String, nullable=False)  # PERMIT, DENY
    reason = Column(Text)
    policy_name = Column(String)
    environment = Column(String, default="sandbox", index=True)  # sandbox, production
    evaluation_time = Column(Float)
    timestamp = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())

# AI Agent Control Models
class AIAgent(Base):
    __tablename__ = "ai_agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # llm, rag, custom, prompt_engine
    provider = Column(String, nullable=False)  # openai, anthropic, google, azure, custom
    model = Column(String)  # gpt-4, claude-3, gemini-pro, etc.
    endpoint = Column(String, nullable=False)
    api_key_encrypted = Column(String)
    capabilities = Column(JSON, default=list)  # text_generation, image_analysis, code_generation, etc.
    context_window = Column(Integer, default=4096)
    max_tokens = Column(Integer, default=2048)
    temperature = Column(Float, default=0.7)
    status = Column(String, default="active")  # active, inactive, error
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Content Injection Models
class ContentInjection(Base):
    __tablename__ = "content_injections"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # prompt_modification, context_addition, response_filtering, data_masking
    target_agent_id = Column(Integer, ForeignKey("ai_agents.id"))
    injection_point = Column(String, nullable=False)  # pre_prompt, post_prompt, pre_response, post_response
    content_template = Column(Text, nullable=False)
    conditions = Column(JSON, default=dict)  # When to apply this injection
    priority = Column(Integer, default=100)
    status = Column(String, default="active")  # active, inactive
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    agent = relationship("AIAgent", back_populates="content_injections")

# RAG System Models
class RAGSystem(Base):
    __tablename__ = "rag_systems"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # vector_db, knowledge_base, document_store
    provider = Column(String, nullable=False)  # pinecone, weaviate, chroma, elasticsearch
    endpoint = Column(String, nullable=False)
    api_key_encrypted = Column(String)
    collection_name = Column(String)
    embedding_model = Column(String, default="text-embedding-ada-002")
    chunk_size = Column(Integer, default=1000)
    chunk_overlap = Column(Integer, default=200)
    retrieval_strategy = Column(String, default="similarity")  # similarity, hybrid, rerank
    max_results = Column(Integer, default=5)
    similarity_threshold = Column(Float, default=0.7)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Context Engineering Models
class ContextRule(Base):
    __tablename__ = "context_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    agent_id = Column(Integer, ForeignKey("ai_agents.id"))
    rag_system_id = Column(Integer, ForeignKey("rag_systems.id"))
    rule_type = Column(String, nullable=False)  # context_filtering, data_enrichment, prompt_engineering
    conditions = Column(JSON, default=dict)
    actions = Column(JSON, default=dict)
    priority = Column(Integer, default=100)
    status = Column(String, default="active")
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# AI Policy Templates
class AIPolicyTemplate(Base):
    __tablename__ = "ai_policy_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String, nullable=False)  # AI_Safety, AI_Governance, AI_Compliance, AI_Security
    subcategory = Column(String)  # Prompt_Injection, Data_Privacy, Model_Bias, Content_Filtering
    use_case = Column(String, nullable=False)  # customer_service, content_generation, data_analysis, code_generation
    template_content = Column(Text, nullable=False)
    injection_templates = Column(JSON, default=list)
    context_rules = Column(JSON, default=list)
    variables = Column(JSON, default=list)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Add relationships
AIAgent.content_injections = relationship("ContentInjection", back_populates="agent")

# Stripe Integration Models
class StripeProduct(Base):
    __tablename__ = "stripe_products"
    
    id = Column(Integer, primary_key=True, index=True)
    stripe_product_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    tier = Column(String, nullable=False)  # kickstart, pro, custom
    features = Column(JSON, default=list)
    limits = Column(JSON, default=dict)
    status = Column(String, default="active")  # active, inactive
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class StripePrice(Base):
    __tablename__ = "stripe_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    stripe_price_id = Column(String, unique=True, nullable=False)
    product_id = Column(Integer, ForeignKey("stripe_products.id"))
    amount = Column(Integer, nullable=False)  # Amount in cents
    currency = Column(String, default="usd")
    interval = Column(String, nullable=False)  # month, year, one_time
    interval_count = Column(Integer, default=1)
    trial_period_days = Column(Integer, default=0)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    product = relationship("StripeProduct")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stripe_subscription_id = Column(String, unique=True, nullable=False)
    stripe_customer_id = Column(String, nullable=False)
    status = Column(String, nullable=False)  # active, canceled, past_due, incomplete
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    cancel_at_period_end = Column(Boolean, default=False)
    trial_start = Column(DateTime)
    trial_end = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User")

class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stripe_payment_method_id = Column(String, unique=True, nullable=False)
    type = Column(String, nullable=False)  # card, bank_account
    brand = Column(String)  # visa, mastercard, etc.
    last4 = Column(String)
    exp_month = Column(Integer)
    exp_year = Column(Integer)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User")

# Auth0 Integration Models
class Auth0User(Base):
    __tablename__ = "auth0_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    auth0_user_id = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=False)
    email_verified = Column(Boolean, default=False)
    connection = Column(String, nullable=False)  # Username-Password-Authentication, magic-link, etc.
    last_login = Column(DateTime)
    login_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User")

class MagicLink(Base):
    __tablename__ = "magic_links"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False)
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    used_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    
class Passkey(Base):
    __tablename__ = "passkeys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    credential_id = Column(String, unique=True, nullable=False)
    public_key = Column(Text, nullable=False)
    counter = Column(Integer, default=0)
    name = Column(String, nullable=False)  # User-friendly name for the passkey
    created_at = Column(DateTime, default=func.now())
    last_used = Column(DateTime)
    
    user = relationship("User")

# SAML Integration Models
class SAMLProvider(Base):
    __tablename__ = "saml_providers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    sso_url = Column(String, nullable=False)
    x509_cert = Column(Text, nullable=False)
    attribute_mapping = Column(JSON, default=dict)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class SAMLUser(Base):
    __tablename__ = "saml_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    saml_provider_id = Column(Integer, ForeignKey("saml_providers.id"))
    saml_name_id = Column(String, nullable=False)
    attributes = Column(JSON, default=dict)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User")
    saml_provider = relationship("SAMLProvider")

# PIP (Policy Information Point) Models
class ConnectionType(str, enum.Enum):
    IAM = "iam"
    HR = "hr"
    CRM = "crm"
    ERP = "erp"
    CSM = "csm"
    CLOUD = "cloud"
    CMDB = "cmdb"
    DATABASE = "database"
    WAREHOUSE = "warehouse"
    API = "api"
    DOCUMENTS = "documents"
    STATIC = "static"
    OPENAPI = "openapi"
    MCP = "mcp"
    CUSTOM = "custom"

class ConnectionStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PENDING = "pending"

class PIPConnection(Base):
    __tablename__ = "pip_connections"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    connection_type = Column(Enum(ConnectionType), nullable=False)
    provider = Column(String, nullable=False)  # auth0, okta, salesforce, etc.
    status = Column(Enum(ConnectionStatus), default=ConnectionStatus.PENDING)
    configuration = Column(JSON, nullable=False)  # Connection-specific config
    credentials = Column(JSON, nullable=False)  # Encrypted credentials
    environment = Column(String, nullable=False, index=True)  # sandbox or production (no "both")
    sandbox_endpoint = Column(String)  # Optional separate endpoint for sandbox
    production_endpoint = Column(String)  # Optional separate endpoint for production
    health_check_url = Column(String)
    last_health_check = Column(DateTime)
    health_status = Column(String, default="unknown")  # healthy, unhealthy, unknown
    sync_enabled = Column(Boolean, default=True)
    sync_frequency = Column(Integer, default=300)  # seconds
    last_sync = Column(DateTime)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    attribute_mappings = relationship("AttributeMapping", back_populates="connection")
    sync_logs = relationship("PIPSyncLog", back_populates="connection")

class AttributeMapping(Base):
    __tablename__ = "attribute_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, ForeignKey("pip_connections.id"), nullable=False)
    source_attribute = Column(String, nullable=False)  # Attribute from source system
    target_attribute = Column(String, nullable=False)  # Attribute in Control Core
    transformation_rule = Column(JSON, default=dict)  # Transformation logic
    is_required = Column(Boolean, default=False)
    is_sensitive = Column(Boolean, default=False)
    data_type = Column(String, default="string")  # string, number, boolean, array, object
    validation_rules = Column(JSON, default=list)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    connection = relationship("PIPConnection", back_populates="attribute_mappings")

class PIPSyncLog(Base):
    __tablename__ = "pip_sync_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, ForeignKey("pip_connections.id"), nullable=False)
    sync_type = Column(String, nullable=False)  # full, incremental, health_check
    status = Column(String, nullable=False)  # success, error, partial
    records_processed = Column(Integer, default=0)
    records_synced = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    error_message = Column(Text)
    duration_seconds = Column(Float)
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)
    
    # Relationships
    connection = relationship("PIPConnection", back_populates="sync_logs")

class MCPConnection(Base):
    __tablename__ = "mcp_connections"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    mcp_server_url = Column(String, nullable=False)
    mcp_server_type = Column(String, nullable=False)  # tools, resources, prompts
    configuration = Column(JSON, nullable=False)
    credentials = Column(JSON, nullable=False)
    status = Column(Enum(ConnectionStatus), default=ConnectionStatus.PENDING)
    health_check_url = Column(String)
    last_health_check = Column(DateTime)
    health_status = Column(String, default="unknown")
    sync_enabled = Column(Boolean, default=True)
    sync_frequency = Column(Integer, default=300)
    last_sync = Column(DateTime)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    mcp_tools = relationship("MCPTool", back_populates="connection")
    mcp_resources = relationship("MCPResource", back_populates="connection")

class MCPTool(Base):
    __tablename__ = "mcp_tools"
    
    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, ForeignKey("mcp_connections.id"), nullable=False)
    tool_name = Column(String, nullable=False)
    tool_description = Column(Text)
    tool_schema = Column(JSON, nullable=False)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    connection = relationship("MCPConnection", back_populates="mcp_tools")

class MCPResource(Base):
    __tablename__ = "mcp_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, ForeignKey("mcp_connections.id"), nullable=False)
    resource_uri = Column(String, nullable=False)
    resource_name = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_metadata = Column(JSON, default=dict)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    connection = relationship("MCPConnection", back_populates="mcp_resources")

# Pre-configured Integration Templates
class IntegrationTemplate(Base):
    __tablename__ = "integration_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    connection_type = Column(Enum(ConnectionType), nullable=False)
    provider = Column(String, nullable=False)
    template_config = Column(JSON, nullable=False)  # Default configuration
    required_credentials = Column(JSON, default=list)  # Required credential fields
    attribute_mappings = Column(JSON, default=list)  # Default attribute mappings
    is_built_in = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# OAuth Token Management
class OAuthToken(Base):
    __tablename__ = "oauth_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, ForeignKey("pip_connections.id"), nullable=False)
    provider = Column(String, nullable=False)  # okta, azure_ad, auth0
    token_type = Column(String, default="Bearer")
    access_token = Column(Text, nullable=False)  # Encrypted
    refresh_token = Column(Text)  # Encrypted
    expires_at = Column(DateTime)
    scope = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    connection = relationship("PIPConnection")

# Webhook Event Tracking
class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    
    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, ForeignKey("pip_connections.id"), nullable=False)
    event_type = Column(String, nullable=False)  # user.created, user.updated, etc.
    event_id = Column(String)  # External event ID
    user_id = Column(String)  # Affected user ID
    source = Column(String, nullable=False)  # okta, azure_ad, auth0
    event_data = Column(JSON)  # Full event payload
    processed = Column(Boolean, default=False)
    processed_at = Column(DateTime)
    error_message = Column(Text)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    connection = relationship("PIPConnection")


# GitHub Configuration for Policy Storage
class GitHubConfiguration(Base):
    __tablename__ = "github_configuration"
    
    id = Column(Integer, primary_key=True, index=True)
    repo_url = Column(String, nullable=False)
    branch = Column(String, default="main")
    access_token = Column(String, nullable=False)  # Should be encrypted in production
    auto_sync = Column(Boolean, default=True)
    sync_interval = Column(Integer, default=5)  # minutes
    webhook_url = Column(String)
    webhook_secret = Column(String)  # Should be encrypted in production
    last_sync_time = Column(DateTime)
    connection_status = Column(String, default="disconnected")  # connected, disconnected, error
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


# OPAL Server Configuration
class OPALConfiguration(Base):
    __tablename__ = "opal_configuration"
    
    id = Column(Integer, primary_key=True, index=True)
    server_url = Column(String, nullable=False)
    client_url = Column(String)
    api_key = Column(String)  # Should be encrypted in production
    broadcast_channel = Column(String, default="policy_updates")
    data_update_interval = Column(Integer, default=10)  # seconds
    enable_statistics = Column(Boolean, default=True)
    connection_status = Column(String, default="disconnected")
    # Environment-aware policy distribution
    sandbox_broadcast_channel = Column(String, default="sandbox_policy_updates")
    production_broadcast_channel = Column(String, default="production_policy_updates")
    environment_aware = Column(Boolean, default=True)  # Automatically distribute to correct environment
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


# Per-Bouncer OPAL Configuration
class BouncerOPALConfiguration(Base):
    __tablename__ = "bouncer_opal_configuration"
    
    id = Column(Integer, primary_key=True, index=True)
    bouncer_id = Column(String, nullable=False, unique=True)
    environment = Column(String, nullable=False, index=True)  # Auto-set from bouncer registration
    policy_filters = Column(JSON, default=list)  # Auto-populated based on environment
    data_filters = Column(JSON, default=list)  # Auto-populated based on environment
    resource_name = Column(String)  # Auto-set from bouncer resource
    cache_enabled = Column(Boolean, default=True)
    cache_ttl = Column(Integer, default=300)  # seconds
    cache_max_size = Column(String, default="100MB")
    rate_limit_rps = Column(Integer, default=100)  # requests per second
    rate_limit_burst = Column(Integer, default=200)
    auto_configured = Column(Boolean, default=True)  # Automatically configured by Control Core
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


# Notification Settings (Environment-specific)
class NotificationSettings(Base):
    __tablename__ = "notification_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    environment = Column(String, nullable=False, index=True)  # sandbox or production
    
    # Alert Rules (environment-specific)
    alert_types = Column(JSON, default=list)  # List of enabled alert types with settings
    
    # Channel Configurations (environment-specific channels, shared credentials)
    email_enabled = Column(Boolean, default=True)
    email_recipients = Column(JSON, default=list)  # Different recipients per environment
    
    slack_enabled = Column(Boolean, default=False)
    slack_channel = Column(String)  # Different channel per environment
    
    servicenow_enabled = Column(Boolean, default=False)
    servicenow_instance = Column(String)  # Different instance per environment
    
    webhook_enabled = Column(Boolean, default=False)
    webhook_url = Column(String)  # Different webhook URL per environment
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")


# Notification Credentials (Shared across environments)
class NotificationCredentials(Base):
    __tablename__ = "notification_credentials"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)
    
    # Slack credentials (shared)
    slack_token = Column(String)  # Should be encrypted in production
    slack_workspace = Column(String)
    
    # ServiceNow credentials (shared)
    servicenow_api_key = Column(String)  # Should be encrypted in production
    servicenow_domain = Column(String)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
