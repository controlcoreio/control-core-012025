"""
PEP Configuration Models
Stores global and individual PEP configuration settings
"""

from sqlalchemy import Column, String, Integer, Boolean, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class GlobalPEPConfig(Base):
    """Global configuration settings that apply to all PEPs"""
    __tablename__ = "global_pep_config"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=False)
    
    # Basic Configuration
    default_proxy_domain = Column(String, default="bouncer.controlcore.io")
    control_plane_url = Column(String, default="https://api.controlcore.io")
    
    # Policy Update & Synchronization
    policy_update_interval = Column(Integer, default=30)  # seconds
    bundle_download_timeout = Column(Integer, default=10)  # seconds
    policy_checksum_validation = Column(Boolean, default=True)
    
    # Decision Logging & Metrics
    decision_log_export_enabled = Column(Boolean, default=True)
    decision_log_batch_size = Column(Integer, default=100)
    decision_log_flush_interval = Column(Integer, default=5)  # seconds
    metrics_export_enabled = Column(Boolean, default=True)
    
    # Enforcement Behavior
    fail_policy = Column(String, default="fail-closed")  # fail-closed, fail-open
    default_security_posture = Column(String, default="deny-all")  # deny-all, allow-all
    
    # Performance & Limits
    default_rate_limit = Column(Integer, default=1000)  # requests per minute
    default_timeout = Column(Integer, default=30)  # seconds
    max_connections = Column(Integer, default=500)
    
    # Security & TLS
    auto_ssl_enabled = Column(Boolean, default=True)
    mutual_tls_required = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class IndividualPEPConfig(Base):
    """Configuration settings specific to individual PEP instances"""
    __tablename__ = "individual_pep_config"
    
    id = Column(Integer, primary_key=True, index=True)
    pep_id = Column(Integer, ForeignKey('peps.id'), unique=True, nullable=False)
    
    # Policy Assignment
    assigned_policy_bundles = Column(JSON, default=list)  # ["default", "ai-agent", etc.]
    
    # MCP Context Injection
    mcp_header_name = Column(String, default="X-Model-Context")
    mcp_injection_enabled = Column(Boolean, default=True)
    
    # Upstream Service Configuration
    upstream_target_url = Column(String)
    proxy_timeout = Column(Integer, default=30)  # seconds
    public_proxy_url = Column(String)
    
    # Resource Identification Rules
    resource_identification_rules = Column(JSON, default=list)
    # Format: [{"type": "path_prefix", "value": "/v1/models/", "resource_name": "AI Models API"}, ...]
    
    # Cache Configuration
    cache_enabled = Column(Boolean, default=True)
    cache_ttl = Column(Integer, default=300)  # seconds
    cache_max_size = Column(Integer, default=100)  # MB
    cache_invalidation_strategy = Column(String, default="lru")  # lru, lfu, ttl
    
    # Circuit Breaker
    circuit_breaker_enabled = Column(Boolean, default=True)
    circuit_breaker_failure_threshold = Column(Integer, default=5)
    circuit_breaker_success_threshold = Column(Integer, default=2)
    circuit_breaker_timeout = Column(Integer, default=60)  # seconds
    
    # Load Balancing
    load_balancing_algorithm = Column(String, default="round-robin")
    # Options: round-robin, least-connections, ip-hash, weighted
    sticky_sessions_enabled = Column(Boolean, default=False)
    
    # Override global settings (nullable means use global)
    policy_update_interval_override = Column(Integer, nullable=True)
    fail_policy_override = Column(String, nullable=True)
    rate_limit_override = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

