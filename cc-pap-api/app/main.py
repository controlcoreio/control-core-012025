from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, policies, resources, peps, audit, decisions, dashboard, environments, integrations, ai_agents, ai_templates, auth0, monaco_editor, context_generation, pip, mcp, ai_integration, settings, opal_data, pep_config, opal
from app.database import engine, SessionLocal
from app.models import Base, AuditLog
from app.models_config import GlobalPEPConfig, IndividualPEPConfig
from init_db import populate_control_core_data
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging
import os

# Production middleware imports
from app.middleware.rate_limiter import rate_limit_middleware
from app.middleware.security import security_middleware_handler
from app.middleware.connection_pool import get_pool_manager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize scheduler
scheduler = AsyncIOScheduler()

app = FastAPI(
    title="Control Core PAP API",
    description="Policy Administration Point API for Control Core platform",
    version="1.0.0"
)

# Startup event to initialize connection pools
@app.on_event("startup")
async def startup_event():
    """Initialize production components on startup"""
    try:
        # Initialize connection pools
        pool_manager = get_pool_manager()
        pool_manager.initialize_pools(
            database_url=os.getenv("DATABASE_URL", "sqlite:///./control_core.db"),
            redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
            db_pool_size=int(os.getenv("DB_POOL_SIZE", "20")),
            redis_pool_size=int(os.getenv("REDIS_POOL_SIZE", "50")),
            http_pool_size=int(os.getenv("HTTP_POOL_SIZE", "100"))
        )
        logger.info("Connection pools initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize connection pools: {e}")
        # Continue startup even if pools fail

# Shutdown event to clean up resources
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    try:
        pool_manager = get_pool_manager()
        await pool_manager.close_all_pools()
        logger.info("Connection pools closed successfully")
        
    except Exception as e:
        logger.error(f"Error closing connection pools: {e}")

# Create tables and initialize data if empty
Base.metadata.create_all(bind=engine)
# CRITICAL: Only drop tables if explicitly requested via environment variable
# In production, this should NEVER be True as it deletes all customer data
drop_tables_flag = os.getenv("CC_DROP_TABLES", "false").lower() == "true"
if drop_tables_flag:
    logger.warning("⚠️  CC_DROP_TABLES=true - Database will be reset! This should NEVER happen in production!")
populate_control_core_data(drop_tables=drop_tables_flag)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add production middleware - temporarily disabled rate limiter due to import error
# app.middleware("http")(rate_limit_middleware)
app.middleware("http")(security_middleware_handler)

# Include Control Core routers
app.include_router(auth.router)
app.include_router(policies.router)
app.include_router(resources.router)
app.include_router(peps.router)
app.include_router(pep_config.router)
app.include_router(audit.router)
app.include_router(decisions.router)
app.include_router(dashboard.router)
app.include_router(environments.router)
app.include_router(integrations.router)
app.include_router(ai_agents.router)
app.include_router(ai_templates.router)
app.include_router(auth0.router)
app.include_router(monaco_editor.router)
app.include_router(settings.router)
app.include_router(context_generation.router, prefix="/context", tags=["context-generation"])
app.include_router(pip.router, prefix="/pip", tags=["pip"])
app.include_router(mcp.router, prefix="/mcp", tags=["mcp"])
app.include_router(ai_integration.router, prefix="/ai", tags=["ai-integration"])
app.include_router(opal_data.router)
app.include_router(opal.router)

@app.get("/")
def read_root():
    """API health check and information."""
    return {
        "message": "Control Core PAP API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs",
        "description": "Policy Administration Point for Control Core platform",
                "available_endpoints": {
                    "authentication": "/auth - User authentication and management",
                    "policies": "/policies - Policy management and administration",
                    "resources": "/resources - Protected resource management",
                    "peps": "/peps - Policy Enforcement Point (Bouncer) management",
                    "audit": "/audit - Audit logging and monitoring",
                    "decisions": "/decisions - Access decision evaluation",
                    "dashboard": "/dashboard - Dashboard analytics",
                    "environments": "/environments - Environment management",
                    "integrations": "/integrations - External system integrations",
                    "context_generation": "/context - Advanced context generation and ingestion",
                    "pip": "/pip - Policy Information Point for connections and attribute mapping",
                    "mcp": "/mcp - MCP server detection and smart policy generation",
                    "ai_integration": "/ai - AI integration for enhanced features"
                }
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

async def auto_purge_old_audit_logs():
    """Auto-purge audit logs older than 365 days for SOC2 compliance."""
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=365)
        deleted_count = db.query(AuditLog).filter(
            AuditLog.timestamp < cutoff_date
        ).delete()
        
        if deleted_count > 0:
            logger.info(f"Auto-purged {deleted_count} audit logs older than 365 days")
            
            # Log the purge action
            purge_log = AuditLog(
                user="system",
                action=f"Auto-purged {deleted_count} audit logs older than 365 days",
                resource="Audit Logs",
                resource_type="system",
                result="success",
                event_type="SYSTEM_AUDIT_PURGE",
                outcome="SUCCESS"
            )
            db.add(purge_log)
        
        db.commit()
    except Exception as e:
        logger.error(f"Error during auto-purge: {e}")
        db.rollback()
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    """Initialize scheduled tasks on application startup."""
    logger.info("Starting Control Core PAP API...")
    
    # Schedule daily audit log purge at 2:00 AM
    scheduler.add_job(
        auto_purge_old_audit_logs, 
        'cron', 
        hour=2, 
        minute=0,
        id='audit_log_purge',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduled auto-purge of audit logs (daily at 2:00 AM)")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("Shutting down Control Core PAP API...")
    scheduler.shutdown()
    logger.info("Scheduler shutdown complete")

@app.get("/cc-info")
def control_core_info():
    """Control Core platform information."""
    return {
        "platform": "Control Core",
        "version": "1.0.0",
        "description": "Policy-Based Access Control platform for securing APIs, AI agents, and resources",
        "components": {
            "pap": "Policy Administration Point (this API)",
            "pep": "Policy Enforcement Point (The Bouncer)",
            "pdp": "Policy Decision Point (OPA)",
            "pip": "Policy Information Point (OPAL)"
        },
                "features": [
                    "Visual Policy Builder",
                    "Monaco Code Editor with Rego support",
                    "Policy Templates",
                    "Multi-environment support",
                    "Real-time policy evaluation",
                    "Comprehensive audit logging",
                    "OPAL integration for Git-based policy management",
                    "The Bouncer (PEP) deployment and management",
                    "Advanced Context Generation and Ingestion",
                    "Context-Aware Policy Templates",
                    "AI Agent Context Control",
                    "LLM Prompt Context Management",
                    "RAG System Context Filtering",
                    "PIP (Policy Information Point) for connections and attribute mapping",
                    "Out-of-box IAM integrations (Auth0, Okta, Azure AD, AWS IAM)",
                    "ERP integrations (SAP, Oracle, Workday, NetSuite)",
                    "CRM integrations (Salesforce, HubSpot, Microsoft Dynamics)",
                    "MCP (Model Context Protocol) connections",
                    "Attribute mapping and transformation",
                    "OPAL synchronization for Bouncer data distribution",
                    "AI Integration for enhanced features (optional)",
                    "Customer LLM service connections (OpenAI, Anthropic, Azure, AWS, Google, Cohere)",
                    "AI-powered Rego editor with autocomplete and suggestions",
                    "AI-enhanced policy wizard with smart recommendations",
                    "AI policy conflict detection and analysis",
                    "AI compliance framework suggestions (GDPR, PIPEDA, SOC2, CCPA, HIPAA, PCI DSS)",
                    "AI PIP attribute and parameter suggestions",
                    "Cost-effective AI configuration with usage monitoring"
                ],
        "deployment_models": [
            "hosted",
            "self-hosted"
        ],
        "subscription_tiers": [
            "kickstart",
            "pro", 
            "custom"
        ]
    }
