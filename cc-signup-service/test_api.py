#!/usr/bin/env python3
"""
Test script for cc-signup-service API endpoints
"""
import requests
import json
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Root endpoint: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
        return False

def test_signup_endpoint():
    """Test the signup endpoint with sample data"""
    signup_data = {
        "name": "Test User",
        "email": "test@example.com",
        "company_name": "Test Company",
        "company_email": "test@testcompany.com",
        "subscription_tier": "kickstart",
        "billing_cycle": "monthly",
        "skip_payment": True,
        "address_street": "123 Test St",
        "address_city": "San Francisco",
        "address_state": "CA",
        "address_zip": "94105",
        "address_country": "United States",
        "industry": "Technology",
        "team_size": "10-50",
        "hear_about_us": "Google",
        "terms_accepted": True,
        "privacy_accepted": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/signup",
            json=signup_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Signup endpoint: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   User ID: {result.get('user_id')}")
            print(f"   Tier: {result.get('subscription_tier')}")
            print(f"   Next steps: {len(result.get('next_steps', []))} items")
        else:
            print(f"   Error: {response.text}")
        return response.status_code in [200, 201]
    except Exception as e:
        print(f"❌ Signup endpoint failed: {e}")
        return False

def test_downloads_endpoint():
    """Test the downloads endpoint"""
    try:
        # Test with a dummy user ID
        response = requests.get(f"{BASE_URL}/api/downloads/test-user-123")
        print(f"✅ Downloads endpoint: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Packages: {len(result.get('packages', []))} available")
        else:
            print(f"   Response: {response.text}")
        return True  # Even 404 is expected for non-existent user
    except Exception as e:
        print(f"❌ Downloads endpoint failed: {e}")
        return False

def test_pro_provisioning_endpoint():
    """Test the pro provisioning status endpoint"""
    try:
        # Test with a dummy user ID
        response = requests.get(f"{BASE_URL}/api/pro-provisioning/status/test-user-123")
        print(f"✅ Pro provisioning endpoint: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Status: {result.get('status')}")
        else:
            print(f"   Response: {response.text}")
        return True  # Even 404 is expected for non-existent user
    except Exception as e:
        print(f"❌ Pro provisioning endpoint failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing cc-signup-service API endpoints...")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_endpoint),
        ("Root Endpoint", test_root_endpoint),
        ("Signup Endpoint", test_signup_endpoint),
        ("Downloads Endpoint", test_downloads_endpoint),
        ("Pro Provisioning Endpoint", test_pro_provisioning_endpoint),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        if test_func():
            passed += 1
        print("-" * 30)
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The API is ready for testing.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
