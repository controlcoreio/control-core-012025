package policies

import (
	"fmt"
	"log"

	"github.com/controlcoreio/cc-policy-admin-api/internal/server/git"
	"github.com/controlcoreio/cc-policy-admin-api/internal/server/models"
	"github.com/controlcoreio/cc-policy-admin-api/internal/server/utils"
)

// GitPolicyManager handles all Git operations for policy management
type GitPolicyManager struct {
	repoURL     string
	branch      string
	githubToken string
}

// NewGitPolicyManager creates a new Git policy manager with default configuration
func NewGitPolicyManager(githubToken string) *GitPolicyManager {
	return &GitPolicyManager{
		repoURL:     "https://github.com/controlcoreio/staging-policies-repo.git",
		branch:      "main",
		githubToken: githubToken,
	}
}

// ScanAllPolicies scans the Git repository and returns all policies with metadata
func (gpm *GitPolicyManager) ScanAllPolicies() ([]models.PolicyWidget, error) {
	if gpm.githubToken == "" {
		return nil, fmt.Errorf("GITHUB_TOKEN not provided")
	}

	// Use scan-specific local path to avoid conflicts
	localPath := "./temp_policy_scan_repo"

	// Create Git service instance
	gitService := git.NewPolicyGitService(gpm.repoURL, gpm.githubToken, localPath, gpm.branch)

	// Ensure cleanup happens even if there's an error
	defer func() {
		if cleanupErr := gitService.Cleanup(); cleanupErr != nil {
			log.Printf("Warning: failed to cleanup temporary Git repository: %v", cleanupErr)
		}
	}()

	// Scan all policies
	policies, err := gitService.ScanPolicies()
	if err != nil {
		return nil, fmt.Errorf("failed to scan policies from GitHub: %w", err)
	}

	return policies, nil
}

// EnablePolicy moves a policy from disabled to enabled directory
func (gpm *GitPolicyManager) EnablePolicy(policyID, commitMessage string) error {
	return gpm.performGitOperation("enable", policyID, func(gitService *git.PolicyGitService) error {
		return gitService.EnablePolicy(policyID, commitMessage)
	})
}

// DisablePolicy moves a policy from enabled to disabled directory
func (gpm *GitPolicyManager) DisablePolicy(policyID, commitMessage string) error {
	return gpm.performGitOperation("disable", policyID, func(gitService *git.PolicyGitService) error {
		return gitService.DisablePolicy(policyID, commitMessage)
	})
}

// performGitOperation is a shared method that handles Git service setup, execution, and cleanup
func (gpm *GitPolicyManager) performGitOperation(operation, policyID string, operationFunc func(*git.PolicyGitService) error) error {
	if gpm.githubToken == "" {
		return fmt.Errorf("GITHUB_TOKEN not provided")
	}

	// Use operation-specific local path to avoid conflicts
	localPath := fmt.Sprintf("./temp_policy_%s_repo", operation)

	// Create Git service instance
	gitService := git.NewPolicyGitService(gpm.repoURL, gpm.githubToken, localPath, gpm.branch)

	// Ensure cleanup happens even if there's an error
	defer func() {
		if cleanupErr := gitService.Cleanup(); cleanupErr != nil {
			log.Printf("Warning: failed to cleanup temporary Git repository: %v", cleanupErr)
		}
	}()

	// Execute the specific Git operation
	if err := operationFunc(gitService); err != nil {
		return fmt.Errorf("failed to %s policy in GitHub: %w", operation, err)
	}

	return nil
}

// EnablePolicyWithErrorHandling enables a policy and handles errors gracefully
func EnablePolicyWithErrorHandling(policyID, commitMessage, githubToken string) {
	gitManager := NewGitPolicyManager(githubToken)
	if err := gitManager.EnablePolicy(policyID, commitMessage); err != nil {
		utils.LogAndHandleError("enabling policy in GitHub", err)
	}
}

// DisablePolicyWithErrorHandling disables a policy and handles errors gracefully
func DisablePolicyWithErrorHandling(policyID, commitMessage, githubToken string) {
	gitManager := NewGitPolicyManager(githubToken)
	if err := gitManager.DisablePolicy(policyID, commitMessage); err != nil {
		utils.LogAndHandleError("disabling policy in GitHub", err)
	}
}
