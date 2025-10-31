"""
GitHub Writer Service - Policy Authoring to GitHub
This service writes .rego policy files to GitHub repository.
DOES NOT manage OPAL or policy distribution - that's handled by OPAL in bouncers.

Control Plane Role: Policy Authoring + GitHub Writing
OPAL Role: Policy Distribution (handled by bouncer's OPAL Server + Client)
"""

import logging
from typing import Optional, Dict, Any
from github import Github, GithubException
from sqlalchemy.orm import Session
from app.models import GitHubConfiguration
from datetime import datetime

logger = logging.getLogger(__name__)


class GitHubWriter:
    """Service for writing policy files to GitHub repository.
    
    This service ONLY writes .rego files to GitHub when policies are created/updated
    in the Control Plane. It does NOT manage OPAL sync - that's handled by the 
    OPAL Server+Client running in each bouncer.
    """
    
    def __init__(self, repo_url: str, branch: str, access_token: str):
        """Initialize GitHub writer with repository details.
        
        Args:
            repo_url: GitHub repository URL (e.g., https://github.com/org/policies)
            branch: Branch to commit to (e.g., main)
            access_token: GitHub personal access token with repo permissions
        """
        self.repo_url = repo_url
        self.branch = branch
        self._github_client = Github(access_token)
        self._repo = None
        self._initialize()
    
    def _initialize(self):
        """Initialize GitHub client and repository connection."""
        try:
            # Extract owner and repo from URL
            # Expected format: https://github.com/owner/repo or owner/repo
            repo_path = self.repo_url.replace('https://github.com/', '').replace('.git', '').strip('/')
            self._repo = self._github_client.get_repo(repo_path)
            
            logger.info(f"GitHub writer initialized for repo: {repo_path}")
            
        except Exception as e:
            logger.error(f"Failed to initialize GitHub writer: {e}")
            self._repo = None
    
    def commit_policy(
        self,
        policy_id: int,
        rego_code: str,
        folder_path: str,
        commit_message: str,
        policy_name: str = ""
    ) -> Dict[str, Any]:
        """Commit a policy .rego file to GitHub.
        
        Args:
            policy_id: Policy database ID
            rego_code: Rego policy code content
            folder_path: Target folder path (e.g., "policies/api-gateway/sandbox/enabled")
            commit_message: Git commit message
            policy_name: Optional policy name for logging
            
        Returns:
            Dict with success status, commit SHA, and any errors
        """
        if not self._repo:
            return {
                "success": False,
                "error": "GitHub repository not initialized"
            }
        
        try:
            file_path = f"{folder_path}/policy_{policy_id}.rego"
            
            # Check if file exists
            file_exists = False
            existing_sha = None
            try:
                contents = self._repo.get_contents(file_path, ref=self.branch)
                file_exists = True
                existing_sha = contents.sha
            except GithubException as e:
                if e.status != 404:
                    raise
            
            # Commit the file (create or update)
            if file_exists:
                # Update existing file
                result = self._repo.update_file(
                    path=file_path,
                    message=commit_message,
                    content=rego_code,
                    sha=existing_sha,
                    branch=self.branch
                )
                logger.info(f"Updated policy {policy_id} in GitHub at {file_path}")
            else:
                # Create new file
                result = self._repo.create_file(
                    path=file_path,
                    message=commit_message,
                    content=rego_code,
                    branch=self.branch
                )
                logger.info(f"Created policy {policy_id} in GitHub at {file_path}")
            
            return {
                "success": True,
                "commit_sha": result['commit'].sha,
                "file_path": file_path,
                "action": "updated" if file_exists else "created"
            }
            
        except GithubException as e:
            error_msg = f"GitHub API error: {str(e)}"
            logger.error(f"Failed to commit policy {policy_id}: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "status_code": e.status if hasattr(e, 'status') else None
            }
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Failed to commit policy {policy_id}: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
    
    def delete_policy(
        self,
        policy_id: int,
        folder_path: str,
        commit_message: str
    ) -> Dict[str, Any]:
        """Delete a policy file from GitHub.
        
        Args:
            policy_id: Policy database ID
            folder_path: Folder containing the policy
            commit_message: Git commit message
            
        Returns:
            Dict with success status and any errors
        """
        if not self._repo:
            return {
                "success": False,
                "error": "GitHub repository not initialized"
            }
        
        try:
            file_path = f"{folder_path}/policy_{policy_id}.rego"
            
            # Get file to obtain SHA
            try:
                contents = self._repo.get_contents(file_path, ref=self.branch)
            except GithubException as e:
                if e.status == 404:
                    # File doesn't exist, consider it already deleted
                    logger.warning(f"Policy {policy_id} not found in GitHub at {file_path}")
                    return {
                        "success": True,
                        "message": "File already deleted or never existed"
                    }
                raise
            
            # Delete the file
            self._repo.delete_file(
                path=file_path,
                message=commit_message,
                sha=contents.sha,
                branch=self.branch
            )
            
            logger.info(f"Deleted policy {policy_id} from GitHub at {file_path}")
            
            return {
                "success": True,
                "file_path": file_path,
                "action": "deleted"
            }
            
        except GithubException as e:
            error_msg = f"GitHub API error: {str(e)}"
            logger.error(f"Failed to delete policy {policy_id}: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Failed to delete policy {policy_id}: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
    
    def move_policy(
        self,
        policy_id: int,
        from_folder: str,
        to_folder: str,
        commit_message: str
    ) -> Dict[str, Any]:
        """Move a policy file between folders (e.g., draft → enabled).
        
        This is implemented as: read from source → write to destination → delete source
        
        Args:
            policy_id: Policy database ID
            from_folder: Source folder path
            to_folder: Destination folder path
            commit_message: Git commit message
            
        Returns:
            Dict with success status and any errors
        """
        if not self._repo:
            return {
                "success": False,
                "error": "GitHub repository not initialized"
            }
        
        try:
            from_path = f"{from_folder}/policy_{policy_id}.rego"
            to_path = f"{to_folder}/policy_{policy_id}.rego"
            
            # Read content from source
            try:
                source_contents = self._repo.get_contents(from_path, ref=self.branch)
                content = source_contents.decoded_content.decode('utf-8')
                source_sha = source_contents.sha
            except GithubException as e:
                if e.status == 404:
                    return {
                        "success": False,
                        "error": f"Source file not found: {from_path}"
                    }
                raise
            
            # Check if destination already exists
            dest_exists = False
            dest_sha = None
            try:
                dest_contents = self._repo.get_contents(to_path, ref=self.branch)
                dest_exists = True
                dest_sha = dest_contents.sha
            except GithubException as e:
                if e.status != 404:
                    raise
            
            # Write to destination (create or update)
            if dest_exists:
                self._repo.update_file(
                    path=to_path,
                    message=commit_message,
                    content=content,
                    sha=dest_sha,
                    branch=self.branch
                )
            else:
                self._repo.create_file(
                    path=to_path,
                    message=commit_message,
                    content=content,
                    branch=self.branch
                )
            
            # Delete source
            self._repo.delete_file(
                path=from_path,
                message=f"Remove from {from_folder} (moved to {to_folder})",
                sha=source_sha,
                branch=self.branch
            )
            
            logger.info(f"Moved policy {policy_id} from {from_folder} to {to_folder}")
            
            return {
                "success": True,
                "from_path": from_path,
                "to_path": to_path,
                "action": "moved"
            }
            
        except GithubException as e:
            error_msg = f"GitHub API error: {str(e)}"
            logger.error(f"Failed to move policy {policy_id}: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Failed to move policy {policy_id}: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
    
    def create_folder_structure(self, resource_name: str) -> Dict[str, Any]:
        """Create folder structure for a new resource.
        
        Creates:
        - policies/{resource}/sandbox/enabled/
        - policies/{resource}/sandbox/disabled/
        - policies/{resource}/production/enabled/
        - policies/{resource}/production/disabled/
        
        Args:
            resource_name: Name of the resource
            
        Returns:
            Dict with success status and created folders
        """
        if not self._repo:
            return {
                "success": False,
                "error": "GitHub repository not initialized"
            }
        
        try:
            folders_to_create = [
                f"policies/{resource_name}/sandbox/enabled",
                f"policies/{resource_name}/sandbox/disabled",
                f"policies/{resource_name}/production/enabled",
                f"policies/{resource_name}/production/disabled"
            ]
            
            created_folders = []
            for folder_path in folders_to_create:
                gitkeep_path = f"{folder_path}/.gitkeep"
                
                # Check if folder exists (by checking for .gitkeep)
                try:
                    self._repo.get_contents(gitkeep_path, ref=self.branch)
                    logger.info(f"Folder already exists: {folder_path}")
                    continue
                except GithubException as e:
                    if e.status != 404:
                        raise
                
                # Create .gitkeep to maintain empty folder
                self._repo.create_file(
                    path=gitkeep_path,
                    message=f"Create folder structure for {resource_name}",
                    content=f"# Policy folder for {resource_name}\n",
                    branch=self.branch
                )
                created_folders.append(folder_path)
                logger.info(f"Created folder: {folder_path}")
            
            return {
                "success": True,
                "resource_name": resource_name,
                "folders_created": created_folders,
                "folders_total": len(folders_to_create)
            }
            
        except GithubException as e:
            error_msg = f"GitHub API error: {str(e)}"
            logger.error(f"Failed to create folder structure for {resource_name}: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Failed to create folder structure for {resource_name}: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
    
    def is_configured(self) -> bool:
        """Check if GitHub writer is properly configured.
        
        Returns:
            True if configured and ready, False otherwise
        """
        return self._repo is not None


def get_github_writer_from_db(db: Session) -> Optional[GitHubWriter]:
    """Factory function to create GitHubWriter from database configuration.
    
    Args:
        db: Database session
        
    Returns:
        GitHubWriter instance or None if not configured
    """
    config = db.query(GitHubConfiguration).first()
    
    if not config or not config.repo_url or not config.access_token:
        logger.warning("GitHub configuration not found or incomplete")
        return None
    
    return GitHubWriter(
        repo_url=config.repo_url,
        branch=config.branch or "main",
        access_token=config.access_token
    )


def get_github_writer_for_bouncer(bouncer_id: str, db: Session) -> Optional[GitHubWriter]:
    """Get GitHub writer configured for a specific bouncer.
    
    Each bouncer can use either:
    - Tenant default GitHub configuration
    - Custom GitHub configuration
    
    Args:
        bouncer_id: Unique bouncer identifier
        db: Database session
        
    Returns:
        GitHubWriter instance or None if not configured
    """
    from app.models import BouncerOPALConfiguration, GitHubConfiguration
    
    # Get bouncer's OPAL configuration
    opal_config = db.query(BouncerOPALConfiguration).filter(
        BouncerOPALConfiguration.bouncer_id == bouncer_id
    ).first()
    
    if not opal_config:
        logger.warning(f"No OPAL configuration found for bouncer {bouncer_id}")
        return None
    
    # Determine which GitHub config to use
    if opal_config.use_tenant_default:
        # Use tenant's default GitHub configuration
        github_config = db.query(GitHubConfiguration).first()
        if not github_config or not github_config.repo_url or not github_config.access_token:
            logger.warning("Tenant GitHub configuration not found or incomplete")
            return None
        
        return GitHubWriter(
            repo_url=github_config.repo_url,
            branch=github_config.branch or "main",
            access_token=github_config.access_token
        )
    else:
        # Use bouncer's custom GitHub configuration
        if not opal_config.custom_repo_url or not opal_config.custom_access_token:
            logger.warning(f"Bouncer {bouncer_id} custom GitHub configuration incomplete")
            return None
        
        return GitHubWriter(
            repo_url=opal_config.custom_repo_url,
            branch=opal_config.custom_branch or "main",
            access_token=opal_config.custom_access_token
        )

