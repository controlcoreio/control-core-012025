package server

import (
	"log"
	"net/http"

	"github.com/controlcoreio/cc-policy-admin-api/internal/server/handlers/policies"
	"github.com/controlcoreio/cc-policy-admin-api/internal/server/utils"
)

// Server represents our HTTP server configuration
type Server struct {
	addr          string
	opaURL        string
	opalServerURL string
	opalClientURL string
	githubToken   string
}

// NewServer creates a new server instance
func NewServer(addr string, opaURL string, githubToken string) *Server {
	return &Server{
		addr:          addr,
		opaURL:        opaURL,
		opalServerURL: "http://localhost:8084", // Default OPAL server URL for local development
		githubToken:   githubToken,
	}
}

// NewServerWithOPAL creates a new server instance with custom OPAL server and client URLs
func NewServerWithOPAL(addr string, opaURL string, opalServerURL string, opalClientURL string, githubToken string) *Server {
	return &Server{
		addr:          addr,
		opaURL:        opaURL,
		opalServerURL: opalServerURL,
		opalClientURL: opalClientURL,
		githubToken:   githubToken,
	}
}

// routeHandler wraps multiple handlers for different HTTP methods
func routeHandler(methodHandlers map[string]http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if handler, exists := methodHandlers[r.Method]; exists {
			handler(w, r)
		} else {
			utils.SendErrorResponse(w, utils.ErrMethodNotAllowed)
		}
	}
}

// Start initializes and starts the server
func (s *Server) Start() error {

	// Register READ-ONLY policy routes
	http.HandleFunc("/api/v1/policies", routeHandler(map[string]http.HandlerFunc{
		http.MethodGet: policies.GetPoliciesHandler,
	}))

	http.HandleFunc("/api/v1/policies/", routeHandler(map[string]http.HandlerFunc{
		http.MethodGet: policies.GetPolicyHandler,
	}))

	// Register policy enable/disable routes
	http.HandleFunc("/api/v1/policies/enable/", routeHandler(map[string]http.HandlerFunc{
		http.MethodPost: policies.EnablePolicy,
	}))

	http.HandleFunc("/api/v1/policies/disable/", routeHandler(map[string]http.HandlerFunc{
		http.MethodPost: policies.DisablePolicy,
	}))

	// Start server
	log.Printf("Starting CC API server on %s", s.addr)
	log.Printf("OPA Engine URL: %s", s.opaURL)

	log.Printf("Admin Layer SERVER URL: %s", s.opalServerURL)
	log.Printf("Admin Layer CLIENT URL: %s", s.opalClientURL)

	return http.ListenAndServe(s.addr, nil)
}
