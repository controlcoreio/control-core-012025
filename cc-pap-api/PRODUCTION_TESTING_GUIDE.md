# Production Testing Guide

## Overview

This guide provides comprehensive testing procedures for the production-hardened Control Core PAP API components.

## Production Components Tested

### 1. PIP Data Sources API
- **Rate Limiting**: Redis-based sliding window rate limiting
- **Security**: Input validation, XSS protection, SQL injection prevention
- **Connection Pooling**: Database, Redis, and HTTP connection pools
- **Encryption**: Production-grade credential encryption
- **Audit Logging**: Comprehensive security event logging

### 2. Regal Validation Service
- **Timeout Protection**: Configurable execution timeouts
- **Caching**: Redis-based result caching for performance
- **Resource Limits**: Code size and execution limits
- **Health Monitoring**: Continuous health checks and metrics
- **Error Handling**: Structured error responses

### 3. Security Middleware
- **Input Validation**: Malicious input detection and sanitization
- **Security Headers**: Comprehensive security headers
- **Rate Limiting**: Per-endpoint and global rate limiting
- **Audit Trail**: Security event logging and monitoring

## Running Tests

### Prerequisites

1. **Backend Server Running**:
   ```bash
   cd cc-pap-api
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Redis Server Running** (for caching and rate limiting):
   ```bash
   redis-server
   ```

3. **Regal Installed** (for Rego validation):
   ```bash
   # Install Regal linter
   go install github.com/StyraInc/regal/cmd/regal@latest
   ```

### Test Execution

1. **Run Comprehensive Tests**:
   ```bash
   cd cc-pap-api
   python test_production_components.py
   ```

2. **Run with Custom API URL**:
   ```bash
   API_BASE_URL=http://localhost:8000 python test_production_components.py
   ```

## Test Categories

### 1. Health and Monitoring Tests

#### PIP Health Endpoint
- **Endpoint**: `GET /pip/health`
- **Tests**: System health status, connection pool status
- **Expected**: All pools healthy, proper status reporting

#### PIP Metrics Endpoint
- **Endpoint**: `GET /pip/metrics`
- **Tests**: Performance metrics, success rates, response times
- **Expected**: Detailed metrics with pool statistics

#### Regal Linter Health
- **Endpoint**: `GET /policies/rego-linter/health`
- **Tests**: Regal availability, test validation, performance
- **Expected**: Regal available, test validation successful

### 2. API Functionality Tests

#### PIP Attributes Endpoint
- **Endpoint**: `GET /pip/attributes`
- **Tests**: Attribute retrieval, built-in attributes, PIP attributes
- **Expected**: Mix of system and PIP attributes returned

#### Rego Validation
- **Endpoint**: `POST /policies/validate-rego`
- **Tests**: Code validation, violation detection, caching
- **Expected**: Proper validation with detailed violations

#### Rego Formatting
- **Endpoint**: `POST /policies/format-rego`
- **Tests**: Code formatting, size comparison
- **Expected**: Properly formatted Rego code

### 3. Security Tests

#### Rate Limiting
- **Test**: Multiple rapid requests to rate-limited endpoints
- **Expected**: Requests blocked after rate limit exceeded
- **Endpoints**: `/pip/attributes`, `/policies/validate-rego`

#### Security Headers
- **Test**: Check for security headers in responses
- **Expected**: All security headers present
- **Headers**: X-Content-Type-Options, X-Frame-Options, CSP, etc.

#### Input Validation
- **Test**: Malicious input detection
- **Inputs**: XSS, SQL injection, path traversal, template injection
- **Expected**: Malicious inputs blocked or sanitized

### 4. Performance Tests

#### Connection Pooling
- **Test**: Concurrent requests to test connection pooling
- **Expected**: Efficient handling of concurrent requests
- **Metrics**: Response times, success rates

#### Caching
- **Test**: Repeated requests to test caching
- **Expected**: Cached responses for repeated requests
- **Endpoints**: Rego validation with caching

## Test Results Interpretation

### Success Criteria

1. **All Health Checks Pass**: System components are healthy
2. **Rate Limiting Works**: Malicious traffic is rate limited
3. **Security Headers Present**: All security headers are set
4. **Input Validation Works**: Malicious inputs are blocked
5. **Performance Acceptable**: Response times within limits
6. **Caching Functional**: Repeated requests use cache

### Failure Scenarios

1. **Health Check Failures**: Components not responding
2. **Rate Limiting Bypassed**: Security vulnerability
3. **Missing Security Headers**: Security vulnerability
4. **Input Validation Bypassed**: Security vulnerability
5. **Performance Issues**: System not production ready
6. **Caching Not Working**: Performance degradation

## Production Readiness Checklist

### ✅ Security
- [ ] Rate limiting implemented and working
- [ ] Security headers present
- [ ] Input validation working
- [ ] Audit logging functional
- [ ] Credential encryption working

### ✅ Performance
- [ ] Connection pooling working
- [ ] Caching functional
- [ ] Response times acceptable
- [ ] Concurrent request handling
- [ ] Resource limits enforced

### ✅ Monitoring
- [ ] Health endpoints working
- [ ] Metrics collection functional
- [ ] Error handling robust
- [ ] Logging comprehensive
- [ ] Alerting configured

### ✅ Reliability
- [ ] Timeout protection working
- [ ] Error recovery functional
- [ ] Graceful degradation
- [ ] Resource cleanup
- [ ] Memory management

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**:
   - Ensure Redis server is running
   - Check Redis connection settings
   - Verify Redis authentication

2. **Regal Not Found**:
   - Install Regal linter
   - Check PATH environment variable
   - Verify Regal binary permissions

3. **Rate Limiting Not Working**:
   - Check Redis connection
   - Verify rate limit configuration
   - Check middleware order

4. **Security Headers Missing**:
   - Check security middleware
   - Verify middleware order
   - Check CORS configuration

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
python test_production_components.py
```

## Continuous Testing

### Automated Testing
- Run tests in CI/CD pipeline
- Monitor test results over time
- Alert on test failures
- Track performance metrics

### Production Monitoring
- Monitor health endpoints
- Track rate limiting metrics
- Monitor security events
- Alert on anomalies

## Performance Benchmarks

### Expected Performance
- **Health Check**: < 100ms
- **Validation**: < 1s (with caching < 100ms)
- **Rate Limiting**: < 10ms overhead
- **Security Headers**: < 5ms overhead
- **Connection Pool**: < 50ms per request

### Load Testing
- **Concurrent Users**: 100+
- **Requests per Second**: 1000+
- **Memory Usage**: < 1GB
- **CPU Usage**: < 80%
- **Response Time**: < 2s (95th percentile)

## Security Considerations

### Production Deployment
- Use HTTPS in production
- Configure proper CORS origins
- Set up Redis authentication
- Enable audit logging
- Monitor security events

### Environment Variables
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Regal Configuration
REGAL_PATH=regal
REGAL_CACHE_TTL=3600
REGAL_MAX_EXECUTION_TIME=10
REGAL_MAX_CODE_SIZE=100000

# Security Configuration
ENCRYPTION_KEY=your-encryption-key
RATE_LIMIT_ENABLED=true
SECURITY_HEADERS_ENABLED=true
```

## Conclusion

This testing framework ensures that all production components are thoroughly tested and ready for deployment. Regular testing helps maintain system reliability and security in production environments.

