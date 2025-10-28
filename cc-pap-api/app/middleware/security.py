"""
Production Security Middleware for Control Core PAP API
Implements comprehensive security measures for production deployment
"""

import time
import hashlib
import hmac
import secrets
import json
from typing import Dict, Optional, List, Tuple
from fastapi import Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import redis
import asyncio
import logging
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

logger = logging.getLogger(__name__)

class SecurityMiddleware:
    """Production-grade security middleware"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.encryption_key = self._get_or_create_encryption_key()
        self.fernet = Fernet(self.encryption_key)
        self.blocked_ips = set()
        self.suspicious_ips = {}
        
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for sensitive data"""
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            # Generate new key (in production, store securely)
            key = Fernet.generate_key()
            logger.warning("Generated new encryption key - store securely in production!")
        else:
            key = key.encode() if isinstance(key, str) else key
        return key
    
    def _generate_csrf_token(self, session_id: str) -> str:
        """Generate CSRF token for session"""
        timestamp = str(int(time.time()))
        data = f"{session_id}:{timestamp}"
        token = hmac.new(
            self.encryption_key,
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"{token}:{timestamp}"
    
    def _verify_csrf_token(self, token: str, session_id: str) -> bool:
        """Verify CSRF token"""
        try:
            token_part, timestamp = token.split(":", 1)
            timestamp = int(timestamp)
            
            # Check if token is not too old (1 hour)
            if time.time() - timestamp > 3600:
                return False
            
            # Verify token
            expected_data = f"{session_id}:{timestamp}"
            expected_token = hmac.new(
                self.encryption_key,
                expected_data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(token_part, expected_token)
            
        except (ValueError, TypeError):
            return False
    
    def _detect_suspicious_activity(self, request: Request) -> Tuple[bool, str]:
        """Detect suspicious activity patterns"""
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        # Check for suspicious patterns
        suspicious_patterns = [
            "sqlmap", "nmap", "nikto", "burp", "w3af", "zap",
            "scanner", "exploit", "injection", "xss", "csrf"
        ]
        
        # Check user agent
        if any(pattern in user_agent.lower() for pattern in suspicious_patterns):
            return True, "Suspicious user agent"
        
        # Check for SQL injection patterns in query params
        query_params = str(request.query_params).lower()
        sql_patterns = [
            "union select", "drop table", "delete from", "insert into",
            "update set", "or 1=1", "and 1=1", "' or '1'='1"
        ]
        
        if any(pattern in query_params for pattern in sql_patterns):
            return True, "SQL injection attempt detected"
        
        # Check for XSS patterns
        xss_patterns = [
            "<script>", "javascript:", "onload=", "onerror=",
            "onclick=", "onmouseover=", "alert(", "document.cookie"
        ]
        
        if any(pattern in query_params for pattern in xss_patterns):
            return True, "XSS attempt detected"
        
        return False, ""
    
    def _rate_limit_suspicious_ip(self, client_ip: str) -> bool:
        """Rate limit suspicious IPs more aggressively"""
        if client_ip in self.blocked_ips:
            return False
        
        # Track suspicious activity
        if client_ip not in self.suspicious_ips:
            self.suspicious_ips[client_ip] = {"count": 0, "first_seen": time.time()}
        
        self.suspicious_ips[client_ip]["count"] += 1
        
        # Block if too many suspicious activities
        if self.suspicious_ips[client_ip]["count"] > 10:
            self.blocked_ips.add(client_ip)
            logger.warning(f"Blocked suspicious IP: {client_ip}")
            return False
        
        return True
    
    def _validate_request_size(self, request: Request) -> bool:
        """Validate request size limits"""
        content_length = request.headers.get("content-length")
        if content_length:
            size = int(content_length)
            # Limit request size to 10MB
            if size > 10 * 1024 * 1024:
                return False
        return True
    
    def _add_security_headers(self, response: JSONResponse) -> JSONResponse:
        """Add comprehensive security headers"""
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https:; "
                "font-src 'self' data:; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            ),
            "Permissions-Policy": (
                "geolocation=(), microphone=(), camera=(), "
                "payment=(), usb=(), magnetometer=(), "
                "gyroscope=(), speaker=()"
            )
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value
        
        return response
    
    async def process_request(self, request: Request) -> Optional[JSONResponse]:
        """Process request through security checks"""
        client_ip = request.client.host
        
        # Check if IP is blocked
        if client_ip in self.blocked_ips:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Access denied"}
            )
        
        # Validate request size
        if not self._validate_request_size(request):
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"error": "Request too large"}
            )
        
        # Detect suspicious activity
        is_suspicious, reason = self._detect_suspicious_activity(request)
        if is_suspicious:
            logger.warning(f"Suspicious activity from {client_ip}: {reason}")
            
            # Rate limit suspicious IPs
            if not self._rate_limit_suspicious_ip(client_ip):
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"error": "Access denied"}
                )
        
        return None
    
    async def process_response(self, response: JSONResponse) -> JSONResponse:
        """Process response through security enhancements"""
        return self._add_security_headers(response)

# Global security middleware instance
security_middleware: Optional[SecurityMiddleware] = None

def get_security_middleware() -> SecurityMiddleware:
    """Get or create security middleware instance"""
    global security_middleware
    if security_middleware is None:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=int(os.getenv("REDIS_DB", 0)),
            decode_responses=True
        )
        security_middleware = SecurityMiddleware(redis_client)
    return security_middleware

async def security_middleware_handler(request: Request, call_next):
    """FastAPI security middleware handler"""
    try:
        middleware = get_security_middleware()
        
        # Process request
        security_response = await middleware.process_request(request)
        if security_response:
            return security_response
        
        # Process request normally
        response = await call_next(request)
        
        # Process response
        if isinstance(response, JSONResponse):
            response = await middleware.process_response(response)
        
        return response
        
    except Exception as e:
        logger.error(f"Security middleware error: {e}")
        # Fail closed - deny request if security middleware fails
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Security check failed"}
        )

class InputValidator:
    """Production-grade input validation"""
    
    @staticmethod
    def validate_connection_config(config: Dict[str, any]) -> Tuple[bool, str]:
        """Validate PIP connection configuration"""
        required_fields = ["endpoint", "auth_type"]
        
        for field in required_fields:
            if field not in config:
                return False, f"Missing required field: {field}"
        
        # Validate endpoint URL
        endpoint = config.get("endpoint", "")
        if not endpoint.startswith(("http://", "https://")):
            return False, "Invalid endpoint URL"
        
        # Validate auth type
        valid_auth_types = ["none", "basic", "bearer", "oauth", "api_key"]
        if config.get("auth_type") not in valid_auth_types:
            return False, f"Invalid auth type: {config.get('auth_type')}"
        
        return True, ""
    
    @staticmethod
    def validate_credentials(credentials: Dict[str, any], auth_type: str) -> Tuple[bool, str]:
        """Validate credentials based on auth type"""
        if auth_type == "none":
            return True, ""
        
        if auth_type == "basic":
            if "username" not in credentials or "password" not in credentials:
                return False, "Basic auth requires username and password"
        
        elif auth_type == "bearer":
            if "token" not in credentials:
                return False, "Bearer auth requires token"
        
        elif auth_type == "oauth":
            required_oauth_fields = ["client_id", "client_secret", "redirect_uri"]
            for field in required_oauth_fields:
                if field not in credentials:
                    return False, f"OAuth requires {field}"
        
        elif auth_type == "api_key":
            if "api_key" not in credentials:
                return False, "API key auth requires api_key"
        
        return True, ""
    
    @staticmethod
    def sanitize_input(data: str) -> str:
        """Sanitize user input to prevent injection attacks"""
        # Remove potentially dangerous characters
        dangerous_chars = ["<", ">", "\"", "'", "&", ";", "(", ")", "|", "`"]
        for char in dangerous_chars:
            data = data.replace(char, "")
        
        # Limit length
        if len(data) > 1000:
            data = data[:1000]
        
        return data.strip()

class AuditLogger:
    """Production audit logging for security events"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def log_security_event(
        self,
        event_type: str,
        user_id: Optional[str],
        client_ip: str,
        details: Dict[str, any],
        severity: str = "info"
    ):
        """Log security event to audit trail"""
        try:
            event = {
                "timestamp": datetime.now().isoformat(),
                "event_type": event_type,
                "user_id": user_id,
                "client_ip": client_ip,
                "details": details,
                "severity": severity
            }
            
            # Store in Redis with TTL
            key = f"audit:security:{int(time.time())}:{secrets.token_hex(8)}"
            await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: self.redis.setex(key, 86400 * 30, json.dumps(event))  # 30 days TTL
            )
            
            # Also log to application logger
            logger.info(f"Security event: {event_type} from {client_ip}")
            
        except Exception as e:
            logger.error(f"Failed to log security event: {e}")

# Global audit logger
audit_logger: Optional[AuditLogger] = None

def get_audit_logger() -> AuditLogger:
    """Get or create audit logger instance"""
    global audit_logger
    if audit_logger is None:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=int(os.getenv("REDIS_DB", 0)),
            decode_responses=True
        )
        audit_logger = AuditLogger(redis_client)
    return audit_logger

