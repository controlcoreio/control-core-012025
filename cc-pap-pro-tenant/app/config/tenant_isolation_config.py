from typing import Dict, Any, List
from enum import Enum

class IsolationLevel(str, Enum):
    DATABASE = "database"
    SCHEMA = "schema"
    TABLE = "table"
    ROW = "row"

class TenantIsolationConfig:
    """Configuration for tenant isolation system"""
    
    # Default isolation settings
    DEFAULT_ISOLATION_LEVEL = IsolationLevel.SCHEMA
    
    # Database isolation settings
    DATABASE_ISOLATION = {
        "enabled": True,
        "schema_prefix": "tenant_",
        "row_level_security": True,
        "connection_pooling": True,
        "max_connections_per_tenant": 10
    }
    
    # Redis isolation settings
    REDIS_ISOLATION = {
        "enabled": True,
        "namespace_prefix": "tenant:",
        "key_ttl": 3600,  # 1 hour
        "max_memory_per_tenant": "256mb",
        "eviction_policy": "allkeys-lru"
    }
    
    # S3 isolation settings
    S3_ISOLATION = {
        "enabled": True,
        "bucket_prefix": "tenants/",
        "encryption": "AES256",
        "access_control": "private",
        "versioning": True
    }
    
    # Network isolation settings
    NETWORK_ISOLATION = {
        "enabled": True,
        "subdomain_routing": True,
        "ssl_certificates": True,
        "cdn_enabled": True,
        "rate_limiting": {
            "requests_per_minute": 1000,
            "burst_limit": 2000,
            "window_size": 60
        }
    }
    
    # Security isolation settings
    SECURITY_ISOLATION = {
        "enabled": True,
        "api_key_isolation": True,
        "jwt_secret_isolation": True,
        "encryption_key_isolation": True,
        "cors_origin_isolation": True,
        "ip_whitelist_isolation": True
    }
    
    # Monitoring isolation settings
    MONITORING_ISOLATION = {
        "enabled": True,
        "metrics_isolation": True,
        "logs_isolation": True,
        "alerts_isolation": True,
        "dashboards_isolation": True,
        "retention_days": 90
    }
    
    # Plan-specific isolation settings
    PLAN_ISOLATION_SETTINGS = {
        "pro": {
            "isolation_level": IsolationLevel.SCHEMA,
            "max_tenants": 1,
            "database_schema": True,
            "redis_namespace": True,
            "s3_prefix": True,
            "network_isolation": True,
            "security_isolation": True,
            "monitoring_isolation": True
        },
        "custom": {
            "isolation_level": IsolationLevel.DATABASE,
            "max_tenants": 10,
            "database_schema": True,
            "redis_namespace": True,
            "s3_prefix": True,
            "network_isolation": True,
            "security_isolation": True,
            "monitoring_isolation": True,
            "dedicated_resources": True
        }
    }
    
    # Resource limits by plan
    PLAN_LIMITS = {
        "pro": {
            "max_policies": 100,
            "max_resources": 50,
            "max_bouncers": 5,
            "max_users": 10,
            "api_calls_per_hour": 10000,
            "policy_evaluations_per_hour": 50000,
            "storage_gb": 10,
            "backup_retention_days": 30
        },
        "custom": {
            "max_policies": 1000,
            "max_resources": 500,
            "max_bouncers": 50,
            "max_users": 100,
            "api_calls_per_hour": 100000,
            "policy_evaluations_per_hour": 500000,
            "storage_gb": 100,
            "backup_retention_days": 90
        }
    }
    
    # Security policies by plan
    SECURITY_POLICIES = {
        "pro": {
            "mfa_required": False,
            "session_timeout": 3600,  # 1 hour
            "password_policy": {
                "min_length": 8,
                "require_uppercase": True,
                "require_lowercase": True,
                "require_numbers": True,
                "require_special": True
            },
            "api_key_rotation": 90,  # days
            "audit_logging": True
        },
        "custom": {
            "mfa_required": True,
            "session_timeout": 7200,  # 2 hours
            "password_policy": {
                "min_length": 12,
                "require_uppercase": True,
                "require_lowercase": True,
                "require_numbers": True,
                "require_special": True,
                "require_no_common": True
            },
            "api_key_rotation": 30,  # days
            "audit_logging": True,
            "compliance_reporting": True
        }
    }
    
    # Monitoring settings by plan
    MONITORING_SETTINGS = {
        "pro": {
            "metrics_enabled": True,
            "logging_enabled": True,
            "alerting_enabled": True,
            "retention_days": 30,
            "sampling_rate": 1.0,
            "custom_metrics": ["policy_evaluations", "api_calls", "response_time"],
            "alerts": [
                {
                    "name": "high_error_rate",
                    "condition": "error_rate > 5%",
                    "severity": "warning"
                }
            ]
        },
        "custom": {
            "metrics_enabled": True,
            "logging_enabled": True,
            "alerting_enabled": True,
            "retention_days": 90,
            "sampling_rate": 1.0,
            "custom_metrics": [
                "policy_evaluations", "api_calls", "response_time", 
                "error_rate", "throughput", "latency"
            ],
            "alerts": [
                {
                    "name": "high_error_rate",
                    "condition": "error_rate > 5%",
                    "severity": "warning"
                },
                {
                    "name": "high_response_time",
                    "condition": "response_time > 1000ms",
                    "severity": "warning"
                },
                {
                    "name": "low_throughput",
                    "condition": "throughput < 100 req/s",
                    "severity": "info"
                }
            ],
            "dashboards": [
                {
                    "name": "overview",
                    "widgets": ["policies", "resources", "bouncers", "metrics"]
                },
                {
                    "name": "performance",
                    "widgets": ["response_time", "throughput", "errors"]
                },
                {
                    "name": "security",
                    "widgets": ["audit_logs", "access_patterns", "anomalies"]
                }
            ]
        }
    }
    
    @classmethod
    def get_isolation_config(cls, plan_type: str) -> Dict[str, Any]:
        """Get isolation configuration for plan type"""
        return cls.PLAN_ISOLATION_SETTINGS.get(plan_type, cls.PLAN_ISOLATION_SETTINGS["pro"])
    
    @classmethod
    def get_plan_limits(cls, plan_type: str) -> Dict[str, Any]:
        """Get resource limits for plan type"""
        return cls.PLAN_LIMITS.get(plan_type, cls.PLAN_LIMITS["pro"])
    
    @classmethod
    def get_security_policies(cls, plan_type: str) -> Dict[str, Any]:
        """Get security policies for plan type"""
        return cls.SECURITY_POLICIES.get(plan_type, cls.SECURITY_POLICIES["pro"])
    
    @classmethod
    def get_monitoring_settings(cls, plan_type: str) -> Dict[str, Any]:
        """Get monitoring settings for plan type"""
        return cls.MONITORING_SETTINGS.get(plan_type, cls.MONITORING_SETTINGS["pro"])
    
    @classmethod
    def validate_tenant_access(cls, tenant_id: str, user_id: str, plan_type: str) -> bool:
        """Validate tenant access based on plan type"""
        config = cls.get_isolation_config(plan_type)
        
        # Check if user has access to tenant
        # This would typically query the database
        # For now, return True
        return True
    
    @classmethod
    def check_tenant_limits(cls, tenant_id: str, resource_type: str, plan_type: str) -> bool:
        """Check if tenant is within limits for resource type"""
        limits = cls.get_plan_limits(plan_type)
        
        # Get current usage
        # This would typically query the database
        current_usage = 0  # Mock value
        
        # Check against limits
        limit_key = f"max_{resource_type}"
        if limit_key in limits:
            return current_usage < limits[limit_key]
        
        return True
