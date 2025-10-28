package services

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"
)

// TelemetryEventType represents the type of telemetry event
type TelemetryEventType string

const (
	PolicyEvaluation   TelemetryEventType = "policy_evaluation"
	ContextGeneration  TelemetryEventType = "context_generation"
	ContextIngestion   TelemetryEventType = "context_ingestion"
	UserAuthentication TelemetryEventType = "user_authentication"
	PolicyDeployment   TelemetryEventType = "policy_deployment"
	SystemHealth       TelemetryEventType = "system_health"
	BillingEvent       TelemetryEventType = "billing_event"
	SecurityEvent      TelemetryEventType = "security_event"
)

// TelemetryLevel represents the severity level of the event
type TelemetryLevel string

const (
	Info     TelemetryLevel = "info"
	Warning  TelemetryLevel = "warning"
	Error    TelemetryLevel = "error"
	Critical TelemetryLevel = "critical"
)

// TelemetryEvent represents a telemetry event to be sent
type TelemetryEvent struct {
	TenantID               string                 `json:"tenant_id"`
	EventType              TelemetryEventType     `json:"event_type"`
	Component              string                 `json:"component"`
	Action                 string                 `json:"action"`
	Level                  TelemetryLevel         `json:"level"`
	Metadata               map[string]interface{} `json:"metadata"`
	UserID                 *string                `json:"user_id,omitempty"`
	PolicyCount            *int                   `json:"policy_count,omitempty"`
	ContextGenerationCount *int                   `json:"context_generation_count,omitempty"`
	IngestionCount         *int                   `json:"ingestion_count,omitempty"`
	BillingMetric          *float64               `json:"billing_metric,omitempty"`
}

// TelemetryClient handles sending telemetry data to business admin
type TelemetryClient struct {
	businessAdminURL string
	apiKey           string
	enabled          bool
	httpClient       *http.Client
}

// NewTelemetryClient creates a new telemetry client
func NewTelemetryClient(businessAdminURL, apiKey string, enabled bool) *TelemetryClient {
	return &TelemetryClient{
		businessAdminURL: businessAdminURL,
		apiKey:           apiKey,
		enabled:          enabled,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// LogPolicyEvaluation logs a policy evaluation event
func (tc *TelemetryClient) LogPolicyEvaluation(
	tenantID, component, policyName, decision string,
	evaluationTimeMs float64,
	userID *string,
	resourceType *string,
) {
	if !tc.enabled {
		return
	}

	metadata := map[string]interface{}{
		"policy_name":        policyName,
		"decision":           decision,
		"evaluation_time_ms": evaluationTimeMs,
	}

	if resourceType != nil {
		metadata["resource_type"] = *resourceType
	}

	event := TelemetryEvent{
		TenantID:    tenantID,
		EventType:   PolicyEvaluation,
		Component:   component,
		Action:      "policy_evaluation",
		Level:       Info,
		Metadata:    metadata,
		UserID:      userID,
		PolicyCount: intPtr(1),
	}

	tc.sendEvent(event)
}

// LogContextGeneration logs a context generation event
func (tc *TelemetryClient) LogContextGeneration(
	tenantID, component, contextType string,
	sourceCount int,
	generationTimeMs float64,
	userID *string,
) {
	if !tc.enabled {
		return
	}

	metadata := map[string]interface{}{
		"context_type":       contextType,
		"source_count":       sourceCount,
		"generation_time_ms": generationTimeMs,
	}

	event := TelemetryEvent{
		TenantID:               tenantID,
		EventType:              ContextGeneration,
		Component:              component,
		Action:                 "context_generation",
		Level:                  Info,
		Metadata:               metadata,
		UserID:                 userID,
		ContextGenerationCount: &sourceCount,
	}

	tc.sendEvent(event)
}

// LogContextIngestion logs a context ingestion event
func (tc *TelemetryClient) LogContextIngestion(
	tenantID, component, ingestionType string,
	dataSizeBytes int,
	ingestionTimeMs float64,
	userID *string,
) {
	if !tc.enabled {
		return
	}

	metadata := map[string]interface{}{
		"ingestion_type":    ingestionType,
		"data_size_bytes":   dataSizeBytes,
		"ingestion_time_ms": ingestionTimeMs,
	}

	event := TelemetryEvent{
		TenantID:       tenantID,
		EventType:      ContextIngestion,
		Component:      component,
		Action:         "context_ingestion",
		Level:          Info,
		Metadata:       metadata,
		UserID:         userID,
		IngestionCount: intPtr(1),
	}

	tc.sendEvent(event)
}

// LogBillingEvent logs a billing-related telemetry event
func (tc *TelemetryClient) LogBillingEvent(
	tenantID, component, billingType string,
	metricValue float64,
	userID *string,
) {
	if !tc.enabled {
		return
	}

	metadata := map[string]interface{}{
		"billing_type":     billingType,
		"metric_timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	event := TelemetryEvent{
		TenantID:      tenantID,
		EventType:     BillingEvent,
		Component:     component,
		Action:        "billing_metric",
		Level:         Info,
		Metadata:      metadata,
		UserID:        userID,
		BillingMetric: &metricValue,
	}

	tc.sendEvent(event)
}

// LogSecurityEvent logs a security-related telemetry event
func (tc *TelemetryClient) LogSecurityEvent(
	tenantID, component, securityEventType, severity string,
	userID *string,
	additionalMetadata map[string]interface{},
) {
	if !tc.enabled {
		return
	}

	metadata := map[string]interface{}{
		"security_event_type": securityEventType,
		"severity":            severity,
		"timestamp":           time.Now().UTC().Format(time.RFC3339),
	}

	// Add additional metadata (sanitized)
	for key, value := range additionalMetadata {
		// Skip sensitive keys
		if !isSensitiveKey(key) {
			metadata[key] = value
		}
	}

	level := Info
	switch severity {
	case "medium":
		level = Warning
	case "high", "critical":
		level = Error
	}

	event := TelemetryEvent{
		TenantID:  tenantID,
		EventType: SecurityEvent,
		Component: component,
		Action:    "security_event",
		Level:     level,
		Metadata:  metadata,
		UserID:    userID,
	}

	tc.sendEvent(event)
}

// sendEvent sends a telemetry event to the business admin service
func (tc *TelemetryClient) sendEvent(event TelemetryEvent) {
	// Convert event to JSON
	eventData, err := json.Marshal(event)
	if err != nil {
		log.Printf("Failed to marshal telemetry event: %v", err)
		return
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", tc.businessAdminURL+"/telemetry/events", bytes.NewBuffer(eventData))
	if err != nil {
		log.Printf("Failed to create telemetry request: %v", err)
		return
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	if tc.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+tc.apiKey)
	}

	// Send request
	resp, err := tc.httpClient.Do(req)
	if err != nil {
		log.Printf("Failed to send telemetry event: %v", err)
		return
	}
	defer resp.Body.Close()

	// Check response
	if resp.StatusCode != http.StatusOK {
		log.Printf("Telemetry request failed with status: %d", resp.StatusCode)
		return
	}

	log.Printf("Telemetry event sent successfully: %s", event.EventType)
}

// isSensitiveKey checks if a key contains sensitive information
func isSensitiveKey(key string) bool {
	sensitiveKeys := []string{
		"password", "token", "secret", "key", "credential",
		"email", "phone", "ssn", "personal_data", "internal_data",
	}

	keyLower := strings.ToLower(key)
	for _, sensitive := range sensitiveKeys {
		if strings.Contains(keyLower, sensitive) {
			return true
		}
	}
	return false
}

// Helper function to get pointer to int
func intPtr(i int) *int {
	return &i
}
