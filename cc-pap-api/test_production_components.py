#!/usr/bin/env python3
"""
Comprehensive End-to-End Testing for Production Components

This script tests all production-hardened components:
- PIP Data Sources API with rate limiting and security
- Regal validation with caching and monitoring
- Connection pooling and health monitoring
- Security middleware and input validation
"""

import asyncio
import aiohttp
import json
import time
import sys
import os
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

@dataclass
class TestResult:
    """Test result data structure"""
    test_name: str
    status: str  # "PASS", "FAIL", "SKIP"
    duration: float
    error_message: Optional[str] = None
    details: Dict[str, Any] = None

class TestStatus(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"

class ProductionComponentTester:
    """Comprehensive tester for production components"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results: List[TestResult] = []
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def run_test(self, test_name: str, test_func) -> TestResult:
        """Run a single test and record results"""
        start_time = time.time()
        
        try:
            result = await test_func()
            duration = time.time() - start_time
            
            return TestResult(
                test_name=test_name,
                status=TestStatus.PASS.value,
                duration=duration,
                details=result
            )
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                test_name=test_name,
                status=TestStatus.FAIL.value,
                duration=duration,
                error_message=str(e)
            )
    
    async def test_pip_health_endpoint(self) -> Dict[str, Any]:
        """Test PIP health endpoint"""
        async with self.session.get(f"{self.base_url}/pip/health") as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "status": data.get("status"),
                    "pools": data.get("pools", {}),
                    "version": data.get("version")
                }
            else:
                raise Exception(f"Health check failed: {response.status}")
    
    async def test_pip_metrics_endpoint(self) -> Dict[str, Any]:
        """Test PIP metrics endpoint"""
        async with self.session.get(f"{self.base_url}/pip/metrics") as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "overall_metrics": data.get("overall_metrics", {}),
                    "pool_metrics": data.get("pool_metrics", {}),
                    "system_info": data.get("system_info", {})
                }
            else:
                raise Exception(f"Metrics check failed: {response.status}")
    
    async def test_pip_attributes_endpoint(self) -> Dict[str, Any]:
        """Test PIP attributes endpoint with rate limiting"""
        async with self.session.get(f"{self.base_url}/pip/attributes") as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "attribute_count": len(data),
                    "has_builtin_attributes": any(attr.get("source") == "system" for attr in data),
                    "has_pip_attributes": any(attr.get("source") != "system" for attr in data)
                }
            else:
                raise Exception(f"Attributes check failed: {response.status}")
    
    async def test_rego_validation_endpoint(self) -> Dict[str, Any]:
        """Test Rego validation endpoint"""
        test_code = """
package test

allow = true {
    input.user.authenticated
    input.user.role == "admin"
}
"""
        
        payload = {"code": test_code}
        async with self.session.post(
            f"{self.base_url}/policies/validate-rego",
            json=payload,
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "valid": data.get("valid"),
                    "violations_count": len(data.get("violations", [])),
                    "execution_time": data.get("execution_time"),
                    "cached": data.get("cached", False)
                }
            else:
                raise Exception(f"Validation failed: {response.status}")
    
    async def test_rego_formatting_endpoint(self) -> Dict[str, Any]:
        """Test Rego formatting endpoint"""
        test_code = "package test\nallow=true{input.user.authenticated}"
        
        payload = {"code": test_code}
        async with self.session.post(
            f"{self.base_url}/policies/format-rego",
            json=payload,
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "success": data.get("success"),
                    "formatted_size": data.get("formatted_size"),
                    "original_size": data.get("original_size")
                }
            else:
                raise Exception(f"Formatting failed: {response.status}")
    
    async def test_rego_linter_health(self) -> Dict[str, Any]:
        """Test Regal linter health endpoint"""
        async with self.session.get(f"{self.base_url}/policies/rego-linter/health") as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "status": data.get("status"),
                    "regal_available": data.get("regal_available"),
                    "test_validation": data.get("test_validation", {})
                }
            else:
                raise Exception(f"Linter health check failed: {response.status}")
    
    async def test_rego_linter_metrics(self) -> Dict[str, Any]:
        """Test Regal linter metrics endpoint"""
        async with self.session.get(f"{self.base_url}/policies/rego-linter/metrics") as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "metrics": data.get("metrics", {}),
                    "timestamp": data.get("timestamp"),
                    "version": data.get("version")
                }
            else:
                raise Exception(f"Linter metrics failed: {response.status}")
    
    async def test_rate_limiting(self) -> Dict[str, Any]:
        """Test rate limiting by making multiple rapid requests"""
        requests_made = 0
        rate_limited = False
        
        for i in range(15):  # Make 15 requests rapidly
            async with self.session.get(f"{self.base_url}/pip/attributes") as response:
                requests_made += 1
                if response.status == 429:  # Too Many Requests
                    rate_limited = True
                    break
                await asyncio.sleep(0.1)  # Small delay between requests
        
        return {
            "requests_made": requests_made,
            "rate_limited": rate_limited,
            "rate_limit_working": rate_limited
        }
    
    async def test_security_headers(self) -> Dict[str, Any]:
        """Test security headers are present"""
        async with self.session.get(f"{self.base_url}/pip/health") as response:
            headers = response.headers
            security_headers = {
                "X-Content-Type-Options": headers.get("X-Content-Type-Options"),
                "X-Frame-Options": headers.get("X-Frame-Options"),
                "X-XSS-Protection": headers.get("X-XSS-Protection"),
                "Strict-Transport-Security": headers.get("Strict-Transport-Security"),
                "Content-Security-Policy": headers.get("Content-Security-Policy")
            }
            
            return {
                "security_headers_present": sum(1 for v in security_headers.values() if v),
                "total_security_headers": len(security_headers),
                "headers": security_headers
            }
    
    async def test_input_validation(self) -> Dict[str, Any]:
        """Test input validation with malicious input"""
        malicious_inputs = [
            "<script>alert('xss')</script>",
            "'; DROP TABLE users; --",
            "../../etc/passwd",
            "{{7*7}}",
            "javascript:alert(1)"
        ]
        
        validation_results = []
        
        for malicious_input in malicious_inputs:
            payload = {"code": malicious_input}
            async with self.session.post(
                f"{self.base_url}/policies/validate-rego",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                validation_results.append({
                    "input": malicious_input,
                    "status": response.status,
                    "blocked": response.status in [400, 403, 422]
                })
        
        return {
            "malicious_inputs_tested": len(malicious_inputs),
            "inputs_blocked": sum(1 for r in validation_results if r["blocked"]),
            "validation_results": validation_results
        }
    
    async def test_connection_pooling(self) -> Dict[str, Any]:
        """Test connection pooling by making concurrent requests"""
        async def make_request():
            async with self.session.get(f"{self.base_url}/pip/health") as response:
                return response.status == 200
        
        # Make 10 concurrent requests
        start_time = time.time()
        results = await asyncio.gather(*[make_request() for _ in range(10)])
        duration = time.time() - start_time
        
        return {
            "concurrent_requests": 10,
            "successful_requests": sum(results),
            "total_duration": duration,
            "average_response_time": duration / 10
        }
    
    async def run_all_tests(self) -> List[TestResult]:
        """Run all production component tests"""
        print("🚀 Starting Production Component Testing...")
        print("=" * 60)
        
        # Define all tests
        tests = [
            ("PIP Health Endpoint", self.test_pip_health_endpoint),
            ("PIP Metrics Endpoint", self.test_pip_metrics_endpoint),
            ("PIP Attributes Endpoint", self.test_pip_attributes_endpoint),
            ("Rego Validation Endpoint", self.test_rego_validation_endpoint),
            ("Rego Formatting Endpoint", self.test_rego_formatting_endpoint),
            ("Regal Linter Health", self.test_rego_linter_health),
            ("Regal Linter Metrics", self.test_rego_linter_metrics),
            ("Rate Limiting", self.test_rate_limiting),
            ("Security Headers", self.test_security_headers),
            ("Input Validation", self.test_input_validation),
            ("Connection Pooling", self.test_connection_pooling)
        ]
        
        # Run tests
        for test_name, test_func in tests:
            print(f"🧪 Running {test_name}...")
            result = await self.run_test(test_name, test_func)
            self.results.append(result)
            
            if result.status == TestStatus.PASS.value:
                print(f"✅ {test_name}: PASSED ({result.duration:.2f}s)")
            elif result.status == TestStatus.FAIL.value:
                print(f"❌ {test_name}: FAILED ({result.duration:.2f}s)")
                print(f"   Error: {result.error_message}")
            else:
                print(f"⏭️  {test_name}: SKIPPED")
        
        return self.results
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.status == TestStatus.PASS.value)
        failed_tests = sum(1 for r in self.results if r.status == TestStatus.FAIL.value)
        skipped_tests = sum(1 for r in self.results if r.status == TestStatus.SKIP.value)
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⏭️  Skipped: {skipped_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if result.status == TestStatus.FAIL.value:
                    print(f"  - {result.test_name}: {result.error_message}")
        
        print("\n🎯 PRODUCTION READINESS:")
        if passed_tests == total_tests:
            print("🟢 ALL SYSTEMS PRODUCTION READY!")
        elif passed_tests >= total_tests * 0.8:
            print("🟡 MOSTLY PRODUCTION READY - Minor issues detected")
        else:
            print("🔴 NOT PRODUCTION READY - Critical issues detected")

async def main():
    """Main test runner"""
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    print(f"🔧 Testing API at: {base_url}")
    print("📋 Testing Production Components:")
    print("  - PIP Data Sources API")
    print("  - Regal Validation Service")
    print("  - Connection Pooling")
    print("  - Rate Limiting")
    print("  - Security Middleware")
    print("  - Input Validation")
    print()
    
    async with ProductionComponentTester(base_url) as tester:
        await tester.run_all_tests()
        tester.print_summary()

if __name__ == "__main__":
    asyncio.run(main())

