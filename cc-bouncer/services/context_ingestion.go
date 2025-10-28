package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// ContextIngestionService handles context ingestion and enrichment
type ContextIngestionService struct {
	httpClient *http.Client
	config     *ContextIngestionConfig
}

// ContextIngestionConfig represents configuration for context ingestion
type ContextIngestionConfig struct {
	Enabled          bool                `json:"enabled"`
	MaxContextSize   int                 `json:"max_context_size"`
	TimeoutSeconds   int                 `json:"timeout_seconds"`
	AllowedSources   []string            `json:"allowed_sources"`
	PermissionLevels map[string]string   `json:"permission_levels"`
	DataSources      []ContextDataSource `json:"data_sources"`
	IngestionRules   []IngestionRule     `json:"ingestion_rules"`
	SecurityPolicies []SecurityPolicy    `json:"security_policies"`
}

// ContextDataSource represents a data source for context ingestion
type ContextDataSource struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Type        string                 `json:"type"` // api, database, file, stream
	URL         string                 `json:"url"`
	AuthType    string                 `json:"auth_type"` // none, basic, bearer, oauth2
	Credentials map[string]interface{} `json:"credentials"`
	Permissions []string               `json:"permissions"`
	RateLimit   int                    `json:"rate_limit"` // requests per minute
	Timeout     int                    `json:"timeout"`
	Enabled     bool                   `json:"enabled"`
}

// IngestionRule represents a rule for context ingestion
type IngestionRule struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Source      string                 `json:"source"`
	Target      string                 `json:"target"`
	Conditions  map[string]interface{} `json:"conditions"`
	Transform   map[string]interface{} `json:"transform"`
	Permissions []string               `json:"permissions"`
	Priority    int                    `json:"priority"`
	Enabled     bool                   `json:"enabled"`
}

// SecurityPolicy represents a security policy for context ingestion
type SecurityPolicy struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Rules       []SecurityRule `json:"rules"`
	Permissions []string       `json:"permissions"`
	Priority    int            `json:"priority"`
	Enabled     bool           `json:"enabled"`
}

// SecurityRule represents a security rule
type SecurityRule struct {
	Type        string                 `json:"type"` // allow, deny, mask, encrypt
	Condition   map[string]interface{} `json:"condition"`
	Action      map[string]interface{} `json:"action"`
	Permissions []string               `json:"permissions"`
}

// ContextRequest represents a context ingestion request
type ContextRequest struct {
	User        User                   `json:"user"`
	Resource    Resource               `json:"resource"`
	Action      Action                 `json:"action"`
	Context     map[string]interface{} `json:"context"`
	Sources     []string               `json:"sources"`
	Permissions []string               `json:"permissions"`
	RequestID   string                 `json:"request_id"`
	Timestamp   time.Time              `json:"timestamp"`
}

// ContextResponse represents a context ingestion response
type ContextResponse struct {
	RequestID     string                 `json:"request_id"`
	Context       map[string]interface{} `json:"context"`
	Sources       []ContextSource        `json:"sources"`
	Permissions   []string               `json:"permissions"`
	SecurityLevel string                 `json:"security_level"`
	Metadata      map[string]interface{} `json:"metadata"`
	Timestamp     time.Time              `json:"timestamp"`
}

// ContextSource represents a context source
type ContextSource struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Type        string                 `json:"type"`
	Data        map[string]interface{} `json:"data"`
	Permissions []string               `json:"permissions"`
	Security    map[string]interface{} `json:"security"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// NewContextIngestionService creates a new context ingestion service
func NewContextIngestionService(config *ContextIngestionConfig) *ContextIngestionService {
	return &ContextIngestionService{
		httpClient: &http.Client{
			Timeout: time.Duration(config.TimeoutSeconds) * time.Second,
		},
		config: config,
	}
}

// IngestContext performs context ingestion based on the request
func (c *ContextIngestionService) IngestContext(request ContextRequest) (*ContextResponse, error) {
	if !c.config.Enabled {
		return &ContextResponse{
			RequestID: request.RequestID,
			Context:   request.Context,
			Sources:   []ContextSource{},
			Metadata:  map[string]interface{}{"ingestion_enabled": false},
			Timestamp: time.Now(),
		}, nil
	}

	// Validate permissions
	if err := c.validatePermissions(request); err != nil {
		return nil, fmt.Errorf("permission validation failed: %w", err)
	}

	// Apply security policies
	secureRequest, err := c.applySecurityPolicies(request)
	if err != nil {
		return nil, fmt.Errorf("security policy application failed: %w", err)
	}

	// Ingest from sources
	sources, err := c.ingestFromSources(secureRequest)
	if err != nil {
		return nil, fmt.Errorf("source ingestion failed: %w", err)
	}

	// Apply ingestion rules
	enrichedContext, err := c.applyIngestionRules(secureRequest, sources)
	if err != nil {
		return nil, fmt.Errorf("ingestion rule application failed: %w", err)
	}

	// Determine security level
	securityLevel := c.determineSecurityLevel(secureRequest, sources)

	response := &ContextResponse{
		RequestID:     request.RequestID,
		Context:       enrichedContext,
		Sources:       sources,
		Permissions:   request.Permissions,
		SecurityLevel: securityLevel,
		Metadata: map[string]interface{}{
			"ingestion_enabled": true,
			"sources_count":     len(sources),
			"rules_applied":     len(c.config.IngestionRules),
		},
		Timestamp: time.Now(),
	}

	logrus.WithFields(logrus.Fields{
		"request_id":     request.RequestID,
		"sources_count":  len(sources),
		"security_level": securityLevel,
	}).Info("🔍 CONTEXT: Context ingestion completed")

	return response, nil
}

// validatePermissions validates user permissions for context ingestion
func (c *ContextIngestionService) validatePermissions(request ContextRequest) error {
	// Check if user has required permissions
	requiredPermissions := []string{"context.ingest", "context.read"}

	for _, permission := range requiredPermissions {
		if !c.hasPermission(request.User, permission) {
			return fmt.Errorf("insufficient permissions: %s required", permission)
		}
	}

	// Check source-specific permissions
	for _, source := range request.Sources {
		sourcePermission := fmt.Sprintf("context.source.%s", source)
		if !c.hasPermission(request.User, sourcePermission) {
			return fmt.Errorf("insufficient permissions for source: %s", source)
		}
	}

	return nil
}

// hasPermission checks if user has a specific permission
func (c *ContextIngestionService) hasPermission(user User, permission string) bool {
	// Check user roles
	for _, role := range user.Roles {
		if c.roleHasPermission(role, permission) {
			return true
		}
	}

	// Check user attributes
	if user.Attributes != nil {
		if permissions, ok := user.Attributes["permissions"].([]interface{}); ok {
			for _, p := range permissions {
				if p == permission {
					return true
				}
			}
		}
	}

	return false
}

// roleHasPermission checks if a role has a specific permission
func (c *ContextIngestionService) roleHasPermission(role, permission string) bool {
	// Define role-based permissions
	rolePermissions := map[string][]string{
		"admin": {
			"context.ingest", "context.read", "context.write", "context.delete",
			"context.source.*", "context.security.*", "context.rule.*",
		},
		"developer": {
			"context.ingest", "context.read", "context.source.api", "context.source.database",
		},
		"analyst": {
			"context.read", "context.source.database", "context.source.file",
		},
		"viewer": {
			"context.read",
		},
	}

	if permissions, exists := rolePermissions[role]; exists {
		for _, p := range permissions {
			if p == permission || strings.HasSuffix(p, ".*") {
				return true
			}
		}
	}

	return false
}

// applySecurityPolicies applies security policies to the request
func (c *ContextIngestionService) applySecurityPolicies(request ContextRequest) (ContextRequest, error) {
	secureRequest := request

	for _, policy := range c.config.SecurityPolicies {
		if !policy.Enabled {
			continue
		}

		// Check if policy applies to this request
		if !c.policyApplies(policy, request) {
			continue
		}

		// Apply security rules
		for _, rule := range policy.Rules {
			switch rule.Type {
			case "allow":
				if !c.evaluateCondition(rule.Condition, request) {
					return secureRequest, fmt.Errorf("security policy denied: %s", policy.Name)
				}
			case "deny":
				if c.evaluateCondition(rule.Condition, request) {
					return secureRequest, fmt.Errorf("security policy denied: %s", policy.Name)
				}
			case "mask":
				secureRequest = c.applyMasking(secureRequest, rule)
			case "encrypt":
				secureRequest = c.applyEncryption(secureRequest, rule)
			}
		}
	}

	return secureRequest, nil
}

// policyApplies checks if a security policy applies to the request
func (c *ContextIngestionService) policyApplies(policy SecurityPolicy, request ContextRequest) bool {
	// Check if user has required permissions for this policy
	for _, permission := range policy.Permissions {
		if !c.hasPermission(request.User, permission) {
			return false
		}
	}

	return true
}

// evaluateCondition evaluates a security rule condition
func (c *ContextIngestionService) evaluateCondition(condition map[string]interface{}, request ContextRequest) bool {
	// Simple condition evaluation (would be more sophisticated in production)
	if field, ok := condition["field"].(string); ok {
		if value, ok := condition["value"]; ok {
			switch field {
			case "user.role":
				for _, role := range request.User.Roles {
					if role == value {
						return true
					}
				}
			case "resource.type":
				return request.Resource.Type == value
			case "action.name":
				return request.Action.Name == value
			}
		}
	}

	return false
}

// applyMasking applies data masking to the request
func (c *ContextIngestionService) applyMasking(request ContextRequest, rule SecurityRule) ContextRequest {
	// Apply masking based on rule configuration
	if fields, ok := rule.Action["fields"].([]interface{}); ok {
		for _, field := range fields {
			if fieldStr, ok := field.(string); ok {
				c.maskField(&request.Context, fieldStr)
			}
		}
	}

	return request
}

// applyEncryption applies encryption to the request
func (c *ContextIngestionService) applyEncryption(request ContextRequest, rule SecurityRule) ContextRequest {
	// Apply encryption based on rule configuration
	if fields, ok := rule.Action["fields"].([]interface{}); ok {
		for _, field := range fields {
			if fieldStr, ok := field.(string); ok {
				c.encryptField(&request.Context, fieldStr)
			}
		}
	}

	return request
}

// maskField masks a field in the context
func (c *ContextIngestionService) maskField(context *map[string]interface{}, field string) {
	if value, exists := (*context)[field]; exists {
		if str, ok := value.(string); ok {
			if len(str) > 4 {
				(*context)[field] = str[:2] + "***" + str[len(str)-2:]
			} else {
				(*context)[field] = "***"
			}
		}
	}
}

// encryptField encrypts a field in the context
func (c *ContextIngestionService) encryptField(context *map[string]interface{}, field string) {
	if value, exists := (*context)[field]; exists {
		// Simple encryption (would use proper encryption in production)
		if str, ok := value.(string); ok {
			(*context)[field] = "encrypted:" + str
		}
	}
}

// ingestFromSources ingests context from configured sources
func (c *ContextIngestionService) ingestFromSources(request ContextRequest) ([]ContextSource, error) {
	var sources []ContextSource

	for _, sourceID := range request.Sources {
		source, err := c.findDataSource(sourceID)
		if err != nil {
			logrus.WithError(err).Warnf("Source not found: %s", sourceID)
			continue
		}

		if !source.Enabled {
			continue
		}

		// Check permissions for this source
		if !c.hasSourcePermission(request.User, *source) {
			logrus.Warnf("Insufficient permissions for source: %s", sourceID)
			continue
		}

		// Ingest data from source
		data, err := c.ingestFromSource(*source, request)
		if err != nil {
			logrus.WithError(err).Warnf("Failed to ingest from source: %s", sourceID)
			continue
		}

		sources = append(sources, ContextSource{
			ID:          source.ID,
			Name:        source.Name,
			Type:        source.Type,
			Data:        data,
			Permissions: source.Permissions,
			Security:    c.getSourceSecurity(*source),
			Metadata: map[string]interface{}{
				"ingested_at": time.Now(),
				"source_url":  source.URL,
			},
		})
	}

	return sources, nil
}

// findDataSource finds a data source by ID
func (c *ContextIngestionService) findDataSource(sourceID string) (*ContextDataSource, error) {
	for _, source := range c.config.DataSources {
		if source.ID == sourceID {
			return &source, nil
		}
	}
	return nil, fmt.Errorf("data source not found: %s", sourceID)
}

// hasSourcePermission checks if user has permission for a source
func (c *ContextIngestionService) hasSourcePermission(user User, source ContextDataSource) bool {
	for _, permission := range source.Permissions {
		if !c.hasPermission(user, permission) {
			return false
		}
	}
	return true
}

// ingestFromSource ingests data from a specific source
func (c *ContextIngestionService) ingestFromSource(source ContextDataSource, request ContextRequest) (map[string]interface{}, error) {
	switch source.Type {
	case "api":
		return c.ingestFromAPI(source, request)
	case "database":
		return c.ingestFromDatabase(source, request)
	case "file":
		return c.ingestFromFile(source, request)
	case "stream":
		return c.ingestFromStream(source, request)
	default:
		return nil, fmt.Errorf("unsupported source type: %s", source.Type)
	}
}

// ingestFromAPI ingests data from an API source
func (c *ContextIngestionService) ingestFromAPI(source ContextDataSource, request ContextRequest) (map[string]interface{}, error) {
	req, err := http.NewRequest("GET", source.URL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication
	if err := c.addAuthentication(req, source); err != nil {
		return nil, fmt.Errorf("failed to add authentication: %w", err)
	}

	// Add request headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Request-ID", request.RequestID)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return data, nil
}

// addAuthentication adds authentication to the request
func (c *ContextIngestionService) addAuthentication(req *http.Request, source ContextDataSource) error {
	switch source.AuthType {
	case "basic":
		if username, ok := source.Credentials["username"].(string); ok {
			if password, ok := source.Credentials["password"].(string); ok {
				req.SetBasicAuth(username, password)
			}
		}
	case "bearer":
		if token, ok := source.Credentials["token"].(string); ok {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	case "oauth2":
		if token, ok := source.Credentials["access_token"].(string); ok {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	}
	return nil
}

// ingestFromDatabase ingests data from a database source
func (c *ContextIngestionService) ingestFromDatabase(source ContextDataSource, _ ContextRequest) (map[string]interface{}, error) {
	// Database ingestion would be implemented here
	// For now, return mock data
	return map[string]interface{}{
		"database": source.Name,
		"query":    "SELECT * FROM context_data",
		"results":  []interface{}{},
	}, nil
}

// ingestFromFile ingests data from a file source
func (c *ContextIngestionService) ingestFromFile(source ContextDataSource, _ ContextRequest) (map[string]interface{}, error) {
	// File ingestion would be implemented here
	// For now, return mock data
	return map[string]interface{}{
		"file":     source.Name,
		"path":     source.URL,
		"contents": "file contents",
	}, nil
}

// ingestFromStream ingests data from a stream source
func (c *ContextIngestionService) ingestFromStream(source ContextDataSource, _ ContextRequest) (map[string]interface{}, error) {
	// Stream ingestion would be implemented here
	// For now, return mock data
	return map[string]interface{}{
		"stream":   source.Name,
		"url":      source.URL,
		"messages": []interface{}{},
	}, nil
}

// getSourceSecurity returns security configuration for a source
func (c *ContextIngestionService) getSourceSecurity(source ContextDataSource) map[string]interface{} {
	return map[string]interface{}{
		"auth_type":   source.AuthType,
		"rate_limit":  source.RateLimit,
		"timeout":     source.Timeout,
		"permissions": source.Permissions,
	}
}

// applyIngestionRules applies ingestion rules to enrich context
func (c *ContextIngestionService) applyIngestionRules(request ContextRequest, sources []ContextSource) (map[string]interface{}, error) {
	enrichedContext := make(map[string]interface{})

	// Copy original context
	for k, v := range request.Context {
		enrichedContext[k] = v
	}

	// Apply ingestion rules
	for _, rule := range c.config.IngestionRules {
		if !rule.Enabled {
			continue
		}

		// Check if rule applies
		if !c.ruleApplies(rule, request) {
			continue
		}

		// Apply rule transformation
		transformedData, err := c.applyRuleTransformation(rule, sources)
		if err != nil {
			logrus.WithError(err).Warnf("Failed to apply rule: %s", rule.Name)
			continue
		}

		// Merge transformed data into context
		for k, v := range transformedData {
			enrichedContext[k] = v
		}
	}

	return enrichedContext, nil
}

// ruleApplies checks if an ingestion rule applies to the request
func (c *ContextIngestionService) ruleApplies(rule IngestionRule, request ContextRequest) bool {
	// Check permissions
	for _, permission := range rule.Permissions {
		if !c.hasPermission(request.User, permission) {
			return false
		}
	}

	// Check conditions
	return c.evaluateRuleConditions(rule.Conditions, request)
}

// evaluateRuleConditions evaluates rule conditions
func (c *ContextIngestionService) evaluateRuleConditions(conditions map[string]interface{}, request ContextRequest) bool {
	// Simple condition evaluation
	for field, expectedValue := range conditions {
		switch field {
		case "user.role":
			if roles, ok := expectedValue.([]interface{}); ok {
				for _, role := range roles {
					for _, userRole := range request.User.Roles {
						if userRole == role {
							return true
						}
					}
				}
			}
		case "resource.type":
			if request.Resource.Type == expectedValue {
				return true
			}
		case "action.name":
			if request.Action.Name == expectedValue {
				return true
			}
		}
	}

	return false
}

// applyRuleTransformation applies rule transformation
func (c *ContextIngestionService) applyRuleTransformation(rule IngestionRule, sources []ContextSource) (map[string]interface{}, error) {
	transformedData := make(map[string]interface{})

	// Find source data
	var sourceData map[string]interface{}
	for _, source := range sources {
		if source.ID == rule.Source {
			sourceData = source.Data
			break
		}
	}

	if sourceData == nil {
		return transformedData, nil
	}

	// Apply transformation based on rule configuration
	if transform, ok := rule.Transform["mapping"].(map[string]interface{}); ok {
		for targetField, sourceField := range transform {
			if sourceFieldStr, ok := sourceField.(string); ok {
				if value, exists := sourceData[sourceFieldStr]; exists {
					transformedData[targetField] = value
				}
			}
		}
	}

	return transformedData, nil
}

// determineSecurityLevel determines the security level for the context
func (c *ContextIngestionService) determineSecurityLevel(request ContextRequest, sources []ContextSource) string {
	// Determine security level based on user roles and data sensitivity
	userRoles := request.User.Roles
	dataSensitivity := "low"

	// Check for sensitive data in sources
	for _, source := range sources {
		if c.isSensitiveSource(source) {
			dataSensitivity = "high"
			break
		}
	}

	// Determine security level
	if containsString(userRoles, "admin") {
		return "admin"
	} else if containsString(userRoles, "developer") && dataSensitivity == "low" {
		return "developer"
	} else if containsString(userRoles, "analyst") {
		return "analyst"
	} else {
		return "viewer"
	}
}

// isSensitiveSource checks if a source contains sensitive data
func (c *ContextIngestionService) isSensitiveSource(source ContextSource) bool {
	// Check for sensitive data indicators
	sensitiveFields := []string{"password", "token", "secret", "key", "ssn", "credit_card"}

	for _, field := range sensitiveFields {
		if _, exists := source.Data[field]; exists {
			return true
		}
	}

	return false
}

// containsString checks if a slice contains a string
func containsString(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// GetConfiguration returns the current configuration
func (c *ContextIngestionService) GetConfiguration() *ContextIngestionConfig {
	return c.config
}

// UpdateConfiguration updates the configuration
func (c *ContextIngestionService) UpdateConfiguration(config *ContextIngestionConfig) error {
	c.config = config
	c.httpClient.Timeout = time.Duration(config.TimeoutSeconds) * time.Second

	logrus.Info("🔧 CONTEXT: Configuration updated")
	return nil
}

// HealthCheck checks the health of the context ingestion service
func (c *ContextIngestionService) HealthCheck() error {
	// Check if service is enabled
	if !c.config.Enabled {
		return fmt.Errorf("context ingestion service is disabled")
	}

	// Check data sources
	for _, source := range c.config.DataSources {
		if !source.Enabled {
			continue
		}

		// Test source connectivity
		if err := c.testSourceConnectivity(source); err != nil {
			return fmt.Errorf("source connectivity test failed for %s: %w", source.ID, err)
		}
	}

	return nil
}

// testSourceConnectivity tests connectivity to a data source
func (c *ContextIngestionService) testSourceConnectivity(source ContextDataSource) error {
	switch source.Type {
	case "api":
		req, err := http.NewRequest("GET", source.URL, nil)
		if err != nil {
			return err
		}

		if err := c.addAuthentication(req, source); err != nil {
			return err
		}

		resp, err := c.httpClient.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 400 {
			return fmt.Errorf("source returned status %d", resp.StatusCode)
		}

	case "database":
		// Database connectivity test would be implemented here
		return nil

	case "file":
		// File accessibility test would be implemented here
		return nil

	case "stream":
		// Stream connectivity test would be implemented here
		return nil
	}

	return nil
}
