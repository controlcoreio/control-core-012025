# Cedar Policy Store Integration

## Overview

This directory contains the staged architecture for future AWS Cedar Policy Store integration with Control Core. The Cedar integration will enable customers to leverage AWS Cedar policies alongside the existing OPA-based authorization system.

## Current Status

**Status**: Architecture Staged  
**Implementation**: Future Enhancement  
**Current Policy Engine**: OPA (Open Policy Agent) with Rego policies  
**Future Policy Engine**: AWS Cedar Policy Store via [permitio/cedar-agent](https://github.com/permitio/cedar-agent)

## Architecture

### **Cedar Agent Integration**

- **Source**: [permitio/cedar-agent](https://github.com/permitio/cedar-agent)
- **Purpose**: HTTP server for Cedar policy management
- **Features**:
  - Policy store management (In-Memory, Redis)
  - Data store management
  - Schema store management
  - Authorization checks

### **AWS Cedar Support**

- **Source**: [cedar-policy](https://github.com/cedar-policy)
- **Purpose**: Core Cedar policy language support
- **Features**:
  - Cedar policy evaluation
  - AWS integration capabilities
  - Policy validation and compilation

## Configuration Files

### **Schema Definition**

- `schema.json` - Cedar schema definitions for entity types and actions
- Defines the structure of your authorization data
- Includes entity types (User, Resource) and actions (read, write, delete, admin)

### **Policy Templates**

- `policies.json` - Cedar policy templates
- Contains example policies for common authorization scenarios
- Includes admin policies and read policies

### **Data Store**

- `data.json` - Cedar data store templates
- Contains example entities and their attributes
- Includes users, resources, and their relationships

### **Examples**

- `examples/authorization_query.json` - Example authorization queries
- Shows how to structure authorization requests
- Includes principal, action, resource, and context

## Docker Configuration

### **Cedar Agent Service**

```yaml
# cc-infra/docker-compose/cedar-compose.yml
services:
  cc-cedar-agent:
    image: permitio/cedar-agent:latest
    ports: ["8180:8180"]
    profiles: ["cedar"]  # Only start with --profile cedar
```

### **Environment Variables**

```bash
CEDAR_AGENT_PORT=8180
CEDAR_AGENT_ADDR=0.0.0.0
CEDAR_AGENT_LOG_LEVEL=info
CEDAR_AGENT_AUTHENTICATION=${CEDAR_AGENT_AUTH_TOKEN}
```

## Usage (Future Implementation)

### **Start Cedar Agent**

```bash
# Start Cedar Agent with Docker Compose
docker-compose --profile cedar up -d

# Or start directly
docker run -p 8180:8180 permitio/cedar-agent
```

### **API Endpoints (Future)**

- `GET /v1/schema` - Retrieve Cedar schema
- `PUT /v1/schema` - Update Cedar schema
- `GET /v1/policies` - List Cedar policies
- `PUT /v1/policies` - Update Cedar policies
- `GET /v1/data` - Retrieve Cedar data
- `PUT /v1/data` - Update Cedar data
- `POST /v1/is_authorized` - Authorization checks

### **Example Authorization Check**

```bash
curl -X POST -H "Content-Type: application/json" \
  -d @examples/authorization_query.json \
  http://localhost:8180/v1/is_authorized
```

## Integration with Control Core

### **Current State**

- All Control Core functionality uses OPA
- Cedar integration is staged but not implemented
- No Cedar policy evaluation in production
- Cedar Agent not included in default deployments

### **Future Integration**

- Cedar Agent service implementation
- Cedar policy editor in cc-pap
- Cedar language server support
- Cedar policy synchronization via OPAL
- Hybrid OPA/Cedar policy support

## Benefits

### **AWS Ecosystem Integration**

- **Native AWS Support**: Direct integration with AWS services
- **AWS Cedar Policies**: Leverage existing AWS policy investments
- **AWS Compliance**: Built-in AWS compliance frameworks
- **AWS IAM Integration**: Seamless AWS IAM policy migration

### **Enhanced Policy Capabilities**

- **Structured Policies**: More structured than Rego policies
- **Performance**: Optimized for AWS environments
- **Scalability**: Built for enterprise-scale deployments
- **Validation**: Strong type checking and validation

## Migration Strategy (Future)

### **From OPA to Cedar**

1. **Policy Analysis**: Identify OPA policies suitable for Cedar
2. **Policy Translation**: Convert Rego policies to Cedar policies
3. **Testing**: Validate Cedar policy behavior
4. **Migration**: Deploy Cedar policies alongside OPA
5. **Validation**: Ensure equivalent authorization behavior
6. **Cutover**: Switch to Cedar for specific use cases

### **Hybrid Approach**

- **OPA**: Continue for existing Rego policies
- **Cedar**: Use for new AWS-specific policies
- **Unified Interface**: Single Control Core interface for both
- **Gradual Migration**: Incremental transition over time

## Documentation

- **Cedar Roadmap**: [../version-management/CEDAR_ROADMAP.md](../version-management/CEDAR_ROADMAP.md)
- **Cedar Agent**: [https://github.com/permitio/cedar-agent](https://github.com/permitio/cedar-agent)
- **AWS Cedar**: [https://github.com/cedar-policy](https://github.com/cedar-policy)
- **Cedar Documentation**: [https://docs.cedarpolicy.com/](https://docs.cedarpolicy.com/)

## Status

**Current Focus**: OPA-Only Implementation  
**Future Enhancement**: Cedar Policy Store Integration  
**Architecture**: Staged and Ready for Implementation  
**Timeline**: Q2-Q4 2025

---

**Last Updated**: January 2025  
**Status**: Architecture Staged  
**Next Phase**: Development Integration
