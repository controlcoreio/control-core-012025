"""
Deployment Events API for Business Admin Console
Handles logging and monitoring of all Control Core deployments
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import logging
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DeploymentEvent, Customer, Deployment

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/events", tags=["deployment-events"])

class EventType(str, Enum):
    CUSTOMER_SIGNUP = "customer_signup"
    DEPLOYMENT_STARTED = "deployment_started"
    DEPLOYMENT_COMPLETED = "deployment_completed"
    DEPLOYMENT_FAILED = "deployment_failed"
    HEALTH_CHECK_PASSED = "health_check_passed"
    HEALTH_CHECK_FAILED = "health_check_failed"
    SSL_CONFIGURED = "ssl_configured"
    SSL_FAILED = "ssl_failed"
    DEPLOYMENT_SUCCESS = "deployment_success"

class DeploymentEventRequest(BaseModel):
    event_type: EventType
    timestamp: str
    deployment_id: str
    customer_id: str
    tier: str
    status: str
    message: str
    deployment_mode: Optional[str] = None
    domain: Optional[str] = None
    region: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CustomerSignupEvent(BaseModel):
    event_type: str
    timestamp: str
    customer: Dict[str, Any]
    subscription: Dict[str, Any]
    deployment: Dict[str, Any]

class DeploymentStatusResponse(BaseModel):
    deployment_id: str
    customer_id: str
    tier: str
    status: str
    progress: int
    current_step: str
    created_at: datetime
    updated_at: datetime
    access_urls: Optional[Dict[str, str]]
    health_status: str
    error_message: Optional[str]

@router.post("/deployment")
async def log_deployment_event(
    event: DeploymentEventRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Log deployment events from automated deployment scripts
    """
    try:
        logger.info(f"Logging deployment event: {event.event_type} for {event.deployment_id}")
        
        # Create deployment event record
        deployment_event = DeploymentEvent(
            event_type=event.event_type,
            timestamp=datetime.fromisoformat(event.timestamp.replace('Z', '+00:00')),
            deployment_id=event.deployment_id,
            customer_id=event.customer_id,
            tier=event.tier,
            status=event.status,
            message=event.message,
            deployment_mode=event.deployment_mode,
            domain=event.domain,
            region=event.region,
            metadata=event.metadata or {}
        )
        
        db.add(deployment_event)
        db.commit()
        
        # Update deployment status if this is a status change event
        if event.event_type in [EventType.DEPLOYMENT_COMPLETED, EventType.DEPLOYMENT_FAILED, EventType.DEPLOYMENT_SUCCESS]:
            background_tasks.add_task(
                update_deployment_status,
                event.deployment_id,
                event.status,
                event.message
            )
        
        # Send notifications for critical events
        if event.event_type in [EventType.DEPLOYMENT_FAILED, EventType.HEALTH_CHECK_FAILED]:
            background_tasks.add_task(
                send_alert_notification,
                event.deployment_id,
                event.customer_id,
                event.message
            )
        
        logger.info(f"Successfully logged event: {event.event_type}")
        return {"status": "logged", "event_id": deployment_event.id}
        
    except Exception as e:
        logger.error(f"Failed to log deployment event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log event: {str(e)}")

@router.post("/customer-signup")
async def log_customer_signup(
    event: CustomerSignupEvent,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Log customer signup events from signup service
    """
    try:
        logger.info(f"Logging customer signup: {event.customer['email']}")
        
        # Create customer record if not exists
        customer = db.query(Customer).filter(Customer.stripe_customer_id == event.customer['id']).first()
        if not customer:
            customer = Customer(
                stripe_customer_id=event.customer['id'],
                email=event.customer['email'],
                name=event.customer['name'],
                company=event.customer['company'],
                tier=event.customer['tier'],
                region=event.customer['region'],
                source=event.customer['source'],
                sales_rep=event.customer['sales_rep'],
                created_at=datetime.fromisoformat(event.timestamp.replace('Z', '+00:00'))
            )
            db.add(customer)
            db.commit()
        
        # Create deployment record
        deployment = Deployment(
            deployment_id=event.deployment['deployment_id'],
            customer_id=customer.id,
            tier=event.deployment['tier'],
            deployment_type=event.deployment['deployment_type'],
            region=event.deployment['region'],
            domain=event.deployment['domain'],
            ssl_mode=event.deployment['ssl_mode'],
            performance_mode=event.deployment['performance_mode'],
            status='pending',
            created_at=datetime.fromisoformat(event.timestamp.replace('Z', '+00:00'))
        )
        db.add(deployment)
        db.commit()
        
        # Log signup event
        signup_event = DeploymentEvent(
            event_type=EventType.CUSTOMER_SIGNUP,
            timestamp=datetime.fromisoformat(event.timestamp.replace('Z', '+00:00')),
            deployment_id=event.deployment['deployment_id'],
            customer_id=event.customer['id'],
            tier=event.customer['tier'],
            status='signup_completed',
            message=f"Customer signup completed for {event.customer['email']}",
            deployment_mode=event.deployment['deployment_type'],
            domain=event.deployment['domain'],
            region=event.deployment['region'],
            metadata={
                'subscription_id': event.subscription['id'],
                'subscription_status': event.subscription['status'],
                'trial_end': event.subscription.get('trial_end'),
                'current_period_end': event.subscription.get('current_period_end')
            }
        )
        db.add(signup_event)
        db.commit()
        
        # Trigger deployment automation
        background_tasks.add_task(
            trigger_automated_deployment,
            event.deployment['deployment_id'],
            event.customer['tier'],
            event.deployment['deployment_type']
        )
        
        logger.info(f"Successfully logged customer signup: {event.customer['email']}")
        return {"status": "logged", "customer_id": customer.id, "deployment_id": deployment.deployment_id}
        
    except Exception as e:
        logger.error(f"Failed to log customer signup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log signup: {str(e)}")

@router.get("/deployment/{deployment_id}/status", response_model=DeploymentStatusResponse)
async def get_deployment_status(
    deployment_id: str,
    db: Session = Depends(get_db)
):
    """
    Get current deployment status and progress
    """
    try:
        # Get deployment record
        deployment = db.query(Deployment).filter(Deployment.deployment_id == deployment_id).first()
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")
        
        # Get latest events for this deployment
        events = db.query(DeploymentEvent).filter(
            DeploymentEvent.deployment_id == deployment_id
        ).order_by(DeploymentEvent.timestamp.desc()).all()
        
        # Calculate progress based on events
        progress = calculate_deployment_progress(events)
        current_step = get_current_deployment_step(events)
        health_status = get_health_status(events)
        
        # Generate access URLs based on tier and deployment type
        access_urls = generate_access_urls(deployment)
        
        return DeploymentStatusResponse(
            deployment_id=deployment.deployment_id,
            customer_id=deployment.customer_id,
            tier=deployment.tier,
            status=deployment.status,
            progress=progress,
            current_step=current_step,
            created_at=deployment.created_at,
            updated_at=deployment.updated_at,
            access_urls=access_urls,
            health_status=health_status,
            error_message=get_latest_error(events)
        )
        
    except Exception as e:
        logger.error(f"Failed to get deployment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@router.get("/deployments")
async def list_deployments(
    tier: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    List all deployments with optional filtering
    """
    try:
        query = db.query(Deployment)
        
        if tier:
            query = query.filter(Deployment.tier == tier)
        if status:
            query = query.filter(Deployment.status == status)
        
        deployments = query.offset(offset).limit(limit).all()
        
        return {
            "deployments": [
                {
                    "deployment_id": dep.deployment_id,
                    "customer_id": dep.customer_id,
                    "tier": dep.tier,
                    "deployment_type": dep.deployment_type,
                    "status": dep.status,
                    "domain": dep.domain,
                    "region": dep.region,
                    "created_at": dep.created_at.isoformat(),
                    "updated_at": dep.updated_at.isoformat()
                }
                for dep in deployments
            ],
            "total": query.count(),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to list deployments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list deployments: {str(e)}")

@router.get("/deployments/{deployment_id}/events")
async def get_deployment_events(
    deployment_id: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get all events for a specific deployment
    """
    try:
        events = db.query(DeploymentEvent).filter(
            DeploymentEvent.deployment_id == deployment_id
        ).order_by(DeploymentEvent.timestamp.desc()).limit(limit).all()
        
        return {
            "deployment_id": deployment_id,
            "events": [
                {
                    "id": event.id,
                    "event_type": event.event_type,
                    "timestamp": event.timestamp.isoformat(),
                    "status": event.status,
                    "message": event.message,
                    "metadata": event.metadata
                }
                for event in events
            ],
            "total": len(events)
        }
        
    except Exception as e:
        logger.error(f"Failed to get deployment events: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get events: {str(e)}")

# --- Helper Functions ---

def calculate_deployment_progress(events: List[DeploymentEvent]) -> int:
    """Calculate deployment progress based on events"""
    if not events:
        return 0
    
    # Define progress milestones
    milestones = {
        EventType.CUSTOMER_SIGNUP: 10,
        EventType.DEPLOYMENT_STARTED: 20,
        EventType.SSL_CONFIGURED: 60,
        EventType.HEALTH_CHECK_PASSED: 90,
        EventType.DEPLOYMENT_COMPLETED: 100
    }
    
    # Find the highest milestone reached
    max_progress = 0
    for event in events:
        if event.event_type in milestones:
            max_progress = max(max_progress, milestones[event.event_type])
    
    return max_progress

def get_current_deployment_step(events: List[DeploymentEvent]) -> str:
    """Get current deployment step based on latest events"""
    if not events:
        return "Initializing"
    
    latest_event = events[0]
    
    step_mapping = {
        EventType.CUSTOMER_SIGNUP: "Customer account created",
        EventType.DEPLOYMENT_STARTED: "Starting deployment",
        EventType.SSL_CONFIGURED: "Configuring SSL certificates",
        EventType.HEALTH_CHECK_PASSED: "Running health checks",
        EventType.DEPLOYMENT_COMPLETED: "Deployment completed",
        EventType.DEPLOYMENT_FAILED: "Deployment failed"
    }
    
    return step_mapping.get(latest_event.event_type, "Processing")

def get_health_status(events: List[DeploymentEvent]) -> str:
    """Get health status based on events"""
    health_events = [e for e in events if e.event_type in [EventType.HEALTH_CHECK_PASSED, EventType.HEALTH_CHECK_FAILED]]
    
    if not health_events:
        return "unknown"
    
    latest_health = health_events[0]
    return "healthy" if latest_health.event_type == EventType.HEALTH_CHECK_PASSED else "unhealthy"

def get_latest_error(events: List[DeploymentEvent]) -> Optional[str]:
    """Get latest error message from events"""
    error_events = [e for e in events if e.event_type in [EventType.DEPLOYMENT_FAILED, EventType.HEALTH_CHECK_FAILED, EventType.SSL_FAILED]]
    
    if error_events:
        return error_events[0].message
    
    return None

def generate_access_urls(deployment: Deployment) -> Dict[str, str]:
    """Generate access URLs based on deployment configuration"""
    urls = {}
    
    if deployment.tier in ["kickstart", "pro"]:
        # Hybrid deployment
        urls["control_plane"] = "https://app.controlcore.io"
        urls["bouncer"] = f"http://localhost:8080"
        if deployment.tier == "pro":
            urls["monitoring"] = f"http://localhost:3001"
    else:  # custom
        # Full self-hosted deployment
        base_url = f"https://{deployment.domain}" if deployment.domain else "http://localhost"
        urls["control_plane"] = f"{base_url}:3000"
        urls["api"] = f"{base_url}:8000"
        urls["bouncer"] = f"{base_url}:8080"
        urls["opal"] = f"{base_url}:7000"
        urls["monitoring"] = f"{base_url}:3001"
    
    return urls

# --- Background Tasks ---

async def update_deployment_status(deployment_id: str, status: str, message: str):
    """Update deployment status in database"""
    try:
        # This would be implemented with proper database session handling
        logger.info(f"Updating deployment {deployment_id} status to {status}")
    except Exception as e:
        logger.error(f"Failed to update deployment status: {str(e)}")

async def send_alert_notification(deployment_id: str, customer_id: str, message: str):
    """Send alert notification for critical events"""
    try:
        logger.info(f"Sending alert for deployment {deployment_id}: {message}")
        # Implement notification logic (email, Slack, etc.)
    except Exception as e:
        logger.error(f"Failed to send alert: {str(e)}")

async def trigger_automated_deployment(deployment_id: str, tier: str, deployment_type: str):
    """Trigger automated deployment process"""
    try:
        logger.info(f"Triggering automated deployment for {deployment_id}")
        # This would call the automated deployment script
        # subprocess.run(["./automated-deployment.sh", "--deployment-id", deployment_id, "--tier", tier])
    except Exception as e:
        logger.error(f"Failed to trigger deployment: {str(e)}")
