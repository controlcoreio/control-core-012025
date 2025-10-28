"""
Signup Events Router for Control Core Business Admin
Handles signup and provisioning events from cc-signup-service
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SignupEvent, Customer, Tenant
from app.schemas import SignupEventCreate, SignupEventResponse, CustomerSignupStats
import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["signup-events"])

@router.post("/events/customer-signup")
async def log_customer_signup(
    event_data: SignupEventCreate,
    db: Session = Depends(get_db)
):
    """Log customer signup event from cc-signup-service"""
    try:
        # Create signup event record
        signup_event = SignupEvent(
            id=str(uuid.uuid4()),
            user_id=event_data.user_id,
            event_type="customer_signup",
            event_data=event_data.dict(),
            ip_address=event_data.ip_address,
            user_agent=event_data.user_agent,
            created_at=datetime.utcnow()
        )
        
        db.add(signup_event)
        
        # Create or update customer record
        customer = db.query(Customer).filter(Customer.user_id == event_data.user_id).first()
        if not customer:
            customer = Customer(
                id=str(uuid.uuid4()),
                user_id=event_data.user_id,
                email=event_data.email,
                name=event_data.name,
                company_name=event_data.company_name,
                subscription_tier=event_data.tier,
                billing_cycle=event_data.billing_cycle,
                signup_date=datetime.utcnow(),
                status="active"
            )
            db.add(customer)
        else:
            # Update existing customer
            customer.subscription_tier = event_data.tier
            customer.billing_cycle = event_data.billing_cycle
            customer.updated_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Logged customer signup for user {event_data.user_id}")
        return {"status": "success", "event_id": signup_event.id}
        
    except Exception as e:
        logger.error(f"Failed to log customer signup: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log signup event"
        )

@router.post("/events/deployment-event")
async def log_deployment_event(
    event_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Log deployment event from cc-signup-service"""
    try:
        signup_event = SignupEvent(
            id=str(uuid.uuid4()),
            user_id=event_data["user_id"],
            event_type="deployment_event",
            event_data=event_data,
            created_at=datetime.utcnow()
        )
        
        db.add(signup_event)
        db.commit()
        
        logger.info(f"Logged deployment event for user {event_data['user_id']}")
        return {"status": "success", "event_id": signup_event.id}
        
    except Exception as e:
        logger.error(f"Failed to log deployment event: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log deployment event"
        )

@router.post("/events/provisioning-event")
async def log_provisioning_event(
    event_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Log Pro tenant provisioning event"""
    try:
        signup_event = SignupEvent(
            id=str(uuid.uuid4()),
            user_id=event_data["user_id"],
            event_type="provisioning_event",
            event_data=event_data,
            created_at=datetime.utcnow()
        )
        
        db.add(signup_event)
        
        # Update tenant record if it exists
        if "tenant_id" in event_data:
            tenant = db.query(Tenant).filter(Tenant.id == event_data["tenant_id"]).first()
            if tenant:
                tenant.status = event_data.get("status", tenant.status)
                tenant.updated_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Logged provisioning event for tenant {event_data.get('tenant_id')}")
        return {"status": "success", "event_id": signup_event.id}
        
    except Exception as e:
        logger.error(f"Failed to log provisioning event: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log provisioning event"
        )

@router.post("/events/package-download")
async def log_package_download(
    event_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Log package download event"""
    try:
        signup_event = SignupEvent(
            id=str(uuid.uuid4()),
            user_id=event_data["user_id"],
            event_type="package_download",
            event_data=event_data,
            created_at=datetime.utcnow()
        )
        
        db.add(signup_event)
        db.commit()
        
        logger.info(f"Logged package download for user {event_data['user_id']}")
        return {"status": "success", "event_id": signup_event.id}
        
    except Exception as e:
        logger.error(f"Failed to log package download: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log package download"
        )

@router.post("/events/stripe-event")
async def log_stripe_event(
    event_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Log Stripe webhook event"""
    try:
        signup_event = SignupEvent(
            id=str(uuid.uuid4()),
            user_id=event_data["user_id"],
            event_type=f"stripe_{event_data.get('event_type', 'unknown')}",
            event_data=event_data,
            created_at=datetime.utcnow()
        )
        
        db.add(signup_event)
        
        # Update customer subscription status if applicable
        if "stripe_event_data" in event_data:
            stripe_data = event_data["stripe_event_data"]
            if "customer" in stripe_data:
                customer = db.query(Customer).filter(
                    Customer.stripe_customer_id == stripe_data["customer"]
                ).first()
                if customer:
                    # Update subscription status based on event type
                    event_type = event_data.get("event_type", "")
                    if "subscription" in event_type:
                        customer.subscription_status = stripe_data.get("status", customer.subscription_status)
                    elif "payment" in event_type:
                        customer.payment_status = stripe_data.get("status", customer.payment_status)
                    customer.updated_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Logged Stripe event {event_data.get('event_type')} for user {event_data['user_id']}")
        return {"status": "success", "event_id": signup_event.id}
        
    except Exception as e:
        logger.error(f"Failed to log Stripe event: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log Stripe event"
        )

@router.get("/events/signup-stats")
async def get_signup_stats(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """Get signup statistics"""
    try:
        # Default to last 30 days if no dates provided
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).isoformat()
        if not end_date:
            end_date = datetime.utcnow().isoformat()
        
        # Get signup events in date range
        signup_events = db.query(SignupEvent).filter(
            SignupEvent.event_type == "customer_signup",
            SignupEvent.created_at >= datetime.fromisoformat(start_date),
            SignupEvent.created_at <= datetime.fromisoformat(end_date)
        ).all()
        
        # Calculate statistics
        total_signups = len(signup_events)
        tier_breakdown = {}
        daily_signups = {}
        
        for event in signup_events:
            tier = event.event_data.get("tier", "unknown")
            tier_breakdown[tier] = tier_breakdown.get(tier, 0) + 1
            
            date_key = event.created_at.date().isoformat()
            daily_signups[date_key] = daily_signups.get(date_key, 0) + 1
        
        return {
            "total_signups": total_signups,
            "tier_breakdown": tier_breakdown,
            "daily_signups": daily_signups,
            "period": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get signup stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get signup statistics"
        )

@router.get("/events/customers")
async def get_customers(
    skip: int = 0,
    limit: int = 100,
    tier: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Get customer list with filtering"""
    try:
        query = db.query(Customer)
        
        if tier:
            query = query.filter(Customer.subscription_tier == tier)
        if status:
            query = query.filter(Customer.status == status)
        
        customers = query.offset(skip).limit(limit).all()
        
        return {
            "customers": [
                {
                    "id": customer.id,
                    "user_id": customer.user_id,
                    "email": customer.email,
                    "name": customer.name,
                    "company_name": customer.company_name,
                    "subscription_tier": customer.subscription_tier,
                    "billing_cycle": customer.billing_cycle,
                    "signup_date": customer.signup_date,
                    "status": customer.status,
                    "subscription_status": customer.subscription_status,
                    "payment_status": customer.payment_status
                }
                for customer in customers
            ],
            "total": len(customers)
        }
        
    except Exception as e:
        logger.error(f"Failed to get customers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get customers"
        )

@router.get("/events/tenants")
async def get_tenants(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Get tenant list with filtering"""
    try:
        query = db.query(Tenant)
        
        if status:
            query = query.filter(Tenant.status == status)
        
        tenants = query.offset(skip).limit(limit).all()
        
        return {
            "tenants": [
                {
                    "id": tenant.id,
                    "user_id": tenant.user_id,
                    "tenant_name": tenant.tenant_name,
                    "subdomain": tenant.subdomain,
                    "domain": tenant.domain,
                    "status": tenant.status,
                    "created_at": tenant.created_at,
                    "provisioned_at": tenant.provisioned_at,
                    "access_url": tenant.access_url
                }
                for tenant in tenants
            ],
            "total": len(tenants)
        }
        
    except Exception as e:
        logger.error(f"Failed to get tenants: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get tenants"
        )
