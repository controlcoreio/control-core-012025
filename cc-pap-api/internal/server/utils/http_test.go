package utils

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestValidateMethod(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		expectedMethod string
		wantErr        bool
	}{
		{
			name:           "Valid GET method",
			method:         http.MethodGet,
			expectedMethod: http.MethodGet,
			wantErr:        false,
		},
		{
			name:           "Valid POST method",
			method:         http.MethodPost,
			expectedMethod: http.MethodPost,
			wantErr:        false,
		},
		{
			name:           "Invalid method",
			method:         http.MethodGet,
			expectedMethod: http.MethodPost,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/", nil)
			err := ValidateMethod(req, tt.expectedMethod)

			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateMethod() error = %v, wantErr %v", err, tt.wantErr)
			}

			if err != nil && tt.wantErr && err != ErrMethodNotAllowed {
				t.Errorf("ValidateMethod() unexpected error type = %v, want %v", err, ErrMethodNotAllowed)
			}
		})
	}
}

func TestExtractPolicyID(t *testing.T) {
	tests := []struct {
		name       string
		path       string
		wantID     string
		wantErr    bool
		wantErrMsg string
	}{
		{
			name:    "Valid policy ID",
			path:    "/api/v1/policies/test-policy",
			wantID:  "test-policy",
			wantErr: false,
		},
		{
			name:       "Missing policy ID",
			path:       "/api/v1/policies/",
			wantID:     "",
			wantErr:    true,
			wantErrMsg: ErrPolicyIDRequired.Error(),
		},
		{
			name:    "Policy ID with special characters",
			path:    "/api/v1/policies/test-policy-123",
			wantID:  "test-policy-123",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			gotID, err := ExtractPolicyID(req)

			if (err != nil) != tt.wantErr {
				t.Errorf("ExtractPolicyID() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err != nil && tt.wantErr && err.Error() != tt.wantErrMsg {
				t.Errorf("ExtractPolicyID() error message = %v, want %v", err.Error(), tt.wantErrMsg)
			}

			if gotID != tt.wantID {
				t.Errorf("ExtractPolicyID() = %v, want %v", gotID, tt.wantID)
			}
		})
	}
}

func TestValidateRequiredFields(t *testing.T) {
	tests := []struct {
		name       string
		fields     map[string]string
		wantErr    bool
		wantErrMsg string
	}{
		{
			name: "All fields present",
			fields: map[string]string{
				"id":      "test-id",
				"name":    "Test Name",
				"content": "package test\n\nallow = true",
			},
			wantErr: false,
		},
		{
			name: "Missing field",
			fields: map[string]string{
				"id":      "test-id",
				"name":    "",
				"content": "package test\n\nallow = true",
			},
			wantErr:    true,
			wantErrMsg: "name is required",
		},
		{
			name:       "Empty fields map",
			fields:     map[string]string{},
			wantErr:    false,
			wantErrMsg: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateRequiredFields(tt.fields)

			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateRequiredFields() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err != nil && tt.wantErr && err.Error() != tt.wantErrMsg {
				t.Errorf("ValidateRequiredFields() error message = %v, want %v", err.Error(), tt.wantErrMsg)
			}
		})
	}
}
