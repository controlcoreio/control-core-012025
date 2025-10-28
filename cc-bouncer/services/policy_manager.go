package services

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// PolicyManager manages policy synchronization and updates
type PolicyManager struct {
	policyCache *PolicyCache
	opalClient  *OPALClient
}

// NewPolicyManager creates a new policy manager
func NewPolicyManager(policyCache *PolicyCache, opalClient *OPALClient) *PolicyManager {
	return &PolicyManager{
		policyCache: policyCache,
		opalClient:  opalClient,
	}
}

// SyncPoliciesFromOPAL synchronizes policies from OPAL server
func (pm *PolicyManager) SyncPoliciesFromOPAL(ctx context.Context) error {
	logrus.Info("🔄 POLICY: Starting policy synchronization from OPAL")

	// Fetch policy bundle from OPAL
	policyBundle, err := pm.opalClient.FetchPolicyBundle()
	if err != nil {
		return fmt.Errorf("failed to fetch policy bundle: %w", err)
	}

	// Update policy cache
	if err := pm.policyCache.UpdatePolicies(policyBundle); err != nil {
		return fmt.Errorf("failed to update policy cache: %w", err)
	}

	logrus.WithField("policy_count", len(policyBundle.Policies)).Info("✅ POLICY: Policy synchronization completed")
	return nil
}

// GetPolicy retrieves a policy by ID
func (pm *PolicyManager) GetPolicy(policyID string) (*Policy, error) {
	return pm.policyCache.GetPolicy(policyID)
}

// ListPolicies returns all policies
func (pm *PolicyManager) ListPolicies() ([]*Policy, error) {
	return pm.policyCache.ListPolicies()
}

// RefreshPolicies refreshes the policy cache
func (pm *PolicyManager) RefreshPolicies(ctx context.Context) error {
	return pm.SyncPoliciesFromOPAL(ctx)
}

// GetPolicyStats returns policy statistics
func (pm *PolicyManager) GetPolicyStats() map[string]interface{} {
	return pm.policyCache.GetStats()
}

// GetLastSync returns the last sync time (placeholder implementation)
func (pm *PolicyManager) GetLastSync() time.Time {
	// This would need to be tracked in the PolicyManager struct
	// For now, return current time as placeholder
	return time.Now()
}

// GetCacheStats returns cache statistics
func (pm *PolicyManager) GetCacheStats() map[string]interface{} {
	return pm.policyCache.GetStats()
}

// InvalidateCache invalidates the policy cache
func (pm *PolicyManager) InvalidateCache() {
	pm.policyCache.Clear()
	logrus.Info("📋 POLICY: Cache invalidated")
}

// GetDataSources returns data sources (placeholder implementation)
func (pm *PolicyManager) GetDataSources() ([]DataSource, error) {
	// This would need to be implemented to fetch from OPAL
	// For now, return empty slice as placeholder
	return []DataSource{}, nil
}
