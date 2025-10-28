# cc-signup-service Testing Guide

## 🧪 Testing Overview

This guide provides comprehensive testing instructions for the Control Core signup service, including both backend API testing and frontend UI testing.

## 🚀 Quick Start Testing

### 1. Backend API Testing

#### Start the Development Server
```bash
cd cc-signup-service
python run_dev.py
```

The server will start at `http://localhost:8000` with:
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`
- Root Endpoint: `http://localhost:8000/`

#### Run API Tests
```bash
# Run the automated test suite
python test_api.py
```

#### Manual API Testing with curl

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Signup Endpoint (Kickstart Plan):**
```bash
curl -X POST http://localhost:8000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "company_name": "Test Company",
    "company_email": "test@testcompany.com",
    "subscription_tier": "kickstart",
    "billing_cycle": "monthly",
    "skip_payment": true,
    "address_street": "123 Test St",
    "address_city": "San Francisco",
    "address_state": "CA",
    "address_zip": "94105",
    "address_country": "United States",
    "industry": "Technology",
    "team_size": "10-50",
    "hear_about_us": "Google",
    "terms_accepted": true,
    "privacy_accepted": true
  }'
```

**Signup Endpoint (Pro Plan with Payment):**
```bash
curl -X POST http://localhost:8000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro User",
    "email": "pro@example.com",
    "company_name": "Pro Company",
    "company_email": "pro@procompany.com",
    "subscription_tier": "pro",
    "billing_cycle": "annual",
    "skip_payment": false,
    "payment_method_type": "card",
    "stripe_payment_method_id": "pm_test_1234567890",
    "address_street": "456 Pro Ave",
    "address_city": "New York",
    "address_state": "NY",
    "address_zip": "10001",
    "address_country": "United States",
    "industry": "Finance",
    "team_size": "100+",
    "hear_about_us": "Referral",
    "terms_accepted": true,
    "privacy_accepted": true
  }'
```

**Downloads Endpoint:**
```bash
curl http://localhost:8000/api/downloads/test-user-123
```

**Pro Provisioning Status:**
```bash
curl http://localhost:8000/api/pro-provisioning/status/test-user-123
```

### 2. Frontend UI Testing

#### Start the cc-pap Frontend
```bash
cd cc-pap
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

#### Test UI Components

**1. Enhanced Signup Form**
- Navigate to `http://localhost:3000/signup`
- Test form validation:
  - Try personal email domains (gmail.com, yahoo.com) - should be blocked
  - Test required field validation
  - Test address format validation
- Test plan selection:
  - Kickstart (skip payment)
  - Pro (requires payment)
  - Custom (optional payment)

**2. Download Packages Page**
- Navigate to `http://localhost:3000/download-packages`
- Should show download options for:
  - Helm Charts
  - Docker Compose
  - Binary Downloads
- Test download functionality

**3. Pro Provisioning Page**
- Navigate to `http://localhost:3000/pro-provisioning`
- Should show provisioning status and progress
- Test real-time updates

**4. Getting Started Wizard**
- Navigate to `http://localhost:3000/` (after login)
- Launch the Getting Started Wizard
- Verify the new "Verify Control Plane Deployment" step appears for self-hosted users

## 🔧 Environment Setup for Testing

### Required Environment Variables

Create a `.env` file in the `cc-signup-service` directory:

```bash
# Database
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=dev-secret-key-change-in-production

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Service (Optional for testing)
SENDGRID_API_KEY=your_sendgrid_key_here
EMAIL_FROM_ADDRESS=noreply@controlcore.io

# Business Admin (Optional for testing)
BAC_API_URL=http://localhost:8001
BAC_API_KEY=your_bac_api_key_here

# File Storage (Optional for testing)
S3_BUCKET_NAME=controlcore-packages-test
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
```

### Database Setup

The service uses SQLite for development testing. The database will be created automatically when you start the server.

## 🧪 Test Scenarios

### 1. Kickstart Plan Flow
1. User fills out signup form
2. Selects "Kickstart" plan
3. Skips payment
4. Account is created
5. User is redirected to download packages page
6. User downloads Control Plane packages
7. User deploys self-hosted Control Plane
8. User accesses Getting Started Wizard

### 2. Pro Plan Flow
1. User fills out signup form
2. Selects "Pro" plan
3. Provides payment method
4. Payment is processed
5. Pro tenant provisioning begins
6. User is redirected to provisioning status page
7. Tenant is provisioned with subdomain
8. User receives access credentials

### 3. Custom Plan Flow
1. User fills out signup form
2. Selects "Custom" plan
3. Optionally provides payment method
4. Account is created
5. User is redirected to download packages page
6. User downloads custom packages
7. User deploys self-hosted Control Plane

## 🔍 Validation Tests

### Email Validation
- ✅ Personal email domains are blocked (gmail.com, yahoo.com, etc.)
- ✅ Company email domains are accepted
- ✅ Invalid email formats are rejected

### Address Validation
- ✅ US ZIP codes (5 digits or 5+4 format)
- ✅ Canadian postal codes (A1A 1A1 format)
- ✅ International postal codes (3-20 characters)

### Payment Validation
- ✅ Pro plan requires payment method
- ✅ Kickstart plan allows payment skip
- ✅ Custom plan allows optional payment

### API Response Validation
- ✅ All endpoints return proper HTTP status codes
- ✅ Error responses include descriptive messages
- ✅ Success responses include required data fields

## 🐛 Troubleshooting

### Common Issues

**1. Import Errors**
```bash
# Make sure you're in the correct directory
cd cc-signup-service
# Install dependencies
pip install -r requirements.txt
```

**2. Database Connection Issues**
```bash
# Check if the database file exists
ls -la test.db
# If not, the server will create it automatically
```

**3. CORS Issues**
```bash
# Make sure CORS_ORIGINS includes your frontend URL
export CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
```

**4. Stripe Integration Issues**
```bash
# Use test keys for development
export STRIPE_SECRET_KEY="sk_test_..."
export STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Debug Mode

Enable debug logging by setting:
```bash
export LOG_LEVEL=DEBUG
```

## 📊 Performance Testing

### Load Testing with Apache Bench
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:8000/health

# Test signup endpoint
ab -n 100 -c 5 -p signup_data.json -T application/json http://localhost:8000/api/signup
```

### Memory Usage Monitoring
```bash
# Monitor memory usage
ps aux | grep python
```

## 🔒 Security Testing

### Input Validation
- Test SQL injection attempts
- Test XSS payloads
- Test file upload vulnerabilities

### Authentication Testing
- Test unauthorized access to protected endpoints
- Test session management
- Test CSRF protection

## 📝 Test Results

After running all tests, you should see:

```
🧪 Testing cc-signup-service API endpoints...
==================================================

🔍 Testing Health Check...
✅ Health check: 200 - {'status': 'healthy', 'service': 'cc-signup-service', 'version': '1.0.0'}
------------------------------

🔍 Testing Root Endpoint...
✅ Root endpoint: 200 - {'message': 'Control Core Signup Service'}
------------------------------

🔍 Testing Signup Endpoint...
✅ Signup endpoint: 200
   User ID: user_1234567890
   Tier: kickstart
   Next steps: 3 items
------------------------------

🔍 Testing Downloads Endpoint...
✅ Downloads endpoint: 200
   Packages: 3 available
------------------------------

🔍 Testing Pro Provisioning Endpoint...
✅ Pro provisioning endpoint: 200
   Status: provisioning
------------------------------

📊 Test Results: 5/5 tests passed
🎉 All tests passed! The API is ready for testing.
```

## 🎯 Next Steps

1. **Integration Testing**: Test the complete flow from signup to deployment
2. **End-to-End Testing**: Test with real Stripe test cards
3. **Performance Testing**: Load test with multiple concurrent users
4. **Security Testing**: Penetration testing and vulnerability assessment
5. **User Acceptance Testing**: Test with real users and gather feedback

## 📞 Support

If you encounter issues during testing:
1. Check the logs in the terminal where the server is running
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check the API documentation at `http://localhost:8000/docs`
