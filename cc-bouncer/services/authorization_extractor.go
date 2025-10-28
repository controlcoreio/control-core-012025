package services

import (
	"encoding/json"
	"net/http"
	"strings"

	"cc-bouncer/models"
)

// AuthorizationExtractor extracts authorization context from HTTP requests
type AuthorizationExtractor struct{}

// NewAuthorizationExtractor creates a new authorization extractor
func NewAuthorizationExtractor() *AuthorizationExtractor {
	return &AuthorizationExtractor{}
}

// ExtractAuthorizationRequest extracts authorization context from HTTP request
func (ae *AuthorizationExtractor) ExtractAuthorizationRequest(r *http.Request) *models.IAuthorizationRequest {
	// Parse request body
	var authRequest models.IAuthorizationRequest

	// Try to parse JSON body
	if r.Body != nil {
		json.NewDecoder(r.Body).Decode(&authRequest)
	}

	// If no body or parsing failed, extract from headers and query params
	if authRequest.User.ID == "" {
		authRequest.User.ID = r.Header.Get("X-User-ID")
		if authRequest.User.ID == "" {
			authRequest.User.ID = "anonymous"
		}
	}

	if authRequest.User.Roles == nil {
		roles := r.Header.Get("X-User-Roles")
		if roles != "" {
			authRequest.User.Roles = strings.Split(roles, ",")
		}
	}

	if authRequest.User.Groups == nil {
		groups := r.Header.Get("X-User-Groups")
		if groups != "" {
			authRequest.User.Groups = strings.Split(groups, ",")
		}
	}

	if authRequest.Resource.ID == "" {
		authRequest.Resource.ID = r.URL.Path
	}

	if authRequest.Resource.Type == "" {
		authRequest.Resource.Type = "endpoint"
	}

	if authRequest.Resource.Name == "" {
		authRequest.Resource.Name = r.URL.Path
	}

	if authRequest.Action.Name == "" {
		authRequest.Action.Name = r.Method
	}

	if authRequest.Action.Type == "" {
		authRequest.Action.Type = "http_request"
	}

	// Initialize context if nil
	if authRequest.Context == nil {
		authRequest.Context = make(map[string]interface{})
	}

	// Add request metadata
	authRequest.Context["method"] = r.Method
	authRequest.Context["path"] = r.URL.Path
	authRequest.Context["query"] = r.URL.RawQuery
	authRequest.Context["user_agent"] = r.Header.Get("User-Agent")
	authRequest.Context["client_ip"] = r.RemoteAddr

	return &authRequest
}
