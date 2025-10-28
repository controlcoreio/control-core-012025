from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.services.tenant_isolation_service import TenantIsolationService
from app.database import get_db
from typing import Optional
import logging
import time
import json

logger = logging.getLogger(__name__)

class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """Middleware for enforcing tenant isolation"""
    
    def __init__(self, app):
        super().__init__(app)
        self.tenant_isolation_service = None
    
    async def dispatch(self, request: Request, call_next):
        # Initialize tenant isolation service
        if not self.tenant_isolation_service:
            db = next(get_db())
            self.tenant_isolation_service = TenantIsolationService(db)
        
        # Extract tenant information
        tenant_id = self._extract_tenant_id(request)
        
        if tenant_id:
            # Validate tenant access
            if not await self._validate_tenant_access(tenant_id, request):
                return Response(
                    content=json.dumps({"error": "Tenant access denied"}),
                    status_code=status.HTTP_403_FORBIDDEN,
                    media_type="application/json"
                )
            
            # Set tenant context
            request.state.tenant_id = tenant_id
            request.state.tenant_isolation = await self._get_tenant_isolation_config(tenant_id)
            
            # Check tenant limits
            if not await self._check_tenant_limits(tenant_id, request):
                return Response(
                    content=json.dumps({"error": "Tenant limits exceeded"}),
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    media_type="application/json"
                )
        
        # Add tenant isolation headers
        response = await call_next(request)
        response.headers["X-Tenant-ID"] = tenant_id or "none"
        response.headers["X-Isolation-Level"] = "schema"
        
        return response
    
    def _extract_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from request"""
        # Try to get tenant ID from subdomain
        host = request.headers.get("host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            if subdomain not in ["www", "api", "app"]:
                return subdomain
        
        # Try to get tenant ID from header
        tenant_id = request.headers.get("x-tenant-id")
        if tenant_id:
            return tenant_id
        
        # Try to get tenant ID from query parameter
        tenant_id = request.query_params.get("tenant_id")
        if tenant_id:
            return tenant_id
        
        # Try to get tenant ID from JWT token
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            tenant_id = self._extract_tenant_from_token(token)
            if tenant_id:
                return tenant_id
        
        return None
    
    def _extract_tenant_from_token(self, token: str) -> Optional[str]:
        """Extract tenant ID from JWT token"""
        try:
            import jwt
            from app.config import settings
            
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            return payload.get("tenant_id")
            
        except Exception as e:
            logger.warning(f"Error extracting tenant from token: {e}")
            return None
    
    async def _validate_tenant_access(self, tenant_id: str, request: Request) -> bool:
        """Validate tenant access"""
        try:
            # Get user ID from request
            user_id = self._extract_user_id(request)
            if not user_id:
                return False
            
            # Validate tenant access
            return self.tenant_isolation_service.validate_tenant_access(tenant_id, user_id)
            
        except Exception as e:
            logger.error(f"Error validating tenant access: {e}")
            return False
    
    def _extract_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from request"""
        # Try to get user ID from JWT token
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                import jwt
                from app.config import settings
                
                payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
                return payload.get("user_id")
                
            except Exception as e:
                logger.warning(f"Error extracting user ID from token: {e}")
                return None
        
        # Try to get user ID from header
        user_id = request.headers.get("x-user-id")
        if user_id:
            return user_id
        
        return None
    
    async def _get_tenant_isolation_config(self, tenant_id: str) -> dict:
        """Get tenant isolation configuration"""
        try:
            # This would typically be cached
            # For now, return basic config
            return {
                "tenant_id": tenant_id,
                "isolation_level": "schema",
                "database_schema": f"tenant_{tenant_id.replace('-', '_')}",
                "redis_namespace": f"tenant:{tenant_id}",
                "s3_prefix": f"tenants/{tenant_id}/"
            }
            
        except Exception as e:
            logger.error(f"Error getting tenant isolation config: {e}")
            return {}
    
    async def _check_tenant_limits(self, tenant_id: str, request: Request) -> bool:
        """Check tenant limits"""
        try:
            # Determine resource type from request path
            resource_type = self._get_resource_type_from_path(request.url.path)
            if not resource_type:
                return True
            
            # Check tenant limits
            return self.tenant_isolation_service.check_tenant_limits(tenant_id, resource_type)
            
        except Exception as e:
            logger.error(f"Error checking tenant limits: {e}")
            return True
    
    def _get_resource_type_from_path(self, path: str) -> Optional[str]:
        """Get resource type from request path"""
        if "/policies" in path:
            return "policies"
        elif "/resources" in path:
            return "resources"
        elif "/bouncers" in path:
            return "bouncers"
        elif "/users" in path:
            return "users"
        return None

class TenantRateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for tenant-specific rate limiting"""
    
    def __init__(self, app):
        super().__init__(app)
        self.rate_limits = {}
    
    async def dispatch(self, request: Request, call_next):
        tenant_id = getattr(request.state, 'tenant_id', None)
        if not tenant_id:
            return await call_next(request)
        
        # Check rate limit for tenant
        if not await self._check_rate_limit(tenant_id, request):
            return Response(
                content=json.dumps({"error": "Rate limit exceeded"}),
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json"
            )
        
        response = await call_next(request)
        return response
    
    async def _check_rate_limit(self, tenant_id: str, request: Request) -> bool:
        """Check rate limit for tenant"""
        try:
            # Get tenant rate limit configuration
            rate_limit = self._get_tenant_rate_limit(tenant_id)
            
            # Check current usage
            current_usage = self._get_current_usage(tenant_id)
            
            # Check if within limits
            if current_usage >= rate_limit["requests_per_minute"]:
                return False
            
            # Increment usage
            self._increment_usage(tenant_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            return True
    
    def _get_tenant_rate_limit(self, tenant_id: str) -> dict:
        """Get rate limit configuration for tenant"""
        # Default rate limits
        default_limits = {
            "requests_per_minute": 1000,
            "burst_limit": 2000,
            "window_size": 60
        }
        
        # In a real implementation, this would be fetched from database
        return default_limits
    
    def _get_current_usage(self, tenant_id: str) -> int:
        """Get current usage for tenant"""
        # In a real implementation, this would use Redis
        return self.rate_limits.get(tenant_id, {}).get("current_usage", 0)
    
    def _increment_usage(self, tenant_id: str):
        """Increment usage for tenant"""
        if tenant_id not in self.rate_limits:
            self.rate_limits[tenant_id] = {
                "current_usage": 0,
                "window_start": time.time()
            }
        
        self.rate_limits[tenant_id]["current_usage"] += 1

class TenantSecurityMiddleware(BaseHTTPMiddleware):
    """Middleware for tenant-specific security"""
    
    async def dispatch(self, request: Request, call_next):
        tenant_id = getattr(request.state, 'tenant_id', None)
        if not tenant_id:
            return await call_next(request)
        
        # Apply tenant-specific security headers
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Add tenant-specific headers
        response.headers["X-Tenant-ID"] = tenant_id
        response.headers["X-Isolation-Level"] = "schema"
        
        return response
