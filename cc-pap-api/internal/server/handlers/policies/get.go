package policies

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/controlcoreio/cc-policy-admin-api/internal/server/models"
	"github.com/controlcoreio/cc-policy-admin-api/internal/server/opa"
	"github.com/controlcoreio/cc-policy-admin-api/internal/server/utils"
)

// GetPoliciesHandler handles GET /api/v1/policies
func GetPoliciesHandler(w http.ResponseWriter, r *http.Request) {
	opaURL := os.Getenv("OPA_URL")
	if opaURL == "" {
		opaURL = "http://localhost:8181"
	}

	log.Printf("Fetching policies from OPA at: %s", opaURL)

	// Get policies from OPA using the Policy API
	policies, err := opa.ListPolicyWidgets(opaURL)
	if err != nil {
		log.Printf("OPA error: %v", err)
		http.Error(w, "Failed to communicate with OPA: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully retrieved %d policies from OPA", len(policies))

	// Create response
	response := models.PolicyWidgetListResponse{
		Policies: policies,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// GetPolicyHandler handles GET /api/v1/policies/{id}
func GetPolicyHandler(w http.ResponseWriter, r *http.Request) {
	policyID, err := utils.ExtractPolicyID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	opaURL := os.Getenv("OPA_URL")
	if opaURL == "" {
		opaURL = "http://localhost:8181"
	}

	log.Printf("Fetching policy '%s' from OPA at: %s", policyID, opaURL)

	// Get specific policy from OPA
	policy, err := opa.GetPolicyWidget(opaURL, policyID)
	if err != nil {
		log.Printf("OPA error: %v", err)
		if err.Error() == "policy not found: "+policyID {
			http.Error(w, "Policy not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to communicate with OPA: "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	log.Printf("Successfully retrieved policy '%s' from OPA", policyID)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(policy); err != nil {
		log.Printf("Failed to encode response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}
