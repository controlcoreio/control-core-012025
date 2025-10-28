#!/usr/bin/env python3
"""
Integration Test for Production-Ready PIP Management System
Tests all components working together
"""

import asyncio
import json
import time
from typing import Dict, Any
import aiohttp
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PIPIntegrationTester:
    """Integration tester for PIP management system"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_connection_creation(self, connection_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test creating a PIP connection"""
        logger.info(f"Testing connection creation for {connection_data['name']}")
        
        try:
            async with self.session.post(
                f"{self.base_url}/pip/connections",
                json=connection_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ Connection created successfully: {result['id']}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Connection creation failed: {error_text}")
                    return {"error": error_text}
        except Exception as e:
            logger.error(f"❌ Connection creation exception: {e}")
            return {"error": str(e)}
    
    async def test_connection_testing(self, connection_id: int) -> Dict[str, Any]:
        """Test connection testing functionality"""
        logger.info(f"Testing connection {connection_id}")
        
        try:
            async with self.session.post(
                f"{self.base_url}/pip/connections/test",
                json={"connection_id": connection_id}
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ Connection test successful: {result['status']}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Connection test failed: {error_text}")
                    return {"error": error_text}
        except Exception as e:
            logger.error(f"❌ Connection test exception: {e}")
            return {"error": str(e)}
    
    async def test_opal_publishing(self, connection_id: int) -> Dict[str, Any]:
        """Test OPAL publishing functionality"""
        logger.info(f"Testing OPAL publishing for connection {connection_id}")
        
        try:
            async with self.session.post(
                f"{self.base_url}/pip/connections/{connection_id}/publish-to-opal"
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ OPAL publishing successful: {result['message']}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"❌ OPAL publishing failed: {error_text}")
                    return {"error": error_text}
        except Exception as e:
            logger.error(f"❌ OPAL publishing exception: {e}")
            return {"error": str(e)}
    
    async def test_sync_scheduling(self, connection_id: int) -> Dict[str, Any]:
        """Test sync scheduling functionality"""
        logger.info(f"Testing sync scheduling for connection {connection_id}")
        
        try:
            async with self.session.post(
                f"{self.base_url}/pip/connections/{connection_id}/schedule-sync"
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ Sync scheduling successful: {result['message']}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Sync scheduling failed: {error_text}")
                    return {"error": error_text}
        except Exception as e:
            logger.error(f"❌ Sync scheduling exception: {e}")
            return {"error": str(e)}
    
    async def test_oauth_flow(self, provider: str) -> Dict[str, Any]:
        """Test OAuth flow initiation"""
        logger.info(f"Testing OAuth flow for {provider}")
        
        try:
            async with self.session.get(
                f"{self.base_url}/pip/oauth/authorize/{provider}"
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ OAuth flow initiated successfully: {result['authorization_url']}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"❌ OAuth flow failed: {error_text}")
                    return {"error": error_text}
        except Exception as e:
            logger.error(f"❌ OAuth flow exception: {e}")
            return {"error": str(e)}
    
    async def test_opal_config_generation(self) -> Dict[str, Any]:
        """Test OPAL configuration generation"""
        logger.info("Testing OPAL configuration generation")
        
        try:
            async with self.session.get(
                f"{self.base_url}/pip/opal/config"
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ OPAL config generated successfully: {len(result['opal_client']['data_sources'])} data sources")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"❌ OPAL config generation failed: {error_text}")
                    return {"error": error_text}
        except Exception as e:
            logger.error(f"❌ OPAL config generation exception: {e}")
            return {"error": str(e)}
    
    async def test_scheduler_stats(self) -> Dict[str, Any]:
        """Test scheduler statistics"""
        logger.info("Testing scheduler statistics")
        
        try:
            async with self.session.get(
                f"{self.base_url}/pip/sync/scheduler-stats"
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ Scheduler stats retrieved: {result['total_jobs']} jobs")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Scheduler stats failed: {error_text}")
                    return {"error": error_text}
        except Exception as e:
            logger.error(f"❌ Scheduler stats exception: {e}")
            return {"error": str(e)}
    
    async def run_comprehensive_test(self):
        """Run comprehensive integration test"""
        logger.info("🚀 Starting comprehensive PIP integration test")
        
        test_results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_details": []
        }
        
        # Test 1: Create a sample connection
        logger.info("\n📋 Test 1: Connection Creation")
        test_results["total_tests"] += 1
        
        sample_connection = {
            "name": "Test Okta Connection",
            "description": "Integration test connection",
            "connection_type": "identity",
            "provider": "okta",
            "configuration": {
                "domain": "test.okta.com",
                "auth_url": "https://test.okta.com/oauth2/default/v1/authorize",
                "token_url": "https://test.okta.com/oauth2/default/v1/token",
                "client_id": "test_client_id",
                "client_secret": "test_client_secret",
                "scopes": "openid profile email groups"
            },
            "credentials": {
                "client_id": "test_client_id",
                "client_secret": "test_client_secret"
            },
            "sync_enabled": True,
            "sync_frequency": "hourly"
        }
        
        connection_result = await self.test_connection_creation(sample_connection)
        if "error" not in connection_result:
            test_results["passed_tests"] += 1
            test_results["test_details"].append({"test": "Connection Creation", "status": "PASS", "details": connection_result})
            connection_id = connection_result["id"]
        else:
            test_results["failed_tests"] += 1
            test_results["test_details"].append({"test": "Connection Creation", "status": "FAIL", "details": connection_result})
            connection_id = None
        
        # Test 2: OAuth Flow (if connection created successfully)
        if connection_id:
            logger.info("\n🔐 Test 2: OAuth Flow")
            test_results["total_tests"] += 1
            
            oauth_result = await self.test_oauth_flow("okta")
            if "error" not in oauth_result:
                test_results["passed_tests"] += 1
                test_results["test_details"].append({"test": "OAuth Flow", "status": "PASS", "details": oauth_result})
            else:
                test_results["failed_tests"] += 1
                test_results["test_details"].append({"test": "OAuth Flow", "status": "FAIL", "details": oauth_result})
        
        # Test 3: Connection Testing
        logger.info("\n🧪 Test 3: Connection Testing")
        test_results["total_tests"] += 1
        
        test_connection_data = {
            "connection_type": "identity",
            "provider": "okta",
            "configuration": sample_connection["configuration"],
            "credentials": sample_connection["credentials"]
        }
        
        # Test connection without creating it first
        try:
            async with self.session.post(
                f"{self.base_url}/pip/connections/test",
                json=test_connection_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ Connection test successful: {result['status']}")
                    test_results["passed_tests"] += 1
                    test_results["test_details"].append({"test": "Connection Testing", "status": "PASS", "details": result})
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Connection test failed: {error_text}")
                    test_results["failed_tests"] += 1
                    test_results["test_details"].append({"test": "Connection Testing", "status": "FAIL", "details": {"error": error_text}})
        except Exception as e:
            logger.error(f"❌ Connection test exception: {e}")
            test_results["failed_tests"] += 1
            test_results["test_details"].append({"test": "Connection Testing", "status": "FAIL", "details": {"error": str(e)}})
        
        # Test 4: OPAL Configuration Generation
        logger.info("\n⚙️ Test 4: OPAL Configuration Generation")
        test_results["total_tests"] += 1
        
        opal_config_result = await self.test_opal_config_generation()
        if "error" not in opal_config_result:
            test_results["passed_tests"] += 1
            test_results["test_details"].append({"test": "OPAL Config Generation", "status": "PASS", "details": opal_config_result})
        else:
            test_results["failed_tests"] += 1
            test_results["test_details"].append({"test": "OPAL Config Generation", "status": "FAIL", "details": opal_config_result})
        
        # Test 5: Scheduler Statistics
        logger.info("\n📊 Test 5: Scheduler Statistics")
        test_results["total_tests"] += 1
        
        scheduler_result = await self.test_scheduler_stats()
        if "error" not in scheduler_result:
            test_results["passed_tests"] += 1
            test_results["test_details"].append({"test": "Scheduler Statistics", "status": "PASS", "details": scheduler_result})
        else:
            test_results["failed_tests"] += 1
            test_results["test_details"].append({"test": "Scheduler Statistics", "status": "FAIL", "details": scheduler_result})
        
        # Test 6: OPAL Publishing (if connection exists)
        if connection_id:
            logger.info("\n📤 Test 6: OPAL Publishing")
            test_results["total_tests"] += 1
            
            opal_result = await self.test_opal_publishing(connection_id)
            if "error" not in opal_result:
                test_results["passed_tests"] += 1
                test_results["test_details"].append({"test": "OPAL Publishing", "status": "PASS", "details": opal_result})
            else:
                test_results["failed_tests"] += 1
                test_results["test_details"].append({"test": "OPAL Publishing", "status": "FAIL", "details": opal_result})
        
        # Test 7: Sync Scheduling (if connection exists)
        if connection_id:
            logger.info("\n⏰ Test 7: Sync Scheduling")
            test_results["total_tests"] += 1
            
            sync_result = await self.test_sync_scheduling(connection_id)
            if "error" not in sync_result:
                test_results["passed_tests"] += 1
                test_results["test_details"].append({"test": "Sync Scheduling", "status": "PASS", "details": sync_result})
            else:
                test_results["failed_tests"] += 1
                test_results["test_details"].append({"test": "Sync Scheduling", "status": "FAIL", "details": sync_result})
        
        # Print summary
        logger.info("\n" + "="*60)
        logger.info("📋 INTEGRATION TEST SUMMARY")
        logger.info("="*60)
        logger.info(f"Total Tests: {test_results['total_tests']}")
        logger.info(f"Passed: {test_results['passed_tests']} ✅")
        logger.info(f"Failed: {test_results['failed_tests']} ❌")
        logger.info(f"Success Rate: {(test_results['passed_tests']/test_results['total_tests']*100):.1f}%")
        
        if test_results['failed_tests'] > 0:
            logger.info("\n❌ Failed Tests:")
            for test in test_results['test_details']:
                if test['status'] == 'FAIL':
                    logger.info(f"  - {test['test']}: {test['details'].get('error', 'Unknown error')}")
        
        logger.info("\n✅ Passed Tests:")
        for test in test_results['test_details']:
            if test['status'] == 'PASS':
                logger.info(f"  - {test['test']}")
        
        return test_results

async def main():
    """Main test function"""
    logger.info("🧪 Starting PIP Integration Test Suite")
    
    async with PIPIntegrationTester() as tester:
        results = await tester.run_comprehensive_test()
        
        # Save results to file
        with open("pip_integration_test_results.json", "w") as f:
            json.dump(results, f, indent=2, default=str)
        
        logger.info(f"\n📄 Test results saved to: pip_integration_test_results.json")
        
        # Exit with appropriate code
        if results['failed_tests'] > 0:
            logger.error("❌ Integration tests failed!")
            exit(1)
        else:
            logger.info("🎉 All integration tests passed!")
            exit(0)

if __name__ == "__main__":
    asyncio.run(main())
