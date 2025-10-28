"""
GitHub Service for Policy Synchronization
Handles syncing policies to GitHub repository in appropriate folders
Integrated with OPAL for real-time policy distribution
"""

import logging
import httpx
from typing import Optional
from github import Github, GithubException
from sqlalchemy.orm import Session
from app.models import GitHubConfiguration, OPALConfiguration

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

