package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

// OPALPIPService handles PIP data synchronization via OPAL
type OPALPIPService struct {
	httpClient *http.Client
	config     *OPALPIPConfig
}

// OPALPIPConfig configuration for OPAL PIP service
type OPALPIPConfig struct {
	OPALServerURL string
	TenantID      string
	APIKey        string
	BouncerID     string // Bouncer identifier for environment-aware filtering
	Environment   string // sandbox or production
	SyncInterval  time.Duration
	CacheTTL      time.Duration
	EncryptionKey string
}

// PIPConnection represents a PIP connection configuration
type PIPConnection struct {
	ID                 string                 `json:"id"`
	Name               string                 `json:"name"`
	Type               string                 `json:"type"`
	Provider           string                 `json:"provider"`
	Endpoint           string                 `json:"endpoint"`
	SandboxEndpoint    string                 `json:"sandbox_endpoint,omitempty"`    // Environment-specific endpoint
	ProductionEndpoint string                 `json:"production_endpoint,omitempty"` // Environment-specific endpoint
	Environment        string                 `json:"environment"`                   // sandbox, production, both
	Credentials        map[string]interface{} `json:"credentials"`
	SyncEnabled        bool                   `json:"sync_enabled"`
	SyncFrequency      int                    `json:"sync_frequency"`
	HealthCheckURL     string                 `json:"health_check_url"`
	AttributeMappings  []AttributeMapping     `json:"attribute_mappings"`
	CacheStrategy      CacheStrategy          `json:"cache_strategy"`
}

// AttributeMapping represents attribute mapping configuration
type AttributeMapping struct {
	SourceAttribute    string                 `json:"source_attribute"`
	TargetAttribute    string                 `json:"target_attribute"`
	TransformationRule map[string]interface{} `json:"transformation_rule"`
	IsRequired         bool                   `json:"is_required"`
	IsSensitive        bool                   `json:"is_sensitive"`
	DataType           string                 `json:"data_type"`
	CacheTTL           int                    `json:"cache_ttl"`
}

// CacheStrategy defines caching strategy for different data types
type CacheStrategy struct {
	SensitiveDataTTL  int  `json:"sensitive_data_ttl"`
	PublicDataTTL     int  `json:"public_data_ttl"`
	InternalDataTTL   int  `json:"internal_data_ttl"`
	EncryptionEnabled bool `json:"encryption_enabled"`
	AuditLogging      bool `json:"audit_logging"`
}

// SensitiveAttribute represents a sensitive attribute with metadata
type SensitiveAttribute struct {
	Name        string                 `json:"name"`
	Value       interface{}            `json:"value"`
	Sensitivity string                 `json:"sensitivity"`
	IsEncrypted bool                   `json:"is_encrypted"`
	CacheTTL    int                    `json:"cache_ttl"`
	LastUpdated time.Time              `json:"last_updated"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// OPALDataSource represents an OPAL data source configuration
type OPALDataSource struct {
	Name         string                 `json:"name"`
	URL          string                 `json:"url"`
	Topics       []string               `json:"topics"`
	Dependencies []string               `json:"dependencies"`
	Config       map[string]interface{} `json:"config"`
}

// NewOPALPIPService creates a new OPAL PIP service
func NewOPALPIPService(config *OPALPIPConfig) *OPALPIPService {
	// Initialize HTTP client
	httpClient := &http.Client{
		Timeout: 30 * time.Second,
	}

	return &OPALPIPService{
		httpClient: httpClient,
		config:     config,
	}
}

// SyncPIPConnection syncs a PIP connection configuration to OPAL
func (s *OPALPIPService) SyncPIPConnection(connection *PIPConnection) error {
	log.Printf("OPAL_PIP: Syncing connection %s to OPAL", connection.Name)

	// Create OPAL data source configuration
	dataSource := &OPALDataSource{
		Name: fmt.Sprintf("pip_%s", connection.ID),
		URL:  connection.Endpoint,
		Topics: []string{
			fmt.Sprintf("pip_%s_attributes", connection.ID),
		},
		Dependencies: []string{},
		Config: map[string]interface{}{
			"connection_type":    connection.Type,
			"provider":           connection.Provider,
			"credentials":        connection.Credentials,
			"sync_enabled":       connection.SyncEnabled,
			"sync_frequency":     connection.SyncFrequency,
			"health_check_url":   connection.HealthCheckURL,
			"attribute_mappings": connection.AttributeMappings,
			"cache_strategy":     connection.CacheStrategy,
		},
	}

	// Register data source with OPAL
	err := s.registerDataSource(dataSource)
	if err != nil {
		return fmt.Errorf("failed to register data source: %w", err)
	}

	// Start data synchronization if enabled
	if connection.SyncEnabled {
		err = s.startDataSync(connection)
		if err != nil {
			return fmt.Errorf("failed to start data sync: %w", err)
		}
	}

	log.Printf("OPAL_PIP: Successfully synced connection %s", connection.Name)
	return nil
}

// registerDataSource registers a data source with OPAL
func (s *OPALPIPService) registerDataSource(dataSource *OPALDataSource) error {
	// Create OPAL data source configuration
	config := map[string]interface{}{
		"name":         dataSource.Name,
		"url":          dataSource.URL,
		"topics":       dataSource.Topics,
		"dependencies": dataSource.Dependencies,
		"config":       dataSource.Config,
	}

	// Make HTTP request to OPAL server
	url := fmt.Sprintf("%s/api/v1/data-sources", s.config.OPALServerURL)
	jsonData, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)
	req.Header.Set("X-Tenant-ID", s.config.TenantID)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to register data source: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("OPAL server returned status %d", resp.StatusCode)
	}

	return nil
}

// startDataSync starts data synchronization for a PIP connection
func (s *OPALPIPService) startDataSync(connection *PIPConnection) error {
	log.Printf("OPAL_PIP: Starting data sync for connection %s", connection.Name)

	// Create sync configuration
	syncConfig := map[string]interface{}{
		"data_source": fmt.Sprintf("pip_%s", connection.ID),
		"interval":    connection.SyncFrequency,
		"topics":      []string{fmt.Sprintf("pip_%s_attributes", connection.ID)},
	}

	// Start synchronization via HTTP
	url := fmt.Sprintf("%s/api/v1/sync/start", s.config.OPALServerURL)
	jsonData, err := json.Marshal(syncConfig)
	if err != nil {
		return fmt.Errorf("failed to marshal sync config: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)
	req.Header.Set("X-Tenant-ID", s.config.TenantID)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to start sync: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("OPAL server returned status %d", resp.StatusCode)
	}

	return nil
}

// FetchSensitiveAttributes fetches sensitive attributes via OPAL
func (s *OPALPIPService) FetchSensitiveAttributes(connectionID string, attributes []string, userID string, requestID string) (map[string]*SensitiveAttribute, error) {
	log.Printf("OPAL_PIP: Fetching sensitive attributes for connection %s", connectionID)

	// Create fetch request
	request := map[string]interface{}{
		"data_source": fmt.Sprintf("pip_%s", connectionID),
		"topics":      []string{fmt.Sprintf("pip_%s_attributes", connectionID)},
		"attributes":  attributes,
		"user_id":     userID,
		"request_id":  requestID,
	}

	// Fetch data via HTTP
	url := fmt.Sprintf("%s/api/v1/data/fetch", s.config.OPALServerURL)
	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)
	req.Header.Set("X-Tenant-ID", s.config.TenantID)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OPAL server returned status %d", resp.StatusCode)
	}

	var response map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Process response and create sensitive attributes
	result := make(map[string]*SensitiveAttribute)
	if data, ok := response["data"].(map[string]interface{}); ok {
		for attrName, attrData := range data {
			sensitiveAttr := &SensitiveAttribute{
				Name:        attrName,
				Value:       attrData,
				Sensitivity: s.determineSensitivity(attrName, attrData),
				IsEncrypted: s.isSensitiveAttribute(attrName),
				CacheTTL:    s.getCacheTTL(attrName),
				LastUpdated: time.Now(),
				Metadata: map[string]interface{}{
					"connection_id": connectionID,
					"user_id":       userID,
					"request_id":    requestID,
					"fetched_at":    time.Now(),
				},
			}

			// Encrypt sensitive data if needed
			if sensitiveAttr.IsEncrypted {
				encryptedValue, err := s.encryptSensitiveData(attrData)
				if err != nil {
					log.Printf("OPAL_PIP: Failed to encrypt sensitive data: %v", err)
					continue
				}
				sensitiveAttr.Value = encryptedValue
			}

			result[attrName] = sensitiveAttr
		}
	}

	log.Printf("OPAL_PIP: Successfully fetched %d attributes", len(result))
	return result, nil
}

// determineSensitivity determines the sensitivity level of an attribute
func (s *OPALPIPService) determineSensitivity(attrName string, value interface{}) string {
	// Check attribute name patterns
	sensitivePatterns := []string{
		"password", "secret", "key", "token", "ssn", "social_security",
		"salary", "compensation", "benefits", "medical", "health",
		"phone", "address", "credit_card", "bank_account",
	}

	for _, pattern := range sensitivePatterns {
		if strings.Contains(attrName, pattern) {
			return "restricted"
		}
	}

	// Check value content for sensitive patterns
	if strValue, ok := value.(string); ok {
		if contains(strValue, "@") || contains(strValue, "password") || contains(strValue, "secret") {
			return "confidential"
		}
	}

	return "internal"
}

// isSensitiveAttribute checks if an attribute is sensitive
func (s *OPALPIPService) isSensitiveAttribute(attrName string) bool {
	sensitivePatterns := []string{
		"password", "secret", "key", "token", "ssn", "social_security",
		"salary", "compensation", "benefits", "medical", "health",
		"phone", "address", "credit_card", "bank_account",
	}

	for _, pattern := range sensitivePatterns {
		if strings.Contains(attrName, pattern) {
			return true
		}
	}

	return false
}

// getCacheTTL gets the cache TTL for an attribute based on sensitivity
func (s *OPALPIPService) getCacheTTL(attrName string) int {
	if s.isSensitiveAttribute(attrName) {
		return int(s.config.CacheTTL.Seconds() / 10) // Shorter TTL for sensitive data
	}
	return int(s.config.CacheTTL.Seconds())
}

// encryptSensitiveData encrypts sensitive data
func (s *OPALPIPService) encryptSensitiveData(data interface{}) (string, error) {
	// In production, use proper encryption
	// For now, just return a placeholder
	return fmt.Sprintf("[ENCRYPTED:%v]", data), nil
}

// GetOPALStatus gets the current OPAL synchronization status
func (s *OPALPIPService) GetOPALStatus() (map[string]interface{}, error) {
	ctx := context.Background()

	// Get OPAL server status via HTTP
	url := fmt.Sprintf("%s/api/v1/status", s.config.OPALServerURL)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)
	req.Header.Set("X-Tenant-ID", s.config.TenantID)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get OPAL status: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OPAL server returned status %d", resp.StatusCode)
	}

	var status map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&status); err != nil {
		return nil, fmt.Errorf("failed to decode status: %w", err)
	}

	// Get data source status
	dsURL := fmt.Sprintf("%s/api/v1/data-sources", s.config.OPALServerURL)
	dsReq, err := http.NewRequest("GET", dsURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create data sources request: %w", err)
	}

	dsReq.Header.Set("Authorization", "Bearer "+s.config.APIKey)
	dsReq.Header.Set("X-Tenant-ID", s.config.TenantID)

	dsResp, err := s.httpClient.Do(dsReq)
	if err != nil {
		return nil, fmt.Errorf("failed to get data sources: %w", err)
	}
	defer dsResp.Body.Close()

	if dsResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OPAL server returned status %d for data sources", dsResp.StatusCode)
	}

	var dataSources map[string]interface{}
	if err := json.NewDecoder(dsResp.Body).Decode(&dataSources); err != nil {
		return nil, fmt.Errorf("failed to decode data sources: %w", err)
	}

	return map[string]interface{}{
		"opal_server_status": status,
		"data_sources_count": len(dataSources),
		"sync_enabled":       true,
		"last_sync":          time.Now(),
	}, nil
}

// ClearCache clears the cache for a specific connection
func (s *OPALPIPService) ClearCache(connectionID string) error {
	log.Printf("OPAL_PIP: Clearing cache for connection %s", connectionID)

	// Clear cache via HTTP
	url := fmt.Sprintf("%s/api/v1/cache/clear", s.config.OPALServerURL)
	request := map[string]interface{}{
		"connection_id": fmt.Sprintf("pip_%s", connectionID),
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)
	req.Header.Set("X-Tenant-ID", s.config.TenantID)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to clear cache: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("OPAL server returned status %d", resp.StatusCode)
	}

	return nil
}

// GetCacheStatistics gets cache statistics
func (s *OPALPIPService) GetCacheStatistics() (map[string]interface{}, error) {
	ctx := context.Background()

	// Get cache statistics via HTTP
	url := fmt.Sprintf("%s/api/v1/cache/statistics", s.config.OPALServerURL)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)
	req.Header.Set("X-Tenant-ID", s.config.TenantID)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get cache statistics: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OPAL server returned status %d", resp.StatusCode)
	}

	var stats map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return nil, fmt.Errorf("failed to decode statistics: %w", err)
	}

	return map[string]interface{}{
		"total_cached_attributes": stats["total_keys"],
		"cache_hit_rate":          stats["hit_rate"],
		"memory_usage":            stats["memory_usage"],
		"expired_entries":         stats["expired_keys"],
	}, nil
}

// StopSync stops data synchronization for a connection
func (s *OPALPIPService) StopSync(connectionID string) error {
	log.Printf("OPAL_PIP: Stopping sync for connection %s", connectionID)

	// Stop sync via HTTP
	url := fmt.Sprintf("%s/api/v1/sync/stop", s.config.OPALServerURL)
	request := map[string]interface{}{
		"connection_id": fmt.Sprintf("pip_%s", connectionID),
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)
	req.Header.Set("X-Tenant-ID", s.config.TenantID)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to stop sync: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("OPAL server returned status %d", resp.StatusCode)
	}

	return nil
}

// UpdateConnection updates a PIP connection configuration
func (s *OPALPIPService) UpdateConnection(connection *PIPConnection) error {
	log.Printf("OPAL_PIP: Updating connection %s", connection.Name)

	// Stop existing sync
	err := s.StopSync(connection.ID)
	if err != nil {
		log.Printf("OPAL_PIP: Warning - failed to stop existing sync: %v", err)
	}

	// Sync updated configuration
	err = s.SyncPIPConnection(connection)
	if err != nil {
		return fmt.Errorf("failed to sync updated connection: %w", err)
	}

	return nil
}

// RemoveConnection removes a PIP connection from OPAL
func (s *OPALPIPService) RemoveConnection(connectionID string) error {
	log.Printf("OPAL_PIP: Removing connection %s", connectionID)

	// Stop sync
	err := s.StopSync(connectionID)
	if err != nil {
		log.Printf("OPAL_PIP: Warning - failed to stop sync: %v", err)
	}

	// Remove data source via HTTP
	url := fmt.Sprintf("%s/api/v1/data-sources/pip_%s", s.config.OPALServerURL, connectionID)
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)
	req.Header.Set("X-Tenant-ID", s.config.TenantID)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to remove data source: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("OPAL server returned status %d", resp.StatusCode)
	}

	// Clear cache
	err = s.ClearCache(connectionID)
	if err != nil {
		log.Printf("OPAL_PIP: Warning - failed to clear cache: %v", err)
	}

	return nil
}

// Helper function to check if string contains substring (case insensitive)
func contains(s, substr string) bool {
	return len(s) >= len(substr) &&
		(s == substr ||
			(len(s) > len(substr) &&
				(s[:len(substr)] == substr ||
					s[len(s)-len(substr):] == substr ||
					containsSubstring(s, substr))))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
