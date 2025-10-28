from pydantic import BaseModel, EmailStr, Field, validator, model_validator
from datetime import datetime
from typing import List, Dict, Any, Optional
from enum import Enum
import re

class SubscriptionTier(str, Enum):
    KICKSTART = "kickstart"
    PRO = "pro"
    CUSTOM = "custom"

class PaymentMethodType(str, Enum):
    VISA = "visa"
    MASTERCARD = "mastercard"
    INTERAC = "interac"
    ACH = "ach"

class BillingCycle(str, Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"

class PackageType(str, Enum):
    HELM = "helm"
    DOCKER_COMPOSE = "docker-compose"
    BINARY = "binary"

class PackageFormat(str, Enum):
    KUBERNETES = "kubernetes"
    DOCKER = "docker"
    LINUX_BINARY = "linux-binary"
    WINDOWS_BINARY = "windows-binary"
    MACOS_BINARY = "macos-binary"

# Personal email domains to block
PERSONAL_EMAIL_DOMAINS = {
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
    'msn.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com',
    'protonmail.com', 'tutanota.com', 'yandex.com', 'mail.com',
    'gmx.com', 'web.de', 't-online.de', 'orange.fr', 'free.fr',
    'libero.it', 'virgilio.it', 'alice.it', 'tiscali.it',
    'terra.com.br', 'uol.com.br', 'ig.com.br', 'bol.com.br',
    'naver.com', 'daum.net', 'hanmail.net', 'nate.com',
    'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com',
    'rediffmail.com', 'sify.com', 'indiatimes.com', 'vsnl.com'
}

class SignupRequest(BaseModel):
    # Basic user information
    name: str = Field(..., min_length=2, max_length=100, description="Full name")
    job_title: str = Field(..., min_length=2, max_length=100, description="Job title")
    company_name: str = Field(..., min_length=2, max_length=100, description="Company name")
    company_email: EmailStr = Field(..., description="Business email (must be company domain, will be verified)")
    
    # Subscription details
    subscription_tier: SubscriptionTier = Field(..., description="Subscription tier")
    billing_cycle: BillingCycle = Field(default=BillingCycle.MONTHLY, description="Billing cycle")
    skip_payment: bool = Field(default=True, description="Skip payment for Kickstart plan")
    
    # Address information
    address_street: str = Field(..., min_length=5, max_length=200, description="Street address")
    address_city: str = Field(..., min_length=2, max_length=100, description="City")
    address_state: str = Field(..., min_length=2, max_length=100, description="State/Province")
    address_zip: str = Field(..., min_length=3, max_length=20, description="ZIP/Postal code")
    address_country: str = Field(..., min_length=2, max_length=100, description="Country")
    
    # Additional information
    industry: Optional[str] = Field(None, max_length=100, description="Industry")
    team_size: Optional[str] = Field(None, max_length=50, description="Team size")
    hear_about_us: Optional[str] = Field(None, max_length=100, description="How did you hear about us")
    
    # Payment information (optional for Kickstart, required for others)
    payment_method_type: Optional[PaymentMethodType] = Field(None, description="Payment method type")
    stripe_payment_method_id: Optional[str] = Field(None, description="Stripe payment method ID")
    
    # Terms acceptance
    terms_accepted: bool = Field(..., description="Must accept terms of service")
    privacy_accepted: bool = Field(..., description="Must accept privacy policy")
    
    @validator('company_email')
    def validate_company_email(cls, v):
        """Validate that company email is not from a personal domain"""
        domain = v.split('@')[1].lower()
        if domain in PERSONAL_EMAIL_DOMAINS:
            raise ValueError(
                f"Company email must use a business domain. Personal email domains like {domain} are not allowed. "
                f"Please use your company email address."
            )
        return v
    
    @validator('address_zip')
    def validate_zip_code(cls, v, values):
        """Validate ZIP code format based on country"""
        country = values.get('address_country', '').lower()
        if country in ['united states', 'usa', 'us']:
            # US ZIP code validation
            if not re.match(r'^\d{5}(-\d{4})?$', v):
                raise ValueError("US ZIP code must be in format 12345 or 12345-6789")
        elif country in ['canada', 'ca']:
            # Canadian postal code validation
            if not re.match(r'^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$', v):
                raise ValueError("Canadian postal code must be in format A1A 1A1")
        return v
    
    @model_validator(mode='before')
    def validate_payment_requirements(cls, values):
        """Validate payment requirements based on subscription tier"""
        tier = values.get('subscription_tier')
        skip_payment = values.get('skip_payment', True)
        payment_method = values.get('stripe_payment_method_id')
        
        if tier == SubscriptionTier.PRO:
            if skip_payment or not payment_method:
                raise ValueError("Pro plan requires payment method")
        elif tier == SubscriptionTier.CUSTOM:
            if not skip_payment and not payment_method:
                raise ValueError("Payment method required when not skipping payment")
        
        return values
    
    @validator('terms_accepted', 'privacy_accepted')
    def validate_terms_acceptance(cls, v):
        """Validate that terms and privacy policy are accepted"""
        if not v:
            raise ValueError("You must accept the terms of service and privacy policy")
        return v

class SignupResponse(BaseModel):
    user_id: str
    email: str
    company_name: str
    subscription_tier: SubscriptionTier
    billing_cycle: BillingCycle
    requires_payment: bool
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    trial_end: Optional[datetime] = None
    next_steps: List[str]
    created_at: datetime

class DownloadPackageRequest(BaseModel):
    package_type: PackageType
    package_format: PackageFormat
    version: str = Field(default="2.0.0", description="Package version")

class DownloadPackageResponse(BaseModel):
    package_id: str
    download_url: str
    file_size: int
    expires_at: datetime
    deployment_instructions: Dict[str, Any]
    components: List[str]
    requirements: Dict[str, Any]

class ProTenantProvisioningRequest(BaseModel):
    user_id: str
    company_name: str
    stripe_customer_id: str
    stripe_subscription_id: str

class ProTenantProvisioningResponse(BaseModel):
    tenant_id: str
    tenant_name: str
    subdomain: str
    domain: str
    status: str  # provisioning, active, failed
    access_url: Optional[str] = None
    admin_credentials: Optional[Dict[str, str]] = None
    estimated_completion_time: Optional[int] = None  # minutes
    created_at: datetime

class ProTenantStatusResponse(BaseModel):
    tenant_id: str
    status: str
    progress_percentage: float
    current_step: str
    estimated_completion_time: Optional[int] = None
    error_message: Optional[str] = None
    access_url: Optional[str] = None
    admin_credentials: Optional[Dict[str, str]] = None

class OnboardingStep(BaseModel):
    step_id: str
    title: str
    description: str
    status: str  # pending, completed, failed
    order: int

class OnboardingProgress(BaseModel):
    user_id: str
    current_step: str
    completed_steps: int
    total_steps: int
    progress_percentage: float
    estimated_completion_time: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    company_name: str
    company_email: str
    subscription_tier: SubscriptionTier
    billing_cycle: BillingCycle
    created_at: datetime
    is_active: bool
    email_verified: bool

class StripeWebhookEvent(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    created: int
    livemode: bool
    pending_webhooks: int
    request: Optional[Dict[str, Any]] = None

class StripeCustomerData(BaseModel):
    id: str
    email: str
    name: str
    metadata: Dict[str, Any]

class StripeSubscriptionData(BaseModel):
    id: str
    customer: str
    status: str
    current_period_start: int
    current_period_end: int
    trial_start: Optional[int] = None
    trial_end: Optional[int] = None
    metadata: Dict[str, Any]

class StripeInvoiceData(BaseModel):
    id: str
    customer: str
    subscription: Optional[str] = None
    status: str
    amount_paid: int
    amount_due: int
    currency: str
    created: int
    due_date: Optional[int] = None
