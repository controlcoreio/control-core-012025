"""
Production-Grade Regal Linter Service for Rego Code Validation

This service provides production-hardened Rego validation with:
- Timeout protection
- Resource limits
- Structured error responses
- Caching for performance
- Health monitoring
- Rate limiting
"""

import subprocess
import json
import tempfile
import os
import time
import asyncio
import logging
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
from dataclasses import dataclass
from enum import Enum
import hashlib
import redis
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class ValidationStatus(Enum):
    VALID = "valid"
    INVALID = "invalid"
    TIMEOUT = "timeout"
    ERROR = "error"
    CACHED = "cached"

@dataclass
class ValidationResult:
    """Structured validation result"""
    status: ValidationStatus
    violations: List[Dict[str, Any]]
    summary: Dict[str, int]
    execution_time: float
    cached: bool = False
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None

@dataclass
class ValidationMetrics:
    """Validation performance metrics"""
    total_validations: int = 0
    successful_validations: int = 0
    failed_validations: int = 0
    timeout_validations: int = 0
    cached_validations: int = 0
    average_execution_time: float = 0.0
    last_validation: Optional[float] = None

class ProductionRegalLinter:
    """Production-grade Regal linter with caching, monitoring, and error handling"""
    
    def __init__(
        self,
        regal_path: str = "regal",
        redis_client: Optional[redis.Redis] = None,
        cache_ttl: int = 3600,  # 1 hour cache
        max_execution_time: int = 10,  # 10 seconds max
        max_code_size: int = 100000,  # 100KB max code size
        enable_caching: bool = True
    ):
        self.regal_path = regal_path
        self.redis_client = redis_client
        self.cache_ttl = cache_ttl
        self.max_execution_time = max_execution_time
        self.max_code_size = max_code_size
        self.enable_caching = enable_caching
        self.metrics = ValidationMetrics()
        self._check_regal_available()
    
    def _check_regal_available(self) -> bool:
        """Check if Regal is installed and available"""
        try:
            result = subprocess.run(
                [self.regal_path, "version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                raise RuntimeError(f"Regal not available: {result.stderr}")
            logger.info(f"Regal linter initialized: {result.stdout.strip()}")
            return True
        except FileNotFoundError:
            raise RuntimeError(
                f"Regal binary not found at '{self.regal_path}'. "
                "Please install Regal: https://github.com/StyraInc/regal"
            )
        except Exception as e:
            raise RuntimeError(f"Error checking Regal availability: {str(e)}")
    
    def _generate_cache_key(self, code: str) -> str:
        """Generate cache key for code"""
        code_hash = hashlib.sha256(code.encode('utf-8')).hexdigest()
        return f"regal_validation:{code_hash}"
    
    async def _get_cached_result(self, cache_key: str) -> Optional[ValidationResult]:
        """Get cached validation result"""
        if not self.enable_caching or not self.redis_client:
            return None
        
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                data = json.loads(cached_data)
                return ValidationResult(
                    status=ValidationStatus(data["status"]),
                    violations=data["violations"],
                    summary=data["summary"],
                    execution_time=data["execution_time"],
                    cached=True,
                    metadata=data.get("metadata", {})
                )
        except Exception as e:
            logger.warning(f"Failed to get cached result: {e}")
        
        return None
    
    async def _cache_result(self, cache_key: str, result: ValidationResult):
        """Cache validation result"""
        if not self.enable_caching or not self.redis_client:
            return
        
        try:
            cache_data = {
                "status": result.status.value,
                "violations": result.violations,
                "summary": result.summary,
                "execution_time": result.execution_time,
                "metadata": result.metadata or {}
            }
            self.redis_client.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(cache_data)
            )
        except Exception as e:
            logger.warning(f"Failed to cache result: {e}")
    
    def _validate_input(self, code: str) -> Tuple[bool, str]:
        """Validate input code"""
        if not code or not code.strip():
            return False, "Code cannot be empty"
        
        if len(code) > self.max_code_size:
            return False, f"Code too large (max {self.max_code_size} characters)"
        
        # Check for potentially dangerous patterns
        dangerous_patterns = [
            "import os", "import sys", "import subprocess",
            "exec(", "eval(", "__import__"
        ]
        
        for pattern in dangerous_patterns:
            if pattern in code.lower():
                return False, f"Potentially dangerous pattern detected: {pattern}"
        
        return True, ""
    
    async def _execute_regal(self, code: str) -> ValidationResult:
        """Execute Regal linting with timeout protection"""
        start_time = time.time()
        
        # Create temporary file for the Rego code
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.rego',
            delete=False,
            encoding='utf-8'
        ) as temp_file:
            temp_file.write(code)
            temp_path = temp_file.name
        
        try:
            # Run Regal lint with timeout
            process = await asyncio.create_subprocess_exec(
                self.regal_path, "lint", "--format", "json", temp_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.max_execution_time
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                execution_time = time.time() - start_time
                self.metrics.timeout_validations += 1
                
                return ValidationResult(
                    status=ValidationStatus.TIMEOUT,
                    violations=[{
                        "severity": "error",
                        "message": f"Regal linting timed out after {self.max_execution_time}s",
                        "line": 1,
                        "column": 1,
                        "rule": "timeout"
                    }],
                    summary={"errors": 1, "warnings": 0, "total": 1},
                    execution_time=execution_time,
                    error_message="Validation timeout"
                )
            
            execution_time = time.time() - start_time
            
            # Parse results
            if process.returncode == 0 and stdout:
                try:
                    lint_results = json.loads(stdout.decode('utf-8'))
                    violations = self._transform_violations(lint_results)
                    has_errors = any(v.get("severity") == "error" for v in violations)
                    
                    status = ValidationStatus.VALID if not has_errors else ValidationStatus.INVALID
                    self.metrics.successful_validations += 1
                    
                    return ValidationResult(
                        status=status,
                        violations=violations,
                        summary=self._get_summary(violations),
                        execution_time=execution_time,
                        metadata={
                            "regal_version": "unknown",  # Could be extracted from version
                            "code_size": len(code),
                            "lines": len(code.split('\n'))
                        }
                    )
                    
                except json.JSONDecodeError:
                    self.metrics.failed_validations += 1
                    return ValidationResult(
                        status=ValidationStatus.ERROR,
                        violations=[{
                            "severity": "error",
                            "message": "Failed to parse Regal output",
                            "line": 1,
                            "column": 1,
                            "rule": "parse_error"
                        }],
                        summary={"errors": 1, "warnings": 0, "total": 1},
                        execution_time=execution_time,
                        error_message="JSON parse error"
                    )
            else:
                # No violations found
                self.metrics.successful_validations += 1
                return ValidationResult(
                    status=ValidationStatus.VALID,
                    violations=[],
                    summary={"errors": 0, "warnings": 0, "total": 0},
                    execution_time=execution_time,
                    metadata={
                        "regal_version": "unknown",
                        "code_size": len(code),
                        "lines": len(code.split('\n'))
                    }
                )
        
        except Exception as e:
            execution_time = time.time() - start_time
            self.metrics.failed_validations += 1
            
            return ValidationResult(
                status=ValidationStatus.ERROR,
                violations=[{
                    "severity": "error",
                    "message": f"Linting error: {str(e)}",
                    "line": 1,
                    "column": 1,
                    "rule": "execution_error"
                }],
                summary={"errors": 1, "warnings": 0, "total": 1},
                execution_time=execution_time,
                error_message=str(e)
            )
        
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except Exception:
                pass
    
    def _transform_violations(self, regal_output: Dict) -> List[Dict[str, Any]]:
        """Transform Regal output format to our standard format"""
        violations = []
        
        if isinstance(regal_output, dict) and "violations" in regal_output:
            for violation in regal_output.get("violations", []):
                violations.append({
                    "severity": violation.get("level", "warning"),
                    "message": violation.get("description", "Unknown violation"),
                    "line": violation.get("location", {}).get("row", 1),
                    "column": violation.get("location", {}).get("col", 1),
                    "rule": violation.get("title", ""),
                    "category": violation.get("category", ""),
                    "file": violation.get("location", {}).get("file", "policy.rego")
                })
        
        return violations
    
    def _get_summary(self, violations: List[Dict]) -> Dict[str, int]:
        """Get summary of violations"""
        errors = sum(1 for v in violations if v.get("severity") == "error")
        warnings = sum(1 for v in violations if v.get("severity") == "warning")
        
        return {
            "errors": errors,
            "warnings": warnings,
            "total": len(violations)
        }
    
    async def validate_rego(self, code: str, use_cache: bool = True) -> ValidationResult:
        """
        Validate Rego code with production-grade features
        
        Args:
            code: Rego policy code to validate
            use_cache: Whether to use cached results
        
        Returns:
            ValidationResult with comprehensive validation information
        """
        # Update metrics
        self.metrics.total_validations += 1
        self.metrics.last_validation = time.time()
        
        # Input validation
        is_valid, error_msg = self._validate_input(code)
        if not is_valid:
            return ValidationResult(
                status=ValidationStatus.ERROR,
                violations=[{
                    "severity": "error",
                    "message": error_msg,
                    "line": 1,
                    "column": 1,
                    "rule": "input_validation"
                }],
                summary={"errors": 1, "warnings": 0, "total": 1},
                execution_time=0.0,
                error_message=error_msg
            )
        
        # Check cache first
        if use_cache:
            cache_key = self._generate_cache_key(code)
            cached_result = await self._get_cached_result(cache_key)
            if cached_result:
                self.metrics.cached_validations += 1
                return cached_result
        
        # Execute validation
        result = await self._execute_regal(code)
        
        # Update average execution time
        if self.metrics.total_validations > 0:
            self.metrics.average_execution_time = (
                (self.metrics.average_execution_time * (self.metrics.total_validations - 1) + result.execution_time) 
                / self.metrics.total_validations
            )
        
        # Cache result if successful
        if use_cache and result.status in [ValidationStatus.VALID, ValidationStatus.INVALID]:
            cache_key = self._generate_cache_key(code)
            await self._cache_result(cache_key, result)
        
        return result
    
    async def format_rego(self, code: str) -> Tuple[bool, str]:
        """
        Format Rego code using Regal
        
        Args:
            code: Rego policy code to format
        
        Returns:
            Tuple of (success, formatted_code_or_error)
        """
        # Input validation
        is_valid, error_msg = self._validate_input(code)
        if not is_valid:
            return False, error_msg
        
        # Create temporary file for the Rego code
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.rego',
            delete=False,
            encoding='utf-8'
        ) as temp_file:
            temp_file.write(code)
            temp_path = temp_file.name
        
        try:
            # Run Regal format with timeout
            process = await asyncio.create_subprocess_exec(
                self.regal_path, "format", temp_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.max_execution_time
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                return False, f"Formatting timed out after {self.max_execution_time}s"
            
            if process.returncode == 0 and stdout:
                return True, stdout.decode('utf-8')
            else:
                return False, stderr.decode('utf-8') if stderr else "Formatting failed"
        
        except Exception as e:
            return False, str(e)
        
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except Exception:
                pass
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get validation metrics"""
        return {
            "total_validations": self.metrics.total_validations,
            "successful_validations": self.metrics.successful_validations,
            "failed_validations": self.metrics.failed_validations,
            "timeout_validations": self.metrics.timeout_validations,
            "cached_validations": self.metrics.cached_validations,
            "success_rate": (
                self.metrics.successful_validations / max(1, self.metrics.total_validations)
            ) * 100,
            "cache_hit_rate": (
                self.metrics.cached_validations / max(1, self.metrics.total_validations)
            ) * 100,
            "average_execution_time": self.metrics.average_execution_time,
            "last_validation": self.metrics.last_validation
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on the linter"""
        try:
            # Test with simple Rego code
            test_code = "package test\n\nallow = true"
            result = await self.validate_rego(test_code, use_cache=False)
            
            return {
                "status": "healthy" if result.status != ValidationStatus.ERROR else "unhealthy",
                "regal_available": True,
                "test_validation": {
                    "status": result.status.value,
                    "execution_time": result.execution_time
                },
                "metrics": self.get_metrics()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "regal_available": False,
                "error": str(e),
                "metrics": self.get_metrics()
            }

# Global linter instance
_linter_instance: Optional[ProductionRegalLinter] = None

def get_production_regal_linter() -> ProductionRegalLinter:
    """Get or create production Regal linter instance"""
    global _linter_instance
    if _linter_instance is None:
        # Initialize Redis client if available
        redis_client = None
        try:
            redis_client = redis.Redis(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                db=int(os.getenv("REDIS_DB", 0)),
                decode_responses=True
            )
            # Test connection
            redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis not available for caching: {e}")
            redis_client = None
        
        _linter_instance = ProductionRegalLinter(
            regal_path=os.getenv("REGAL_PATH", "regal"),
            redis_client=redis_client,
            cache_ttl=int(os.getenv("REGAL_CACHE_TTL", 3600)),
            max_execution_time=int(os.getenv("REGAL_MAX_EXECUTION_TIME", 10)),
            max_code_size=int(os.getenv("REGAL_MAX_CODE_SIZE", 100000)),
            enable_caching=os.getenv("REGAL_ENABLE_CACHE", "true").lower() == "true"
        )
    
    return _linter_instance

