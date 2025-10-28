from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum

Base = declarative_base()

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

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    job_title = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    company_email = Column(String, unique=True, index=True, nullable=False)  # Business email (must be company domain)
    subscription_tier = Column(String, nullable=False)  # kickstart, pro, custom
    billing_cycle = Column(String, default=BillingCycle.MONTHLY)
    
    # Address fields for tax calculation
    address_street = Column(String, nullable=False)
    address_city = Column(String, nullable=False)
    address_state = Column(String, nullable=False)
    address_zip = Column(String, nullable=False)
    address_country = Column(String, nullable=False)
    
    # Additional fields
    industry = Column(String, nullable=True)
    team_size = Column(String, nullable=True)
    hear_about_us = Column(String, nullable=True)
    
    # Terms and privacy acceptance
    terms_accepted_at = Column(DateTime, nullable=False)
    privacy_accepted_at = Column(DateTime, nullable=False)
    
    # Status and timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)

class StripeCustomer(Base):
    __tablename__ = "stripe_customers"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, unique=True)
    stripe_customer_id = Column(String, unique=True, nullable=False)
    stripe_subscription_id = Column(String, nullable=True)
    payment_method_type = Column(String, nullable=True)  # visa, mastercard, interac, ach
    payment_status = Column(String, default="pending")  # pending, active, failed, cancelled
    trial_end = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class StripeProduct(Base):
    __tablename__ = "stripe_products"
    
    id = Column(String, primary_key=True, index=True)
    stripe_product_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tier = Column(String, nullable=False)  # kickstart, pro, custom
    status = Column(String, default="active")  # active, inactive
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class StripePrice(Base):
    __tablename__ = "stripe_prices"
    
    id = Column(String, primary_key=True, index=True)
    stripe_price_id = Column(String, unique=True, nullable=False)
    stripe_product_id = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)  # Amount in cents
    currency = Column(String, default="usd")
    billing_cycle = Column(String, nullable=False)  # monthly, annual
    trial_days = Column(Integer, default=0)
    status = Column(String, default="active")  # active, inactive
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class ProTenant(Base):
    __tablename__ = "pro_tenants"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, unique=True)
    tenant_name = Column(String, nullable=False)
    subdomain = Column(String, unique=True, nullable=False)  # companyname.app.controlcore.io
    domain = Column(String, nullable=False)  # Full domain
    status = Column(String, default="provisioning")  # provisioning, active, failed, suspended
    kubernetes_namespace = Column(String, nullable=True)
    ssl_certificate_status = Column(String, default="pending")  # pending, active, failed
    deployment_config = Column(JSON, nullable=True)  # Store deployment configuration
    access_url = Column(String, nullable=True)
    admin_credentials = Column(JSON, nullable=True)  # Store initial admin credentials
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    provisioned_at = Column(DateTime, nullable=True)

class OnboardingStep(Base):
    __tablename__ = "onboarding_steps"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    step_id = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, completed, failed
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

class DeploymentPackage(Base):
    __tablename__ = "deployment_packages"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    package_id = Column(String, unique=True, nullable=False)
    package_type = Column(String, nullable=False)  # helm, docker-compose, binary
    package_format = Column(String, nullable=False)  # kubernetes, docker, linux-binary, etc.
    download_url = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    expires_at = Column(DateTime, nullable=False)
    is_downloaded = Column(Boolean, default=False)
    downloaded_at = Column(DateTime, nullable=True)
    download_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

class SignupEvent(Base):
    __tablename__ = "signup_events"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)  # signup, payment, provisioning, download
    event_data = Column(JSON, nullable=True)  # Store event-specific data
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
