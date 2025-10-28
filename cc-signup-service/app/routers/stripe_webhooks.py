"""
Stripe Webhooks Router for Control Core Signup
Handles all Stripe webhook events
"""

from fastapi import APIRouter, Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
import logging
import stripe
from app.services.stripe_webhook_handler import StripeWebhookHandler

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["stripe-webhooks"])

# Initialize webhook handler
webhook_handler = StripeWebhookHandler()

@router.post("/webhooks/stripe")
async def handle_stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        # Get the raw body and signature
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        if not sig_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature header"
            )
        
        # Handle the webhook
        result = await webhook_handler.handle_webhook(payload, sig_header)
        
        return JSONResponse(
            content=result,
            status_code=200
        )
        
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Stripe signature verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature"
        )
    except Exception as e:
        logger.error(f"Webhook handling error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )

@router.get("/webhooks/stripe/test")
async def test_webhook_endpoint():
    """Test endpoint to verify webhook URL is accessible"""
    return {
        "status": "ok",
        "message": "Stripe webhook endpoint is accessible",
        "timestamp": "2024-01-01T00:00:00Z"
    }
