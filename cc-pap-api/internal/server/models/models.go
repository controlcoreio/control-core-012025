package models

// Constants for response status types
const (
	StatusAllowed = "allowed"
	StatusDenied  = "denied"
	StatusError   = "error"
)

// Constants for policy status types
const (
	PolicyStatusEnabled  = "enabled"
	PolicyStatusDisabled = "disabled"
	PolicyStatusArchived = "archived"
	PolicyStatusDraft    = "draft"
)

// Response represents the standard API response structure
type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
	Request RequestInfo `json:"request"`
	Data    interface{} `json:"data,omitempty"`
}

// RequestInfo contains information about the processed request
type RequestInfo struct {
	Method string `json:"method"`
	Path   string `json:"path"`
	UserID string `json:"user_id"`
}

// ApprovalStatusRequest represents a request to check approval status
type ApprovalStatusRequest struct {
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
	SubjectID    string `json:"subject_id"`
}

// ApprovalRequest represents a request to create a new approval
type ApprovalRequest struct {
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
	SubjectID    string `json:"subject_id"`
	Action       string `json:"action"`
}

// AuthorizationResponse represents the response for authorization requests
type AuthorizationResponse struct {
	Allow  bool   `json:"allow"`
	Reason string `json:"reason,omitempty"`
}

// PolicyResult represents the result of a policy evaluation
type PolicyResult struct {
	Allow  bool   `json:"allow"`
	Reason string `json:"reason,omitempty"`
}

// PolicyWidget represents a policy with all metadata for the frontend
type PolicyWidget struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Status       string   `json:"status"` // enabled, disabled, archived, draft
	Scope        []string `json:"scope"`
	LastModified string   `json:"lastModified"`
	ModifiedBy   string   `json:"modifiedBy"`
	Version      string   `json:"version"`
	CreatedAt    string   `json:"createdAt"`
	CreatedBy    string   `json:"createdBy"`
	Content      string   `json:"content,omitempty"` // For detailed view
}

// PolicyWidgetListResponse represents the response for listing policies
type PolicyWidgetListResponse struct {
	Policies []PolicyWidget `json:"policies"`
}

// Policy represents a basic policy document for OPA operations
type Policy struct {
	ID      string `json:"id"`
	Content string `json:"content"`
	Name    string `json:"name,omitempty"`
}

// PolicyListResponse represents the response for listing policies
type PolicyListResponse struct {
	Policies []PolicyInfo `json:"policies"`
}

// PolicyInfo represents basic policy information
type PolicyInfo struct {
	ID   string `json:"id"`
	Name string `json:"name,omitempty"`
}

// PolicyRequest represents a request to create or update a policy
type PolicyRequest struct {
	ID      string `json:"id"`
	Content string `json:"content"`
	Name    string `json:"name,omitempty"`
}

// DataUpdateRequest represents a request to trigger data updates via OPAL
type DataUpdateRequest struct {
	URL        string                 `json:"url"`
	Topic      string                 `json:"topic,omitempty"`
	DestPath   string                 `json:"dst_path,omitempty"`
	Config     map[string]interface{} `json:"config,omitempty"`
	SaveMethod string                 `json:"save_method,omitempty"`
	Data       interface{}            `json:"data,omitempty"`
}

// PolicyDecision represents the result of a policy evaluation
type PolicyDecision struct {
	SubjectID    string `json:"subject_id"`
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
	Action       string `json:"action"`
	Allow        bool   `json:"allow"`
	Reason       string `json:"reason,omitempty"`
}
