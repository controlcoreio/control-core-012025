package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// PolicyTemplateService handles centralized policy template management
// This service ensures all policy template capabilities are managed in one location
type PolicyTemplateService struct {
	httpClient *http.Client
	config     *PolicyTemplateServiceConfig
}

// PolicyTemplateServiceConfig configuration for the policy template service
type PolicyTemplateServiceConfig struct {
	TemplateRegistryURL string
	APIEndpoint         string
	CacheTTL            time.Duration
	EncryptionKey       string
}

// PolicyTemplate represents a policy template
type PolicyTemplate struct {
	ID             string                 `json:"id"`
	Name           string                 `json:"name"`
	Category       string                 `json:"category"`
	Subcategory    string                 `json:"subcategory"`
	Version        string                 `json:"version"`
	Status         string                 `json:"status"`
	Description    string                 `json:"description"`
	Content        string                 `json:"content"`
	Tags           []string               `json:"tags"`
	ComplianceReqs []string               `json:"compliance_requirements"`
	RiskLevel      string                 `json:"risk_level"`
	Dependencies   []string               `json:"dependencies"`
	Customizations map[string]interface{} `json:"customizations"`
	Metadata       map[string]interface{} `json:"metadata"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
	CreatedBy      string                 `json:"created_by"`
	LastModifiedBy string                 `json:"last_modified_by"`
}

// TemplateSuggestion represents a policy template suggestion
type TemplateSuggestion struct {
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

// TemplateValidationResult represents template validation results
type TemplateValidationResult struct {
	Valid           bool     `json:"valid"`
	SyntaxValid     bool     `json:"syntax_valid"`
	LogicValid      bool     `json:"logic_valid"`
	ComplianceValid bool     `json:"compliance_valid"`
	SecurityValid   bool     `json:"security_valid"`
	Errors          []string `json:"errors"`
	Warnings        []string `json:"warnings"`
	Suggestions     []string `json:"suggestions"`
}

// NewPolicyTemplateService creates a new policy template service
func NewPolicyTemplateService(config *PolicyTemplateServiceConfig) *PolicyTemplateService {
	return &PolicyTemplateService{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		config: config,
	}
}

// GetTemplate retrieves a policy template by ID
func (s *PolicyTemplateService) GetTemplate(templateID string) (*PolicyTemplate, error) {
	log.Printf("POLICY_TEMPLATE: Retrieving template %s", templateID)

	url := fmt.Sprintf("%s/api/v1/templates/%s", s.config.TemplateRegistryURL, templateID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.EncryptionKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("template service returned status %d", resp.StatusCode)
	}

	var template PolicyTemplate
	if err := json.NewDecoder(resp.Body).Decode(&template); err != nil {
		return nil, fmt.Errorf("failed to decode template: %w", err)
	}

	log.Printf("POLICY_TEMPLATE: Successfully retrieved template %s", templateID)
	return &template, nil
}

// GetTemplatesByCategory retrieves templates by category
func (s *PolicyTemplateService) GetTemplatesByCategory(category string) ([]*PolicyTemplate, error) {
	log.Printf("POLICY_TEMPLATE: Retrieving templates for category %s", category)

	url := fmt.Sprintf("%s/api/v1/templates?category=%s", s.config.TemplateRegistryURL, category)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.EncryptionKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get templates: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("template service returned status %d", resp.StatusCode)
	}

	var templates []*PolicyTemplate
	if err := json.NewDecoder(resp.Body).Decode(&templates); err != nil {
		return nil, fmt.Errorf("failed to decode templates: %w", err)
	}

	log.Printf("POLICY_TEMPLATE: Successfully retrieved %d templates for category %s", len(templates), category)
	return templates, nil
}

// SuggestTemplates suggests policy templates based on resource analysis
func (s *PolicyTemplateService) SuggestTemplates(resourceType string, context map[string]interface{}) ([]*TemplateSuggestion, error) {
	log.Printf("POLICY_TEMPLATE: Suggesting templates for resource type %s", resourceType)

	request := map[string]interface{}{
		"resource_type": resourceType,
		"context":       context,
	}

	url := fmt.Sprintf("%s/api/v1/templates/suggest", s.config.TemplateRegistryURL)
	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.EncryptionKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to suggest templates: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("template service returned status %d", resp.StatusCode)
	}

	var suggestions []*TemplateSuggestion
	if err := json.NewDecoder(resp.Body).Decode(&suggestions); err != nil {
		return nil, fmt.Errorf("failed to decode suggestions: %w", err)
	}

	log.Printf("POLICY_TEMPLATE: Successfully generated %d template suggestions", len(suggestions))
	return suggestions, nil
}

// ValidateTemplate validates a policy template
func (s *PolicyTemplateService) ValidateTemplate(template *PolicyTemplate) (*TemplateValidationResult, error) {
	log.Printf("POLICY_TEMPLATE: Validating template %s", template.ID)

	url := fmt.Sprintf("%s/api/v1/templates/validate", s.config.TemplateRegistryURL)
	jsonData, err := json.Marshal(template)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal template: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.EncryptionKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to validate template: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("template service returned status %d", resp.StatusCode)
	}

	var result TemplateValidationResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode validation result: %w", err)
	}

	log.Printf("POLICY_TEMPLATE: Template validation completed for %s", template.ID)
	return &result, nil
}

// DeployTemplate deploys a policy template
func (s *PolicyTemplateService) DeployTemplate(templateID string, targetEnvironment string) error {
	log.Printf("POLICY_TEMPLATE: Deploying template %s to %s", templateID, targetEnvironment)

	request := map[string]interface{}{
		"template_id":        templateID,
		"target_environment": targetEnvironment,
		"deployment_time":    time.Now(),
	}

	url := fmt.Sprintf("%s/api/v1/templates/deploy", s.config.TemplateRegistryURL)
	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.EncryptionKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to deploy template: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("template service returned status %d", resp.StatusCode)
	}

	log.Printf("POLICY_TEMPLATE: Successfully deployed template %s to %s", templateID, targetEnvironment)
	return nil
}

// GetTemplateStatistics gets template usage statistics
func (s *PolicyTemplateService) GetTemplateStatistics() (map[string]interface{}, error) {
	log.Printf("POLICY_TEMPLATE: Retrieving template statistics")

	url := fmt.Sprintf("%s/api/v1/templates/statistics", s.config.TemplateRegistryURL)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.EncryptionKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get statistics: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("template service returned status %d", resp.StatusCode)
	}

	var stats map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return nil, fmt.Errorf("failed to decode statistics: %w", err)
	}

	log.Printf("POLICY_TEMPLATE: Successfully retrieved template statistics")
	return stats, nil
}
