"""
Telemetry API Router for Business Admin
Handles secure telemetry data collection and transmission
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from app.database import get_db
from app.services.secure_telemetry_service import (
    telemetry_service, 
    TelemetryEventType, 
    TelemetryLevel,
    TelemetryEvent
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.post("/events")
async def receive_telemetry_event(
    event_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Receive telemetry events from Control Core components
    Validates and stores encrypted telemetry data
    """
    try:
        # Validate required fields
        required_fields = ["tenant_id", "event_type", "component", "action"]
        for field in required_fields:
            if field not in event_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field}"
                )
        
        # Create telemetry event
        event = telemetry_service.create_telemetry_event(
            tenant_id=event_data["tenant_id"],
            event_type=TelemetryEventType(event_data["event_type"]),
            component=event_data["component"],
            action=event_data["action"],
            metadata=event_data.get("metadata", {}),
            level=TelemetryLevel(event_data.get("level", "info")),
            user_id=event_data.get("user_id"),
            policy_count=event_data.get("policy_count"),
            context_generation_count=event_data.get("context_generation_count"),
            ingestion_count=event_data.get("ingestion_count"),
            billing_metric=event_data.get("billing_metric")
        )
        
        logger.info(f"Received telemetry event: {event.event_id}")
        
        return {
            "status": "success",
            "event_id": event.event_id,
            "message": "Telemetry event received and processed"
        }
        
    except Exception as e:
        logger.error(f"Failed to process telemetry event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process telemetry event"
        )

@router.get("/summary/{tenant_id}")
async def get_telemetry_summary(
    tenant_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get anonymized telemetry summary for a tenant
    Returns SOC2-compliant aggregated data
    """
    try:
        # Parse dates
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Get telemetry summary
        summary = telemetry_service.get_telemetry_summary(
            tenant_id=tenant_id,
            start_date=start_dt,
            end_date=end_dt
        )
        
        return summary
        
    except Exception as e:
        logger.error(f"Failed to get telemetry summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve telemetry summary"
        )

@router.get("/health")
async def telemetry_health_check():
    """
    Health check endpoint for telemetry service
    """
    return {
        "status": "healthy",
        "service": "telemetry",
        "timestamp": datetime.utcnow().isoformat(),
        "encryption_enabled": telemetry_service.encryption_enabled,
        "anonymization_enabled": telemetry_service.anonymization_enabled,
        "soc2_compliant": True
    }
