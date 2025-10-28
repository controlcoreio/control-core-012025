package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// IAuthorizationRequest represents a standardized authorization request
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

// IAuthorizationDecision represents a standardized authorization decision
type IAuthorizationDecision struct {
	Allow       bool                   `json:"allow"`
	Reason      string                 `json:"reason"`
	Constraints map[string]interface{} `json:"constraints,omitempty"`
}

// AuthorizationExtractor extracts authorization information from HTTP requests
type AuthorizationExtractor struct {
	jwtParser *JWTParser
}

// NewAuthorizationExtractor creates a new authorization extractor
func NewAuthorizationExtractor() *AuthorizationExtractor {
	return &AuthorizationExtractor{
		jwtParser: NewJWTParser(),
	}
}

// ExtractAuthorizationRequest converts an HTTP request into an IAuthorizationRequest
func (e *AuthorizationExtractor) ExtractAuthorizationRequest(r *http.Request) IAuthorizationRequest {
	// Extract user information
	user := e.extractUser(r)

	// Extract resource information
	resource := e.extractResource(r)

	// Extract action information
	action := e.extractAction(r)

	// Extract context information
	context := e.extractContext(r)

	return IAuthorizationRequest{
		User:     user,
		Resource: resource,
		Action:   action,
		Context:  context,
	}
}

// extractUser extracts user information from the request
func (e *AuthorizationExtractor) extractUser(r *http.Request) User {
	user := User{
		ID:          "anonymous",
		Attributes:  make(map[string]interface{}),
		Roles:       []string{},
		Groups:      []string{},
		Permissions: []string{},
	}

	// Try to extract from JWT token
	if auth := r.Header.Get("Authorization"); auth != "" {
		if strings.HasPrefix(auth, "Bearer ") {
			token := strings.TrimPrefix(auth, "Bearer ")
			if claims, err := e.jwtParser.ParseToken(token); err == nil {
				user.ID = claims.Subject
				user.Attributes = claims.Attributes
				user.Roles = claims.Roles
				user.Permissions = claims.Permissions
			}
		}
	}

	// Try to extract from custom headers
	if userID := r.Header.Get("X-User-ID"); userID != "" {
		user.ID = userID
	}

	if roles := r.Header.Get("X-User-Roles"); roles != "" {
		user.Roles = strings.Split(roles, ",")
	}

	if permissions := r.Header.Get("X-User-Permissions"); permissions != "" {
		user.Permissions = strings.Split(permissions, ",")
	}

	// Extract additional attributes from headers
	for header, values := range r.Header {
		if strings.HasPrefix(header, "X-User-Attr-") {
			attrName := strings.TrimPrefix(header, "X-User-Attr-")
			user.Attributes[attrName] = strings.Join(values, ", ")
		}
	}

	return user
}

// extractResource extracts resource information from the request
func (e *AuthorizationExtractor) extractResource(r *http.Request) Resource {
	resource := Resource{
		ID:         fmt.Sprintf("%s:%s", r.Host, r.URL.Path),
		Type:       e.categorizeResourceType(r.URL.Path),
		Attributes: make(map[string]interface{}),
	}

	// Set basic attributes
	resource.Attributes["path"] = r.URL.Path
	resource.Attributes["host"] = r.Host
	resource.Attributes["scheme"] = e.getScheme(r)
	resource.Attributes["query"] = r.URL.RawQuery

	// Extract resource-specific attributes from headers
	if resourceID := r.Header.Get("X-Resource-ID"); resourceID != "" {
		resource.ID = resourceID
	}

	if resourceType := r.Header.Get("X-Resource-Type"); resourceType != "" {
		resource.Type = resourceType
	}

	if owner := r.Header.Get("X-Resource-Owner"); owner != "" {
		resource.Owner = owner
	}

	// Extract additional resource attributes from headers
	for header, values := range r.Header {
		if strings.HasPrefix(header, "X-Resource-Attr-") {
			attrName := strings.TrimPrefix(header, "X-Resource-Attr-")
			resource.Attributes[attrName] = strings.Join(values, ", ")
		}
	}

	return resource
}

// extractAction extracts action information from the request
func (e *AuthorizationExtractor) extractAction(r *http.Request) Action {
	action := Action{
		Name:       e.categorizeAction(r.Method),
		Type:       r.Method,
		Attributes: make(map[string]interface{}),
	}

	// Set basic attributes
	action.Attributes["method"] = r.Method
	action.Attributes["content_type"] = r.Header.Get("Content-Type")

	// Extract action-specific attributes from headers
	if actionName := r.Header.Get("X-Action-Name"); actionName != "" {
		action.Name = actionName
	}

	// Extract additional action attributes from headers
	for header, values := range r.Header {
		if strings.HasPrefix(header, "X-Action-Attr-") {
			attrName := strings.TrimPrefix(header, "X-Action-Attr-")
			action.Attributes[attrName] = strings.Join(values, ", ")
		}
	}

	return action
}

// extractContext extracts context information from the request
func (e *AuthorizationExtractor) extractContext(r *http.Request) map[string]interface{} {
	context := map[string]interface{}{
		"timestamp":    time.Now().Format(time.RFC3339),
		"ip_address":   e.extractClientIP(r),
		"user_agent":   r.UserAgent(),
		"content_type": r.Header.Get("Content-Type"),
		"referer":      r.Header.Get("Referer"),
		"request_id":   e.generateRequestID(),
		"scheme":       e.getScheme(r),
		"query":        r.URL.RawQuery,
		"method":       r.Method,
		"path":         r.URL.Path,
		"host":         r.Host,
	}

	// Extract additional context from headers
	for header, values := range r.Header {
		if strings.HasPrefix(header, "X-Context-") {
			contextName := strings.TrimPrefix(header, "X-Context-")
			context[contextName] = strings.Join(values, ", ")
		}
	}

	return context
}

// Helper methods
func (e *AuthorizationExtractor) extractClientIP(r *http.Request) string {
	// Check for forwarded IP first
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		return strings.Split(forwarded, ",")[0]
	}
	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		return realIP
	}
	return r.RemoteAddr
}

func (e *AuthorizationExtractor) getScheme(r *http.Request) string {
	if r.TLS != nil {
		return "https"
	}
	if forwarded := r.Header.Get("X-Forwarded-Proto"); forwarded != "" {
		return forwarded
	}
	return "http"
}

func (e *AuthorizationExtractor) categorizeAction(method string) string {
	switch method {
	case "GET", "HEAD", "OPTIONS":
		return "read"
	case "POST":
		return "create"
	case "PUT", "PATCH":
		return "update"
	case "DELETE":
		return "delete"
	default:
		return "unknown"
	}
}

func (e *AuthorizationExtractor) categorizeResourceType(path string) string {
	// Categorize resource types based on URL path patterns
	switch {
	case strings.Contains(path, "/api/"):
		return "api"
	case strings.Contains(path, "/admin"):
		return "admin"
	case strings.Contains(path, "/users"):
		return "user"
	case strings.Contains(path, "/docs"):
		return "documentation"
	case strings.Contains(path, "/health"):
		return "health"
	case strings.HasSuffix(path, ".json"):
		return "json"
	case strings.HasSuffix(path, ".xml"):
		return "xml"
	default:
		return "document"
	}
}

func (e *AuthorizationExtractor) generateRequestID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// JWT Claims structure
type JWTClaims struct {
	Subject     string                 `json:"sub"`
	Attributes  map[string]interface{} `json:"attributes,omitempty"`
	Roles       []string               `json:"roles,omitempty"`
	Permissions []string               `json:"permissions,omitempty"`
	ExpiresAt   int64                  `json:"exp"`
	IssuedAt    int64                  `json:"iat"`
}

// JWTParser handles JWT token parsing
type JWTParser struct {
	// In a real implementation, this would include JWT verification
}

// NewJWTParser creates a new JWT parser
func NewJWTParser() *JWTParser {
	return &JWTParser{}
}

// ParseToken parses a JWT token and returns claims
func (j *JWTParser) ParseToken(token string) (*JWTClaims, error) {
	// In a real implementation, this would:
	// 1. Verify the JWT signature
	// 2. Check expiration
	// 3. Parse and return claims

	// For now, return mock claims
	return &JWTClaims{
		Subject:     "user123",
		Attributes:  map[string]interface{}{"department": "engineering"},
		Roles:       []string{"user", "developer"},
		Permissions: []string{"read", "write"},
		ExpiresAt:   time.Now().Add(24 * time.Hour).Unix(),
		IssuedAt:    time.Now().Unix(),
	}, nil
}
