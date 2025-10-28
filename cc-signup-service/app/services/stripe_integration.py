"""
Stripe Integration Service for Control Core Signup
Handles complete customer lifecycle from signup to deployment

This file now imports the shared Stripe service from cc-pap-core
All Stripe integration logic is centralized in cc-pap-core/stripe_service.py
"""

import sys
import os

# Add cc-pap-core to path for shared services
sys.path.append(os.path.join(os.path.dirname(__file__), "../../../cc-pap-core"))
from stripe_service import StripeIntegrationService

# For backward compatibility, we can re-export the service
__all__ = ["StripeIntegrationService"]
