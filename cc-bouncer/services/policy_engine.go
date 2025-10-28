package services

import (
	"context"
	"fmt"
	"time"

	"cc-bouncer/models"

	"github.com/sirupsen/logrus"
)

// convertToPolicyEvaluationRequest converts IAuthorizationRequest to PolicyEvaluationRequest
func (pe *PolicyEngine) convertToPolicyEvaluationRequest(request *models.IAuthorizationRequest) PolicyEvaluationRequest {
	return PolicyEvaluationRequest{
		User: User{
			ID:         request.User.ID,
			Roles:      request.User.Roles,
			Groups:     request.User.Groups,
			Attributes: request.User.Attributes,
		},
		Resource: Resource{
			ID:         request.Resource.ID,
			Type:       request.Resource.Type,
			Name:       request.Resource.Name,
			Attributes: request.Resource.Attributes,
		},
		Action: Action{
			Name:       request.Action.Name,
			Type:       request.Action.Type,
			Attributes: request.Action.Attributes,
		},
		Context: request.Context,
	}
}

// EvaluatePolicy evaluates a policy for the given request
func (pe *PolicyEngine) EvaluatePolicy(ctx context.Context, request *models.IAuthorizationRequest) (*PolicyEvaluationResponse, error) {
	startTime := time.Now()

	// Convert IAuthorizationRequest to PolicyEvaluationRequest
	policyRequest := pe.convertToPolicyEvaluationRequest(request)

	// Check cache first
	cacheKey := pe.generateCacheKey(policyRequest)
	if decision, found := pe.decisionCache.Get(cacheKey); found {
		logrus.WithField("cache_hit", true).Debug("Decision found in cache")
		return &PolicyEvaluationResponse{
			Allow:      decision.Allow,
			Reason:     decision.Reason,
			MaskedData: decision.MaskedData,
			Extra:      decision.Extra,
		}, nil
	}

	// Evaluate policy using OPA
	response, err := pe.opaService.EvaluatePolicy(policyRequest)
	if err != nil {
		return nil, fmt.Errorf("policy evaluation failed: %w", err)
	}

	// Cache the decision
	decision := &models.IAuthorizationDecision{
		Allow:      response.Allow,
		Reason:     response.Reason,
		MaskedData: response.MaskedData,
		Extra:      response.Extra,
	}
	pe.decisionCache.Set(cacheKey, decision)

	duration := time.Since(startTime)
	logrus.WithFields(logrus.Fields{
		"duration_ms": duration.Milliseconds(),
		"allow":       response.Allow,
		"reason":      response.Reason,
	}).Info("Policy evaluation completed")

	return response, nil
}

// RefreshPolicies refreshes the policy cache
func (pe *PolicyEngine) RefreshPolicies(ctx context.Context) error {
	return pe.policyManager.RefreshPolicies(ctx)
}

// GetEngineStats returns engine statistics
func (pe *PolicyEngine) GetEngineStats() map[string]interface{} {
	stats := map[string]interface{}{
		"decision_cache_size": pe.decisionCache.Size(),
		"policy_cache_stats":  pe.policyCache.Stats(),
	}

	return stats
}
