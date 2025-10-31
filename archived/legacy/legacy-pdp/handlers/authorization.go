package handlers

import (
	"fmt"
	"net/http"
	"time"

	"cc-pdp/models"
	"cc-pdp/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// AuthorizationHandler handles authorization requests
type AuthorizationHandler struct {
	pdpService *services.PDPService
}

// NewAuthorizationHandler creates a new authorization handler
func NewAuthorizationHandler(pdpService *services.PDPService) *AuthorizationHandler {
	return &AuthorizationHandler{
		pdpService: pdpService,
	}
}

// Authorize handles POST /authorize requests
// ONLY accepts IAuthorizationRequest format with User, Resource, Action (required) and Context (optional)
func (h *AuthorizationHandler) Authorize(c *gin.Context) {
	requestID := c.GetHeader("X-Request-ID")
	if requestID == "" {
		requestID = uuid.New().String()
	}

	// Strict validation: ONLY accept IAuthorizationRequest format
	var req models.IAuthorizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"client_ip":  c.ClientIP(),
			"error":      err.Error(),
		}).Error("❌ PDP_VALIDATION_ERROR: Request does not match required IAuthorizationRequest format")

		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": "Request must match IAuthorizationRequest format with required fields: user, resource, action",
			"required_format": gin.H{
				"user": gin.H{
					"id":          "string (required)",
					"attributes":  "map[string]string (optional)",
					"roles":       "[]string (optional)",
					"permissions": "[]string (optional)",
				},
				"resource": gin.H{
					"id":         "string (required)",
					"type":       "string (required)",
					"attributes": "map[string]string (optional)",
					"owner":      "string (optional)",
				},
				"action": gin.H{
					"name":       "string (required)",
					"attributes": "map[string]string (optional)",
				},
				"context": "map[string]interface{} (optional)",
			},
			"validation_error": err.Error(),
		})
		return
	}

	// Additional validation for required fields
	if req.User.ID == "" {
		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"client_ip":  c.ClientIP(),
		}).Error("❌ PDP_VALIDATION_ERROR: Missing required field user.id")

		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing required field",
			"details": "user.id is required and cannot be empty",
		})
		return
	}

	if req.Resource.ID == "" || req.Resource.Type == "" {
		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"client_ip":  c.ClientIP(),
		}).Error("❌ PDP_VALIDATION_ERROR: Missing required resource fields")

		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing required fields",
			"details": "resource.id and resource.type are required and cannot be empty",
		})
		return
	}

	if req.Action.Name == "" {
		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"client_ip":  c.ClientIP(),
		}).Error("❌ PDP_VALIDATION_ERROR: Missing required field action.name")

		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing required field",
			"details": "action.name is required and cannot be empty",
		})
		return
	}

	// Valid IAuthorizationRequest received - log it
	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"client_ip":  c.ClientIP(),
		"user_agent": c.GetHeader("User-Agent"),
		"request":    req,
	}).Info("📥 PEP_REQUEST: Received authorization request from PEP")

	// Log the context data specifically to see if JSON data is included
	if req.Context != nil && len(req.Context) > 0 {
		// Check if this is post-authorization
		stage := "pre-authorization"
		if stageValue, exists := req.Context["stage"]; exists {
			if stageStr, ok := stageValue.(string); ok {
				stage = stageStr
			}
		}

		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"stage":      stage,
			"context_keys": func() []string {
				keys := make([]string, 0, len(req.Context))
				for key := range req.Context {
					keys = append(keys, key)
				}
				return keys
			}(),
			"has_json_data": req.Context["jsonData"] != nil,
		}).Info("📋 PDP_CONTEXT: Authorization request context data received")

		// If this is post-authorization with JSON data, log more details
		if stage == "post-authorization" && req.Context["jsonData"] != nil {
			logrus.WithFields(logrus.Fields{
				"request_id":     requestID,
				"json_data_type": fmt.Sprintf("%T", req.Context["jsonData"]),
				"json_data_preview": func() string {
					if str, ok := req.Context["jsonData"].(string); ok {
						if len(str) > 200 {
							return str[:200] + "..."
						}
						return str
					}
					return fmt.Sprintf("%v", req.Context["jsonData"])
				}(),
			}).Info("🎯 PDP_POST_AUTH: Post-authorization request with JSON data")
		}
	}

	// Build authorization context
	ctx := models.AuthorizationContext{
		RequestID:   requestID,
		RequestTime: time.Now(),
		ClientIP:    c.ClientIP(),
		UserAgent:   c.GetHeader("User-Agent"),
	}

	// Make authorization decision
	decision, err := h.pdpService.MakeAuthorizationDecision(req, ctx)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"error":      err.Error(),
		}).Error("❌ PDP_DECISION_ERROR: Failed to make authorization decision")

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to make authorization decision",
			"details": err.Error(),
		})
		return
	}

	// Log the decision being returned to PEP
	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"response":   decision,
	}).Info("📤 PDP_RESPONSE: Returning decision to PEP")

	c.JSON(http.StatusOK, decision)
}

// BulkAuthorize handles POST /authorize/bulk requests for multiple authorization checks
// ONLY accepts []IAuthorizationRequest format
func (h *AuthorizationHandler) BulkAuthorize(c *gin.Context) {
	requestID := c.GetHeader("X-Request-ID")
	if requestID == "" {
		requestID = uuid.New().String()
	}

	var requests []models.IAuthorizationRequest
	if err := c.ShouldBindJSON(&requests); err != nil {
		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"error":      err.Error(),
		}).Error("❌ PDP_BULK_VALIDATION_ERROR: Request does not match required []IAuthorizationRequest format")

		c.JSON(http.StatusBadRequest, gin.H{
			"error":            "Invalid bulk request format",
			"details":          "Request must be an array of IAuthorizationRequest objects",
			"validation_error": err.Error(),
		})
		return
	}

	if len(requests) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No authorization requests provided",
		})
		return
	}

	// Limit bulk requests to prevent abuse
	if len(requests) > 50 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Too many requests, maximum 50 allowed",
		})
		return
	}

	// Validate each request in the batch
	for i, req := range requests {
		if req.User.ID == "" || req.Resource.ID == "" || req.Resource.Type == "" || req.Action.Name == "" {
			logrus.WithFields(logrus.Fields{
				"request_id": requestID,
				"index":      i,
			}).Error("❌ PDP_BULK_VALIDATION_ERROR: Invalid request in batch")

			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid request in batch",
				"details": fmt.Sprintf("Request at index %d missing required fields", i),
			})
			return
		}
	}

	// Log bulk request
	logrus.WithFields(logrus.Fields{
		"request_id":    requestID,
		"request_count": len(requests),
		"client_ip":     c.ClientIP(),
		"requests":      requests,
	}).Infof("📥 PEP_BULK_REQUEST: Received %d authorization requests from PEP", len(requests))

	decisions := make([]models.IAuthorizationDecision, len(requests))

	for i, req := range requests {
		ctx := models.AuthorizationContext{
			RequestID:   fmt.Sprintf("%s-%d", requestID, i),
			RequestTime: time.Now(),
			ClientIP:    c.ClientIP(),
			UserAgent:   c.GetHeader("User-Agent"),
		}

		decision, err := h.pdpService.MakeAuthorizationDecision(req, ctx)
		if err != nil {
			decisions[i] = models.IAuthorizationDecision{
				Allow:  false,
				Reason: "Internal error processing request",
			}
		} else {
			decisions[i] = *decision
		}
	}

	logrus.WithFields(logrus.Fields{
		"request_id":      requestID,
		"decisions_count": len(decisions),
		"decisions":       decisions,
	}).Info("📤 PDP_BULK_RESPONSE: Returning bulk decisions to PEP")

	c.JSON(http.StatusOK, gin.H{
		"decisions": decisions,
	})
}

// HealthCheck handles GET /health requests
func (h *AuthorizationHandler) HealthCheck(c *gin.Context) {
	err := h.pdpService.HealthCheck()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now(),
		"service":   "PDP",
	})
}

// GetPolicyInfo handles GET /policies requests to show loaded policy information
func (h *AuthorizationHandler) GetPolicyInfo(c *gin.Context) {
	requestID := c.GetHeader("X-Request-ID")
	if requestID == "" {
		requestID = uuid.New().String()
	}

	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"client_ip":  c.ClientIP(),
	}).Info("📋 POLICY_INFO: Fetching policy information")

	policies, err := h.pdpService.GetPolicyInfo()
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"error":      err.Error(),
		}).Error("❌ POLICY_INFO_ERROR: Failed to fetch policy information")

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch policy information",
			"details": err.Error(),
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"request_id":   requestID,
		"policy_count": len(policies),
	}).Info("✅ POLICY_INFO: Successfully retrieved policy information")

	c.JSON(http.StatusOK, gin.H{
		"policies":  policies,
		"count":     len(policies),
		"timestamp": time.Now(),
	})
}

// GetOPAData handles GET /opa/data requests to show current OPA data for debugging
func (h *AuthorizationHandler) GetOPAData(c *gin.Context) {
	requestID := c.GetHeader("X-Request-ID")
	if requestID == "" {
		requestID = uuid.New().String()
	}

	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"client_ip":  c.ClientIP(),
	}).Info("🔍 OPA_DATA: Fetching OPA data for debugging")

	data, err := h.pdpService.GetOPAData()
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"error":      err.Error(),
		}).Error("❌ OPA_DATA_ERROR: Failed to fetch OPA data")

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch OPA data",
			"details": err.Error(),
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
	}).Info("✅ OPA_DATA: Successfully retrieved OPA data")

	c.JSON(http.StatusOK, gin.H{
		"data":      data,
		"timestamp": time.Now(),
	})
}
