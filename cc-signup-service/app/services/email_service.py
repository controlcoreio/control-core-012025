"""
Email Service for Control Core Signup
Handles all email communications for signup, provisioning, and notifications
"""

import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import aiohttp
import jinja2
from pathlib import Path

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("EMAIL_FROM_ADDRESS", "noreply@controlcore.io")
        self.from_name = os.getenv("EMAIL_FROM_NAME", "Control Core")
        self.template_dir = Path(__file__).parent.parent / "templates" / "emails"
        
        # Initialize Jinja2 environment
        self.jinja_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(str(self.template_dir)),
            autoescape=jinja2.select_autoescape(['html', 'xml'])
        )
    
    async def send_welcome_email(self, user_id: str, email: str, name: str, company_name: str, 
                               tier: str, billing_cycle: str, requires_payment: bool):
        """Send welcome email based on tier"""
        try:
            if tier == "kickstart":
                await self._send_kickstart_welcome(email, name, company_name, billing_cycle)
            elif tier == "pro":
                await self._send_pro_welcome(email, name, company_name, billing_cycle)
            elif tier == "custom":
                await self._send_custom_welcome(email, name, company_name, billing_cycle, requires_payment)
            
            logger.info(f"Sent welcome email to {email} for tier {tier}")
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {email}: {str(e)}")
            raise
    
    async def _send_kickstart_welcome(self, email: str, name: str, company_name: str, billing_cycle: str):
        """Send Kickstart welcome email with download links"""
        template = self.jinja_env.get_template("welcome_kickstart.html")
        
        html_content = template.render(
            name=name,
            company_name=company_name,
            billing_cycle=billing_cycle,
            download_url=f"https://signup.controlcore.io/download?tier=kickstart",
            docs_url="https://docs.controlcore.io/getting-started",
            support_email="support@controlcore.io"
        )
        
        await self._send_email(
            to_email=email,
            subject="Welcome to Control Core Kickstart - Your 90-Day Free Trial",
            html_content=html_content
        )
    
    async def _send_pro_welcome(self, email: str, name: str, company_name: str, billing_cycle: str):
        """Send Pro welcome email with provisioning info"""
        template = self.jinja_env.get_template("welcome_pro.html")
        
        html_content = template.render(
            name=name,
            company_name=company_name,
            billing_cycle=billing_cycle,
            provisioning_time="2-5 minutes",
            support_email="support@controlcore.io",
            docs_url="https://docs.controlcore.io/pro-tier"
        )
        
        await self._send_email(
            to_email=email,
            subject="Welcome to Control Core Pro - Your Tenant is Being Provisioned",
            html_content=html_content
        )
    
    async def _send_custom_welcome(self, email: str, name: str, company_name: str, 
                                 billing_cycle: str, requires_payment: bool):
        """Send Custom welcome email with download links and payment confirmation"""
        template = self.jinja_env.get_template("welcome_custom.html")
        
        html_content = template.render(
            name=name,
            company_name=company_name,
            billing_cycle=billing_cycle,
            requires_payment=requires_payment,
            download_url=f"https://signup.controlcore.io/download?tier=custom",
            docs_url="https://docs.controlcore.io/custom-tier",
            support_email="support@controlcore.io"
        )
        
        subject = "Welcome to Control Core Custom"
        if requires_payment:
            subject += " - Payment Confirmed"
        
        await self._send_email(
            to_email=email,
            subject=subject,
            html_content=html_content
        )
    
    async def send_pro_tenant_ready(self, user_id: str, tenant_url: str, admin_credentials: Dict[str, str]):
        """Send email when Pro tenant is ready"""
        try:
            # Get user details
            from app.database import get_db
            from app.models import User
            
            db = next(get_db())
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                logger.error(f"User {user_id} not found for Pro tenant ready email")
                return
            
            template = self.jinja_env.get_template("pro_tenant_ready.html")
            
            html_content = template.render(
                name=user.name,
                company_name=user.company_name,
                tenant_url=tenant_url,
                admin_email=admin_credentials["email"],
                admin_password=admin_credentials["password"],
                getting_started_url=f"{tenant_url}/getting-started",
                docs_url="https://docs.controlcore.io/pro-tier",
                support_email="support@controlcore.io"
            )
            
            await self._send_email(
                to_email=user.email,
                subject=f"Your Control Core Pro Tenant is Ready - {user.company_name}",
                html_content=html_content
            )
            
            logger.info(f"Sent Pro tenant ready email to {user.email}")
            
        except Exception as e:
            logger.error(f"Failed to send Pro tenant ready email: {str(e)}")
            raise
    
    async def send_deployment_instructions(self, email: str, name: str, tier: str, 
                                         deployment_packages: list):
        """Send deployment instructions with package links"""
        try:
            template = self.jinja_env.get_template("deployment_instructions.html")
            
            html_content = template.render(
                name=name,
                tier=tier,
                deployment_packages=deployment_packages,
                docs_url="https://docs.controlcore.io/deployment",
                support_email="support@controlcore.io"
            )
            
            await self._send_email(
                to_email=email,
                subject=f"Control Core {tier.title()} - Deployment Instructions",
                html_content=html_content
            )
            
            logger.info(f"Sent deployment instructions to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send deployment instructions: {str(e)}")
            raise
    
    async def send_invoice(self, email: str, name: str, invoice_data: Dict[str, Any]):
        """Send invoice email"""
        try:
            template = self.jinja_env.get_template("invoice.html")
            
            html_content = template.render(
                name=name,
                invoice_number=invoice_data["invoice_number"],
                amount=invoice_data["amount"],
                currency=invoice_data["currency"],
                due_date=invoice_data["due_date"],
                invoice_url=invoice_data.get("invoice_url"),
                billing_email="billing@controlcore.io"
            )
            
            await self._send_email(
                to_email=email,
                subject=f"Invoice #{invoice_data['invoice_number']} from Control Core",
                html_content=html_content
            )
            
            logger.info(f"Sent invoice to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send invoice: {str(e)}")
            raise
    
    async def send_payment_failed(self, email: str, name: str, payment_data: Dict[str, Any]):
        """Send payment failed notification"""
        try:
            template = self.jinja_env.get_template("payment_failed.html")
            
            html_content = template.render(
                name=name,
                amount=payment_data["amount"],
                currency=payment_data["currency"],
                retry_date=payment_data.get("retry_date"),
                update_payment_url="https://signup.controlcore.io/update-payment",
                support_email="support@controlcore.io"
            )
            
            await self._send_email(
                to_email=email,
                subject="Payment Failed - Action Required",
                html_content=html_content
            )
            
            logger.info(f"Sent payment failed notification to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send payment failed notification: {str(e)}")
            raise
    
    async def send_trial_ending(self, email: str, name: str, trial_data: Dict[str, Any]):
        """Send trial ending reminder"""
        try:
            template = self.jinja_env.get_template("trial_ending.html")
            
            html_content = template.render(
                name=name,
                trial_end_date=trial_data["trial_end_date"],
                days_remaining=trial_data["days_remaining"],
                upgrade_url="https://signup.controlcore.io/upgrade",
                billing_email="billing@controlcore.io"
            )
            
            await self._send_email(
                to_email=email,
                subject=f"Your Control Core Trial Ends in {trial_data['days_remaining']} Days",
                html_content=html_content
            )
            
            logger.info(f"Sent trial ending reminder to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send trial ending reminder: {str(e)}")
            raise
    
    async def _send_email(self, to_email: str, subject: str, html_content: str):
        """Send email via SendGrid"""
        if not self.sendgrid_api_key:
            logger.warning("SendGrid API key not configured, skipping email send")
            return
        
        headers = {
            "Authorization": f"Bearer {self.sendgrid_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "personalizations": [{
                "to": [{"email": to_email}],
                "subject": subject
            }],
            "from": {
                "email": self.from_email,
                "name": self.from_name
            },
            "content": [{
                "type": "text/html",
                "value": html_content
            }]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers=headers,
                json=data
            ) as response:
                if response.status != 202:
                    error_text = await response.text()
                    raise Exception(f"SendGrid API error: {response.status} - {error_text}")