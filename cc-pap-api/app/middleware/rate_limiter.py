"""
Production Rate Limiting Middleware for Control Core PAP API
Implements Redis-based rate limiting with sliding window algorithm
"""

import time
import json
import hashlib
from typing import Dict, Optional, Tuple
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import redis
import asyncio
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """Production-grade rate limiter with Redis backend"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.default_limits = {
            "pip_connections": {"requests": 100, "window": 3600},  # 100 requests per hour
            "pip_sync": {"requests": 10, "window": 3600},  # 10 syncs per hour
            "pip_fetch": {"requests": 1000, "window": 3600},  # 1000 fetches per hour
            "pip_health_check": {"requests": 50, "window": 3600},  # 50 health checks per hour
            "pip_oauth": {"requests": 20, "window": 3600},  # 20 OAuth flows per hour
            "pip_cache": {"requests": 500, "window": 3600},  # 500 cache operations per hour
        }
    
    def _get_client_key(self, request: Request, user_id: Optional[str] = None) -> str:
        """Generate unique key for rate limiting"""
        # Use user ID if available, otherwise use IP
        if user_id:
            return f"rate_limit:user:{user_id}"
        else:
            client_ip = request.client.host
            return f"rate_limit:ip:{client_ip}"
    
    def _get_endpoint_key(self, endpoint: str) -> str:
        """Generate endpoint-specific key"""
        return f"rate_limit:endpoint:{endpoint}"
    
    async def check_rate_limit(
        self, 
        request: Request, 
        endpoint: str, 
        user_id: Optional[str] = None,
        custom_limits: Optional[Dict[str, int]] = None
    ) -> Tuple[bool, Dict[str, int]]:
        """
        Check if request is within rate limits
        Returns (is_allowed, remaining_limits)
        """
        try:
            # Get rate limits for endpoint
            limits = custom_limits or self.default_limits.get(endpoint, {"requests": 100, "window": 3600})
            max_requests = limits["requests"]
            window_seconds = limits["window"]
            
            # Generate keys
            client_key = self._get_client_key(request, user_id)
            endpoint_key = self._get_endpoint_key(endpoint)
            
            current_time = int(time.time())
            window_start = current_time - window_seconds
            
            # Use sliding window algorithm
            pipe = self.redis.pipeline()
            
            # Remove expired entries
            pipe.zremrangebyscore(client_key, 0, window_start)
            pipe.zremrangebyscore(endpoint_key, 0, window_start)
            
            # Count current requests
            pipe.zcard(client_key)
            pipe.zcard(endpoint_key)
            
            # Add current request
            pipe.zadd(client_key, {str(current_time): current_time})
            pipe.zadd(endpoint_key, {str(current_time): current_time})
            
            # Set expiration
            pipe.expire(client_key, window_seconds)
            pipe.expire(endpoint_key, window_seconds)
            
            results = await asyncio.get_event_loop().run_in_executor(
                None, pipe.execute
            )
            
            client_count = results[2]
            endpoint_count = results[3]
            
            # Check limits
            client_allowed = client_count <= max_requests
            endpoint_allowed = endpoint_count <= max_requests * 10  # Global endpoint limit
            
            is_allowed = client_allowed and endpoint_allowed
            
            remaining = {
                "client_remaining": max(0, max_requests - client_count),
                "endpoint_remaining": max(0, (max_requests * 10) - endpoint_count),
                "window_seconds": window_seconds,
                "reset_time": current_time + window_seconds
            }
            
            return is_allowed, remaining
            
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Fail open - allow request if rate limiter fails
            return True, {"error": "Rate limiter unavailable"}
    
    async def get_rate_limit_status(
        self, 
        request: Request, 
        endpoint: str, 
        user_id: Optional[str] = None
    ) -> Dict[str, any]:
        """Get current rate limit status without consuming a request"""
        try:
            limits = self.default_limits.get(endpoint, {"requests": 100, "window": 3600})
            max_requests = limits["requests"]
            window_seconds = limits["window"]
            
            client_key = self._get_client_key(request, user_id)
            endpoint_key = self._get_endpoint_key(endpoint)
            
            current_time = int(time.time())
            window_start = current_time - window_seconds
            
            # Get current counts
            pipe = self.redis.pipeline()
            pipe.zremrangebyscore(client_key, 0, window_start)
            pipe.zremrangebyscore(endpoint_key, 0, window_start)
            pipe.zcard(client_key)
            pipe.zcard(endpoint_key)
            
            results = await asyncio.get_event_loop().run_in_executor(
                None, pipe.execute
            )
            
            client_count = results[2]
            endpoint_count = results[3]
            
            return {
                "client_requests": client_count,
                "client_limit": max_requests,
                "client_remaining": max(0, max_requests - client_count),
                "endpoint_requests": endpoint_count,
                "endpoint_limit": max_requests * 10,
                "endpoint_remaining": max(0, (max_requests * 10) - endpoint_count),
                "window_seconds": window_seconds,
                "reset_time": current_time + window_seconds
            }
            
        except Exception as e:
            logger.error(f"Rate limit status error: {e}")
            return {"error": "Rate limiter unavailable"}

# Global rate limiter instance
rate_limiter: Optional[RateLimiter] = None

def get_rate_limiter() -> RateLimiter:
    """Get or create rate limiter instance"""
    global rate_limiter
    if rate_limiter is None:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=int(os.getenv("REDIS_DB", 0)),
            decode_responses=True
        )
        rate_limiter = RateLimiter(redis_client)
    return rate_limiter

def rate_limit(endpoint: str, custom_limits: Optional[Dict[str, int]] = None):
    """Decorator for rate limiting endpoints"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # If no request found, skip rate limiting
                return await func(*args, **kwargs)
            
            # Get user ID if available
            user_id = getattr(request.state, 'user_id', None)
            
            # Check rate limit
            limiter = get_rate_limiter()
            is_allowed, remaining = await limiter.check_rate_limit(
                request, endpoint, user_id, custom_limits
            )
            
            if not is_allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "endpoint": endpoint,
                        "remaining": remaining,
                        "retry_after": remaining.get("reset_time", 3600)
                    }
                )
            
            # Add rate limit headers
            response = await func(*args, **kwargs)
            if hasattr(response, 'headers'):
                response.headers["X-RateLimit-Limit"] = str(remaining.get("client_limit", 100))
                response.headers["X-RateLimit-Remaining"] = str(remaining.get("client_remaining", 0))
                response.headers["X-RateLimit-Reset"] = str(remaining.get("reset_time", 3600))
            
            return response
        
        return wrapper
    return decorator

async def rate_limit_middleware(request: Request, call_next):
    """FastAPI middleware for rate limiting"""
    try:
        # Extract endpoint from path
        endpoint = request.url.path.split('/')[-1] or 'default'
        
        # Get user ID if available
        user_id = getattr(request.state, 'user_id', None)
        
        # Check rate limit
        limiter = get_rate_limiter()
        is_allowed, remaining = await limiter.check_rate_limit(
            request, endpoint, user_id
        )
        
        if not is_allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "endpoint": endpoint,
                    "remaining": remaining,
                    "retry_after": remaining.get("reset_time", 3600)
                },
                headers={
                    "X-RateLimit-Limit": str(remaining.get("client_limit", 100)),
                    "X-RateLimit-Remaining": str(remaining.get("client_remaining", 0)),
                    "X-RateLimit-Reset": str(remaining.get("reset_time", 3600))
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(remaining.get("client_limit", 100))
        response.headers["X-RateLimit-Remaining"] = str(remaining.get("client_remaining", 0))
        response.headers["X-RateLimit-Reset"] = str(remaining.get("reset_time", 3600))
        
        return response
        
    except Exception as e:
        logger.error(f"Rate limiting middleware error: {e}")
        # Fail open - allow request if middleware fails
        return await call_next(request)

