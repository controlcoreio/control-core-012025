"""
OPAL Integration Endpoints

These endpoints are called by OPAL server to get environment-aware policies and data
for distribution to bouncers. Control Core intelligently filters based on bouncer environment.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Policy, PEP, PIPConnection, BouncerOPALConfiguration
from app.services.opal_distribution import get_opal_distribution_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/opal", tags=["opal"])


@router.get("/policies/{bouncer_id}")
async def get_policies_for_bouncer(
    bouncer_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all policies that should be distributed to a specific bouncer.
    
    OPAL calls this endpoint to fetch environment-specific policies.
    Control Core automatically filters based on:
    - Bouncer's environment (sandbox/production)
    - Policy promotion status
    - Resource matching
    """
    opal_service = get_opal_distribution_service(db)
    policies = opal_service.get_policies_for_bouncer(bouncer_id)
    
    # Convert to OPAL-compatible format
    policy_bundle = []
    for policy in policies:
        # Determine folder based on environment
        folder = opal_service.get_github_folder_for_environment(policy.environment)
        
        policy_bundle.append({
            "id": policy.id,
            "name": policy.name,
            "rego_code": policy.rego_code,
            "environment": policy.environment,
            "status": policy.status,
            "folder": folder,
            "promoted": policy.promoted_from_sandbox,
            "resource_id": policy.resource_id,
            "bouncer_id": policy.bouncer_id
        })
    
    logger.info(f"OPAL requested policies for {bouncer_id}: returning {len(policy_bundle)} policies")
    
    return {
        "bouncer_id": bouncer_id,
        "policy_count": len(policy_bundle),
        "policies": policy_bundle,
        "auto_filtered": True
    }


@router.get("/data-sources/{bouncer_id}")
async def get_data_sources_for_bouncer(
    bouncer_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all data sources (PIPs) that should be available to a specific bouncer.
    
    Intelligently routes to environment-specific endpoints:
    - Sandbox bouncers get sandbox endpoints
    - Production bouncers get production endpoints
    """
    # Get bouncer to determine environment
    bouncer = db.query(PEP).filter(PEP.bouncer_id == bouncer_id).first()
    if not bouncer:
        raise HTTPException(status_code=404, detail=f"Bouncer {bouncer_id} not found")
    
    environment = bouncer.environment
    
    # Get PIPs for this environment (no "both" support)
    pip_connections = db.query(PIPConnection).filter(
        PIPConnection.environment == environment
    ).all()
    
    data_sources = []
    for pip in pip_connections:
        # Intelligently select endpoint based on environment
        endpoint = None
        if environment == "sandbox" and pip.sandbox_endpoint:
            endpoint = pip.sandbox_endpoint
        elif environment == "production" and pip.production_endpoint:
            endpoint = pip.production_endpoint
        elif pip.configuration and "endpoint" in pip.configuration:
            endpoint = pip.configuration["endpoint"]
        
        if endpoint:
            data_sources.append({
                "id": pip.id,
                "name": pip.name,
                "type": pip.connection_type.value,
                "provider": pip.provider,
                "endpoint": endpoint,
                "environment": pip.environment,
                "sync_enabled": pip.sync_enabled,
                "sync_frequency": pip.sync_frequency
            })
    
    logger.info(f"OPAL requested data sources for {bouncer_id} ({environment}): returning {len(data_sources)} sources")
    
    return {
        "bouncer_id": bouncer_id,
        "environment": environment,
        "data_source_count": len(data_sources),
        "data_sources": data_sources,
        "auto_filtered": True
    }


@router.get("/config/{bouncer_id}")
async def get_bouncer_opal_config(
    bouncer_id: str,
    db: Session = Depends(get_db)
):
    """
    Get OPAL configuration for a specific bouncer.
    
    Returns auto-configured policy filters, data filters, and caching settings.
    This is automatically generated when the bouncer registers.
    """
    config = db.query(BouncerOPALConfiguration).filter(
        BouncerOPALConfiguration.bouncer_id == bouncer_id
    ).first()
    
    if not config:
        # Auto-create if doesn't exist
        bouncer = db.query(PEP).filter(PEP.bouncer_id == bouncer_id).first()
        if not bouncer:
            raise HTTPException(status_code=404, detail=f"Bouncer {bouncer_id} not found")
        
        opal_service = get_opal_distribution_service(db)
        config_dict = opal_service.auto_configure_bouncer_opal(
            bouncer_id=bouncer_id,
            environment=bouncer.environment,
            resource_name=bouncer.name
        )
        return config_dict
    
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


@router.post("/sync/environment/{environment}")
async def sync_environment(
    environment: str,
    db: Session = Depends(get_db)
):
    """
    Trigger OPAL sync for all bouncers in a specific environment.
    
    Called when:
    - A policy is created in sandbox
    - A policy is promoted to production  
    - Manual sync is requested
    """
    if environment not in ["sandbox", "production"]:
        raise HTTPException(status_code=400, detail="Invalid environment")
    
    opal_service = get_opal_distribution_service(db)
    result = opal_service.trigger_policy_sync_to_environment(environment)
    
    return result


@router.get("/bouncer-pairs")
async def get_bouncer_pairs(
    db: Session = Depends(get_db)
):
    """
    Get all bouncer pairs (sandbox + production bouncers for same resource).
    
    This helps visualize the dual environment architecture and shows
    which bouncers are paired together.
    """
    # Get all bouncers
    all_bouncers = db.query(PEP).all()
    
    # Group by resource name to find pairs
    resource_map: Dict[str, Dict[str, Any]] = {}
    
    for bouncer in all_bouncers:
        # Get resource name from protected resources
        from app.models import ProtectedResource
        resource = db.query(ProtectedResource).filter(
            ProtectedResource.bouncer_id == bouncer.id
        ).first()
        
        resource_name = resource.name if resource else bouncer.name
        
        if resource_name not in resource_map:
            resource_map[resource_name] = {
                "resource_name": resource_name,
                "sandbox_bouncer": None,
                "production_bouncer": None,
                "has_pair": False
            }
        
        bouncer_info = {
            "id": bouncer.id,
            "bouncer_id": bouncer.bouncer_id,
            "name": bouncer.name,
            "status": bouncer.status,
            "environment": bouncer.environment,
            "is_connected": bouncer.is_connected
        }
        
        if bouncer.environment == "sandbox":
            resource_map[resource_name]["sandbox_bouncer"] = bouncer_info
        elif bouncer.environment == "production":
            resource_map[resource_name]["production_bouncer"] = bouncer_info
        
        # Check if this resource has both sandbox and production
        if resource_map[resource_name]["sandbox_bouncer"] and resource_map[resource_name]["production_bouncer"]:
            resource_map[resource_name]["has_pair"] = True
    
    pairs = list(resource_map.values())
    
    return {
        "total_resources": len(pairs),
        "paired_resources": len([p for p in pairs if p["has_pair"]]),
        "sandbox_only": len([p for p in pairs if p["sandbox_bouncer"] and not p["production_bouncer"]]),
        "production_only": len([p for p in pairs if p["production_bouncer"] and not p["sandbox_bouncer"]]),
        "pairs": pairs
    }

