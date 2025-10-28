from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Subscription, StripeProduct, StripePrice
from app.schemas import OnboardingStep, OnboardingProgress, DeploymentPackage, UserResponse
from app.routers.auth import get_current_user
from app.services.container_service import ContainerService
from app.services.email_service import EmailService
import asyncio

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

@router.get("/steps", response_model=List[OnboardingStep])
async def get_onboarding_steps(
    current_user: User = Depends(get_current_user)
):
    """Get onboarding steps based on user's subscription tier."""
    steps = []
    
    if current_user.subscription_tier == "kickstart":
        steps = [
            OnboardingStep(
                step_id="welcome",
                title="Welcome to Control Core",
                description="Get started with your Control Core deployment",
                status="pending",
                order=1
            ),
            OnboardingStep(
                step_id="download_package",
                title="Download Control Core Package",
                description="Download your self-hosted Control Core package",
                status="pending",
                order=2
            ),
            OnboardingStep(
                step_id="deploy_platform",
                title="Deploy Control Core Platform",
                description="Deploy Control Core on your infrastructure",
                status="pending",
                order=3
            ),
            OnboardingStep(
                step_id="configure_policies",
                title="Configure Policies",
                description="Set up your first policies",
                status="pending",
                order=4
            ),
            OnboardingStep(
                step_id="deploy_bouncer",
                title="Deploy The Bouncer",
                description="Deploy Bouncer to protect your resources",
                status="pending",
                order=5
            ),
            OnboardingStep(
                step_id="test_deployment",
                title="Test Deployment",
                description="Verify your Control Core deployment",
                status="pending",
                order=6
            )
        ]
    elif current_user.subscription_tier == "pro":
        steps = [
            OnboardingStep(
                step_id="welcome",
                title="Welcome to Control Core Pro",
                description="Get started with your Pro deployment",
                status="pending",
                order=1
            ),
            OnboardingStep(
                step_id="tenant_setup",
                title="Tenant Setup",
                description="Your isolated tenant is being prepared",
                status="pending",
                order=2
            ),
            OnboardingStep(
                step_id="download_bouncer",
                title="Download Bouncer Package",
                description="Download your Bouncer for self-hosting",
                status="pending",
                order=3
            ),
            OnboardingStep(
                step_id="configure_policies",
                title="Configure Policies",
                description="Set up your policies in the hosted Control Plane",
                status="pending",
                order=4
            ),
            OnboardingStep(
                step_id="deploy_bouncer",
                title="Deploy Bouncer",
                description="Deploy Bouncer to protect your resources",
                status="pending",
                order=5
            ),
            OnboardingStep(
                step_id="test_deployment",
                title="Test Deployment",
                description="Verify your Control Core deployment",
                status="pending",
                order=6
            )
        ]
    elif current_user.subscription_tier == "custom":
        steps = [
            OnboardingStep(
                step_id="welcome",
                title="Welcome to Control Core Custom",
                description="Get started with your Custom deployment",
                status="pending",
                order=1
            ),
            OnboardingStep(
                step_id="consultation",
                title="Consultation Call",
                description="Schedule a consultation with our team",
                status="pending",
                order=2
            ),
            OnboardingStep(
                step_id="custom_setup",
                title="Custom Setup",
                description="We'll set up your custom deployment",
                status="pending",
                order=3
            ),
            OnboardingStep(
                step_id="training",
                title="Training Session",
                description="Receive training on your custom setup",
                status="pending",
                order=4
            ),
            OnboardingStep(
                step_id="go_live",
                title="Go Live",
                description="Your custom Control Core is ready",
                status="pending",
                order=5
            )
        ]
    
    return steps

@router.get("/progress", response_model=OnboardingProgress)
async def get_onboarding_progress(
    current_user: User = Depends(get_current_user)
):
    """Get current onboarding progress."""
    # This would typically be stored in the database
    # For now, return mock progress
    return OnboardingProgress(
        user_id=current_user.id,
        current_step="welcome",
        completed_steps=0,
        total_steps=6,
        progress_percentage=0,
        estimated_completion_time="30 minutes"
    )

@router.post("/start")
async def start_onboarding(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Start the onboarding process."""
    # Send welcome email
    background_tasks.add_task(
        EmailService.send_welcome_email,
        current_user.email,
        current_user.name,
        current_user.subscription_tier
    )
    
    return {
        "message": "Onboarding started successfully",
        "next_step": "download_package" if current_user.subscription_tier == "kickstart" else "tenant_setup"
    }

@router.get("/download-package", response_model=DeploymentPackage)
async def get_download_package(
    current_user: User = Depends(get_current_user)
):
    """Get download package for the user's subscription tier."""
    container_service = ContainerService()
    
    if current_user.subscription_tier == "kickstart":
        package = container_service.generate_kickstart_package(current_user)
    elif current_user.subscription_tier == "pro":
        package = container_service.generate_pro_package(current_user)
    elif current_user.subscription_tier == "custom":
        package = container_service.generate_custom_package(current_user)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription tier"
        )
    
    return package

@router.post("/deploy/{step_id}")
async def complete_onboarding_step(
    step_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Complete an onboarding step."""
    # Update step status in database
    # Send relevant emails/notifications
    # Trigger next steps
    
    if step_id == "download_package":
        # Send download instructions
        background_tasks.add_task(
            EmailService.send_download_instructions,
            current_user.email,
            current_user.name
        )
    elif step_id == "deploy_platform":
        # Send deployment guide
        background_tasks.add_task(
            EmailService.send_deployment_guide,
            current_user.email,
            current_user.name
        )
    elif step_id == "configure_policies":
        # Send policy configuration guide
        background_tasks.add_task(
            EmailService.send_policy_guide,
            current_user.email,
            current_user.name
        )
    
    return {
        "message": f"Step {step_id} completed successfully",
        "next_step": "configure_policies" if step_id == "deploy_platform" else "deploy_bouncer"
    }

@router.get("/deployment-status")
async def get_deployment_status(
    current_user: User = Depends(get_current_user)
):
    """Get deployment status for the user."""
    # This would check actual deployment status
    # For now, return mock status
    return {
        "status": "deployed",
        "services": {
            "control_plane": "running",
            "bouncer": "running",
            "opal": "running",
            "database": "running"
        },
        "health_checks": {
            "pap_api": "healthy",
            "bouncer": "healthy",
            "opal_server": "healthy"
        },
        "last_updated": "2024-01-15T10:30:00Z"
    }

@router.post("/support-request")
async def create_support_request(
    subject: str,
    message: str,
    priority: str = "medium",
    current_user: User = Depends(get_current_user)
):
    """Create a support request during onboarding."""
    # Create support ticket
    # Send to support team
    # Notify user
    
    return {
        "message": "Support request created successfully",
        "ticket_id": f"CC-{current_user.id}-{int(asyncio.get_event_loop().time())}",
        "priority": priority,
        "estimated_response": "2-4 hours"
    }

@router.get("/resources")
async def get_onboarding_resources(
    current_user: User = Depends(get_current_user)
):
    """Get onboarding resources and documentation."""
    resources = {
        "documentation": [
            {
                "title": "Control Core Quick Start Guide",
                "url": "https://docs.controlcore.io/quick-start",
                "type": "guide"
            },
            {
                "title": "Policy Management Guide",
                "url": "https://docs.controlcore.io/policies",
                "type": "guide"
            },
            {
                "title": "Bouncer Deployment Guide",
                "url": "https://docs.controlcore.io/bouncer",
                "type": "guide"
            }
        ],
        "videos": [
            {
                "title": "Control Core Overview",
                "url": "https://videos.controlcore.io/overview",
                "duration": "5 minutes"
            },
            {
                "title": "First Policy Creation",
                "url": "https://videos.controlcore.io/first-policy",
                "duration": "10 minutes"
            }
        ],
        "templates": [
            {
                "title": "AI Agent Control Policy",
                "url": "https://templates.controlcore.io/ai-agent",
                "type": "policy"
            },
            {
                "title": "API Gateway Policy",
                "url": "https://templates.controlcore.io/api-gateway",
                "type": "policy"
            }
        ],
        "support": {
            "email": "support@controlcore.io",
            "chat": "https://chat.controlcore.io",
            "docs": "https://docs.controlcore.io"
        }
    }
    
    return resources
