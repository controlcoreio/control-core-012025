package services

import (
	"time"

	"cc-bouncer/models"

	"github.com/sirupsen/logrus"
)

// AuditLogger logs authorization decisions and audit events
type AuditLogger struct {
	logger *logrus.Logger
}

// NewAuditLogger creates a new audit logger
func NewAuditLogger() *AuditLogger {
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})

	return &AuditLogger{
		logger: logger,
	}
}

// LogDecision logs an authorization decision
func (al *AuditLogger) LogDecision(decision *models.IAuthorizationDecision, context map[string]interface{}) {
	auditEntry := map[string]interface{}{
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
		"decision":   decision,
		"context":    context,
		"event_type": "authorization_decision",
	}

	al.logger.WithFields(auditEntry).Info("Authorization decision logged")
}

// LogPolicyEvaluation logs a policy evaluation
func (al *AuditLogger) LogPolicyEvaluation(request *models.IAuthorizationRequest, response *PolicyEvaluationResponse, duration time.Duration) {
	auditEntry := map[string]interface{}{
		"timestamp":   time.Now().UTC().Format(time.RFC3339),
		"request":     request,
		"response":    response,
		"duration_ms": duration.Milliseconds(),
		"event_type":  "policy_evaluation",
	}

	al.logger.WithFields(auditEntry).Info("Policy evaluation logged")
}

// LogSecurityEvent logs a security event
func (al *AuditLogger) LogSecurityEvent(eventType string, details map[string]interface{}) {
	auditEntry := map[string]interface{}{
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
		"event_type": eventType,
		"details":    details,
	}

	al.logger.WithFields(auditEntry).Warn("Security event logged")
}
