from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models import TenantBouncer, TenantPolicy
from app.schemas import BouncerCreate, BouncerUpdate
from typing import List, Optional, Dict, Any
import uuid
import logging
from datetime import datetime
import requests
import json

logger = logging.getLogger(__name__)

class BouncerService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_bouncer(self, tenant_id: str, bouncer_data: BouncerCreate) -> TenantBouncer:
        """Create a new bouncer"""
        try:
            bouncer = TenantBouncer(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                name=bouncer_data.name,
                bouncer_id=str(uuid.uuid4()),
                status="inactive",
                target_hosts=bouncer_data.target_hosts or [],
                config=bouncer_data.config or {},
                policies=[]
            )
            
            self.db.add(bouncer)
            self.db.commit()
            self.db.refresh(bouncer)
            
            logger.info(f"Created bouncer {bouncer.id} for tenant {tenant_id}")
            return bouncer
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating bouncer: {e}")
            raise
    
    def get_bouncers(self, tenant_id: str, skip: int = 0, limit: int = 100, 
                    status: Optional[str] = None) -> List[TenantBouncer]:
        """Get bouncers for tenant with filters"""
        try:
            query = self.db.query(TenantBouncer).filter(TenantBouncer.tenant_id == tenant_id)
            
            if status:
                query = query.filter(TenantBouncer.status == status)
            
            bouncers = query.offset(skip).limit(limit).all()
            return bouncers
            
        except Exception as e:
            logger.error(f"Error getting bouncers: {e}")
            raise
    
    def get_bouncer_by_id(self, bouncer_id: str, tenant_id: str) -> Optional[TenantBouncer]:
        """Get bouncer by ID"""
        try:
            bouncer = self.db.query(TenantBouncer).filter(
                and_(
                    TenantBouncer.id == bouncer_id,
                    TenantBouncer.tenant_id == tenant_id
                )
            ).first()
            
            return bouncer
            
        except Exception as e:
            logger.error(f"Error getting bouncer: {e}")
            raise
    
    def update_bouncer(self, bouncer_id: str, tenant_id: str, bouncer_data: BouncerUpdate) -> Optional[TenantBouncer]:
        """Update bouncer"""
        try:
            bouncer = self.get_bouncer_by_id(bouncer_id, tenant_id)
            if not bouncer:
                return None
            
            update_data = bouncer_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(bouncer, field, value)
            
            bouncer.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(bouncer)
            
            logger.info(f"Updated bouncer {bouncer_id}")
            return bouncer
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating bouncer: {e}")
            raise
    
    def delete_bouncer(self, bouncer_id: str, tenant_id: str) -> bool:
        """Delete bouncer"""
        try:
            bouncer = self.get_bouncer_by_id(bouncer_id, tenant_id)
            if not bouncer:
                return False
            
            self.db.delete(bouncer)
            self.db.commit()
            
            logger.info(f"Deleted bouncer {bouncer_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting bouncer: {e}")
            raise
    
    def start_bouncer(self, bouncer_id: str, tenant_id: str) -> Optional[TenantBouncer]:
        """Start bouncer"""
        try:
            bouncer = self.get_bouncer_by_id(bouncer_id, tenant_id)
            if not bouncer:
                return None
            
            # Update bouncer status
            bouncer.status = "active"
            bouncer.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(bouncer)
            
            logger.info(f"Started bouncer {bouncer_id}")
            return bouncer
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error starting bouncer: {e}")
            raise
    
    def stop_bouncer(self, bouncer_id: str, tenant_id: str) -> Optional[TenantBouncer]:
        """Stop bouncer"""
        try:
            bouncer = self.get_bouncer_by_id(bouncer_id, tenant_id)
            if not bouncer:
                return None
            
            # Update bouncer status
            bouncer.status = "inactive"
            bouncer.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(bouncer)
            
            logger.info(f"Stopped bouncer {bouncer_id}")
            return bouncer
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error stopping bouncer: {e}")
            raise
    
    def restart_bouncer(self, bouncer_id: str, tenant_id: str) -> Optional[TenantBouncer]:
        """Restart bouncer"""
        try:
            bouncer = self.get_bouncer_by_id(bouncer_id, tenant_id)
            if not bouncer:
                return None
            
            # Stop and start bouncer
            bouncer.status = "inactive"
            bouncer.updated_at = datetime.utcnow()
            self.db.commit()
            
            # Start bouncer
            bouncer.status = "active"
            bouncer.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(bouncer)
            
            logger.info(f"Restarted bouncer {bouncer_id}")
            return bouncer
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error restarting bouncer: {e}")
            raise
    
    def get_bouncer_status(self, bouncer_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Get bouncer status"""
        try:
            bouncer = self.get_bouncer_by_id(bouncer_id, tenant_id)
            if not bouncer:
                return None
            
            # Get bouncer health status
            health_status = self._check_bouncer_health(bouncer)
            
            return {
                "bouncer_id": bouncer.bouncer_id,
                "status": bouncer.status,
                "health": health_status,
                "last_sync": bouncer.last_sync,
                "target_hosts": bouncer.target_hosts,
                "policies_count": len(bouncer.policies),
                "version": bouncer.version
            }
            
        except Exception as e:
            logger.error(f"Error getting bouncer status: {e}")
            raise
    
    def sync_bouncer(self, bouncer_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Sync bouncer with policies"""
        try:
            bouncer = self.get_bouncer_by_id(bouncer_id, tenant_id)
            if not bouncer:
                return None
            
            # Get active policies for tenant
            active_policies = self.db.query(TenantPolicy).filter(
                and_(
                    TenantPolicy.tenant_id == tenant_id,
                    TenantPolicy.status == "active"
                )
            ).all()
            
            # Update bouncer policies
            policy_ids = [policy.id for policy in active_policies]
            bouncer.policies = policy_ids
            bouncer.last_sync = datetime.utcnow()
            self.db.commit()
            
            logger.info(f"Synced bouncer {bouncer_id} with {len(policy_ids)} policies")
            return {
                "bouncer_id": bouncer.bouncer_id,
                "policies_synced": len(policy_ids),
                "last_sync": bouncer.last_sync,
                "policies": policy_ids
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error syncing bouncer: {e}")
            raise
    
    def _check_bouncer_health(self, bouncer: TenantBouncer) -> Dict[str, Any]:
        """Check bouncer health status"""
        try:
            # In a real implementation, this would check the actual bouncer health
            # For now, return mock health status
            return {
                "status": "healthy",
                "uptime": "2h 30m",
                "requests_processed": 1250,
                "average_response_time": "15ms",
                "error_rate": "0.1%",
                "last_check": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error checking bouncer health: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat()
            }
    
    def get_bouncer_statistics(self, tenant_id: str) -> Dict[str, Any]:
        """Get bouncer statistics for tenant"""
        try:
            total_bouncers = self.db.query(TenantBouncer).filter(
                TenantBouncer.tenant_id == tenant_id
            ).count()
            
            active_bouncers = self.db.query(TenantBouncer).filter(
                and_(
                    TenantBouncer.tenant_id == tenant_id,
                    TenantBouncer.status == "active"
                )
            ).count()
            
            inactive_bouncers = self.db.query(TenantBouncer).filter(
                and_(
                    TenantBouncer.tenant_id == tenant_id,
                    TenantBouncer.status == "inactive"
                )
            ).count()
            
            error_bouncers = self.db.query(TenantBouncer).filter(
                and_(
                    TenantBouncer.tenant_id == tenant_id,
                    TenantBouncer.status == "error"
                )
            ).count()
            
            return {
                "total_bouncers": total_bouncers,
                "active_bouncers": active_bouncers,
                "inactive_bouncers": inactive_bouncers,
                "error_bouncers": error_bouncers
            }
            
        except Exception as e:
            logger.error(f"Error getting bouncer statistics: {e}")
            raise
    
    def get_bouncer_metrics(self, bouncer_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Get bouncer metrics"""
        try:
            bouncer = self.get_bouncer_by_id(bouncer_id, tenant_id)
            if not bouncer:
                return None
            
            # In a real implementation, this would get actual metrics
            # For now, return mock metrics
            return {
                "bouncer_id": bouncer.bouncer_id,
                "metrics": {
                    "requests_per_second": 45.2,
                    "average_response_time": "15ms",
                    "error_rate": "0.1%",
                    "uptime": "99.9%",
                    "memory_usage": "128MB",
                    "cpu_usage": "15%"
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting bouncer metrics: {e}")
            raise
