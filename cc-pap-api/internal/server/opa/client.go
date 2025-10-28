package opa

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/controlcoreio/cc-policy-admin-api/internal/server/models"
)

// OPAPolicyResponse represents the structure of OPA's policy response
type OPAPolicyResponse struct {
	Result []OPAPolicyData `json:"result"`
}

// OPAPolicyData represents individual policy data from OPA
type OPAPolicyData struct {
	ID  string      `json:"id"`
	Raw string      `json:"raw"`
	AST interface{} `json:"ast,omitempty"`
}

// ListPolicyWidgets retrieves all policies from OPA and converts them to PolicyWidget format
func ListPolicyWidgets(opaURL string) ([]models.PolicyWidget, error) {
	url := fmt.Sprintf("%s/v1/policies", opaURL)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to OPA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	var opaResponse OPAPolicyResponse
	if err := json.NewDecoder(resp.Body).Decode(&opaResponse); err != nil {
		return nil, fmt.Errorf("failed to decode OPA response: %w", err)
	}

	var policies []models.PolicyWidget
	for _, policyData := range opaResponse.Result {
		// Extract policy ID from the path (e.g., "policies/enabled/main.rego" -> "main")
		policyID := extractPolicyID(policyData.ID)

		// Determine status based on path
		status := models.PolicyStatusEnabled
		if strings.Contains(policyData.ID, "/disabled/") {
			status = models.PolicyStatusDisabled
		}

		// Extract metadata from policy content
		name, description := extractPolicyMetadata(policyData.Raw, policyID)
		scope := generateScope(policyID, policyData.Raw)

		policy := models.PolicyWidget{
			ID:           policyID,
			Name:         name,
			Description:  description,
			Status:       status,
			Scope:        scope,
			LastModified: time.Now().Format(time.RFC3339), // OPA doesn't provide modification time
			ModifiedBy:   "System",
			Version:      "1.0", // OPA doesn't provide version info
			CreatedAt:    time.Now().Format(time.RFC3339),
			CreatedBy:    "System",
			Content:      policyData.Raw,
		}

		policies = append(policies, policy)
	}

	return policies, nil
}

// GetPolicyWidget retrieves a specific policy by ID from OPA and converts it to PolicyWidget format
func GetPolicyWidget(opaURL, policyID string) (*models.PolicyWidget, error) {
	// First, list all policies to find the one with matching ID
	policies, err := ListPolicyWidgets(opaURL)
	if err != nil {
		return nil, err
	}

	for _, policy := range policies {
		if policy.ID == policyID {
			return &policy, nil
		}
	}

	return nil, fmt.Errorf("policy not found: %s", policyID)
}

// extractPolicyID extracts the policy ID from the OPA policy path
func extractPolicyID(policyPath string) string {
	// Handle paths like "policies/enabled/main.rego" or "policies/disabled/mask.rego"
	parts := strings.Split(policyPath, "/")
	if len(parts) > 0 {
		filename := parts[len(parts)-1]
		// Remove .rego extension
		if strings.HasSuffix(filename, ".rego") {
			return strings.TrimSuffix(filename, ".rego")
		}
		return filename
	}
	return policyPath
}

// extractPolicyMetadata extracts name and description from policy content
func extractPolicyMetadata(content, defaultName string) (string, string) {
	name := defaultName
	description := fmt.Sprintf("Policy for %s operations", defaultName)

	// Parse content for package name and comments
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)

		// Extract package name for better naming
		if strings.HasPrefix(line, "package ") {
			packageName := strings.TrimPrefix(line, "package ")
			parts := strings.Split(packageName, ".")
			if len(parts) > 0 {
				name = strings.Title(strings.ReplaceAll(parts[len(parts)-1], "_", " "))
			}
		}

		// Look for description comments
		if strings.HasPrefix(line, "# ") && strings.Contains(strings.ToLower(line), "description") {
			description = strings.TrimPrefix(line, "# ")
			if strings.Contains(strings.ToLower(description), "description:") {
				parts := strings.Split(description, ":")
				if len(parts) > 1 {
					description = strings.TrimSpace(parts[1])
				}
			}
		}
	}

	// Generate descriptive names based on policy ID
	switch {
	case strings.Contains(strings.ToLower(defaultName), "admin"):
		name = "Admin Access Policy"
		description = "Controls access levels for administrative users"
	case strings.Contains(strings.ToLower(defaultName), "mask"):
		name = "Data Masking Policy"
		description = "Defines data masking rules for sensitive information"
	case strings.Contains(strings.ToLower(defaultName), "main"):
		name = "Main Access Policy"
		description = "Primary access control policy for the application"
	case strings.Contains(strings.ToLower(defaultName), "rbac"):
		name = "RBAC Policy"
		description = "Role-based access control policy"
	case strings.Contains(strings.ToLower(defaultName), "auth"):
		name = "Authentication Policy"
		description = "User authentication and authorization policy"
	}

	return name, description
}

// generateScope analyzes policy content to determine scope
func generateScope(policyID, content string) []string {
	scope := []string{}
	contentLower := strings.ToLower(content)

	// Analyze content for different scopes
	if strings.Contains(contentLower, "role") || strings.Contains(contentLower, "admin") {
		scope = append(scope, "Role Management")
	}
	if strings.Contains(contentLower, "api") || strings.Contains(contentLower, "endpoint") {
		scope = append(scope, "API Access")
	}
	if strings.Contains(contentLower, "data") || strings.Contains(contentLower, "database") {
		scope = append(scope, "Data Access")
	}
	if strings.Contains(contentLower, "mask") || strings.Contains(contentLower, "privacy") {
		scope = append(scope, "Data Privacy")
	}
	if strings.Contains(contentLower, "user") || strings.Contains(contentLower, "subject") {
		scope = append(scope, "User Management")
	}

	// Default scope based on policy ID
	if len(scope) == 0 {
		switch {
		case strings.Contains(strings.ToLower(policyID), "admin"):
			scope = append(scope, "Administration")
		case strings.Contains(strings.ToLower(policyID), "main"):
			scope = append(scope, "General Access")
		default:
			scope = append(scope, "Application")
		}
	}

	return scope
}

// ListPolicies retrieves all policies from OPA
func ListPolicies(opaURL string) ([]models.Policy, error) {
	url := fmt.Sprintf("%s/v1/policies", opaURL)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to OPA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	var opaResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&opaResponse); err != nil {
		return nil, fmt.Errorf("failed to decode OPA response: %w", err)
	}

	policies := make([]models.Policy, 0)
	if result, ok := opaResponse["result"].(map[string]interface{}); ok {
		for id, rawPolicy := range result {
			if policyData, ok := rawPolicy.(map[string]interface{}); ok {
				if rawContent, exists := policyData["raw"]; exists {
					policy := models.Policy{
						ID:      id,
						Content: fmt.Sprintf("%v", rawContent),
					}
					policies = append(policies, policy)
				}
			}
		}
	}

	return policies, nil
}

// GetPolicy retrieves a specific policy by ID from OPA
func GetPolicy(opaURL, policyID string) (*models.Policy, error) {
	url := fmt.Sprintf("%s/v1/policies/%s", opaURL, policyID)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to OPA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("policy not found")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	var opaResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&opaResponse); err != nil {
		return nil, fmt.Errorf("failed to decode OPA response: %w", err)
	}

	if result, ok := opaResponse["result"].(map[string]interface{}); ok {
		if rawContent, exists := result["raw"]; exists {
			policy := &models.Policy{
				ID:      policyID,
				Content: fmt.Sprintf("%v", rawContent),
			}
			return policy, nil
		}
	}

	return nil, fmt.Errorf("policy content not found in response")
}

// CreatePolicy creates a new policy in OPA
func CreatePolicy(opaURL, policyID, content string) error {
	url := fmt.Sprintf("%s/v1/policies/%s", opaURL, policyID)

	payload := map[string]interface{}{
		"raw": content,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal policy data: %w", err)
	}

	req, err := http.NewRequest(http.MethodPut, url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to OPA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// UpdatePolicy updates an existing policy in OPA
func UpdatePolicy(opaURL, policyID, content string) error {
	// In OPA, PUT creates or updates, so we can use the same logic as CreatePolicy
	return CreatePolicy(opaURL, policyID, content)
}

// DeletePolicy removes a policy from OPA
func DeletePolicy(opaURL, policyID string) error {
	url := fmt.Sprintf("%s/v1/policies/%s", opaURL, policyID)

	req, err := http.NewRequest(http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send delete request to OPA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNotFound {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// EvaluatePolicy evaluates a policy decision in OPA
func EvaluatePolicy(opaURL, subjectID, resourceType, resourceID, action string) (*models.PolicyDecision, error) {
	url := fmt.Sprintf("%s/v1/data", opaURL)

	input := map[string]interface{}{
		"user": map[string]interface{}{
			"id": subjectID,
		},
		"resource": map[string]interface{}{
			"type": resourceType,
			"id":   resourceID,
		},
		"action": action,
	}

	payload := map[string]interface{}{
		"input": input,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal evaluation data: %w", err)
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to OPA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	var opaResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&opaResponse); err != nil {
		return nil, fmt.Errorf("failed to decode OPA response: %w", err)
	}

	decision := &models.PolicyDecision{
		SubjectID:    subjectID,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Action:       action,
		Allow:        false,
		Reason:       "No matching policy",
	}

	// Look for allow decision in the result
	if result, ok := opaResponse["result"].(map[string]interface{}); ok {
		if allow, exists := result["allow"]; exists {
			if allowBool, ok := allow.(bool); ok {
				decision.Allow = allowBool
				if allowBool {
					decision.Reason = "Policy evaluation successful"
				}
			}
		}
	}

	return decision, nil
}

// PublishDataUpdate sends a data update to OPAL server
func PublishDataUpdate(opalServerURL string, req models.DataUpdateRequest) error {
	url := fmt.Sprintf("%s/data/config", opalServerURL)

	jsonData, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal data update request: %w", err)
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to connect to OPAL server: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("OPAL server returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// EnablePolicyInOPA enables a policy by moving it from disabled to enabled path and updating package name
func EnablePolicyInOPA(opaURL, policyID string) error {
	// First, check if the policy exists in the disabled state
	disabledPolicyID := fmt.Sprintf("policies/disabled/%s.rego", policyID)
	enabledPolicyID := fmt.Sprintf("policies/enabled/%s.rego", policyID)

	// Get the policy content from the disabled path
	content, err := GetPolicyContentByPath(opaURL, disabledPolicyID)
	if err != nil {
		return fmt.Errorf("policy not found in disabled state: %w", err)
	}

	// Update package name from disabled.* to enabled.*
	updatedContent := updatePackageName(content, "disabled", "enabled")

	// Create the policy in the enabled path
	url := fmt.Sprintf("%s/v1/policies/%s", opaURL, enabledPolicyID)
	req, err := http.NewRequest(http.MethodPut, url, strings.NewReader(updatedContent))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "text/plain")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to OPA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	// Remove the policy from the disabled path
	deleteURL := fmt.Sprintf("%s/v1/policies/%s", opaURL, disabledPolicyID)
	deleteReq, err := http.NewRequest(http.MethodDelete, deleteURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	deleteResp, err := client.Do(deleteReq)
	if err != nil {
		return fmt.Errorf("failed to send delete request to OPA: %w", err)
	}
	defer deleteResp.Body.Close()

	return nil
}

// DisablePolicyInOPA disables a policy by moving it from enabled to disabled path and updating package name
func DisablePolicyInOPA(opaURL, policyID string) error {
	enabledPolicyID := fmt.Sprintf("policies/enabled/%s.rego", policyID)
	disabledPolicyID := fmt.Sprintf("policies/disabled/%s.rego", policyID)

	// Get the policy content from the enabled path
	content, err := GetPolicyContentByPath(opaURL, enabledPolicyID)
	if err != nil {
		return fmt.Errorf("policy not found in enabled state: %w", err)
	}

	// Update package name from enabled.* to disabled.*
	updatedContent := updatePackageName(content, "enabled", "disabled")

	// Create the policy in the disabled path
	url := fmt.Sprintf("%s/v1/policies/%s", opaURL, disabledPolicyID)
	req, err := http.NewRequest(http.MethodPut, url, strings.NewReader(updatedContent))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "text/plain")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to OPA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	// Remove the policy from the enabled path
	deleteURL := fmt.Sprintf("%s/v1/policies/%s", opaURL, enabledPolicyID)
	deleteReq, err := http.NewRequest(http.MethodDelete, deleteURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	deleteResp, err := client.Do(deleteReq)
	if err != nil {
		return fmt.Errorf("failed to send delete request to OPA: %w", err)
	}
	defer deleteResp.Body.Close()

	return nil
}

// updatePackageName updates the package declaration in policy content
func updatePackageName(content, oldPrefix, newPrefix string) string {
	lines := strings.Split(content, "\n")
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "package ") {
			packageName := strings.TrimPrefix(trimmed, "package ")

			// Handle both simple package names and prefixed package names
			if strings.HasPrefix(packageName, oldPrefix+".") {
				// Replace prefix: "disabled.main" -> "enabled.main"
				newPackageName := strings.Replace(packageName, oldPrefix+".", newPrefix+".", 1)
				lines[i] = fmt.Sprintf("package %s", newPackageName)
			} else if packageName == oldPrefix {
				// Replace simple package: "disabled" -> "enabled"
				lines[i] = fmt.Sprintf("package %s", newPrefix)
			} else if !strings.Contains(packageName, ".") {
				// Add prefix to simple package names: "main" -> "enabled.main"
				lines[i] = fmt.Sprintf("package %s.%s", newPrefix, packageName)
			}
			break // Only update the first package declaration
		}
	}
	return strings.Join(lines, "\n")
}

// CreatePolicyWithStatus creates a new policy with the appropriate package prefix based on status
func CreatePolicyWithStatus(opaURL, policyID, content, status string) error {
	var policyPath string
	var packagePrefix string

	if status == models.PolicyStatusEnabled {
		policyPath = fmt.Sprintf("policies/enabled/%s.rego", policyID)
		packagePrefix = "enabled"
	} else {
		policyPath = fmt.Sprintf("policies/disabled/%s.rego", policyID)
		packagePrefix = "disabled"
	}

	// Ensure the policy has the correct package prefix
	updatedContent := ensurePackagePrefix(content, packagePrefix, policyID)

	url := fmt.Sprintf("%s/v1/policies/%s", opaURL, policyPath)
	req, err := http.NewRequest(http.MethodPut, url, strings.NewReader(updatedContent))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "text/plain")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to OPA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// ensurePackagePrefix ensures the policy content has the correct package prefix
func ensurePackagePrefix(content, prefix, policyID string) string {
	lines := strings.Split(content, "\n")
	packageFound := false

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "package ") {
			packageName := strings.TrimPrefix(trimmed, "package ")

			// If package already has the correct prefix, leave it as is
			if strings.HasPrefix(packageName, prefix+".") {
				packageFound = true
				break
			}

			// If it's a simple package name, add the prefix
			if !strings.Contains(packageName, ".") {
				lines[i] = fmt.Sprintf("package %s.%s", prefix, packageName)
			} else {
				// If it has a different prefix, update it
				parts := strings.Split(packageName, ".")
				if len(parts) > 1 {
					parts[0] = prefix
					lines[i] = fmt.Sprintf("package %s", strings.Join(parts, "."))
				}
			}
			packageFound = true
			break
		}
	}

	// If no package declaration found, add one
	if !packageFound {
		newPackage := fmt.Sprintf("package %s.%s", prefix, policyID)
		lines = append([]string{newPackage, ""}, lines...)
	}

	return strings.Join(lines, "\n")
}

// GetPolicyContent retrieves the raw content of a policy from OPA
func GetPolicyContent(opaURL, policyID string) (string, error) {
	policies, err := ListPolicyWidgets(opaURL)
	if err != nil {
		return "", err
	}

	for _, policy := range policies {
		if policy.ID == policyID {
			return policy.Content, nil
		}
	}

	return "", fmt.Errorf("policy not found: %s", policyID)
}

// GetPolicyContentByPath retrieves the raw content of a policy from OPA by its full path
func GetPolicyContentByPath(opaURL, policyPath string) (string, error) {
	url := fmt.Sprintf("%s/v1/policies/%s", opaURL, policyPath)

	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to connect to OPA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return "", fmt.Errorf("policy not found")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	var opaResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&opaResponse); err != nil {
		return "", fmt.Errorf("failed to decode OPA response: %w", err)
	}

	if result, ok := opaResponse["result"].(map[string]interface{}); ok {
		if rawContent, exists := result["raw"]; exists {
			return fmt.Sprintf("%v", rawContent), nil
		}
	}

	return "", fmt.Errorf("policy content not found in response")
}
