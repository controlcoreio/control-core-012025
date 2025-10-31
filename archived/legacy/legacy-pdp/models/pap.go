package models

// Minimal PAP models - keeping only what's essential for basic PDP operation

// ApprovalRequest represents a request to the PAP for approval (minimal format)
type ApprovalRequest struct {
	Action       string `json:"action"`
	ResourceID   string `json:"resource_id"`
	ResourceType string `json:"resource_type"`
	SubjectID    string `json:"subject_id"`
}

// AuthorizationResponse represents a response from the PAP (minimal format)
type AuthorizationResponse struct {
	Allow  bool   `json:"allow"`
	Reason string `json:"reason"`
}

// Response represents the standard PAP API response wrapper
type Response struct {
	Data interface{} `json:"data,omitempty"`
}

// RequestInfo contains metadata about the request
type RequestInfo struct {
	Method string `json:"method"`
	Path   string `json:"path"`
	UserID string `json:"user_id"`
}

// Policy represents a policy in the PAP
type Policy struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Content string `json:"content"`
}

// PolicyRequest represents a request to create/update a policy
type PolicyRequest struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Content string `json:"content"`
}

// PolicyInfo represents basic policy information
type PolicyInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// PolicyListResponse represents a list of policies
type PolicyListResponse struct {
	Policies []PolicyInfo `json:"policies"`
}

// DataUpdateRequest represents a request to update data via OPAL
type DataUpdateRequest struct {
	Config     map[string]interface{} `json:"config,omitempty"`
	Data       interface{}            `json:"data,omitempty"`
	DstPath    string                 `json:"dst_path,omitempty"`
	SaveMethod string                 `json:"save_method,omitempty"`
	Topic      string                 `json:"topic,omitempty"`
	URL        string                 `json:"url,omitempty"`
}
