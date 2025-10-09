# Policy Template Library - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Load Templates into Database

```bash
# Navigate to the PAP API directory
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-pap-api

# Run the template loader
python3 load_policy_templates.py
```

**Expected Output:**
```
============================================================
  Control Core - Policy Template Loader
  Enhanced with Rich Metadata Support
============================================================

📁 Processing category: NIST AI RMF (nist-ai-rmf)
  + Adding: Ai Risk Assessment Classification
  + Adding: Ai Bias Detection Mitigation
  + Adding: Ai Model Monitoring Drift Detection
  ...

✅ Successfully processed policy templates!
📊 New templates loaded: 165
📊 Total templates in database: 165
============================================================
```

### Step 2: Access Templates in UI

1. Start the PAP frontend:
   ```bash
   cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-pap
   npm run dev
   ```

2. Open browser: `http://localhost:5173`

3. Navigate to: **Policies → Templates** (or `/policies/templates`)

### Step 3: Browse and Deploy

1. **Browse Categories**: Filter by category (NIST AI RMF, Canadian AIDA, Compliance, etc.)

2. **View Details**: Click "More Details" on any template to see:
   - Detailed description
   - Use cases with scenarios
   - Conditions and parameters
   - Deployment guidance
   - Full Rego code

3. **Deploy Template**:
   - Click "Deploy" to deploy to sandbox mode (default)
   - Or click "Customize" to modify in the policy builder
   - Template automatically loads with all metadata

## 📊 Template Categories

| Category | Count | Description |
|----------|-------|-------------|
| NIST AI RMF | 8 | AI Risk Management Framework |
| Canadian AIDA | 5 | AI and Data Act compliance |
| Canadian AI Governance | 5 | Canadian AI directives |
| AI Security | 12 | RAG, LLM, Agent security |
| Privacy & Compliance | 35 | GDPR, HIPAA, PIPEDA, PHIPA, CCPA, SOC2 |
| Data Governance | 20 | Masking, Classification, Retention |
| Security Controls | 20 | Zero Trust, MFA, RBAC, API |
| JIT Access | 10 | Temporary & emergency access |
| Industry Frameworks | 10 | PCI-DSS, ISO 27001, NIST CSF |
| Cloud Security | 5 | Multi-cloud protection |
| Open Banking | 5 | Financial security |
| **Total** | **165** | **Production-ready templates** |

## 🎯 Common Use Cases

### AI Model Deployment
```
1. Browse: NIST AI RMF category
2. Select: "AI Risk Assessment Classification"
3. View Details: See risk scoring and approval workflows
4. Deploy: Automatically goes to sandbox mode
5. Test: Validate with sample AI system assessments
6. Promote: Move to production after validation
```

### Healthcare Compliance
```
1. Browse: Privacy & Compliance category
2. Select: "HIPAA Healthcare Privacy" or "PHIPA Ontario Health"
3. View Details: See PHI protection requirements
4. Deploy: Test with sandbox data
5. Configure: Adjust for your healthcare setting
6. Activate: Enable for production PHI
```

### Financial Data Protection
```
1. Browse: Privacy & Compliance or Open Banking
2. Select: "PCI-DSS Cardholder Data" or "FINTRAC AML"
3. View Details: See financial security controls
4. Deploy: Test with mock financial data
5. Integrate: Connect to payment systems
6. Monitor: Track compliance metrics
```

### RAG System Security
```
1. Browse: AI Security category
2. Select: "RAG Data Protection - PII"
3. View Details: See PII filtering and access controls
4. Deploy: Test with sample RAG queries
5. Configure: Adjust for your vector database
6. Enable: Protect production RAG system
```

## 🔍 Template Details

Each template provides:

### Overview Tab
- Detailed description
- Compliance frameworks
- Requirements (prerequisites, integrations, data sources)

### Use Cases Tab
- Multiple real-world scenarios
- Specific use case descriptions
- Example applications

### Conditions Tab
- All policy conditions
- Parameter types and requirements
- Value ranges and options

### Deployment Tab
- Step-by-step setup instructions
- Configuration tips
- Testing scenarios

### Code Tab
- Full production-ready Rego code
- Well-commented and structured
- Ready for customization

## ⚡ Pro Tips

### 1. Start with Smart Suggestions
The system suggests templates based on:
- Resource type (AI model, healthcare data, financial data)
- Industry (healthcare, financial, government)
- Use case (AI deployment, data protection, privileged access)

### 2. Use Sandbox Mode
All templates deploy to sandbox by default:
- Safe testing environment
- No production impact
- Modify without risk
- Gradual rollout

### 3. Customize as Needed
Templates are starting points:
- Use visual builder or code editor
- Adjust conditions for your environment
- Add custom requirements
- Integrate with your systems

### 4. Combine Templates
Build comprehensive policies:
- Layer multiple templates
- Create policy sets
- Combine AI security + compliance
- Stack data governance + access control

### 5. Learn from Examples
Templates are educational:
- Study Rego code patterns
- Understand policy structures
- See best practices
- Build your own policies

## 🐛 Troubleshooting

### Templates Not Showing in UI

1. **Check database**:
   ```sql
   SELECT COUNT(*) FROM policy_templates;
   ```

2. **Re-run loader**:
   ```bash
   python3 load_policy_templates.py
   ```

3. **Check API endpoint**:
   ```bash
   curl http://localhost:8000/policies/templates/
   ```

### Template Details Not Displaying

1. **Verify metadata loaded**:
   ```sql
   SELECT metadata FROM policy_templates LIMIT 1;
   ```

2. **Check .meta.json files exist**:
   ```bash
   ls cc-pap-core/policy-templates/nist-ai-rmf/*.meta.json
   ```

3. **Re-run loader with verbose output**

### Policy Builder Not Loading Template

1. **Check URL parameters**:
   - Verify `template`, `templateData`, `environment` params

2. **Check browser console** for errors

3. **Verify template_content** is populated in database

## 📚 Additional Resources

- **Full Documentation**: See `POLICY_TEMPLATE_IMPLEMENTATION.md`
- **Template Structure**: Check existing `.rego` and `.meta.json` files
- **API Documentation**: `cc-pap-api/README.md`
- **Frontend Guide**: `cc-pap/README.md`

## ✅ Verification Checklist

- [ ] Template loader runs without errors
- [ ] 165 templates loaded into database
- [ ] Templates page displays in UI
- [ ] Category filtering works
- [ ] "More Details" modal opens and shows all tabs
- [ ] "Deploy" button navigates to policy builder
- [ ] Template loads in sandbox mode by default
- [ ] Template content and metadata are displayed
- [ ] Can customize template in builder
- [ ] Can view Rego code in template details

## 🎉 You're Ready!

You now have access to 165 production-ready policy templates covering:
- ✅ AI Security & Governance (NIST AI RMF, Canadian AIDA)
- ✅ Privacy & Compliance (GDPR, HIPAA, PIPEDA, PHIPA, CCPA)
- ✅ Data Governance (Masking, Classification, Retention)
- ✅ Security Controls (Zero Trust, MFA, RBAC, API)
- ✅ Just-in-Time Access
- ✅ Industry Frameworks (PCI-DSS, ISO 27001, NIST CSF)
- ✅ Cloud & Open Banking Security

Start securing your AI systems, protecting sensitive data, and ensuring compliance today!

---

**Need Help?** Check the full implementation guide or contact support.

