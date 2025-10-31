package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"cc-pdp/models"

	log "github.com/sirupsen/logrus"
)

// PAPClient handles communication with the Policy Administration Point
type PAPClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewPAPClient creates a new PAP client
func NewPAPClient(baseURL string) *PAPClient {
	log.WithFields(log.Fields{
		"pap_url": baseURL,
	}).Info("📡 PAP_CLIENT: Initializing PAP client for policy fetching")

	return &PAPClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetAllPolicies retrieves all policies from the PAP
func (c *PAPClient) GetAllPolicies() ([]models.Policy, error) {
	url := fmt.Sprintf("%s/api/v1/policies", c.baseURL)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch policies: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("PAP returned status %d", resp.StatusCode)
	}

	var response models.Response
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Extract policies from the response data
	data, ok := response.Data.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected response format")
	}

	policiesData, ok := data["policies"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("policies field not found or invalid format")
	}

	var policies []models.Policy
	for _, policyData := range policiesData {
		policyInfo, ok := policyData.(map[string]interface{})
		if !ok {
			continue
		}

		id, _ := policyInfo["id"].(string)

		// For each policy info, fetch the full policy content
		policy, err := c.GetPolicy(id)
		if err != nil {
			log.WithFields(log.Fields{
				"policy_id": id,
				"error":     err,
			}).Warn("⚠️ PAP_CLIENT: Failed to fetch individual policy, skipping")
			continue
		}

		policies = append(policies, *policy)
	}

	return policies, nil
}

// GetPolicy retrieves a specific policy by ID from the PAP
func (c *PAPClient) GetPolicy(policyID string) (*models.Policy, error) {
	url := fmt.Sprintf("%s/api/v1/policies/%s", c.baseURL, policyID)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch policy %s: %w", policyID, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("policy %s not found", policyID)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("PAP returned status %d for policy %s", resp.StatusCode, policyID)
	}

	var response models.Response
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response for policy %s: %w", policyID, err)
	}

	// Extract policy from the response data
	data, ok := response.Data.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected response format for policy %s", policyID)
	}

	policy := &models.Policy{
		ID:      data["id"].(string),
		Name:    data["name"].(string),
		Content: data["content"].(string),
	}

	return policy, nil
}

// HealthCheck verifies connectivity to the PAP
func (c *PAPClient) HealthCheck() error {
	url := fmt.Sprintf("%s/api/v1/policies", c.baseURL)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return fmt.Errorf("PAP health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("PAP health check returned status %d", resp.StatusCode)
	}

	return nil
}
