"""
GitHub Validator Service
Validates GitHub repository integrity and detects unauthorized changes.
Part of SOC2 security controls - ensures policies are only modified through Control Plane.
"""

import logging
from typing import List, Dict, Any, Set
from github import Github, GithubException
from sqlalchemy.orm import Session
from app.models import Policy, ProtectedResource, GitHubConfiguration

logger = logging.getLogger(__name__)


class GitHubValidator:
    """Service for validating GitHub repository and detecting unauthorized changes.
    
    Security Features:
    - Validate folder structure integrity
    - Detect files not created by Control Plane
    - Detect policy files without corresponding database records
    - Report violations for audit logging
    """
    
    def __init__(self, repo_url: str, branch: str, access_token: str):
        """Initialize GitHub validator.
        
        Args:
            repo_url: GitHub repository URL
            branch: Branch to validate
            access_token: GitHub personal access token
        """
        self.repo_url = repo_url
        self.branch = branch
        self._github_client = Github(access_token)
        self._repo = None
        self._initialize()
    
    def _initialize(self):
        """Initialize GitHub client and repository connection."""
        try:
            repo_path = self.repo_url.replace('https://github.com/', '').replace('.git', '').strip('/')
            self._repo = self._github_client.get_repo(repo_path)
            logger.info(f"GitHub validator initialized for repo: {repo_path}")
        except Exception as e:
            logger.error(f"Failed to initialize GitHub validator: {e}")
            self._repo = None
    
    def validate_folder_structure(self, resource_name: str) -> Dict[str, Any]:
        """Validate that expected folder structure exists for a resource.
        
        Expected structure:
        policies/{resource}/
        ├── sandbox/
        │   ├── draft/
        │   ├── enabled/
        │   └── disabled/
        └── production/
            ├── enabled/
            └── disabled/
        
        Args:
            resource_name: Name of the resource to validate
            
        Returns:
            Validation result with missing folders
        """
        if not self._repo:
            return {
                "valid": False,
                "error": "GitHub repository not initialized"
            }
        
        try:
            expected_folders = [
                f"policies/{resource_name}/sandbox/draft",
                f"policies/{resource_name}/sandbox/enabled",
                f"policies/{resource_name}/sandbox/disabled",
                f"policies/{resource_name}/production/enabled",
                f"policies/{resource_name}/production/disabled"
            ]
            
            missing_folders = []
            existing_folders = []
            
            for folder_path in expected_folders:
                try:
                    # Try to get contents of folder
                    self._repo.get_contents(folder_path, ref=self.branch)
                    existing_folders.append(folder_path)
                except GithubException as e:
                    if e.status == 404:
                        missing_folders.append(folder_path)
                    else:
                        raise
            
            return {
                "valid": len(missing_folders) == 0,
                "resource_name": resource_name,
                "missing_folders": missing_folders,
                "existing_folders": existing_folders,
                "message": "Folder structure is valid" if len(missing_folders) == 0 
                          else f"Missing {len(missing_folders)} required folders"
            }
            
        except GithubException as e:
            logger.error(f"GitHub API error validating folder structure: {e}")
            return {
                "valid": False,
                "error": f"GitHub API error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error validating folder structure: {e}")
            return {
                "valid": False,
                "error": f"Validation error: {str(e)}"
            }
    
    def detect_unauthorized_files(
        self,
        resource_name: str,
        known_policy_ids: Set[int]
    ) -> Dict[str, Any]:
        """Detect files in GitHub that were not created by Control Plane.
        
        Security Check: Find .rego files that don't match database policies.
        SOC2 Requirement: Detect tampering or unauthorized modifications.
        
        Args:
            resource_name: Resource to check
            known_policy_ids: Set of valid policy IDs from database
            
        Returns:
            Dict with unauthorized file details
        """
        if not self._repo:
            return {
                "has_unauthorized_files": False,
                "error": "GitHub repository not initialized"
            }
        
        try:
            unauthorized_files = []
            
            # Check all folders for this resource
            folders_to_check = [
                f"policies/{resource_name}/sandbox/draft",
                f"policies/{resource_name}/sandbox/enabled",
                f"policies/{resource_name}/sandbox/disabled",
                f"policies/{resource_name}/production/enabled",
                f"policies/{resource_name}/production/disabled"
            ]
            
            for folder in folders_to_check:
                try:
                    contents = self._repo.get_contents(folder, ref=self.branch)
                    
                    # Handle both single file and list of files
                    if not isinstance(contents, list):
                        contents = [contents]
                    
                    for item in contents:
                        # Skip .gitkeep and non-rego files
                        if item.name == ".gitkeep" or not item.name.endswith(".rego"):
                            continue
                        
                        # Check if file follows naming convention: policy_<id>.rego
                        if not item.name.startswith("policy_"):
                            unauthorized_files.append({
                                "path": item.path,
                                "name": item.name,
                                "folder": folder,
                                "reason": "Unexpected naming pattern (expected: policy_<id>.rego)",
                                "severity": "HIGH"
                            })
                            continue
                        
                        # Extract policy ID from filename
                        try:
                            policy_id_str = item.name.replace("policy_", "").replace(".rego", "")
                            policy_id = int(policy_id_str)
                            
                            # Check if this policy ID exists in database
                            if policy_id not in known_policy_ids:
                                unauthorized_files.append({
                                    "path": item.path,
                                    "name": item.name,
                                    "folder": folder,
                                    "reason": f"Policy ID {policy_id} not found in database",
                                    "severity": "CRITICAL"
                                })
                        except ValueError:
                            unauthorized_files.append({
                                "path": item.path,
                                "name": item.name,
                                "folder": folder,
                                "reason": "Invalid policy ID format in filename",
                                "severity": "HIGH"
                            })
                
                except GithubException as e:
                    if e.status == 404:
                        # Folder doesn't exist - that's okay
                        logger.info(f"Folder {folder} does not exist")
                    else:
                        raise
            
            return {
                "has_unauthorized_files": len(unauthorized_files) > 0,
                "unauthorized_files": unauthorized_files,
                "count": len(unauthorized_files),
                "resource_name": resource_name,
                "message": f"Found {len(unauthorized_files)} unauthorized file(s)" 
                          if len(unauthorized_files) > 0 
                          else "No unauthorized files detected"
            }
            
        except GithubException as e:
            logger.error(f"GitHub API error detecting unauthorized files: {e}")
            return {
                "has_unauthorized_files": False,
                "error": f"GitHub API error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error detecting unauthorized files: {e}")
            return {
                "has_unauthorized_files": False,
                "error": f"Detection error: {str(e)}"
            }
    
    def list_files_in_folder(self, folder_path: str) -> List[Dict[str, Any]]:
        """List all files in a GitHub folder.
        
        Args:
            folder_path: Path to folder in repository
            
        Returns:
            List of file information
        """
        if not self._repo:
            return []
        
        try:
            contents = self._repo.get_contents(folder_path, ref=self.branch)
            
            if not isinstance(contents, list):
                contents = [contents]
            
            files = []
            for item in contents:
                if item.type == "file":
                    files.append({
                        "name": item.name,
                        "path": item.path,
                        "size": item.size,
                        "sha": item.sha
                    })
            
            return files
            
        except GithubException as e:
            if e.status == 404:
                logger.info(f"Folder {folder_path} does not exist")
                return []
            logger.error(f"GitHub API error listing files: {e}")
            return []
        except Exception as e:
            logger.error(f"Error listing files in folder: {e}")
            return []
    
    def test_connection(self) -> bool:
        """Test if GitHub connection is working.
        
        Returns:
            True if connection is healthy, False otherwise
        """
        if not self._repo:
            return False
        
        try:
            # Try to get repo info
            _ = self._repo.name
            _ = self._repo.default_branch
            return True
        except Exception as e:
            logger.error(f"GitHub connection test failed: {e}")
            return False


def get_github_validator_from_db(db: Session) -> Optional[GitHubValidator]:
    """Factory function to create GitHubValidator from database configuration.
    
    Args:
        db: Database session
        
    Returns:
        GitHubValidator instance or None if not configured
    """
    from app.security.credential_encryption import decrypt_credential
    
    config = db.query(GitHubConfiguration).first()
    
    if not config or not config.repo_url or not config.access_token:
        logger.warning("GitHub configuration not found or incomplete")
        return None
    
    # Decrypt token if encrypted
    try:
        token = decrypt_credential(config.access_token)
    except:
        # If decryption fails, assume it's plaintext (for backward compatibility)
        token = config.access_token
    
    return GitHubValidator(
        repo_url=config.repo_url,
        branch=config.branch or "main",
        access_token=token
    )

