"""
Telemetry Service for Control Core Signup
Handles all telemetry logging to cc-business-admin
"""

import os
import logging
import aiohttp
from typing import Dict, Any
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class TelemetryService:
    def __init__(self):
        self.bac_api_url = os.getenv("BAC_API_URL", "http://localhost:8001")
        self.bac_api_key = os.getenv("BAC_API_KEY")
        self.timeout = aiohttp.ClientTimeout(total=30)
    
    async def log_signup_event(self, user_id: str, tier: str, billing_cycle: str, company_name: str):
        """Log signup event to business admin console"""
        try:
            payload = {
                "event_type": "customer_signup",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "tier": tier,
                "billing_cycle": billing_cycle,
                "company_name": company_name,
                "source": "signup_service"
            }
            
            await self._send_to_bac("/api/events/customer-signup", payload)
            logger.info(f"Logged signup event for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to log signup event: {e}")
    
    async def log_deployment_event(self, user_id: str, tier: str, deployment_type: str, 
                                 package_type: str = None, success: bool = True):
        """Log deployment event to business admin console"""
        try:
            payload = {
                "event_type": "deployment_event",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "tier": tier,
                "deployment_type": deployment_type,
                "package_type": package_type,
                "success": success,
                "source": "signup_service"
            }
            
            await self._send_to_bac("/api/events/deployment-event", payload)
            logger.info(f"Logged deployment event for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to log deployment event: {e}")
    
    async def log_provisioning_event(self, user_id: str, tenant_id: str, status: str, 
                                   error_message: str = None):
        """Log Pro tenant provisioning event"""
        try:
            payload = {
                "event_type": "provisioning_event",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "tenant_id": tenant_id,
                "status": status,
                "error_message": error_message,
                "source": "signup_service"
            }
            
            await self._send_to_bac("/api/events/provisioning-event", payload)
            logger.info(f"Logged provisioning event for tenant {tenant_id}")
            
        except Exception as e:
            logger.error(f"Failed to log provisioning event: {e}")
    
    async def log_download_event(self, user_id: str, package_type: str, package_format: str, 
                               file_size: int, tier: str):
        """Log package download event"""
        try:
            payload = {
                "event_type": "package_download",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "package_type": package_type,
                "package_format": package_format,
                "file_size": file_size,
                "tier": tier,
                "source": "signup_service"
            }
            
            await self._send_to_bac("/api/events/package-download", payload)
            logger.info(f"Logged download event for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to log download event: {e}")
    
    async def log_stripe_event(self, user_id: str, event_type: str, event_data: Dict[str, Any]):
        """Log Stripe webhook event"""
        try:
            payload = {
                "event_type": f"stripe_{event_type}",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "stripe_event_data": event_data,
                "source": "signup_service"
            }
            
            await self._send_to_bac("/api/events/stripe-event", payload)
            logger.info(f"Logged Stripe event {event_type} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to log Stripe event: {e}")
    
    async def log_user_activity(self, user_id: str, activity_type: str, activity_data: Dict[str, Any]):
        """Log general user activity"""
        try:
            payload = {
                "event_type": "user_activity",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "activity_type": activity_type,
                "activity_data": activity_data,
                "source": "signup_service"
            }
            
            await self._send_to_bac("/api/events/user-activity", payload)
            logger.info(f"Logged user activity {activity_type} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to log user activity: {e}")
    
    async def get_user_metrics(self, user_id: str) -> Dict[str, Any]:
        """Get user metrics from business admin console"""
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                headers = {"Authorization": f"Bearer {self.bac_api_key}"} if self.bac_api_key else {}
                
                async with session.get(
                    f"{self.bac_api_url}/api/users/{user_id}/metrics",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.warning(f"Failed to get user metrics: {response.status}")
                        return {}
                        
        except Exception as e:
            logger.error(f"Failed to get user metrics: {e}")
            return {}
    
    async def get_signup_analytics(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get signup analytics from business admin console"""
        try:
            params = {
                "start_date": start_date,
                "end_date": end_date
            }
            
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                headers = {"Authorization": f"Bearer {self.bac_api_key}"} if self.bac_api_key else {}
                
                async with session.get(
                    f"{self.bac_api_url}/api/analytics/signups",
                    headers=headers,
                    params=params
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.warning(f"Failed to get signup analytics: {response.status}")
                        return {}
                        
        except Exception as e:
            logger.error(f"Failed to get signup analytics: {e}")
            return {}
    
    async def _send_to_bac(self, endpoint: str, payload: Dict[str, Any]):
        """Send payload to business admin console"""
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                headers = {
                    "Content-Type": "application/json"
                }
                
                if self.bac_api_key:
                    headers["Authorization"] = f"Bearer {self.bac_api_key}"
                
                async with session.post(
                    f"{self.bac_api_url}{endpoint}",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status not in [200, 201]:
                        error_text = await response.text()
                        logger.warning(f"BAC API error: {response.status} - {error_text}")
                    else:
                        logger.debug(f"Successfully sent to BAC: {endpoint}")
                        
        except Exception as e:
            logger.error(f"Failed to send to BAC {endpoint}: {e}")
            # Don't raise exception to avoid breaking main flow
