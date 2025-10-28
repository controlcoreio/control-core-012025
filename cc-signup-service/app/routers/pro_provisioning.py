"""
Pro Tenant Provisioning Router for Control Core Signup
Handles automated Pro tenant provisioning and status tracking
"""

from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ProTenant, SignupEvent
from app.schemas import ProTenantProvisioningRequest, ProTenantProvisioningResponse, ProTenantStatusResponse
from app.services.k8s_provisioning_service import K8sProvisioningService
from app.services.telemetry_service import TelemetryService
import uuid
import logging
from datetime import datetime
import re

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["provisioning"])

# Initialize services
k8s_provisioning_service = K8sProvisioningService()
telemetry_service = TelemetryService()

@router.post("/provisioning/start", response_model=ProTenantProvisioningResponse)
async def start_provisioning(
    request: ProTenantProvisioningRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start Pro tenant provisioning process"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if tenant already exists
        existing_tenant = db.query(ProTenant).filter(ProTenant.user_id == request.user_id).first()
        if existing_tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant already exists for this user"
            )
        
        # Generate tenant ID and subdomain
        tenant_id = str(uuid.uuid4())
        company_slug = generate_company_slug(request.company_name)
        subdomain = f"{company_slug}.app.controlcore.io"
        
        # Create tenant record
        pro_tenant = ProTenant(
            id=tenant_id,
            user_id=request.user_id,
            tenant_name=request.company_name,
            subdomain=subdomain,
            domain=subdomain,
            status="provisioning",
            deployment_config={
                "stripe_customer_id": request.stripe_customer_id,
                "stripe_subscription_id": request.stripe_subscription_id,
                "tier": "pro",
                "created_at": datetime.utcnow().isoformat(),
                "provisioning_steps": {
                    "namespace": {"status": "pending", "started_at": None, "completed_at": None},
                    "deployment": {"status": "pending", "started_at": None, "completed_at": None},
                    "dns": {"status": "pending", "started_at": None, "completed_at": None},
                    "ssl": {"status": "pending", "started_at": None, "completed_at": None},
                    "database": {"status": "pending", "started_at": None, "completed_at": None},
                    "auth": {"status": "pending", "started_at": None, "completed_at": None}
                }
            }
        )
        
        db.add(pro_tenant)
        db.commit()
        db.refresh(pro_tenant)
        
        # Log provisioning start event
        signup_event = SignupEvent(
            id=str(uuid.uuid4()),
            user_id=request.user_id,
            event_type="provisioning_started",
            event_data={
                "tenant_id": tenant_id,
                "company_name": request.company_name,
                "subdomain": subdomain
            }
        )
        db.add(signup_event)
        db.commit()
        
        # Start background provisioning
        background_tasks.add_task(
            provision_tenant_background,
            tenant_id=tenant_id,
            company_name=request.company_name,
            subdomain=subdomain,
            stripe_customer_id=request.stripe_customer_id,
            stripe_subscription_id=request.stripe_subscription_id
        )
        
        # Log to telemetry
        background_tasks.add_task(
            log_provisioning_telemetry,
            user_id=request.user_id,
            tenant_id=tenant_id,
            status="started"
        )
        
        return ProTenantProvisioningResponse(
            tenant_id=tenant_id,
            tenant_name=request.company_name,
            subdomain=subdomain,
            domain=subdomain,
            status="provisioning",
            estimated_completion_time=5,  # 5 minutes
            created_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Failed to start provisioning for user {request.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start provisioning"
        )

@router.get("/provisioning/status/{user_id}", response_model=ProTenantStatusResponse)
async def get_provisioning_status(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get current provisioning status for a user"""
    try:
        # Get tenant record
        tenant = db.query(ProTenant).filter(ProTenant.user_id == user_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        # Calculate progress based on completed steps
        steps = tenant.deployment_config.get("provisioning_steps", {})
        completed_steps = sum(1 for step in steps.values() if step.get("status") == "completed")
        total_steps = len(steps)
        progress_percentage = (completed_steps / total_steps) * 100 if total_steps > 0 else 0
        
        # Determine current step
        current_step = "completed"
        for step_id, step_data in steps.items():
            if step_data.get("status") == "in_progress":
                current_step = step_id
                break
            elif step_data.get("status") == "pending":
                current_step = step_id
                break
        
        # Calculate estimated time remaining
        remaining_steps = [s for s in steps.values() if s.get("status") in ["pending", "in_progress"]]
        estimated_time = len(remaining_steps) * 60  # 1 minute per step
        
        return ProTenantStatusResponse(
            tenant_id=tenant.id,
            status=tenant.status,
            progress_percentage=progress_percentage,
            current_step=current_step,
            estimated_completion_time=estimated_time if tenant.status == "provisioning" else None,
            error_message=None if tenant.status != "failed" else "Provisioning failed",
            access_url=tenant.access_url,
            admin_credentials=tenant.admin_credentials
        )
        
    except Exception as e:
        logger.error(f"Failed to get provisioning status for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get provisioning status"
        )

@router.post("/provisioning/retry/{user_id}")
async def retry_provisioning(
    user_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Retry failed provisioning"""
    try:
        # Get tenant record
        tenant = db.query(ProTenant).filter(ProTenant.user_id == user_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        if tenant.status not in ["failed", "provisioning"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot retry provisioning for tenant in current state"
            )
        
        # Reset tenant status
        tenant.status = "provisioning"
        tenant.deployment_config["provisioning_steps"] = {
            "namespace": {"status": "pending", "started_at": None, "completed_at": None},
            "deployment": {"status": "pending", "started_at": None, "completed_at": None},
            "dns": {"status": "pending", "started_at": None, "completed_at": None},
            "ssl": {"status": "pending", "started_at": None, "completed_at": None},
            "database": {"status": "pending", "started_at": None, "completed_at": None},
            "auth": {"status": "pending", "started_at": None, "completed_at": None}
        }
        db.commit()
        
        # Start background provisioning
        background_tasks.add_task(
            provision_tenant_background,
            tenant_id=tenant.id,
            company_name=tenant.tenant_name,
            subdomain=tenant.subdomain,
            stripe_customer_id=tenant.deployment_config.get("stripe_customer_id"),
            stripe_subscription_id=tenant.deployment_config.get("stripe_subscription_id")
        )
        
        return {"message": "Provisioning retry started"}
        
    except Exception as e:
        logger.error(f"Failed to retry provisioning for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retry provisioning"
        )

async def provision_tenant_background(
    tenant_id: str,
    company_name: str,
    subdomain: str,
    stripe_customer_id: str,
    stripe_subscription_id: str
):
    """Background task to provision Pro tenant"""
    db = next(get_db())
    
    try:
        logger.info(f"Starting background provisioning for tenant {tenant_id}")
        
        # Update step status
        def update_step_status(step_id: str, status: str, error_message: str = None):
            tenant = db.query(ProTenant).filter(ProTenant.id == tenant_id).first()
            if tenant:
                steps = tenant.deployment_config.get("provisioning_steps", {})
                if step_id in steps:
                    steps[step_id]["status"] = status
                    if status == "in_progress":
                        steps[step_id]["started_at"] = datetime.utcnow().isoformat()
                    elif status == "completed":
                        steps[step_id]["completed_at"] = datetime.utcnow().isoformat()
                    elif status == "failed":
                        steps[step_id]["error_message"] = error_message
                tenant.deployment_config["provisioning_steps"] = steps
                db.commit()
        
        # Step 1: Create Kubernetes namespace
        update_step_status("namespace", "in_progress")
        try:
            await k8s_provisioning_service._create_namespace(f"tenant-{tenant_id[:8]}")
            update_step_status("namespace", "completed")
        except Exception as e:
            update_step_status("namespace", "failed", str(e))
            raise
        
        # Step 2: Deploy with Helm
        update_step_status("deployment", "in_progress")
        try:
            helm_values = await k8s_provisioning_service._generate_helm_values(
                tenant_id, company_name, subdomain, "pro"
            )
            deployment_result = await k8s_provisioning_service._deploy_with_helm(
                f"tenant-{tenant_id[:8]}", helm_values
            )
            update_step_status("deployment", "completed")
        except Exception as e:
            update_step_status("deployment", "failed", str(e))
            raise
        
        # Step 3: Configure DNS
        update_step_status("dns", "in_progress")
        try:
            dns_result = await k8s_provisioning_service._configure_dns(subdomain)
            if dns_result["success"]:
                update_step_status("dns", "completed")
            else:
                update_step_status("dns", "failed", dns_result.get("error", "DNS configuration failed"))
        except Exception as e:
            update_step_status("dns", "failed", str(e))
            # DNS failure is not critical, continue
        
        # Step 4: Request SSL certificate
        update_step_status("ssl", "in_progress")
        try:
            ssl_result = await k8s_provisioning_service._request_ssl_certificate(
                subdomain, f"tenant-{tenant_id[:8]}"
            )
            if ssl_result["success"]:
                update_step_status("ssl", "completed")
            else:
                update_step_status("ssl", "failed", ssl_result.get("error", "SSL certificate failed"))
        except Exception as e:
            update_step_status("ssl", "failed", str(e))
            # SSL failure is not critical, continue
        
        # Step 5: Wait for deployment to be ready
        update_step_status("database", "in_progress")
        try:
            await k8s_provisioning_service._wait_for_deployment_ready(f"tenant-{tenant_id[:8]}")
            update_step_status("database", "completed")
        except Exception as e:
            update_step_status("database", "failed", str(e))
            raise
        
        # Step 6: Initialize tenant data
        update_step_status("auth", "in_progress")
        try:
            await k8s_provisioning_service._initialize_tenant_data(tenant_id, f"tenant-{tenant_id[:8]}")
            update_step_status("auth", "completed")
        except Exception as e:
            update_step_status("auth", "failed", str(e))
            # Auth initialization failure is not critical
        
        # Update tenant status to active
        tenant = db.query(ProTenant).filter(ProTenant.id == tenant_id).first()
        if tenant:
            tenant.status = "active"
            tenant.access_url = f"https://{subdomain}"
            tenant.admin_credentials = {
                "email": f"admin@{generate_company_slug(company_name)}.com",
                "password": generate_secure_password()
            }
            tenant.provisioned_at = datetime.utcnow()
            tenant.kubernetes_namespace = f"tenant-{tenant_id[:8]}"
            tenant.ssl_certificate_status = "active"
            db.commit()
        
        # Log completion event
        signup_event = SignupEvent(
            id=str(uuid.uuid4()),
            user_id=tenant.user_id,
            event_type="provisioning_completed",
            event_data={
                "tenant_id": tenant_id,
                "subdomain": subdomain,
                "access_url": f"https://{subdomain}"
            }
        )
        db.add(signup_event)
        db.commit()
        
        # Log to telemetry
        await telemetry_service.log_provisioning_event(
            user_id=tenant.user_id,
            tenant_id=tenant_id,
            status="completed"
        )
        
        logger.info(f"Successfully provisioned tenant {tenant_id}")
        
    except Exception as e:
        logger.error(f"Failed to provision tenant {tenant_id}: {str(e)}")
        
        # Update tenant status to failed
        tenant = db.query(ProTenant).filter(ProTenant.id == tenant_id).first()
        if tenant:
            tenant.status = "failed"
            db.commit()
        
        # Log failure event
        signup_event = SignupEvent(
            id=str(uuid.uuid4()),
            user_id=tenant.user_id,
            event_type="provisioning_failed",
            event_data={
                "tenant_id": tenant_id,
                "error": str(e)
            }
        )
        db.add(signup_event)
        db.commit()
        
        # Log to telemetry
        await telemetry_service.log_provisioning_event(
            user_id=tenant.user_id,
            tenant_id=tenant_id,
            status="failed",
            error_message=str(e)
        )

async def log_provisioning_telemetry(user_id: str, tenant_id: str, status: str):
    """Log provisioning event to telemetry"""
    try:
        await telemetry_service.log_provisioning_event(
            user_id=user_id,
            tenant_id=tenant_id,
            status=status
        )
    except Exception as e:
        logger.error(f"Failed to log provisioning telemetry: {e}")

def generate_company_slug(company_name: str) -> str:
    """Generate a valid subdomain slug from company name"""
    # Convert to lowercase and replace spaces/special chars with hyphens
    slug = company_name.lower().replace(" ", "-").replace("_", "-")
    # Remove special characters and ensure it's valid
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    # Ensure it doesn't start or end with hyphen
    slug = slug.strip('-')
    # Limit length
    slug = slug[:50]
    return slug

def generate_secure_password() -> str:
    """Generate a secure password"""
    import secrets
    import string
    
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(12))
    return password
