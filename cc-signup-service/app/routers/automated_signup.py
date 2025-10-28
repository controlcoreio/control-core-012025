"""
Automated Signup API Routes
Complete signup workflow with Stripe integration and automated deployment
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from enum import Enum
import logging
from datetime import datetime

from app.services.stripe_integration import StripeIntegrationService, CustomerData, TierType
from app.database import get_db
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/signup", tags=["automated-signup"])

class SignupRequest(BaseModel):
    email: EmailStr
    name: str
    company: str
    tier: str  # "kickstart", "pro", "custom"
    region: Optional[str] = "us-east-1"
    source: Optional[str] = "website"
    sales_rep: Optional[str] = "sales@controlcore.io"
    custom_requirements: Optional[Dict[str, Any]] = None

class SignupResponse(BaseModel):
    success: bool
    customer_id: str
    subscription_id: str
    deployment_id: str
    deployment_type: str
    access_urls: Dict[str, str]
    credentials: Dict[str, str]
    next_steps: list[str]
    message: str

class DeploymentStatusResponse(BaseModel):
    deployment_id: str
    status: str
    progress: int
    current_step: str
    estimated_completion: Optional[str]
    access_urls: Optional[Dict[str, str]]
    error_message: Optional[str]

# Initialize Stripe integration service
stripe_service = StripeIntegrationService(
    stripe_secret_key="sk_test_...",  # Should come from environment
    bac_api_url="http://localhost:8001",  # Business Admin Console API
    auth0_domain="controlcore.auth0.com",  # Should come from environment
    auth0_client_id="your_auth0_client_id",  # Should come from environment
    auth0_client_secret="your_auth0_client_secret"  # Should come from environment
)

@router.post("/", response_model=SignupResponse)
async def create_account_and_deploy(
    request: SignupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Complete automated signup workflow:
    1. Create Stripe customer account
    2. Create subscription based on tier
    3. Generate deployment configuration
    4. Trigger automated deployment
    5. Log everything to Business Admin Console
    """
    try:
        logger.info(f"Starting automated signup for {request.email}")
        
        # Validate tier
        try:
            tier = TierType(request.tier.lower())
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid tier: {request.tier}. Must be one of: kickstart, pro, custom"
            )
        
        # Create customer data
        customer_data = CustomerData(
            email=request.email,
            name=request.name,
            company=request.company,
            tier=tier,
            region=request.region,
            source=request.source,
            sales_rep=request.sales_rep,
            metadata=request.custom_requirements or {}
        )
        
        # Create Stripe customer and subscription
        account_result = await stripe_service.create_customer_account(customer_data)
        
        # Trigger deployment in background
        background_tasks.add_task(
            trigger_deployment_async,
            account_result["customer_id"],
            account_result["deployment_config"]
        )
        
        # Generate response based on tier
        response_data = generate_signup_response(account_result, tier)
        
        logger.info(f"Signup completed for {request.email}: {account_result['customer_id']}")
        
        return SignupResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Signup failed for {request.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@router.get("/status/{deployment_id}", response_model=DeploymentStatusResponse)
async def get_deployment_status(deployment_id: str):
    """
    Get deployment status and progress
    """
    try:
        # In a real implementation, this would check actual deployment status
        # For now, return mock status
        return DeploymentStatusResponse(
            deployment_id=deployment_id,
            status="deploying",
            progress=75,
            current_step="Configuring SSL certificates",
            estimated_completion="5 minutes",
            access_urls=None,
            error_message=None
        )
    except Exception as e:
        logger.error(f"Failed to get deployment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get deployment status: {str(e)}")

@router.post("/webhook/stripe")
async def handle_stripe_webhook(
    event: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """
    Handle Stripe webhooks for real-time account management
    """
    try:
        logger.info(f"Received Stripe webhook: {event.get('type')}")
        
        # Process webhook in background
        background_tasks.add_task(
            stripe_service.handle_stripe_webhook,
            event
        )
        
        return {"status": "webhook_received"}
        
    except Exception as e:
        logger.error(f"Failed to handle Stripe webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

@router.get("/tiers")
async def get_available_tiers():
    """
    Get available subscription tiers and their features
    """
    return {
        "tiers": [
            {
                "id": "kickstart",
                "name": "Control Core Kickstart",
                "description": "90-day free trial with basic features",
                "price": 0,
                "trial_days": 90,
                "deployment_type": "hybrid",
                "features": [
                    "Basic policy management",
                    "1M API calls per month",
                    "Email support",
                    "Sandbox environment",
                    "Standard deployment"
                ]
            },
            {
                "id": "pro",
                "name": "Control Core Pro",
                "description": "Professional tier with advanced features",
                "price": 299,
                "trial_days": 14,
                "deployment_type": "hybrid",
                "features": [
                    "Advanced policy management",
                    "10M API calls per month",
                    "Priority support",
                    "Sandbox + Production environments",
                    "Usage-based billing",
                    "API access",
                    "Multi-tenant support"
                ]
            },
            {
                "id": "custom",
                "name": "Control Core Custom",
                "description": "Enterprise tier with full customization",
                "price": 999,
                "trial_days": 30,
                "deployment_type": "custom",
                "features": [
                    "Full customization",
                    "Unlimited API calls",
                    "Dedicated support",
                    "On-premise deployment",
                    "Custom integrations",
                    "SLA guarantee",
                    "Dedicated infrastructure"
                ]
            }
        ]
    }

@router.post("/deploy/{customer_id}")
async def trigger_manual_deployment(
    customer_id: str,
    background_tasks: BackgroundTasks
):
    """
    Manually trigger deployment for existing customer
    """
    try:
        logger.info(f"Manually triggering deployment for customer {customer_id}")
        
        # Get customer data from Stripe
        customer = stripe_service.stripe.Customer.retrieve(customer_id)
        
        # Generate deployment config
        deployment_config = stripe_service._generate_deployment_config(
            CustomerData(
                email=customer.email,
                name=customer.name,
                company=customer.metadata.get("company", ""),
                tier=TierType(customer.metadata.get("tier", "kickstart")),
                region=customer.metadata.get("region", "us-east-1"),
                source=customer.metadata.get("source", "website"),
                sales_rep=customer.metadata.get("sales_rep", "sales@controlcore.io")
            ),
            customer_id
        )
        
        # Trigger deployment
        background_tasks.add_task(
            trigger_deployment_async,
            customer_id,
            deployment_config
        )
        
        return {
            "status": "deployment_triggered",
            "deployment_id": deployment_config.deployment_id,
            "message": "Deployment has been triggered and will complete shortly"
        }
        
    except Exception as e:
        logger.error(f"Failed to trigger manual deployment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Deployment trigger failed: {str(e)}")

async def trigger_deployment_async(customer_id: str, deployment_config):
    """
    Background task to trigger deployment
    """
    try:
        logger.info(f"Starting deployment for customer {customer_id}")
        
        # Trigger deployment
        deployment_result = await stripe_service.trigger_deployment(customer_id, deployment_config)
        
        logger.info(f"Deployment completed for customer {customer_id}: {deployment_result['deployment_id']}")
        
    except Exception as e:
        logger.error(f"Deployment failed for customer {customer_id}: {str(e)}")

def generate_signup_response(account_result: Dict[str, Any], tier: TierType) -> Dict[str, Any]:
    """
    Generate signup response based on tier and deployment type
    """
    deployment_config = account_result["deployment_config"]
    
    if tier == TierType.KICKSTART:
        return {
            "success": True,
            "customer_id": account_result["customer_id"],
            "subscription_id": account_result["subscription_id"],
            "deployment_id": deployment_config.deployment_id,
            "deployment_type": "hybrid",
            "access_urls": {
                "control_plane": "https://app.controlcore.io",
                "bouncer": f"https://{deployment_config.domain or 'localhost:8080'}"
            },
            "credentials": {
                "email": "admin@controlcore.io",
                "password": "admin123"
            },
            "next_steps": [
                "Access Control Plane at https://app.controlcore.io",
                "Configure Bouncer at your domain",
                "Start enforcing policies",
                "Check your email for deployment instructions"
            ],
            "message": "Kickstart account created! Your 90-day free trial has started."
        }
    elif tier == TierType.PRO:
        return {
            "success": True,
            "customer_id": account_result["customer_id"],
            "subscription_id": account_result["subscription_id"],
            "deployment_id": deployment_config.deployment_id,
            "deployment_type": "hybrid",
            "access_urls": {
                "control_plane": "https://app.controlcore.io",
                "bouncer": f"https://{deployment_config.domain or 'localhost:8080'}",
                "monitoring": f"https://monitoring.{deployment_config.domain or 'localhost:3001'}"
            },
            "credentials": {
                "email": "admin@controlcore.io",
                "password": "admin123"
            },
            "next_steps": [
                "Access Control Plane at https://app.controlcore.io",
                "Configure Bouncer with monitoring",
                "Set up usage tracking",
                "Configure multi-tenant settings",
                "Check your email for deployment instructions"
            ],
            "message": "Pro account created! Your 14-day trial has started with advanced features."
        }
    else:  # CUSTOM
        return {
            "success": True,
            "customer_id": account_result["customer_id"],
            "subscription_id": account_result["subscription_id"],
            "deployment_id": deployment_config.deployment_id,
            "deployment_type": "custom",
            "access_urls": {
                "control_plane": f"https://{deployment_config.domain}",
                "bouncer": f"https://bouncer.{deployment_config.domain}",
                "monitoring": f"https://monitoring.{deployment_config.domain}",
                "backup": f"https://backup.{deployment_config.domain}"
            },
            "credentials": {
                "email": "admin@controlcore.io",
                "password": "admin123"
            },
            "next_steps": [
                "Access Control Plane at your domain",
                "Configure SSL certificates",
                "Set up monitoring and backup",
                "Configure custom integrations",
                "Check your email for deployment instructions"
            ],
            "message": "Custom account created! Your 30-day trial has started with full customization."
        }
