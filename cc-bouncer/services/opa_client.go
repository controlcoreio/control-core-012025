package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"cc-bouncer/models"

	log "github.com/sirupsen/logrus"
)

// truncateString truncates a string to a maximum length with ellipsis
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// getContextKeys returns the keys from a context map
func getContextKeys(context interface{}) []string {
	if context == nil {
		return []string{}
	}

	contextMap, ok := context.(map[string]interface{})
	if !ok {
		return []string{"<invalid_context_type>"}
	}

	keys := make([]string, 0, len(contextMap))
	for key := range contextMap {
		keys = append(keys, key)
	}
	return keys
}

// OPAClient handles communication with the OPAL Client (OPA)
type OPAClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewOPAClient creates a new OPA client for talking to OPAL Client
func NewOPAClient(baseURL string) *OPAClient {
	log.WithFields(log.Fields{
		"opa_url": baseURL,
	}).Info("🔧 OPA_CLIENT: Initializing OPA client for direct policy evaluation")

	// Configure HTTP client with reasonable defaults
	transport := &http.Transport{
		MaxIdleConns:        10,
		MaxConnsPerHost:     5,
		MaxIdleConnsPerHost: 5,
		IdleConnTimeout:     30 * time.Second,
		DisableKeepAlives:   false,
	}

	return &OPAClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout:   5 * time.Second, // Shorter timeout for real-time decisions
			Transport: transport,
		},
	}
}

// OPAQueryRequest represents the input to OPA for policy evaluation
type OPAQueryRequest struct {
	Input map[string]interface{} `json:"input"`
}

// OPAQueryResponse represents OPA's response
type OPAQueryResponse struct {
	Result interface{} `json:"result"`
}

// EvaluatePolicy evaluates an authorization request against OPA policies
func (c *OPAClient) EvaluatePolicy(req models.IAuthorizationRequest, ctx models.AuthorizationContext) (*models.IAuthorizationDecision, error) {
	log.WithFields(log.Fields{
		"request_id": ctx.RequestID,
		"user_id":    req.User.ID,
		"resource":   req.Resource.ID,
		"action":     req.Action.Name,
	}).Info("🔍 OPA_CLIENT: Evaluating authorization request with OPA")

	// Prepare the input for OPA in the standard format
	input := map[string]interface{}{
		"user": map[string]interface{}{
			"id":          req.User.ID,
			"attributes":  req.User.Attributes,
			"roles":       req.User.Roles,
			"permissions": req.User.Permissions,
		},
		"resource": map[string]interface{}{
			"id":         req.Resource.ID,
			"type":       req.Resource.Type,
			"attributes": req.Resource.Attributes,
			"owner":      req.Resource.Owner,
		},
		"action": map[string]interface{}{
			"name":       req.Action.Name,
			"attributes": req.Action.Attributes,
		},
		"context": req.Context,
	}

	// Check if there's JSON data in the context and log it
	if req.Context != nil {
		if jsonDataRaw, exists := req.Context["jsonData"]; exists {
			log.WithFields(log.Fields{
				"request_id":       ctx.RequestID,
				"json_data_type":   fmt.Sprintf("%T", jsonDataRaw),
				"json_data_sample": truncateString(fmt.Sprintf("%v", jsonDataRaw), 500),
			}).Info("🔍 OPA_CLIENT: JSON data found in context, sending to OPA")

			// Try to parse the JSON data if it's a string
			if jsonDataStr, ok := jsonDataRaw.(string); ok {
				var parsedData interface{}
				if err := json.Unmarshal([]byte(jsonDataStr), &parsedData); err == nil {
					// Replace the string with parsed JSON in the input for OPA
					input["context"].(map[string]interface{})["jsonData"] = parsedData
					log.WithFields(log.Fields{
						"request_id": ctx.RequestID,
						"parsed_count": func() int {
							if arr, ok := parsedData.([]interface{}); ok {
								return len(arr)
							}
							return 1
						}(),
					}).Info("🔍 OPA_CLIENT: Successfully parsed JSON data for OPA")
				} else {
					log.WithFields(log.Fields{
						"request_id": ctx.RequestID,
						"error":      err.Error(),
					}).Warn("⚠️ OPA_CLIENT: Failed to parse JSON data string")
				}
			}
		}
	}

	// Create OPA query request
	opaReq := OPAQueryRequest{
		Input: input,
	}

	// Make request to OPA (query enabled package only for active policies)
	result, err := c.queryOPA("data.enabled", opaReq)
	if err != nil {
		log.WithFields(log.Fields{
			"request_id": ctx.RequestID,
			"error":      err,
		}).Error("❌ OPA_CLIENT: Failed to query OPA")

		// Return deny decision on error for security
		return &models.IAuthorizationDecision{
			Allow:  false,
			Reason: fmt.Sprintf("OPA evaluation failed: %v", err),
		}, nil
	}

	log.WithFields(log.Fields{
		"request_id": ctx.RequestID,
		"raw_result": result,
	}).Debug("🔍 OPA_CLIENT: Raw OPA result received")

	// Parse the result
	decision := c.parseOPAResult(result)

	// Log the completion with enhanced details
	logFields := log.Fields{
		"request_id":      ctx.RequestID,
		"allow":           decision.Allow,
		"reason":          decision.Reason,
		"has_masked_data": decision.MaskedData != nil,
	}
	if len(decision.Extra) > 0 {
		logFields["extra_fields_count"] = len(decision.Extra)
	}

	log.WithFields(logFields).Info("✅ OPA_CLIENT: OPA evaluation completed")

	return decision, nil
}

// queryOPA makes a query to OPA with the given query and input
func (c *OPAClient) queryOPA(query string, request OPAQueryRequest) (interface{}, error) {
	// OPA query endpoint - build URL based on the query parameter
	var url string
	switch query {
	case "data.enabled":
		url = fmt.Sprintf("%s/v1/data/enabled", c.baseURL)
	case "data":
		url = fmt.Sprintf("%s/v1/data", c.baseURL)
	case "data.main":
		url = fmt.Sprintf("%s/v1/data/main", c.baseURL)
	default:
		// Fallback for legacy queries
		url = fmt.Sprintf("%s/v1/data/main/allow", c.baseURL)
	}

	// Marshal the request
	reqBody, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal OPA request: %w", err)
	}

	log.WithFields(log.Fields{
		"url":          url,
		"body":         truncateString(string(reqBody), 1000),
		"context_keys": getContextKeys(request.Input["context"]),
	}).Debug("🔍 OPA_CLIENT: Making OPA query")

	// Make HTTP request
	resp, err := c.httpClient.Post(url, "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to make OPA request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body for better error reporting
	var responseBody []byte
	if resp.Body != nil {
		responseBody, _ = json.Marshal(resp.Body)
	}

	if resp.StatusCode != http.StatusOK {
		log.WithFields(log.Fields{
			"status_code":   resp.StatusCode,
			"response_body": string(responseBody),
		}).Error("❌ OPA_CLIENT: OPA returned non-200 status")
		return nil, fmt.Errorf("OPA returned status %d", resp.StatusCode)
	}

	// Parse response
	var opaResp OPAQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&opaResp); err != nil {
		return nil, fmt.Errorf("failed to decode OPA response: %w", err)
	}

	log.WithFields(log.Fields{
		"result": opaResp.Result,
	}).Debug("🔍 OPA_CLIENT: Raw OPA result")

	return opaResp.Result, nil
}

// parseOPAResult converts OPA result to authorization decision
func (c *OPAClient) parseOPAResult(result interface{}) *models.IAuthorizationDecision {
	decision := &models.IAuthorizationDecision{}

	// Handle different result types
	switch r := result.(type) {
	case bool:
		// Simple boolean result (legacy compatibility)
		decision.Allow = r
		if r {
			decision.Reason = "Access granted by OPA policy"
		} else {
			decision.Reason = "Access denied by OPA policy"
		}

	case map[string]interface{}:
		// Complex result object from data.enabled query

		// Check if this is the enabled package structure with main authorization and separate mask packages
		if mainData, hasMain := r["main"].(map[string]interface{}); hasMain {
			// Extract the allow field from enabled.main package
			if allow, ok := mainData["allow"].(bool); ok {
				decision.Allow = allow
			} else {
				decision.Allow = false
			}

			// Extract the reason field from enabled.main package
			if reason, ok := mainData["reason"].(string); ok {
				decision.Reason = reason
			} else if decision.Allow {
				decision.Reason = "Access granted by OPA policy"
			} else {
				decision.Reason = "Access denied by OPA policy"
			}

			// Extract any other fields from main package into Extra map
			extraFields := make(map[string]interface{})
			for key, value := range mainData {
				if key != "allow" && key != "reason" {
					extraFields[key] = value
				}
			}
			if len(extraFields) > 0 {
				decision.Extra = extraFields
				log.WithFields(log.Fields{
					"extra_fields": func() []string {
						keys := make([]string, 0, len(extraFields))
						for k := range extraFields {
							keys = append(keys, k)
						}
						return keys
					}(),
				}).Debug("🔍 OPA_CLIENT: Additional fields found in OPA response")
			}
		}

		// Check for manipulated data in enabled.* packages (filtering, masking, etc.)
		for packageName, packageData := range r {
			if packageMap, ok := packageData.(map[string]interface{}); ok {
				if manipulatedData, exists := packageMap["manipulated_data"]; exists {
					decision.MaskedData = manipulatedData
					log.WithFields(log.Fields{
						"manipulated_data_type": fmt.Sprintf("%T", manipulatedData),
						"source_package":        packageName,
					}).Info("🎭 OPA_CLIENT: Manipulated data included in response")
					break // Use the first manipulated_data found
				}
			}
		}

		// Fallback: Legacy structure - direct allow/reason/masked_data fields
		if !decision.Allow && decision.Reason == "" {
			// Extract the allow field
			if allow, ok := r["allow"].(bool); ok {
				decision.Allow = allow
			} else {
				decision.Allow = false
			}

			// Extract the reason field
			if reason, ok := r["reason"].(string); ok {
				decision.Reason = reason
			} else if decision.Allow {
				decision.Reason = "Access granted by OPA policy"
			} else {
				decision.Reason = "Access denied by OPA policy"
			}

			// Extract masked_data field for data masking support
			if maskedData, exists := r["masked_data"]; exists {
				decision.MaskedData = maskedData
				log.WithFields(log.Fields{
					"masked_data_type": fmt.Sprintf("%T", maskedData),
				}).Info("🎭 OPA_CLIENT: Masked data included in response")
			}

			// Extract any other fields into Extra map
			extraFields := make(map[string]interface{})
			for key, value := range r {
				if key != "allow" && key != "reason" && key != "masked_data" {
					extraFields[key] = value
				}
			}
			if len(extraFields) > 0 {
				decision.Extra = extraFields
				log.WithFields(log.Fields{
					"extra_fields": func() []string {
						keys := make([]string, 0, len(extraFields))
						for k := range extraFields {
							keys = append(keys, k)
						}
						return keys
					}(),
				}).Debug("🔍 OPA_CLIENT: Additional fields found in OPA response")
			}
		}

	case nil:
		// No result (undefined) - default deny
		decision.Allow = false
		decision.Reason = "No policy result (undefined) - default deny"

	default:
		// Unknown result type - default deny
		decision.Allow = false
		decision.Reason = "Unknown policy result type - default deny"
	}

	return decision
}

// HealthCheck verifies connectivity to OPA
func (c *OPAClient) HealthCheck() error {
	url := fmt.Sprintf("%s/health", c.baseURL)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return fmt.Errorf("OPA health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("OPA health check returned status %d", resp.StatusCode)
	}

	return nil
}

// GetPolicyData retrieves policy data from OPA for debugging
func (c *OPAClient) GetPolicyData() (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/v1/data", c.baseURL)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get OPA data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OPA returned status %d", resp.StatusCode)
	}

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode OPA data: %w", err)
	}

	return data, nil
}
