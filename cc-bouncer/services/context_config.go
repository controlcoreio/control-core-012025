package services

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/sirupsen/logrus"
)

// ContextConfigManager manages context ingestion configuration
type ContextConfigManager struct {
	configPath string
	config     *ContextIngestionConfig
}

// NewContextConfigManager creates a new context configuration manager
func NewContextConfigManager(configPath string) *ContextConfigManager {
	return &ContextConfigManager{
		configPath: configPath,
		config:     getDefaultContextConfig(),
	}
}

// LoadConfiguration loads configuration from file
func (m *ContextConfigManager) LoadConfiguration() error {
	// Check if config file exists
	if _, err := os.Stat(m.configPath); os.IsNotExist(err) {
		// Create default configuration file
		if err := m.SaveConfiguration(); err != nil {
			return fmt.Errorf("failed to create default configuration: %w", err)
		}
		logrus.Info("🔧 CONTEXT: Created default configuration file")
		return nil
	}

	// Load configuration from file
	data, err := os.ReadFile(m.configPath)
	if err != nil {
		return fmt.Errorf("failed to read configuration file: %w", err)
	}

	var config ContextIngestionConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return fmt.Errorf("failed to parse configuration file: %w", err)
	}

	m.config = &config
	logrus.Info("🔧 CONTEXT: Configuration loaded from file")

	return nil
}

// SaveConfiguration saves configuration to file
func (m *ContextConfigManager) SaveConfiguration() error {
	// Ensure directory exists
	dir := filepath.Dir(m.configPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create configuration directory: %w", err)
	}

	// Marshal configuration to JSON
	data, err := json.MarshalIndent(m.config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal configuration: %w", err)
	}

	// Write to file
	if err := os.WriteFile(m.configPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write configuration file: %w", err)
	}

	logrus.Info("🔧 CONTEXT: Configuration saved to file")
	return nil
}

// GetConfiguration returns the current configuration
func (m *ContextConfigManager) GetConfiguration() *ContextIngestionConfig {
	return m.config
}

// UpdateConfiguration updates the configuration
func (m *ContextConfigManager) UpdateConfiguration(config *ContextIngestionConfig) error {
	m.config = config
	return m.SaveConfiguration()
}

// AddDataSource adds a new data source
func (m *ContextConfigManager) AddDataSource(source ContextDataSource) error {
	// Check if source already exists
	for i, existingSource := range m.config.DataSources {
		if existingSource.ID == source.ID {
			m.config.DataSources[i] = source
			logrus.WithField("source_id", source.ID).Info("🔧 CONTEXT: Data source updated")
			return m.SaveConfiguration()
		}
	}

	// Add new source
	m.config.DataSources = append(m.config.DataSources, source)
	logrus.WithField("source_id", source.ID).Info("🔧 CONTEXT: Data source added")

	return m.SaveConfiguration()
}

// RemoveDataSource removes a data source
func (m *ContextConfigManager) RemoveDataSource(sourceID string) error {
	for i, source := range m.config.DataSources {
		if source.ID == sourceID {
			m.config.DataSources = append(m.config.DataSources[:i], m.config.DataSources[i+1:]...)
			logrus.WithField("source_id", sourceID).Info("🔧 CONTEXT: Data source removed")
			return m.SaveConfiguration()
		}
	}

	return fmt.Errorf("data source not found: %s", sourceID)
}

// AddIngestionRule adds a new ingestion rule
func (m *ContextConfigManager) AddIngestionRule(rule IngestionRule) error {
	// Check if rule already exists
	for i, existingRule := range m.config.IngestionRules {
		if existingRule.ID == rule.ID {
			m.config.IngestionRules[i] = rule
			logrus.WithField("rule_id", rule.ID).Info("🔧 CONTEXT: Ingestion rule updated")
			return m.SaveConfiguration()
		}
	}

	// Add new rule
	m.config.IngestionRules = append(m.config.IngestionRules, rule)
	logrus.WithField("rule_id", rule.ID).Info("🔧 CONTEXT: Ingestion rule added")

	return m.SaveConfiguration()
}

// RemoveIngestionRule removes an ingestion rule
func (m *ContextConfigManager) RemoveIngestionRule(ruleID string) error {
	for i, rule := range m.config.IngestionRules {
		if rule.ID == ruleID {
			m.config.IngestionRules = append(m.config.IngestionRules[:i], m.config.IngestionRules[i+1:]...)
			logrus.WithField("rule_id", ruleID).Info("🔧 CONTEXT: Ingestion rule removed")
			return m.SaveConfiguration()
		}
	}

	return fmt.Errorf("ingestion rule not found: %s", ruleID)
}

// AddSecurityPolicy adds a new security policy
func (m *ContextConfigManager) AddSecurityPolicy(policy SecurityPolicy) error {
	// Check if policy already exists
	for i, existingPolicy := range m.config.SecurityPolicies {
		if existingPolicy.ID == policy.ID {
			m.config.SecurityPolicies[i] = policy
			logrus.WithField("policy_id", policy.ID).Info("🔧 CONTEXT: Security policy updated")
			return m.SaveConfiguration()
		}
	}

	// Add new policy
	m.config.SecurityPolicies = append(m.config.SecurityPolicies, policy)
	logrus.WithField("policy_id", policy.ID).Info("🔧 CONTEXT: Security policy added")

	return m.SaveConfiguration()
}

// RemoveSecurityPolicy removes a security policy
func (m *ContextConfigManager) RemoveSecurityPolicy(policyID string) error {
	for i, policy := range m.config.SecurityPolicies {
		if policy.ID == policyID {
			m.config.SecurityPolicies = append(m.config.SecurityPolicies[:i], m.config.SecurityPolicies[i+1:]...)
			logrus.WithField("policy_id", policyID).Info("🔧 CONTEXT: Security policy removed")
			return m.SaveConfiguration()
		}
	}

	return fmt.Errorf("security policy not found: %s", policyID)
}

// ValidateConfiguration validates the configuration
func (m *ContextConfigManager) ValidateConfiguration() error {
	// Validate data sources
	for _, source := range m.config.DataSources {
		if err := m.validateDataSource(source); err != nil {
			return fmt.Errorf("invalid data source %s: %w", source.ID, err)
		}
	}

	// Validate ingestion rules
	for _, rule := range m.config.IngestionRules {
		if err := m.validateIngestionRule(rule); err != nil {
			return fmt.Errorf("invalid ingestion rule %s: %w", rule.ID, err)
		}
	}

	// Validate security policies
	for _, policy := range m.config.SecurityPolicies {
		if err := m.validateSecurityPolicy(policy); err != nil {
			return fmt.Errorf("invalid security policy %s: %w", policy.ID, err)
		}
	}

	return nil
}

// validateDataSource validates a data source
func (m *ContextConfigManager) validateDataSource(source ContextDataSource) error {
	if source.ID == "" {
		return fmt.Errorf("source ID is required")
	}

	if source.Name == "" {
		return fmt.Errorf("source name is required")
	}

	if source.URL == "" {
		return fmt.Errorf("source URL is required")
	}

	if source.Type == "" {
		return fmt.Errorf("source type is required")
	}

	// Validate source type
	validTypes := []string{"api", "database", "file", "stream"}
	if !containsStringInSlice(validTypes, source.Type) {
		return fmt.Errorf("invalid source type: %s", source.Type)
	}

	// Validate auth type
	validAuthTypes := []string{"none", "basic", "bearer", "oauth2"}
	if source.AuthType != "" && !containsStringInSlice(validAuthTypes, source.AuthType) {
		return fmt.Errorf("invalid auth type: %s", source.AuthType)
	}

	return nil
}

// validateIngestionRule validates an ingestion rule
func (m *ContextConfigManager) validateIngestionRule(rule IngestionRule) error {
	if rule.ID == "" {
		return fmt.Errorf("rule ID is required")
	}

	if rule.Name == "" {
		return fmt.Errorf("rule name is required")
	}

	if rule.Source == "" {
		return fmt.Errorf("rule source is required")
	}

	if rule.Target == "" {
		return fmt.Errorf("rule target is required")
	}

	// Validate that source exists
	sourceExists := false
	for _, source := range m.config.DataSources {
		if source.ID == rule.Source {
			sourceExists = true
			break
		}
	}

	if !sourceExists {
		return fmt.Errorf("source not found: %s", rule.Source)
	}

	return nil
}

// validateSecurityPolicy validates a security policy
func (m *ContextConfigManager) validateSecurityPolicy(policy SecurityPolicy) error {
	if policy.ID == "" {
		return fmt.Errorf("policy ID is required")
	}

	if policy.Name == "" {
		return fmt.Errorf("policy name is required")
	}

	if len(policy.Rules) == 0 {
		return fmt.Errorf("policy must have at least one rule")
	}

	// Validate rules
	for _, rule := range policy.Rules {
		if rule.Type == "" {
			return fmt.Errorf("rule type is required")
		}

		validTypes := []string{"allow", "deny", "mask", "encrypt"}
		if !containsStringInSlice(validTypes, rule.Type) {
			return fmt.Errorf("invalid rule type: %s", rule.Type)
		}
	}

	return nil
}

// getDefaultContextConfig returns the default configuration
func getDefaultContextConfig() *ContextIngestionConfig {
	return &ContextIngestionConfig{
		Enabled:        true,
		MaxContextSize: 1024 * 1024, // 1MB
		TimeoutSeconds: 30,
		AllowedSources: []string{"api", "database", "file", "stream"},
		PermissionLevels: map[string]string{
			"admin":     "full",
			"developer": "limited",
			"analyst":   "read_only",
			"viewer":    "view_only",
		},
		DataSources: []ContextDataSource{
			{
				ID:          "internal-api",
				Name:        "Internal API",
				Type:        "api",
				URL:         "http://localhost:8000/api/v1/context",
				AuthType:    "bearer",
				Credentials: map[string]interface{}{},
				Permissions: []string{"context.source.api"},
				RateLimit:   100,
				Timeout:     30,
				Enabled:     true,
			},
		},
		IngestionRules: []IngestionRule{
			{
				ID:          "user-context",
				Name:        "User Context Enrichment",
				Description: "Enriches context with user information",
				Source:      "internal-api",
				Target:      "user_context",
				Conditions: map[string]interface{}{
					"user.role": []string{"admin", "developer"},
				},
				Transform: map[string]interface{}{
					"mapping": map[string]interface{}{
						"user_profile":     "profile",
						"user_permissions": "permissions",
					},
				},
				Permissions: []string{"context.ingest", "context.read"},
				Priority:    1,
				Enabled:     true,
			},
		},
		SecurityPolicies: []SecurityPolicy{
			{
				ID:          "sensitive-data-protection",
				Name:        "Sensitive Data Protection",
				Description: "Protects sensitive data in context",
				Rules: []SecurityRule{
					{
						Type: "mask",
						Condition: map[string]interface{}{
							"field": "password",
						},
						Action: map[string]interface{}{
							"fields": []string{"password", "token", "secret"},
						},
						Permissions: []string{"context.security.mask"},
					},
				},
				Permissions: []string{"context.security.*"},
				Priority:    1,
				Enabled:     true,
			},
		},
	}
}

// containsStringInSlice checks if a slice contains a string
func containsStringInSlice(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// ContextPermissionManager manages context permissions
type ContextPermissionManager struct {
	permissions map[string][]string
}

// NewContextPermissionManager creates a new permission manager
func NewContextPermissionManager() *ContextPermissionManager {
	return &ContextPermissionManager{
		permissions: getDefaultPermissions(),
	}
}

// getDefaultPermissions returns the default permissions
func getDefaultPermissions() map[string][]string {
	return map[string][]string{
		"admin": {
			"context.ingest", "context.read", "context.write", "context.delete",
			"context.source.*", "context.security.*", "context.rule.*",
			"context.config.read", "context.config.write",
		},
		"developer": {
			"context.ingest", "context.read", "context.source.api", "context.source.database",
			"context.rule.read", "context.rule.write",
		},
		"analyst": {
			"context.read", "context.source.database", "context.source.file",
			"context.rule.read",
		},
		"viewer": {
			"context.read",
		},
	}
}

// HasPermission checks if a role has a specific permission
func (m *ContextPermissionManager) HasPermission(role, permission string) bool {
	if permissions, exists := m.permissions[role]; exists {
		for _, p := range permissions {
			if p == permission || (len(p) > 1 && p[len(p)-1] == '*' && permission[:len(p)-1] == p[:len(p)-1]) {
				return true
			}
		}
	}
	return false
}

// GetPermissions returns all permissions for a role
func (m *ContextPermissionManager) GetPermissions(role string) []string {
	if permissions, exists := m.permissions[role]; exists {
		return permissions
	}
	return []string{}
}

// AddPermission adds a permission to a role
func (m *ContextPermissionManager) AddPermission(role, permission string) {
	if permissions, exists := m.permissions[role]; exists {
		// Check if permission already exists
		for _, p := range permissions {
			if p == permission {
				return
			}
		}
		m.permissions[role] = append(permissions, permission)
	} else {
		m.permissions[role] = []string{permission}
	}
}

// RemovePermission removes a permission from a role
func (m *ContextPermissionManager) RemovePermission(role, permission string) {
	if permissions, exists := m.permissions[role]; exists {
		for i, p := range permissions {
			if p == permission {
				m.permissions[role] = append(permissions[:i], permissions[i+1:]...)
				break
			}
		}
	}
}

// ValidatePermission validates a permission string
func (m *ContextPermissionManager) ValidatePermission(permission string) error {
	if permission == "" {
		return fmt.Errorf("permission cannot be empty")
	}

	// Check for valid permission format
	validPrefixes := []string{
		"context.ingest", "context.read", "context.write", "context.delete",
		"context.source", "context.security", "context.rule", "context.config",
	}

	valid := false
	for _, prefix := range validPrefixes {
		if len(permission) >= len(prefix) && permission[:len(prefix)] == prefix {
			valid = true
			break
		}
	}

	if !valid {
		return fmt.Errorf("invalid permission format: %s", permission)
	}

	return nil
}
