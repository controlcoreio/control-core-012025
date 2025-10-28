from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
from app.database import get_db, engine, Base
from app.routers import tenants, policies, resources, bouncers, auth, monitoring, tenant_isolation, bouncer_connections, context_ingestion, ai_integration_settings
from app.middleware import TenantMiddleware, RateLimitMiddleware
from app.config import settings
import logging

# Create database tables
Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Control Core Multi-Tenant Control Plane",
    description="Multi-tenant Control Plane for Pro plan customers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Add tenant middleware
app.add_middleware(TenantMiddleware)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Include routers
app.include_router(tenants.router, prefix="/api/v1/tenants", tags=["tenants"])
app.include_router(policies.router, prefix="/api/v1/policies", tags=["policies"])
app.include_router(resources.router, prefix="/api/v1/resources", tags=["resources"])
app.include_router(bouncers.router, prefix="/api/v1/bouncers", tags=["bouncers"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["monitoring"])
app.include_router(tenant_isolation.router, prefix="/api/v1/tenant-isolation", tags=["tenant-isolation"])
app.include_router(bouncer_connections.router, prefix="/api/v1/bouncer-connections", tags=["bouncer-connections"])
app.include_router(context_ingestion.router, prefix="/api/v1", tags=["context-ingestion"])
app.include_router(ai_integration_settings.router, prefix="/api/v1/ai-integration", tags=["ai-integration-settings"])

@app.get("/")
async def root():
    return {
        "message": "Control Core Multi-Tenant Control Plane",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "2024-01-15T10:30:00Z",
        "services": {
            "database": "connected",
            "redis": "connected",
            "monitoring": "active"
        }
    }

@app.get("/api/v1/status")
async def get_system_status():
    return {
        "system": "Control Core Multi-Tenant Control Plane",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "tenant_count": 0,  # This would be calculated from database
        "active_tenants": 0,
        "total_policies": 0,
        "total_bouncers": 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
