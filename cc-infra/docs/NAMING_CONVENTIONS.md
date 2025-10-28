# Control Core Naming Conventions
## Overview

This document outlines the consistent naming conventions used across Control Core components to ensure organized and maintainable code.
## Component Naming Patterns
### 1. Frontend Components (cc-pap)
#### Settings Pages

- **Pattern**: `{Feature}SettingsPage.tsx`
- **Examples**:
  - `AIIntegrationSettingsPage.tsx` - AI integration configuration
  - `PIPSettingsPage.tsx` - Policy Information Point settings
  - `GeneralSettingsPage.tsx` - General application settings
  - `UserManagementPage.tsx` - User management settings
  - `NotificationSettingsPage.tsx` - Notification configuration
#### Service Components

- **Pattern**: `{Feature}Service.tsx` or `{Feature}Manager.tsx`
- **Examples**:
  - `AIIntegrationService.tsx` - AI integration service
  - `PIPService.tsx` - PIP management service
  - `UserManagementService.tsx` - User management service
#### Modal Components

- **Pattern**: `{Action}{Feature}Modal.tsx`
- **Examples**:
  - `AddEditPIPModal.tsx` - Add/edit PIP connection modal
  - `AttributeMappingModal.tsx` - Attribute mapping configuration modal
  - `EditUserModal.tsx` - User editing modal
### 2. Backend API Routers (cc-pap-api)
#### Router Files

- **Pattern**: `{feature}.py` or `{feature}_settings.py`
- **Examples**:
  - `ai_integration.py` - AI integration API endpoints
  - `pip.py` - Policy Information Point API endpoints
  - `policies.py` - Policy management API endpoints
  - `auth.py` - Authentication API endpoints
#### Service Files

- **Pattern**: `{feature}_service.py`
- **Examples**:
  - `ai_integration_service.py` - AI integration business logic
  - `pip_service.py` - PIP management business logic
  - `policy_service.py` - Policy management business logic
### 3. PAP Pro Tenant (cc-pap-pro-tenant)
#### Router Files

- **Pattern**: `{feature}_settings.py` (for tenant-specific settings)
- **Examples**:
  - `ai_integration_settings.py` - AI integration for tenants
  - `bouncer_connections.py` - Bouncer connection management
  - `context_ingestion.py` - Context ingestion for tenants
  - `tenant_isolation.py` - Tenant isolation management
#### Service Files

- **Pattern**: `{feature}_service.py`
- **Examples**:
  - `ai_integration_service.py` - Tenant AI integration service
  - `bouncer_connection_service.py` - Bouncer connection service
  - `context_ingestion_service.py` - Context ingestion service
### 4. Bouncer Components (cc-bouncer)
#### Service Files

- **Pattern**: `{feature}_service.go`
- **Examples**:
  - `ai_integration_service.go` - AI integration in Bouncer
  - `opal_pip_service.go` - OPAL PIP service
  - `context_ingestion_service.go` - Context ingestion service
  - `policy_cache_service.go` - Policy caching service
## API Endpoint Naming
### 1. Standard PAP API

- **Pattern**: `/api/v1/{feature}`
- **Examples**:
  - `/api/v1/ai` - AI integration endpoints
  - `/api/v1/pip` - PIP endpoints
  - `/api/v1/policies` - Policy endpoints
  - `/api/v1/context` - Context generation endpoints
### 2. PAP Pro Tenant API

- **Pattern**: `/api/v1/{feature}` or `/api/v1/{feature}-settings`
- **Examples**:
  - `/api/v1/ai-integration` - AI integration for tenants
  - `/api/v1/bouncer-connections` - Bouncer connection management
  - `/api/v1/context-ingestion` - Context ingestion for tenants
  - `/api/v1/tenant-isolation` - Tenant isolation management
## Database Model Naming
### 1. Standard Models

- **Pattern**: `{Feature}` (PascalCase)
- **Examples**:
  - `AIConfiguration` - AI service configuration
  - `PIPConnection` - PIP connection
  - `Policy` - Policy model
  - `User` - User model
### 2. Tenant-Specific Models

- **Pattern**: `Tenant{Feature}` (PascalCase)
- **Examples**:
  - `TenantAIConfiguration` - Tenant AI configuration
  - `TenantBouncerConnection` - Tenant bouncer connection
  - `TenantPolicy` - Tenant-specific policy
  - `TenantUser` - Tenant user
## File Structure Consistency
### 1. Frontend Structure

```
cc-pap/src/components/settings/
├── AIIntegrationSettingsPage.tsx
├── PIPSettingsPage.tsx
├── GeneralSettingsPage.tsx
├── UserManagementPage.tsx
├── integrations/
│   ├── AIAgentForm.tsx
│   ├── MCPForm.tsx
│   └── tabs/
│       ├── AIAgentsTab.tsx
│       └── MCPTab.tsx
└── pep/
    ├── PEPManagementPage.tsx
    └── DeployPEP.tsx
```
### 2. Backend Structure

```
cc-pap-api/app/
├── routers/
│   ├── ai_integration.py
│   ├── pip.py
│   ├── policies.py
│   └── auth.py
├── services/
│   ├── ai_integration_service.py
│   ├── pip_service.py
│   └── policy_service.py
└── models.py
```
### 3. PAP Pro Tenant Structure

```
cc-pap-pro-tenant/app/
├── routers/
│   ├── ai_integration_settings.py
│   ├── bouncer_connections.py
│   ├── context_ingestion.py
│   └── tenant_isolation.py
├── services/
│   ├── ai_integration_service.py
│   ├── bouncer_connection_service.py
│   └── context_ingestion_service.py
└── models.py
```
## Naming Rules
### 1. Frontend Components

- **React Components**: PascalCase (e.g., `AIIntegrationSettingsPage`)
- **Files**: PascalCase with descriptive suffix (e.g., `AIIntegrationSettingsPage.tsx`)
- **Functions**: camelCase (e.g., `handleSaveConfiguration`)
- **Variables**: camelCase (e.g., `selectedProvider`)
### 2. Backend Python

- **Files**: snake_case (e.g., `ai_integration_service.py`)
- **Classes**: PascalCase (e.g., `AIIntegrationService`)
- **Functions**: snake_case (e.g., `configure_ai_service`)
- **Variables**: snake_case (e.g., `selected_provider`)
### 3. Backend Go

- **Files**: snake_case (e.g., `ai_integration_service.go`)
- **Types**: PascalCase (e.g., `AIIntegrationService`)
- **Functions**: PascalCase (e.g., `ConfigureAIService`)
- **Variables**: camelCase (e.g., `selectedProvider`)
### 4. API Endpoints

- **URLs**: kebab-case (e.g., `/api/v1/ai-integration`)
- **Tags**: kebab-case (e.g., `ai-integration-settings`)
- **Parameters**: snake_case (e.g., `config_id`)
## Consistency Checklist
### ✅ Implemented

- [x] AI Integration: `AIIntegrationSettingsPage.tsx` (Frontend)
- [x] AI Integration: `ai_integration.py` (PAP API)
- [x] AI Integration: `ai_integration_settings.py` (PAP Pro Tenant)
- [x] PIP Settings: `PIPSettingsPage.tsx` (Frontend)
- [x] PIP Settings: `pip.py` (PAP API)
- [x] Context Ingestion: `context_ingestion.py` (PAP Pro Tenant)
- [x] Bouncer Connections: `bouncer_connections.py` (PAP Pro Tenant)
### 🔄 To Be Implemented

- [ ] User Management: Consistent naming across PAP and PAP Pro Tenant
- [ ] Policy Management: Consistent naming across PAP and PAP Pro Tenant
- [ ] Resource Management: Consistent naming across PAP and PAP Pro Tenant
- [ ] Monitoring: Consistent naming across PAP and PAP Pro Tenant
## Best Practices
1. **Consistency First**: Always follow established patterns
2. **Descriptive Names**: Use clear, descriptive names that explain purpose
3. **Avoid Abbreviations**: Use full words instead of abbreviations when possible
4. **Group Related Features**: Organize related components in appropriate directories
5. **Document Changes**: Update this document when adding new naming patterns
## Migration Guide
When renaming components to follow these conventions:
1. **Update File Names**: Rename files to follow the pattern
2. **Update Imports**: Update all import statements
3. **Update Exports**: Update export statements
4. **Update References**: Update all references in other files
5. **Update Documentation**: Update any relevant documentation
6. **Test Thoroughly**: Ensure all functionality still works after renaming
