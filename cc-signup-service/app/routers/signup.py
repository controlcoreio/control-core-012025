from fastapi import APIRouter, HTTPException, status, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, StripeCustomer, StripeProduct, StripePrice, ProTenant, SignupEvent
from app.schemas import SignupRequest, SignupResponse, SubscriptionTier, BillingCycle
from app.services.email_service import EmailService
from app.services.stripe_webhook_handler import StripeWebhookHandler
from app.services.telemetry_service import TelemetryService
from app.services.k8s_provisioning_service import K8sProvisioningService
from app.services.package_generator import PackageGenerator
import uuid
import secrets
import stripe
from datetime import datetime, timedelta
import logging
import sys
import os

# Add cc-pap-core to path for shared services
sys.path.append(os.path.join(os.path.dirname(__file__), "../../../cc-pap-core"))
from stripe_service import StripeIntegrationService, TierType, CustomerData

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["signup"])

# Initialize services
stripe_service = StripeIntegrationService(
    stripe_secret_key=os.getenv("STRIPE_SECRET_KEY"),
    bac_api_url=os.getenv("BAC_API_URL", "http://localhost:8001"),
    auth0_domain=os.getenv("AUTH0_DOMAIN"),
    auth0_client_id=os.getenv("AUTH0_CLIENT_ID"),
    auth0_client_secret=os.getenv("AUTH0_CLIENT_SECRET")
)

email_service = EmailService()
telemetry_service = TelemetryService()
k8s_provisioning_service = K8sProvisioningService()
package_generator = PackageGenerator()

@router.post("/signup", response_model=SignupResponse)
async def create_account(
    signup_data: SignupRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new Control Core account with payment processing and provisioning."""
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        User.company_email == signup_data.company_email
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account already exists with this business email"
        )
    
    try:
        # Create user account
        user_id = str(uuid.uuid4())
        db_user = User(
            id=user_id,
            name=signup_data.name,
            job_title=signup_data.job_title,
            company_name=signup_data.company_name,
            company_email=signup_data.company_email,
            subscription_tier=signup_data.subscription_tier.value,
            billing_cycle=signup_data.billing_cycle.value,
            address_street=signup_data.address_street,
            address_city=signup_data.address_city,
            address_state=signup_data.address_state,
            address_zip=signup_data.address_zip,
            address_country=signup_data.address_country,
            industry=signup_data.industry,
            team_size=signup_data.team_size,
            hear_about_us=signup_data.hear_about_us,
            terms_accepted_at=datetime.utcnow(),
            privacy_accepted_at=datetime.utcnow()
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Log signup event
        signup_event = SignupEvent(
            id=str(uuid.uuid4()),
            user_id=user_id,
            event_type="signup",
            event_data={
                "tier": signup_data.subscription_tier.value,
                "billing_cycle": signup_data.billing_cycle.value,
                "company_name": signup_data.company_name,
                "industry": signup_data.industry,
                "team_size": signup_data.team_size
            },
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(signup_event)
        db.commit()
        
        # Handle payment and subscription creation
        stripe_customer_id = None
        stripe_subscription_id = None
        trial_end = None
        requires_payment = False
        
        if signup_data.subscription_tier != SubscriptionTier.KICKSTART or not signup_data.skip_payment:
            requires_payment = True
            
            # Create Stripe customer
            customer_data = CustomerData(
                email=signup_data.company_email,
                name=signup_data.name,
                company=signup_data.company_name,
                tier=TierType(signup_data.subscription_tier.value),
                region="us-east-1",
                source="website",
                metadata={
                    "user_id": user_id,
                    "billing_cycle": signup_data.billing_cycle.value,
                    "address": {
                        "street": signup_data.address_street,
                        "city": signup_data.address_city,
                        "state": signup_data.address_state,
                        "zip": signup_data.address_zip,
                        "country": signup_data.address_country
                    }
                }
            )
            
            # Create customer account in Stripe
            stripe_account = await stripe_service.create_customer_account(customer_data)
            stripe_customer_id = stripe_account["customer_id"]
            stripe_subscription_id = stripe_account["subscription_id"]
            
            # Store Stripe customer info
            db_stripe_customer = StripeCustomer(
                id=str(uuid.uuid4()),
                user_id=user_id,
                stripe_customer_id=stripe_customer_id,
                stripe_subscription_id=stripe_subscription_id,
                payment_method_type=signup_data.payment_method_type.value if signup_data.payment_method_type else None,
                payment_status="active"
            )
            db.add(db_stripe_customer)
            db.commit()
            
            # Get trial end date
            if signup_data.subscription_tier == SubscriptionTier.KICKSTART:
                trial_end = datetime.utcnow() + timedelta(days=90)
            elif signup_data.subscription_tier == SubscriptionTier.PRO:
                trial_end = datetime.utcnow() + timedelta(days=14)
            elif signup_data.subscription_tier == SubscriptionTier.CUSTOM:
                trial_end = datetime.utcnow() + timedelta(days=30)
        
        # Determine next steps based on tier
        next_steps = []
        
        if signup_data.subscription_tier == SubscriptionTier.PRO:
            # Trigger Pro tenant provisioning
            background_tasks.add_task(
                provision_pro_tenant,
                user_id=user_id,
                company_name=signup_data.company_name,
                stripe_customer_id=stripe_customer_id,
                stripe_subscription_id=stripe_subscription_id
            )
            next_steps = [
                "Pro tenant is being provisioned",
                "You'll receive an email with access details in 2-5 minutes",
                "Access your hosted Control Plane at your subdomain"
            ]
        else:
            # Generate deployment packages for Kickstart/Custom
            background_tasks.add_task(
                generate_deployment_packages,
                user_id=user_id,
                tier=signup_data.subscription_tier.value
            )
            next_steps = [
                "Download your Control Plane package",
                "Deploy in your infrastructure",
                "Access your self-hosted Control Plane",
                "Complete the Getting Started Wizard"
            ]
        
        # Send welcome email
        background_tasks.add_task(
            send_welcome_email_async,
            user_id=user_id,
            tier=signup_data.subscription_tier.value,
            billing_cycle=signup_data.billing_cycle.value,
            requires_payment=requires_payment
        )
        
        # Log to telemetry
        background_tasks.add_task(
            log_signup_telemetry,
            user_id=user_id,
            tier=signup_data.subscription_tier.value,
            billing_cycle=signup_data.billing_cycle.value,
            company_name=signup_data.company_name
        )
        
        return SignupResponse(
            user_id=user_id,
            email=signup_data.email,
            company_name=signup_data.company_name,
            subscription_tier=signup_data.subscription_tier,
            billing_cycle=signup_data.billing_cycle,
            requires_payment=requires_payment,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
            trial_end=trial_end,
            next_steps=next_steps,
            created_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Failed to create account: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account. Please try again."
        )

async def provision_pro_tenant(user_id: str, company_name: str, stripe_customer_id: str, stripe_subscription_id: str):
    """Background task to provision Pro tenant"""
    try:
        # Create Pro tenant record
        db = next(get_db())
        tenant_id = str(uuid.uuid4())
        
        # Generate subdomain
        company_slug = company_name.lower().replace(" ", "-").replace("_", "-")
        # Remove special characters and ensure it's valid
        import re
        company_slug = re.sub(r'[^a-z0-9-]', '', company_slug)
        subdomain = f"{company_slug}.app.controlcore.io"
        
        pro_tenant = ProTenant(
            id=tenant_id,
            user_id=user_id,
            tenant_name=company_name,
            subdomain=subdomain,
            domain=subdomain,
            status="provisioning",
            deployment_config={
                "stripe_customer_id": stripe_customer_id,
                "stripe_subscription_id": stripe_subscription_id,
                "tier": "pro",
                "created_at": datetime.utcnow().isoformat()
            }
        )
        
        db.add(pro_tenant)
        db.commit()
        
        # Trigger Kubernetes provisioning
        provisioning_result = await k8s_provisioning_service.provision_tenant(
            tenant_id=tenant_id,
            company_name=company_name,
            subdomain=subdomain,
            tier="pro"
        )
        
        # Update tenant status
        pro_tenant.status = "active"
        pro_tenant.access_url = f"https://{subdomain}"
        pro_tenant.admin_credentials = {
            "email": f"admin@{company_slug}.com",
            "password": secrets.token_urlsafe(12)
        }
        pro_tenant.provisioned_at = datetime.utcnow()
        pro_tenant.kubernetes_namespace = provisioning_result.get("namespace")
        pro_tenant.ssl_certificate_status = "active"
        
        db.commit()
        
        # Send provisioning complete email
        await email_service.send_pro_tenant_ready(
            user_id=user_id,
            tenant_url=f"https://{subdomain}",
            admin_credentials=pro_tenant.admin_credentials
        )
        
        logger.info(f"Successfully provisioned Pro tenant {tenant_id} for user {user_id}")
        
    except Exception as e:
        logger.error(f"Failed to provision Pro tenant for user {user_id}: {str(e)}")
        # Update tenant status to failed
        db = next(get_db())
        pro_tenant = db.query(ProTenant).filter(ProTenant.user_id == user_id).first()
        if pro_tenant:
            pro_tenant.status = "failed"
            db.commit()

async def generate_deployment_packages(user_id: str, tier: str):
    """Background task to generate deployment packages"""
    try:
        packages = await package_generator.generate_packages(
            user_id=user_id,
            tier=tier
        )
        
        # Store packages in database
        db = next(get_db())
        for package in packages:
            db_package = DeploymentPackage(
                id=str(uuid.uuid4()),
                user_id=user_id,
                package_id=package["package_id"],
                package_type=package["package_type"],
                package_format=package["package_format"],
                download_url=package["download_url"],
                file_size=package["file_size"],
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
            db.add(db_package)
        
        db.commit()
        logger.info(f"Generated deployment packages for user {user_id}")
        
    except Exception as e:
        logger.error(f"Failed to generate deployment packages for user {user_id}: {str(e)}")

async def send_welcome_email_async(user_id: str, tier: str, billing_cycle: str, requires_payment: bool):
    """Background task to send welcome email"""
    try:
        db = next(get_db())
        user = db.query(User).filter(User.id == user_id).first()
        
        if user:
            await email_service.send_welcome_email(
                user_id=user_id,
                email=user.email,
                name=user.name,
                company_name=user.company_name,
                tier=tier,
                billing_cycle=billing_cycle,
                requires_payment=requires_payment
            )
            
    except Exception as e:
        logger.error(f"Failed to send welcome email for user {user_id}: {str(e)}")

async def log_signup_telemetry(user_id: str, tier: str, billing_cycle: str, company_name: str):
    """Background task to log signup telemetry"""
    try:
        await telemetry_service.log_signup_event(
            user_id=user_id,
            tier=tier,
            billing_cycle=billing_cycle,
            company_name=company_name
        )
        
    except Exception as e:
        logger.error(f"Failed to log signup telemetry for user {user_id}: {str(e)}")

@router.get("/deployment/{user_id}")
async def get_deployment_package(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get deployment package for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Generate fresh deployment package
    deployment_package = generate_deployment_package(
        user_id=user_id,
        tier=user.subscription_tier,
        deployment_preference=user.deployment_model
    )
    
    return {
        "user_id": user_id,
        "tier": user.subscription_tier,
        "deployment_package": deployment_package,
        "github_repo": user.github_repo,
        "download_url": deployment_package["download_url"]
    }

@router.get("/status/{user_id}")
async def get_account_status(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get account status and deployment progress."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user has active subscription
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == "active"
    ).first()
    
    return {
        "user_id": user_id,
        "email": user.email,
        "name": user.name,
        "tier": user.subscription_tier,
        "status": user.status,
        "subscription_active": subscription is not None,
        "github_repo": user.github_repo,
        "created_at": user.created_at,
        "last_login": user.last_login
    }
