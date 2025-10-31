"""
GitHub Service for Policy Synchronization
Handles syncing policies to GitHub repository in appropriate folders
Integrated with OPAL for real-time policy distribution
"""

import logging
import httpx
from typing import Optional, Dict, List, Tuple
from github import Github, GithubException
from sqlalchemy.orm import Session
from app.models import GitHubConfiguration, OPALConfiguration
from datetime import datetime

logger = logging.getLogger(__name__)


class GitHubService:
    """Service for synchronizing policies to GitHub repository"""
    
    def __init__(self, db: Session):
        """Initialize GitHub service with database session"""
        self.db = db
        self._github_client = None
        self._repo = None
        self._config = None
        self._initialize()
    
    def _initialize(self):
        """Load GitHub configuration from database and initialize client"""
        try:
            self._config = self.db.query(GitHubConfiguration).first()
            
            if not self._config:
                logger.warning("No GitHub configuration found in database")
                return
            
            if not self._config.access_token or not self._config.repo_url:
                logger.warning("GitHub configuration incomplete")
                return
            
            # Initialize GitHub client
            self._github_client = Github(self._config.access_token)
            
            # Extract owner and repo from URL
            # Expected format: https://github.com/owner/repo
            repo_path = self._config.repo_url.replace('https://github.com/', '').replace('.git', '')
            self._repo = self._github_client.get_repo(repo_path)
            
            logger.info(f"GitHub service initialized for repo: {repo_path}")
            
        except Exception as e:
            logger.error(f"Failed to initialize GitHub service: {e}")
            self._github_client = None
            self._repo = None
    
    def _get_file_path(self, policy_id: int, folder: str) -> str:
        """Generate file path for policy in GitHub repo
        
        Args:
            policy_id: Policy database ID
            folder: Target folder (drafts, enabled, disabled, staging, production)
            
        Returns:
            Full path like 'drafts/policy_123.rego'
        """
        return f"{folder}/policy_{policy_id}.rego"
    
    def _get_branch(self) -> str:
        """Get branch name from configuration, default to 'main'"""
        return self._config.branch if self._config and self._config.branch else 'main'
    
    def save_policy_to_github(
        self, 
        policy_id: int, 
        rego_code: str, 
        folder: str,
        policy_name: str = ""
    ) -> bool:
        """Save or update policy file in GitHub
        
        Args:
            policy_id: Policy database ID
            rego_code: Rego policy code content
            folder: Target folder (drafts, enabled, disabled, staging, production)
            policy_name: Optional policy name for commit message
            
        Returns:
            True if successful, False otherwise
        """
        if not self._repo:
            logger.error("GitHub repository not initialized")
            return False
        
        try:
            file_path = self._get_file_path(policy_id, folder)
            branch = self._get_branch()
            commit_message = f"Save policy {policy_id}"
            if policy_name:
                commit_message = f"Save policy '{policy_name}' (ID: {policy_id})"
            
            # Check if file exists
            try:
                contents = self._repo.get_contents(file_path, ref=branch)
                # File exists, update it
                self._repo.update_file(
                    path=file_path,
                    message=f"Update {commit_message}",
                    content=rego_code,
                    sha=contents.sha,
                    branch=branch
                )
                logger.info(f"Updated policy {policy_id} in GitHub at {file_path}")
            except GithubException as e:
                if e.status == 404:
                    # File doesn't exist, create it
                    self._repo.create_file(
                        path=file_path,
                        message=f"Create {commit_message}",
                        content=rego_code,
                        branch=branch
                    )
                    logger.info(f"Created policy {policy_id} in GitHub at {file_path}")
                else:
                    raise
            
            return True
            
        except GithubException as e:
            logger.error(f"GitHub API error saving policy {policy_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error saving policy {policy_id} to GitHub: {e}")
            return False
    
    def get_policy_from_github(self, policy_id: int, folder: str) -> Optional[str]:
        """Retrieve policy file content from GitHub
        
        Args:
            policy_id: Policy database ID
            folder: Folder to search in
            
        Returns:
            Policy content as string, or None if not found
        """
        if not self._repo:
            logger.error("GitHub repository not initialized")
            return None
        
        try:
            file_path = self._get_file_path(policy_id, folder)
            branch = self._get_branch()
            
            contents = self._repo.get_contents(file_path, ref=branch)
            return contents.decoded_content.decode('utf-8')
            
        except GithubException as e:
            if e.status == 404:
                logger.warning(f"Policy {policy_id} not found in GitHub at {folder}")
            else:
                logger.error(f"GitHub API error retrieving policy {policy_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error retrieving policy {policy_id} from GitHub: {e}")
            return None
    
    def move_policy(
        self, 
        policy_id: int, 
        from_folder: str, 
        to_folder: str,
        policy_name: str = ""
    ) -> bool:
        """Move policy file from one folder to another in GitHub
        
        Args:
            policy_id: Policy database ID
            from_folder: Source folder
            to_folder: Destination folder
            policy_name: Optional policy name for commit message
            
        Returns:
            True if successful, False otherwise
        """
        if not self._repo:
            logger.error("GitHub repository not initialized")
            return False
        
        try:
            from_path = self._get_file_path(policy_id, from_folder)
            to_path = self._get_file_path(policy_id, to_folder)
            branch = self._get_branch()
            
            # Get content from source
            try:
                source_contents = self._repo.get_contents(from_path, ref=branch)
                content = source_contents.decoded_content.decode('utf-8')
            except GithubException as e:
                if e.status == 404:
                    logger.warning(f"Source policy {policy_id} not found in {from_folder}")
                    return False
                raise
            
            commit_msg = f"Move policy {policy_id} from {from_folder} to {to_folder}"
            if policy_name:
                commit_msg = f"Move policy '{policy_name}' from {from_folder} to {to_folder}"
            
            # Check if destination exists
            try:
                dest_contents = self._repo.get_contents(to_path, ref=branch)
                # Destination exists, update it
                self._repo.update_file(
                    path=to_path,
                    message=commit_msg,
                    content=content,
                    sha=dest_contents.sha,
                    branch=branch
                )
            except GithubException as e:
                if e.status == 404:
                    # Destination doesn't exist, create it
                    self._repo.create_file(
                        path=to_path,
                        message=commit_msg,
                        content=content,
                        branch=branch
                    )
                else:
                    raise
            
            # Delete source file
            self._repo.delete_file(
                path=from_path,
                message=f"Remove policy {policy_id} from {from_folder} (moved to {to_folder})",
                sha=source_contents.sha,
                branch=branch
            )
            
            logger.info(f"Moved policy {policy_id} from {from_folder} to {to_folder}")
            return True
            
        except GithubException as e:
            logger.error(f"GitHub API error moving policy {policy_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error moving policy {policy_id} in GitHub: {e}")
            return False
    
    def delete_policy(self, policy_id: int, folder: str, policy_name: str = "") -> bool:
        """Delete policy file from GitHub
        
        Args:
            policy_id: Policy database ID
            folder: Folder containing the policy
            policy_name: Optional policy name for commit message
            
        Returns:
            True if successful, False otherwise
        """
        if not self._repo:
            logger.error("GitHub repository not initialized")
            return False
        
        try:
            file_path = self._get_file_path(policy_id, folder)
            branch = self._get_branch()
            
            contents = self._repo.get_contents(file_path, ref=branch)
            
            commit_msg = f"Delete policy {policy_id}"
            if policy_name:
                commit_msg = f"Delete policy '{policy_name}' (ID: {policy_id})"
            
            self._repo.delete_file(
                path=file_path,
                message=commit_msg,
                sha=contents.sha,
                branch=branch
            )
            
            logger.info(f"Deleted policy {policy_id} from GitHub at {file_path}")
            return True
            
        except GithubException as e:
            if e.status == 404:
                logger.warning(f"Policy {policy_id} not found in GitHub for deletion")
                return True  # Already deleted, consider success
            logger.error(f"GitHub API error deleting policy {policy_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting policy {policy_id} from GitHub: {e}")
            return False
    
    def is_configured(self) -> bool:
        """Check if GitHub service is properly configured
        
        Returns:
            True if configured and ready, False otherwise
        """
        return self._repo is not None and self._config is not None
    
    def validate_folder_structure(self) -> Dict[str, any]:
        """Validate that the expected folder structure exists in GitHub repository
        
        Expected structure:
        - policies/
          - drafts/
          - sandbox/
            - enabled/
            - disabled/
          - production/
            - enabled/
            - disabled/
        
        Returns:
            Dictionary with validation results including missing folders and status
        """
        if not self._repo:
            return {
                "valid": False,
                "error": "GitHub repository not initialized"
            }
        
        try:
            branch = self._get_branch()
            expected_paths = [
                "policies",
                "policies/drafts",
                "policies/sandbox",
                "policies/sandbox/enabled",
                "policies/sandbox/disabled",
                "policies/production",
                "policies/production/enabled",
                "policies/production/disabled"
            ]
            
            missing_folders = []
            existing_folders = []
            
            for path in expected_paths:
                try:
                    self._repo.get_contents(path, ref=branch)
                    existing_folders.append(path)
                except GithubException as e:
                    if e.status == 404:
                        missing_folders.append(path)
                    else:
                        raise
            
            return {
                "valid": len(missing_folders) == 0,
                "missing_folders": missing_folders,
                "existing_folders": existing_folders,
                "message": "Folder structure is valid" if len(missing_folders) == 0 else f"Missing {len(missing_folders)} required folders"
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
    
    def detect_unauthorized_changes(self, known_policy_ids: List[int]) -> Dict[str, any]:
        """Detect files in GitHub that were not synced by Control Core
        
        This checks for:
        1. Files with unexpected naming patterns (not policy_<id>.rego)
        2. Files that don't correspond to known policies in the database
        
        Args:
            known_policy_ids: List of policy IDs that exist in the database
            
        Returns:
            Dictionary with unauthorized file details
        """
        if not self._repo:
            return {
                "has_unauthorized_changes": False,
                "error": "GitHub repository not initialized"
            }
        
        try:
            branch = self._get_branch()
            unauthorized_files = []
            
            # Check all policy folders
            folders_to_check = [
                "policies/drafts",
                "policies/sandbox/enabled",
                "policies/sandbox/disabled",
                "policies/production/enabled",
                "policies/production/disabled"
            ]
            
            for folder in folders_to_check:
                try:
                    contents = self._repo.get_contents(folder, ref=branch)
                    if not isinstance(contents, list):
                        contents = [contents]
                    
                    for item in contents:
                        if item.type == "file" and item.name.endswith(".rego"):
                            # Check if file follows expected naming convention
                            if not item.name.startswith("policy_"):
                                unauthorized_files.append({
                                    "path": item.path,
                                    "name": item.name,
                                    "folder": folder,
                                    "reason": "Unexpected naming pattern (expected: policy_<id>.rego)",
                                    "last_modified": item.last_modified if hasattr(item, 'last_modified') else "unknown"
                                })
                            else:
                                # Extract policy ID and check if it exists in database
                                try:
                                    policy_id = int(item.name.replace("policy_", "").replace(".rego", ""))
                                    if policy_id not in known_policy_ids:
                                        unauthorized_files.append({
                                            "path": item.path,
                                            "name": item.name,
                                            "folder": folder,
                                            "reason": f"Policy ID {policy_id} not found in database",
                                            "last_modified": item.last_modified if hasattr(item, 'last_modified') else "unknown"
                                        })
                                except ValueError:
                                    unauthorized_files.append({
                                        "path": item.path,
                                        "name": item.name,
                                        "folder": folder,
                                        "reason": "Invalid policy ID format",
                                        "last_modified": item.last_modified if hasattr(item, 'last_modified') else "unknown"
                                    })
                
                except GithubException as e:
                    if e.status == 404:
                        # Folder doesn't exist, that's okay
                        logger.info(f"Folder {folder} does not exist in GitHub")
                    else:
                        raise
            
            return {
                "has_unauthorized_changes": len(unauthorized_files) > 0,
                "unauthorized_files": unauthorized_files,
                "count": len(unauthorized_files),
                "message": f"Found {len(unauthorized_files)} unauthorized file(s)" if len(unauthorized_files) > 0 else "No unauthorized changes detected"
            }
            
        except GithubException as e:
            logger.error(f"GitHub API error detecting unauthorized changes: {e}")
            return {
                "has_unauthorized_changes": False,
                "error": f"GitHub API error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error detecting unauthorized changes: {e}")
            return {
                "has_unauthorized_changes": False,
                "error": f"Detection error: {str(e)}"
            }
    
    def create_folder_structure(self) -> bool:
        """Create the expected folder structure in GitHub if it doesn't exist
        
        Returns:
            True if successful, False otherwise
        """
        if not self._repo:
            logger.error("GitHub repository not initialized")
            return False
        
        try:
            branch = self._get_branch()
            folders_to_create = [
                ("policies/drafts", "Placeholder for draft policies"),
                ("policies/sandbox/enabled", "Placeholder for enabled sandbox policies"),
                ("policies/sandbox/disabled", "Placeholder for disabled sandbox policies"),
                ("policies/production/enabled", "Placeholder for enabled production policies"),
                ("policies/production/disabled", "Placeholder for disabled production policies")
            ]
            
            for folder_path, readme_content in folders_to_create:
                readme_path = f"{folder_path}/.gitkeep"
                try:
                    # Check if folder exists by checking for .gitkeep
                    self._repo.get_contents(readme_path, ref=branch)
                    logger.info(f"Folder {folder_path} already exists")
                except GithubException as e:
                    if e.status == 404:
                        # Folder doesn't exist, create it with .gitkeep
                        self._repo.create_file(
                            path=readme_path,
                            message=f"Create folder structure: {folder_path}",
                            content=readme_content,
                            branch=branch
                        )
                        logger.info(f"Created folder {folder_path}")
                    else:
                        raise
            
            return True
            
        except GithubException as e:
            logger.error(f"GitHub API error creating folder structure: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error creating folder structure: {e}")
            return False
    
    async def notify_opal_policy_update(self, policy_id: int, folder: str, action: str = "update") -> bool:
        """Notify OPAL server about policy changes
        
        OPAL typically watches the GitHub repo, but we can trigger an immediate update.
        
        Args:
            policy_id: Policy database ID
            folder: Folder where policy was changed (drafts, enabled, etc.)
            action: Type of change (create, update, delete, move)
            
        Returns:
            True if notification successful, False otherwise
        """
        try:
            # Get OPAL configuration
            opal_config = self.db.query(OPALConfiguration).first()
            
            if not opal_config or not opal_config.server_url:
                logger.info("OPAL not configured, skipping notification")
                return False
            
            # Construct policy update notification
            # OPAL expects webhook notifications about Git changes
            payload = {
                "action": action,
                "policy_id": policy_id,
                "folder": folder,
                "file_path": self._get_file_path(policy_id, folder),
                "repository": self._config.repo_url,
                "branch": self._config.branch,
                "timestamp": None  # Will be set by OPAL
            }
            
            # Send notification to OPAL server's webhook endpoint
            # OPAL can be configured to listen for policy updates
            async with httpx.AsyncClient() as client:
                headers = {}
                if opal_config.api_key:
                    headers["Authorization"] = f"Bearer {opal_config.api_key}"
                
                # Try OPAL's webhook endpoint (if configured)
                webhook_url = f"{opal_config.server_url}/webhook/github"
                
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers=headers,
                    timeout=5.0
                )
                
                if response.status_code in [200, 201, 202]:
                    logger.info(f"Successfully notified OPAL about policy {policy_id} {action}")
                    return True
                else:
                    logger.warning(f"OPAL notification returned status {response.status_code}")
                    return False
                    
        except httpx.RequestError as e:
            logger.warning(f"Failed to notify OPAL (connection error): {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error notifying OPAL: {e}")
            return False

