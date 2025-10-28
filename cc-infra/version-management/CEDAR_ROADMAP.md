# Cedar Policy Store Integration Roadmap

## Overview

This document outlines the future integration of AWS Cedar Policy Store capabilities into Control Core, enabling customers to leverage Cedar policies alongside the existing OPA-based authorization system.

## Current State

### **Primary Policy Engine: OPA (Open Policy Agent)**

- **Language**: Rego policies
- **Integration**: Full Control Core platform support
- **Features**: Real-time policy evaluation, content injection, audit logging
- **Status**: Production ready and fully supported

### **Future Enhancement: AWS Cedar Policy Store**

- **Language**: Cedar policies
- **Integration**: Staged architecture for future implementation
- **Features**: AWS Cedar capabilities, policy store management
- **Status**: Architecture staged, implementation pending

## Cedar Integration Architecture

### **Components Staged**

#### **1. Cedar Agent Integration**

- **Source**: [permitio/cedar-agent](https://github.com/permitio/cedar-agent)
- **Purpose**: HTTP server for Cedar policy management
- **Features**:
  - Policy store management (In-Memory, Redis)
  - Data store management
  - Schema store management
  - Authorization checks

#### **2. AWS Cedar Support**

- **Source**: [cedar-policy](https://github.com/cedar-policy)
- **Purpose**: Core Cedar policy language support
- **Features**:
  - Cedar policy evaluation
  - AWS integration capabilities
  - Policy validation and compilation

### **Staged Infrastructure**

#### **Docker Configuration**

```yaml
# cc-infra/docker-compose/cedar-compose.yml
services:
  cc-cedar-agent:
    image: permitio/cedar-agent:latest
    ports: ["8180:8180"]
    profiles: ["cedar"]  # Only start with --profile cedar
```

#### **Configuration Files**

- `cc-infra/cedar/schema.json` - Cedar schema definitions
- `cc-infra/cedar/policies.json` - Cedar policy templates
- `cc-infra/cedar/data.json` - Cedar data store templates
- `cc-infra/cedar/examples/` - Cedar usage examples

## Implementation Phases

### **Phase 1: Architecture Staging (Current)**

- ✅ Cedar Agent Docker configuration
- ✅ Cedar schema and policy templates
- ✅ BOM integration with staged status
- ✅ Documentation and roadmap

### **Phase 2: Development Integration (Future)**

- 🔄 Cedar Agent service integration
- 🔄 Policy language support in cc-pap
- 🔄 Cedar policy editor in Monaco Editor
- 🔄 Cedar language server support

### **Phase 3: Production Integration (Future)**

- 🔄 Cedar policy evaluation in cc-bouncer
- 🔄 Cedar policy synchronization via OPAL
- 🔄 Cedar policy templates and examples
- 🔄 Cedar-specific compliance frameworks

### **Phase 4: Advanced Features (Future)**

- 🔄 AWS Cedar Policy Store integration
- 🔄 Cedar policy migration tools
- 🔄 Hybrid OPA/Cedar policy support
- 🔄 Cedar-specific AI agent capabilities

## Technical Specifications

### **Cedar Agent Configuration**

```bash
# Environment Variables
CEDAR_AGENT_PORT=8180
CEDAR_AGENT_ADDR=0.0.0.0
CEDAR_AGENT_LOG_LEVEL=info
CEDAR_AGENT_AUTHENTICATION=${CEDAR_AGENT_AUTH_TOKEN}
CEDAR_AGENT_SCHEMA=/app/schema.json
CEDAR_AGENT_POLICIES=/app/policies.json
CEDAR_AGENT_DATA=/app/data.json
```

### **API Endpoints (Future)**

- `GET /v1/schema` - Retrieve Cedar schema
- `PUT /v1/schema` - Update Cedar schema
- `GET /v1/policies` - List Cedar policies
- `PUT /v1/policies` - Update Cedar policies
- `GET /v1/data` - Retrieve Cedar data
- `PUT /v1/data` - Update Cedar data
- `POST /v1/is_authorized` - Authorization checks

### **Policy Language Support**

- **Current**: Rego (OPA)
- **Future**: Cedar (AWS)
- **Hybrid**: Both languages supported simultaneously

## Benefits of Cedar Integration

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

### **Customer Value**

- **AWS Customers**: Native AWS policy support
- **Hybrid Environments**: Support both OPA and Cedar
- **Migration Path**: Easy transition from AWS IAM to Control Core
- **Compliance**: AWS-specific compliance frameworks

## Current Limitations

### **OPA-Only Implementation**

- All current Control Core functionality uses OPA
- Cedar integration is staged but not implemented
- No Cedar policy evaluation in production
- Cedar Agent not included in default deployments

### **Future Requirements**

- Cedar Agent service implementation
- Cedar policy editor development
- Cedar language server integration
- Cedar policy synchronization

## Deployment Models

### **Current (OPA-Only)**

```bash
# Standard deployment
docker-compose up -d

# Services: cc-pap, cc-pap-api, cc-bouncer, cc-opal, cc-opa-server
```

### **Future (OPA + Cedar)**

```bash
# OPA deployment
docker-compose up -d

# Cedar deployment (future)
docker-compose --profile cedar up -d

# Hybrid deployment (future)
docker-compose --profile opa --profile cedar up -d
```

## Migration Strategy

### **From OPA to Cedar (Future)**

1. **Policy Analysis**: Identify OPA policies suitable for Cedar
2. **Policy Translation**: Convert Rego policies to Cedar policies
3. **Testing**: Validate Cedar policy behavior
4. **Migration**: Deploy Cedar policies alongside OPA
5. **Validation**: Ensure equivalent authorization behavior
6. **Cutover**: Switch to Cedar for specific use cases

### **Hybrid Approach (Future)**

- **OPA**: Continue for existing Rego policies
- **Cedar**: Use for new AWS-specific policies
- **Unified Interface**: Single Control Core interface for both
- **Gradual Migration**: Incremental transition over time

## Monitoring and Observability

### **Cedar-Specific Metrics (Future)**

- Cedar policy evaluation latency
- Cedar Agent performance
- Cedar policy compilation success
- Cedar authorization decision rates

### **Health Checks (Future)**

- Cedar Agent service availability
- Cedar policy store connectivity
- Cedar schema validation
- Cedar data store synchronization

## Security Considerations

### **Cedar-Specific Security (Future)**

- Cedar policy validation
- Cedar schema enforcement
- Cedar data store security
- Cedar Agent authentication

### **Hybrid Security (Future)**

- OPA and Cedar policy isolation
- Cross-policy-engine authorization
- Unified audit logging
- Consistent security policies

## Documentation and Training

### **Cedar Documentation (Future)**

- Cedar policy development guide
- Cedar schema design patterns
- Cedar migration from OPA
- Cedar AWS integration guide

### **Training Materials (Future)**

- Cedar policy authoring
- Cedar vs OPA comparison
- Cedar best practices
- Cedar troubleshooting guide

## Success Metrics

### **Technical Metrics**

- Cedar policy evaluation performance
- Cedar Agent uptime and reliability
- Cedar policy compilation success rate
- Cedar authorization accuracy

### **Business Metrics**

- Customer adoption of Cedar policies
- AWS integration success rate
- Policy migration completion rate
- Customer satisfaction with Cedar features

## Timeline

### **Q1 2026: Architecture Staging**

- ✅ Cedar Agent Docker configuration
- ✅ Cedar schema and policy templates
- ✅ BOM integration
- ✅ Documentation and roadmap

### **Q2 2026: Development Integration**

- 🔄 Cedar Agent service integration
- 🔄 Cedar policy editor
- 🔄 Cedar language server
- 🔄 Basic Cedar policy evaluation

### **Q3 2026: Production Integration**

- 🔄 Cedar policy synchronization
- 🔄 Cedar policy templates
- 🔄 Cedar compliance frameworks
- 🔄 Cedar AWS integration

### **Q4 2026: Advanced Features**

- 🔄 AWS Cedar Policy Store integration
- 🔄 Hybrid OPA/Cedar support
- 🔄 Cedar migration tools
- 🔄 Cedar AI agent capabilities

---

**Roadmap Status**: Architecture Staged  
**Current Focus**: OPA-Only Implementation  
**Future Enhancement**: Cedar Policy Store Integration  
**Last Updated**: September 2025
