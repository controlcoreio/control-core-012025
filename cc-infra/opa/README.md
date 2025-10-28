# OPA Infrastructure Management

## Overview

This directory contains the infrastructure management for Open Policy Agent (OPA) in Control Core. OPA serves as the primary policy engine for authorization decisions.

## Current Status

**Status**: Production Ready  
**Version**: OPA v1.9.0  
**Integration**: Full Control Core platform support  
**Policy Language**: Rego

## Architecture

### **OPA Server Configuration**

- **Image**: `openpolicyagent/opa:1.9.0`
- **Port**: 8181
- **Configuration**: YAML-based configuration
- **Policies**: Rego policy files
- **Data**: JSON data store

### **OPA Integration Points**

- **cc-bouncer**: Communicates with OPA for policy evaluation
- **cc-opal**: Synchronizes policies with OPA
- **cc-pap**: Manages OPA policies through UI
- **cc-pap-api**: Provides OPA policy management API

## Directory Structure

```text
cc-infra/opa/
├── config/           # OPA server configuration
├── policies/         # Rego policy files
├── data/            # OPA data store
├── examples/        # Usage examples
└── README.md        # This file
```

## Configuration Files

### **OPA Server Configuration Overview**

- `config/opa-server-config.yaml` - OPA server configuration
- Includes decision logging, status, bundles, and metrics

### **Policy Files**

- `policies/cc-policies.rego` - Control Core policy templates
- Contains example Rego policies for common scenarios

### **Data Store**

- `data/cc-data.json` - OPA data store
- Contains example entities and their attributes

### **Examples**

- `examples/authorization_query.json` - Example authorization queries
- Shows how to structure authorization requests

## Docker Configuration

### **OPA Server Service**

```yaml
# cc-infra/docker-compose/opa-compose.yml
services:
  cc-opa-server:
    image: openpolicyagent/opa:1.9.0
    ports: ["8181:8181"]
    profiles: ["opa"]  # Only start with --profile opa
```

### **Environment Variables**

```bash
OPA_LOG_LEVEL=info
OPA_LOG_FORMAT=json
```

## Usage

### **Start OPA Server**

```bash
# Start OPA Server with Docker Compose
docker-compose --profile opa up -d

# Or start directly
docker run -p 8181:8181 openpolicyagent/opa:1.9.0 run --server
```

### **API Endpoints**

- `GET /health` - Health check
- `GET /v1/data` - Retrieve data
- `PUT /v1/data` - Update data
- `POST /v1/data` - Query data
- `GET /v1/policies` - List policies
- `PUT /v1/policies` - Update policies
- `POST /v1/data` - Evaluate policies

### **Example Policy Evaluation**

```bash
curl -X POST -H "Content-Type: application/json" \
  -d @examples/authorization_query.json \
  http://localhost:8181/v1/data/cc/policies/allow
```

## Policy Management

### **Policy Development**

- **Language**: Rego
- **Editor**: Monaco Editor with Rego support
- **Linting**: Regal for Rego linting
- **Testing**: OPA test framework

### **Policy Deployment**

- **OPAL Integration**: Automatic policy synchronization
- **Bundle Management**: Policy bundles for deployment
- **Version Control**: Git-based policy management
- **Rollback**: Policy version rollback capabilities

## Integration with Control Core

### **Current Integration**

- **cc-bouncer**: Uses OPA for policy evaluation
- **cc-opal**: Synchronizes policies with OPA
- **cc-pap**: Manages OPA policies through UI
- **cc-pap-api**: Provides OPA policy management API

### **Policy Flow**

```text
cc-pap (UI) → cc-pap-api (Backend) → cc-opal (Sync) → OPA (Evaluation) → cc-bouncer (Enforcement)
```

## Performance and Monitoring

### **Performance Metrics**

- Policy evaluation latency
- OPA server performance
- Policy compilation success
- Authorization decision rates

### **Health Checks**

- OPA service availability
- Policy store connectivity
- Data store synchronization
- Policy compilation status

## Security Considerations

### **OPA Security**

- Policy validation and compilation
- Data store security
- OPA server authentication
- Policy access control

### **Integration Security**

- Secure communication with cc-bouncer
- Policy synchronization security
- Data store encryption
- Audit logging

## Troubleshooting

### **Common Issues**

- Policy compilation errors
- Data store connectivity issues
- Performance degradation
- Authorization decision failures

### **Debugging**

- OPA server logs
- Policy evaluation traces
- Performance profiling
- Health check status

## Documentation

- **OPA Documentation**: [https://www.openpolicyagent.org/docs/](https://www.openpolicyagent.org/docs/)
- **Rego Language**: [https://www.openpolicyagent.org/docs/latest/policy-language/](https://www.openpolicyagent.org/docs/latest/policy-language/)
- **OPA API**: [https://www.openpolicyagent.org/docs/latest/rest-api/](https://www.openpolicyagent.org/docs/latest/rest-api/)

## Status

**Current Focus**: Production OPA Implementation  
**Version**: OPA v1.9.0  
**Integration**: Full Control Core Platform  
**Performance**: Optimized for enterprise scale

---

**Last Updated**: January 2025  
**Status**: Production Ready  
**Next Review**: February 2025
