"""
Stripe Webhook Handler for Control Core Signup
Handles all Stripe webhook events for subscription management
"""

import os
import logging
import stripe
from typing import Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, StripeCustomer, ProTenant, SignupEvent
from app.services.email_service import EmailService
from app.services.telemetry_service import TelemetryService

logger = logging.getLogger(__name__)

class StripeWebhookHandler:
    def __init__(self):
        self.stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        self.email_service = EmailService()
        self.telemetry_service = TelemetryService()
        
        # Configure Stripe
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    
    async def handle_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """Handle incoming Stripe webhook"""
        try:
            # Verify webhook signature
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.stripe_webhook_secret
            )
            
            # Handle the event
            event_type = event['type']
            
            if event_type == 'customer.subscription.created':
                await self._handle_subscription_created(event)
            elif event_type == 'customer.subscription.updated':
                await self._handle_subscription_updated(event)
            elif event_type == 'customer.subscription.deleted':
                await self._handle_subscription_deleted(event)
            elif event_type == 'invoice.payment_succeeded':
                await self._handle_payment_succeeded(event)
            elif event_type == 'invoice.payment_failed':
                await self._handle_payment_failed(event)
            elif event_type == 'customer.subscription.trial_will_end':
                await self._handle_trial_will_end(event)
            elif event_type == 'payment_method.attached':
                await self._handle_payment_method_attached(event)
            else:
                logger.info(f"Unhandled webhook event type: {event_type}")
            
            return {"status": "success", "event_type": event_type}
            
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise
        except Exception as e:
            logger.error(f"Webhook handling error: {e}")
            raise
    
    async def _handle_subscription_created(self, event: Dict[str, Any]):
        """Handle subscription creation"""
        subscription = event['data']['object']
        customer_id = subscription['customer']
        
        logger.info(f"Subscription created: {subscription['id']} for customer {customer_id}")
        
        # Update database
        db = next(get_db())
        stripe_customer = db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == customer_id
        ).first()
        
        if stripe_customer:
            stripe_customer.stripe_subscription_id = subscription['id']
            stripe_customer.payment_status = subscription['status']
            stripe_customer.trial_end = datetime.fromtimestamp(subscription.get('trial_end', 0)) if subscription.get('trial_end') else None
            stripe_customer.current_period_end = datetime.fromtimestamp(subscription['current_period_end'])
            db.commit()
            
            # Log event
            await self._log_webhook_event(
                db, stripe_customer.user_id, "subscription_created", subscription
            )
    
    async def _handle_subscription_updated(self, event: Dict[str, Any]):
        """Handle subscription updates"""
        subscription = event['data']['object']
        customer_id = subscription['customer']
        
        logger.info(f"Subscription updated: {subscription['id']} for customer {customer_id}")
        
        # Update database
        db = next(get_db())
        stripe_customer = db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == customer_id
        ).first()
        
        if stripe_customer:
            stripe_customer.payment_status = subscription['status']
            stripe_customer.trial_end = datetime.fromtimestamp(subscription.get('trial_end', 0)) if subscription.get('trial_end') else None
            stripe_customer.current_period_end = datetime.fromtimestamp(subscription['current_period_end'])
            db.commit()
            
            # Handle status changes
            if subscription['status'] == 'active':
                await self._handle_subscription_activated(stripe_customer.user_id, subscription)
            elif subscription['status'] == 'past_due':
                await self._handle_subscription_past_due(stripe_customer.user_id, subscription)
            elif subscription['status'] == 'canceled':
                await self._handle_subscription_canceled(stripe_customer.user_id, subscription)
            
            # Log event
            await self._log_webhook_event(
                db, stripe_customer.user_id, "subscription_updated", subscription
            )
    
    async def _handle_subscription_deleted(self, event: Dict[str, Any]):
        """Handle subscription cancellation"""
        subscription = event['data']['object']
        customer_id = subscription['customer']
        
        logger.info(f"Subscription deleted: {subscription['id']} for customer {customer_id}")
        
        # Update database
        db = next(get_db())
        stripe_customer = db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == customer_id
        ).first()
        
        if stripe_customer:
            stripe_customer.payment_status = 'canceled'
            db.commit()
            
            # Handle subscription cancellation
            await self._handle_subscription_canceled(stripe_customer.user_id, subscription)
            
            # Log event
            await self._log_webhook_event(
                db, stripe_customer.user_id, "subscription_deleted", subscription
            )
    
    async def _handle_payment_succeeded(self, event: Dict[str, Any]):
        """Handle successful payment"""
        invoice = event['data']['object']
        customer_id = invoice['customer']
        
        logger.info(f"Payment succeeded for customer {customer_id}, invoice {invoice['id']}")
        
        # Update database
        db = next(get_db())
        stripe_customer = db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == customer_id
        ).first()
        
        if stripe_customer:
            stripe_customer.payment_status = 'active'
            db.commit()
            
            # Send invoice email
            user = db.query(User).filter(User.id == stripe_customer.user_id).first()
            if user:
                await self.email_service.send_invoice(
                    email=user.email,
                    name=user.name,
                    invoice_data={
                        "invoice_number": invoice['number'],
                        "amount": invoice['amount_paid'] / 100,  # Convert from cents
                        "currency": invoice['currency'].upper(),
                        "due_date": datetime.fromtimestamp(invoice['created']).strftime('%Y-%m-%d'),
                        "invoice_url": invoice.get('hosted_invoice_url')
                    }
                )
            
            # Log event
            await self._log_webhook_event(
                db, stripe_customer.user_id, "payment_succeeded", invoice
            )
    
    async def _handle_payment_failed(self, event: Dict[str, Any]):
        """Handle failed payment"""
        invoice = event['data']['object']
        customer_id = invoice['customer']
        
        logger.warning(f"Payment failed for customer {customer_id}, invoice {invoice['id']}")
        
        # Update database
        db = next(get_db())
        stripe_customer = db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == customer_id
        ).first()
        
        if stripe_customer:
            stripe_customer.payment_status = 'failed'
            db.commit()
            
            # Send payment failed email
            user = db.query(User).filter(User.id == stripe_customer.user_id).first()
            if user:
                await self.email_service.send_payment_failed(
                    email=user.email,
                    name=user.name,
                    payment_data={
                        "amount": invoice['amount_due'] / 100,  # Convert from cents
                        "currency": invoice['currency'].upper(),
                        "retry_date": datetime.fromtimestamp(invoice['next_payment_attempt']).strftime('%Y-%m-%d') if invoice.get('next_payment_attempt') else None
                    }
                )
            
            # Log event
            await self._log_webhook_event(
                db, stripe_customer.user_id, "payment_failed", invoice
            )
    
    async def _handle_trial_will_end(self, event: Dict[str, Any]):
        """Handle trial ending soon"""
        subscription = event['data']['object']
        customer_id = subscription['customer']
        
        logger.info(f"Trial ending soon for customer {customer_id}")
        
        # Update database
        db = next(get_db())
        stripe_customer = db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == customer_id
        ).first()
        
        if stripe_customer:
            user = db.query(User).filter(User.id == stripe_customer.user_id).first()
            if user:
                trial_end = datetime.fromtimestamp(subscription['trial_end'])
                days_remaining = (trial_end - datetime.utcnow()).days
                
                await self.email_service.send_trial_ending(
                    email=user.email,
                    name=user.name,
                    trial_data={
                        "trial_end_date": trial_end.strftime('%Y-%m-%d'),
                        "days_remaining": days_remaining
                    }
                )
            
            # Log event
            await self._log_webhook_event(
                db, stripe_customer.user_id, "trial_will_end", subscription
            )
    
    async def _handle_payment_method_attached(self, event: Dict[str, Any]):
        """Handle payment method attachment"""
        payment_method = event['data']['object']
        customer_id = payment_method['customer']
        
        logger.info(f"Payment method attached for customer {customer_id}")
        
        # Update database
        db = next(get_db())
        stripe_customer = db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == customer_id
        ).first()
        
        if stripe_customer:
            # Update payment method type
            if payment_method['type'] == 'card':
                card = payment_method['card']
                if card['brand'] in ['visa', 'mastercard']:
                    stripe_customer.payment_method_type = card['brand']
                elif card['brand'] == 'interac':
                    stripe_customer.payment_method_type = 'interac'
            
            db.commit()
            
            # Log event
            await self._log_webhook_event(
                db, stripe_customer.user_id, "payment_method_attached", payment_method
            )
    
    async def _handle_subscription_activated(self, user_id: str, subscription: Dict[str, Any]):
        """Handle subscription activation"""
        logger.info(f"Subscription activated for user {user_id}")
        
        # Update Pro tenant status if applicable
        db = next(get_db())
        pro_tenant = db.query(ProTenant).filter(ProTenant.user_id == user_id).first()
        if pro_tenant and pro_tenant.status == 'suspended':
            pro_tenant.status = 'active'
            db.commit()
    
    async def _handle_subscription_past_due(self, user_id: str, subscription: Dict[str, Any]):
        """Handle subscription past due"""
        logger.warning(f"Subscription past due for user {user_id}")
        
        # Suspend Pro tenant if applicable
        db = next(get_db())
        pro_tenant = db.query(ProTenant).filter(ProTenant.user_id == user_id).first()
        if pro_tenant and pro_tenant.status == 'active':
            pro_tenant.status = 'suspended'
            db.commit()
    
    async def _handle_subscription_canceled(self, user_id: str, subscription: Dict[str, Any]):
        """Handle subscription cancellation"""
        logger.info(f"Subscription canceled for user {user_id}")
        
        # Suspend Pro tenant if applicable
        db = next(get_db())
        pro_tenant = db.query(ProTenant).filter(ProTenant.user_id == user_id).first()
        if pro_tenant and pro_tenant.status == 'active':
            pro_tenant.status = 'suspended'
            db.commit()
    
    async def _log_webhook_event(self, db: Session, user_id: str, event_type: str, event_data: Dict[str, Any]):
        """Log webhook event to database"""
        try:
            signup_event = SignupEvent(
                id=str(uuid.uuid4()),
                user_id=user_id,
                event_type=f"stripe_{event_type}",
                event_data=event_data
            )
            db.add(signup_event)
            db.commit()
            
            # Also log to telemetry
            await self.telemetry_service.log_stripe_event(
                user_id=user_id,
                event_type=event_type,
                event_data=event_data
            )
            
        except Exception as e:
            logger.error(f"Failed to log webhook event: {e}")
