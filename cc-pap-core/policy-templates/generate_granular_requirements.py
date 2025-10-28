#!/usr/bin/env python3
"""
Granular Requirements Generator

Analyzes each policy's Rego code to generate specific, actionable requirements
and deployment steps based on the actual conditions used.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Set

class GranularRequirementsGenerator:
    """Generates specific requirements based on actual policy conditions"""
    
    # Comprehensive mapping of condition patterns to specific system requirements
    CONDITION_TO_SYSTEMS = {
        # User attributes
        'user.id': [
            {'system': 'Okta', 'api': 'GET /api/v1/users/{userId}', 'field': 'id', 'doc': 'https://developer.okta.com/docs/reference/api/users/'},
            {'system': 'Azure AD', 'api': 'GET /v1.0/users/{userId}', 'field': 'id', 'doc': 'https://docs.microsoft.com/graph/api/user-get'},
            {'system': 'Auth0', 'api': 'GET /api/v2/users/{userId}', 'field': 'user_id', 'doc': 'https://auth0.com/docs/api/management/v2/users'},
        ],
        'user.email': [
            {'system': 'Identity Provider (Okta/Azure AD/Auth0)', 'api': 'GET /users/{id}', 'field': 'email', 'integration': 'SAML/OIDC claims'},
            {'system': 'LDAP/Active Directory', 'api': 'LDAP query: (&(objectClass=user)(mail={email}))', 'field': 'mail'},
            {'system': 'JWT Token', 'api': 'Parse JWT token claims', 'field': 'email claim'},
        ],
        'user.role': [
            {'system': 'Okta', 'api': 'GET /api/v1/users/{userId}/roles', 'field': 'type', 'setup': 'Configure custom user attributes in Okta profile'},
            {'system': 'Azure AD', 'api': 'GET /v1.0/users/{userId}/appRoleAssignments', 'field': 'appRoleId', 'setup': 'Define app roles in Azure AD app registration'},
            {'system': 'Auth0', 'api': 'GET /api/v2/users/{userId}/roles', 'field': 'name', 'setup': 'Create roles in Auth0 dashboard'},
            {'system': 'Custom RBAC Database', 'api': 'SELECT role FROM user_roles WHERE user_id = ?', 'field': 'role', 'setup': 'Expose REST API endpoint for role lookup'},
        ],
        'user.department': [
            {'system': 'Workday HRIS', 'api': 'GET /ccx/service/customreport/...', 'field': 'department', 'integration': 'Workday REST API with OAuth 2.0'},
            {'system': 'BambooHR', 'api': 'GET /api/gateway.php/{company}/v1/employees/{id}', 'field': 'department', 'integration': 'BambooHR API key'},
            {'system': 'ADP', 'api': 'GET /hr/v2/workers/{aoid}', 'field': 'businessCommunication.department', 'integration': 'ADP API with certificate auth'},
            {'system': 'Active Directory', 'api': 'LDAP: (department=*)', 'field': 'department attribute', 'integration': 'LDAP connector'},
            {'system': 'Custom HR System', 'api': 'GET /api/employees/{id}', 'field': 'dept_code', 'integration': 'REST API with internal auth'},
        ],
        'user.clearance_level': [
            {'system': 'Security Clearance Database', 'api': 'SELECT clearance FROM security_clearances WHERE user_id = ?', 'field': 'clearance_level'},
            {'system': 'HR System (for classified environments)', 'api': 'GET /api/clearances/{userId}', 'field': 'clearance', 'compliance': 'NIST SP 800-53'},
            {'system': 'Custom Attribute in IdP', 'api': 'User profile custom attribute', 'field': 'custom:clearance_level', 'setup': 'Add custom attribute to user profile schema'},
        ],
        'user.manager': [
            {'system': 'Workday', 'api': 'GET /ccx/service/customreport/.../Employee_Manager', 'field': 'manager_id'},
            {'system': 'Active Directory', 'api': 'LDAP query: manager attribute', 'field': 'manager DN'},
            {'system': 'Azure AD', 'api': 'GET /v1.0/users/{userId}/manager', 'field': 'id', 'doc': 'Returns manager user object'},
        ],
        'user.employment_status': [
            {'system': 'Workday', 'api': 'GET /workers/{id}', 'field': 'employmentStatus'},
            {'system': 'BambooHR', 'api': 'GET /employees/{id}', 'field': 'employmentStatus'},
            {'system': 'IdP Custom Attribute', 'api': 'User profile', 'field': 'employment_type', 'values': ['FTE', 'Contractor', 'Intern']},
        ],
        
        # Resource attributes
        'resource.classification': [
            {'system': 'Data Catalog (Collibra, Alation, Apache Atlas)', 'api': 'GET /assets/{id}/classifications', 'field': 'classification_tags'},
            {'system': 'Cloud Provider Tags', 'api': 'AWS: GetResourceTags, Azure: az tag list', 'field': 'Classification tag'},
            {'system': 'Database Column Metadata', 'api': 'SELECT classification FROM data_catalog WHERE table = ? AND column = ?', 'field': 'classification'},
            {'system': 'Custom Metadata Service', 'api': 'GET /api/resources/{id}/metadata', 'field': 'data_classification'},
        ],
        'resource.owner': [
            {'system': 'ServiceNow CMDB', 'api': 'GET /api/now/table/cmdb_ci?sysparm_query=name={resourceName}', 'field': 'owned_by'},
            {'system': 'JIRA Assets', 'api': 'GET /rest/insight/1.0/object/{id}', 'field': 'Owner attribute'},
            {'system': 'AWS Resource Tags', 'api': 'ec2:DescribeTags filter Owner', 'field': 'Owner tag value'},
            {'system': 'Custom Asset Management', 'api': 'GET /api/assets/{id}', 'field': 'owner_email'},
        ],
        'resource.environment': [
            {'system': 'CI/CD System (Jenkins, GitHub Actions)', 'api': 'Environment variable or deployment metadata', 'field': 'ENVIRONMENT'},
            {'system': 'AWS Tags', 'api': 'ec2:DescribeTags', 'field': 'Environment tag', 'values': ['dev', 'staging', 'prod']},
            {'system': 'Kubernetes Labels', 'api': 'kubectl get pods -l environment=prod', 'field': 'environment label'},
        ],
        'resource.cost_center': [
            {'system': 'Financial System (NetSuite, SAP)', 'api': 'GET /cost_centers/{id}', 'field': 'cost_center_code'},
            {'system': 'AWS Cost Allocation Tags', 'api': 'ce:GetTags', 'field': 'CostCenter tag'},
            {'system': 'CMDB', 'api': 'GET /cmdb_ci/{id}', 'field': 'cost_center attribute'},
        ],
        
        # Context attributes  
        'context.time': [
            {'system': 'System Clock (NTP)', 'api': 'time.Now() in policy evaluation', 'field': 'current timestamp'},
            {'system': 'Business Hours Calendar', 'api': 'GET /api/calendar/business-hours', 'field': 'is_business_hours boolean'},
        ],
        'context.ip_address': [
            {'system': 'Request Headers', 'api': 'X-Forwarded-For or X-Real-IP header', 'field': 'client IP'},
            {'system': 'Network Logs', 'api': 'Real-time from load balancer or proxy', 'field': 'source_ip'},
        ],
        'context.location': [
            {'system': 'GeoIP Database (MaxMind)', 'api': 'Lookup IP → country/city', 'field': 'country_code, city'},
            {'system': 'VPN Detection Service', 'api': 'GET /api/ip-info/{ip}', 'field': 'is_vpn, is_proxy'},
            {'system': 'Cloud Provider Geo', 'api': 'AWS: CloudFront geolocation', 'field': 'CloudFront-Viewer-Country header'},
        ],
        'context.device_trust': [
            {'system': 'MDM Solution (Intune, Jamf)', 'api': 'GET /devices/{id}/compliance', 'field': 'complianceState'},
            {'system': 'Device Fingerprinting Service', 'api': 'Parse User-Agent + TLS fingerprint', 'field': 'device_id, is_managed'},
            {'system': 'Zero Trust Platform (Okta Verify, Duo)', 'api': 'Device posture check', 'field': 'device_health_score'},
        ],
        'context.risk_score': [
            {'system': 'User Behavior Analytics (Exabeam, Splunk UBA)', 'api': 'GET /api/risk_scores/{userId}', 'field': 'risk_score (0-100)'},
            {'system': 'SIEM (Splunk, Sentinel)', 'api': 'Query recent alerts for user', 'field': 'alert_count, severity'},
            {'system': 'Identity Threat Protection (Okta ThreatInsight)', 'api': 'Real-time threat detection', 'field': 'threat_level'},
        ],
        
        # Action attributes
        'action': [
            {'system': 'Application Code', 'api': 'Application sends action in request', 'field': 'action', 'values': ['read', 'write', 'delete', 'admin']},
            {'system': 'API Gateway', 'api': 'Map HTTP method to action', 'field': 'GET→read, POST→create, DELETE→delete'},
        ],
        
        # AI-specific attributes
        'ai_system.model_id': [
            {'system': 'MLflow Model Registry', 'api': 'GET /api/2.0/mlflow/registered-models/get', 'field': 'name, version'},
            {'system': 'SageMaker Model Registry', 'api': 'sagemaker:DescribeModel', 'field': 'ModelName'},
            {'system': 'Azure ML Model Registry', 'api': 'GET /models/{id}', 'field': 'id, version'},
        ],
        'ai_system.risk_level': [
            {'system': 'AI Governance Platform', 'api': 'GET /api/models/{id}/risk-assessment', 'field': 'risk_level'},
            {'system': 'Custom Risk Assessment DB', 'api': 'SELECT risk_level FROM ai_risk_assessments WHERE model_id = ?', 'field': 'risk_level'},
        ],
        'ai_system.validation_status': [
            {'system': 'ML Validation Pipeline', 'api': 'GET /api/models/{id}/validation', 'field': 'validation_status, last_validated'},
            {'system': 'CI/CD System', 'api': 'Get latest test results', 'field': 'test_passed boolean'},
        ],
        
        # Compliance-specific
        'gdpr_consent': [
            {'system': 'Consent Management Platform (OneTrust, TrustArc)', 'api': 'GET /api/consents/{userId}', 'field': 'consent_granted, purposes[]'},
            {'system': 'CRM (Salesforce, Dynamics)', 'api': 'GET /contacts/{id}', 'field': 'Consent__c custom field'},
        ],
        'data_retention_period': [
            {'system': 'Data Governance Tool (Collibra)', 'api': 'GET /assets/{id}/attributes', 'field': 'Retention Period attribute'},
            {'system': 'Custom Retention DB', 'api': 'SELECT retention_days FROM retention_policies WHERE data_type = ?', 'field': 'retention_days'},
        ],
    }
    
    def __init__(self, templates_dir: str):
        self.templates_dir = Path(templates_dir)
    
    def analyze_rego_conditions(self, rego_content: str) -> Dict[str, Any]:
        """Deep analysis of Rego code to extract all conditions and their requirements"""
        
        # Extract all input.* references
        input_patterns = re.findall(r'input\.([a-zA-Z_][a-zA-Z0-9_\.]*)', rego_content)
        unique_conditions = sorted(set(input_patterns))
        
        # Categorize conditions
        user_conditions = [c for c in unique_conditions if c.startswith('user.')]
        resource_conditions = [c for c in unique_conditions if c.startswith('resource.')]
        context_conditions = [c for c in unique_conditions if c.startswith('context.')]
        action_conditions = [c for c in unique_conditions if c.startswith('action')]
        ai_conditions = [c for c in unique_conditions if c.startswith('ai_') or c.startswith('model_')]
        other_conditions = [c for c in unique_conditions if c not in user_conditions + resource_conditions + context_conditions + action_conditions + ai_conditions]
        
        return {
            'all_conditions': unique_conditions,
            'user_conditions': user_conditions,
            'resource_conditions': resource_conditions,
            'context_conditions': context_conditions,
            'action_conditions': action_conditions,
            'ai_conditions': ai_conditions,
            'other_conditions': other_conditions,
            'total_count': len(unique_conditions)
        }
    
    def generate_specific_requirements(self, conditions_analysis: Dict) -> Dict[str, Any]:
        """Generate granular requirements based on actual conditions"""
        
        requirements = {
            'identity_and_access': [],
            'data_sources': [],
            'infrastructure': [],
            'compliance_tools': [],
            'monitoring_and_logging': [],
            'ai_ml_platforms': [],
        }
        
        # Process each condition to generate specific requirements
        all_conditions = conditions_analysis['all_conditions']
        
        for condition in all_conditions:
            # Find matching systems
            systems = self._find_systems_for_condition(condition)
            
            if systems:
                # Categorize the requirement
                category = self._categorize_requirement(condition)
                
                for system in systems:
                    req = {
                        'condition': f'input.{condition}',
                        'system': system['system'],
                        'api_endpoint': system.get('api', 'N/A'),
                        'field_mapping': system.get('field', 'N/A'),
                        'integration_method': system.get('integration', 'REST API'),
                        'setup_notes': system.get('setup', 'Configure in system admin'),
                        'documentation': system.get('doc', ''),
                    }
                    
                    if category and category in requirements:
                        requirements[category].append(req)
        
        # Remove empty categories
        requirements = {k: v for k, v in requirements.items() if v}
        
        return requirements
    
    def _find_systems_for_condition(self, condition: str) -> List[Dict]:
        """Find matching systems for a condition"""
        # Try exact match first
        if condition in self.CONDITION_TO_SYSTEMS:
            return self.CONDITION_TO_SYSTEMS[condition]
        
        # Try partial matches
        for pattern, systems in self.CONDITION_TO_SYSTEMS.items():
            if condition.startswith(pattern) or pattern in condition:
                return systems
        
        # Generic fallback
        return [{'system': 'Custom data source', 'api': 'REST API endpoint', 'field': condition}]
    
    def _categorize_requirement(self, condition: str) -> str:
        """Categorize requirement by condition type"""
        if condition.startswith('user.'):
            return 'identity_and_access'
        elif condition.startswith('resource.'):
            return 'data_sources'
        elif condition.startswith('context.') and any(x in condition for x in ['time', 'ip', 'location']):
            return 'infrastructure'
        elif condition.startswith('context.') and any(x in condition for x in ['risk', 'threat', 'alert']):
            return 'monitoring_and_logging'
        elif 'ai_' in condition or 'model_' in condition:
            return 'ai_ml_platforms'
        elif 'consent' in condition or 'gdpr' in condition or 'hipaa' in condition:
            return 'compliance_tools'
        else:
            return 'data_sources'
    
    def generate_deployment_steps(self, conditions_analysis: Dict, requirements: Dict, policy_name: str) -> Dict[str, List[str]]:
        """Generate specific deployment steps for this policy"""
        
        steps = {
            'prerequisites': [],
            'data_source_configuration': [],
            'policy_customization': [],
            'sandbox_testing': [],
            'production_deployment': [],
            'monitoring_setup': [],
        }
        
        # Prerequisites
        steps['prerequisites'] = [
            f"✅ Inventory all systems needed for {len(conditions_analysis['all_conditions'])} conditions in this policy",
            f"✅ Verify API access and credentials for each system",
            f"✅ Test API endpoints return expected data format",
            f"✅ Document field mappings between your systems and policy conditions",
            f"✅ Ensure network connectivity from Control Core to all data sources",
        ]
        
        # Data source configuration (specific to this policy)
        steps['data_source_configuration'] = []
        
        for category, reqs in requirements.items():
            if reqs:
                steps['data_source_configuration'].append(f"\n📦 {category.replace('_', ' ').title()}:")
                for req in reqs[:3]:  # Show top 3 per category
                    steps['data_source_configuration'].append(
                        f"   • Configure {req['system']} integration for '{req['condition']}'"
                    )
                    steps['data_source_configuration'].append(
                        f"     - API: {req['api_endpoint']}"
                    )
                    steps['data_source_configuration'].append(
                        f"     - Field: {req['field_mapping']}"
                    )
                    steps['data_source_configuration'].append(
                        f"     - Method: {req['integration_method']}"
                    )
        
        # Policy customization
        conditions_to_modify = []
        if conditions_analysis['user_conditions']:
            conditions_to_modify.append(f"User conditions ({len(conditions_analysis['user_conditions'])}): {', '.join(conditions_analysis['user_conditions'][:3])}")
        if conditions_analysis['resource_conditions']:
            conditions_to_modify.append(f"Resource conditions ({len(conditions_analysis['resource_conditions'])}): {', '.join(conditions_analysis['resource_conditions'][:3])}")
        if conditions_analysis['context_conditions']:
            conditions_to_modify.append(f"Context conditions ({len(conditions_analysis['context_conditions'])}): {', '.join(conditions_analysis['context_conditions'][:3])}")
        
        steps['policy_customization'] = [
            f"🔧 Review and customize the following conditions for your environment:",
            *[f"   • {cond}" for cond in conditions_to_modify],
            "",
            "📝 Modification guidelines:",
            "   • Update attribute names to match your system's field names",
            "   • Adjust threshold values (e.g., risk scores, time windows)",
            "   • Add/remove conditions based on your requirements",
            "   • Test each condition individually before combining",
            "",
            "💾 Save modified policy with version tag for tracking",
        ]
        
        # Sandbox testing
        test_scenarios = self._generate_test_scenarios(conditions_analysis)
        steps['sandbox_testing'] = [
            "🧪 Deploy to Sandbox environment first:",
            "   1. Create test users with various attribute combinations",
            "   2. Set up test resources with different classifications",
            "   3. Run test scenarios:",
            *[f"      • {scenario}" for scenario in test_scenarios],
            "   4. Verify audit logs capture all evaluations",
            "   5. Check performance (policy evaluation < 100ms)",
            "   6. Test error handling (missing attributes, null values)",
        ]
        
        # Production deployment
        steps['production_deployment'] = [
            "🚀 Production deployment checklist:",
            "   1. ✅ All sandbox tests passing",
            "   2. ✅ Stakeholder approval documented",
            "   3. ✅ Rollback plan prepared",
            "   4. ✅ Deploy in shadow mode (log only, don't enforce) for 24-48 hours",
            "   5. ✅ Review shadow mode logs for unexpected denials",
            "   6. ✅ Adjust policy based on real traffic patterns",
            "   7. ✅ Enable enforcement mode with gradual rollout (10% → 50% → 100%)",
            "   8. ✅ Monitor error rates and user feedback",
            "   9. ✅ Document deployment for compliance audit trail",
        ]
        
        # Monitoring
        steps['monitoring_setup'] = [
            "📊 Set up monitoring and alerts:",
            f"   • Policy evaluation count (baseline: track for 1 week)",
            f"   • Denial rate (alert if > 5% of requests)",
            f"   • Evaluation latency (alert if > 200ms p95)",
            f"   • Missing attribute errors (alert on any occurrence)",
            f"   • Condition-specific metrics:",
        ]
        
        for i, condition in enumerate(conditions_analysis['all_conditions'][:5], 1):
            steps['monitoring_setup'].append(f"     {i}. Monitor 'input.{condition}' - track null/missing values")
        
        return steps
    
    def _generate_test_scenarios(self, conditions_analysis: Dict) -> List[str]:
        """Generate specific test scenarios based on conditions"""
        scenarios = []
        
        if conditions_analysis['user_conditions']:
            scenarios.append("User with all required attributes → ALLOW")
            scenarios.append("User missing required attribute → DENY")
            scenarios.append("User with insufficient privileges → DENY")
        
        if conditions_analysis['resource_conditions']:
            scenarios.append("Resource with correct classification → ALLOW")
            scenarios.append("Resource marked as restricted → DENY for non-owners")
        
        if conditions_analysis['context_conditions']:
            if any('time' in c for c in conditions_analysis['context_conditions']):
                scenarios.append("Access during business hours → ALLOW")
                scenarios.append("Access outside business hours → DENY")
            if any('location' in c for c in conditions_analysis['context_conditions']):
                scenarios.append("Access from office IP → ALLOW")
                scenarios.append("Access from unknown location → DENY")
        
        return scenarios
    
    def enhance_metadata(self, meta_path: Path, rego_path: Path) -> bool:
        """Enhance metadata with granular requirements"""
        try:
            # Read existing metadata
            with open(meta_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # Read Rego code
            with open(rego_path, 'r', encoding='utf-8') as f:
                rego_content = f.read()
            
            # Analyze conditions
            conditions_analysis = self.analyze_rego_conditions(rego_content)
            
            # Generate specific requirements
            requirements = self.generate_specific_requirements(conditions_analysis)
            
            # Generate deployment steps
            deployment_steps = self.generate_deployment_steps(
                conditions_analysis, 
                requirements,
                rego_path.stem
            )
            
            # Update metadata
            metadata['conditions_analysis'] = {
                'total_conditions': conditions_analysis['total_count'],
                'user_attributes': len(conditions_analysis['user_conditions']),
                'resource_attributes': len(conditions_analysis['resource_conditions']),
                'context_attributes': len(conditions_analysis['context_conditions']),
            }
            
            metadata['requirements'] = {
                'detailed_requirements': requirements,
                'systems_needed': self._extract_unique_systems(requirements),
                'complexity_score': self._calculate_complexity(conditions_analysis, requirements),
            }
            
            metadata['deployment_notes'] = {
                **metadata.get('deployment_notes', {}),
                **deployment_steps,
            }
            
            # Add integration guide
            metadata['integration_guide'] = self._generate_integration_guide(requirements)
            
            # Write back
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            return True
            
        except Exception as e:
            print(f"Error enhancing {meta_path.name}: {e}")
            return False
    
    def _extract_unique_systems(self, requirements: Dict) -> List[str]:
        """Extract unique system names from requirements"""
        systems = set()
        for category, reqs in requirements.items():
            for req in reqs:
                systems.add(req['system'])
        return sorted(list(systems))
    
    def _calculate_complexity(self, conditions_analysis: Dict, requirements: Dict) -> str:
        """Calculate policy complexity score"""
        total_conditions = conditions_analysis['total_count']
        unique_systems = len(self._extract_unique_systems(requirements))
        
        if total_conditions <= 5 and unique_systems <= 2:
            return "Low - Simple policy with few conditions and data sources"
        elif total_conditions <= 15 and unique_systems <= 5:
            return "Medium - Moderate complexity requiring multiple integrations"
        else:
            return "High - Complex policy with many conditions and data sources"
    
    def _generate_integration_guide(self, requirements: Dict) -> Dict[str, Any]:
        """Generate step-by-step integration guide"""
        guide = {
            'overview': "This guide helps you integrate Control Core with your technical stack to fetch the required attributes.",
            'steps_by_system': []
        }
        
        # Group by system
        systems_map = {}
        for category, reqs in requirements.items():
            for req in reqs:
                system = req['system']
                if system not in systems_map:
                    systems_map[system] = []
                systems_map[system].append(req)
        
        # Generate steps for each system
        for system, reqs in list(systems_map.items())[:5]:  # Top 5 systems
            system_guide = {
                'system': system,
                'attributes_needed': [req['condition'] for req in reqs],
                'integration_steps': [
                    f"1. Obtain API credentials for {system}",
                    f"2. Test API access: {reqs[0]['api_endpoint']}",
                    f"3. In Control Core: Settings → Integrations → Add {system}",
                    f"4. Configure field mappings for {len(reqs)} attributes",
                    f"5. Test attribute retrieval with sample user/resource",
                    f"6. Enable caching (recommended: 5-15 minutes for user attributes)",
                ],
                'example_response': f"Example API response will contain: {', '.join([req['field_mapping'] for req in reqs[:3]])}",
            }
            guide['steps_by_system'].append(system_guide)
        
        return guide
    
    def process_all_templates(self):
        """Process all templates to add granular requirements"""
        rego_files = list(self.templates_dir.rglob('*.rego'))
        total = len(rego_files)
        
        print(f"🚀 Generating granular requirements for {total} templates...\n")
        
        enhanced = 0
        skipped = 0
        errors = 0
        
        for rego_path in rego_files:
            meta_path = rego_path.with_suffix('.meta.json')
            
            if not meta_path.exists():
                skipped += 1
                continue
            
            if self.enhance_metadata(meta_path, rego_path):
                enhanced += 1
                if enhanced % 20 == 0:
                    print(f"  Enhanced {enhanced}/{total}...")
            else:
                errors += 1
        
        print(f"\n{'='*60}")
        print(f"📊 Summary:")
        print(f"  ✅ Enhanced: {enhanced}")
        print(f"  ⏭️  Skipped: {skipped}")
        print(f"  ❌ Errors: {errors}")
        print(f"  📁 Total: {total}")
        print(f"{'='*60}\n")

def main():
    script_dir = Path(__file__).parent
    generator = GranularRequirementsGenerator(script_dir)
    generator.process_all_templates()
    print("✨ Granular requirements generation complete!")

if __name__ == '__main__':
    main()

