"""
Stripe Integration Service for Control Core Signup
Handles complete customer lifecycle from signup to deployment
"""

import stripe
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json
import requests
from dataclasses import dataclass
from enum import Enum
import sys
import os

# Add cc-pap-core to path for Auth0 service
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../cc-pap-core'))
from auth0_service import Auth0Service, Auth0Tenant, Auth0User, Auth0Role

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TierType(Enum):
    KICKSTART = "kickstart"
    PRO = "pro"
    CUSTOM = "custom"

@dataclass
class CustomerData:
    email: str
    name: str
    company: str
    tier: TierType
    region: str = "us-east-1"
    source: str = "website"
    sales_rep: str = "sales@controlcore.io"
    metadata: Dict[str, Any] = None

@dataclass
class DeploymentConfig:
    deployment_id: str
    tier: TierType
    region: str
    domain: Optional[str] = None
    ssl_mode: str = "letsencrypt"
    performance_mode: str = "standard"
    custom_config: Dict[str, Any] = None

class StripeIntegrationService:
    """
    Complete Stripe integration for Control Core signup and deployment
    """
    
    def __init__(self, stripe_secret_key: str, bac_api_url: str, auth0_domain: str, auth0_client_id: str, auth0_client_secret: str):
        self.stripe_secret_key = stripe_secret_key
        self.bac_api_url = bac_api_url
        stripe.api_key = stripe_secret_key
        
        # Initialize Auth0 service
        self.auth0_service = Auth0Service(auth0_domain, auth0_client_id, auth0_client_secret)
        
        # Control Core product and pricing configuration
        self.products = {
            TierType.KICKSTART: {
                "name": "Control Core Kickstart",
                "description": "90-day free trial with basic features",
                "price_ids": {
                    "monthly": "price_kickstart_monthly",
                    "annual": "price_kickstart_annual"
                },
                "amounts": {
                    "monthly": 0,  # Free trial
                    "annual": 0    # Free trial
                },
                "trial_days": 90,
                "features": [
                    "Basic policy management",
                    "1M API calls per month",
                    "Email support",
                    "Sandbox environment",
                    "Standard deployment",
                    "Self-hosted Control Plane"
                ],
                "limits": {
                    "max_policies": 100,
                    "max_resources": 50,
                    "max_bouncers": 5,
                    "api_calls_per_month": 1000000,
                    "policy_evaluations_per_month": 5000000
                }
            },
            TierType.PRO: {
                "name": "Control Core Pro",
                "description": "Professional tier with hosted Control Plane",
                "price_ids": {
                    "monthly": "price_pro_monthly",
                    "annual": "price_pro_annual"
                },
                "amounts": {
                    "monthly": 29900,  # $299/month
                    "annual": 299000   # $2990/year (2 months free)
                },
                "trial_days": 14,
                "features": [
                    "Hosted Control Plane",
                    "Advanced policy management",
                    "10M API calls per month",
                    "Priority support",
                    "Sandbox + Production environments",
                    "Usage-based billing",
                    "API access",
                    "Multi-tenant support",
                    "SSL certificates included",
                    "99.9% uptime SLA"
                ],
                "limits": {
                    "max_policies": 1000,
                    "max_resources": 500,
                    "max_bouncers": 50,
                    "api_calls_per_month": 10000000,
                    "policy_evaluations_per_month": 50000000
                }
            },
            TierType.CUSTOM: {
                "name": "Control Core Custom",
                "description": "Enterprise tier with full customization",
                "price_ids": {
                    "monthly": "price_custom_monthly",
                    "annual": "price_custom_annual"
                },
                "amounts": {
                    "monthly": 99900,  # $999/month
                    "annual": 999000   # $9990/year (2 months free)
                },
                "trial_days": 30,
                "features": [
                    "Full customization",
                    "Unlimited API calls",
                    "Dedicated support",
                    "On-premise deployment",
                    "Custom integrations",
                    "SLA guarantee",
                    "Dedicated infrastructure",
                    "White-label options",
                    "Custom compliance frameworks"
                ],
                "limits": {
                    "max_policies": -1,  # Unlimited
                    "max_resources": -1,  # Unlimited
                    "max_bouncers": -1,   # Unlimited
                    "api_calls_per_month": -1,  # Unlimited
                    "policy_evaluations_per_month": -1  # Unlimited
                }
            }
        }
        
        # Tax rates by country/region
        self.tax_rates = {
            "US": {
                "federal": 0.0,  # No federal tax on software
                "states": {
                    "CA": 0.0725,  # California
                    "NY": 0.08,    # New York
                    "TX": 0.0625,  # Texas
                    "FL": 0.06,    # Florida
                    "WA": 0.065,   # Washington
                }
            },
            "CA": {
                "federal": 0.05,  # GST
                "provinces": {
                    "ON": 0.08,   # Ontario HST
                    "BC": 0.12,   # British Columbia HST
                    "QC": 0.14975, # Quebec GST + QST
                    "AB": 0.05,   # Alberta GST only
                }
            },
            "EU": {
                "vat_rates": {
                    "DE": 0.19,   # Germany
                    "FR": 0.20,   # France
                    "IT": 0.22,   # Italy
                    "ES": 0.21,   # Spain
                    "NL": 0.21,   # Netherlands
                }
            }
        }

    async def create_customer_account(self, customer_data: CustomerData) -> Dict[str, Any]:
        """
        Create complete customer account in Stripe with all necessary setup
        """
        try:
            logger.info(f"Creating Stripe customer for {customer_data.email}")
            
            # Create Stripe customer
            stripe_customer = stripe.Customer.create(
                email=customer_data.email,
                name=customer_data.name,
                metadata={
                    "company": customer_data.company,
                    "tier": customer_data.tier.value,
                    "region": customer_data.region,
                    "source": customer_data.source,
                    "sales_rep": customer_data.sales_rep,
                    "signup_date": datetime.utcnow().isoformat(),
                    "deployment_status": "pending"
                }
            )
            
            # Create subscription based on tier
            subscription = await self._create_subscription(stripe_customer.id, customer_data.tier)
            
            # Create Auth0 tenant for customer
            auth0_tenant = await self._create_auth0_tenant(customer_data, stripe_customer.id)
            
            # Generate deployment configuration
            deployment_config = self._generate_deployment_config(customer_data, stripe_customer.id, auth0_tenant)
            
            # Log to BAC (Business Admin Console)
            await self._log_to_bac(stripe_customer, subscription, deployment_config, auth0_tenant)
            
            return {
                "customer_id": stripe_customer.id,
                "subscription_id": subscription.id,
                "deployment_config": deployment_config,
                "status": "account_created"
            }
            
        except Exception as e:
            logger.error(f"Failed to create customer account: {str(e)}")
            raise

    async def _create_subscription(self, customer_id: str, tier: TierType, billing_cycle: str = "monthly") -> stripe.Subscription:
        """
        Create subscription based on tier with appropriate trial period and billing cycle
        """
        product_config = self.products[tier]
        price_id = product_config["price_ids"][billing_cycle]
        
        subscription_params = {
            "customer": customer_id,
            "items": [{
                "price": price_id,
                "quantity": 1
            }],
            "metadata": {
                "tier": tier.value,
                "billing_cycle": billing_cycle,
                "features": json.dumps(product_config["features"]),
                "deployment_type": self._get_deployment_type(tier),
                "limits": json.dumps(product_config["limits"])
            }
        }
        
        # Add trial period for non-kickstart tiers
        if tier != TierType.KICKSTART and product_config["trial_days"] > 0:
            subscription_params["trial_period_days"] = product_config["trial_days"]
        
        # Add proration settings for upgrades/downgrades
        subscription_params["proration_behavior"] = "create_prorations"
        
        return stripe.Subscription.create(**subscription_params)
    
    def calculate_tax(self, amount: int, country: str, state: str = None) -> Dict[str, Any]:
        """
        Calculate tax based on customer location
        """
        tax_amount = 0
        tax_rate = 0
        tax_details = {}
        
        if country.upper() == "US":
            # US state tax
            if state and state.upper() in self.tax_rates["US"]["states"]:
                tax_rate = self.tax_rates["US"]["states"][state.upper()]
                tax_amount = int(amount * tax_rate)
                tax_details = {
                    "type": "state_tax",
                    "rate": tax_rate,
                    "jurisdiction": state.upper()
                }
        elif country.upper() == "CA":
            # Canadian tax (GST + provincial)
            gst_rate = self.tax_rates["CA"]["federal"]
            gst_amount = int(amount * gst_rate)
            
            provincial_rate = 0
            provincial_amount = 0
            if state and state.upper() in self.tax_rates["CA"]["provinces"]:
                provincial_rate = self.tax_rates["CA"]["provinces"][state.upper()]
                provincial_amount = int(amount * provincial_rate)
            
            tax_amount = gst_amount + provincial_amount
            tax_rate = gst_rate + provincial_rate
            tax_details = {
                "type": "gst_hst",
                "gst_rate": gst_rate,
                "gst_amount": gst_amount,
                "provincial_rate": provincial_rate,
                "provincial_amount": provincial_amount,
                "jurisdiction": state.upper() if state else "CA"
            }
        elif country.upper() in self.tax_rates["EU"]["vat_rates"]:
            # EU VAT
            vat_rate = self.tax_rates["EU"]["vat_rates"][country.upper()]
            tax_amount = int(amount * vat_rate)
            tax_rate = vat_rate
            tax_details = {
                "type": "vat",
                "rate": vat_rate,
                "jurisdiction": country.upper()
            }
        
        return {
            "tax_amount": tax_amount,
            "tax_rate": tax_rate,
            "tax_details": tax_details,
            "total_amount": amount + tax_amount
        }
    
    async def create_usage_record(self, subscription_item_id: str, quantity: int, timestamp: int = None) -> stripe.UsageRecord:
        """
        Create usage record for metered billing (Custom tier)
        """
        params = {
            "subscription_item": subscription_item_id,
            "quantity": quantity
        }
        
        if timestamp:
            params["timestamp"] = timestamp
        
        return stripe.UsageRecord.create(**params)
    
    async def get_usage_summary(self, subscription_item_id: str, start: int, end: int) -> Dict[str, Any]:
        """
        Get usage summary for a subscription item
        """
        usage_records = stripe.UsageRecord.list(
            subscription_item=subscription_item_id,
            created={"gte": start, "lte": end}
        )
        
        total_usage = sum(record.quantity for record in usage_records.data)
        
        return {
            "subscription_item_id": subscription_item_id,
            "period_start": start,
            "period_end": end,
            "total_usage": total_usage,
            "usage_records": len(usage_records.data)
        }
    
    async def handle_dunning(self, customer_id: str, invoice_id: str) -> Dict[str, Any]:
        """
        Handle dunning management for failed payments
        """
        try:
            # Get the failed invoice
            invoice = stripe.Invoice.retrieve(invoice_id)
            
            # Get customer
            customer = stripe.Customer.retrieve(customer_id)
            
            # Check payment method
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type="card"
            )
            
            dunning_actions = []
            
            if not payment_methods.data:
                # No payment method - send email to add one
                dunning_actions.append({
                    "action": "send_payment_method_email",
                    "reason": "no_payment_method"
                })
            else:
                # Try to charge the invoice again
                try:
                    stripe.Invoice.pay(invoice_id)
                    dunning_actions.append({
                        "action": "payment_retry_success",
                        "invoice_id": invoice_id
                    })
                except stripe.error.CardError as e:
                    # Card declined - send dunning email
                    dunning_actions.append({
                        "action": "send_dunning_email",
                        "reason": "card_declined",
                        "error": str(e)
                    })
                    
                    # Schedule retry in 3 days
                    dunning_actions.append({
                        "action": "schedule_retry",
                        "retry_date": datetime.utcnow() + timedelta(days=3)
                    })
            
            return {
                "customer_id": customer_id,
                "invoice_id": invoice_id,
                "dunning_actions": dunning_actions,
                "status": "processed"
            }
            
        except Exception as e:
            logger.error(f"Failed to handle dunning for customer {customer_id}: {str(e)}")
            raise
    
    async def create_invoice(self, customer_id: str, subscription_id: str = None, 
                           line_items: List[Dict] = None) -> stripe.Invoice:
        """
        Create custom invoice with line items
        """
        invoice_params = {
            "customer": customer_id,
            "auto_advance": True,  # Automatically finalize and attempt payment
            "collection_method": "charge_automatically"
        }
        
        if subscription_id:
            invoice_params["subscription"] = subscription_id
        
        invoice = stripe.Invoice.create(**invoice_params)
        
        if line_items:
            for item in line_items:
                stripe.InvoiceItem.create(
                    customer=customer_id,
                    invoice=invoice.id,
                    amount=item["amount"],
                    currency=item.get("currency", "usd"),
                    description=item.get("description", ""),
                    metadata=item.get("metadata", {})
                )
        
        # Finalize the invoice
        return stripe.Invoice.finalize_invoice(invoice.id)
    
    async def update_subscription(self, subscription_id: str, new_tier: TierType, 
                                new_billing_cycle: str = None) -> stripe.Subscription:
        """
        Update subscription tier and/or billing cycle with prorated billing
        """
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Get new price ID
        new_product_config = self.products[new_tier]
        new_price_id = new_product_config["price_ids"][new_billing_cycle or "monthly"]
        
        # Update subscription
        updated_subscription = stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": subscription["items"]["data"][0]["id"],
                "price": new_price_id
            }],
            proration_behavior="create_prorations",
            metadata={
                "tier": new_tier.value,
                "billing_cycle": new_billing_cycle or "monthly",
                "updated_at": datetime.utcnow().isoformat()
            }
        )
        
        return updated_subscription

    async def _create_auth0_tenant(self, customer_data: CustomerData, customer_id: str) -> Auth0Tenant:
        """
        Create Auth0 tenant for customer
        """
        try:
            logger.info(f"Creating Auth0 tenant for customer {customer_id}")
            
            tenant_config = {
                "company": customer_data.company,
                "tier": customer_data.tier.value,
                "region": customer_data.region,
                "domain": f"{customer_data.company.lower().replace(' ', '-')}.controlcore.io"
            }
            
            # Create Auth0 tenant
            auth0_tenant = self.auth0_service.create_tenant(tenant_config)
            
            # Create default admin user in Auth0
            admin_user_data = {
                "email": customer_data.email,
                "name": customer_data.name,
                "company": customer_data.company,
                "roles": [Auth0Role.ADMIN],
                "email_verified": True
            }
            
            admin_user = self.auth0_service.create_user(auth0_tenant, admin_user_data)
            
            logger.info(f"Successfully created Auth0 tenant: {auth0_tenant.tenant_id}")
            return auth0_tenant
            
        except Exception as e:
            logger.error(f"Failed to create Auth0 tenant: {str(e)}")
            raise

    def _get_deployment_type(self, tier: TierType) -> str:
        """
        Determine deployment type based on tier
        """
        if tier == TierType.KICKSTART:
            return "hybrid"  # Control Plane hosted, Bouncer self-hosted
        elif tier == TierType.PRO:
            return "hybrid"  # Control Plane hosted, Bouncer self-hosted
        else:  # CUSTOM
            return "custom"  # Fully self-hosted

    def _generate_deployment_config(self, customer_data: CustomerData, customer_id: str, auth0_tenant: Auth0Tenant) -> DeploymentConfig:
        """
        Generate deployment configuration based on tier and customer requirements
        """
        deployment_id = f"dep_{customer_id[-8:]}"
        
        # Determine domain based on tier
        if customer_data.tier == TierType.CUSTOM:
            domain = f"{customer_data.company.lower().replace(' ', '-')}.controlcore.io"
        else:
            domain = None  # Use hosted Control Plane
            
        return DeploymentConfig(
            deployment_id=deployment_id,
            tier=customer_data.tier,
            region=customer_data.region,
            domain=domain,
            ssl_mode="letsencrypt" if domain else "disabled",
            performance_mode="high" if customer_data.tier == TierType.CUSTOM else "standard",
            custom_config={
                "tier": customer_data.tier.value,
                "features": self.products[customer_data.tier]["features"],
                "customer_id": customer_id,
                "auth0_tenant_id": auth0_tenant.tenant_id,
                "auth0_domain": auth0_tenant.domain,
                "auth0_client_id": auth0_tenant.client_id,
                "auth0_audience": auth0_tenant.audience,
                "created_at": datetime.utcnow().isoformat()
            }
        )

    async def _log_to_bac(self, customer: stripe.Customer, subscription: stripe.Subscription, 
                         deployment_config: DeploymentConfig, auth0_tenant: Auth0Tenant) -> None:
        """
        Log customer creation and deployment config to Business Admin Console
        """
        try:
            bac_payload = {
                "event_type": "customer_signup",
                "timestamp": datetime.utcnow().isoformat(),
                "customer": {
                    "id": customer.id,
                    "email": customer.email,
                    "name": customer.name,
                    "company": customer.metadata.get("company"),
                    "tier": customer.metadata.get("tier"),
                    "region": customer.metadata.get("region"),
                    "source": customer.metadata.get("source"),
                    "sales_rep": customer.metadata.get("sales_rep")
                },
                "subscription": {
                    "id": subscription.id,
                    "status": subscription.status,
                    "tier": subscription.metadata.get("tier"),
                    "trial_end": subscription.trial_end,
                    "current_period_end": subscription.current_period_end
                },
                "deployment": {
                    "deployment_id": deployment_config.deployment_id,
                    "tier": deployment_config.tier.value,
                    "region": deployment_config.region,
                    "domain": deployment_config.domain,
                    "deployment_type": self._get_deployment_type(deployment_config.tier),
                    "ssl_mode": deployment_config.ssl_mode,
                    "performance_mode": deployment_config.performance_mode
                },
                "auth0": {
                    "tenant_id": auth0_tenant.tenant_id,
                    "domain": auth0_tenant.domain,
                    "client_id": auth0_tenant.client_id,
                    "audience": auth0_tenant.audience,
                    "connection": auth0_tenant.connection
                }
            }
            
            # Send to BAC API
            response = requests.post(
                f"{self.bac_api_url}/api/events/customer-signup",
                json=bac_payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully logged customer signup to BAC: {customer.id}")
            else:
                logger.warning(f"Failed to log to BAC: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Failed to log to BAC: {str(e)}")

    async def trigger_deployment(self, customer_id: str, deployment_config: DeploymentConfig) -> Dict[str, Any]:
        """
        Trigger automated deployment based on tier and configuration
        """
        try:
            logger.info(f"Triggering deployment for customer {customer_id}")
            
            # Generate deployment package
            deployment_package = await self._generate_deployment_package(deployment_config)
            
            # Trigger deployment based on tier
            if deployment_config.tier == TierType.KICKSTART:
                return await self._deploy_kickstart(deployment_package, deployment_config)
            elif deployment_config.tier == TierType.PRO:
                return await self._deploy_pro(deployment_package, deployment_config)
            else:  # CUSTOM
                return await self._deploy_custom(deployment_package, deployment_config)
                
        except Exception as e:
            logger.error(f"Failed to trigger deployment: {str(e)}")
            raise

    async def _generate_deployment_package(self, deployment_config: DeploymentConfig) -> Dict[str, Any]:
        """
        Generate deployment package with all necessary files and configurations
        """
        package = {
            "deployment_id": deployment_config.deployment_id,
            "tier": deployment_config.tier.value,
            "region": deployment_config.region,
            "domain": deployment_config.domain,
            "ssl_mode": deployment_config.ssl_mode,
            "performance_mode": deployment_config.performance_mode,
            "helm_charts": self._get_helm_charts(deployment_config.tier),
            "docker_compose": self._get_docker_compose(deployment_config.tier),
            "scripts": self._get_deployment_scripts(deployment_config.tier),
            "config": deployment_config.custom_config,
            "created_at": datetime.utcnow().isoformat()
        }
        
        return package

    def _get_helm_charts(self, tier: TierType) -> List[str]:
        """
        Get appropriate Helm charts based on tier
        """
        if tier == TierType.KICKSTART:
            return ["controlcore-bouncer"]
        elif tier == TierType.PRO:
            return ["controlcore-bouncer", "controlcore-monitoring"]
        else:  # CUSTOM
            return ["controlcore-full", "controlcore-monitoring", "controlcore-backup"]

    def _get_docker_compose(self, tier: TierType) -> List[str]:
        """
        Get appropriate Docker Compose files based on tier
        """
        if tier == TierType.KICKSTART:
            return ["bouncer-compose.yml"]
        elif tier == TierType.PRO:
            return ["bouncer-compose.yml", "monitoring-compose.yml"]
        else:  # CUSTOM
            return ["full-stack-compose.yml", "monitoring-compose.yml", "backup-compose.yml"]

    def _get_deployment_scripts(self, tier: TierType) -> List[str]:
        """
        Get appropriate deployment scripts based on tier
        """
        base_scripts = ["deploy.sh", "health-check.sh", "backup.sh"]
        
        if tier == TierType.CUSTOM:
            base_scripts.extend(["ssl-setup.sh", "monitoring-setup.sh", "backup-setup.sh"])
            
        return base_scripts

    async def _deploy_kickstart(self, package: Dict[str, Any], config: DeploymentConfig) -> Dict[str, Any]:
        """
        Deploy Kickstart tier (Hybrid: Control Plane hosted, Bouncer self-hosted)
        """
        logger.info("Deploying Kickstart tier (Hybrid deployment)")
        
        # Kickstart uses hosted Control Plane + local Bouncer
        deployment_result = {
            "deployment_id": config.deployment_id,
            "tier": "kickstart",
            "deployment_type": "hybrid",
            "control_plane_url": "https://app.controlcore.io",
            "bouncer_url": f"https://{config.domain or 'localhost:8080'}",
            "status": "deployed",
            "access_credentials": {
                "email": "admin@controlcore.io",
                "password": "admin123"
            },
            "next_steps": [
                "Access Control Plane at https://app.controlcore.io",
                "Configure Bouncer at your domain",
                "Start enforcing policies"
            ]
        }
        
        # Log deployment to BAC
        await self._log_deployment_to_bac(deployment_result)
        
        return deployment_result

    async def _deploy_pro(self, package: Dict[str, Any], config: DeploymentConfig) -> Dict[str, Any]:
        """
        Deploy Pro tier (Hybrid: Control Plane hosted, Bouncer self-hosted with monitoring)
        """
        logger.info("Deploying Pro tier (Hybrid deployment with monitoring)")
        
        deployment_result = {
            "deployment_id": config.deployment_id,
            "tier": "pro",
            "deployment_type": "hybrid",
            "control_plane_url": "https://app.controlcore.io",
            "bouncer_url": f"https://{config.domain or 'localhost:8080'}",
            "monitoring_url": f"https://monitoring.{config.domain or 'localhost:3001'}",
            "status": "deployed",
            "access_credentials": {
                "email": "admin@controlcore.io",
                "password": "admin123"
            },
            "features": [
                "Advanced policy management",
                "Usage-based billing",
                "Multi-tenant support",
                "Priority support",
                "API access"
            ],
            "next_steps": [
                "Access Control Plane at https://app.controlcore.io",
                "Configure Bouncer with monitoring",
                "Set up usage tracking",
                "Configure multi-tenant settings"
            ]
        }
        
        # Log deployment to BAC
        await self._log_deployment_to_bac(deployment_result)
        
        return deployment_result

    async def _deploy_custom(self, package: Dict[str, Any], config: DeploymentConfig) -> Dict[str, Any]:
        """
        Deploy Custom tier (Fully self-hosted with all components)
        """
        logger.info("Deploying Custom tier (Fully self-hosted)")
        
        deployment_result = {
            "deployment_id": config.deployment_id,
            "tier": "custom",
            "deployment_type": "custom",
            "control_plane_url": f"https://{config.domain}",
            "bouncer_url": f"https://bouncer.{config.domain}",
            "monitoring_url": f"https://monitoring.{config.domain}",
            "backup_url": f"https://backup.{config.domain}",
            "status": "deployed",
            "access_credentials": {
                "email": "admin@controlcore.io",
                "password": "admin123"
            },
            "features": [
                "Full customization",
                "On-premise deployment",
                "Dedicated infrastructure",
                "Custom integrations",
                "SLA guarantee"
            ],
            "next_steps": [
                "Access Control Plane at your domain",
                "Configure SSL certificates",
                "Set up monitoring and backup",
                "Configure custom integrations"
            ]
        }
        
        # Log deployment to BAC
        await self._log_deployment_to_bac(deployment_result)
        
        return deployment_result

    async def _log_deployment_to_bac(self, deployment_result: Dict[str, Any]) -> None:
        """
        Log deployment result to Business Admin Console
        """
        try:
            bac_payload = {
                "event_type": "deployment_completed",
                "timestamp": datetime.utcnow().isoformat(),
                "deployment": deployment_result
            }
            
            response = requests.post(
                f"{self.bac_api_url}/api/events/deployment-completed",
                json=bac_payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully logged deployment to BAC: {deployment_result['deployment_id']}")
            else:
                logger.warning(f"Failed to log deployment to BAC: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Failed to log deployment to BAC: {str(e)}")

    async def handle_stripe_webhook(self, event: Dict[str, Any]) -> None:
        """
        Handle Stripe webhooks for real-time account management
        """
        event_type = event.get("type")
        
        if event_type == "customer.subscription.created":
            await self._handle_subscription_created(event)
        elif event_type == "customer.subscription.updated":
            await self._handle_subscription_updated(event)
        elif event_type == "customer.subscription.deleted":
            await self._handle_subscription_deleted(event)
        elif event_type == "invoice.payment_succeeded":
            await self._handle_payment_succeeded(event)
        elif event_type == "invoice.payment_failed":
            await self._handle_payment_failed(event)
        else:
            logger.info(f"Unhandled Stripe webhook: {event_type}")

    async def _handle_subscription_created(self, event: Dict[str, Any]) -> None:
        """Handle subscription creation"""
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        
        logger.info(f"Subscription created for customer {customer_id}")
        # Additional subscription setup logic here

    async def _handle_subscription_updated(self, event: Dict[str, Any]) -> None:
        """Handle subscription updates"""
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        
        logger.info(f"Subscription updated for customer {customer_id}")
        # Handle subscription changes (upgrades, downgrades, etc.)

    async def _handle_subscription_deleted(self, event: Dict[str, Any]) -> None:
        """Handle subscription cancellation"""
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        
        logger.info(f"Subscription cancelled for customer {customer_id}")
        # Handle subscription cancellation and cleanup

    async def _handle_payment_succeeded(self, event: Dict[str, Any]) -> None:
        """Handle successful payments"""
        invoice = event["data"]["object"]
        customer_id = invoice["customer"]
        
        logger.info(f"Payment succeeded for customer {customer_id}")
        # Handle successful payment logic

    async def _handle_payment_failed(self, event: Dict[str, Any]) -> None:
        """Handle failed payments"""
        invoice = event["data"]["object"]
        customer_id = invoice["customer"]
        
        logger.info(f"Payment failed for customer {customer_id}")
        # Handle failed payment logic (notifications, account suspension, etc.)
