// Package main ControlCore Policy Admin API
//
//	@title		ControlCore Policy Admin API
//	@version	1.0.0
//	@description	API for managing OPA policies, approvals, and data updates
//	@host		localhost:8082
//	@BasePath	/api/v1
//	@schemes	http
package main

import (
	"log"
	"os"

	_ "github.com/controlcoreio/cc-policy-admin-api/docs"
	"github.com/controlcoreio/cc-policy-admin-api/internal/server"
)

func main() {
	// Log startup information
	log.Printf("Starting ControlCore Policy Admin API")

	opaURL := os.Getenv("OPA_URL")
	if opaURL == "" {
		opaURL = "http://localhost:8181"
	}

	opalServerURL := os.Getenv("OPAL_SERVER_URL")
	if opalServerURL == "" {
		opalServerURL = "http://localhost:8084"
	}

	opalClientURL := os.Getenv("OPAL_CLIENT_URL")
	if opalClientURL == "" {
		opalClientURL = "http://localhost:8083"
	}

	githubToken := os.Getenv("GITHUB_TOKEN")
	if githubToken == "" {
		log.Printf("Warning: GITHUB_TOKEN environment variable not set")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	srv := server.NewServerWithOPAL(":"+port, opaURL, opalServerURL, opalClientURL, githubToken)
	if err := srv.Start(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
