#!/usr/bin/env python3
"""
Enhanced Metadata Generator - Improves existing metadata with better use cases and conditions

This script enhances existing .meta.json files with:
- More specific, auditor-friendly use cases with real-world business context
- Better condition explanations with clear data source suggestions
- Compliance and business impact details
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any

class MetadataEnhancer:
    """Enhances existing metadata with richer, more specific content"""
    
    def __init__(self, templates_dir: str):
        self.templates_dir = Path(templates_dir)
    
    def enhance_use_cases_for_category(self, name: str, category: str, existing_use_cases: List) -> List[Dict[str, str]]:
        """Generate enhanced, auditor-friendly use cases"""
        
        category_lower = category.lower()
        name_lower = name.lower()
        
        # Keep 1-2 existing if good, add 4-5 new specific ones
        enhanced_cases = []
        
        if 'ai' in category_lower or 'ai' in name_lower:
            enhanced_cases = self._create_ai_specific_use_cases(name, category)
        elif 'compliance' in category_lower or 'gdpr' in name_lower or 'hipaa' in name_lower or 'ccpa' in name_lower:
            enhanced_cases = self._create_compliance_specific_use_cases(name, category)
        elif 'security' in category_lower or 'auth' in name_lower or 'access' in name_lower:
            enhanced_cases = self._create_security_specific_use_cases(name, category)
        elif 'data' in category_lower or 'mask' in name_lower or 'encrypt' in name_lower:
            enhanced_cases = self._create_data_governance_use_cases(name, category)
        else:
            enhanced_cases = self._create_generic_specific_use_cases(name, category)
        
        return enhanced_cases[:6]  # Max 6 use cases
    
    def _create_ai_specific_use_cases(self, name: str, category: str) -> List[Dict[str, str]]:
        """Create AI-specific use cases with business context"""
        return [
            {
                "title": "Financial Services: AI-Powered Fraud Detection System",
                "description": f"Deploy {name} for a production fraud detection AI model",
                "scenario": "Global Bank deploys an AI fraud detection model processing 10M daily transactions. Auditor requirement: demonstrate model approval process, training data governance, and bias testing before production deployment. Policy enforces: (1) Risk assessment by Chief AI Officer, (2) Validation by independent team showing <2% false positive rate, (3) Monthly bias audits on protected classes, (4) Automated rollback if accuracy drops below 95%. Compliance: Federal Reserve SR 11-7 (Model Risk Management)."
            },
            {
                "title": "Healthcare: Clinical Decision Support AI with HIPAA Requirements",
                "description": f"Apply {name} to protect patient data in AI diagnostic systems",
                "scenario": "Hospital network implements AI radiology assistant analyzing 5,000 X-rays daily. Auditor verification needed: (1) All 47 radiologists have signed AI use agreements, (2) System logs every AI recommendation with radiologist override capability, (3) PHI access restricted to treating physicians only, (4) AI outputs reviewed by second physician for high-stakes diagnoses. Policy blocks: AI access outside treating relationship, automated AI decisions without physician review. HIPAA audit trail maintained for 6 years."
            },
            {
                "title": "Retail: Customer Service AI with PII Protection",
                "description": f"Implement {name} for AI chatbot handling customer data",
                "scenario": "E-commerce platform's AI chatbot handles 50,000 daily customer interactions across EU and California. Compliance requirement: Demonstrate GDPR Article 22 (right to object to automated decisions) and CCPA compliance. Policy enforces: (1) Customer PII (SSN, payment details) masked in AI training data, (2) Chatbot unable to make purchase decisions >$500 without human, (3) EU customers can request human agent immediately, (4) All AI interactions logged with 'automated decision' flag. Reduced compliance violations from 12/month to zero."
            },
            {
                "title": "Insurance: Automated Underwriting with Fairness Requirements",
                "description": f"Use {name} to ensure fair AI-driven insurance decisions",
                "scenario": "Insurance carrier uses AI to evaluate 15,000 policy applications monthly. State regulator audit focuses on: (1) Proving AI doesn't discriminate on race, gender (protected classes), (2) Demonstrating explainability for all denials, (3) Human review for borderline cases. Policy requires: Bias testing quarterly across 50+ demographic segments, explainability scores >0.7, senior underwriter review when AI confidence <85%. Result: Zero discrimination findings in regulatory exam, 23% faster application processing."
            },
            {
                "title": "Manufacturing: Predictive Maintenance AI with Safety Controls",
                "description": f"Deploy {name} for safety-critical industrial AI systems",
                "scenario": "Auto manufacturer uses AI to predict equipment failures affecting 1,200 assembly robots. Safety audit requirements: (1) Prove AI trained only on verified sensor data, (2) Human override always available, (3) False negatives (missed failures) tracked and investigated, (4) AI recommendations reviewed by maintenance engineers before critical shutdowns. Policy enforces: 2-person approval for shutdowns affecting >50 workers, AI confidence thresholds before automated actions, incident tracking for all prediction failures."
            },
            {
                "title": "Government: AI in Public Services with Transparency Requirements",
                "description": f"Apply {name} for government AI systems requiring public accountability",
                "scenario": "City government deploys AI for permit application processing (5,000/month). Public accountability requirements: (1) AI decision criteria published publicly, (2) Citizens can request human review within 5 business days, (3) Bias audits by independent third party annually, (4) Algorithmic Impact Assessment published. Policy ensures: All denials include explanation in plain language, applicant notification of AI use, appeals tracked with resolution times, bias metrics published quarterly."
            }
        ]
    
    def _create_compliance_specific_use_cases(self, name: str, category: str) -> List[Dict[str, str]]:
        """Create compliance-specific use cases with audit context"""
        return [
            {
                "title": "SOC 2 Type II Audit: Access Control Evidence",
                "description": f"Use {name} to demonstrate continuous access control monitoring",
                "scenario": "SaaS company preparing for SOC 2 Type II audit needs to prove access controls for 500 employees across 40 systems. Auditor testing: (1) Sample 25 users - verify each has only required access, (2) Review access changes for 90-day period - ensure approvals documented, (3) Test separation of duties - developers can't approve own code to production. Policy enforcement: Role-based access auto-assigned based on job title in HRIS, access reviews every 90 days with manager approval, audit log captures all access changes with justification. Result: Zero access control findings, 4 days instead of 3 weeks for evidence collection."
            },
            {
                "title": "GDPR Article 30: Records of Processing Activities (ROPA)",
                "description": f"Implement {name} to automate GDPR documentation requirements",
                "scenario": "Multinational corporation with 12 EU subsidiaries must maintain ROPA for 200+ processing activities. Data Protection Officer needs to prove: (1) Legal basis documented for each processing activity, (2) Data retention periods enforced automatically, (3) Cross-border data transfers tracked with appropriate safeguards, (4) DPIAs completed for high-risk processing. Policy automates: Tagging each data access with processing purpose, blocking access after retention period expires, flagging transfers outside EU, requiring DPIA approval before accessing sensitive categories. Regulatory inspection: Zero findings, ROPA automatically generated."
            },
            {
                "title": "HIPAA Minimum Necessary Rule: Clinical Data Access",
                "description": f"Deploy {name} to enforce HIPAA minimum necessary standard",
                "scenario": "Hospital system with 5,000 employees accessing EHR for 100,000 patients. OCR audit focus: (1) Billing staff don't access clinical notes, (2) Emergency department can access only current encounter data, (3) Research team access requires IRB approval and PHI de-identification, (4) Employees can't access own or family member records. Policy enforces: Role-based filtering (billing sees only CPT codes, not diagnoses), automatic de-identification for research, break-glass for emergencies with mandatory review, blocking family member access with compliance notification. OCR inspection result: Substantial compliance, praised for technical safeguards."
            },
            {
                "title": "PCI DSS Requirement 7: Restrict Access to Cardholder Data",
                "description": f"Apply {name} for PCI DSS cardholder data protection",
                "scenario": "Payment processor handling 2M transactions daily must prove need-to-know access to PAN. QSA (Qualified Security Assessor) testing: (1) Sample 20 employees - verify business justification for cardholder data access, (2) Review access logs - ensure no unauthorized queries, (3) Test cardholder data masking for non-authorized users, (4) Verify least privilege principle. Policy implements: Full PAN visible only to fraud investigation team (5 people), first 6/last 4 digits for customer service (200 people), no access for developers (50 people) even in production, all full PAN access logged with case number required. PCI audit: Zero findings on Requirement 7."
            },
            {
                "title": "CCPA Consumer Rights: Data Access and Deletion Requests",
                "description": f"Use {name} to handle CCPA consumer rights requests",
                "scenario": "Online retailer with 5M California customers must respond to 500 monthly CCPA requests within 45 days. Attorney General compliance review: (1) Demonstrate all consumer data identified within 45 days, (2) Prove data deletion across all systems including backups, (3) Show opt-out preference honored in marketing systems, (4) Verify no discriminatory pricing for opt-out customers. Policy automates: Data discovery across 15 systems using PII tagging, deletion workflow with compliance team approval, opt-out flag synchronized to CRM/marketing platforms within 24 hours, audit trail for each request. Result: 100% requests completed within 40 days, zero consumer complaints."
            },
            {
                "title": "ISO 27001 Access Control: Demonstrating Policy Enforcement",
                "description": f"Implement {name} for ISO 27001 certification evidence",
                "scenario": "Technology company pursuing ISO 27001 certification must prove access control policy implementation. Certification auditor reviews: (1) Access control policy documented and approved by management, (2) Technical controls implement the documented policy, (3) Access reviews conducted quarterly with documented findings, (4) Privileged access tightly controlled with MFA. Policy provides: Automated enforcement of password complexity (12+ chars, complexity), MFA required for admin access, role-based access aligned to HR job codes, quarterly access reviews with auto-generated reports for managers, privileged access requires business justification in ticketing system. Certification achieved: Zero non-conformities on access control clause."
            }
        ]
    
    def _create_security_specific_use_cases(self, name: str, category: str) -> List[Dict[str, str]]:
        """Create security-specific use cases with threat context"""
        return [
            {
                "title": "Zero Trust Implementation: Contractor Access to Production",
                "description": f"Deploy {name} as part of zero trust architecture for external access",
                "scenario": "Financial services firm with 200 external contractors needs zero trust controls for production access. Security team requirements: (1) Contractors never have standing access - must request each time, (2) Access limited to specific IP ranges and time windows, (3) All contractor actions logged and reviewed, (4) Sensitive data masked for contractors. Policy enforces: Time-bound access (max 4 hours), geofencing (only from contractor office IPs), session recording for all production access, automatic data masking for PII/financial data, manager approval required with business justification. Result: Prevented 3 potential data exfiltration attempts, reduced contractor access from permanent to just-in-time."
            },
            {
                "title": "Insider Threat Prevention: Privileged User Monitoring",
                "description": f"Use {name} to detect and prevent insider threats",
                "scenario": "Tech company with 50 database administrators having access to customer data (10M records). Security operations needs: (1) Detect unusual database queries (volume, timing, content), (2) Prevent bulk data downloads, (3) Alert on access to sensitive tables outside business hours, (4) Block access to personal connections. Policy implementation: Baseline normal behavior per DBA (avg 500 queries/day), alert on >2,000 queries or >100MB downloads in 1 hour, block queries with >10,000 rows after hours, require SOC approval for production access on weekends, automatic temporary suspension on 3 suspicious activities. Detection: Identified compromised DBA account downloading customer list, prevented $2M data breach."
            },
            {
                "title": "API Security: Third-Party Integration Rate Limiting",
                "description": f"Apply {name} to protect APIs from abuse and attacks",
                "scenario": "E-commerce platform with 500 third-party integrations via APIs, handling 100K API calls/minute. Security requirements: (1) Prevent credential stuffing attacks, (2) Stop data scraping bots, (3) Enforce fair use policies, (4) Protect against DDoS. Policy enforces: Rate limits by partner tier (Tier 1: 1000 req/min, Tier 2: 100 req/min), adaptive throttling during attacks, block suspicious patterns (same User-Agent with 1000+ IPs), circuit breaker after 3 authentication failures, cost attribution for over-limit partners. Results: Blocked 50M bot requests/month, prevented 2 DDoS attempts, reduced API abuse from 12% to <1% of traffic."
            },
            {
                "title": "Incident Response: Automated Containment During Breach",
                "description": f"Leverage {name} for rapid incident containment",
                "scenario": "Healthcare provider detects ransomware on file server at 2 AM. Incident response plan requires: (1) Isolate affected systems within 15 minutes, (2) Prevent lateral movement, (3) Preserve forensic evidence, (4) Maintain audit trail of all actions. Policy enables: Automated isolation of compromised server (disable all network ACLs), block user account associated with initial compromise, alert on any authentication attempts from that account, log all command execution on affected systems, notify CISO and IR team via SMS/email. Containment achieved in 8 minutes, ransomware limited to 1 server instead of spreading to 200+ systems, total damage: $50K vs estimated $5M."
            },
            {
                "title": "Cloud Security: Multi-Cloud Access Control",
                "description": f"Implement {name} across AWS, Azure, and GCP environments",
                "scenario": "Global enterprise with resources in AWS (500 accounts), Azure (200 subscriptions), and GCP (100 projects). CISO requirements: (1) Consistent access policies across all clouds, (2) Prevent public S3 buckets, (3) Enforce MFA for all cloud console access, (4) Track privileged access across clouds. Policy implementation: Centralized policy management integrated with AWS IAM, Azure RBAC, GCP IAM, automated scanning for public storage (S3/Blob/GCS) with auto-remediation, MFA required for console access (enforced via SAML), cross-cloud access reports for audit. Results: Eliminated 150 public buckets, standardized access across clouds, reduced IAM policy inconsistencies from 40% to 5%."
            }
        ]
    
    def _create_data_governance_use_cases(self, name: str, category: str) -> List[Dict[str, str]]:
        """Create data governance use cases with business context"""
        return [
            {
                "title": "Data Lake Security: Research Access to Sensitive Data",
                "description": f"Use {name} to control access to enterprise data lake",
                "scenario": "Pharmaceutical company with data lake containing clinical trial data (5PB, 1000+ datasets). Chief Data Officer requirements: (1) Data scientists access only relevant datasets, (2) PII automatically masked for non-clinical staff, (3) Competitive intelligence data restricted to senior leadership, (4) Data lineage tracked for regulatory submissions. Policy enforces: Dataset-level access based on project assignment in JIRA, automatic PII detection and masking using ML, executive-only access to acquisition target data, audit log every data access with project code. FDA audit: Demonstrated complete data governance, zero findings on data integrity."
            },
            {
                "title": "Customer 360: GDPR Right to Erasure Across Data Silos",
                "description": f"Deploy {name} to handle data deletion requests across systems",
                "scenario": "Telecom provider with customer data in 25+ systems (CRM, billing, network logs, support tickets). GDPR officer challenge: Locate and delete all personal data within 30 days. Policy implementation: PII tagged with customer ID across all systems, automated discovery workflow queries all 25 systems, deletion orchestrator coordinates removal across databases, retention policy exceptions (e.g., legal holds) flagged, verification report generated for customer. Metrics: Average deletion time reduced from 45 days (manual) to 7 days (automated), data accuracy 99.8%, zero regulatory complaints."
            },
            {
                "title": "Financial Reporting: Sox Compliance for Data Changes",
                "description": f"Apply {name} to ensure Sox-compliant financial data handling",
                "scenario": "Public company must prove financial data integrity for Sox 404 audit. External auditors test: (1) Unauthorized users can't modify financial data, (2) All changes logged with business justification, (3) Segregation of duties (preparer ≠ approver), (4) Changes outside close period blocked. Policy enforces: Read-only access to GL for all except Finance team (5 people), all GL changes require CFO approval via workflow, period close locks all entries (no backdating), audit trail captures changed values, approver, timestamp, reason code. External audit: Zero material weaknesses, praised for automated controls, audit time reduced 40%."
            },
            {
                "title": "Data Classification: Auto-Classification for Regulatory Compliance",
                "description": f"Implement {name} for automatic data sensitivity labeling",
                "scenario": "Insurance company with 50TB of documents must classify by sensitivity (Public, Internal, Confidential, Restricted). General Counsel requirement: Prove appropriate handling based on classification. Policy automates: ML-based classification scanning documents for PII, PHI, payment data, executive communications; auto-tagging with sensitivity label; encryption enforcement for Confidential/Restricted; access controls based on labels; DLP policies preventing external sharing of Restricted data. Results: Classified 10M documents in 90 days (vs 18 months manual estimate), prevented 50 inadvertent Restricted data shares, passed privacy audit."
            },
            {
                "title": "Data Retention: Automated Lifecycle Management",
                "description": f"Use {name} to enforce data retention and deletion policies",
                "scenario": "Healthcare provider must balance retention requirements (6 years for medical records) with storage costs and privacy. COO goals: (1) Comply with retention laws, (2) Delete data when no longer needed, (3) Reduce storage costs, (4) Support litigation holds. Policy implements: Automatic tagging with retention class at data creation, countdown timer to deletion date, litigation hold flag stops deletion, archive to cold storage after 3 years, permanent deletion after 6 years with compliance approval, audit trail for all deletions. Results: Reduced storage costs $500K/year, demonstrated compliance with 50+ state retention laws, zero sanctions for spoliation."
            }
        ]
    
    def _create_generic_specific_use_cases(self, name: str, category: str) -> List[Dict[str, str]]:
        """Create generic but specific use cases"""
        return [
            {
                "title": "Enterprise SaaS: Customer-Facing Application Access Control",
                "description": f"Deploy {name} for multi-tenant SaaS application",
                "scenario": "B2B SaaS platform with 5,000 business customers (50K end users) requires strict data isolation. Customer auditor testing: (1) Users from Company A cannot access Company B data under any circumstance, (2) Customer admins manage only their org users, (3) Super admin access logged and monitored, (4) Data export limited to customer's own data. Policy enforces: Tenant ID required on every database query, cross-tenant queries blocked at API level, admin actions require MFA + approval, automated testing of tenant isolation with 1000 test scenarios daily. Security: Zero cross-tenant data leaks in 3 years, SOC 2 compliant."
            },
            {
                "title": "Manufacturing: Supply Chain System Access Control",
                "description": f"Implement {name} for supply chain partner access",
                "scenario": "Automotive manufacturer shares production data with 200 suppliers via portal. Operations requirements: (1) Suppliers see only their components' data, (2) Competitors never see each other's pricing/volumes, (3) Access revoked immediately when contract ends, (4) No data download of competitor info. Policy implementation: Supplier-specific data filtering based on component assignment, IP-restricted access from supplier offices only, automatic access termination on contract end date in ERP, DLP blocks download of competitive data, session timeout after 15 minutes. Results: Protected proprietary data, zero data leaks, supplier satisfaction score improved (relevant data only)."
            },
            {
                "title": "Government Agency: Classified Information Access",
                "description": f"Apply {name} for government classification levels",
                "scenario": "Federal agency with Unclassified, Confidential, Secret, Top Secret data must prove need-to-know controls. Security officer audit: (1) Users access only cleared classification level, (2) Access granted only for assigned projects, (3) All Secret/Top Secret access reviewed by security officer, (4) Anomalous access patterns detected. Policy enforces: Clearance level from HR system required, project assignment from PMO tool required, two-person rule for Top Secret, behavioral analytics detect unusual access (time, volume, content), automatic alerts to security officer. Result: Passed DoD security inspection, zero insider threat incidents."
            }
        ]
    
    def enhance_condition_explanations(self, conditions: List[Dict]) -> List[Dict]:
        """Enhance conditions with better data source suggestions"""
        enhanced = []
        
        for condition in conditions:
            cond = condition.copy()
            
            # Enhance description
            if 'name' in cond:
                parts = cond['name'].split('.')
                cond['plain_english'] = self._create_plain_english_explanation(cond['name'], parts)
            
            # Enhance data sources with specific examples
            if 'data_sources' in cond:
                cond['data_sources'] = self._enhance_data_sources(cond['name'], cond['data_sources'])
            
            # Add fetch instructions
            cond['how_to_fetch'] = self._create_fetch_instructions(cond['name'])
            
            # Add example values
            cond['example_values'] = self._create_example_values(cond['name'], cond.get('type'))
            
            enhanced.append(cond)
        
        return enhanced
    
    def _create_plain_english_explanation(self, full_path: str, parts: List[str]) -> str:
        """Create auditor-friendly explanation"""
        explanations = {
            'user.role': "The job role or function of the person making the request (e.g., 'Manager', 'Analyst', 'Admin'). Used to enforce role-based access controls ensuring users only access data appropriate for their job function.",
            'user.department': "The organizational department the user belongs to (e.g., 'Finance', 'HR', 'IT'). Ensures users only access their department's data, supporting segregation of duties.",
            'user.clearance_level': "The security clearance or authorization level of the user (e.g., 'Public', 'Confidential', 'Secret'). Matches user clearance to data classification to prevent unauthorized access to sensitive information.",
            'resource.classification': "The sensitivity level of the data or resource (e.g., 'Public', 'Internal', 'Confidential', 'Restricted'). Automatically labeled by data classification system and enforced by access controls.",
            'resource.owner': "The individual or department who owns and is responsible for the resource. Used to enforce ownership-based access and approval workflows.",
            'context.time': "The time of day or day of week when the access request is made. Enables time-based restrictions (e.g., business hours only, no weekend access to financial systems).",
            'context.location': "The physical or network location of the user (e.g., office IP range, country, VPN vs direct). Enforces location-based policies such as geo-fencing or office-only access to sensitive data.",
            'context.device_trust': "The security posture of the device making the request (e.g., corporate-managed, compliant with security policies, up-to-date patches). Blocks access from unmanaged or compromised devices.",
        }
        
        return explanations.get(full_path, f"Runtime evaluation of '{full_path}' to make access control decisions based on current request context.")
    
    def _enhance_data_sources(self, condition_name: str, existing_sources: List[str]) -> List[Dict[str, str]]:
        """Provide specific data source examples with integration details"""
        enhanced_sources = []
        
        for source in existing_sources[:3]:  # Keep top 3 existing
            enhanced_sources.append({
                'name': source,
                'integration_method': self._get_integration_method(source),
                'example_api': self._get_example_api(source)
            })
        
        return enhanced_sources
    
    def _get_integration_method(self, source: str) -> str:
        """Describe how to integrate with the data source"""
        methods = {
            'Identity Provider': "SAML or OIDC integration - Control Core retrieves user attributes from IdP token claims during authentication",
            'Active Directory': "LDAP query - Control Core queries AD for user groups, department, manager attributes in real-time",
            'HRIS System': "REST API - Control Core calls HR API to fetch job title, department, employment status for policy evaluation",
            'Database': "Direct SQL query - Control Core connects to application database to check resource ownership, classification tags",
            'Cloud Provider APIs': "Cloud API calls - Control Core uses AWS IAM, Azure Graph, or GCP APIs to fetch resource metadata and permissions",
        }
        
        for key, value in methods.items():
            if key.lower() in source.lower():
                return value
        
        return "API integration - Control Core fetches this attribute via REST API call during policy evaluation"
    
    def _get_example_api(self, source: str) -> str:
        """Provide example API or configuration"""
        examples = {
            'Okta': "GET /api/v1/users/{userId} returns {profile: {role: 'Manager', department: 'Finance'}}",
            'Azure AD': "GET /v1.0/users/{userId} returns {jobTitle: 'Senior Analyst', department: 'IT'}",
            'AWS': "iam:GetUser returns user tags for role, department, clearance_level",
            'Salesforce': "REST API: /services/data/v52.0/sobjects/User/{userId} returns Profile, Role, Department",
        }
        
        for key, value in examples.items():
            if key.lower() in source.lower():
                return value
        
        return "Example: GET /api/attributes/{attributeName}?userId={userId}"
    
    def _create_fetch_instructions(self, condition_name: str) -> str:
        """Step-by-step instructions for fetching the attribute"""
        return f"""Configure Control Core to fetch '{condition_name}':
1. In Control Core Admin UI, go to Settings > Attribute Sources
2. Click 'Add Attribute Source' and select your identity/data provider
3. Map '{condition_name}' to the corresponding field in your source system
4. Configure refresh interval (e.g., cache for 5 minutes, fetch on each request for sensitive data)
5. Test the mapping with sample users to verify correct values are retrieved
6. Enable the attribute for use in policies"""
    
    def _create_example_values(self, condition_name: str, cond_type: str) -> List[str]:
        """Provide example values for the condition"""
        examples = {
            'user.role': ['Manager', 'Senior Analyst', 'Junior Developer', 'Executive', 'Contractor'],
            'user.department': ['Finance', 'Human Resources', 'Information Technology', 'Sales', 'Operations'],
            'user.clearance_level': ['Public', 'Internal', 'Confidential', 'Secret', 'Top Secret'],
            'resource.classification': ['Public', 'Internal Use', 'Confidential', 'Restricted', 'Highly Confidential'],
            'context.time': ['Monday 9:00 AM', 'Friday 11:59 PM', 'Business Hours (9-5)', 'After Hours'],
            'context.location': ['Office IP: 192.168.1.0/24', 'Home (VPN)', 'Coffee Shop (Public WiFi)', 'USA', 'EU'],
        }
        
        for key, values in examples.items():
            if key in condition_name:
                return values
        
        return ['value1', 'value2', 'value3'] if cond_type == 'string' else []
    
    def enhance_metadata_file(self, meta_path: Path) -> bool:
        """Enhance a single metadata file"""
        try:
            # Read existing metadata
            with open(meta_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # Get template name and category
            template_name = meta_path.stem
            category = str(meta_path.parent.name)
            
            # Enhance use cases
            existing_use_cases = metadata.get('use_cases', [])
            metadata['use_cases'] = self.enhance_use_cases_for_category(
                template_name, category, existing_use_cases
            )
            
            # Enhance conditions
            existing_conditions = metadata.get('conditions', [])
            if existing_conditions:
                metadata['conditions'] = self.enhance_condition_explanations(existing_conditions)
            
            # Write back
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error enhancing {meta_path.name}: {e}")
            return False
    
    def enhance_all_metadata(self):
        """Enhance all metadata files"""
        meta_files = list(self.templates_dir.rglob('*.meta.json'))
        total = len(meta_files)
        
        print(f"🚀 Enhancing {total} metadata files...\n")
        
        enhanced = 0
        errors = 0
        
        for meta_path in meta_files:
            if self.enhance_metadata_file(meta_path):
                enhanced += 1
                if enhanced % 20 == 0:
                    print(f"  Enhanced {enhanced}/{total}...")
            else:
                errors += 1
        
        print(f"\n{'='*60}")
        print(f"📊 Summary:")
        print(f"  ✅ Enhanced: {enhanced}")
        print(f"  ❌ Errors: {errors}")
        print(f"  📁 Total: {total}")
        print(f"{'='*60}\n")

def main():
    script_dir = Path(__file__).parent
    enhancer = MetadataEnhancer(script_dir)
    enhancer.enhance_all_metadata()
    print("✨ Enhancement complete!")

if __name__ == '__main__':
    main()

