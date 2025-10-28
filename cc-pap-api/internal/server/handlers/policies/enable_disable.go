package policies

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/controlcoreio/cc-policy-admin-api/internal/server/opa"
	"github.com/controlcoreio/cc-policy-admin-api/internal/server/utils"
)

// EnablePolicyRequest represents the request body for enabling a policy
type EnablePolicyRequest struct {
	CommitMessage string `json:"commit_message,omitempty"`
}

// DisablePolicyRequest represents the request body for disabling a policy
type DisablePolicyRequest struct {
	CommitMessage string `json:"commit_message,omitempty"`
}

// EnablePolicy enables a policy in OPA by moving it from disabled to enabled path
func EnablePolicy(w http.ResponseWriter, r *http.Request) {
	policyID, err := utils.ExtractPolicyIDFromEnablePath(r)
	if err != nil {
		utils.SendErrorResponse(w, err)
		return
	}

	opaURL := os.Getenv("OPA_URL")
	if opaURL == "" {
		opaURL = "http://localhost:8181"
	}

	log.Printf("Enabling policy '%s' in OPA at: %s", policyID, opaURL)

	// Enable the policy by moving it from disabled to enabled path
	if err := opa.EnablePolicyInOPA(opaURL, policyID); err != nil {
		log.Printf("Failed to enable policy '%s': %v", policyID, err)
		http.Error(w, fmt.Sprintf("Failed to enable policy: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully enabled policy '%s'", policyID)

	// Return success response
	response := map[string]interface{}{
		"message":   fmt.Sprintf("Policy '%s' has been enabled successfully", policyID),
		"policy_id": policyID,
		"status":    "enabled",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// DisablePolicy disables a policy in OPA by moving it from enabled to disabled path
func DisablePolicy(w http.ResponseWriter, r *http.Request) {
	policyID, err := utils.ExtractPolicyIDFromDisablePath(r)
	if err != nil {
		utils.SendErrorResponse(w, err)
		return
	}

	opaURL := os.Getenv("OPA_URL")
	if opaURL == "" {
		opaURL = "http://localhost:8181"
	}

	log.Printf("Disabling policy '%s' in OPA at: %s", policyID, opaURL)

	// Disable the policy by moving it from enabled to disabled path
	if err := opa.DisablePolicyInOPA(opaURL, policyID); err != nil {
		log.Printf("Failed to disable policy '%s': %v", policyID, err)
		http.Error(w, fmt.Sprintf("Failed to disable policy: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully disabled policy '%s'", policyID)

	// Return success response
	response := map[string]interface{}{
		"message":   fmt.Sprintf("Policy '%s' has been disabled successfully", policyID),
		"policy_id": policyID,
		"status":    "disabled",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
