#!/usr/bin/env python3
"""
Comprehensive Policy Template Metadata Generator

This script generates comprehensive educational metadata for all policy templates
including detailed descriptions, use cases, conditions explanations, and deployment guides.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any

class PolicyMetadataGenerator:
    """Generates comprehensive metadata for policy templates"""
    
    # Category-specific compliance frameworks
    COMPLIANCE_FRAMEWORKS = {
        'ai-security': ['NIST AI RMF', 'ISO/IEC 42001', 'EU AI Act', 'SOC 2 Type II'],
        'ai-governance': ['NIST AI RMF', 'ISO/IEC 23894', 'IEEE 7000', 'SOC 2 Type II'],
        'nist-ai-rmf': ['NIST AI RMF', 'NIST AI 100-1', 'ISO/IEC 23894', 'SOC 2 Type II'],
        'canadian-ai-governance': ['Canadian Directive on Automated Decision-Making', 'PIPEDA', 'AIDA'],
        'canadian-aida': ['AIDA (Artificial Intelligence and Data Act)', 'PIPEDA', 'Canadian Privacy Act'],
        'compliance': ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'CCPA'],
        'data-governance': ['GDPR', 'CCPA', 'PIPEDA', 'ISO 27001', 'SOC 2'],
        'security-controls': ['NIST CSF', 'ISO 27001', 'CIS Controls', 'SOC 2 Type II'],
        'cloud-security': ['NIST CSF', 'ISO 27017', 'CSA CCM', 'FedRAMP'],
        'jit-access': ['NIST SP 800-53', 'ISO 27001', 'CIS Controls', 'SOC 2'],
        'industry-frameworks': ['NIST CSF', 'ISO 27001', 'PCI DSS', 'FedRAMP'],
        'open-banking': ['PSD2', 'Open Banking Standard', 'ISO 27001', 'FAPI'],
    }
    
    # Risk level mapping based on category and keywords
    RISK_LEVEL_KEYWORDS = {
        'critical': ['critical', 'high-impact', 'sensitive', 'financial', 'healthcare', 'pii', 'biometric'],
        'high': ['security', 'authentication', 'authorization', 'encryption', 'audit', 'compliance'],
        'medium': ['access', 'monitoring', 'logging', 'validation', 'control'],
        'low': ['reporting', 'notification', 'documentation']
    }
    
    def __init__(self, templates_dir: str):
        self.templates_dir = Path(templates_dir)
        
    def parse_rego_file(self, rego_path: Path) -> Dict[str, Any]:
        """Parse a Rego file to extract policy logic and conditions"""
        with open(rego_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract package name
        package_match = re.search(r'package\s+([\w.]+)', content)
        package = package_match.group(1) if package_match else ""
        
        # Extract comments for description
        comment_lines = re.findall(r'#\s*(.+)', content)
        
        # Extract conditions from rules
        conditions = []
        # Look for input.* references
        input_refs = set(re.findall(r'input\.([\w.]+)', content))
        for ref in sorted(input_refs):
            conditions.append(ref)
        
        # Extract functions
        functions = re.findall(r'(\w+)\s*:?=?\s*if\s*{', content)
        
        # Extract rules
        rules = re.findall(r'(allow|deny)\s+(?:if|:=)\s*{', content)
        
        return {
            'package': package,
            'comments': comment_lines,
            'conditions': conditions,
            'functions': functions,
            'rules': rules,
            'content': content
        }
    
    def determine_risk_level(self, name: str, category: str, content: str) -> str:
        """Determine risk level based on template characteristics"""
        name_lower = name.lower()
        content_lower = content.lower()
        
        for level, keywords in self.RISK_LEVEL_KEYWORDS.items():
            for keyword in keywords:
                if keyword in name_lower or keyword in content_lower:
                    return level
        
        return 'medium'  # Default
    
    def generate_use_cases(self, name: str, category: str, parsed: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate 3-5 realistic use cases for the policy"""
        use_cases = []
        
        # Determine category-specific use cases
        category_clean = category.split('/')[-1]
        
        # Generate use cases based on category and policy name
        if 'ai' in category_clean.lower() or 'ai' in name.lower():
            use_cases.extend(self._generate_ai_use_cases(name, parsed))
        elif 'compliance' in category_clean.lower():
            use_cases.extend(self._generate_compliance_use_cases(name, parsed))
        elif 'security' in category_clean.lower() or 'security' in name.lower():
            use_cases.extend(self._generate_security_use_cases(name, parsed))
        elif 'data' in category_clean.lower() or 'data' in name.lower():
            use_cases.extend(self._generate_data_use_cases(name, parsed))
        elif 'jit' in category_clean.lower() or 'access' in name.lower():
            use_cases.extend(self._generate_access_use_cases(name, parsed))
        else:
            use_cases.extend(self._generate_generic_use_cases(name, parsed))
        
        # Ensure we have 3-5 use cases
        return use_cases[:5] if len(use_cases) >= 5 else use_cases + self._generate_additional_use_cases(name, len(use_cases))
    
    def _generate_ai_use_cases(self, name: str, parsed: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate AI-specific use cases"""
        return [
            {
                "title": "Enterprise AI Model Deployment",
                "description": f"Apply {name} when deploying AI/ML models to production environments",
                "scenario": "A financial services company deploying an AI model for fraud detection needs to ensure proper authorization, audit logging, and compliance with regulatory requirements before production deployment."
            },
            {
                "title": "Multi-Tenant AI Platform",
                "description": f"Enforce {name} across multiple tenants using shared AI infrastructure",
                "scenario": "A SaaS provider offering AI services to multiple enterprise customers needs to ensure data isolation, access control, and tenant-specific policy enforcement."
            },
            {
                "title": "AI-Powered Customer Service",
                "description": f"Protect customer interactions with {name}",
                "scenario": "An e-commerce platform using AI chatbots for customer support needs to protect PII, prevent prompt injection attacks, and ensure appropriate response filtering."
            },
            {
                "title": "Healthcare AI Decision Support",
                "description": f"Apply {name} to AI systems handling sensitive medical data",
                "scenario": "A healthcare provider deploying AI diagnostic assistance tools needs to ensure HIPAA compliance, proper authorization, and audit trails for all AI-assisted decisions."
            },
            {
                "title": "AI Model Governance and Compliance",
                "description": f"Implement {name} for AI governance programs",
                "scenario": "An organization establishing AI governance needs to track AI model deployments, ensure compliance with AI regulations, and maintain audit trails for regulatory reporting."
            }
        ]
    
    def _generate_compliance_use_cases(self, name: str, parsed: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate compliance-specific use cases"""
        return [
            {
                "title": "Regulatory Audit Preparation",
                "description": f"Use {name} to demonstrate compliance during regulatory audits",
                "scenario": "During a compliance audit, the organization needs to prove that access controls and data handling procedures meet regulatory requirements with complete audit trails."
            },
            {
                "title": "Data Privacy Compliance",
                "description": f"Enforce {name} to meet data protection regulations",
                "scenario": "A multinational company needs to ensure consistent data privacy controls across regions while complying with GDPR, CCPA, and other regional privacy laws."
            },
            {
                "title": "Industry-Specific Compliance",
                "description": f"Apply {name} for sector-specific regulatory requirements",
                "scenario": "A healthcare organization must comply with HIPAA requirements while a financial institution needs to meet PCI DSS standards - both using the same policy framework."
            },
            {
                "title": "Third-Party Vendor Compliance",
                "description": f"Extend {name} to third-party systems and vendors",
                "scenario": "When integrating with third-party vendors, the organization needs to ensure they meet the same compliance standards through policy-based access controls."
            },
            {
                "title": "Continuous Compliance Monitoring",
                "description": f"Implement {name} for real-time compliance validation",
                "scenario": "The compliance team needs real-time visibility into policy violations and automatic enforcement to maintain continuous compliance posture."
            }
        ]
    
    def _generate_security_use_cases(self, name: str, parsed: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate security-specific use cases"""
        return [
            {
                "title": "Zero Trust Security Implementation",
                "description": f"Deploy {name} as part of zero trust architecture",
                "scenario": "An organization transitioning to zero trust needs to verify every access request, enforce least privilege, and implement continuous authentication."
            },
            {
                "title": "Insider Threat Prevention",
                "description": f"Use {name} to detect and prevent insider threats",
                "scenario": "Security teams need to monitor and control privileged user access, detect anomalous behavior, and prevent unauthorized data exfiltration."
            },
            {
                "title": "API Security Gateway",
                "description": f"Apply {name} at the API gateway level",
                "scenario": "Protecting microservices architecture by enforcing authentication, rate limiting, and authorization at the API gateway for all service-to-service communication."
            },
            {
                "title": "Incident Response and Containment",
                "description": f"Leverage {name} during security incidents",
                "scenario": "When a security incident is detected, quickly modify policies to contain the threat, revoke compromised credentials, and prevent lateral movement."
            },
            {
                "title": "Cloud Security Posture Management",
                "description": f"Enforce {name} across cloud environments",
                "scenario": "Managing security policies consistently across multi-cloud environments including AWS, Azure, and GCP while maintaining compliance and preventing misconfigurations."
            }
        ]
    
    def _generate_data_use_cases(self, name: str, parsed: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate data governance use cases"""
        return [
            {
                "title": "Sensitive Data Protection",
                "description": f"Apply {name} to protect sensitive and confidential data",
                "scenario": "A financial institution needs to protect customer financial data, PII, and transaction records with dynamic data masking and access controls based on user roles and context."
            },
            {
                "title": "Data Lake Access Control",
                "description": f"Implement {name} for data lake and warehouse access",
                "scenario": "Data analysts need access to enterprise data lakes, but access must be controlled based on data classification, user clearance, and purpose of use."
            },
            {
                "title": "Cross-Border Data Transfer",
                "description": f"Use {name} to control international data flows",
                "scenario": "A global organization needs to control data transfers across borders, ensuring compliance with data sovereignty requirements and regional regulations."
            },
            {
                "title": "Data Lifecycle Management",
                "description": f"Enforce {name} throughout the data lifecycle",
                "scenario": "From data creation to deletion, enforce appropriate access controls, retention policies, and compliance requirements at each lifecycle stage."
            },
            {
                "title": "Business Intelligence and Analytics",
                "description": f"Apply {name} for BI tool access control",
                "scenario": "Business users need self-service analytics access, but policies must ensure they only access data appropriate for their role and business unit."
            }
        ]
    
    def _generate_access_use_cases(self, name: str, parsed: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate access control use cases"""
        return [
            {
                "title": "Privileged Access Management",
                "description": f"Implement {name} for privileged account access",
                "scenario": "Database administrators need temporary elevated access to production systems, but access must be time-limited, approved, and fully audited."
            },
            {
                "title": "Emergency Break-Glass Access",
                "description": f"Use {name} for emergency access scenarios",
                "scenario": "During a critical outage, on-call engineers need immediate access to production systems with full audit logging and automatic revocation after the incident."
            },
            {
                "title": "Contractor and Temporary Worker Access",
                "description": f"Apply {name} for non-employee access management",
                "scenario": "External contractors need temporary access to specific resources for project work, with automatic expiration and minimal privilege assignment."
            },
            {
                "title": "Cross-Functional Team Collaboration",
                "description": f"Enable {name} for dynamic team-based access",
                "scenario": "Project teams need temporary access to resources across organizational boundaries, with automatic provisioning and de-provisioning as team membership changes."
            },
            {
                "title": "Role-Based Access Automation",
                "description": f"Automate access provisioning with {name}",
                "scenario": "When employees change roles or departments, automatically adjust their access permissions to match new responsibilities while revoking previous access."
            }
        ]
    
    def _generate_generic_use_cases(self, name: str, parsed: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate generic use cases"""
        return [
            {
                "title": "Enterprise Policy Enforcement",
                "description": f"Deploy {name} across the organization",
                "scenario": f"Implement {name} to enforce consistent access controls and compliance requirements across all business units and applications."
            },
            {
                "title": "Microservices Authorization",
                "description": f"Apply {name} in microservices architecture",
                "scenario": "Enforce fine-grained authorization between microservices, ensuring each service-to-service call is properly authenticated and authorized."
            },
            {
                "title": "Multi-Environment Deployment",
                "description": f"Use {name} across development, staging, and production",
                "scenario": "Maintain consistent policy enforcement across all environments while allowing appropriate access levels for developers, testers, and operations teams."
            }
        ]
    
    def _generate_additional_use_cases(self, name: str, count: int) -> List[Dict[str, str]]:
        """Generate additional generic use cases to reach minimum of 3"""
        additional = []
        templates = [
            {
                "title": "API Gateway Integration",
                "description": f"Integrate {name} with API gateway",
                "scenario": "Deploy policy enforcement at the API gateway level to protect backend services and enforce consistent authorization across all API endpoints."
            },
            {
                "title": "Third-Party Integration Security",
                "description": f"Apply {name} to third-party integrations",
                "scenario": "Control access to third-party services and APIs, ensuring only authorized applications and users can interact with external systems."
            },
            {
                "title": "Mobile and IoT Device Access",
                "description": f"Extend {name} to mobile and IoT devices",
                "scenario": "Enforce access controls for mobile applications and IoT devices, considering device trust, location, and security posture in authorization decisions."
            },
        ]
        
        needed = max(0, 3 - count)
        return templates[:needed]
    
    def generate_conditions_explanation(self, conditions: List[str], parsed: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate plain English explanations for policy conditions"""
        condition_explanations = []
        
        for condition in conditions:
            # Parse the condition path
            parts = condition.split('.')
            
            explanation = self._explain_condition(condition, parts, parsed['content'])
            condition_explanations.append(explanation)
        
        return condition_explanations
    
    def _explain_condition(self, full_path: str, parts: List[str], content: str) -> Dict[str, Any]:
        """Explain a single condition in plain English"""
        # Determine the type based on common patterns
        path_lower = full_path.lower()
        
        # Determine type
        if any(x in path_lower for x in ['id', 'email', 'name']):
            cond_type = 'string'
        elif any(x in path_lower for x in ['count', 'score', 'level', 'limit', 'threshold']):
            cond_type = 'integer'
        elif any(x in path_lower for x in ['enabled', 'active', 'allowed', 'required']):
            cond_type = 'boolean'
        elif any(x in path_lower for x in ['roles', 'permissions', 'groups', 'tags']):
            cond_type = 'array'
        elif any(x in path_lower for x in ['user', 'resource', 'context', 'metadata', 'attributes']):
            cond_type = 'object'
        else:
            cond_type = 'string'
        
        # Generate description
        description = self._generate_condition_description(full_path, parts, content)
        
        # Determine if required (look for patterns in content)
        required = 'required' in content.lower() or full_path in content
        
        # Generate suggestions for data sources
        data_sources = self._suggest_data_sources(full_path, parts)
        
        return {
            'name': full_path,
            'type': cond_type,
            'description': description,
            'required': required,
            'data_sources': data_sources,
            'configuration_notes': self._generate_configuration_notes(full_path, parts)
        }
    
    def _generate_condition_description(self, full_path: str, parts: List[str], content: str) -> str:
        """Generate a human-readable description of a condition"""
        if len(parts) < 2:
            return f"The {full_path} attribute used in policy evaluation."
        
        category = parts[0]
        attribute = '.'.join(parts[1:])
        
        descriptions = {
            'user': f"User attribute '{attribute}' - identifies or describes the user making the request. This is evaluated at runtime to determine if the user meets the required criteria.",
            'resource': f"Resource attribute '{attribute}' - identifies or describes the resource being accessed. This helps determine if the resource characteristics match policy requirements.",
            'action': f"Action attribute '{attribute}' - specifies what operation is being performed. This is used to enforce action-specific authorization rules.",
            'context': f"Context attribute '{attribute}' - provides environmental or situational information about the request. This enables dynamic, context-aware policy decisions.",
            'environment': f"Environment attribute '{attribute}' - describes the deployment or runtime environment. Used for environment-specific policy enforcement.",
            'time': f"Temporal attribute '{attribute}' - time-based condition for enforcing time-bound access controls and temporal policies.",
            'location': f"Location attribute '{attribute}' - geographic or network location information used for location-based access decisions.",
            'device': f"Device attribute '{attribute}' - information about the device making the request, used for device trust assessment.",
            'session': f"Session attribute '{attribute}' - session-specific information for tracking and validating ongoing user sessions.",
        }
        
        return descriptions.get(category, f"The '{full_path}' attribute is evaluated at runtime to make policy decisions. This condition is checked against incoming request data to determine authorization.")
    
    def _suggest_data_sources(self, full_path: str, parts: List[str]) -> List[str]:
        """Suggest where condition data can be fetched from"""
        suggestions = []
        
        if 'user' in full_path.lower():
            suggestions.extend([
                "Identity Provider (IdP) - Okta, Auth0, Azure AD, etc.",
                "User Directory - LDAP, Active Directory",
                "User Profile Database",
                "JWT Token Claims",
                "SAML Assertions"
            ])
        
        if 'role' in full_path.lower() or 'permission' in full_path.lower():
            suggestions.extend([
                "Role-Based Access Control (RBAC) System",
                "Identity Provider Role Assignments",
                "Application-Specific Role Database"
            ])
        
        if 'resource' in full_path.lower():
            suggestions.extend([
                "Resource Registry or Catalog",
                "Database Metadata",
                "API Gateway Configuration",
                "Cloud Provider APIs (AWS, Azure, GCP)"
            ])
        
        if 'context' in full_path.lower():
            suggestions.extend([
                "Context Generation Service (Control Core)",
                "Real-time Data Pipelines",
                "Event Streaming Platforms (Kafka, Kinesis)",
                "External APIs and Data Sources"
            ])
        
        if 'time' in full_path.lower() or 'date' in full_path.lower():
            suggestions.append("System Clock / NTP Servers")
        
        if 'location' in full_path.lower() or 'ip' in full_path.lower():
            suggestions.extend([
                "GeoIP Databases",
                "Network Information (IP Address)",
                "VPN/Proxy Detection Services"
            ])
        
        if 'device' in full_path.lower():
            suggestions.extend([
                "Device Management Systems (MDM, UEM)",
                "Device Fingerprinting Services",
                "User-Agent Parsing"
            ])
        
        # If no specific suggestions, provide general ones
        if not suggestions:
            suggestions.extend([
                "Policy Information Point (PIP)",
                "REST API Endpoints",
                "Database Queries",
                "Message Queue / Event Bus"
            ])
        
        return list(set(suggestions))[:5]  # Return unique, limited to 5
    
    def _generate_configuration_notes(self, full_path: str, parts: List[str]) -> str:
        """Generate configuration notes for the condition"""
        notes = []
        
        notes.append(f"Configure Control Core to fetch '{full_path}' at policy evaluation time.")
        notes.append("This attribute will be included in the authorization request context.")
        
        if 'user' in full_path.lower():
            notes.append("Ensure your Identity Provider is properly integrated with Control Core.")
        
        if 'context' in full_path.lower():
            notes.append("Set up a Context Generation Service to provide real-time context data.")
        
        notes.append("Map this attribute in your Policy Enforcement Point (PEP) configuration.")
        
        return " ".join(notes)
    
    def generate_deployment_guide(self, name: str, category: str, conditions: List[str]) -> Dict[str, Any]:
        """Generate comprehensive deployment guide"""
        return {
            'setup_steps': [
                "1. Review policy requirements and ensure all prerequisites are met",
                "2. Configure data sources and integrations in Control Core",
                f"3. Map required attributes ({len(conditions)} conditions identified) to your data sources",
                "4. Deploy policy to Sandbox environment using Control Core Admin UI",
                "5. Configure test users, resources, and scenarios in Sandbox",
                "6. Run comprehensive tests with various authorization scenarios",
                "7. Monitor policy evaluation logs and adjust conditions as needed",
                "8. Validate audit logging and compliance reporting",
                "9. Conduct user acceptance testing with stakeholders",
                "10. Promote to Production with gradual rollout (shadow mode, then enforcement)",
                "11. Set up monitoring alerts for policy violations and errors",
                "12. Document policy configuration and operational procedures"
            ],
            'sandbox_testing': [
                "Create test users with different roles and attributes",
                "Set up test resources matching your production environment",
                "Test positive cases - authorized access should be granted",
                "Test negative cases - unauthorized access should be denied",
                "Test edge cases and boundary conditions",
                "Verify audit logs capture all required information",
                "Test policy performance under load",
                "Validate integration with your PEP (Policy Enforcement Point)"
            ],
            'configuration_tips': [
                "Start with permissive policies and gradually tighten restrictions",
                "Use policy versioning to track changes and enable rollbacks",
                "Implement comprehensive logging before enforcement",
                "Test in shadow mode to observe behavior without blocking access",
                "Document all customizations and environment-specific settings",
                "Set up monitoring dashboards for policy metrics",
                "Create runbooks for common policy-related incidents",
                "Establish a policy review and update schedule"
            ],
            'production_deployment': [
                "Deploy during maintenance window or low-traffic period",
                "Use feature flags to control policy activation",
                "Start in shadow/monitor mode to collect data without enforcement",
                "Gradually transition to enforcement mode with close monitoring",
                "Have rollback plan ready in case of issues",
                "Monitor application logs and user feedback closely",
                "Set up on-call rotation for policy-related issues",
                "Document the deployment in your change management system"
            ],
            'troubleshooting': [
                "Check Control Core logs if policy evaluation fails",
                "Verify all required attributes are available in request context",
                "Ensure data source integrations are healthy and responsive",
                "Review audit logs to understand policy decisions",
                "Use Control Core's policy testing tools to debug conditions",
                "Check for network connectivity issues between PEP and PDP",
                "Verify policy syntax and structure using validator",
                "Contact Control Core support for persistent issues"
            ]
        }
    
    def determine_compliance_frameworks(self, category: str, content: str) -> List[str]:
        """Determine relevant compliance frameworks"""
        category_key = category.split('/')[-1] if '/' in category else category
        
        # Get frameworks from mapping
        frameworks = self.COMPLIANCE_FRAMEWORKS.get(category_key, []).copy()
        
        # Add specific frameworks based on content
        content_lower = content.lower()
        if 'gdpr' in content_lower:
            frameworks.append('GDPR')
        if 'hipaa' in content_lower:
            frameworks.append('HIPAA')
        if 'pci' in content_lower:
            frameworks.append('PCI DSS')
        if 'sox' in content_lower:
            frameworks.append('SOX')
        if 'ccpa' in content_lower:
            frameworks.append('CCPA')
        if 'pipeda' in content_lower:
            frameworks.append('PIPEDA')
        
        # Remove duplicates and return
        return list(set(frameworks))[:6] if frameworks else ['ISO 27001', 'SOC 2 Type II']
    
    def generate_requirements(self, conditions: List[str], parsed: Dict[str, Any]) -> Dict[str, List[str]]:
        """Generate requirements for policy deployment"""
        return {
            'data_sources': list(set([
                source
                for condition in conditions
                for source in self._suggest_data_sources(condition, condition.split('.'))
            ]))[:8],
            'integrations': [
                'Control Core Policy Administration Point (PAP)',
                'Control Core Policy Decision Point (PDP)',
                'Policy Enforcement Point (PEP) at application/API level',
                'Identity Provider (IdP) integration',
                'Audit logging and SIEM integration',
                'Monitoring and alerting platform'
            ],
            'prerequisites': [
                'Control Core platform deployed and configured',
                'Network connectivity between PEP and PDP',
                'Identity provider integration configured',
                'Required data sources accessible',
                'Sandbox environment set up for testing',
                'Audit logging infrastructure in place',
                'Monitoring and alerting configured'
            ]
        }
    
    def generate_metadata(self, rego_path: Path) -> Dict[str, Any]:
        """Generate comprehensive metadata for a policy template"""
        # Parse the rego file
        parsed = self.parse_rego_file(rego_path)
        
        # Extract name and category from path
        relative_path = rego_path.relative_to(self.templates_dir)
        category = str(relative_path.parent)
        name = rego_path.stem
        
        # Create human-readable name
        display_name = name.replace('-', ' ').replace('_', ' ').title()
        
        # Determine risk level
        risk_level = self.determine_risk_level(name, category, parsed['content'])
        
        # Generate use cases
        use_cases = self.generate_use_cases(display_name, category, parsed)
        
        # Generate conditions explanation
        conditions_explanation = self.generate_conditions_explanation(parsed['conditions'][:15], parsed)
        
        # Generate deployment guide
        deployment_guide = self.generate_deployment_guide(display_name, category, parsed['conditions'])
        
        # Determine compliance frameworks
        compliance_frameworks = self.determine_compliance_frameworks(category, parsed['content'])
        
        # Generate requirements
        requirements = self.generate_requirements(parsed['conditions'], parsed)
        
        # Generate comprehensive description
        summary = self._generate_summary(display_name, category, parsed)
        detailed_description = self._generate_detailed_description(display_name, category, parsed, use_cases)
        
        # Generate tags
        tags = self._generate_tags(name, category, parsed)
        
        # Generate related templates suggestions
        related_templates = self._suggest_related_templates(category, name)
        
        metadata = {
            'version': '1.0.0',
            'summary': summary,
            'detailed_description': detailed_description,
            'use_cases': use_cases,
            'conditions': conditions_explanation,
            'requirements': requirements,
            'deployment_notes': deployment_guide,
            'compliance_frameworks': compliance_frameworks,
            'risk_level': risk_level,
            'tags': tags,
            'related_templates': related_templates
        }
        
        return metadata
    
    def _generate_summary(self, name: str, category: str, parsed: Dict[str, Any]) -> str:
        """Generate a concise summary"""
        # Try to extract from comments first
        if parsed['comments']:
            # Get first few meaningful comments
            meaningful_comments = [c.strip() for c in parsed['comments'] 
                                  if len(c.strip()) > 10 and not c.strip().startswith('import')][:3]
            if meaningful_comments:
                return ' '.join(meaningful_comments)
        
        # Generate based on name and category
        category_clean = category.split('/')[-1].replace('-', ' ').title()
        return f"{name} policy for {category_clean}. Provides comprehensive authorization controls with real-time policy evaluation, audit logging, and compliance enforcement."
    
    def _generate_detailed_description(self, name: str, category: str, parsed: Dict[str, Any], use_cases: List[Dict]) -> str:
        """Generate detailed description"""
        category_clean = category.split('/')[-1].replace('-', ' ').title()
        
        description = f"This policy template implements {name} controls for {category_clean}. "
        description += f"It provides comprehensive authorization and governance capabilities with real-time policy evaluation. "
        
        if len(parsed['conditions']) > 0:
            description += f"\n\nThe policy evaluates {len(parsed['conditions'])} different conditions including user attributes, resource properties, and contextual information. "
        
        description += "Policy decisions are made dynamically based on the current state of the system, user context, and resource characteristics. "
        
        if len(parsed['functions']) > 0:
            description += f"\n\nThe implementation includes {len(parsed['functions'])} helper functions to modularize policy logic and improve maintainability. "
        
        description += "\n\nKey capabilities:\n"
        description += "- Real-time authorization decisions with sub-millisecond evaluation\n"
        description += "- Comprehensive audit logging for all policy evaluations\n"
        description += "- Dynamic context enrichment from multiple data sources\n"
        description += "- Fine-grained attribute-based access control (ABAC)\n"
        description += "- Support for both allow and deny rules with conflict resolution\n"
        
        description += f"\n\nThis template is designed to be deployed in Control Core's policy engine and can be customized to meet your specific requirements. "
        description += "It follows best practices for policy authoring and includes comprehensive error handling."
        
        return description
    
    def _generate_tags(self, name: str, category: str, parsed: Dict[str, Any]) -> List[str]:
        """Generate relevant tags"""
        tags = []
        
        # Add category-based tags
        category_parts = category.split('/')
        tags.extend([part.lower() for part in category_parts])
        
        # Add name-based tags
        name_parts = name.replace('-', ' ').replace('_', ' ').split()
        tags.extend([part.lower() for part in name_parts if len(part) > 3])
        
        # Add feature tags based on content
        content_lower = parsed['content'].lower()
        if 'audit' in content_lower:
            tags.append('audit-logging')
        if 'encrypt' in content_lower:
            tags.append('encryption')
        if 'monitor' in content_lower:
            tags.append('monitoring')
        if 'compliance' in content_lower:
            tags.append('compliance')
        if 'role' in content_lower:
            tags.append('rbac')
        if 'attribute' in content_lower:
            tags.append('abac')
        
        # Remove duplicates and limit
        return list(set(tags))[:10]
    
    def _suggest_related_templates(self, category: str, name: str) -> List[str]:
        """Suggest related templates"""
        related = []
        
        # Category-based suggestions
        if 'ai' in category.lower():
            related.extend([
                'ai-agent-authorization',
                'ai-model-monitoring-drift-detection',
                'ai-bias-detection-mitigation',
                'prompt-injection-prevention'
            ])
        elif 'compliance' in category.lower():
            related.extend([
                'gdpr-data-protection',
                'hipaa-healthcare-privacy',
                'sox-compliance-controls',
                'audit-logging-retention'
            ])
        elif 'security' in category.lower():
            related.extend([
                'zero-trust-network-access',
                'multi-factor-authentication',
                'api-rate-limiting-throttling',
                'least-privilege-access'
            ])
        elif 'data' in category.lower():
            related.extend([
                'dynamic-data-masking',
                'pii-detection-classification',
                'data-encryption-at-rest',
                'data-access-audit'
            ])
        
        # Remove self and duplicates
        related = [r for r in related if r != name]
        return list(set(related))[:5]
    
    def process_template(self, rego_path: Path) -> bool:
        """Process a single template file"""
        meta_path = rego_path.with_suffix('.meta.json')
        
        # Check if meta.json already exists
        if meta_path.exists():
            print(f"  ⏭️  Skipping {rego_path.name} (metadata already exists)")
            return False
        
        try:
            print(f"  🔄 Generating metadata for {rego_path.name}...")
            metadata = self.generate_metadata(rego_path)
            
            # Write metadata file
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            print(f"  ✅ Created {meta_path.name}")
            return True
        
        except Exception as e:
            print(f"  ❌ Error processing {rego_path.name}: {str(e)}")
            return False
    
    def process_all_templates(self):
        """Process all template files"""
        print("🚀 Starting comprehensive metadata generation...\n")
        
        # Find all .rego files
        rego_files = list(self.templates_dir.rglob('*.rego'))
        total = len(rego_files)
        
        print(f"Found {total} policy templates\n")
        
        # Process each file
        created = 0
        skipped = 0
        errors = 0
        
        for rego_path in sorted(rego_files):
            result = self.process_template(rego_path)
            if result:
                created += 1
            elif result is False and rego_path.with_suffix('.meta.json').exists():
                skipped += 1
            else:
                errors += 1
        
        print(f"\n{'='*60}")
        print(f"📊 Summary:")
        print(f"  ✅ Created: {created}")
        print(f"  ⏭️  Skipped: {skipped}")
        print(f"  ❌ Errors: {errors}")
        print(f"  📁 Total: {total}")
        print(f"{'='*60}\n")

def main():
    """Main execution function"""
    script_dir = Path(__file__).parent
    
    generator = PolicyMetadataGenerator(script_dir)
    generator.process_all_templates()
    
    print("✨ Metadata generation complete!")

if __name__ == '__main__':
    main()

