"""
AI Policy Service for Control Core
Handles AI-powered policy intelligence features including code scanning, 
policy suggestions, conflict detection, and compliance mapping
"""

import os
import logging
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import aiohttp
import asyncio
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class PolicyIntelligenceFeature(str, Enum):
    CODE_SCANNING = "code_scanning"
    OPENAPI_ANALYSIS = "openapi_analysis"
    COMPLIANCE_MAPPING = "compliance_mapping"
    NATURAL_LANGUAGE = "natural_language"
    CONFLICT_DETECTION = "conflict_detection"
    SECURITY_RECOMMENDATIONS = "security_recommendations"

class ComplianceFramework(str, Enum):
    SOC2 = "soc2"
    HIPAA = "hipaa"
    GDPR = "gdpr"
    PCI_DSS = "pci_dss"
    ISO27001 = "iso27001"
    NIST = "nist"

@dataclass
class PolicySuggestion:
    id: str
    title: str
    description: str
    rego_code: str
    confidence_score: float
    source: str  # code_scanning, openapi_analysis, etc.
    compliance_frameworks: List[str]
    security_impact: str  # high, medium, low
    implementation_effort: str  # high, medium, low

@dataclass
class PolicyConflict:
    policy_id_1: str
    policy_id_2: str
    conflict_type: str  # overlap, contradiction, redundancy
    description: str
    severity: str  # high, medium, low
    suggested_resolution: str

@dataclass
class ComplianceMapping:
    policy_id: str
    framework: str
    requirement_id: str
    requirement_description: str
    compliance_score: float
    gaps: List[str]
    recommendations: List[str]

class AIPolicyService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.azure_openai_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.azure_openai_key = os.getenv("AZURE_OPENAI_KEY")
        
        # Cost tracking
        self.daily_cost_limit = float(os.getenv("AI_DAILY_COST_LIMIT", "50"))
        self.monthly_cost_limit = float(os.getenv("AI_MONTHLY_COST_LIMIT", "1000"))
        self.per_request_limit = float(os.getenv("AI_PER_REQUEST_LIMIT", "0.05"))
        
        # Feature costs (per request in USD)
        self.feature_costs = {
            PolicyIntelligenceFeature.CODE_SCANNING: 0.01,
            PolicyIntelligenceFeature.OPENAPI_ANALYSIS: 0.005,
            PolicyIntelligenceFeature.COMPLIANCE_MAPPING: 0.02,
            PolicyIntelligenceFeature.NATURAL_LANGUAGE: 0.015,
            PolicyIntelligenceFeature.CONFLICT_DETECTION: 0.008,
            PolicyIntelligenceFeature.SECURITY_RECOMMENDATIONS: 0.012
        }
    
    async def scan_code_repository(self, repository_url: str, branch: str = "main") -> List[PolicySuggestion]:
        """Scan code repository for API endpoints and security patterns to suggest policies"""
        try:
            # This would integrate with GitHub/GitLab API to scan the repository
            # For now, we'll simulate the scanning process
            
            logger.info(f"Scanning repository {repository_url} for policy suggestions")
            
            # Simulate API endpoint discovery
            api_endpoints = await self._discover_api_endpoints(repository_url, branch)
            
            # Generate policy suggestions based on discovered endpoints
            suggestions = []
            for endpoint in api_endpoints:
                suggestion = await self._generate_policy_for_endpoint(endpoint)
                if suggestion:
                    suggestions.append(suggestion)
            
            logger.info(f"Generated {len(suggestions)} policy suggestions from code scan")
            return suggestions
            
        except Exception as e:
            logger.error(f"Failed to scan code repository: {e}")
            raise
    
    async def analyze_openapi_spec(self, openapi_spec: Dict[str, Any]) -> List[PolicySuggestion]:
        """Analyze OpenAPI specification to generate targeted policies"""
        try:
            logger.info("Analyzing OpenAPI specification for policy suggestions")
            
            suggestions = []
            
            # Analyze paths and operations
            paths = openapi_spec.get("paths", {})
            for path, path_item in paths.items():
                for method, operation in path_item.items():
                    if method in ["get", "post", "put", "delete", "patch"]:
                        suggestion = await self._generate_policy_for_operation(path, method, operation)
                        if suggestion:
                            suggestions.append(suggestion)
            
            # Analyze security schemes
            security_schemes = openapi_spec.get("components", {}).get("securitySchemes", {})
            for scheme_name, scheme in security_schemes.items():
                suggestion = await self._generate_security_policy(scheme_name, scheme)
                if suggestion:
                    suggestions.append(suggestion)
            
            logger.info(f"Generated {len(suggestions)} policy suggestions from OpenAPI analysis")
            return suggestions
            
        except Exception as e:
            logger.error(f"Failed to analyze OpenAPI spec: {e}")
            raise
    
    async def map_to_compliance_frameworks(self, policies: List[Dict[str, Any]], 
                                         frameworks: List[ComplianceFramework]) -> List[ComplianceMapping]:
        """Map policies to compliance frameworks"""
        try:
            logger.info(f"Mapping {len(policies)} policies to {len(frameworks)} compliance frameworks")
            
            mappings = []
            
            for policy in policies:
                for framework in frameworks:
                    mapping = await self._map_policy_to_framework(policy, framework)
                    if mapping:
                        mappings.append(mapping)
            
            logger.info(f"Generated {len(mappings)} compliance mappings")
            return mappings
            
        except Exception as e:
            logger.error(f"Failed to map policies to compliance frameworks: {e}")
            raise
    
    async def generate_policy_from_natural_language(self, description: str, 
                                                  context: Dict[str, Any] = None) -> PolicySuggestion:
        """Convert natural language description to Rego policy"""
        try:
            logger.info(f"Generating policy from natural language: {description[:100]}...")
            
            # Prepare prompt for LLM
            prompt = self._build_natural_language_prompt(description, context)
            
            # Call LLM
            response = await self._call_llm(prompt, PolicyIntelligenceFeature.NATURAL_LANGUAGE)
            
            # Parse response and create policy suggestion
            suggestion = self._parse_natural_language_response(response, description)
            
            logger.info("Successfully generated policy from natural language")
            return suggestion
            
        except Exception as e:
            logger.error(f"Failed to generate policy from natural language: {e}")
            raise
    
    async def detect_policy_conflicts(self, policies: List[Dict[str, Any]]) -> List[PolicyConflict]:
        """Detect conflicts and overlaps between policies"""
        try:
            logger.info(f"Detecting conflicts in {len(policies)} policies")
            
            conflicts = []
            
            # Compare each policy with every other policy
            for i, policy1 in enumerate(policies):
                for j, policy2 in enumerate(policies[i+1:], i+1):
                    conflict = await self._analyze_policy_conflict(policy1, policy2)
                    if conflict:
                        conflicts.append(conflict)
            
            logger.info(f"Detected {len(conflicts)} policy conflicts")
            return conflicts
            
        except Exception as e:
            logger.error(f"Failed to detect policy conflicts: {e}")
            raise
    
    async def generate_security_recommendations(self, policies: List[Dict[str, Any]], 
                                              resources: List[Dict[str, Any]]) -> List[PolicySuggestion]:
        """Generate security policy recommendations based on best practices"""
        try:
            logger.info("Generating security policy recommendations")
            
            recommendations = []
            
            # Analyze current policies for security gaps
            security_gaps = await self._identify_security_gaps(policies, resources)
            
            # Generate recommendations for each gap
            for gap in security_gaps:
                recommendation = await self._generate_security_recommendation(gap)
                if recommendation:
                    recommendations.append(recommendation)
            
            logger.info(f"Generated {len(recommendations)} security recommendations")
            return recommendations
            
        except Exception as e:
            logger.error(f"Failed to generate security recommendations: {e}")
            raise
    
    async def _discover_api_endpoints(self, repository_url: str, branch: str) -> List[Dict[str, Any]]:
        """Discover API endpoints from repository code"""
        # This would integrate with GitHub/GitLab API to scan code
        # For now, return mock data
        return [
            {
                "path": "/api/users",
                "method": "GET",
                "description": "Get list of users",
                "security_requirements": ["authentication", "authorization"],
                "sensitive_data": ["user_info"]
            },
            {
                "path": "/api/users/{id}",
                "method": "GET",
                "description": "Get user by ID",
                "security_requirements": ["authentication", "authorization", "data_isolation"],
                "sensitive_data": ["user_info", "personal_data"]
            },
            {
                "path": "/api/admin/settings",
                "method": "POST",
                "description": "Update admin settings",
                "security_requirements": ["authentication", "admin_authorization", "audit_logging"],
                "sensitive_data": ["system_config"]
            }
        ]
    
    async def _generate_policy_for_endpoint(self, endpoint: Dict[str, Any]) -> Optional[PolicySuggestion]:
        """Generate policy suggestion for an API endpoint"""
        try:
            # Build prompt for LLM
            prompt = f"""
            Generate a Rego policy for the following API endpoint:
            
            Path: {endpoint['path']}
            Method: {endpoint['method']}
            Description: {endpoint['description']}
            Security Requirements: {', '.join(endpoint['security_requirements'])}
            Sensitive Data: {', '.join(endpoint['sensitive_data'])}
            
            Generate a comprehensive Rego policy that:
            1. Enforces authentication
            2. Implements proper authorization
            3. Protects sensitive data
            4. Includes audit logging
            5. Follows security best practices
            
            Return the policy in JSON format with:
            - title: Policy title
            - description: Policy description
            - rego_code: Complete Rego policy code
            - confidence_score: Confidence level (0-1)
            - security_impact: high/medium/low
            - implementation_effort: high/medium/low
            """
            
            response = await self._call_llm(prompt, PolicyIntelligenceFeature.CODE_SCANNING)
            
            # Parse response
            policy_data = json.loads(response)
            
            return PolicySuggestion(
                id=f"code_scan_{endpoint['path'].replace('/', '_')}_{endpoint['method']}",
                title=policy_data.get("title", f"Policy for {endpoint['path']}"),
                description=policy_data.get("description", ""),
                rego_code=policy_data.get("rego_code", ""),
                confidence_score=policy_data.get("confidence_score", 0.8),
                source="code_scanning",
                compliance_frameworks=[],
                security_impact=policy_data.get("security_impact", "medium"),
                implementation_effort=policy_data.get("implementation_effort", "medium")
            )
            
        except Exception as e:
            logger.error(f"Failed to generate policy for endpoint: {e}")
            return None
    
    async def _generate_policy_for_operation(self, path: str, method: str, operation: Dict[str, Any]) -> Optional[PolicySuggestion]:
        """Generate policy suggestion for OpenAPI operation"""
        try:
            # Extract operation details
            summary = operation.get("summary", "")
            description = operation.get("description", "")
            security = operation.get("security", [])
            parameters = operation.get("parameters", [])
            responses = operation.get("responses", {})
            
            # Build prompt for LLM
            prompt = f"""
            Generate a Rego policy for the following OpenAPI operation:
            
            Path: {path}
            Method: {method.upper()}
            Summary: {summary}
            Description: {description}
            Security: {json.dumps(security)}
            Parameters: {len(parameters)} parameters
            Responses: {list(responses.keys())}
            
            Generate a comprehensive Rego policy that:
            1. Enforces proper authentication and authorization
            2. Validates input parameters
            3. Controls access based on user roles and permissions
            4. Implements rate limiting if needed
            5. Includes audit logging
            
            Return the policy in JSON format with:
            - title: Policy title
            - description: Policy description
            - rego_code: Complete Rego policy code
            - confidence_score: Confidence level (0-1)
            - security_impact: high/medium/low
            - implementation_effort: high/medium/low
            """
            
            response = await self._call_llm(prompt, PolicyIntelligenceFeature.OPENAPI_ANALYSIS)
            
            # Parse response
            policy_data = json.loads(response)
            
            return PolicySuggestion(
                id=f"openapi_{path.replace('/', '_')}_{method}",
                title=policy_data.get("title", f"Policy for {path} {method.upper()}"),
                description=policy_data.get("description", ""),
                rego_code=policy_data.get("rego_code", ""),
                confidence_score=policy_data.get("confidence_score", 0.8),
                source="openapi_analysis",
                compliance_frameworks=[],
                security_impact=policy_data.get("security_impact", "medium"),
                implementation_effort=policy_data.get("implementation_effort", "medium")
            )
            
        except Exception as e:
            logger.error(f"Failed to generate policy for operation: {e}")
            return None
    
    async def _generate_security_policy(self, scheme_name: str, scheme: Dict[str, Any]) -> Optional[PolicySuggestion]:
        """Generate security policy for OpenAPI security scheme"""
        try:
            scheme_type = scheme.get("type", "")
            scheme_description = scheme.get("description", "")
            
            # Build prompt for LLM
            prompt = f"""
            Generate a Rego policy for the following OpenAPI security scheme:
            
            Scheme Name: {scheme_name}
            Type: {scheme_type}
            Description: {scheme_description}
            Full Scheme: {json.dumps(scheme, indent=2)}
            
            Generate a Rego policy that:
            1. Validates the security scheme
            2. Enforces proper authentication
            3. Implements authorization checks
            4. Handles security scheme-specific requirements
            
            Return the policy in JSON format with:
            - title: Policy title
            - description: Policy description
            - rego_code: Complete Rego policy code
            - confidence_score: Confidence level (0-1)
            - security_impact: high/medium/low
            - implementation_effort: high/medium/low
            """
            
            response = await self._call_llm(prompt, PolicyIntelligenceFeature.OPENAPI_ANALYSIS)
            
            # Parse response
            policy_data = json.loads(response)
            
            return PolicySuggestion(
                id=f"security_{scheme_name}",
                title=policy_data.get("title", f"Security Policy for {scheme_name}"),
                description=policy_data.get("description", ""),
                rego_code=policy_data.get("rego_code", ""),
                confidence_score=policy_data.get("confidence_score", 0.8),
                source="openapi_analysis",
                compliance_frameworks=[],
                security_impact=policy_data.get("security_impact", "high"),
                implementation_effort=policy_data.get("implementation_effort", "medium")
            )
            
        except Exception as e:
            logger.error(f"Failed to generate security policy: {e}")
            return None
    
    async def _map_policy_to_framework(self, policy: Dict[str, Any], framework: ComplianceFramework) -> Optional[ComplianceMapping]:
        """Map a policy to a specific compliance framework"""
        try:
            # Build prompt for LLM
            prompt = f"""
            Map the following policy to {framework.value.upper()} compliance framework:
            
            Policy ID: {policy.get('id', 'unknown')}
            Policy Title: {policy.get('title', 'unknown')}
            Policy Description: {policy.get('description', 'unknown')}
            Policy Code: {policy.get('rego_code', '')[:500]}...
            
            Analyze how this policy maps to {framework.value.upper()} requirements and identify:
            1. Which specific requirements it addresses
            2. Compliance score (0-1)
            3. Any gaps in compliance
            4. Recommendations for improvement
            
            Return the analysis in JSON format with:
            - requirement_id: Specific requirement ID
            - requirement_description: Description of the requirement
            - compliance_score: Score from 0-1
            - gaps: List of compliance gaps
            - recommendations: List of improvement recommendations
            """
            
            response = await self._call_llm(prompt, PolicyIntelligenceFeature.COMPLIANCE_MAPPING)
            
            # Parse response
            mapping_data = json.loads(response)
            
            return ComplianceMapping(
                policy_id=policy.get('id', 'unknown'),
                framework=framework.value,
                requirement_id=mapping_data.get("requirement_id", ""),
                requirement_description=mapping_data.get("requirement_description", ""),
                compliance_score=mapping_data.get("compliance_score", 0.5),
                gaps=mapping_data.get("gaps", []),
                recommendations=mapping_data.get("recommendations", [])
            )
            
        except Exception as e:
            logger.error(f"Failed to map policy to framework: {e}")
            return None
    
    async def _analyze_policy_conflict(self, policy1: Dict[str, Any], policy2: Dict[str, Any]) -> Optional[PolicyConflict]:
        """Analyze potential conflict between two policies"""
        try:
            # Build prompt for LLM
            prompt = f"""
            Analyze potential conflicts between these two policies:
            
            Policy 1:
            ID: {policy1.get('id', 'unknown')}
            Title: {policy1.get('title', 'unknown')}
            Description: {policy1.get('description', 'unknown')}
            Code: {policy1.get('rego_code', '')[:300]}...
            
            Policy 2:
            ID: {policy2.get('id', 'unknown')}
            Title: {policy2.get('title', 'unknown')}
            Description: {policy2.get('description', 'unknown')}
            Code: {policy2.get('rego_code', '')[:300]}...
            
            Analyze for:
            1. Overlapping rules or conditions
            2. Contradictory logic
            3. Redundant policies
            4. Potential conflicts in enforcement
            
            Return the analysis in JSON format with:
            - conflict_type: overlap/contradiction/redundancy
            - description: Detailed description of the conflict
            - severity: high/medium/low
            - suggested_resolution: How to resolve the conflict
            """
            
            response = await self._call_llm(prompt, PolicyIntelligenceFeature.CONFLICT_DETECTION)
            
            # Parse response
            conflict_data = json.loads(response)
            
            return PolicyConflict(
                policy_id_1=policy1.get('id', 'unknown'),
                policy_id_2=policy2.get('id', 'unknown'),
                conflict_type=conflict_data.get("conflict_type", "overlap"),
                description=conflict_data.get("description", ""),
                severity=conflict_data.get("severity", "medium"),
                suggested_resolution=conflict_data.get("suggested_resolution", "")
            )
            
        except Exception as e:
            logger.error(f"Failed to analyze policy conflict: {e}")
            return None
    
    async def _identify_security_gaps(self, policies: List[Dict[str, Any]], resources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify security gaps in current policy coverage"""
        try:
            # Build prompt for LLM
            prompt = f"""
            Analyze the following policies and resources to identify security gaps:
            
            Policies ({len(policies)}):
            {json.dumps([{"id": p.get("id"), "title": p.get("title"), "description": p.get("description")} for p in policies], indent=2)}
            
            Resources ({len(resources)}):
            {json.dumps([{"id": r.get("id"), "name": r.get("name"), "type": r.get("type")} for r in resources], indent=2)}
            
            Identify security gaps such as:
            1. Unprotected resources
            2. Missing authentication requirements
            3. Insufficient authorization checks
            4. Lack of audit logging
            5. Missing rate limiting
            6. Inadequate data protection
            
            Return the analysis in JSON format with a list of gaps, each containing:
            - gap_type: Type of security gap
            - description: Detailed description
            - affected_resources: List of affected resource IDs
            - severity: high/medium/low
            - recommendation: Suggested policy to address the gap
            """
            
            response = await self._call_llm(prompt, PolicyIntelligenceFeature.SECURITY_RECOMMENDATIONS)
            
            # Parse response
            gaps_data = json.loads(response)
            return gaps_data.get("gaps", [])
            
        except Exception as e:
            logger.error(f"Failed to identify security gaps: {e}")
            return []
    
    async def _generate_security_recommendation(self, gap: Dict[str, Any]) -> Optional[PolicySuggestion]:
        """Generate security policy recommendation for a specific gap"""
        try:
            # Build prompt for LLM
            prompt = f"""
            Generate a security policy recommendation to address this gap:
            
            Gap Type: {gap.get('gap_type', 'unknown')}
            Description: {gap.get('description', 'unknown')}
            Affected Resources: {gap.get('affected_resources', [])}
            Severity: {gap.get('severity', 'medium')}
            Recommendation: {gap.get('recommendation', 'unknown')}
            
            Generate a comprehensive Rego policy that addresses this security gap.
            
            Return the policy in JSON format with:
            - title: Policy title
            - description: Policy description
            - rego_code: Complete Rego policy code
            - confidence_score: Confidence level (0-1)
            - security_impact: high/medium/low
            - implementation_effort: high/medium/low
            """
            
            response = await self._call_llm(prompt, PolicyIntelligenceFeature.SECURITY_RECOMMENDATIONS)
            
            # Parse response
            policy_data = json.loads(response)
            
            return PolicySuggestion(
                id=f"security_rec_{gap.get('gap_type', 'unknown').replace(' ', '_')}",
                title=policy_data.get("title", f"Security Policy for {gap.get('gap_type', 'unknown')}"),
                description=policy_data.get("description", ""),
                rego_code=policy_data.get("rego_code", ""),
                confidence_score=policy_data.get("confidence_score", 0.8),
                source="security_recommendations",
                compliance_frameworks=[],
                security_impact=policy_data.get("security_impact", gap.get("severity", "medium")),
                implementation_effort=policy_data.get("implementation_effort", "medium")
            )
            
        except Exception as e:
            logger.error(f"Failed to generate security recommendation: {e}")
            return None
    
    def _build_natural_language_prompt(self, description: str, context: Dict[str, Any] = None) -> str:
        """Build prompt for natural language to policy conversion"""
        prompt = f"""
        Convert the following natural language description into a Rego policy:
        
        Description: {description}
        
        Context: {json.dumps(context, indent=2) if context else "No additional context provided"}
        
        Generate a comprehensive Rego policy that:
        1. Implements the described authorization logic
        2. Follows Rego best practices
        3. Includes proper error handling
        4. Is well-documented with comments
        5. Is production-ready
        
        Return the policy in JSON format with:
        - title: Policy title
        - description: Policy description
        - rego_code: Complete Rego policy code
        - confidence_score: Confidence level (0-1)
        - security_impact: high/medium/low
        - implementation_effort: high/medium/low
        """
        return prompt
    
    def _parse_natural_language_response(self, response: str, original_description: str) -> PolicySuggestion:
        """Parse LLM response for natural language to policy conversion"""
        try:
            policy_data = json.loads(response)
            
            return PolicySuggestion(
                id=f"nl_policy_{hash(original_description) % 10000}",
                title=policy_data.get("title", "Generated Policy"),
                description=policy_data.get("description", original_description),
                rego_code=policy_data.get("rego_code", ""),
                confidence_score=policy_data.get("confidence_score", 0.7),
                source="natural_language",
                compliance_frameworks=[],
                security_impact=policy_data.get("security_impact", "medium"),
                implementation_effort=policy_data.get("implementation_effort", "medium")
            )
            
        except Exception as e:
            logger.error(f"Failed to parse natural language response: {e}")
            # Return a basic policy suggestion
            return PolicySuggestion(
                id=f"nl_policy_{hash(original_description) % 10000}",
                title="Generated Policy",
                description=original_description,
                rego_code="# Policy generated from natural language description\n# Please review and customize as needed",
                confidence_score=0.5,
                source="natural_language",
                compliance_frameworks=[],
                security_impact="medium",
                implementation_effort="medium"
            )
    
    async def _call_llm(self, prompt: str, feature: PolicyIntelligenceFeature) -> str:
        """Call LLM with the given prompt and feature context"""
        try:
            # Check cost limits
            cost = self.feature_costs.get(feature, 0.01)
            if cost > self.per_request_limit:
                raise Exception(f"Request cost ${cost} exceeds per-request limit ${self.per_request_limit}")
            
            # Choose LLM provider based on configuration
            if self.openai_api_key:
                return await self._call_openai(prompt, feature)
            elif self.anthropic_api_key:
                return await self._call_anthropic(prompt, feature)
            elif self.azure_openai_endpoint and self.azure_openai_key:
                return await self._call_azure_openai(prompt, feature)
            else:
                raise Exception("No LLM provider configured")
                
        except Exception as e:
            logger.error(f"Failed to call LLM: {e}")
            raise
    
    async def _call_openai(self, prompt: str, feature: PolicyIntelligenceFeature) -> str:
        """Call OpenAI API"""
        try:
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "gpt-4",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert in Rego policy language and authorization systems. Generate comprehensive, production-ready Rego policies."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 2000,
                "temperature": 0.1
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result["choices"][0]["message"]["content"]
                    else:
                        raise Exception(f"OpenAI API error: {response.status}")
                        
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise
    
    async def _call_anthropic(self, prompt: str, feature: PolicyIntelligenceFeature) -> str:
        """Call Anthropic API"""
        try:
            headers = {
                "x-api-key": self.anthropic_api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            data = {
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 2000,
                "temperature": 0.1,
                "messages": [
                    {
                        "role": "user",
                        "content": f"You are an expert in Rego policy language and authorization systems. Generate comprehensive, production-ready Rego policies.\n\n{prompt}"
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result["content"][0]["text"]
                    else:
                        raise Exception(f"Anthropic API error: {response.status}")
                        
        except Exception as e:
            logger.error(f"Anthropic API call failed: {e}")
            raise
    
    async def _call_azure_openai(self, prompt: str, feature: PolicyIntelligenceFeature) -> str:
        """Call Azure OpenAI API"""
        try:
            headers = {
                "api-key": self.azure_openai_key,
                "Content-Type": "application/json"
            }
            
            data = {
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert in Rego policy language and authorization systems. Generate comprehensive, production-ready Rego policies."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 2000,
                "temperature": 0.1
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.azure_openai_endpoint}/openai/deployments/gpt-4/chat/completions?api-version=2023-12-01-preview",
                    headers=headers,
                    json=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result["choices"][0]["message"]["content"]
                    else:
                        raise Exception(f"Azure OpenAI API error: {response.status}")
                        
        except Exception as e:
            logger.error(f"Azure OpenAI API call failed: {e}")
            raise
