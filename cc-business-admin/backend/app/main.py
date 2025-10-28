"""
Control Core Business Admin API

A comprehensive customer account management system for Control Core business operations.
Provides CRM, SaaS controls, and Stripe frontend for managing all customer accounts.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import stripe
import structlog
from typing import List, Optional

from app.database import get_db, engine
from app.models import Base
from app.api import customers, subscriptions, billing, health, security, analytics, support
from app.routers import change_management, data_retention
from app.integrations.stripe_client import StripeClient
from app.integrations.control_core_client import ControlCoreClient
from app.core.config import settings
from app.core.auth import get_current_user, verify_token

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Control Core Business Admin API",
    description="Customer account management, billing, and business operations for Control Core",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize external clients
stripe.api_key = settings.STRIPE_SECRET_KEY
stripe_client = StripeClient()
control_core_client = ControlCoreClient()

# Configure logging
logger = structlog.get_logger()

# Include API routers
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["subscriptions"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(security.router, prefix="/api/security", tags=["security"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(support.router, prefix="/api/support", tags=["support"])
app.include_router(change_management.router, tags=["change-management"])
app.include_router(data_retention.router, tags=["data-retention"])

@app.get("/")
async def root():
    """API root endpoint with basic information."""
    return {
        "message": "Control Core Business Admin API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs",
        "description": "Customer account management, billing, and business operations"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": "2024-01-20T10:30:00Z",
        "version": "1.0.0"
    }

@app.get("/api/dashboard/metrics")
async def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get dashboard metrics and KPIs."""
    try:
        # Get customer metrics
        total_customers = customers.get_total_customers(db)
        active_subscriptions = subscriptions.get_active_subscriptions(db)
        
        # Get revenue metrics
        monthly_revenue = billing.get_monthly_revenue(db)
        pending_revenue = billing.get_pending_revenue(db)
        
        # Get system health
        system_health = health.get_system_health()
        
        return {
            "customers": {
                "total": total_customers,
                "active": active_subscriptions,
                "growth_rate": 12.5  # Calculate from historical data
            },
            "revenue": {
                "monthly": monthly_revenue,
                "pending": pending_revenue,
                "growth_rate": 8.2  # Calculate from historical data
            },
            "system": {
                "health": system_health["overall_health"],
                "uptime": system_health["uptime"],
                "response_time": system_health["avg_response_time"]
            }
        }
    except Exception as e:
        logger.error("Failed to get dashboard metrics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard metrics"
        )

@app.post("/api/customers/{customer_id}/extend-trial")
async def extend_trial_period(
    customer_id: str,
    days: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Extend trial period for a customer."""
    try:
        # Update customer trial end date
        customer = customers.get_customer(db, customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        # Extend trial in Stripe
        stripe_client.extend_trial(customer.stripe_customer_id, days)
        
        # Update local database
        customers.extend_trial(db, customer_id, days)
        
        logger.info("Trial extended", customer_id=customer_id, days=days)
        
        return {
            "message": f"Trial extended by {days} days",
            "customer_id": customer_id,
            "new_trial_end": customer.trial_end_date
        }
    except Exception as e:
        logger.error("Failed to extend trial", customer_id=customer_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extend trial period"
        )

@app.post("/api/billing/generate-invoice")
async def generate_invoice(
    customer_id: str,
    amount: float,
    description: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate and send invoice to customer."""
    try:
        # Create invoice in Stripe
        invoice = stripe_client.create_invoice(customer_id, amount, description)
        
        # Store in local database
        billing.create_invoice(db, customer_id, invoice.id, amount, description)
        
        # Send invoice to customer
        stripe_client.send_invoice(invoice.id)
        
        logger.info("Invoice generated and sent", customer_id=customer_id, invoice_id=invoice.id)
        
        return {
            "message": "Invoice generated and sent",
            "invoice_id": invoice.id,
            "amount": amount
        }
    except Exception as e:
        logger.error("Failed to generate invoice", customer_id=customer_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate invoice"
        )

@app.post("/api/billing/send-payment-reminders")
async def send_payment_reminders(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Send payment reminders to customers with overdue payments."""
    try:
        # Get overdue invoices
        overdue_invoices = billing.get_overdue_invoices(db)
        
        # Send reminders
        sent_count = 0
        for invoice in overdue_invoices:
            try:
                stripe_client.send_payment_reminder(invoice.stripe_invoice_id)
                sent_count += 1
            except Exception as e:
                logger.error("Failed to send reminder", invoice_id=invoice.id, error=str(e))
        
        logger.info("Payment reminders sent", count=sent_count)
        
        return {
            "message": f"Payment reminders sent to {sent_count} customers",
            "sent_count": sent_count
        }
    except Exception as e:
        logger.error("Failed to send payment reminders", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send payment reminders"
        )

@app.get("/api/security/audit-logs")
async def get_audit_logs(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get security audit logs."""
    try:
        logs = security.get_audit_logs(db, limit, offset)
        return {
            "logs": logs,
            "total": security.get_audit_logs_count(db),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error("Failed to get audit logs", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit logs"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
