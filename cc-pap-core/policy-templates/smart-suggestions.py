#!/usr/bin/env python3
"""
Control Core Smart Policy Suggestion Engine
Provides intelligent policy suggestions based on resource analysis and compliance requirements
"""

import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResourceType(Enum):
    """Resource types for policy suggestions"""
    HEALTHCARE_DATA = "healthcare-data"
    FINANCIAL_DATA = "financial-data"
    AI_MODEL = "ai-model"
    PERSONAL_DATA = "personal-data"
    AI_ASSISTANT = "ai-assistant"
    CUSTOMER_DATA = "customer-data"
    INTELLECTUAL_PROPERTY = "intellectual-property"
    INFRASTRUCTURE = "infrastructure"

class Industry(Enum):
    """Industry types for compliance suggestions"""
    HEALTHCARE = "healthcare"
    FINANCIAL = "financial"
    GOVERNMENT = "government"
    TECHNOLOGY = "technology"
    EDUCATION = "education"
    RETAIL = "retail"
    MANUFACTURING = "manufacturing"

class ComplianceFramework(Enum):
    """Compliance frameworks"""
    GDPR = "GDPR"
    HIPAA = "HIPAA"
    CCPA = "CCPA"
    PIPEDA = "PIPEDA"
    PHIPA = "PHIPA"
    SOC2 = "SOC2"
    ISO27001 = "ISO27001"
    ISO9001 = "ISO9001"
    PCI_DSS = "PCI-DSS"
    NIST_AI = "NIST_AI"

@dataclass
class PolicySuggestion:
    """Policy suggestion data structure"""
    template_id: str
    category: str
    priority: int
    reason: str
    compliance_requirements: List[str]
    customization_notes: Optional[str] = None

@dataclass
class ResourceAnalysis:
    """Resource analysis data structure"""
    resource_type: ResourceType
    industry: Industry
    data_classification: str
    risk_level: str
    compliance_requirements: List[ComplianceFramework]
    existing_policies: List[str]

class SmartPolicySuggestionEngine:
    """Smart policy suggestion engine for Control Core"""
    
    def __init__(self, metadata_file: str = "template-metadata.json"):
        """Initialize the suggestion engine"""
        self.metadata_file = metadata_file
        self.metadata = self._load_metadata()
        self.logger = logging.getLogger(__name__)
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load policy template metadata"""
        try:
            with open(self.metadata_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.error(f"Metadata file {self.metadata_file} not found")
            return {}
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in metadata file: {e}")
            return {}
    
    def analyze_resource(self, resource_data: Dict[str, Any]) -> ResourceAnalysis:
        """Analyze a resource to determine policy requirements"""
        resource_type = ResourceType(resource_data.get('type', 'personal-data'))
        industry = Industry(resource_data.get('industry', 'technology'))
        data_classification = resource_data.get('classification', 'internal')
        risk_level = resource_data.get('risk_level', 'medium')
        
        # Determine compliance requirements based on industry and data type
        compliance_requirements = self._determine_compliance_requirements(
            resource_type, industry, data_classification
        )
        
        return ResourceAnalysis(
            resource_type=resource_type,
            industry=industry,
            data_classification=data_classification,
            risk_level=risk_level,
            compliance_requirements=compliance_requirements,
            existing_policies=resource_data.get('existing_policies', [])
        )
    
    def _determine_compliance_requirements(
        self, 
        resource_type: ResourceType, 
        industry: Industry, 
        data_classification: str
    ) -> List[ComplianceFramework]:
        """Determine compliance requirements based on resource analysis"""
        requirements = []
        
        # Healthcare compliance
        if resource_type == ResourceType.HEALTHCARE_DATA or industry == Industry.HEALTHCARE:
            requirements.extend([ComplianceFramework.HIPAA, ComplianceFramework.PHIPA])
        
        # Financial compliance
        if resource_type == ResourceType.FINANCIAL_DATA or industry == Industry.FINANCIAL:
            requirements.extend([ComplianceFramework.PCI_DSS, ComplianceFramework.SOC2])
        
        # AI model compliance
        if resource_type == ResourceType.AI_MODEL:
            requirements.append(ComplianceFramework.NIST_AI)
        
        # Personal data compliance
        if resource_type == ResourceType.PERSONAL_DATA:
            requirements.extend([ComplianceFramework.GDPR, ComplianceFramework.CCPA, ComplianceFramework.PIPEDA])
        
        # Government compliance
        if industry == Industry.GOVERNMENT:
            requirements.extend([ComplianceFramework.GDPR, ComplianceFramework.PIPEDA])
        
        # Technology compliance
        if industry == Industry.TECHNOLOGY:
            requirements.extend([ComplianceFramework.SOC2, ComplianceFramework.ISO27001])
        
        return list(set(requirements))  # Remove duplicates
    
    def suggest_policies(self, resource_analysis: ResourceAnalysis) -> List[PolicySuggestion]:
        """Suggest policies based on resource analysis"""
        suggestions = []
        
        # Get smart suggestions from metadata
        smart_suggestions = self.metadata.get('smartSuggestions', {})
        
        # Resource type suggestions
        resource_suggestions = smart_suggestions.get('resourceTypes', {}).get(
            resource_analysis.resource_type.value, {}
        )
        
        if resource_suggestions:
            for template_id in resource_suggestions.get('priorityTemplates', []):
                suggestion = self._create_policy_suggestion(
                    template_id, resource_analysis, "Resource type match"
                )
                if suggestion:
                    suggestions.append(suggestion)
        
        # Industry suggestions
        industry_suggestions = smart_suggestions.get('industryContext', {}).get(
            resource_analysis.industry.value, {}
        )
        
        if industry_suggestions:
            for template_id in industry_suggestions.get('suggestedTemplates', []):
                suggestion = self._create_policy_suggestion(
                    template_id, resource_analysis, "Industry compliance requirement"
                )
                if suggestion:
                    suggestions.append(suggestion)
        
        # Compliance requirement suggestions
        for compliance in resource_analysis.compliance_requirements:
            compliance_templates = self._get_compliance_templates(compliance.value)
            for template_id in compliance_templates:
                suggestion = self._create_policy_suggestion(
                    template_id, resource_analysis, f"Compliance requirement: {compliance.value}"
                )
                if suggestion:
                    suggestions.append(suggestion)
        
        # Remove duplicates and sort by priority
        unique_suggestions = self._deduplicate_suggestions(suggestions)
        return sorted(unique_suggestions, key=lambda x: x.priority)
    
    def _create_policy_suggestion(
        self, 
        template_id: str, 
        resource_analysis: ResourceAnalysis, 
        reason: str
    ) -> Optional[PolicySuggestion]:
        """Create a policy suggestion"""
        # Find template in metadata
        template_info = self._find_template_info(template_id)
        if not template_info:
            return None
        
        # Determine priority based on compliance requirements
        priority = self._calculate_priority(template_id, resource_analysis)
        
        # Get compliance requirements for this template
        compliance_requirements = self._get_template_compliance_requirements(template_id)
        
        return PolicySuggestion(
            template_id=template_id,
            category=template_info.get('category', 'unknown'),
            priority=priority,
            reason=reason,
            compliance_requirements=compliance_requirements,
            customization_notes=self._get_customization_notes(template_id, resource_analysis)
        )
    
    def _find_template_info(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Find template information in metadata"""
        categories = self.metadata.get('categories', {})
        for category, info in categories.items():
            templates = info.get('templates', [])
            if template_id in templates:
                return {
                    'category': category,
                    'name': info.get('name', ''),
                    'description': info.get('description', '')
                }
        return None
    
    def _calculate_priority(self, template_id: str, resource_analysis: ResourceAnalysis) -> int:
        """Calculate priority for a policy suggestion"""
        priority = 5  # Default priority
        
        # Higher priority for compliance requirements
        if any(req.value in template_id for req in resource_analysis.compliance_requirements):
            priority = 1
        
        # Higher priority for high-risk resources
        if resource_analysis.risk_level == 'high':
            priority = max(1, priority - 1)
        
        # Higher priority for sensitive data
        if resource_analysis.data_classification in ['sensitive', 'confidential', 'restricted']:
            priority = max(1, priority - 1)
        
        return priority
    
    def _get_compliance_templates(self, compliance_framework: str) -> List[str]:
        """Get templates for a specific compliance framework"""
        compliance_templates = {
            'GDPR': ['gdpr-data-protection'],
            'HIPAA': ['hipaa-healthcare-privacy'],
            'CCPA': ['ccpa-consumer-privacy'],
            'PIPEDA': ['pipeda-canadian-privacy'],
            'PHIPA': ['phipa-ontario-health'],
            'SOC2': ['soc2-compliance'],
            'ISO27001': ['iso27001-security'],
            'ISO9001': ['iso9001-quality'],
            'PCI-DSS': ['pci-dss-payment'],
            'NIST_AI': ['ai-bias-detection', 'ai-risk-assessment']
        }
        return compliance_templates.get(compliance_framework, [])
    
    def _get_template_compliance_requirements(self, template_id: str) -> List[str]:
        """Get compliance requirements for a template"""
        compliance_mapping = {
            'gdpr-data-protection': ['GDPR'],
            'hipaa-healthcare-privacy': ['HIPAA'],
            'ccpa-consumer-privacy': ['CCPA'],
            'pipeda-canadian-privacy': ['PIPEDA'],
            'phipa-ontario-health': ['PHIPA'],
            'soc2-compliance': ['SOC2'],
            'iso27001-security': ['ISO27001'],
            'iso9001-quality': ['ISO9001'],
            'pci-dss-payment': ['PCI-DSS'],
            'ai-bias-detection': ['NIST_AI'],
            'ai-risk-assessment': ['NIST_AI']
        }
        return compliance_mapping.get(template_id, [])
    
    def _get_customization_notes(self, template_id: str, resource_analysis: ResourceAnalysis) -> str:
        """Get customization notes for a template"""
        notes = []
        
        # Add industry-specific notes
        if resource_analysis.industry == Industry.HEALTHCARE:
            notes.append("Consider healthcare-specific data handling requirements")
        
        if resource_analysis.industry == Industry.FINANCIAL:
            notes.append("Review financial data retention and audit requirements")
        
        # Add risk-level notes
        if resource_analysis.risk_level == 'high':
            notes.append("High-risk resource - consider additional security controls")
        
        # Add data classification notes
        if resource_analysis.data_classification in ['sensitive', 'confidential']:
            notes.append("Sensitive data - ensure proper access controls and encryption")
        
        return "; ".join(notes) if notes else "Standard configuration recommended"
    
    def _deduplicate_suggestions(self, suggestions: List[PolicySuggestion]) -> List[PolicySuggestion]:
        """Remove duplicate suggestions"""
        seen = set()
        unique_suggestions = []
        
        for suggestion in suggestions:
            if suggestion.template_id not in seen:
                seen.add(suggestion.template_id)
                unique_suggestions.append(suggestion)
        
        return unique_suggestions
    
    def get_suggestions_for_resource(self, resource_data: Dict[str, Any]) -> List[PolicySuggestion]:
        """Get policy suggestions for a specific resource"""
        resource_analysis = self.analyze_resource(resource_data)
        return self.suggest_policies(resource_analysis)

# Example usage
if __name__ == "__main__":
    # Initialize the suggestion engine
    engine = SmartPolicySuggestionEngine()
    
    # Example resource data
    resource_data = {
        'type': 'healthcare-data',
        'industry': 'healthcare',
        'classification': 'sensitive',
        'risk_level': 'high',
        'existing_policies': []
    }
    
    # Get suggestions
    suggestions = engine.get_suggestions_for_resource(resource_data)
    
    # Print suggestions
    print("Policy Suggestions:")
    for suggestion in suggestions:
        print(f"- {suggestion.template_id} (Priority: {suggestion.priority})")
        print(f"  Reason: {suggestion.reason}")
        print(f"  Compliance: {', '.join(suggestion.compliance_requirements)}")
        print(f"  Notes: {suggestion.customization_notes}")
        print()
