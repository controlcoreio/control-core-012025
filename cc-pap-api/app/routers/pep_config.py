"""
PEP Configuration Management API
Endpoints for managing global and individual PEP configuration
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models_config import GlobalPEPConfig, IndividualPEPConfig
from app.models import PEP, User
from app.schemas_config import (
    GlobalPEPConfigCreate,
    GlobalPEPConfigUpdate,
    GlobalPEPConfigResponse,
    IndividualPEPConfigCreate,
    IndividualPEPConfigUpdate,
    IndividualPEPConfigResponse,
    PEPCompleteConfigResponse
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/pep-config", tags=["pep-config"])


# Global Configuration Endpoints

@router.get("/global", response_model=GlobalPEPConfigResponse)
async def get_global_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get global PEP configuration for the current tenant."""
    config = db.query(GlobalPEPConfig).filter(
        GlobalPEPConfig.tenant_id == str(current_user.id)
    ).first()
    
    if not config:
        # Create default config if doesn't exist
        config = GlobalPEPConfig(tenant_id=str(current_user.id))
        db.add(config)
        db.commit()
        db.refresh(config)
    
    return config


@router.put("/global", response_model=GlobalPEPConfigResponse)
async def update_global_config(
    config_update: GlobalPEPConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update global PEP configuration."""
    config = db.query(GlobalPEPConfig).filter(
        GlobalPEPConfig.tenant_id == str(current_user.id)
    ).first()
    
    if not config:
        config = GlobalPEPConfig(tenant_id=str(current_user.id))
        db.add(config)
    
    # Update fields
    for field, value in config_update.model_dump(exclude_unset=True).items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    
    return config


# Individual PEP Configuration Endpoints

@router.get("/individual/{pep_id}", response_model=IndividualPEPConfigResponse)
async def get_individual_config(
    pep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get configuration for a specific PEP."""
    # Verify PEP exists
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP not found"
        )
    
    config = db.query(IndividualPEPConfig).filter(
        IndividualPEPConfig.pep_id == pep_id
    ).first()
    
    if not config:
        # Create default config
        config = IndividualPEPConfig(pep_id=pep_id)
        db.add(config)
        db.commit()
        db.refresh(config)
    
    return config


@router.put("/individual/{pep_id}", response_model=IndividualPEPConfigResponse)
async def update_individual_config(
    pep_id: int,
    config_update: IndividualPEPConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update configuration for a specific PEP."""
    # Verify PEP exists
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP not found"
        )
    
    config = db.query(IndividualPEPConfig).filter(
        IndividualPEPConfig.pep_id == pep_id
    ).first()
    
    if not config:
        config = IndividualPEPConfig(pep_id=pep_id)
        db.add(config)
    
    # Update fields
    for field, value in config_update.model_dump(exclude_unset=True).items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    
    return config


@router.get("/complete/{pep_id}", response_model=PEPCompleteConfigResponse)
async def get_complete_config(
    pep_id: int,
    db: Session = Depends(get_db)
):
    """
    Get complete configuration for a PEP (used by the PEP itself).
    Includes global defaults and individual overrides merged into effective config.
    No auth required - PEPs authenticate via their bouncer_id.
    """
    # Get PEP
    pep = db.query(PEP).filter(PEP.id == pep_id).first()
    if not pep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PEP not found"
        )
    
    # Get global config (use default if not exists)
    global_config = db.query(GlobalPEPConfig).first()
    if not global_config:
        global_config = GlobalPEPConfig(tenant_id="default")
        db.add(global_config)
        db.commit()
        db.refresh(global_config)
    
    # Get individual config
    individual_config = db.query(IndividualPEPConfig).filter(
        IndividualPEPConfig.pep_id == pep_id
    ).first()
    
    # Compute effective configuration (individual overrides global)
    effective_config = {
        # Basic
        "proxy_domain": global_config.default_proxy_domain,
        "control_plane_url": global_config.control_plane_url,
        
        # Policy Sync
        "policy_update_interval": (
            individual_config.policy_update_interval_override 
            if individual_config and individual_config.policy_update_interval_override 
            else global_config.policy_update_interval
        ),
        "bundle_download_timeout": global_config.bundle_download_timeout,
        "policy_checksum_validation": global_config.policy_checksum_validation,
        
        # Logging
        "decision_log_export_enabled": global_config.decision_log_export_enabled,
        "decision_log_batch_size": global_config.decision_log_batch_size,
        "decision_log_flush_interval": global_config.decision_log_flush_interval,
        "metrics_export_enabled": global_config.metrics_export_enabled,
        
        # Enforcement
        "fail_policy": (
            individual_config.fail_policy_override 
            if individual_config and individual_config.fail_policy_override 
            else global_config.fail_policy
        ),
        "security_posture": global_config.default_security_posture,
        
        # Performance
        "rate_limit": (
            individual_config.rate_limit_override 
            if individual_config and individual_config.rate_limit_override 
            else global_config.default_rate_limit
        ),
        "timeout": global_config.default_timeout,
        "max_connections": global_config.max_connections,
        
        # Security
        "auto_ssl": global_config.auto_ssl_enabled,
        "mutual_tls": global_config.mutual_tls_required,
        
        # Individual settings (if configured)
        "policy_bundles": individual_config.assigned_policy_bundles if individual_config else ["default"],
        "mcp_header": individual_config.mcp_header_name if individual_config else "X-Model-Context",
        "mcp_injection": individual_config.mcp_injection_enabled if individual_config else True,
        "upstream_url": individual_config.upstream_target_url if individual_config else None,
        "proxy_url": individual_config.public_proxy_url if individual_config else None,
        "resource_rules": individual_config.resource_identification_rules if individual_config else [],
        
        # Advanced features
        "cache": {
            "enabled": individual_config.cache_enabled if individual_config else True,
            "ttl": individual_config.cache_ttl if individual_config else 300,
            "max_size": individual_config.cache_max_size if individual_config else 100,
            "strategy": individual_config.cache_invalidation_strategy if individual_config else "lru"
        },
        "circuit_breaker": {
            "enabled": individual_config.circuit_breaker_enabled if individual_config else True,
            "failure_threshold": individual_config.circuit_breaker_failure_threshold if individual_config else 5,
            "success_threshold": individual_config.circuit_breaker_success_threshold if individual_config else 2,
            "timeout": individual_config.circuit_breaker_timeout if individual_config else 60
        },
        "load_balancing": {
            "algorithm": individual_config.load_balancing_algorithm if individual_config else "round-robin",
            "sticky_sessions": individual_config.sticky_sessions_enabled if individual_config else False
        }
    }
    
    return PEPCompleteConfigResponse(
        pep_id=pep.id,
        pep_name=pep.name,
        environment=pep.environment,
        global_config=global_config,
        individual_config=individual_config,
        effective_config=effective_config
    )


@router.get("/effective/{pep_id}")
async def get_effective_config(
    pep_id: int,
    db: Session = Depends(get_db)
):
    """
    Get just the effective configuration (for PEP consumption).
    Returns the merged config ready to use.
    """
    complete_config = await get_complete_config(pep_id, db)
    return complete_config.effective_config

