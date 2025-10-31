# Legacy PDP (Policy Decision Point)

**⚠️ DEPRECATED: This is a legacy component. Use cc-bouncer for new implementations.**

A legacy simplified Policy Decision Point service that makes authorization decisions using OPA (Open Policy Agent). This component has been superseded by the modern cc-bouncer service which provides integrated PEP and PDP functionality.

## Overview

This legacy PDP is maintained for backward compatibility only. For new implementations, use the modern cc-bouncer service which provides:

- Integrated Policy Enforcement Point (PEP) and Policy Decision Point (PDP)
- Real-time policy evaluation with caching
- Content injection for AI agents
- Advanced context-aware policy evaluation
- Comprehensive monitoring and audit logging

## Migration

For new implementations, use:

- **cc-bouncer**: Modern Policy Enforcement Point with integrated PDP
- **cc-bouncer-sidecar**: Container sidecar deployment of PEP
- **cc-opal**: OPAL server for policy synchronization

## Request Flow

```text
PEP → PDP → OPA → PDP → PEP
```

## Environment Variables

- `OPA_URL`: URL of the OPA client (required)
- `PAP_URL`: URL of the Policy Administration Point (optional, for policy management)
- `PORT`: Port for the PDP service (default: 8081)

## API

### Authorization Decision

POST /api/v1/authorize

Request:

```json
{
  "user": {
    "id": "user123",
    "roles": ["developer"]
  },
  "resource": {
    "id": "document123",
    "type": "document"
  },
  "action": {
    "name": "read"
  }
}
```

Response:

```json
{
  "allow": true,
  "reason": "Access granted by OPA policy"
}
```

### Health Check

**GET /health** - Health check including OPA connectivity
**GET /healthz** - Simple health check

## Request Tracing

The PDP logs all incoming requests and outgoing decisions:

1. **📥 PEP_REQUEST**: Incoming authorization request
2. **🔍 OPA_CLIENT**: Query sent to OPA
3. **✅ OPA_CLIENT**: OPA evaluation result
4. **📤 PDP_RESPONSE**: Decision returned to PEP

## Running

```bash
export OPA_URL=http://localhost:8181
export PORT=8081
go run main.go
```

## Testing

```bash
curl -X POST http://localhost:8081/api/v1/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "user": {"id": "test-user"},
    "resource": {"id": "test-resource", "type": "document"},
    "action": {"name": "read"}
  }'
```
