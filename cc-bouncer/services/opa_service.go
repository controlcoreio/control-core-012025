package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"cc-bouncer/models"

	"github.com/sirupsen/logrus"
)

// OPAService handles OPA policy evaluation
type OPAService struct {
	opaURL     string
	httpClient *http.Client
}

// NewOPAService creates a new OPA service
func NewOPAService(opaURL string) *OPAService {
	return &OPAService{
		opaURL: opaURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// EvaluationRequest represents a policy evaluation request
type EvaluationRequest struct {
	Input map[string]interface{} `json:"input"`
	Query string                 `json:"query,omitempty"`
}

// EvaluationResponse represents a policy evaluation response
type EvaluationResponse struct {
	Result interface{} `json:"result"`
	Error  string      `json:"error,omitempty"`
}

// PolicyEvaluationRequest represents a policy evaluation request
type PolicyEvaluationRequest struct {
	User     User                   `json:"user"`
	Resource Resource               `json:"resource"`
	Action   Action                 `json:"action"`
	Context  map[string]interface{} `json:"context"`
}

// User represents a user in the evaluation request
type User struct {
	ID         string                 `json:"id"`
	Roles      []string               `json:"roles"`
	Groups     []string               `json:"groups"`
	Attributes map[string]interface{} `json:"attributes"`
}

// Resource represents a resource in the evaluation request
type Resource struct {
	ID         string                 `json:"id"`
	Type       string                 `json:"type"`
	Name       string                 `json:"name"`
	Attributes map[string]interface{} `json:"attributes"`
}

// Action represents an action in the evaluation request
type Action struct {
	Name       string                 `json:"name"`
	Type       string                 `json:"type"`
	Attributes map[string]interface{} `json:"attributes"`
}

// PolicyEvaluationResponse represents a policy evaluation response
type PolicyEvaluationResponse struct {
	Allow       bool                   `json:"allow"`
	Reason      string                 `json:"reason"`
	Constraints map[string]interface{} `json:"constraints"`
	Metadata    map[string]interface{} `json:"metadata"`
	MaskedData  interface{}            `json:"masked_data,omitempty"`
	Extra       map[string]interface{} `json:"extra,omitempty"`
}

// EvaluatePolicy evaluates a policy using OPA
func (s *OPAService) EvaluatePolicy(request PolicyEvaluationRequest) (*PolicyEvaluationResponse, error) {
	// Prepare input for OPA
	input := map[string]interface{}{
		"user":      request.User,
		"resource":  request.Resource,
		"action":    request.Action,
		"context":   request.Context,
		"timestamp": time.Now().Unix(),
	}

	// Create evaluation request
	evalReq := EvaluationRequest{
		Input: input,
		Query: "data.controlcore.allow",
	}

	// Send request to OPA
	resp, err := s.sendOPARequest("/v1/query", evalReq)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate policy: %w", err)
	}

	// Parse response
	var result PolicyEvaluationResponse
	if err := json.Unmarshal(resp, &result); err != nil {
		return nil, fmt.Errorf("failed to parse OPA response: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"user_id":     request.User.ID,
		"resource_id": request.Resource.ID,
		"action":      request.Action.Name,
		"allow":       result.Allow,
		"reason":      result.Reason,
	}).Info("🔍 OPA: Policy evaluation completed")

	return &result, nil
}

// EvaluateBulkPolicies evaluates multiple policies in a single request
func (s *OPAService) EvaluateBulkPolicies(requests []PolicyEvaluationRequest) ([]PolicyEvaluationResponse, error) {
	// Prepare bulk input
	inputs := make([]map[string]interface{}, len(requests))
	for i, req := range requests {
		inputs[i] = map[string]interface{}{
			"user":      req.User,
			"resource":  req.Resource,
			"action":    req.Action,
			"context":   req.Context,
			"timestamp": time.Now().Unix(),
		}
	}

	// Create bulk evaluation request
	evalReq := EvaluationRequest{
		Input: map[string]interface{}{
			"requests": inputs,
		},
		Query: "data.controlcore.bulk_allow",
	}

	// Send request to OPA
	resp, err := s.sendOPARequest("/v1/query", evalReq)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate bulk policies: %w", err)
	}

	// Parse response
	var results []PolicyEvaluationResponse
	if err := json.Unmarshal(resp, &results); err != nil {
		return nil, fmt.Errorf("failed to parse OPA bulk response: %w", err)
	}

	logrus.WithField("count", len(results)).Info("🔍 OPA: Bulk policy evaluation completed")

	return results, nil
}

// GetPolicyData retrieves current policy data from OPA
func (s *OPAService) GetPolicyData() (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/v1/data", s.opaURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get policy data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode policy data: %w", err)
	}

	return data, nil
}

// HealthCheck checks OPA health
func (s *OPAService) HealthCheck() error {
	url := fmt.Sprintf("%s/health", s.opaURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to check OPA health: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("OPA health check failed with status %d", resp.StatusCode)
	}

	return nil
}

// sendOPARequest sends a request to OPA
func (s *OPAService) sendOPARequest(endpoint string, request interface{}) ([]byte, error) {
	url := fmt.Sprintf("%s%s", s.opaURL, endpoint)

	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OPA returned status %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

// PolicyEngine combines OPA service with policy management
type PolicyEngine struct {
	opaService    *OPAService
	policyManager *PolicyManager
	policyCache   *PolicyCache
	decisionCache *DecisionCache
}

// NewPolicyEngine creates a new policy engine
func NewPolicyEngine(opaService *OPAService, policyManager *PolicyManager, policyCache *PolicyCache, decisionCache *DecisionCache) *PolicyEngine {
	return &PolicyEngine{
		opaService:    opaService,
		policyManager: policyManager,
		policyCache:   policyCache,
		decisionCache: decisionCache,
	}
}

// EvaluateRequest evaluates a policy request
func (e *PolicyEngine) EvaluateRequest(request PolicyEvaluationRequest) (*PolicyEvaluationResponse, error) {
	// Generate cache key
	cacheKey := e.generateCacheKey(request)

	// Check decision cache first
	if decision, found := e.decisionCache.Get(cacheKey); found {
		logrus.WithField("cache_key", cacheKey).Debug("💾 CACHE: Decision cache hit")
		// Convert IAuthorizationDecision back to PolicyEvaluationResponse
		return &PolicyEvaluationResponse{
			Allow:       decision.Allow,
			Reason:      decision.Reason,
			Constraints: make(map[string]interface{}),
			Metadata:    decision.Extra,
		}, nil
	}

	// Evaluate using OPA
	response, err := e.opaService.EvaluatePolicy(request)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate policy: %w", err)
	}

	// Convert PolicyEvaluationResponse to IAuthorizationDecision for caching
	authDecision := &models.IAuthorizationDecision{
		Allow:  response.Allow,
		Reason: response.Reason,
	}

	// Cache decision
	e.decisionCache.Set(cacheKey, authDecision)

	logrus.WithFields(logrus.Fields{
		"user_id":     request.User.ID,
		"resource_id": request.Resource.ID,
		"action":      request.Action.Name,
		"allow":       response.Allow,
		"reason":      response.Reason,
	}).Info("🔍 POLICY: Policy evaluation completed")

	return response, nil
}

// EvaluateBulkRequests evaluates multiple policy requests
func (e *PolicyEngine) EvaluateBulkRequests(requests []PolicyEvaluationRequest) ([]PolicyEvaluationResponse, error) {
	// Evaluate using OPA
	responses, err := e.opaService.EvaluateBulkPolicies(requests)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate bulk policies: %w", err)
	}

	// Cache decisions
	for i, request := range requests {
		if i < len(responses) {
			cacheKey := e.generateCacheKey(request)
			// Convert PolicyEvaluationResponse to IAuthorizationDecision for caching
			authDecision := &models.IAuthorizationDecision{
				Allow:  responses[i].Allow,
				Reason: responses[i].Reason,
			}
			e.decisionCache.Set(cacheKey, authDecision)
		}
	}

	logrus.WithField("count", len(responses)).Info("🔍 POLICY: Bulk policy evaluation completed")

	return responses, nil
}

// generateCacheKey generates a cache key for a request
func (e *PolicyEngine) generateCacheKey(request PolicyEvaluationRequest) string {
	// Create a hash of the request for caching
	key := fmt.Sprintf("%s:%s:%s:%d",
		request.User.ID,
		request.Resource.ID,
		request.Action.Name,
		time.Now().Unix()/60) // Cache for 1 minute

	return key
}

// GetPolicyData retrieves current policy data
func (e *PolicyEngine) GetPolicyData() (map[string]interface{}, error) {
	return e.opaService.GetPolicyData()
}

// HealthCheck checks the health of the policy engine
func (e *PolicyEngine) HealthCheck() error {
	// Check OPA health
	if err := e.opaService.HealthCheck(); err != nil {
		return fmt.Errorf("OPA health check failed: %w", err)
	}

	// Check policy manager health
	if err := e.policyManager.SyncPoliciesFromOPAL(context.Background()); err != nil {
		return fmt.Errorf("policy manager health check failed: %w", err)
	}

	return nil
}

// GetStats returns policy engine statistics
func (e *PolicyEngine) GetStats() map[string]interface{} {
	stats := make(map[string]interface{})

	// Policy cache stats
	stats["policy_cache"] = e.policyManager.GetCacheStats()

	// Decision cache stats
	stats["decision_cache"] = map[string]interface{}{
		"size": e.decisionCache.Size(),
	}

	// Last sync time
	stats["last_sync"] = e.policyManager.GetLastSync()

	return stats
}

// InvalidateCache invalidates all caches
func (e *PolicyEngine) InvalidateCache() {
	e.policyManager.InvalidateCache()
	e.decisionCache.Clear()
	logrus.Info("🔍 POLICY: All caches invalidated")
}
