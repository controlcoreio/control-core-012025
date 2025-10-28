"""
OPAL Data Endpoints - Provides PIP data endpoints for OPAL to consume

ARCHITECTURE:
- PAP API exposes /opal/pip-data endpoints that return JSON
- OPAL Server polls these endpoints (configured in OPAL_DATA_CONFIG_SOURCES)
- OPAL Server handles distribution to all connected OPA clients (PDPs/bouncers)
- Bouncers receive PIP data via OPAL's pub/sub mechanism

We do NOT push to OPAL - OPAL pulls from us!
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime

from app.database import get_db
from app.models import PIPConnection, ConnectionStatus
from app.services.pip_data_distributor import get_formatter

router = APIRouter(prefix="/opal", tags=["opal"])


@router.get("/pip-data/{connection_id}")
async def get_pip_data_for_opal(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """
    Get PIP data formatted for OPAL consumption
    OPAL polls this endpoint to fetch updated PIP metadata
    
    Returns data in OPA-compatible format
    """
    formatter = get_formatter()
    data = await formatter.get_pip_data_for_opal_endpoint(connection_id, db)
    
    if "error" in data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=data["error"]
        )
    
    return data


@router.get("/pip-data")
async def get_all_pip_data_for_opal(
    db: Session = Depends(get_db)
):
    """
    Get all active PIP data for OPAL
    Returns combined data from all active connections
    """
    # Get all active connections
    connections = db.query(PIPConnection).filter(
        PIPConnection.status == ConnectionStatus.ACTIVE
    ).all()
    
    formatter = get_formatter()
    combined_data = {}
    
    for conn in connections:
        conn_data = await formatter.get_pip_data_for_opal_endpoint(conn.id, db)
        if "error" not in conn_data:
            combined_data.update(conn_data)
    
    return {
        "pip_data": combined_data,
        "connections_count": len(connections),
        "timestamp": datetime.now().isoformat()
    }


@router.post("/webhook")
async def opal_webhook_handler(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle OPAL webhook notifications
    Called by OPAL when policy or data updates occur
    """
    try:
        payload = await request.json()
        
        event_type = payload.get("event_type")
        topic = payload.get("topic")
        
        # Log the webhook event
        print(f"OPAL Webhook received: {event_type} for topic: {topic}")
        
        # Handle different event types
        if event_type == "policy_update":
            # Policy was updated in OPAL
            return {
                "status": "acknowledged",
                "message": "Policy update notification received"
            }
        elif event_type == "data_update":
            # Data was updated in OPAL
            return {
                "status": "acknowledged",
                "message": "Data update notification received"
            }
        elif event_type == "client_connected":
            # New OPAL client (PDP) connected
            return {
                "status": "acknowledged",
                "message": "Client connection notification received"
            }
        else:
            return {
                "status": "acknowledged",
                "message": f"Unknown event type: {event_type}"
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook processing error: {str(e)}"
        )


@router.get("/health")
async def opal_health_check():
    """Health check endpoint for OPAL integration"""
    return {
        "status": "healthy",
        "service": "opal_data",
        "timestamp": datetime.now().isoformat()
    }


@router.get("/data-sources")
async def get_opal_data_source_config(
    db: Session = Depends(get_db)
):
    """
    Get OPAL data source configuration
    Returns configuration that OPAL should use to poll PIP data
    """
    # Get all active connections
    connections = db.query(PIPConnection).filter(
        PIPConnection.status == ConnectionStatus.ACTIVE
    ).all()
    
    formatter = get_formatter()
    
    # Build OPAL data source entries
    entries = []
    for conn in connections:
        topics = formatter.get_opal_topics_for_connection(conn.id, db)
        connection_name = conn.name.lower().replace(' ', '_').replace('-', '_')
        
        entry = {
            "url": f"http://cc-pap-api:8000/opal/pip-data/{conn.id}",
            "topics": topics,
            "dst_path": f"/pip/{connection_name}",
            "sync_interval": conn.sync_frequency or 300,
            "method": "GET",
            "headers": {}
        }
        entries.append(entry)
    
    return {
        "config": {
            "entries": entries
        },
        "connections_count": len(connections),
        "generated_at": datetime.now().isoformat()
    }

