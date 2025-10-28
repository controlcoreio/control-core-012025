from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "Control Core Multi-Tenant Control Plane"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    
    # Database settings
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/control_core_multi_tenant"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 30
    
    # Redis settings
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: Optional[str] = None
    
    # Security settings
    SECRET_KEY: str = "your-secret-key-here"
    JWT_SECRET_KEY: str = "your-jwt-secret-key-here"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = [
        "https://controlcore.io",
        "https://app.controlcore.io",
        "https://controlplane.controlcore.io"
    ]
    ALLOWED_HOSTS: List[str] = [
        "controlplane.controlcore.io",
        "*.controlcore.io",
        "localhost",
        "127.0.0.1"
    ]
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 1000
    RATE_LIMIT_WINDOW: int = 3600  # 1 hour
    
    # Tenant settings
    MAX_TENANTS_PER_PLAN: dict = {
        "pro": 1,
        "custom": 10
    }
    TENANT_ISOLATION_LEVEL: str = "database"  # database, schema, table
    
    # Monitoring settings
    MONITORING_ENABLED: bool = True
    METRICS_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"
    
    # AWS settings
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    
    # S3 settings for tenant data
    S3_BUCKET: str = "control-core-tenant-data"
    S3_PREFIX: str = "tenants/"
    
    # Email settings
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@controlcore.io"
    
    # Stripe settings
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Auth0 settings
    AUTH0_DOMAIN: Optional[str] = None
    AUTH0_CLIENT_ID: Optional[str] = None
    AUTH0_CLIENT_SECRET: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
