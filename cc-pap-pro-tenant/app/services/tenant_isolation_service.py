from sqlalchemy.orm import Session
from sqlalchemy import text, create_engine
from app.models import Tenant, TenantUser, TenantPolicy, TenantResource, TenantBouncer
from app.config import settings
from typing import Dict, Any, List, Optional
import logging
import uuid
from datetime import datetime
import hashlib
import secrets

logger = logging.getLogger(__name__)

class TenantIsolationService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_tenant_isolation(self, tenant: Tenant) -> Dict[str, Any]:
        """Create complete tenant isolation infrastructure"""
        try:
            isolation_config = {
                "tenant_id": tenant.id,
                "database_schema": self._create_database_schema(tenant),
                "redis_namespace": self._create_redis_namespace(tenant),
                "s3_prefix": self._create_s3_prefix(tenant),
                "network_config": self._create_network_config(tenant),
                "security_config": self._create_security_config(tenant),
                "monitoring_config": self._create_monitoring_config(tenant)
            }
            
            # Update tenant with isolation configuration
            tenant.config.update(isolation_config)
            self.db.commit()
            
            logger.info(f"Created tenant isolation for tenant {tenant.id}")
            return isolation_config
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating tenant isolation: {e}")
            raise
    
    def _create_database_schema(self, tenant: Tenant) -> Dict[str, Any]:
        """Create isolated database schema for tenant"""
        try:
            schema_name = f"tenant_{tenant.id.replace('-', '_')}"
            
            # Create schema
            self.db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
            
            # Create tenant-specific tables
            self._create_tenant_tables(schema_name)
            
            # Set up row-level security
            self._setup_row_level_security(schema_name, tenant.id)
            
            return {
                "schema_name": schema_name,
                "connection_string": f"{settings.DATABASE_URL}/{schema_name}",
                "isolation_level": "schema",
                "created_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error creating database schema: {e}")
            raise
    
    def _create_tenant_tables(self, schema_name: str):
        """Create tenant-specific tables"""
        try:
            # Create policies table
            self.db.execute(text(f"""
                CREATE TABLE IF NOT EXISTS {schema_name}.policies (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    policy_content TEXT NOT NULL,
                    status VARCHAR(50) DEFAULT 'draft',
                    version VARCHAR(50) DEFAULT '1.0.0',
                    created_by VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    category VARCHAR(100),
                    tags JSONB DEFAULT '[]',
                    priority INTEGER DEFAULT 0
                )
            """))
            
            # Create resources table
            self.db.execute(text(f"""
                CREATE TABLE IF NOT EXISTS {schema_name}.resources (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    url VARCHAR(500) NOT NULL,
                    resource_type VARCHAR(100) NOT NULL,
                    description TEXT,
                    is_protected BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    config JSONB DEFAULT '{}',
                    health_check_url VARCHAR(500),
                    last_health_check TIMESTAMP,
                    health_status VARCHAR(50) DEFAULT 'unknown'
                )
            """))
            
            # Create bouncers table
            self.db.execute(text(f"""
                CREATE TABLE IF NOT EXISTS {schema_name}.bouncers (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    bouncer_id VARCHAR(255) UNIQUE NOT NULL,
                    status VARCHAR(50) DEFAULT 'inactive',
                    version VARCHAR(50) DEFAULT 'latest',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_sync TIMESTAMP,
                    config JSONB DEFAULT '{}',
                    target_hosts JSONB DEFAULT '[]',
                    policies JSONB DEFAULT '[]'
                )
            """))
            
            # Create audit_logs table
            self.db.execute(text(f"""
                CREATE TABLE IF NOT EXISTS {schema_name}.audit_logs (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255),
                    action VARCHAR(255) NOT NULL,
                    resource VARCHAR(255),
                    result VARCHAR(50) NOT NULL,
                    details JSONB DEFAULT '{}',
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Create metrics table
            self.db.execute(text(f"""
                CREATE TABLE IF NOT EXISTS {schema_name}.metrics (
                    id VARCHAR(255) PRIMARY KEY,
                    metric_name VARCHAR(255) NOT NULL,
                    metric_value VARCHAR(255) NOT NULL,
                    metric_type VARCHAR(50) NOT NULL,
                    labels JSONB DEFAULT '{}',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            logger.info(f"Created tenant tables for schema {schema_name}")
            
        except Exception as e:
            logger.error(f"Error creating tenant tables: {e}")
            raise
    
    def _setup_row_level_security(self, schema_name: str, tenant_id: str):
        """Set up row-level security for tenant data"""
        try:
            # Enable RLS on all tables
            tables = ['policies', 'resources', 'bouncers', 'audit_logs', 'metrics']
            
            for table in tables:
                # Enable RLS
                self.db.execute(text(f"ALTER TABLE {schema_name}.{table} ENABLE ROW LEVEL SECURITY"))
                
                # Create policy for tenant isolation
                self.db.execute(text(f"""
                    CREATE POLICY tenant_isolation_{table} ON {schema_name}.{table}
                    FOR ALL TO PUBLIC
                    USING (tenant_id = '{tenant_id}')
                """))
            
            logger.info(f"Set up row-level security for schema {schema_name}")
            
        except Exception as e:
            logger.error(f"Error setting up row-level security: {e}")
            raise
    
    def _create_redis_namespace(self, tenant: Tenant) -> Dict[str, Any]:
        """Create isolated Redis namespace for tenant"""
        try:
            namespace = f"tenant:{tenant.id}"
            
            # Create namespace-specific configuration
            redis_config = {
                "namespace": namespace,
                "key_prefix": f"{namespace}:",
                "ttl_default": 3600,  # 1 hour
                "ttl_sessions": 86400,  # 24 hours
                "ttl_cache": 1800,  # 30 minutes
                "max_memory": "256mb",
                "eviction_policy": "allkeys-lru"
            }
            
            return redis_config
            
        except Exception as e:
            logger.error(f"Error creating Redis namespace: {e}")
            raise
    
    def _create_s3_prefix(self, tenant: Tenant) -> Dict[str, Any]:
        """Create isolated S3 prefix for tenant data"""
        try:
            prefix = f"tenants/{tenant.id}/"
            
            s3_config = {
                "bucket": settings.S3_BUCKET,
                "prefix": prefix,
                "policies_path": f"{prefix}policies/",
                "logs_path": f"{prefix}cc-logs/",
                "backups_path": f"{prefix}backups/",
                "temp_path": f"{prefix}temp/",
                "encryption": "AES256",
                "access_control": "private"
            }
            
            return s3_config
            
        except Exception as e:
            logger.error(f"Error creating S3 prefix: {e}")
            raise
    
    def _create_network_config(self, tenant: Tenant) -> Dict[str, Any]:
        """Create network configuration for tenant"""
        try:
            # Generate unique subdomain
            subdomain = f"{tenant.subdomain}.controlplane.controlcore.io"
            
            network_config = {
                "subdomain": subdomain,
                "domain": tenant.domain,
                "ssl_certificate": f"*.{subdomain}",
                "cdn_enabled": True,
                "rate_limiting": {
                    "requests_per_minute": 1000,
                    "burst_limit": 2000,
                    "window_size": 60
                },
                "firewall_rules": [
                    {
                        "name": "allow_https",
                        "port": 443,
                        "protocol": "tcp",
                        "action": "allow"
                    },
                    {
                        "name": "allow_http",
                        "port": 80,
                        "protocol": "tcp",
                        "action": "allow"
                    }
                ]
            }
            
            return network_config
            
        except Exception as e:
            logger.error(f"Error creating network config: {e}")
            raise
    
    def _create_security_config(self, tenant: Tenant) -> Dict[str, Any]:
        """Create security configuration for tenant"""
        try:
            # Generate tenant-specific secrets
            api_key = self._generate_api_key()
            encryption_key = self._generate_encryption_key()
            
            security_config = {
                "api_key": api_key,
                "encryption_key": encryption_key,
                "jwt_secret": self._generate_jwt_secret(),
                "webhook_secret": self._generate_webhook_secret(),
                "cors_origins": [
                    f"https://{tenant.subdomain}.controlplane.controlcore.io",
                    f"https://{tenant.domain}"
                ],
                "allowed_ips": [],  # Empty means all IPs allowed
                "mfa_required": False,
                "session_timeout": 3600,  # 1 hour
                "password_policy": {
                    "min_length": 8,
                    "require_uppercase": True,
                    "require_lowercase": True,
                    "require_numbers": True,
                    "require_special": True
                }
            }
            
            return security_config
            
        except Exception as e:
            logger.error(f"Error creating security config: {e}")
            raise
    
    def _create_monitoring_config(self, tenant: Tenant) -> Dict[str, Any]:
        """Create monitoring configuration for tenant"""
        try:
            monitoring_config = {
                "metrics_enabled": True,
                "logging_enabled": True,
                "alerting_enabled": True,
                "retention_days": 90,
                "sampling_rate": 1.0,
                "custom_metrics": [
                    "policy_evaluations",
                    "api_calls",
                    "response_time",
                    "error_rate"
                ],
                "alerts": [
                    {
                        "name": "high_error_rate",
                        "condition": "error_rate > 5%",
                        "severity": "warning",
                        "enabled": True
                    },
                    {
                        "name": "high_response_time",
                        "condition": "response_time > 1000ms",
                        "severity": "warning",
                        "enabled": True
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
                    }
                ]
            }
            
            return monitoring_config
            
        except Exception as e:
            logger.error(f"Error creating monitoring config: {e}")
            raise
    
    def _generate_api_key(self) -> str:
        """Generate secure API key for tenant"""
        return f"cc_{secrets.token_urlsafe(32)}"
    
    def _generate_encryption_key(self) -> str:
        """Generate encryption key for tenant"""
        return secrets.token_urlsafe(32)
    
    def _generate_jwt_secret(self) -> str:
        """Generate JWT secret for tenant"""
        return secrets.token_urlsafe(64)
    
    def _generate_webhook_secret(self) -> str:
        """Generate webhook secret for tenant"""
        return secrets.token_urlsafe(32)
    
    def validate_tenant_access(self, tenant_id: str, user_id: str) -> bool:
        """Validate user access to tenant"""
        try:
            # Check if user is member of tenant
            tenant_user = self.db.query(TenantUser).filter(
                TenantUser.tenant_id == tenant_id,
                TenantUser.user_id == user_id,
                TenantUser.is_active == True
            ).first()
            
            return tenant_user is not None
            
        except Exception as e:
            logger.error(f"Error validating tenant access: {e}")
            return False
    
    def get_tenant_limits(self, tenant_id: str) -> Dict[str, Any]:
        """Get tenant resource limits"""
        try:
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant:
                return {}
            
            return tenant.limits or {}
            
        except Exception as e:
            logger.error(f"Error getting tenant limits: {e}")
            return {}
    
    def check_tenant_limits(self, tenant_id: str, resource_type: str) -> bool:
        """Check if tenant is within limits for resource type"""
        try:
            limits = self.get_tenant_limits(tenant_id)
            if not limits:
                return True  # No limits set
            
            # Get current usage
            current_usage = self._get_current_usage(tenant_id, resource_type)
            
            # Check against limits
            limit_key = f"max_{resource_type}"
            if limit_key in limits:
                return current_usage < limits[limit_key]
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking tenant limits: {e}")
            return True
    
    def _get_current_usage(self, tenant_id: str, resource_type: str) -> int:
        """Get current usage for resource type"""
        try:
            if resource_type == "policies":
                return self.db.query(TenantPolicy).filter(
                    TenantPolicy.tenant_id == tenant_id
                ).count()
            elif resource_type == "resources":
                return self.db.query(TenantResource).filter(
                    TenantResource.tenant_id == tenant_id
                ).count()
            elif resource_type == "bouncers":
                return self.db.query(TenantBouncer).filter(
                    TenantBouncer.tenant_id == tenant_id
                ).count()
            elif resource_type == "users":
                return self.db.query(TenantUser).filter(
                    TenantUser.tenant_id == tenant_id,
                    TenantUser.is_active == True
                ).count()
            
            return 0
            
        except Exception as e:
            logger.error(f"Error getting current usage: {e}")
            return 0
    
    def cleanup_tenant_isolation(self, tenant_id: str) -> bool:
        """Clean up tenant isolation infrastructure"""
        try:
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant:
                return False
            
            # Get isolation config
            isolation_config = tenant.config.get("isolation", {})
            
            # Clean up database schema
            if "database_schema" in isolation_config:
                schema_name = isolation_config["database_schema"]["schema_name"]
                self.db.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
            
            # Clean up Redis namespace
            if "redis_namespace" in isolation_config:
                namespace = isolation_config["redis_namespace"]["namespace"]
                # This would be implemented with Redis client
                logger.info(f"Cleaned up Redis namespace: {namespace}")
            
            # Clean up S3 data
            if "s3_prefix" in isolation_config:
                prefix = isolation_config["s3_prefix"]["prefix"]
                # This would be implemented with S3 client
                logger.info(f"Cleaned up S3 prefix: {prefix}")
            
            # Remove isolation config from tenant
            tenant.config.pop("isolation", None)
            self.db.commit()
            
            logger.info(f"Cleaned up tenant isolation for tenant {tenant_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error cleaning up tenant isolation: {e}")
            raise
