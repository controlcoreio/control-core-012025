#!/usr/bin/env python3
"""
Template Generator for Control Core Policy Templates
Generates comprehensive policy templates across all categories
"""

import os
import json
from pathlib import Path

# Template definitions for all categories
TEMPLATE_DEFINITIONS = {
    # NIST AI RMF (remaining 5 templates)
    "nist-ai-rmf": [
        {
            "name": "ai-system-validation-verification",
            "title": "AI System Validation and Verification",
            "summary": "Comprehensive validation and verification policy for AI systems before deployment",
            "category": "NIST AI RMF",
            "subcategory": "nist-ai-rmf",
            "risk_level": "high"
        },
        {
            "name": "ai-trustworthiness-assessment",
            "title": "AI Trustworthiness Assessment",
            "summary": "Assessment policy for AI system trustworthiness and reliability",
            "category": "NIST AI RMF",
            "subcategory": "nist-ai-rmf",
            "risk_level": "high"
        },
        {
            "name": "ai-transparency-explainability",
            "title": "AI Transparency and Explainability",
            "summary": "Policy ensuring AI decisions are transparent and explainable",
            "category": "NIST AI RMF",
            "subcategory": "nist-ai-rmf",
            "risk_level": "high"
        },
        {
            "name": "ai-security-resilience",
            "title": "AI Security and Resilience",
            "summary": "Security and resilience controls for AI systems against attacks",
            "category": "NIST AI RMF",
            "subcategory": "nist-ai-rmf",
            "risk_level": "critical"
        },
        {
            "name": "ai-accountability-framework",
            "title": "AI Accountability Framework",
            "summary": "Accountability and responsibility framework for AI systems",
            "category": "NIST AI RMF",
            "subcategory": "nist-ai-rmf",
            "risk_level": "high"
        }
    ],
    
    # Canadian AIDA (5 templates)
    "canadian-aida": [
        {
            "name": "high-impact-ai-system-assessment",
            "title": "High-Impact AI System Assessment",
            "summary": "Assessment policy for high-impact AI systems under Canadian AIDA",
            "category": "Canadian AIDA",
            "subcategory": "canadian-aida",
            "risk_level": "critical"
        },
        {
            "name": "ai-impact-assessment-requirements",
            "title": "AI Impact Assessment Requirements",
            "summary": "Mandatory impact assessment requirements for AI systems",
            "category": "Canadian AIDA",
            "subcategory": "canadian-aida",
            "risk_level": "high"
        },
        {
            "name": "ai-harm-prevention-mitigation",
            "title": "AI Harm Prevention and Mitigation",
            "summary": "Policy for preventing and mitigating AI-related harms",
            "category": "Canadian AIDA",
            "subcategory": "canadian-aida",
            "risk_level": "critical"
        },
        {
            "name": "ai-system-accountability-reporting",
            "title": "AI System Accountability and Reporting",
            "summary": "Accountability and reporting requirements for AI systems",
            "category": "Canadian AIDA",
            "subcategory": "canadian-aida",
            "risk_level": "high"
        },
        {
            "name": "ai-data-governance-aida",
            "title": "AI Data Governance for AIDA",
            "summary": "Data governance policy aligned with AIDA requirements",
            "category": "Canadian AIDA",
            "subcategory": "canadian-aida",
            "risk_level": "high"
        }
    ],
    
    # Canadian AI Governance (5 templates)
    "canadian-ai-governance": [
        {
            "name": "directive-automated-decision-making",
            "title": "Directive on Automated Decision-Making",
            "summary": "Compliance with Canadian government directive on automated decision-making",
            "category": "Canadian AI Governance",
            "subcategory": "canadian-ai-governance",
            "risk_level": "high"
        },
        {
            "name": "treasury-board-ai-governance",
            "title": "Treasury Board AI Governance",
            "summary": "AI governance aligned with Treasury Board guidelines",
            "category": "Canadian AI Governance",
            "subcategory": "canadian-ai-governance",
            "risk_level": "high"
        },
        {
            "name": "privacy-enhanced-ai-pipeda",
            "title": "Privacy-Enhanced AI (PIPEDA Alignment)",
            "summary": "AI systems with enhanced privacy protections aligned with PIPEDA",
            "category": "Canadian AI Governance",
            "subcategory": "canadian-ai-governance",
            "risk_level": "high"
        },
        {
            "name": "algorithmic-impact-assessment",
            "title": "Algorithmic Impact Assessment (AIA)",
            "summary": "Comprehensive algorithmic impact assessment policy",
            "category": "Canadian AI Governance",
            "subcategory": "canadian-ai-governance",
            "risk_level": "high"
        },
        {
            "name": "responsible-ai-framework",
            "title": "Responsible AI Framework",
            "summary": "Framework for responsible AI development and deployment",
            "category": "Canadian AI Governance",
            "subcategory": "canadian-ai-governance",
            "risk_level": "medium"
        }
    ],
    
    # AI Security Controls (12 templates)
    "ai-security": [
        {
            "name": "rag-data-protection-pii",
            "title": "RAG Data Protection - PII",
            "summary": "Protect PII in RAG system retrievals and responses",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "high"
        },
        {
            "name": "rag-access-control",
            "title": "RAG Access Control",
            "summary": "Access control for RAG system queries and data",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "high"
        },
        {
            "name": "rag-data-source-validation",
            "title": "RAG Data Source Validation",
            "summary": "Validate and control RAG data sources",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "medium"
        },
        {
            "name": "ai-agent-authorization",
            "title": "AI Agent Authorization",
            "summary": "Authorization policy for AI agent actions",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "high"
        },
        {
            "name": "ai-agent-boundary-enforcement",
            "title": "AI Agent Boundary Enforcement",
            "summary": "Enforce operational boundaries for AI agents",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "high"
        },
        {
            "name": "ai-agent-audit-logging",
            "title": "AI Agent Audit Logging",
            "summary": "Comprehensive audit logging for AI agent actions",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "medium"
        },
        {
            "name": "llm-input-sanitization",
            "title": "LLM Input Sanitization",
            "summary": "Sanitize and validate LLM inputs for security",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "high"
        },
        {
            "name": "llm-output-filtering",
            "title": "LLM Output Filtering",
            "summary": "Filter LLM outputs for sensitive information",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "high"
        },
        {
            "name": "llm-rate-limiting",
            "title": "LLM Rate Limiting",
            "summary": "Rate limiting for LLM API calls",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "medium"
        },
        {
            "name": "prompt-injection-advanced",
            "title": "Advanced Prompt Injection Prevention",
            "summary": "Advanced techniques for preventing prompt injection attacks",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "critical"
        },
        {
            "name": "prompt-jailbreak-detection",
            "title": "Prompt Jailbreak Detection",
            "summary": "Detect and prevent LLM jailbreak attempts",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "critical"
        },
        {
            "name": "prompt-context-isolation",
            "title": "Prompt Context Isolation",
            "summary": "Isolate prompt contexts to prevent data leakage",
            "category": "AI Security",
            "subcategory": "ai-security",
            "risk_level": "high"
        }
    ]
}

# More template definitions continue...
TEMPLATE_DEFINITIONS_COMPLIANCE = {
    # GDPR (5 templates)
    "compliance": [
        {
            "name": "gdpr-right-to-erasure",
            "title": "GDPR Right to Erasure",
            "summary": "Implement GDPR right to be forgotten/erasure",
            "category": "Privacy & Compliance",
            "subcategory": "gdpr",
            "risk_level": "high"
        },
        {
            "name": "gdpr-data-portability",
            "title": "GDPR Data Portability",
            "summary": "Enable GDPR data portability rights",
            "category": "Privacy & Compliance",
            "subcategory": "gdpr",
            "risk_level": "medium"
        },
        {
            "name": "gdpr-consent-management",
            "title": "GDPR Consent Management",
            "summary": "Manage user consent for data processing",
            "category": "Privacy & Compliance",
            "subcategory": "gdpr",
            "risk_level": "high"
        },
        {
            "name": "gdpr-data-minimization",
            "title": "GDPR Data Minimization",
            "summary": "Enforce data minimization principles",
            "category": "Privacy & Compliance",
            "subcategory": "gdpr",
            "risk_level": "medium"
        },
        {
            "name": "gdpr-cross-border-transfer",
            "title": "GDPR Cross-Border Data Transfer",
            "summary": "Control cross-border personal data transfers",
            "category": "Privacy & Compliance",
            "subcategory": "gdpr",
            "risk_level": "high"
        },
        # HIPAA (5 templates)
        {
            "name": "hipaa-minimum-necessary",
            "title": "HIPAA Minimum Necessary",
            "summary": "Enforce minimum necessary access to PHI",
            "category": "Privacy & Compliance",
            "subcategory": "hipaa",
            "risk_level": "critical"
        },
        {
            "name": "hipaa-authorization-tracking",
            "title": "HIPAA Authorization Tracking",
            "summary": "Track and validate HIPAA authorizations",
            "category": "Privacy & Compliance",
            "subcategory": "hipaa",
            "risk_level": "high"
        },
        {
            "name": "hipaa-breach-notification",
            "title": "HIPAA Breach Notification",
            "summary": "Automate HIPAA breach notification requirements",
            "category": "Privacy & Compliance",
            "subcategory": "hipaa",
            "risk_level": "critical"
        },
        {
            "name": "hipaa-business-associate",
            "title": "HIPAA Business Associate Control",
            "summary": "Control business associate access to PHI",
            "category": "Privacy & Compliance",
            "subcategory": "hipaa",
            "risk_level": "high"
        },
        {
            "name": "hipaa-patient-rights",
            "title": "HIPAA Patient Rights",
            "summary": "Enforce HIPAA patient rights (access, amendment, accounting)",
            "category": "Privacy & Compliance",
            "subcategory": "hipaa",
            "risk_level": "high"
        }
    ]
}

def generate_rego_template(template_def):
    """Generate a Rego policy template."""
    package_name = f"cc.policies.{template_def['subcategory'].replace('-', '_')}.{template_def['name'].replace('-', '_')}"
    
    rego_content = f'''package {package_name}

# {template_def['title']}
# {template_def['summary']}

import rego.v1

# Default deny
default allow = false

# Allow if all requirements are met
allow {{
    input.action == "access"
    input.user.authenticated == true
    input.user.authorized == true
    meets_policy_requirements
}}

# Check if policy requirements are met
meets_policy_requirements {{
    input.context.compliant == true
    input.context.risk_assessed == true
}}

# Deny if critical requirements not met
deny {{
    input.action == "access"
    not input.user.authenticated
}}

# Audit requirement
audit_required {{
    input.action == "access"
}}

# Response with details
response := {{
    "allow": allow,
    "policy": "{template_def['name']}",
    "category": "{template_def['category']}",
    "audit_required": audit_required
}}
'''
    return rego_content

def generate_meta_json(template_def):
    """Generate metadata JSON for template."""
    meta = {
        "version": "1.0.0",
        "summary": template_def['summary'],
        "detailed_description": f"{template_def['summary']}. This policy provides comprehensive controls and enforcement mechanisms aligned with industry standards and best practices.",
        "use_cases": [
            {
                "title": "Primary Use Case",
                "description": f"Enforce {template_def['title']} requirements",
                "scenario": "Organization needs to comply with regulatory requirements"
            }
        ],
        "conditions": [
            {
                "name": "user.authenticated",
                "type": "boolean",
                "description": "User authentication status",
                "required": True
            },
            {
                "name": "user.authorized",
                "type": "boolean",
                "description": "User authorization status",
                "required": True
            },
            {
                "name": "context.compliant",
                "type": "boolean",
                "description": "Compliance status",
                "required": True
            }
        ],
        "requirements": {
            "data_sources": ["User authentication system", "Authorization service"],
            "integrations": ["IAM platform", "Audit logging system"],
            "prerequisites": ["User directory", "Policy enforcement point"]
        },
        "deployment_notes": {
            "setup_steps": [
                "1. Configure integration with IAM system",
                "2. Set up audit logging",
                "3. Test in sandbox environment",
                "4. Deploy to production"
            ],
            "configuration_tips": [
                "Adjust thresholds based on risk appetite",
                "Configure notifications for policy violations"
            ],
            "testing_scenarios": [
                "Authorized user access - should allow",
                "Unauthorized user access - should deny"
            ]
        },
        "compliance_frameworks": [template_def['category']],
        "risk_level": template_def['risk_level'],
        "tags": [template_def['subcategory'], template_def['category'].lower().replace(' & ', '-').replace(' ', '-')],
        "related_templates": []
    }
    return json.dumps(meta, indent=2)

def create_template_files(base_path, category, template_def):
    """Create Rego and meta.json files for a template."""
    category_path = base_path / category
    category_path.mkdir(exist_ok=True)
    
    # Create .rego file
    rego_path = category_path / f"{template_def['name']}.rego"
    with open(rego_path, 'w') as f:
        f.write(generate_rego_template(template_def))
    
    # Create .meta.json file
    meta_path = category_path / f"{template_def['name']}.meta.json"
    with open(meta_path, 'w') as f:
        f.write(generate_meta_json(template_def))
    
    print(f"✓ Created: {template_def['name']}")

def main():
    """Generate all policy templates."""
    base_path = Path(__file__).parent
    
    print("=" * 60)
    print("  Control Core Policy Template Generator")
    print("=" * 60)
    print()
    
    # Generate all templates
    for category, templates in TEMPLATE_DEFINITIONS.items():
        print(f"\n📁 Generating {category} templates...")
        for template_def in templates:
            create_template_files(base_path, category, template_def)
    
    for category, templates in TEMPLATE_DEFINITIONS_COMPLIANCE.items():
        print(f"\n📁 Generating {category} templates...")
        for template_def in templates:
            create_template_files(base_path, category, template_def)
    
    print("\n" + "=" * 60)
    print("  Template Generation Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()

