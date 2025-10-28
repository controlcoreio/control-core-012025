# Production-Ready PIP Management System

## Overview

The Policy Information Point (PIP) Management System is a comprehensive solution for integrating enterprise data sources with Control Core's policy engine. It provides real-time data federation, OAuth authentication, schema discovery, and automated synchronization with OPAL.

## 🚀 Features

### ✅ **Completed Features**

#### **1. Database Persistence & Backend Foundation**
- ✅ PostgreSQL persistence with proper error handling
- ✅ Redis caching with TTL based on data sensitivity
- ✅ Secure credential storage with AES-256 encryption
- ✅ Comprehensive audit logging

#### **2. Provider-Specific OAuth & Authentication**
- ✅ Real OAuth 2.0 flows for Okta, Azure AD, Auth0, Google
- ✅ Dynamic authentication field rendering
- ✅ Automatic token refresh and management
- ✅ Provider-specific OAuth configurations

#### **3. Real-Time Schema Introspection & Metadata Discovery**
- ✅ Schema discovery for IAM, Database, and API sources
- ✅ Real-time connection testing with actual API calls
- ✅ Dynamic field mapping with sensitivity levels
- ✅ Provider-specific schema parsing

#### **4. Zapier-Style Granular Integration Configs**
- ✅ Provider-specific configuration wizards
- ✅ Step-by-step setup with validation
- ✅ Comprehensive configuration for all 13 data source types
- ✅ Real-time connection testing and feedback

#### **5. OPAL Integration & Policy Data Pipeline**
- ✅ Real-time data publishing to OPAL
- ✅ Webhook support for instant updates
- ✅ Automatic data transformation to OPA format
- ✅ OPAL configuration generation

#### **6. Sync Scheduler & Automation**
- ✅ APScheduler-based sync scheduling
- ✅ Configurable sync frequencies
- ✅ Job monitoring and error handling
- ✅ Manual sync triggers

## 📋 Supported Data Sources

### **Identity & Context Sources (The 'Who')**
- **Okta**: OAuth 2.0/OIDC, user/group management, custom attributes
- **Azure AD**: Microsoft Identity Platform, directory roles, extensions
- **Auth0**: Custom domains, Management API, user profiles
- **LDAP**: Active Directory, OpenLDAP, user/group queries
- **Google Workspace**: OAuth 2.0, directory API, group memberships

### **Resource & Data Sources (The 'What')**
- **PostgreSQL**: Schema introspection, table/column selection, incremental sync
- **MySQL**: Connection pooling, SSL support, query optimization
- **MongoDB**: Document collections, field mapping, aggregation pipelines
- **SQL Server**: Windows auth, table schemas, stored procedures
- **Oracle**: TNS connections, PL/SQL support, enterprise features

### **Application & Service Schemas (The 'How/Where')**
- **OpenAPI/Swagger**: Endpoint discovery, security definitions, model parsing
- **GraphQL**: Schema introspection, query validation, type mapping
- **REST APIs**: Custom endpoints, authentication, response parsing

### **Enterprise Systems**
- **Salesforce**: CRM objects, OAuth flows, field selection
- **ServiceNow**: IT service management, table selection, webhook support
- **Workday**: HR data, employee profiles, organizational structure
- **SAP**: ERP modules, business objects, RFC connections

## 🏗️ Architecture

### **Backend Services**

#### **Core Services**
- `pip_service.py`: Main PIP service with caching and sync
- `secrets_service.py`: Secure credential storage with encryption
- `oauth_service.py`: OAuth 2.0 flows and token management
- `schema_introspection_service.py`: Real-time schema discovery
- `pip_connector_service.py`: Connect to external data sources
- `pip_cache_service.py`: Redis caching with encryption
- `pip_data_distributor.py`: Format PIP data for OPAL polling (does NOT push to OPAL)
- `sync_scheduler.py`: Automated sync scheduling with APScheduler
- `audit_logger.py`: Comprehensive audit logging

**Note:** We expose `/opal/pip-data` endpoints that OPAL polls. OPAL handles all distribution to bouncers.

#### **Connectors**
- `iam_connector.py`: IAM/IDP connectors (Okta, Azure AD, Auth0, LDAP)
- `database_connector.py`: Database connectors (PostgreSQL, MySQL, MongoDB)
- `openapi_parser.py`: OpenAPI specification parsing

#### **Models**
- `PIPConnection`: Connection configuration and metadata
- `OAuthToken`: OAuth token storage and management
- `WebhookEvent`: Webhook event tracking
- `PIPSyncLog`: Sync operation logging
- `IntegrationTemplate`: Pre-configured integration templates

### **Frontend Components**

#### **Wizard Components**
- `AddInformationSourceWizard.tsx`: Main configuration wizard
- `DataSourcesStep.tsx`: Getting started wizard step
- `DataSourcesPage.tsx`: Settings page for managing connections

#### **Provider-Specific Wizards**
- `OktaOAuthFields.tsx`: Okta OAuth configuration
- `AzureADOAuthFields.tsx`: Azure AD OAuth configuration
- `Auth0OAuthFields.tsx`: Auth0 OAuth configuration
- `SalesforceIntegrationWizard.tsx`: Salesforce CRM integration
- `ServiceNowIntegrationWizard.tsx`: ServiceNow IT service management
- `DatabaseIntegrationWizard.tsx`: Multi-database integration
- `HRIntegrationWizard.tsx`: HR systems integration

#### **Services**
- `pipService.ts`: Frontend API service with TypeScript types

## 🔧 API Endpoints

### **Connection Management**
- `POST /pip/connections` - Create new connection
- `GET /pip/connections` - List all connections
- `GET /pip/connections/{id}` - Get connection details
- `PUT /pip/connections/{id}` - Update connection
- `DELETE /pip/connections/{id}` - Delete connection
- `POST /pip/connections/test` - Test connection

### **OAuth Integration**
- `GET /pip/oauth/authorize/{provider}` - Initiate OAuth flow
- `POST /pip/oauth/callback/{provider}` - Handle OAuth callback
- `POST /pip/oauth/refresh/{connection_id}` - Refresh OAuth tokens

### **OPAL Integration**
- `POST /pip/connections/{id}/publish-to-opal` - Publish data to OPAL
- `GET /pip/connections/{id}/opal-status` - Get OPAL publish status
- `GET /pip/connections/{id}/data-snapshot` - Get data snapshot for OPAL
- `POST /pip/webhooks/{provider}/{connection_id}` - Handle webhooks
- `GET /pip/opal/config` - Get OPAL client configuration
- `GET /pip/connections/{id}/opal-config` - Get connection OPAL config

### **Sync Scheduler**
- `POST /pip/connections/{id}/schedule-sync` - Schedule automated sync
- `DELETE /pip/connections/{id}/unschedule-sync` - Remove from sync schedule
- `GET /pip/connections/{id}/sync-status` - Get sync status
- `POST /pip/connections/{id}/trigger-sync` - Trigger manual sync
- `GET /pip/sync/scheduler-stats` - Get scheduler statistics
- `GET /pip/sync/jobs` - Get all sync jobs
- `POST /pip/sync/reschedule-all` - Reschedule all connections

## 🚀 Getting Started

### **Prerequisites**
- Python 3.8+
- PostgreSQL 12+
- Redis 6+
- Node.js 16+ (for frontend)

### **Backend Setup**

1. **Install Dependencies**
```bash
cd cc-pap-api
pip install -r requirements.txt
```

2. **Database Setup**
```bash
# Create database
createdb control_core_db

# Run migrations
python init_db.py
python seed_integration_templates.py
```

3. **Start Services**
```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend Setup**

1. **Install Dependencies**
```bash
cd cc-pap
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

### **Docker Setup**

1. **Start All Services**
```bash
cd cc-pap-api
docker-compose up -d
```

## 🧪 Testing

### **Integration Testing**
```bash
cd cc-pap-api
python test_pip_integration.py
```

### **Manual Testing**

1. **Create Connection**
   - Navigate to `/settings/data-sources`
   - Click "Add Data Source"
   - Select provider and configure OAuth
   - Test connection and save

2. **Verify OPAL Integration**
   - Check OPAL receives data: `GET /pip/connections/{id}/data-snapshot`
   - Verify publishing: `POST /pip/connections/{id}/publish-to-opal`

3. **Test Sync Scheduling**
   - Schedule sync: `POST /pip/connections/{id}/schedule-sync`
   - Check status: `GET /pip/connections/{id}/sync-status`

## 📊 Monitoring

### **Health Checks**
- Connection health: `GET /pip/connections/{id}/health`
- Scheduler stats: `GET /pip/sync/scheduler-stats`
- OPAL status: `GET /pip/connections/{id}/opal-status`

### **Audit Logs**
- View logs: `GET /pip/audit/logs`
- Filter by connection: `GET /pip/audit/logs?connection_id={id}`
- Filter by date: `GET /pip/audit/logs?start_date=2024-01-01`

### **Metrics**
- Sync success rate
- Connection uptime
- Data freshness
- Error rates

## 🔒 Security

### **Credential Management**
- AES-256 encryption for stored credentials
- Secure token storage with expiration
- Audit logging for all credential access
- Support for external vaults (HashiCorp Vault, AWS Secrets Manager)

### **Data Protection**
- Sensitivity-based caching TTL
- Encrypted data in transit and at rest
- PII detection and handling
- GDPR compliance features

### **Access Control**
- Role-based access to connections
- Audit trails for all operations
- IP-based access restrictions
- Rate limiting and DDoS protection

## 🚀 Deployment

### **Production Checklist**
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure external secrets vault
- [ ] Set up monitoring and alerting
- [ ] Configure SSL certificates
- [ ] Set up backup and recovery
- [ ] Configure log aggregation
- [ ] Set up CI/CD pipeline

### **Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# Security
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# OPAL
OPAL_URL=http://opal-server:7002
OPAL_TOKEN=your-opal-token

# External Vaults (optional)
VAULT_URL=https://vault.example.com
VAULT_TOKEN=your-vault-token
```

## 📈 Performance

### **Optimization Features**
- Connection pooling for databases
- Redis caching with TTL
- Incremental sync support
- Batch processing for large datasets
- Async/await throughout

### **Scaling Considerations**
- Horizontal scaling with multiple instances
- Database connection pooling
- Redis cluster for caching
- Load balancing for webhooks
- Message queues for async processing

## 🐛 Troubleshooting

### **Common Issues**

1. **Connection Test Fails**
   - Check credentials and network connectivity
   - Verify OAuth configuration
   - Check provider API limits

2. **OPAL Publishing Fails**
   - Verify OPAL server is running
   - Check OPAL token validity
   - Review network connectivity

3. **Sync Jobs Not Running**
   - Check scheduler status
   - Verify connection is active
   - Review job logs

### **Debug Mode**
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
uvicorn app.main:app --reload --log-level debug
```

## 📚 Documentation

### **API Documentation**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### **Integration Guides**
- [Okta Integration Guide](docs/okta-integration.md)
- [Azure AD Integration Guide](docs/azure-ad-integration.md)
- [Salesforce Integration Guide](docs/salesforce-integration.md)
- [Database Integration Guide](docs/database-integration.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide
- Contact the development team

---

**🎉 The PIP Management System is production-ready and provides enterprise-grade data source integration for Control Core's policy engine!**
