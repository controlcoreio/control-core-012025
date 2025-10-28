"""
Sync Scheduler Service for Control Core PIP
Handles automated data synchronization using APScheduler
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor

from app.models import PIPConnection, PIPSyncLog
from app.services.secrets_service import secrets_service
# NOTE: opal_publisher removed - OPAL polls our endpoints, we don't push to it

logger = logging.getLogger(__name__)

class SyncJobStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class SyncJob:
    """Represents a sync job"""
    connection_id: int
    job_id: str
    status: SyncJobStatus
    next_run: Optional[datetime]
    last_run: Optional[datetime]
    run_count: int
    error_count: int
    last_error: Optional[str]

class SyncScheduler:
    """Service for scheduling and managing data synchronization jobs"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler(
            jobstores={'default': MemoryJobStore()},
            executors={'default': AsyncIOExecutor()},
            job_defaults={
                'coalesce': True,
                'max_instances': 1,
                'misfire_grace_time': 30
            }
        )
        self.jobs: Dict[str, SyncJob] = {}
        self.running = False
    
    async def start(self):
        """Start the scheduler"""
        if not self.running:
            self.scheduler.start()
            self.running = True
            logger.info("Sync scheduler started")
    
    async def stop(self):
        """Stop the scheduler"""
        if self.running:
            self.scheduler.shutdown()
            self.running = False
            logger.info("Sync scheduler stopped")
    
    async def schedule_connection(self, connection: PIPConnection) -> str:
        """Schedule a connection for automated sync"""
        try:
            # Generate job ID
            job_id = f"sync_{connection.id}_{connection.provider}"
            
            # Remove existing job if it exists
            if job_id in self.jobs:
                await self.unschedule_connection(connection.id)
            
            # Create trigger based on sync frequency
            trigger = self._create_trigger(connection.sync_frequency)
            
            # Add job to scheduler
            self.scheduler.add_job(
                func=self._sync_connection_job,
                trigger=trigger,
                args=[connection.id],
                id=job_id,
                name=f"Sync {connection.name}",
                replace_existing=True
            )
            
            # Create job record
            job = SyncJob(
                connection_id=connection.id,
                job_id=job_id,
                status=SyncJobStatus.PENDING,
                next_run=self.scheduler.get_job(job_id).next_run_time if self.scheduler.get_job(job_id) else None,
                last_run=None,
                run_count=0,
                error_count=0,
                last_error=None
            )
            
            self.jobs[job_id] = job
            
            logger.info(f"Scheduled sync job for connection {connection.id}: {connection.name}")
            return job_id
            
        except Exception as e:
            logger.error(f"Failed to schedule connection {connection.id}: {e}")
            raise
    
    async def unschedule_connection(self, connection_id: int) -> bool:
        """Remove a connection from the sync schedule"""
        try:
            # Find job by connection ID
            job_id = None
            for jid, job in self.jobs.items():
                if job.connection_id == connection_id:
                    job_id = jid
                    break
            
            if job_id:
                # Remove from scheduler
                self.scheduler.remove_job(job_id)
                
                # Remove from jobs dict
                del self.jobs[job_id]
                
                logger.info(f"Unscheduled sync job for connection {connection_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to unschedule connection {connection_id}: {e}")
            return False
    
    async def _sync_connection_job(self, connection_id: int):
        """Job function to sync a connection"""
        job_id = f"sync_{connection_id}"
        
        try:
            # Update job status
            if job_id in self.jobs:
                self.jobs[job_id].status = SyncJobStatus.RUNNING
                self.jobs[job_id].last_run = datetime.utcnow()
                self.jobs[job_id].run_count += 1
            
            # Get connection from database
            from app.database import get_db
            from sqlalchemy.orm import Session
            
            db = next(get_db())
            connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
            
            if not connection:
                raise Exception(f"Connection {connection_id} not found")
            
            if connection.status and connection.status.value != "active":
                raise Exception(f"Connection {connection_id} is not active")
            
            # Fetch data from external source and cache in Redis
            # OPAL will poll our /opal/pip-data endpoint to distribute to bouncers
            from app.services.pip_connector_service import PIPConnectorService
            from app.services.pip_cache_service import PIPCacheService
            
            connector_service = PIPConnectorService()
            cache_service = PIPCacheService()
            
            # Fetch data from the external source
            fetched_data = await connector_service.fetch_data(connection, db)
            
            if fetched_data:
                # Cache the data in Redis
                await cache_service.cache_pip_data(
                    connection_id=connection_id,
                    data=fetched_data,
                    ttl=300  # 5 minutes TTL
                )
                
                # Update job status
                if job_id in self.jobs:
                    self.jobs[job_id].status = SyncJobStatus.SUCCESS
                    self.jobs[job_id].error_count = 0
                    self.jobs[job_id].last_error = None
                
                logger.info(f"Sync job completed successfully for connection {connection_id}. Data cached in Redis for OPAL polling.")
            else:
                raise Exception(f"Sync failed: No data fetched from source")
                
        except Exception as e:
            # Update job status
            if job_id in self.jobs:
                self.jobs[job_id].status = SyncJobStatus.FAILED
                self.jobs[job_id].error_count += 1
                self.jobs[job_id].last_error = str(e)
            
            logger.error(f"Sync job failed for connection {connection_id}: {e}")
            
            # Log sync failure
            await self._log_sync_failure(connection_id, str(e))
    
    def _create_trigger(self, sync_frequency: str):
        """Create scheduler trigger based on sync frequency"""
        if sync_frequency == "realtime":
            # For real-time, we don't schedule - webhooks handle it
            return None
        elif sync_frequency == "5min":
            return IntervalTrigger(minutes=5)
        elif sync_frequency == "15min":
            return IntervalTrigger(minutes=15)
        elif sync_frequency == "hourly":
            return IntervalTrigger(hours=1)
        elif sync_frequency == "daily":
            return CronTrigger(hour=0, minute=0)  # Daily at midnight
        elif sync_frequency == "weekly":
            return CronTrigger(day_of_week=0, hour=0, minute=0)  # Weekly on Sunday at midnight
        else:
            # Default to hourly
            return IntervalTrigger(hours=1)
    
    async def _log_sync_failure(self, connection_id: int, error: str):
        """Log sync failure to database"""
        try:
            from app.database import get_db
            from sqlalchemy.orm import Session
            
            db = next(get_db())
            
            sync_log = PIPSyncLog(
                connection_id=connection_id,
                sync_type="scheduled_sync",
                status="failed",
                records_processed=0,
                response_time=0,
                error_message=error,
                metadata={
                    "scheduler": "apscheduler",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            db.add(sync_log)
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log sync failure: {e}")
    
    async def get_job_status(self, connection_id: int) -> Optional[Dict[str, Any]]:
        """Get status of a sync job"""
        try:
            # Find job by connection ID
            for job_id, job in self.jobs.items():
                if job.connection_id == connection_id:
                    return {
                        "connection_id": connection_id,
                        "job_id": job_id,
                        "status": job.status.value,
                        "next_run": job.next_run.isoformat() if job.next_run else None,
                        "last_run": job.last_run.isoformat() if job.last_run else None,
                        "run_count": job.run_count,
                        "error_count": job.error_count,
                        "last_error": job.last_error
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get job status for connection {connection_id}: {e}")
            return None
    
    async def get_all_jobs_status(self) -> List[Dict[str, Any]]:
        """Get status of all sync jobs"""
        try:
            jobs_status = []
            
            for job_id, job in self.jobs.items():
                jobs_status.append({
                    "connection_id": job.connection_id,
                    "job_id": job_id,
                    "status": job.status.value,
                    "next_run": job.next_run.isoformat() if job.next_run else None,
                    "last_run": job.last_run.isoformat() if job.last_run else None,
                    "run_count": job.run_count,
                    "error_count": job.error_count,
                    "last_error": job.last_error
                })
            
            return jobs_status
            
        except Exception as e:
            logger.error(f"Failed to get all jobs status: {e}")
            return []
    
    async def trigger_manual_sync(self, connection_id: int) -> bool:
        """Trigger a manual sync for a connection"""
        try:
            # Run sync job immediately
            await self._sync_connection_job(connection_id)
            return True
            
        except Exception as e:
            logger.error(f"Failed to trigger manual sync for connection {connection_id}: {e}")
            return False
    
    async def reschedule_all_connections(self):
        """Reschedule all active connections"""
        try:
            from app.database import get_db
            from sqlalchemy.orm import Session
            
            db = next(get_db())
            
            # Get all active connections
            connections = db.query(PIPConnection).filter(
                PIPConnection.status == "active",
                PIPConnection.sync_enabled == True
            ).all()
            
            # Schedule each connection
            for connection in connections:
                try:
                    await self.schedule_connection(connection)
                except Exception as e:
                    logger.error(f"Failed to schedule connection {connection.id}: {e}")
            
            logger.info(f"Rescheduled {len(connections)} connections")
            
        except Exception as e:
            logger.error(f"Failed to reschedule all connections: {e}")
    
    async def get_scheduler_stats(self) -> Dict[str, Any]:
        """Get scheduler statistics"""
        try:
            return {
                "running": self.running,
                "total_jobs": len(self.jobs),
                "pending_jobs": len([j for j in self.jobs.values() if j.status == SyncJobStatus.PENDING]),
                "running_jobs": len([j for j in self.jobs.values() if j.status == SyncJobStatus.RUNNING]),
                "successful_jobs": len([j for j in self.jobs.values() if j.status == SyncJobStatus.SUCCESS]),
                "failed_jobs": len([j for j in self.jobs.values() if j.status == SyncJobStatus.FAILED]),
                "total_runs": sum(j.run_count for j in self.jobs.values()),
                "total_errors": sum(j.error_count for j in self.jobs.values())
            }
            
        except Exception as e:
            logger.error(f"Failed to get scheduler stats: {e}")
            return {}

# Global instance
sync_scheduler = SyncScheduler()
