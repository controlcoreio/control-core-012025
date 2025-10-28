package services

import (
	"fmt"

	"cc-bouncer/models"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// PDPService handles policy decision logic
type PDPService struct {
	opaClient *OPAClient
	papClient *PAPClient // Keep for policy management endpoints
}

// NewPDPService creates a new PDP service
func NewPDPService(opaClient *OPAClient, papClient *PAPClient) *PDPService {
	return &PDPService{
		opaClient: opaClient,
		papClient: papClient,
	}
}

// MakeAuthorizationDecision processes an authorization request and returns a decision
// Uses direct communication with OPA via OPAL Client
func (s *PDPService) MakeAuthorizationDecision(req models.IAuthorizationRequest, ctx models.AuthorizationContext) (*models.IAuthorizationDecision, error) {
	// Generate a unique request ID if not provided
	requestID := ctx.RequestID
	if requestID == "" {
		requestID = uuid.New().String()
		ctx.RequestID = requestID
	}

	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"user_id":    req.User.ID,
		"resource":   req.Resource.ID,
		"action":     req.Action.Name,
	}).Info("🔄 PDP_PROCESSING: Processing authorization request with OPA")

	// Use the OPA client to evaluate the request directly
	decision, err := s.opaClient.EvaluatePolicy(req, ctx)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"error":      err.Error(),
		}).Error("❌ PDP_PROCESSING: OPA evaluation failed")

		// Return a default deny decision on error
		return &models.IAuthorizationDecision{
			Allow:  false,
			Reason: "OPA evaluation failed",
		}, nil
	}

	// Log the final decision
	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"allow":      decision.Allow,
		"reason":     decision.Reason,
	}).Info("✅ PDP_PROCESSING: OPA evaluation completed")

	return decision, nil
}

// GetPolicyInfo returns information about loaded policies from PAP
func (s *PDPService) GetPolicyInfo() ([]models.PolicyInfo, error) {
	// Use PAP client for policy management info
	if s.papClient == nil {
		return nil, fmt.Errorf("PAP client not configured")
	}

	policies, err := s.papClient.GetAllPolicies()
	if err != nil {
		return nil, err
	}

	var policyInfos []models.PolicyInfo
	for _, policy := range policies {
		policyInfos = append(policyInfos, models.PolicyInfo{
			ID:   policy.ID,
			Name: policy.Name,
		})
	}

	return policyInfos, nil
}

// GetOPAData returns the current OPA data for debugging
func (s *PDPService) GetOPAData() (map[string]interface{}, error) {
	return s.opaClient.GetPolicyData()
}

// HealthCheck verifies that the PDP service is running
func (s *PDPService) HealthCheck() error {
	// Check OPA client health (primary)
	if err := s.opaClient.HealthCheck(); err != nil {
		return fmt.Errorf("OPA health check failed: %w", err)
	}

	// Check PAP client health if available (secondary)
	if s.papClient != nil {
		if err := s.papClient.HealthCheck(); err != nil {
			logrus.WithError(err).Warn("⚠️ PDP_HEALTH: PAP health check failed (non-critical)")
		}
	}

	return nil
}
