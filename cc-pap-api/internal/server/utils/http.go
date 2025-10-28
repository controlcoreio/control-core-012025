package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/controlcoreio/cc-policy-admin-api/internal/server/models"
)

// HTTPError represents common error types
type HTTPError struct {
	Code    int
	Message string
}

// Error implements the error interface
func (e *HTTPError) Error() string {
	return e.Message
}

// Common HTTP errors
var (
	ErrMethodNotAllowed      = &HTTPError{http.StatusMethodNotAllowed, "Method not allowed"}
	ErrInvalidRequestBody    = &HTTPError{http.StatusBadRequest, "Invalid request body"}
	ErrMissingRequiredFields = &HTTPError{http.StatusBadRequest, "Missing required fields"}
	ErrPolicyNotFound        = &HTTPError{http.StatusNotFound, "Policy not found"}
	ErrPolicyIDRequired      = &HTTPError{http.StatusBadRequest, "Policy ID required"}
	ErrContentRequired       = &HTTPError{http.StatusBadRequest, "Content is required"}
	ErrInternalServer        = &HTTPError{http.StatusInternalServerError, "Internal server error"}
)

// ValidateMethod validates the HTTP method and returns an error if invalid
func ValidateMethod(r *http.Request, expectedMethod string) error {
	if r.Method != expectedMethod {
		return ErrMethodNotAllowed
	}
	return nil
}

// ParseJSONBody parses JSON request body into the provided struct
func ParseJSONBody(r *http.Request, dest interface{}) error {
	if err := json.NewDecoder(r.Body).Decode(dest); err != nil {
		return ErrInvalidRequestBody
	}
	return nil
}

// ExtractPolicyID extracts policy ID from URL path
func ExtractPolicyID(r *http.Request) (string, error) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/policies/")
	if path == "" {
		return "", ErrPolicyIDRequired
	}
	return path, nil
}

// ExtractPolicyIDFromEnablePath extracts policy ID from enable URL path
func ExtractPolicyIDFromEnablePath(r *http.Request) (string, error) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/policies/enable/")
	if path == "" {
		return "", ErrPolicyIDRequired
	}
	return path, nil
}

// ExtractPolicyIDFromDisablePath extracts policy ID from disable URL path
func ExtractPolicyIDFromDisablePath(r *http.Request) (string, error) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/policies/disable/")
	if path == "" {
		return "", ErrPolicyIDRequired
	}
	return path, nil
}

// SendJSONResponse sends a JSON response with proper headers
func SendJSONResponse(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// SendErrorResponse sends an error response
func SendErrorResponse(w http.ResponseWriter, err error) {
	var httpErr *HTTPError
	var ok bool

	if httpErr, ok = err.(*HTTPError); !ok {
		// If it's not an HTTPError, treat as internal server error
		httpErr = ErrInternalServer
		log.Printf("Unexpected error: %v", err)
	}

	http.Error(w, httpErr.Message, httpErr.Code)
}

// CreateStandardResponse creates a standard API response
func CreateStandardResponse(r *http.Request, status, message string, data interface{}) *models.Response {
	return &models.Response{
		Status:  status,
		Message: message,
		Request: models.RequestInfo{
			Method: r.Method,
			Path:   r.URL.Path,
			UserID: "", // Can be populated from context if needed
		},
		Data: data,
	}
}

// HandleOPAError handles common OPA error patterns
func HandleOPAError(err error) error {
	if err == nil {
		return nil
	}

	errStr := err.Error()
	if strings.Contains(errStr, "not found") {
		return ErrPolicyNotFound
	}

	// Log the original error for debugging
	log.Printf("OPA error: %v", err)
	return fmt.Errorf("failed to communicate with OPA: %w", err)
}

// LogAndHandleError logs an error and returns an appropriate HTTP error
func LogAndHandleError(operation string, err error) error {
	if err == nil {
		return nil
	}

	log.Printf("Error %s: %v", operation, err)

	// Check if it's already an HTTP error
	if _, ok := err.(*HTTPError); ok {
		return err
	}

	// Handle OPA-specific errors
	if opaErr := HandleOPAError(err); opaErr != nil && opaErr.Error() != ErrInternalServer.Error() {
		return opaErr
	}

	return ErrInternalServer
}

// ValidateRequiredFields validates that required fields are not empty
func ValidateRequiredFields(fields map[string]string) error {
	for fieldName, fieldValue := range fields {
		if fieldValue == "" {
			return &HTTPError{http.StatusBadRequest, fmt.Sprintf("%s is required", fieldName)}
		}
	}
	return nil
}

// WrapHTTPError wraps a regular error as an HTTPError
func WrapHTTPError(err error, code int, message string) error {
	if err == nil {
		return nil
	}
	return &HTTPError{Code: code, Message: message}
}
