package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
)

// OPALClient handles communication with OPAL server for policy and data synchronization
// Supports environment-aware policy distribution (sandbox/production)
type OPALClient struct {
	serverURL    string
	clientID     string
	clientSecret string
	bouncerID    string
	environment  string // sandbox or production
	httpClient   *http.Client
}

// NewOPALClient creates a new OPAL client
func NewOPALClient(serverURL string) *OPALClient {
	return &OPALClient{
		serverURL: serverURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SetCredentials sets the client credentials for OPAL authentication
func (c *OPALClient) SetCredentials(clientID, clientSecret string) {
	c.clientID = clientID
	c.clientSecret = clientSecret
}

// SetEnvironmentContext sets the bouncer ID and environment for intelligent filtering
// This enables Control Core to automatically send only relevant policies
func (c *OPALClient) SetEnvironmentContext(bouncerID, environment string) {
	c.bouncerID = bouncerID
	c.environment = environment

	logrus.WithFields(logrus.Fields{
		"bouncer_id":  bouncerID,
		"environment": environment,
	}).Info("🌍 OPAL: Environment context configured for intelligent policy filtering")
}

// PolicyBundle represents a policy bundle from OPAL
type PolicyBundle struct {
	ID          string                 `json:"id"`
	Version     string                 `json:"version"`
	Policies    []Policy               `json:"policies"`
	DataSources []DataSource           `json:"data_sources"`
	Metadata    map[string]interface{} `json:"metadata"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// Policy represents a single policy
type Policy struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Content   string                 `json:"content"`
	Language  string                 `json:"language"` // rego, cedar, etc.
	Version   string                 `json:"version"`
	Status    string                 `json:"status"` // active, inactive, draft
	Metadata  map[string]interface{} `json:"metadata"`
	CreatedAt time.Time              `json:"created_at"`
	UpdatedAt time.Time              `json:"updated_at"`
}

// DataSource represents a data source for policy evaluation
type DataSource struct {
	ID       string                 `json:"id"`
	Name     string                 `json:"name"`
	Type     string                 `json:"type"` // github, api, database, etc.
	URL      string                 `json:"url"`
	Config   map[string]interface{} `json:"config"`
	Status   string                 `json:"status"` // active, inactive, error
	LastSync time.Time              `json:"last_sync"`
	Metadata map[string]interface{} `json:"metadata"`
}

// FetchPolicyBundle fetches the latest policy bundle from OPAL server
// Intelligently filters policies based on bouncer's environment
func (c *OPALClient) FetchPolicyBundle() (*PolicyBundle, error) {
	// Use environment-aware endpoint if bouncer ID is set
	var url string
	if c.bouncerID != "" {
		// Control Core PAP provides environment-filtered policies per bouncer
		url = fmt.Sprintf("%s/opal/policies/%s", c.serverURL, c.bouncerID)
		logrus.WithFields(logrus.Fields{
			"bouncer_id":  c.bouncerID,
			"environment": c.environment,
		}).Info("📦 OPAL: Fetching environment-filtered policies")
	} else {
		// Fallback to generic bundle endpoint
		url = fmt.Sprintf("%s/api/v1/bundles/latest", c.serverURL)
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication headers
	req.Header.Set("Authorization", "Bearer "+c.clientSecret)
	req.Header.Set("X-Client-ID", c.clientID)
	req.Header.Set("X-Bouncer-ID", c.bouncerID)
	req.Header.Set("X-Environment", c.environment)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch policy bundle: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OPAL server returned status %d: %s", resp.StatusCode, string(body))
	}

	var bundle PolicyBundle
	if err := json.NewDecoder(resp.Body).Decode(&bundle); err != nil {
		return nil, fmt.Errorf("failed to decode policy bundle: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"bundle_id": bundle.ID,
		"version":   bundle.Version,
		"policies":  len(bundle.Policies),
		"sources":   len(bundle.DataSources),
	}).Info("📦 OPAL: Policy bundle fetched successfully")

	return &bundle, nil
}

// FetchDataSources fetches data sources from OPAL server
// Intelligently provides environment-specific data source endpoints
func (c *OPALClient) FetchDataSources() ([]DataSource, error) {
	// Use environment-aware endpoint if bouncer ID is set
	var url string
	if c.bouncerID != "" {
		// Control Core PAP provides environment-filtered data sources per bouncer
		url = fmt.Sprintf("%s/opal/data-sources/%s", c.serverURL, c.bouncerID)
		logrus.WithFields(logrus.Fields{
			"bouncer_id":  c.bouncerID,
			"environment": c.environment,
		}).Info("📊 OPAL: Fetching environment-specific data sources")
	} else {
		// Fallback to generic endpoint
		url = fmt.Sprintf("%s/api/v1/data-sources", c.serverURL)
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication and environment headers
	req.Header.Set("Authorization", "Bearer "+c.clientSecret)
	req.Header.Set("X-Client-ID", c.clientID)
	req.Header.Set("X-Bouncer-ID", c.bouncerID)
	req.Header.Set("X-Environment", c.environment)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch data sources: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OPAL server returned status %d: %s", resp.StatusCode, string(body))
	}

	var dataSources []DataSource
	if err := json.NewDecoder(resp.Body).Decode(&dataSources); err != nil {
		return nil, fmt.Errorf("failed to decode data sources: %w", err)
	}

	logrus.WithField("count", len(dataSources)).Info("📊 OPAL: Data sources fetched successfully")

	return dataSources, nil
}

// FetchDataFromSource fetches data from a specific data source
func (c *OPALClient) FetchDataFromSource(sourceID string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/v1/data-sources/%s/data", c.serverURL, sourceID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication headers
	req.Header.Set("Authorization", "Bearer "+c.clientSecret)
	req.Header.Set("X-Client-ID", c.clientID)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch data from source: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OPAL server returned status %d: %s", resp.StatusCode, string(body))
	}

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode data: %w", err)
	}

	logrus.WithField("source_id", sourceID).Info("📊 OPAL: Data fetched from source successfully")

	return data, nil
}

// RegisterBouncer registers the bouncer with OPAL server
func (c *OPALClient) RegisterBouncer(bouncerInfo map[string]interface{}) error {
	url := fmt.Sprintf("%s/api/v1/bouncers/register", c.serverURL)

	jsonData, err := json.Marshal(bouncerInfo)
	if err != nil {
		return fmt.Errorf("failed to marshal bouncer info: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication headers
	req.Header.Set("Authorization", "Bearer "+c.clientSecret)
	req.Header.Set("X-Client-ID", c.clientID)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to register bouncer: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("OPAL server returned status %d: %s", resp.StatusCode, string(body))
	}

	logrus.Info("🔗 OPAL: Bouncer registered successfully")
	return nil
}

// SendHeartbeat sends a heartbeat to OPAL server
func (c *OPALClient) SendHeartbeat(bouncerID string, status map[string]interface{}) error {
	url := fmt.Sprintf("%s/api/v1/bouncers/%s/heartbeat", c.serverURL, bouncerID)

	jsonData, err := json.Marshal(status)
	if err != nil {
		return fmt.Errorf("failed to marshal heartbeat data: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication headers
	req.Header.Set("Authorization", "Bearer "+c.clientSecret)
	req.Header.Set("X-Client-ID", c.clientID)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send heartbeat: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("OPAL server returned status %d: %s", resp.StatusCode, string(body))
	}

	logrus.WithField("bouncer_id", bouncerID).Debug("💓 OPAL: Heartbeat sent successfully")
	return nil
}

// HealthCheck checks the health of OPAL server
func (c *OPALClient) HealthCheck() error {
	url := fmt.Sprintf("%s/health", c.serverURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to check OPAL health: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("OPAL server health check failed with status %d", resp.StatusCode)
	}

	return nil
}

// GetPolicyData returns the current policy data for debugging
func (c *OPALClient) GetPolicyData() (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/v1/policies/data", c.serverURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication headers
	req.Header.Set("Authorization", "Bearer "+c.clientSecret)
	req.Header.Set("X-Client-ID", c.clientID)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get policy data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OPAL server returned status %d: %s", resp.StatusCode, string(body))
	}

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode policy data: %w", err)
	}

	return data, nil
}
