package services

import (
	"bytes"
	"io"
	"net/http"
)

// ContentInjector injects content into HTTP responses
type ContentInjector struct{}

// NewContentInjector creates a new content injector
func NewContentInjector() *ContentInjector {
	return &ContentInjector{}
}

// InjectContent injects content into the response body
func (ci *ContentInjector) InjectContent(originalBody []byte, injection string) []byte {
	// For now, just append the injection to the original body
	// In a real implementation, this would be more sophisticated
	return append(originalBody, []byte(injection)...)
}

// ProcessResponse processes the response and injects content if needed
func (ci *ContentInjector) ProcessResponse(resp *http.Response, injection string) error {
	if injection == "" {
		return nil
	}

	// Read the original response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	// Inject content
	modifiedBody := ci.InjectContent(body, injection)

	// Replace the response body
	resp.Body = io.NopCloser(bytes.NewReader(modifiedBody))
	resp.ContentLength = int64(len(modifiedBody))

	return nil
}
