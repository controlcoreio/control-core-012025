package models

import "time"

// IAuthorizationRequest represents a standardized input object for the PDP
type IAuthorizationRequest struct {
	User     User                   `json:"user" binding:"required"`
	Resource Resource               `json:"resource" binding:"required"`
	Action   Action                 `json:"action" binding:"required"`
	Context  map[string]interface{} `json:"context,omitempty"`
}

// User represents the user/subject making the request
type User struct {
	ID          string                 `json:"id" binding:"required"`
	Attributes  map[string]interface{} `json:"attributes,omitempty"`
	Roles       []string               `json:"roles,omitempty"`
	Groups      []string               `json:"groups,omitempty"`
	Permissions []string               `json:"permissions,omitempty"`
}

// Resource represents the resource being accessed
type Resource struct {
	ID         string                 `json:"id" binding:"required"`
	Type       string                 `json:"type" binding:"required"`
	Name       string                 `json:"name,omitempty"`
	Attributes map[string]interface{} `json:"attributes,omitempty"`
	Owner      string                 `json:"owner,omitempty"`
}

// Action represents the action being performed
type Action struct {
	Name       string                 `json:"name" binding:"required"`
	Type       string                 `json:"type,omitempty"`
	Attributes map[string]interface{} `json:"attributes,omitempty"`
}

// IAuthorizationDecision represents a simplified response with only allow and reason
type IAuthorizationDecision struct {
	Allow      bool                   `json:"allow"`
	Reason     string                 `json:"reason"`
	MaskedData interface{}            `json:"masked_data,omitempty"` // For data masking support
	Extra      map[string]interface{} `json:"extra,omitempty"`       // For additional OPA response data
}

// AuthorizationContext provides additional context for authorization decisions
type AuthorizationContext struct {
	RequestID   string    `json:"request_id"`
	RequestTime time.Time `json:"request_time"`
	ClientIP    string    `json:"client_ip,omitempty"`
	UserAgent   string    `json:"user_agent,omitempty"`
}
