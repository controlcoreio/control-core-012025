"""
PEP Configuration Schemas
Request/Response schemas for PEP configuration management
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Global PEP Configuration Schemas

class GlobalPEPConfigBase(BaseModel):
    # Basic Configuration
    default_proxy_domain: str = Field(default="bouncer.controlcore.io", description="Base domain for bouncer proxy URLs")
    control_plane_url: str = Field(default="https://api.controlcore.io", description="Control Plane base URL")
    
    # Policy Update & Synchronization
    policy_update_interval: int = Field(default=30, ge=10, le=300, description="Policy update interval in seconds")
    bundle_download_timeout: int = Field(default=10, ge=5, le=60, description="Bundle download timeout in seconds")
    policy_checksum_validation: bool = Field(default=True, description="Verify policy bundle integrity")
    
    # Decision Logging & Metrics
    decision_log_export_enabled: bool = Field(default=True, description="Export decision logs to Control Plane")
    decision_log_batch_size: int = Field(default=100, ge=1, le=1000, description="Number of logs to batch")
    decision_log_flush_interval: int = Field(default=5, ge=1, le=30, description="Log flush interval in seconds")
    metrics_export_enabled: bool = Field(default=True, description="Export metrics to Control Plane")
    
    # Enforcement Behavior
    fail_policy: str = Field(default="fail-closed", description="fail-closed or fail-open")
    default_security_posture: str = Field(default="deny-all", description="deny-all or allow-all")
    
    # Performance & Limits
    default_rate_limit: int = Field(default=1000, ge=1, description="Default rate limit (requests/minute)")
    default_timeout: int = Field(default=30, ge=5, le=300, description="Default timeout in seconds")
    max_connections: int = Field(default=500, ge=10, le=10000, description="Max concurrent connections")
    
    # Security & TLS
    auto_ssl_enabled: bool = Field(default=True, description="Auto-provision SSL certificates")
    mutual_tls_required: bool = Field(default=False, description="Require mutual TLS")


class GlobalPEPConfigCreate(GlobalPEPConfigBase):
    tenant_id: str


class GlobalPEPConfigUpdate(BaseModel):
    default_proxy_domain: Optional[str] = None
    control_plane_url: Optional[str] = None
    policy_update_interval: Optional[int] = None
    bundle_download_timeout: Optional[int] = None
    policy_checksum_validation: Optional[bool] = None
    decision_log_export_enabled: Optional[bool] = None
    decision_log_batch_size: Optional[int] = None
    decision_log_flush_interval: Optional[int] = None
    metrics_export_enabled: Optional[bool] = None
    fail_policy: Optional[str] = None
    default_security_posture: Optional[str] = None
    default_rate_limit: Optional[int] = None
    default_timeout: Optional[int] = None
    max_connections: Optional[int] = None
    auto_ssl_enabled: Optional[bool] = None
    mutual_tls_required: Optional[bool] = None


class GlobalPEPConfigResponse(GlobalPEPConfigBase):
    id: int
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Individual PEP Configuration Schemas

class ResourceIdentificationRule(BaseModel):
    type: str = Field(..., description="path_prefix, host_name, or header")
    value: str = Field(..., description="Pattern to match")
    resource_name: str = Field(..., description="Logical resource name")


class IndividualPEPConfigBase(BaseModel):
    # Policy Assignment
    assigned_policy_bundles: List[str] = Field(default=["default"], description="Policy bundles to enforce")
    
    # MCP Context Injection
    mcp_header_name: str = Field(default="X-Model-Context", description="MCP header name")
    mcp_injection_enabled: bool = Field(default=True, description="Enable MCP injection")
    
    # Upstream Service Configuration
    upstream_target_url: Optional[str] = Field(None, description="Target service URL")
    proxy_timeout: int = Field(default=30, ge=5, le=300, description="Proxy timeout in seconds")
    public_proxy_url: Optional[str] = Field(None, description="Public bouncer URL")
    
    # Resource Identification Rules
    resource_identification_rules: List[ResourceIdentificationRule] = Field(default=[], description="Resource ID rules")
    
    # Cache Configuration
    cache_enabled: bool = Field(default=True, description="Enable caching")
    cache_ttl: int = Field(default=300, ge=1, le=3600, description="Cache TTL in seconds")
    cache_max_size: int = Field(default=100, ge=1, le=1000, description="Max cache size in MB")
    cache_invalidation_strategy: str = Field(default="lru", description="lru, lfu, or ttl")
    
    # Circuit Breaker
    circuit_breaker_enabled: bool = Field(default=True, description="Enable circuit breaker")
    circuit_breaker_failure_threshold: int = Field(default=5, ge=1, le=100, description="Failures before opening")
    circuit_breaker_success_threshold: int = Field(default=2, ge=1, le=10, description="Successes before closing")
    circuit_breaker_timeout: int = Field(default=60, ge=10, le=300, description="Timeout in seconds")
    
    # Load Balancing
    load_balancing_algorithm: str = Field(default="round-robin", description="round-robin, least-connections, ip-hash, weighted")
    sticky_sessions_enabled: bool = Field(default=False, description="Enable sticky sessions")
    
    # Overrides (nullable = use global)
    policy_update_interval_override: Optional[int] = None
    fail_policy_override: Optional[str] = None
    rate_limit_override: Optional[int] = None


class IndividualPEPConfigCreate(IndividualPEPConfigBase):
    pep_id: int


class IndividualPEPConfigUpdate(BaseModel):
    assigned_policy_bundles: Optional[List[str]] = None
    mcp_header_name: Optional[str] = None
    mcp_injection_enabled: Optional[bool] = None
    upstream_target_url: Optional[str] = None
    proxy_timeout: Optional[int] = None
    public_proxy_url: Optional[str] = None
    resource_identification_rules: Optional[List[Dict[str, Any]]] = None
    cache_enabled: Optional[bool] = None
    cache_ttl: Optional[int] = None
    cache_max_size: Optional[int] = None
    cache_invalidation_strategy: Optional[str] = None
    circuit_breaker_enabled: Optional[bool] = None
    circuit_breaker_failure_threshold: Optional[int] = None
    circuit_breaker_success_threshold: Optional[int] = None
    circuit_breaker_timeout: Optional[int] = None
    load_balancing_algorithm: Optional[str] = None
    sticky_sessions_enabled: Optional[bool] = None
    policy_update_interval_override: Optional[int] = None
    fail_policy_override: Optional[str] = None
    rate_limit_override: Optional[int] = None


class IndividualPEPConfigResponse(IndividualPEPConfigBase):
    id: int
    pep_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Combined Configuration Response (for PEP to retrieve all configs)
class PEPCompleteConfigResponse(BaseModel):
    """Complete configuration bundle for a PEP including global defaults and individual overrides"""
    pep_id: int
    pep_name: str
    environment: str
    
    # Global settings
    global_config: GlobalPEPConfigResponse
    
    # Individual settings (overrides global where applicable)
    individual_config: Optional[IndividualPEPConfigResponse] = None
    
    # Computed effective configuration (after applying overrides)
    effective_config: Dict[str, Any]

