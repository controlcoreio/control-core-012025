package git

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport/http"

	"github.com/controlcoreio/cc-policy-admin-api/internal/server/models"
)

// PolicyGitService handles Git operations for policy management
type PolicyGitService struct {
	repoURL     string
	token       string
	localPath   string
	cloneBranch string
}

// PolicyFileInfo contains metadata about a policy file
type PolicyFileInfo struct {
	ID           string
	Path         string
	Status       string
	Content      string
	LastModified time.Time
	ModifiedBy   string
	CreatedAt    time.Time
	CreatedBy    string
	Version      string
}

// NewPolicyGitService creates a new instance of PolicyGitService
func NewPolicyGitService(repoURL, token, localPath, branch string) *PolicyGitService {
	if branch == "" {
		branch = "main"
	}
	if localPath == "" {
		// Use system temp directory instead of current working directory
		tempDir, err := os.MkdirTemp(os.TempDir(), "temp_policy_repo_*")
		if err != nil {
			log.Printf("Warning: failed to create temp directory, falling back to default: %v", err)
			localPath = filepath.Join(os.TempDir(), "temp_policy_repo")
		} else {
			localPath = tempDir
		}
	}

	return &PolicyGitService{
		repoURL:     repoURL,
		token:       token,
		localPath:   localPath,
		cloneBranch: branch,
	}
}

// ScanPolicies scans the repository for all policies and returns their metadata
func (s *PolicyGitService) ScanPolicies() ([]models.PolicyWidget, error) {
	return s.performGitOperation("scan", "", func(repo *git.Repository) ([]models.PolicyWidget, error) {
		var policies []models.PolicyWidget

		// Scan enabled policies
		enabledPolicies, err := s.scanDirectory(repo, "policies/enabled", models.PolicyStatusEnabled)
		if err != nil {
			log.Printf("Warning: failed to scan enabled policies: %v", err)
		} else {
			policies = append(policies, enabledPolicies...)
		}

		// Scan disabled policies
		disabledPolicies, err := s.scanDirectory(repo, "policies/disabled", models.PolicyStatusDisabled)
		if err != nil {
			log.Printf("Warning: failed to scan disabled policies: %v", err)
		} else {
			policies = append(policies, disabledPolicies...)
		}

		return policies, nil
	})
}

// scanDirectory scans a specific directory for policy files
func (s *PolicyGitService) scanDirectory(repo *git.Repository, dirPath, status string) ([]models.PolicyWidget, error) {
	var policies []models.PolicyWidget

	fullPath := filepath.Join(s.localPath, dirPath)

	// Check if directory exists
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		log.Printf("Directory does not exist: %s", fullPath)
		return policies, nil
	}

	// Read directory contents
	files, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory %s: %w", fullPath, err)
	}

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".rego") {
			continue
		}

		policyPath := filepath.Join(dirPath, file.Name())
		policyID := strings.TrimSuffix(file.Name(), ".rego")

		// Read policy content
		content, err := s.readPolicyContent(filepath.Join(fullPath, file.Name()))
		if err != nil {
			log.Printf("Warning: failed to read policy content for %s: %v", policyID, err)
			content = ""
		}

		// Get Git metadata
		metadata, err := s.getPolicyMetadata(repo, policyPath)
		if err != nil {
			log.Printf("Warning: failed to get Git metadata for %s: %v", policyID, err)
			metadata = &PolicyFileInfo{
				LastModified: time.Now(),
				ModifiedBy:   "Unknown",
				CreatedAt:    time.Now(),
				CreatedBy:    "Unknown",
				Version:      "1.0",
			}
		}

		// Extract policy name and description from content
		name, description := s.extractPolicyMetadata(content, policyID)

		policy := models.PolicyWidget{
			ID:           policyID,
			Name:         name,
			Description:  description,
			Status:       status,
			Scope:        s.generateScope(policyID, content),
			LastModified: metadata.LastModified.Format(time.RFC3339),
			ModifiedBy:   metadata.ModifiedBy,
			Version:      metadata.Version,
			CreatedAt:    metadata.CreatedAt.Format(time.RFC3339),
			CreatedBy:    metadata.CreatedBy,
			Content:      content,
		}

		policies = append(policies, policy)
	}

	return policies, nil
}

// readPolicyContent reads the content of a policy file
func (s *PolicyGitService) readPolicyContent(filePath string) (string, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// extractPolicyMetadata extracts name and description from policy content
func (s *PolicyGitService) extractPolicyMetadata(content, defaultName string) (string, string) {
	name := defaultName
	description := fmt.Sprintf("Policy for %s operations", defaultName)

	// Parse content for package name and comments
	scanner := bufio.NewScanner(strings.NewReader(content))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Extract package name for better naming
		if strings.HasPrefix(line, "package ") {
			packageName := strings.TrimPrefix(line, "package ")
			parts := strings.Split(packageName, ".")
			if len(parts) > 0 {
				name = strings.Title(strings.ReplaceAll(parts[len(parts)-1], "_", " "))
			}
		}

		// Look for description comments
		if strings.HasPrefix(line, "# ") && strings.Contains(strings.ToLower(line), "description") {
			description = strings.TrimPrefix(line, "# ")
			if strings.Contains(strings.ToLower(description), "description:") {
				description = strings.TrimSpace(strings.Split(description, ":")[1])
			}
		}
	}

	// Generate descriptive names based on policy ID
	switch {
	case strings.Contains(strings.ToLower(defaultName), "admin"):
		name = "Admin Access Policy"
		description = "Controls access levels for administrative users"
	case strings.Contains(strings.ToLower(defaultName), "mask"):
		name = "Data Masking Policy"
		description = "Defines data masking rules for sensitive information"
	case strings.Contains(strings.ToLower(defaultName), "main"):
		name = "Main Access Policy"
		description = "Primary access control policy for the application"
	case strings.Contains(strings.ToLower(defaultName), "rbac"):
		name = "Role-Based Access Control"
		description = "Manages role-based permissions and access control"
	case strings.Contains(strings.ToLower(defaultName), "customer"):
		name = "Customer Data Access"
		description = "Regulates who can view and modify customer data"
	}

	return name, description
}

// generateScope generates scope information based on policy content
func (s *PolicyGitService) generateScope(policyID, content string) []string {
	scope := []string{}

	// Analyze content for scope hints
	lowerContent := strings.ToLower(content)

	if strings.Contains(lowerContent, "admin") {
		scope = append(scope, "Role: Administrator")
	}
	if strings.Contains(lowerContent, "user") {
		scope = append(scope, "Role: User")
	}
	if strings.Contains(lowerContent, "manager") {
		scope = append(scope, "Role: Manager")
	}

	// API patterns
	if strings.Contains(lowerContent, "api") || strings.Contains(lowerContent, "endpoint") {
		scope = append(scope, "API: /*")
	}

	// Database patterns
	if strings.Contains(lowerContent, "database") || strings.Contains(lowerContent, "data") {
		scope = append(scope, "Resource: Database")
	}

	// Application patterns
	if strings.Contains(lowerContent, "app") || strings.Contains(lowerContent, "application") {
		scope = append(scope, "App: Main Application")
	}

	// Policy-specific scopes
	switch {
	case strings.Contains(strings.ToLower(policyID), "mask"):
		scope = append(scope, "Data: Sensitive Information", "Operation: Masking")
	case strings.Contains(strings.ToLower(policyID), "admin"):
		scope = append(scope, "App: Admin Portal", "Resource: All")
	case strings.Contains(strings.ToLower(policyID), "main"):
		scope = append(scope, "App: Main Application", "Resource: All")
	}

	if len(scope) == 0 {
		scope = append(scope, "App: General", "Resource: All")
	}

	return scope
}

// getPolicyMetadata gets Git metadata for a policy file
func (s *PolicyGitService) getPolicyMetadata(repo *git.Repository, filePath string) (*PolicyFileInfo, error) {
	// Get commit history for the file
	commits, err := s.getFileCommitHistory(repo, filePath)
	if err != nil {
		return nil, err
	}

	if len(commits) == 0 {
		return &PolicyFileInfo{
			LastModified: time.Now(),
			ModifiedBy:   "System",
			CreatedAt:    time.Now(),
			CreatedBy:    "System",
			Version:      "1.0",
		}, nil
	}

	// Latest commit is the last modification
	latest := commits[0]
	// Oldest commit is the creation
	oldest := commits[len(commits)-1]

	version := fmt.Sprintf("1.%d", len(commits)-1)
	if len(commits) == 1 {
		version = "1.0"
	}

	return &PolicyFileInfo{
		LastModified: latest.Author.When,
		ModifiedBy:   latest.Author.Name,
		CreatedAt:    oldest.Author.When,
		CreatedBy:    oldest.Author.Name,
		Version:      version,
	}, nil
}

// getFileCommitHistory gets the commit history for a specific file
func (s *PolicyGitService) getFileCommitHistory(repo *git.Repository, filePath string) ([]*object.Commit, error) {
	ref, err := repo.Head()
	if err != nil {
		return nil, err
	}

	commitIter, err := repo.Log(&git.LogOptions{
		From:     ref.Hash(),
		FileName: &filePath,
	})
	if err != nil {
		return nil, err
	}
	defer commitIter.Close()

	var commits []*object.Commit
	err = commitIter.ForEach(func(commit *object.Commit) error {
		commits = append(commits, commit)
		return nil
	})

	return commits, err
}

// performGitOperation is a generic method for Git operations that return data
func (s *PolicyGitService) performGitOperation(operation string, policyID string, operationFunc func(*git.Repository) ([]models.PolicyWidget, error)) ([]models.PolicyWidget, error) {
	log.Printf("Starting Git %s process for policy: %s", operation, policyID)

	// Step 1: Clone or open repository
	repo, err := s.ensureRepository()
	if err != nil {
		return nil, fmt.Errorf("failed to prepare repository: %w", err)
	}

	// Step 2: Pull latest changes
	if err := s.pullLatestChanges(repo); err != nil {
		log.Printf("Warning: failed to pull latest changes: %v", err)
		// Continue anyway - might be first commit or network issue
	}

	// Step 3: Execute the specific operation
	result, err := operationFunc(repo)
	if err != nil {
		return nil, fmt.Errorf("failed to execute %s operation: %w", operation, err)
	}

	log.Printf("Successfully completed %s operation", operation)
	return result, nil
}

// EnablePolicy moves a policy from disabled to enabled directory
func (s *PolicyGitService) EnablePolicy(policyID, commitMessage string) error {
	return s.performGitWriteOperation("enable", policyID, func(repo *git.Repository) error {
		filename := s.getPolicyFilename(policyID)
		disabledPath := filepath.Join(s.localPath, "policies", "disabled", filename)
		enabledPath := filepath.Join(s.localPath, "policies", "enabled", filename)

		// Check if policy exists in disabled directory
		if _, err := os.Stat(disabledPath); os.IsNotExist(err) {
			return fmt.Errorf("policy not found in disabled directory: %s", policyID)
		}

		// Read the policy content
		content, err := os.ReadFile(disabledPath)
		if err != nil {
			return fmt.Errorf("failed to read disabled policy: %w", err)
		}

		// Ensure enabled directory exists
		enabledDir := filepath.Dir(enabledPath)
		if err := os.MkdirAll(enabledDir, 0755); err != nil {
			return fmt.Errorf("failed to create enabled directory: %w", err)
		}

		// Write policy to enabled directory
		if err := os.WriteFile(enabledPath, content, 0644); err != nil {
			return fmt.Errorf("failed to write policy to enabled directory: %w", err)
		}

		// Remove from disabled directory
		if err := os.Remove(disabledPath); err != nil {
			return fmt.Errorf("failed to remove policy from disabled directory: %w", err)
		}

		// Add, commit, and push changes
		return s.addEnableDisableCommitPush(repo, policyID, "enabled", commitMessage)
	})
}

// DisablePolicy moves a policy from enabled to disabled directory
func (s *PolicyGitService) DisablePolicy(policyID, commitMessage string) error {
	return s.performGitWriteOperation("disable", policyID, func(repo *git.Repository) error {
		filename := s.getPolicyFilename(policyID)
		enabledPath := filepath.Join(s.localPath, "policies", "enabled", filename)
		disabledPath := filepath.Join(s.localPath, "policies", "disabled", filename)

		// Check if policy exists in enabled directory
		if _, err := os.Stat(enabledPath); os.IsNotExist(err) {
			return fmt.Errorf("policy not found in enabled directory: %s", policyID)
		}

		// Read the policy content
		content, err := os.ReadFile(enabledPath)
		if err != nil {
			return fmt.Errorf("failed to read enabled policy: %w", err)
		}

		// Ensure disabled directory exists
		disabledDir := filepath.Dir(disabledPath)
		if err := os.MkdirAll(disabledDir, 0755); err != nil {
			return fmt.Errorf("failed to create disabled directory: %w", err)
		}

		// Write policy to disabled directory
		if err := os.WriteFile(disabledPath, content, 0644); err != nil {
			return fmt.Errorf("failed to write policy to disabled directory: %w", err)
		}

		// Remove from enabled directory
		if err := os.Remove(enabledPath); err != nil {
			return fmt.Errorf("failed to remove policy from enabled directory: %w", err)
		}

		// Add, commit, and push changes
		return s.addEnableDisableCommitPush(repo, policyID, "disabled", commitMessage)
	})
}

// performGitWriteOperation is a shared method that handles common Git setup and cleanup for write operations
func (s *PolicyGitService) performGitWriteOperation(operation string, policyID string, operationFunc func(*git.Repository) error) error {
	log.Printf("Starting Git %s process for policy: %s", operation, policyID)

	// Step 1: Clone or open repository
	repo, err := s.ensureRepository()
	if err != nil {
		return fmt.Errorf("failed to prepare repository: %w", err)
	}

	// Step 2: Pull latest changes
	if err := s.pullLatestChanges(repo); err != nil {
		log.Printf("Warning: failed to pull latest changes: %v", err)
		// Continue anyway - might be first commit or network issue
	}

	// Step 3: Execute the specific operation
	if err := operationFunc(repo); err != nil {
		return fmt.Errorf("failed to execute %s operation: %w", operation, err)
	}

	log.Printf("Successfully completed %s operation for policy '%s'", operation, policyID)
	return nil
}

// ensureRepository clones the repository if it doesn't exist, or opens it if it does
func (s *PolicyGitService) ensureRepository() (*git.Repository, error) {
	// Check if repository already exists
	if _, err := os.Stat(filepath.Join(s.localPath, ".git")); err == nil {
		log.Printf("Opening existing repository at: %s", s.localPath)
		return git.PlainOpen(s.localPath)
	}

	// Clone the repository
	log.Printf("Cloning repository from: %s", s.repoURL)

	auth := &http.BasicAuth{
		Username: "token", // GitHub token authentication
		Password: s.token,
	}

	repo, err := git.PlainClone(s.localPath, false, &git.CloneOptions{
		URL:           s.repoURL,
		Auth:          auth,
		ReferenceName: s.getBranchReference(),
		SingleBranch:  true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to clone repository: %w", err)
	}

	return repo, nil
}

// pullLatestChanges pulls the latest changes from the remote repository
func (s *PolicyGitService) pullLatestChanges(repo *git.Repository) error {
	log.Printf("Pulling latest changes from remote")

	worktree, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	auth := &http.BasicAuth{
		Username: "token",
		Password: s.token,
	}

	return worktree.Pull(&git.PullOptions{
		Auth:          auth,
		ReferenceName: s.getBranchReference(),
	})
}

// addEnableDisableCommitPush handles Git operations for enabling/disabling policies
func (s *PolicyGitService) addEnableDisableCommitPush(repo *git.Repository, policyID, action, commitMessage string) error {
	worktree, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	filename := s.getPolicyFilename(policyID)

	// Add both the new file and remove the old file
	if action == "enabled" {
		// Add enabled policy, remove disabled policy
		enabledPath := filepath.Join("policies", "enabled", filename)
		disabledPath := filepath.Join("policies", "disabled", filename)

		if _, err := worktree.Add(enabledPath); err != nil {
			return fmt.Errorf("failed to add enabled policy to Git: %w", err)
		}
		if _, err := worktree.Remove(disabledPath); err != nil {
			return fmt.Errorf("failed to remove disabled policy from Git: %w", err)
		}

		log.Printf("Added enabled policy and removed disabled policy from Git: %s", policyID)
	} else {
		// Add disabled policy, remove enabled policy
		disabledPath := filepath.Join("policies", "disabled", filename)
		enabledPath := filepath.Join("policies", "enabled", filename)

		if _, err := worktree.Add(disabledPath); err != nil {
			return fmt.Errorf("failed to add disabled policy to Git: %w", err)
		}
		if _, err := worktree.Remove(enabledPath); err != nil {
			return fmt.Errorf("failed to remove enabled policy from Git: %w", err)
		}

		log.Printf("Added disabled policy and removed enabled policy from Git: %s", policyID)
	}

	// Create commit with custom message
	if commitMessage == "" {
		commitMessage = fmt.Sprintf("%s policy: %s\n\nCommitted via Policy Admin API",
			strings.Title(action[:len(action)-1]), policyID) // Remove 'd' from 'enabled'/'disabled'
	}

	commit, err := worktree.Commit(commitMessage, &git.CommitOptions{
		Author: &object.Signature{
			Name:  "Policy Admin API",
			Email: "policy-admin@controlcore.io",
			When:  time.Now(),
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create commit: %w", err)
	}

	log.Printf("Created commit: %s", commit.String())

	// Push to remote
	auth := &http.BasicAuth{
		Username: "token",
		Password: s.token,
	}

	err = repo.Push(&git.PushOptions{
		Auth: auth,
	})
	if err != nil {
		return fmt.Errorf("failed to push to remote: %w", err)
	}

	log.Printf("Pushed changes to remote repository")
	return nil
}

// getPolicyFilename ensures the policy ID has a .rego extension
func (s *PolicyGitService) getPolicyFilename(policyID string) string {
	if filepath.Ext(policyID) != ".rego" {
		return policyID + ".rego"
	}
	return policyID
}

// getBranchReference returns the Git reference for the configured branch
func (s *PolicyGitService) getBranchReference() plumbing.ReferenceName {
	return plumbing.ReferenceName(fmt.Sprintf("refs/heads/%s", s.cloneBranch))
}

// SaveDraft saves a policy to the drafts/ folder
func (s *PolicyGitService) SaveDraft(policyID, content string) error {
	return s.performGitWriteOperation("save draft", policyID, func(repo *git.Repository) error {
		worktree, err := repo.Worktree()
		if err != nil {
			return fmt.Errorf("failed to get worktree: %w", err)
		}

		filename := s.getPolicyFilename(policyID)
		draftPath := filepath.Join("policies", "drafts", filename)
		fullPath := filepath.Join(s.localPath, draftPath)

		// Create drafts directory if it doesn't exist
		draftsDir := filepath.Join(s.localPath, "policies", "drafts")
		if err := os.MkdirAll(draftsDir, 0755); err != nil {
			return fmt.Errorf("failed to create drafts directory: %w", err)
		}

		// Write the policy content
		if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
			return fmt.Errorf("failed to write draft policy: %w", err)
		}

		// Add file to Git
		if _, err := worktree.Add(draftPath); err != nil {
			return fmt.Errorf("failed to add draft to Git: %w", err)
		}

		// Commit the change
		commitMessage := fmt.Sprintf("Draft: %s", policyID)
		if _, err := worktree.Commit(commitMessage, &git.CommitOptions{
			Author: &object.Signature{
				Name:  "Control Core",
				Email: "policies@controlcore.io",
				When:  time.Now(),
			},
		}); err != nil {
			return fmt.Errorf("failed to commit draft: %w", err)
		}

		// Push to remote
		auth := &http.BasicAuth{
			Username: "token",
			Password: s.token,
		}

		if err := repo.Push(&git.PushOptions{
			Auth: auth,
		}); err != nil {
			return fmt.Errorf("failed to push draft: %w", err)
		}

		log.Printf("Successfully saved draft policy: %s", policyID)
		return nil
	})
}

// PromoteDraftToEnabled moves a policy from drafts/ to sandbox/enabled/
func (s *PolicyGitService) PromoteDraftToEnabled(policyID string) error {
	return s.performGitWriteOperation("promote draft", policyID, func(repo *git.Repository) error {
		worktree, err := repo.Worktree()
		if err != nil {
			return fmt.Errorf("failed to get worktree: %w", err)
		}

		filename := s.getPolicyFilename(policyID)
		draftPath := filepath.Join("policies", "drafts", filename)
		enabledPath := filepath.Join("policies", "sandbox", "enabled", filename)

		draftFullPath := filepath.Join(s.localPath, draftPath)
		enabledFullPath := filepath.Join(s.localPath, enabledPath)

		// Read draft content
		content, err := os.ReadFile(draftFullPath)
		if err != nil {
			return fmt.Errorf("failed to read draft policy: %w", err)
		}

		// Create sandbox/enabled directory if it doesn't exist
		enabledDir := filepath.Join(s.localPath, "policies", "sandbox", "enabled")
		if err := os.MkdirAll(enabledDir, 0755); err != nil {
			return fmt.Errorf("failed to create enabled directory: %w", err)
		}

		// Write to enabled folder
		if err := os.WriteFile(enabledFullPath, content, 0644); err != nil {
			return fmt.Errorf("failed to write enabled policy: %w", err)
		}

		// Remove from drafts
		if err := os.Remove(draftFullPath); err != nil {
			log.Printf("Warning: failed to remove draft file: %v", err)
		}

		// Add enabled file and remove draft file from Git
		if _, err := worktree.Add(enabledPath); err != nil {
			return fmt.Errorf("failed to add enabled policy to Git: %w", err)
		}

		if _, err := worktree.Remove(draftPath); err != nil {
			log.Printf("Warning: failed to remove draft from Git: %v", err)
		}

		// Commit the change
		commitMessage := fmt.Sprintf("Promote policy %s from draft to sandbox/enabled", policyID)
		if _, err := worktree.Commit(commitMessage, &git.CommitOptions{
			Author: &object.Signature{
				Name:  "Control Core",
				Email: "policies@controlcore.io",
				When:  time.Now(),
			},
		}); err != nil {
			return fmt.Errorf("failed to commit promotion: %w", err)
		}

		// Push to remote
		auth := &http.BasicAuth{
			Username: "token",
			Password: s.token,
		}

		if err := repo.Push(&git.PushOptions{
			Auth: auth,
		}); err != nil {
			return fmt.Errorf("failed to push promotion: %w", err)
		}

		log.Printf("Successfully promoted draft policy %s to sandbox/enabled", policyID)
		return nil
	})
}

// SaveToEnvironment saves a policy to a specific environment and status folder
func (s *PolicyGitService) SaveToEnvironment(policyID, content, environment, status string) error {
	operation := fmt.Sprintf("save to %s/%s", environment, status)

	return s.performGitWriteOperation(operation, policyID, func(repo *git.Repository) error {
		worktree, err := repo.Worktree()
		if err != nil {
			return fmt.Errorf("failed to get worktree: %w", err)
		}

		filename := s.getPolicyFilename(policyID)
		policyPath := filepath.Join("policies", environment, status, filename)
		fullPath := filepath.Join(s.localPath, policyPath)

		// Create directory if it doesn't exist
		dir := filepath.Dir(fullPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("failed to create directory: %w", err)
		}

		// Write the policy content
		if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
			return fmt.Errorf("failed to write policy: %w", err)
		}

		// Add file to Git
		if _, err := worktree.Add(policyPath); err != nil {
			return fmt.Errorf("failed to add policy to Git: %w", err)
		}

		// Commit the change
		commitMessage := fmt.Sprintf("Save policy %s to %s/%s", policyID, environment, status)
		if _, err := worktree.Commit(commitMessage, &git.CommitOptions{
			Author: &object.Signature{
				Name:  "Control Core",
				Email: "policies@controlcore.io",
				When:  time.Now(),
			},
		}); err != nil {
			return fmt.Errorf("failed to commit policy: %w", err)
		}

		// Push to remote
		auth := &http.BasicAuth{
			Username: "token",
			Password: s.token,
		}

		if err := repo.Push(&git.PushOptions{
			Auth: auth,
		}); err != nil {
			return fmt.Errorf("failed to push policy: %w", err)
		}

		log.Printf("Successfully saved policy %s to %s/%s", policyID, environment, status)
		return nil
	})
}

// Cleanup removes the temporary local repository directory
func (s *PolicyGitService) Cleanup() error {
	if _, err := os.Stat(s.localPath); err == nil {
		log.Printf("Cleaning up temporary repository at: %s", s.localPath)
		return os.RemoveAll(s.localPath)
	}
	return nil
}
