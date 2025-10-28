package services

import (
	"log"
	"net/http"
	"strings"
	"time"
)

// SmartPolicySuggestions handles intelligent policy suggestions based on resource analysis
type SmartPolicySuggestions struct {
	opalPIPService *OPALPIPService
	httpClient     *http.Client
}

// ResourceAnalysis represents the analysis of a protected resource
type ResourceAnalysis struct {
	ResourceID         string                 `json:"resource_id"`
	ResourceType       string                 `json:"resource_type"`
	Industry           string                 `json:"industry"`
	ComplianceReqs     []string               `json:"compliance_requirements"`
	RiskLevel          string                 `json:"risk_level"`
	DataClassification string                 `json:"data_classification"`
	AccessPatterns     []string               `json:"access_patterns"`
	SecurityContext    map[string]interface{} `json:"security_context"`
	PIPDataSources     []string               `json:"pip_data_sources"`
}

// PolicySuggestion represents a suggested policy template
type PolicySuggestion struct {
	TemplateID     string                 `json:"template_id"`
	TemplateName   string                 `json:"template_name"`
	Category       string                 `json:"category"`
	Priority       int                    `json:"priority"`
	Confidence     float64                `json:"confidence"`
	Reason         string                 `json:"reason"`
	Customizations map[string]interface{} `json:"customizations"`
	ComplianceReqs []string               `json:"compliance_requirements"`
	RiskMitigation []string               `json:"risk_mitigation"`
}

// SmartPolicySuggestionsConfig configuration for smart suggestions
type SmartPolicySuggestionsConfig struct {
	OPALPIPService *OPALPIPService
	APIEndpoint    string
	MLModelURL     string
}

// NewSmartPolicySuggestions creates a new smart policy suggestions service
func NewSmartPolicySuggestions(config *SmartPolicySuggestionsConfig) *SmartPolicySuggestions {
	return &SmartPolicySuggestions{
		opalPIPService: config.OPALPIPService,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// AnalyzeResource analyzes a resource and suggests appropriate policies
func (s *SmartPolicySuggestions) AnalyzeResource(resourceID string, resourceType string, context map[string]interface{}) (*ResourceAnalysis, error) {
	log.Printf("SMART_SUGGESTIONS: Analyzing resource %s of type %s", resourceID, resourceType)

	// Gather PIP data for the resource
	pipData, err := s.gatherPIPData(resourceID, resourceType)
	if err != nil {
		log.Printf("SMART_SUGGESTIONS: Warning - failed to gather PIP data: %v", err)
		pipData = make(map[string]interface{})
	}

	// Analyze the resource based on type and context
	analysis := &ResourceAnalysis{
		ResourceID:         resourceID,
		ResourceType:       resourceType,
		Industry:           s.determineIndustry(resourceType, context),
		ComplianceReqs:     s.determineComplianceRequirements(resourceType, context),
		RiskLevel:          s.assessRiskLevel(resourceType, context, pipData),
		DataClassification: s.classifyData(resourceType, context, pipData),
		AccessPatterns:     s.analyzeAccessPatterns(resourceType, context),
		SecurityContext:    s.buildSecurityContext(resourceType, context, pipData),
		PIPDataSources:     s.identifyPIPDataSources(resourceID),
	}

	log.Printf("SMART_SUGGESTIONS: Resource analysis completed for %s", resourceID)
	return analysis, nil
}

// SuggestPolicies generates policy suggestions based on resource analysis
func (s *SmartPolicySuggestions) SuggestPolicies(analysis *ResourceAnalysis) ([]*PolicySuggestion, error) {
	log.Printf("SMART_SUGGESTIONS: Generating policy suggestions for resource %s", analysis.ResourceID)

	var suggestions []*PolicySuggestion

	// Generate suggestions based on industry
	industrySuggestions := s.generateIndustrySuggestions(analysis)
	suggestions = append(suggestions, industrySuggestions...)

	// Generate suggestions based on compliance requirements
	complianceSuggestions := s.generateComplianceSuggestions(analysis)
	suggestions = append(suggestions, complianceSuggestions...)

	// Generate suggestions based on risk level
	riskSuggestions := s.generateRiskBasedSuggestions(analysis)
	suggestions = append(suggestions, riskSuggestions...)

	// Generate suggestions based on data classification
	dataSuggestions := s.generateDataClassificationSuggestions(analysis)
	suggestions = append(suggestions, dataSuggestions...)

	// Generate suggestions based on access patterns
	accessSuggestions := s.generateAccessPatternSuggestions(analysis)
	suggestions = append(suggestions, accessSuggestions...)

	// Sort suggestions by priority and confidence
	suggestions = s.sortSuggestions(suggestions)

	log.Printf("SMART_SUGGESTIONS: Generated %d policy suggestions for resource %s", len(suggestions), analysis.ResourceID)
	return suggestions, nil
}

// gatherPIPData gathers relevant PIP data for the resource
func (s *SmartPolicySuggestions) gatherPIPData(_ string, _ string) (map[string]interface{}, error) {
	// This would integrate with the existing OPALPIPService to gather relevant data
	// For now, return mock data structure
	return map[string]interface{}{
		"user_attributes": map[string]interface{}{
			"department":      "engineering",
			"clearance_level": "confidential",
			"location":        "canada",
		},
		"resource_metadata": map[string]interface{}{
			"owner":                   "finance_team",
			"classification":          "financial_data",
			"compliance_requirements": []string{"PIPEDA", "FINTRAC"},
		},
		"access_history": []map[string]interface{}{
			{
				"user":      "analyst_1",
				"action":    "read",
				"timestamp": time.Now().Add(-24 * time.Hour),
			},
		},
	}, nil
}

// determineIndustry determines the industry based on resource type and context
func (s *SmartPolicySuggestions) determineIndustry(resourceType string, _ map[string]interface{}) string {
	// Analyze resource type and context to determine industry
	if strings.Contains(resourceType, "financial") || strings.Contains(resourceType, "banking") {
		return "financial_services"
	}
	if strings.Contains(resourceType, "health") || strings.Contains(resourceType, "medical") {
		return "healthcare"
	}
	if strings.Contains(resourceType, "government") || strings.Contains(resourceType, "public") {
		return "government"
	}
	if strings.Contains(resourceType, "retail") || strings.Contains(resourceType, "ecommerce") {
		return "retail"
	}
	return "general"
}

// determineComplianceRequirements determines compliance requirements based on industry and context
func (s *SmartPolicySuggestions) determineComplianceRequirements(resourceType string, context map[string]interface{}) []string {
	var requirements []string

	// Add requirements based on industry
	industry := s.determineIndustry(resourceType, context)
	switch industry {
	case "financial_services":
		requirements = append(requirements, "FINTRAC", "PIPEDA", "PCI-DSS", "SOX")
	case "healthcare":
		requirements = append(requirements, "HIPAA", "PIPEDA", "PHIPA")
	case "government":
		requirements = append(requirements, "PIPEDA", "FOIA", "Privacy_Act")
	case "retail":
		requirements = append(requirements, "PIPEDA", "PCI-DSS", "CCPA")
	}

	// Add requirements based on data type
	if strings.Contains(resourceType, "personal") || strings.Contains(resourceType, "pii") {
		requirements = append(requirements, "PIPEDA", "GDPR")
	}
	if strings.Contains(resourceType, "financial") {
		requirements = append(requirements, "FINTRAC", "AML")
	}
	if strings.Contains(resourceType, "health") {
		requirements = append(requirements, "HIPAA", "PHIPA")
	}

	return requirements
}

// assessRiskLevel assesses the risk level of the resource
func (s *SmartPolicySuggestions) assessRiskLevel(resourceType string, _ map[string]interface{}, pipData map[string]interface{}) string {
	riskScore := 0

	// Assess based on resource type
	if strings.Contains(resourceType, "financial") {
		riskScore += 3
	}
	if strings.Contains(resourceType, "personal") {
		riskScore += 2
	}
	if strings.Contains(resourceType, "confidential") {
		riskScore += 2
	}

	// Assess based on PIP data
	if userAttrs, ok := pipData["user_attributes"].(map[string]interface{}); ok {
		if clearance, ok := userAttrs["clearance_level"].(string); ok {
			switch clearance {
			case "restricted":
				riskScore += 3
			case "confidential":
				riskScore += 2
			case "internal":
				riskScore += 1
			}
		}
	}

	// Determine risk level
	if riskScore >= 5 {
		return "high"
	} else if riskScore >= 3 {
		return "medium"
	}
	return "low"
}

// classifyData classifies the data based on type and context
func (s *SmartPolicySuggestions) classifyData(resourceType string, context map[string]interface{}, _ map[string]interface{}) string {
	// Check for explicit classification in context
	if classification, ok := context["data_classification"].(string); ok {
		return classification
	}

	// Classify based on resource type
	if strings.Contains(resourceType, "restricted") {
		return "restricted"
	}
	if strings.Contains(resourceType, "confidential") {
		return "confidential"
	}
	if strings.Contains(resourceType, "internal") {
		return "internal"
	}
	if strings.Contains(resourceType, "public") {
		return "public"
	}

	// Default classification
	return "internal"
}

// analyzeAccessPatterns analyzes access patterns for the resource
func (s *SmartPolicySuggestions) analyzeAccessPatterns(resourceType string, context map[string]interface{}) []string {
	var patterns []string

	// Analyze based on resource type
	if strings.Contains(resourceType, "api") {
		patterns = append(patterns, "api_access", "programmatic_access")
	}
	if strings.Contains(resourceType, "database") {
		patterns = append(patterns, "database_access", "query_access")
	}
	if strings.Contains(resourceType, "file") {
		patterns = append(patterns, "file_access", "download_access")
	}

	// Analyze based on context
	if mfa, ok := context["mfa_required"].(bool); ok && mfa {
		patterns = append(patterns, "mfa_protected")
	}
	if encryption, ok := context["encryption_enabled"].(bool); ok && encryption {
		patterns = append(patterns, "encrypted_access")
	}

	return patterns
}

// buildSecurityContext builds the security context for the resource
func (s *SmartPolicySuggestions) buildSecurityContext(resourceType string, context map[string]interface{}, pipData map[string]interface{}) map[string]interface{} {
	securityContext := make(map[string]interface{})

	// Add context from input
	for key, value := range context {
		securityContext[key] = value
	}

	// Add PIP data insights
	if userAttrs, ok := pipData["user_attributes"].(map[string]interface{}); ok {
		securityContext["user_department"] = userAttrs["department"]
		securityContext["user_clearance"] = userAttrs["clearance_level"]
		securityContext["user_location"] = userAttrs["location"]
	}

	// Add resource-specific security context
	securityContext["resource_type"] = resourceType
	securityContext["analysis_timestamp"] = time.Now()

	return securityContext
}

// identifyPIPDataSources identifies relevant PIP data sources for the resource
func (s *SmartPolicySuggestions) identifyPIPDataSources(_ string) []string {
	// This would integrate with the existing OPALPIPService to identify relevant data sources
	return []string{
		"user_identity_service",
		"hr_system",
		"active_directory",
		"compliance_database",
	}
}

// generateIndustrySuggestions generates policy suggestions based on industry
func (s *SmartPolicySuggestions) generateIndustrySuggestions(analysis *ResourceAnalysis) []*PolicySuggestion {
	var suggestions []*PolicySuggestion

	switch analysis.Industry {
	case "financial_services":
		suggestions = append(suggestions, &PolicySuggestion{
			TemplateID:     "fintrac-str-triggers",
			TemplateName:   "FINTRAC STR Triggers",
			Category:       "compliance",
			Priority:       1,
			Confidence:     0.95,
			Reason:         "Required for Canadian financial institutions",
			ComplianceReqs: []string{"FINTRAC"},
			RiskMitigation: []string{"AML compliance", "Suspicious transaction monitoring"},
		})
		suggestions = append(suggestions, &PolicySuggestion{
			TemplateID:     "kyc-verification",
			TemplateName:   "KYC Verification",
			Category:       "compliance",
			Priority:       1,
			Confidence:     0.90,
			Reason:         "Essential for customer onboarding compliance",
			ComplianceReqs: []string{"FINTRAC", "PIPEDA"},
			RiskMitigation: []string{"Identity verification", "Customer due diligence"},
		})
	case "healthcare":
		suggestions = append(suggestions, &PolicySuggestion{
			TemplateID:     "hipaa-healthcare-privacy",
			TemplateName:   "HIPAA Healthcare Privacy",
			Category:       "compliance",
			Priority:       1,
			Confidence:     0.95,
			Reason:         "Required for healthcare data protection",
			ComplianceReqs: []string{"HIPAA", "PHIPA"},
			RiskMitigation: []string{"PHI protection", "Access controls"},
		})
	}

	return suggestions
}

// generateComplianceSuggestions generates policy suggestions based on compliance requirements
func (s *SmartPolicySuggestions) generateComplianceSuggestions(analysis *ResourceAnalysis) []*PolicySuggestion {
	var suggestions []*PolicySuggestion

	for _, req := range analysis.ComplianceReqs {
		switch req {
		case "PIPEDA":
			suggestions = append(suggestions, &PolicySuggestion{
				TemplateID:     "gdpr-data-protection",
				TemplateName:   "GDPR Data Protection",
				Category:       "compliance",
				Priority:       2,
				Confidence:     0.85,
				Reason:         "PIPEDA compliance requires similar data protection measures",
				ComplianceReqs: []string{"PIPEDA"},
				RiskMitigation: []string{"Personal data protection", "Consent management"},
			})
		case "FINTRAC":
			suggestions = append(suggestions, &PolicySuggestion{
				TemplateID:     "fintrac-aml-monitoring",
				TemplateName:   "FINTRAC AML Monitoring",
				Category:       "compliance",
				Priority:       1,
				Confidence:     0.90,
				Reason:         "Required for AML compliance in Canada",
				ComplianceReqs: []string{"FINTRAC"},
				RiskMitigation: []string{"Money laundering detection", "Transaction monitoring"},
			})
		}
	}

	return suggestions
}

// generateRiskBasedSuggestions generates policy suggestions based on risk level
func (s *SmartPolicySuggestions) generateRiskBasedSuggestions(analysis *ResourceAnalysis) []*PolicySuggestion {
	var suggestions []*PolicySuggestion

	switch analysis.RiskLevel {
	case "high":
		suggestions = append(suggestions, &PolicySuggestion{
			TemplateID:     "ai-model-security",
			TemplateName:   "AI Model Security",
			Category:       "ai_security",
			Priority:       1,
			Confidence:     0.80,
			Reason:         "High-risk resources require enhanced AI security",
			RiskMitigation: []string{"Model protection", "Access controls", "Audit logging"},
		})
		suggestions = append(suggestions, &PolicySuggestion{
			TemplateID:     "data-lake-security",
			TemplateName:   "Data Lake Security",
			Category:       "data_security",
			Priority:       1,
			Confidence:     0.85,
			Reason:         "High-risk data requires comprehensive protection",
			RiskMitigation: []string{"Data encryption", "Access controls", "Audit trails"},
		})
	case "medium":
		suggestions = append(suggestions, &PolicySuggestion{
			TemplateID:     "api-governance",
			TemplateName:   "API Governance",
			Category:       "api_security",
			Priority:       2,
			Confidence:     0.75,
			Reason:         "Medium-risk resources benefit from API governance",
			RiskMitigation: []string{"API security", "Rate limiting", "Authentication"},
		})
	}

	return suggestions
}

// generateDataClassificationSuggestions generates policy suggestions based on data classification
func (s *SmartPolicySuggestions) generateDataClassificationSuggestions(analysis *ResourceAnalysis) []*PolicySuggestion {
	var suggestions []*PolicySuggestion

	switch analysis.DataClassification {
	case "restricted":
		suggestions = append(suggestions, &PolicySuggestion{
			TemplateID:     "cloud-infrastructure-security",
			TemplateName:   "Cloud Infrastructure Security",
			Category:       "cloud_security",
			Priority:       1,
			Confidence:     0.90,
			Reason:         "Restricted data requires comprehensive cloud security",
			RiskMitigation: []string{"Infrastructure protection", "Network security", "Access controls"},
		})
	case "confidential":
		suggestions = append(suggestions, &PolicySuggestion{
			TemplateID:     "microservice-security",
			TemplateName:   "Microservice Security",
			Category:       "network_security",
			Priority:       2,
			Confidence:     0.80,
			Reason:         "Confidential data requires secure microservice communication",
			RiskMitigation: []string{"Service-to-service security", "Network segmentation"},
		})
	}

	return suggestions
}

// generateAccessPatternSuggestions generates policy suggestions based on access patterns
func (s *SmartPolicySuggestions) generateAccessPatternSuggestions(analysis *ResourceAnalysis) []*PolicySuggestion {
	var suggestions []*PolicySuggestion

	for _, pattern := range analysis.AccessPatterns {
		switch pattern {
		case "api_access":
			suggestions = append(suggestions, &PolicySuggestion{
				TemplateID:     "api-governance",
				TemplateName:   "API Governance",
				Category:       "api_security",
				Priority:       2,
				Confidence:     0.85,
				Reason:         "API access patterns require governance policies",
				RiskMitigation: []string{"API security", "Rate limiting", "Authentication"},
			})
		case "mfa_protected":
			suggestions = append(suggestions, &PolicySuggestion{
				TemplateID:     "sharing-tool-behavior",
				TemplateName:   "Sharing Tool Behavior",
				Category:       "collaboration",
				Priority:       3,
				Confidence:     0.75,
				Reason:         "MFA-protected resources benefit from collaboration controls",
				RiskMitigation: []string{"Sharing controls", "Access management"},
			})
		}
	}

	return suggestions
}

// sortSuggestions sorts policy suggestions by priority and confidence
func (s *SmartPolicySuggestions) sortSuggestions(suggestions []*PolicySuggestion) []*PolicySuggestion {
	// Simple sorting by priority (lower number = higher priority) and confidence
	// In a real implementation, this would be more sophisticated
	for i := 0; i < len(suggestions)-1; i++ {
		for j := i + 1; j < len(suggestions); j++ {
			if suggestions[i].Priority > suggestions[j].Priority ||
				(suggestions[i].Priority == suggestions[j].Priority && suggestions[i].Confidence < suggestions[j].Confidence) {
				suggestions[i], suggestions[j] = suggestions[j], suggestions[i]
			}
		}
	}
	return suggestions
}
