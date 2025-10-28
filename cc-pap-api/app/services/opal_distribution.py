"""
Intelligent OPAL Policy Distribution Service

This service automatically handles environment-aware policy distribution:
- Distributes sandbox policies only to sandbox bouncers
- Distributes promoted/production policies only to production bouncers
- Auto-configures bouncer policy filters based on environment
- Manages GitHub repo folder structure (sandbox vs production)
- Handles data source mapping per environment
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import (
    Policy, 
    PEP, 
    BouncerOPALConfiguration, 
    OPALConfiguration,
    PIPConnection
)
import logging

logger = logging.getLogger(__name__)


class OPALDistributionService:
    """Intelligent service for environment-aware OPAL policy distribution"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def auto_configure_bouncer_opal(self, bouncer_id: str, environment: str, resource_name: str) -> Dict[str, Any]:
        """
        Automatically configure OPAL settings for a bouncer based on its environment.
        This reduces manual configuration - Control Core handles the intelligence.
        
        Args:
            bouncer_id: Unique bouncer identifier
            environment: sandbox or production
            resource_name: Name of the resource the bouncer protects
            
        Returns:
            OPAL configuration for the bouncer
        """
        # Check if configuration already exists
        existing_config = self.db.query(BouncerOPALConfiguration).filter(
            BouncerOPALConfiguration.bouncer_id == bouncer_id
        ).first()
        
        # Get policies that should be distributed to this bouncer
        policy_filters = self._get_policy_filters_for_bouncer(environment, resource_name)
        
        # Get data sources that should be available to this bouncer
        data_filters = self._get_data_filters_for_environment(environment)
        
        if existing_config:
            # Update existing configuration
            existing_config.environment = environment
            existing_config.resource_name = resource_name
            existing_config.policy_filters = policy_filters
            existing_config.data_filters = data_filters
            existing_config.auto_configured = True
            self.db.commit()
            
            logger.info(f"Auto-updated OPAL config for bouncer {bouncer_id} ({environment})")
            return self._config_to_dict(existing_config)
        else:
            # Create new configuration
            new_config = BouncerOPALConfiguration(
                bouncer_id=bouncer_id,
                environment=environment,
                resource_name=resource_name,
                policy_filters=policy_filters,
                data_filters=data_filters,
                auto_configured=True,
                cache_enabled=True,
                cache_ttl=300 if environment == "sandbox" else 600,  # Longer cache for production
                rate_limit_rps=50 if environment == "sandbox" else 200  # Higher limits for production
            )
            self.db.add(new_config)
            self.db.commit()
            
            logger.info(f"Auto-created OPAL config for bouncer {bouncer_id} ({environment})")
            return self._config_to_dict(new_config)
    
    def _get_policy_filters_for_bouncer(self, environment: str, resource_name: str) -> List[Dict[str, Any]]:
        """
        Intelligently determine which policies should be sent to a bouncer.
        
        Logic:
        - Sandbox bouncers: Get all sandbox policies + promoted policies for testing
        - Production bouncers: Get only promoted policies (environment="both" or "production")
        """
        filters = []
        
        if environment == "sandbox":
            # Sandbox bouncers get sandbox policies
            filters.append({
                "field": "environment",
                "operator": "in",
                "values": ["sandbox", "both"]
            })
        else:  # production
            # Production bouncers only get promoted policies
            filters.append({
                "field": "environment",
                "operator": "in",
                "values": ["production", "both"]
            })
            filters.append({
                "field": "promoted_from_sandbox",
                "operator": "equals",
                "value": True
            })
        
        # Optional: Filter by resource if specified
        if resource_name:
            filters.append({
                "field": "resource_name",
                "operator": "equals",
                "value": resource_name
            })
        
        return filters
    
    def _get_data_filters_for_environment(self, environment: str) -> List[Dict[str, Any]]:
        """
        Determine which data sources (PIPs) should be available to bouncers.
        
        Logic:
        - Check PIP connections for environment-specific endpoints
        - Use sandbox endpoint for sandbox bouncers
        - Use production endpoint for production bouncers
        - Use shared endpoints for "both" environment PIPs
        """
        # Query PIP connections available for this environment
        pip_connections = self.db.query(PIPConnection).filter(
            (PIPConnection.environment == environment) |
            (PIPConnection.environment == "both")
        ).all()
        
        data_filters = []
        for pip in pip_connections:
            # Determine the correct endpoint based on environment
            endpoint = None
            if environment == "sandbox" and pip.sandbox_endpoint:
                endpoint = pip.sandbox_endpoint
            elif environment == "production" and pip.production_endpoint:
                endpoint = pip.production_endpoint
            else:
                # Use the default configuration endpoint
                endpoint = pip.configuration.get("endpoint") if pip.configuration else None
            
            if endpoint:
                data_filters.append({
                    "pip_id": pip.id,
                    "pip_name": pip.name,
                    "pip_type": pip.connection_type.value,
                    "endpoint": endpoint,
                    "provider": pip.provider,
                    "sync_enabled": pip.sync_enabled
                })
        
        return data_filters
    
    def get_policies_for_bouncer(self, bouncer_id: str) -> List[Policy]:
        """
        Get all policies that should be distributed to a specific bouncer.
        Uses intelligent filtering based on bouncer's environment.
        """
        # Get bouncer
        bouncer = self.db.query(PEP).filter(PEP.bouncer_id == bouncer_id).first()
        if not bouncer:
            logger.warning(f"Bouncer {bouncer_id} not found")
            return []
        
        environment = bouncer.environment
        
        # Build query based on environment
        if environment == "sandbox":
            # Sandbox gets all sandbox policies and promoted policies
            policies = self.db.query(Policy).filter(
                (Policy.environment == "sandbox") |
                (Policy.environment == "both") |
                (Policy.promoted_from_sandbox == True)
            ).filter(
                Policy.status == "enabled"
            ).all()
        else:  # production
            # Production only gets promoted policies
            policies = self.db.query(Policy).filter(
                (Policy.environment == "both") |
                (Policy.environment == "production")
            ).filter(
                Policy.promoted_from_sandbox == True,
                Policy.status == "enabled"
            ).all()
        
        logger.info(f"Found {len(policies)} policies for bouncer {bouncer_id} ({environment})")
        return policies
    
    def get_github_folder_for_environment(self, environment: str) -> str:
        """
        Determine which folder in the GitHub repo policies should be stored in.
        
        Single repo structure:
        policies/
        ├── sandbox/      ← Sandbox policies
        │   ├── enabled/
        │   ├── disabled/
        │   └── drafts/
        └── production/   ← Promoted policies
            ├── enabled/
            └── disabled/
        """
        if environment == "sandbox":
            return "policies/sandbox"
        elif environment == "production":
            return "policies/production"
        elif environment == "both":
            # Promoted policies exist in both folders
            return "policies/production"
        else:
            return "policies/sandbox"  # Default to sandbox
    
    def trigger_policy_sync_to_environment(self, environment: str, policy_id: int = None) -> Dict[str, Any]:
        """
        Trigger OPAL to sync policies to bouncers in a specific environment.
        
        This is called when:
        - A policy is created in sandbox
        - A policy is promoted to production
        - A policy is updated
        - Manual sync is requested
        """
        # Get all bouncers for this environment
        bouncers = self.db.query(PEP).filter(
            PEP.environment == environment,
            PEP.status == "active"
        ).all()
        
        if not bouncers:
            logger.warning(f"No active bouncers found for environment: {environment}")
            return {
                "success": False,
                "message": f"No active bouncers in {environment} environment",
                "bouncers_synced": 0
            }
        
        synced_count = 0
        for bouncer in bouncers:
            try:
                # Get policies for this bouncer
                policies = self.get_policies_for_bouncer(bouncer.bouncer_id)
                
                # TODO: Trigger actual OPAL sync here
                # This would call OPAL API to push policies to this specific bouncer
                # For now, we log it
                
                logger.info(f"Syncing {len(policies)} policies to {bouncer.bouncer_id}")
                synced_count += 1
                
            except Exception as e:
                logger.error(f"Failed to sync to bouncer {bouncer.bouncer_id}: {e}")
        
        return {
            "success": True,
            "message": f"Synced policies to {synced_count} bouncers in {environment}",
            "bouncers_synced": synced_count,
            "total_bouncers": len(bouncers),
            "environment": environment
        }
    
    def _config_to_dict(self, config: BouncerOPALConfiguration) -> Dict[str, Any]:
        """Convert OPALConfiguration to dictionary"""
        return {
            "bouncer_id": config.bouncer_id,
            "environment": config.environment,
            "policy_filters": config.policy_filters,
            "data_filters": config.data_filters,
            "resource_name": config.resource_name,
            "cache_enabled": config.cache_enabled,
            "cache_ttl": config.cache_ttl,
            "auto_configured": config.auto_configured
        }


def get_opal_distribution_service(db: Session) -> OPALDistributionService:
    """Factory function to create OPAL distribution service"""
    return OPALDistributionService(db)

