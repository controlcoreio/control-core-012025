# Control Core - Deployment with Policy Templates

## Overview

This guide ensures that all **165 policy templates** are automatically loaded during any new deployment of Control Core.

## Quick Deployment

### Option 1: Automated Deployment Script (Recommended)

```bash
cd cc-pap-api
./deploy_with_templates.sh
```

This script automatically:
1. ✅ Sets up virtual environment
2. ✅ Installs dependencies
3. ✅ Checks database connection
4. ✅ Runs database migrations (adds template_metadata column)
5. ✅ Loads all 165 policy templates
6. ✅ Verifies templates were loaded successfully

### Option 2: Manual Deployment

```bash
# Navigate to PAP API directory
cd cc-pap-api

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migration (adds template_metadata column)
python3 add_template_metadata_column.py

# Load policy templates
python3 load_policy_templates.py

# Verify templates loaded
python3 -c "
import psycopg2
import os
conn = psycopg2.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    database=os.getenv('DB_NAME', 'control_core_db'),
    user=os.getenv('DB_USER', 'postgres'),
    password=os.getenv('DB_PASSWORD', 'password')
)
cursor = conn.cursor()
cursor.execute('SELECT COUNT(*) FROM policy_templates')
print(f'Templates loaded: {cursor.fetchone()[0]}')
"
```

## Docker Deployment

### Update Dockerfile

Add template loading to your Dockerfile:

```dockerfile
# In cc-pap-api/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Add template loading to entrypoint
RUN echo '#!/bin/bash\n\
python3 add_template_metadata_column.py\n\
python3 load_policy_templates.py\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000' > /app/entrypoint.sh && \
chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
```

### Docker Compose

Ensure your `docker-compose.yml` includes template loading:

```yaml
services:
  pap-api:
    build: ./cc-pap-api
    environment:
      - DB_HOST=postgres
      - DB_NAME=control_core_db
      - DB_USER=postgres
      - DB_PASSWORD=password
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ../cc-pap-core/policy-templates:/app/templates:ro
    command: >
      sh -c "
        python3 add_template_metadata_column.py &&
        python3 load_policy_templates.py &&
        uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
      "
```

## Kubernetes Deployment

### Init Container Approach

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: control-core-pap-api
spec:
  template:
    spec:
      initContainers:
        - name: load-templates
          image: control-core-pap-api:latest
          command:
            - /bin/sh
            - -c
            - |
              python3 add_template_metadata_column.py
              python3 load_policy_templates.py
          env:
            - name: DB_HOST
              value: "postgres-service"
            - name: DB_NAME
              value: "control_core_db"
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
      containers:
        - name: pap-api
          image: control-core-pap-api:latest
          # ... rest of container spec
```

## Verification

### Check Templates in Database

```bash
# Connect to database
psql -h localhost -U postgres -d control_core_db

# Count templates
SELECT COUNT(*) FROM policy_templates;
-- Expected: 165

# View template categories
SELECT category, COUNT(*) as count 
FROM policy_templates 
GROUP BY category 
ORDER BY count DESC;

# View templates with metadata
SELECT id, name, category, 
       template_metadata->>'risk_level' as risk_level
FROM policy_templates 
LIMIT 10;
```

### Check Templates via API

```bash
# Get all templates
curl http://localhost:8000/policies/templates/

# Get templates by category
curl http://localhost:8000/policies/templates/?category=NIST%20AI%20RMF

# Check template metadata
curl http://localhost:8000/policies/templates/ | jq '.[0].template_metadata'
```

### Check in UI

1. Start frontend: `cd cc-pap && npm run dev`
2. Navigate to: `http://localhost:5173/policies/templates`
3. Verify:
   - ✅ All 165 templates display
   - ✅ Category filtering works
   - ✅ "More Details" shows comprehensive information
   - ✅ Risk levels display correctly
   - ✅ Templates can be deployed to sandbox

## Template Categories

| Category | Count | Description |
|----------|-------|-------------|
| NIST AI RMF | 8 | AI Risk Management Framework compliance |
| Canadian AIDA | 5 | Artificial Intelligence and Data Act |
| Canadian AI Governance | 5 | Canadian AI governance frameworks |
| AI Security | 17 | RAG, LLM, Agent, Prompt security |
| Privacy & Compliance | 35 | GDPR, HIPAA, PIPEDA, PHIPA, CCPA, SOC2 |
| Data Governance | 20 | Masking, Classification, Retention, Access |
| Security Controls | 20 | Zero Trust, MFA, RBAC, API Security |
| Just-in-Time Access | 10 | Temporary & emergency access |
| Industry Frameworks | 10 | PCI-DSS, ISO 27001, NIST CSF |
| Cloud Security | 5 | Multi-cloud protection |
| Open Banking | 6 | Financial security |
| Additional | 24 | AI Governance, Platform, Network, etc. |
| **Total** | **165** | **Production-ready templates** |

## Troubleshooting

### Templates Not Loading

**Issue**: Template loader fails with database error

```bash
# Check database connection
python3 -c "
import psycopg2
import os
conn = psycopg2.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    database=os.getenv('DB_NAME', 'control_core_db'),
    user=os.getenv('DB_USER', 'postgres'),
    password=os.getenv('DB_PASSWORD', 'password')
)
print('Database connected successfully')
"

# Check if table exists
psql -h localhost -U postgres -d control_core_db -c "\d policy_templates"

# Run migration if column missing
python3 add_template_metadata_column.py
```

### Templates Not Showing in UI

**Issue**: UI shows "No templates found"

```bash
# Check API response
curl http://localhost:8000/policies/templates/ | jq length

# Check frontend API configuration
# Verify APP_CONFIG.api.baseUrl in cc-pap/src/config/app.ts
```

### Template Metadata Missing

**Issue**: Templates display but "More Details" shows no information

```bash
# Check metadata in database
psql -h localhost -U postgres -d control_core_db -c \
  "SELECT template_metadata FROM policy_templates LIMIT 1;"

# Re-run template loader to update metadata
python3 load_policy_templates.py
```

## Production Deployment Checklist

- [ ] Database migration script (add_template_metadata_column.py) included
- [ ] Template loader script (load_policy_templates.py) included
- [ ] Policy templates directory (cc-pap-core/policy-templates) accessible
- [ ] Template metadata file (template-metadata.json) present
- [ ] Database environment variables configured
- [ ] Template loading runs on deployment
- [ ] Templates verified in database (165 count)
- [ ] API endpoint returns templates with metadata
- [ ] Frontend displays templates correctly
- [ ] Category filtering functional
- [ ] Template details modal working
- [ ] Sandbox deployment operational

## Automated CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Control Core with Templates

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd cc-pap-api
          pip install -r requirements.txt
      
      - name: Run database migrations
        run: |
          cd cc-pap-api
          python3 add_template_metadata_column.py
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_NAME: ${{ secrets.DB_NAME }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
      
      - name: Load policy templates
        run: |
          cd cc-pap-api
          python3 load_policy_templates.py
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_NAME: ${{ secrets.DB_NAME }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
      
      - name: Verify templates loaded
        run: |
          cd cc-pap-api
          python3 -c "
          import psycopg2
          import os
          conn = psycopg2.connect(
              host=os.getenv('DB_HOST'),
              database=os.getenv('DB_NAME'),
              user=os.getenv('DB_USER'),
              password=os.getenv('DB_PASSWORD')
          )
          cursor = conn.cursor()
          cursor.execute('SELECT COUNT(*) FROM policy_templates')
          count = cursor.fetchone()[0]
          assert count == 165, f'Expected 165 templates, got {count}'
          print(f'✓ All {count} templates loaded successfully')
          "
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_NAME: ${{ secrets.DB_NAME }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

## Maintenance

### Updating Templates

```bash
# Add new templates to cc-pap-core/policy-templates/<category>/
# Create .rego file and .meta.json file

# Update template-metadata.json to include new templates

# Re-run loader (will update existing, add new)
python3 load_policy_templates.py
```

### Template Versioning

Templates include version numbers in metadata. To update:

1. Modify the .rego file and .meta.json file
2. Increment version in metadata
3. Run loader - it will update existing templates

---

## Summary

✅ **165 policy templates** ready for deployment  
✅ **Automated loading** via deployment scripts  
✅ **Database migration** handles schema updates  
✅ **UI integration** with rich metadata display  
✅ **Sandbox mode** by default for safety  
✅ **Production-ready** Rego code  

Templates are now a core part of every Control Core deployment!

