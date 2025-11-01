"""
PEP Configuration Push Service
Tracks configuration changes and notifies bouncers of updates
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models_config import GlobalPEPConfig, IndividualPEPConfig
from app.models import PEP
import logging

logger = logging.getLogger(__name__)


class PEPConfigPushService:
    """Service to track and push configuration changes to deployed bouncers"""
    
    @staticmethod
    def track_global_config_change(
        db: Session,
        tenant_id: str,
        changed_fields: Dict[str, Any],
        changed_by: Optional[str] = None
    ):
        """
        Track global configuration changes
        Bouncers will pick up changes on their next poll to /pep-config/effective/{pep_id}
        """
        logger.info(
            f"Global config changed for tenant {tenant_id}. "
            f"Changed fields: {list(changed_fields.keys())}. "
            f"Changed by: {changed_by or 'system'}"
        )
        
        # Get all PEPs for this tenant to notify
        peps = db.query(PEP).all()
        
        affected_peps = []
        for pep in peps:
            # Check if this PEP would be affected by the global config changes
            if PEPConfigPushService._is_pep_affected_by_global_change(pep, changed_fields):
                affected_peps.append(pep.id)
        
        logger.info(
            f"Global config change will affect {len(affected_peps)} PEPs. "
            f"PEP IDs: {affected_peps}"
        )
        
        # In the future, we could implement webhooks or push notifications here
        # For now, bouncers will detect changes on next poll (within 30 seconds)
        
        return {
            "affected_pep_count": len(affected_peps),
            "affected_pep_ids": affected_peps,
            "propagation_method": "polling",
            "expected_propagation_time": "30-60 seconds"
        }
    
    @staticmethod
    def track_individual_config_change(
        db: Session,
        pep_id: int,
        changed_fields: Dict[str, Any],
        changed_by: Optional[str] = None
    ):
        """
        Track individual PEP configuration changes
        The specific bouncer will pick up changes on next poll
        """
        pep = db.query(PEP).filter(PEP.id == pep_id).first()
        if not pep:
            logger.warning(f"Configuration change tracked for non-existent PEP {pep_id}")
            return None
        
        logger.info(
            f"Individual config changed for PEP {pep_id} ({pep.name}). "
            f"Changed fields: {list(changed_fields.keys())}. "
            f"Changed by: {changed_by or 'system'}"
        )
        
        # Log configuration version change
        # In the future, we could store this in a config_history table
        
        return {
            "pep_id": pep_id,
            "pep_name": pep.name,
            "affected_fields": list(changed_fields.keys()),
            "propagation_method": "polling",
            "expected_propagation_time": "30-60 seconds"
        }
    
    @staticmethod
    def _is_pep_affected_by_global_change(pep: PEP, changed_fields: Dict[str, Any]) -> bool:
        """
        Determine if a PEP would be affected by global configuration changes
        """
        # Reverse-proxy specific fields
        reverse_proxy_fields = [
            'default_proxy_domain',
            'auto_ssl_enabled'
        ]
        
        # Sidecar specific fields
        sidecar_fields = [
            'default_sidecar_port',
            'sidecar_injection_mode',
            'sidecar_namespace_selector',
            'sidecar_resource_limits_cpu',
            'sidecar_resource_limits_memory',
            'sidecar_init_container_enabled'
        ]
        
        # Common fields affect all PEPs
        common_fields = [
            'control_plane_url',
            'policy_update_interval',
            'bundle_download_timeout',
            'policy_checksum_validation',
            'decision_log_export_enabled',
            'decision_log_batch_size',
            'decision_log_flush_interval',
            'metrics_export_enabled',
            'fail_policy',
            'default_security_posture',
            'default_rate_limit',
            'default_timeout',
            'max_connections',
            'mutual_tls_required'
        ]
        
        for field in changed_fields.keys():
            if field in common_fields:
                return True
            
            if pep.deployment_mode == "reverse-proxy" and field in reverse_proxy_fields:
                return True
            
            if pep.deployment_mode == "sidecar" and field in sidecar_fields:
                return True
        
        return False
    
    @staticmethod
    def get_config_status(db: Session, pep_id: int) -> Dict[str, Any]:
        """
        Get configuration status for a specific PEP
        Returns information about when config was last updated
        """
        pep = db.query(PEP).filter(PEP.id == pep_id).first()
        if not pep:
            return {"error": "PEP not found"}
        
        global_config = db.query(GlobalPEPConfig).first()
        individual_config = db.query(IndividualPEPConfig).filter(
            IndividualPEPConfig.pep_id == pep_id
        ).first()
        
        return {
            "pep_id": pep_id,
            "pep_name": pep.name,
            "global_config_updated_at": global_config.updated_at.isoformat() if global_config else None,
            "individual_config_updated_at": individual_config.updated_at.isoformat() if individual_config else None,
            "last_heartbeat": pep.last_heartbeat.isoformat() if pep.last_heartbeat else None,
            "config_in_sync": True  # Assume in sync since bouncers poll regularly
        }


# Singleton instance
config_push_service = PEPConfigPushService()

