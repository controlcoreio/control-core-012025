# Start Control Core with Policy Templates

## ✅ Pre-flight Check

### Templates Loaded
```bash
cd cc-pap-api
python3 verify_templates.py
```

**Expected**: ✅ Total Templates: 168

### Database Ready
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432
```

---

## 🚀 Start Control Core Services

### Step 1: Start Backend API

```bash
# Navigate to API directory
cd cc-pap-api

# Activate virtual environment
source venv/bin/activate

# Start API server (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test API:**
```bash
# In a new terminal
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

curl http://localhost:8000/policies/templates/ | python3 -c "import sys, json; print(f'Templates: {len(json.load(sys.stdin))}')"
# Expected: Templates: 168
```

### Step 2: Start Frontend

```bash
# In a new terminal
cd cc-pap

# Start development server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Access UI:**
- Open browser: `http://localhost:5173`
- Navigate to: `http://localhost:5173/policies/templates`
- **Expected**: 168 templates displayed with categories

---

## 🔍 Verification

### 1. API Endpoint Check

```bash
# Get all templates
curl http://localhost:8000/policies/templates/ | jq length
# Expected: 168

# Get templates by category
curl "http://localhost:8000/policies/templates/?category=NIST%20AI%20RMF" | jq length
# Expected: 8

# Check template metadata
curl http://localhost:8000/policies/templates/ | jq '.[0] | {name, category, has_metadata: (.template_metadata != null)}'
```

### 2. Frontend Check

Open `http://localhost:5173/policies/templates` and verify:

- ✅ Page loads without errors
- ✅ 168 templates display in grid
- ✅ Category filters show (18 categories)
- ✅ Template cards show summary, category, risk level
- ✅ "More Details" button opens modal
- ✅ Modal shows Overview, Use Cases, Conditions, Deployment, Code tabs
- ✅ "Deploy" button works
- ✅ "Customize" button works

### 3. Browser Console Check

- ✅ No errors in console
- ✅ API calls to `/policies/templates/` return 200
- ✅ Data loads successfully

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch policy templates" (422 Error)

**Cause**: Authentication was required but user not logged in

**Solution**: ✅ Already fixed! The `/policies/templates/` endpoint is now public.

If still seeing errors:
```bash
# Kill existing API server
pkill -f "uvicorn app.main:app"

# Restart with clean state
cd cc-pap-api
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: API returns 0 or 3 templates

**Cause**: Templates not loaded or old data

**Solution**:
```bash
cd cc-pap-api
source venv/bin/activate
python3 load_policy_templates.py
python3 verify_templates.py
```

Then restart API server.

### Issue: Frontend shows "No templates found"

**Possible Causes**:
1. API server not running
2. API endpoint returning error
3. CORS issues

**Solution**:
```bash
# Check API is accessible
curl http://localhost:8000/policies/templates/

# Check browser console for errors
# Open DevTools (F12) → Console tab

# Verify API URL in frontend config
# Check: cc-pap/src/config/app.ts
```

### Issue: Modal shows no metadata

**Cause**: Templates loaded without metadata

**Solution**:
```bash
# Reload templates with metadata
cd cc-pap-api
source venv/bin/activate
python3 load_policy_templates.py

# Verify metadata loaded
python3 -c "
import psycopg2
conn = psycopg2.connect(host='localhost', database='control_core_db', user='postgres', password='password')
cursor = conn.cursor()
cursor.execute('SELECT COUNT(*) FROM policy_templates WHERE template_metadata IS NOT NULL')
print(f'Templates with metadata: {cursor.fetchone()[0]}')
"
```

---

## 📱 Quick Test Workflow

### Test 1: Browse Templates
1. Navigate to: `http://localhost:5173/policies/templates`
2. See 168 templates in grid layout
3. Click different category filters
4. Verify counts match

### Test 2: View Template Details
1. Click "More Details" on any template
2. See modal with 5 tabs
3. Click through each tab:
   - **Overview**: Description, compliance frameworks, requirements
   - **Use Cases**: Real-world scenarios
   - **Conditions**: Parameters and types
   - **Deployment**: Setup steps, tips, testing
   - **Code**: Full Rego policy code
4. Close modal

### Test 3: Deploy Template
1. Click "Deploy" on a template
2. Should navigate to policy builder
3. Template Rego code should be pre-loaded
4. Policy set to sandbox mode by default

### Test 4: Customize Template
1. Click "Customize" on a template
2. Should open policy builder with template
3. Can modify in visual builder or code editor
4. Sandbox mode by default

---

## 🎯 Production Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: control_core_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  pap-api:
    build: ./cc-pap-api
    ports:
      - "8000:8000"
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
        uvicorn app.main:app --host 0.0.0.0 --port 8000
      "

  pap-frontend:
    build: ./cc-pap
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - pap-api

volumes:
  postgres_data:
```

### Kubernetes

```yaml
# Init container to load templates
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
```

---

## ✅ Success Checklist

- [ ] PostgreSQL running and accessible
- [ ] Templates loaded in database (168 templates)
- [ ] API server started on port 8000
- [ ] API health check returns `{"status":"healthy"}`
- [ ] API `/policies/templates/` returns 168 templates
- [ ] Frontend started on port 5173
- [ ] Templates page accessible at `/policies/templates`
- [ ] All 168 templates display in UI
- [ ] Category filtering works
- [ ] "More Details" modal opens and shows all tabs
- [ ] Template metadata displays correctly
- [ ] "Deploy" button navigates to policy builder
- [ ] "Customize" button opens builder with template
- [ ] No errors in browser console

---

## 🎉 You're Ready!

With all checks passing, your Control Core deployment includes:

- ✅ **168 production-ready policy templates**
- ✅ **Rich metadata** for each template
- ✅ **Intuitive navigation** with 18 categories
- ✅ **Detailed documentation** in "More Details" modal
- ✅ **Sandbox mode** by default for safe testing
- ✅ **One-click deployment** from templates
- ✅ **Full customization** in policy builder

Start securing your AI systems and protecting sensitive data today!

---

**Need Help?**

- Check: `TEMPLATES_DEPLOYMENT_COMPLETE.md`
- Quick Start: `TEMPLATE_QUICK_START.md`
- Implementation: `POLICY_TEMPLATE_IMPLEMENTATION.md`
- Deployment: `DEPLOYMENT_WITH_TEMPLATES.md`

