from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import logging
from typing import Optional
from app.database import get_redis
from app.config import settings

logger = logging.getLogger(__name__)

class TenantMiddleware(BaseHTTPMiddleware):
    """Middleware to handle tenant isolation"""
    
    async def dispatch(self, request: Request, call_next):
        # Extract tenant information from request
        tenant_id = self.extract_tenant_id(request)
        
        if tenant_id:
            # Add tenant context to request state
            request.state.tenant_id = tenant_id
            request.state.tenant_domain = self.extract_tenant_domain(request)
            
            # Validate tenant access
            if not await self.validate_tenant_access(tenant_id, request):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tenant access denied"
                )
        
        response = await call_next(request)
        return response
    
    def extract_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from request"""
        # Try to get tenant ID from subdomain
        host = request.headers.get("host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            if subdomain != "www" and subdomain != "api":
                return subdomain
        
        # Try to get tenant ID from header
        tenant_id = request.headers.get("x-tenant-id")
        if tenant_id:
            return tenant_id
        
        # Try to get tenant ID from query parameter
        tenant_id = request.query_params.get("tenant_id")
        if tenant_id:
            return tenant_id
        
        return None
    
    def extract_tenant_domain(self, request: Request) -> Optional[str]:
        """Extract tenant domain from request"""
        host = request.headers.get("host", "")
        return host
    
    async def validate_tenant_access(self, tenant_id: str, request: Request) -> bool:
        """Validate tenant access"""
        try:
            # Check if tenant exists and is active
            # This would typically query the database
            # For now, we'll do a simple validation
            
            # Check rate limiting
            if not await self.check_rate_limit(tenant_id, request):
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating tenant access: {e}")
            return False
    
    async def check_rate_limit(self, tenant_id: str, request: Request) -> bool:
        """Check rate limiting for tenant"""
        try:
            redis_client = get_redis()
            key = f"rate_limit:{tenant_id}:{int(time.time() // 3600)}"
            
            current_requests = redis_client.get(key)
            if current_requests is None:
                redis_client.setex(key, 3600, 1)
                return True
            
            if int(current_requests) >= settings.RATE_LIMIT_REQUESTS:
                return False
            
            redis_client.incr(key)
            return True
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            return True  # Allow request if rate limiting fails

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/docs", "/redoc"]:
            return await call_next(request)
        
        # Apply rate limiting
        client_ip = request.client.host
        if not await self.check_rate_limit(client_ip, request):
            return Response(
                content="Rate limit exceeded",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        response = await call_next(request)
        return response
    
    async def check_rate_limit(self, client_ip: str, request: Request) -> bool:
        """Check rate limit for client IP"""
        try:
            redis_client = get_redis()
            key = f"rate_limit:ip:{client_ip}:{int(time.time() // 60)}"
            
            current_requests = redis_client.get(key)
            if current_requests is None:
                redis_client.setex(key, 60, 1)
                return True
            
            if int(current_requests) >= 100:  # 100 requests per minute per IP
                return False
            
            redis_client.incr(key)
            return True
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            return True  # Allow request if rate limiting fails
