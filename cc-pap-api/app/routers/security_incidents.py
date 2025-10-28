"""
Security Incidents API Router for PAP API
Provides endpoints for managing security incidents from PAP, bouncer, and OPAL components
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import requests

from app.database import get_db
from app.schemas import SecurityIncidentCreate, SecurityIncidentUpdate, SecurityIncidentResponse
from app.dependencies import get_current_user, get_current_tenant_id
from app.core.security import Auth0User
from app.models import SecurityIncident

router = APIRouter(prefix="/security", tags=["security-incidents"])

# External service endpoints
COMPONENT_ENDPOINTS = {
    "bouncer": "http://localhost:8080",
    "opal": "http://localhost:7000",
    "business_admin": "http://localhost:3001"
}

@router.get("/incidents", response_model=List[SecurityIncidentResponse])
async def get_security_incidents(
    severity: Optional[List[str]] = Query(None),
    status: Optional[List[str]] = Query(None),
    component: Optional[List[str]] = Query(None),
    incident_type: Optional[List[str]] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: Auth0User = Depends(get_current_user)
):
    """
    Get security incidents with optional filtering.
    Aggregates incidents from PAP, bouncer, OPAL, and business-admin components.
    """
    
    try:
        # Get incidents from database (PAP incidents)
        query = db.query(SecurityIncident).filter(SecurityIncident.tenant_id == tenant_id)
        
        # Apply filters
        if severity:
            query = query.filter(SecurityIncident.severity.in_(severity))
        if status:
            query = query.filter(SecurityIncident.status.in_(status))
        if component:
            query = query.filter(SecurityIncident.component.in_(component))
        if incident_type:
            query = query.filter(SecurityIncident.incident_type.in_(incident_type))
        if start_date:
            query = query.filter(SecurityIncident.detected_at >= start_date)
        if end_date:
            query = query.filter(SecurityIncident.detected_at <= end_date)
        
        # Get PAP incidents
        pap_incidents = query.order_by(SecurityIncident.detected_at.desc()).offset(offset).limit(limit).all()
        
        # Get incidents from other components
        all_incidents = []
        
        # Add PAP incidents
        for incident in pap_incidents:
            all_incidents.append({
                "id": incident.id,
                "title": incident.title,
                "description": incident.description,
                "severity": incident.severity,
                "status": incident.status,
                "component": "pap",
                "incident_type": incident.incident_type,
                "detected_at": incident.detected_at.isoformat(),
                "affected_systems": incident.affected_systems or [],
                "affected_users": incident.affected_users or [],
                "response_actions": incident.response_actions or [],
                "crm_ticket_id": incident.crm_ticket_id,
                "sla_deadline": incident.sla_deadline.isoformat() if incident.sla_deadline else None,
                "is_overdue": incident.sla_deadline and datetime.utcnow() > incident.sla_deadline,
                "tenant_id": incident.tenant_id,
                "indicators": incident.indicators or {},
                "timeline": incident.timeline or []
            })
        
        # Get incidents from bouncer
        try:
            bouncer_incidents = await get_component_incidents("bouncer", tenant_id)
            all_incidents.extend(bouncer_incidents)
        except Exception as e:
            print(f"Failed to get bouncer incidents: {e}")
        
        # Get incidents from OPAL
        try:
            opal_incidents = await get_component_incidents("opal", tenant_id)
            all_incidents.extend(opal_incidents)
        except Exception as e:
            print(f"Failed to get OPAL incidents: {e}")
        
        # Get incidents from business-admin
        try:
            business_admin_incidents = await get_component_incidents("business_admin", tenant_id)
            all_incidents.extend(business_admin_incidents)
        except Exception as e:
            print(f"Failed to get business-admin incidents: {e}")
        
        # Sort all incidents by detection time
        all_incidents.sort(key=lambda x: x["detected_at"], reverse=True)
        
        # Apply limit and offset to combined results
        return all_incidents[offset:offset + limit]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve security incidents: {str(e)}"
        )

@router.get("/incidents/{incident_id}", response_model=SecurityIncidentResponse)
async def get_security_incident(
    incident_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: Auth0User = Depends(get_current_user)
):
    """Get a specific security incident by ID."""
    
    # First check PAP database
    incident = db.query(SecurityIncident).filter(
        SecurityIncident.id == incident_id,
        SecurityIncident.tenant_id == tenant_id
    ).first()
    
    if incident:
        return {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "severity": incident.severity,
            "status": incident.status,
            "component": "pap",
            "incident_type": incident.incident_type,
            "detected_at": incident.detected_at.isoformat(),
            "affected_systems": incident.affected_systems or [],
            "affected_users": incident.affected_users or [],
            "response_actions": incident.response_actions or [],
            "crm_ticket_id": incident.crm_ticket_id,
            "sla_deadline": incident.sla_deadline.isoformat() if incident.sla_deadline else None,
            "is_overdue": incident.sla_deadline and datetime.utcnow() > incident.sla_deadline,
            "tenant_id": incident.tenant_id,
            "indicators": incident.indicators or {},
            "timeline": incident.timeline or []
        }
    
    # If not found in PAP, check other components
    for component in ["bouncer", "opal", "business_admin"]:
        try:
            incident = await get_component_incident(component, incident_id, tenant_id)
            if incident:
                return incident
        except Exception as e:
            print(f"Failed to get incident from {component}: {e}")
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Security incident not found"
    )

@router.patch("/incidents/{incident_id}/status")
async def update_incident_status(
    incident_id: str,
    status_update: Dict[str, Any],
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: Auth0User = Depends(get_current_user)
):
    """Update incident status and sync with business-admin."""
    
    try:
        # Update in PAP database if exists
        incident = db.query(SecurityIncident).filter(
            SecurityIncident.id == incident_id,
            SecurityIncident.tenant_id == tenant_id
        ).first()
        
        if incident:
            incident.status = status_update.get("status", incident.status)
            incident.updated_at = datetime.utcnow()
            
            if status_update.get("notes"):
                # Add to timeline
                if not incident.timeline:
                    incident.timeline = []
                
                incident.timeline.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "action": "status_update",
                    "actor": current_user.email,
                    "details": status_update.get("notes")
                })
            
            db.commit()
            db.refresh(incident)
        
        # Sync with business-admin
        try:
            await sync_incident_with_business_admin(incident_id, status_update, tenant_id)
        except Exception as e:
            print(f"Failed to sync with business-admin: {e}")
        
        return {"message": "Incident status updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update incident status: {str(e)}"
        )

@router.post("/incidents")
async def create_security_incident(
    incident_data: SecurityIncidentCreate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: Auth0User = Depends(get_current_user)
):
    """Create a new security incident in PAP."""
    
    try:
        # Create incident in PAP database
        incident = SecurityIncident(
            id=incident_data.id,
            title=incident_data.title,
            description=incident_data.description,
            severity=incident_data.severity,
            status=incident_data.status,
            component="pap",
            incident_type=incident_data.incident_type,
            detected_at=incident_data.detected_at,
            affected_systems=incident_data.affected_systems,
            affected_users=incident_data.affected_users,
            response_actions=incident_data.response_actions,
            tenant_id=tenant_id,
            indicators=incident_data.indicators,
            timeline=incident_data.timeline or []
        )
        
        db.add(incident)
        db.commit()
        db.refresh(incident)
        
        # Notify business-admin about new incident
        try:
            await notify_business_admin_incident(incident, tenant_id)
        except Exception as e:
            print(f"Failed to notify business-admin: {e}")
        
        return {"message": "Security incident created successfully", "incident_id": incident.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create security incident: {str(e)}"
        )

@router.get("/components/health")
async def get_component_health(
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: Auth0User = Depends(get_current_user)
):
    """Get health status of all Control Core components."""
    
    components = [
        {
            "name": "PAP (Policy Admin Panel)",
            "component": "pap",
            "status": "healthy",
            "active_incidents": 0,
            "total_incidents": 0,
            "last_health_check": datetime.utcnow().isoformat(),
            "uptime": 99.9
        }
    ]
    
    # Check other components
    for component_name, endpoint in COMPONENT_ENDPOINTS.items():
        try:
            health_data = await get_component_health_status(component_name, endpoint, tenant_id)
            components.append(health_data)
        except Exception as e:
            components.append({
                "name": f"{component_name.upper()}",
                "component": component_name,
                "status": "unknown",
                "active_incidents": 0,
                "total_incidents": 0,
                "last_health_check": datetime.utcnow().isoformat(),
                "uptime": 0.0
            })
    
    return components

@router.get("/metrics")
async def get_security_metrics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: Auth0User = Depends(get_current_user)
):
    """Get security metrics aggregated from all components."""
    
    try:
        # Calculate date range
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Get PAP metrics
        pap_incidents = db.query(SecurityIncident).filter(
            SecurityIncident.tenant_id == tenant_id,
            SecurityIncident.detected_at >= start_date,
            SecurityIncident.detected_at <= end_date
        ).all()
        
        total_incidents = len(pap_incidents)
        critical_incidents = len([i for i in pap_incidents if i.severity == "critical"])
        active_incidents = len([i for i in pap_incidents if i.status in ["active", "investigating"]])
        resolved_incidents = len([i for i in pap_incidents if i.status == "resolved"])
        
        # Calculate overdue incidents
        overdue_incidents = len([
            i for i in pap_incidents 
            if i.sla_deadline and datetime.utcnow() > i.sla_deadline and i.status not in ["resolved", "closed"]
        ])
        
        # Calculate SLA compliance
        sla_compliance = 0.0
        if total_incidents > 0:
            sla_compliant = total_incidents - overdue_incidents
            sla_compliance = (sla_compliant / total_incidents) * 100
        
        # Calculate average response time (mock data for now)
        average_response_time = 45.0  # minutes
        
        return {
            "total_incidents": total_incidents,
            "critical_incidents": critical_incidents,
            "active_incidents": active_incidents,
            "overdue_incidents": overdue_incidents,
            "resolved_incidents": resolved_incidents,
            "average_response_time": average_response_time,
            "sla_compliance": sla_compliance
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve security metrics: {str(e)}"
        )

@router.get("/statistics")
async def get_incident_statistics(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: Auth0User = Depends(get_current_user)
):
    """Get incident statistics for dashboard."""
    
    try:
        # Get all incidents for the tenant
        incidents = db.query(SecurityIncident).filter(
            SecurityIncident.tenant_id == tenant_id
        ).all()
        
        # Calculate statistics
        by_severity = {}
        by_status = {}
        by_component = {}
        by_type = {}
        
        for incident in incidents:
            # By severity
            by_severity[incident.severity] = by_severity.get(incident.severity, 0) + 1
            
            # By status
            by_status[incident.status] = by_status.get(incident.status, 0) + 1
            
            # By component
            by_component[incident.component] = by_component.get(incident.component, 0) + 1
            
            # By type
            by_type[incident.incident_type] = by_type.get(incident.incident_type, 0) + 1
        
        # Generate trends (mock data for now)
        trends = []
        for i in range(30):
            date = datetime.utcnow() - timedelta(days=29-i)
            trends.append({
                "date": date.strftime("%Y-%m-%d"),
                "incidents": max(0, len([inc for inc in incidents if inc.detected_at.date() == date.date()])),
                "resolved": max(0, len([inc for inc in incidents if inc.resolved_at and inc.resolved_at.date() == date.date()]))
            })
        
        return {
            "by_severity": by_severity,
            "by_status": by_status,
            "by_component": by_component,
            "by_type": by_type,
            "trends": trends
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve incident statistics: {str(e)}"
        )

# Helper functions
async def get_component_incidents(component: str, tenant_id: str) -> List[Dict[str, Any]]:
    """Get incidents from a specific component."""
    
    endpoint = COMPONENT_ENDPOINTS.get(component)
    if not endpoint:
        return []
    
    try:
        response = requests.get(
            f"{endpoint}/api/security/incidents",
            params={"tenant_id": tenant_id},
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return []
            
    except Exception as e:
        print(f"Failed to get incidents from {component}: {e}")
        return []

async def get_component_incident(component: str, incident_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific incident from a component."""
    
    endpoint = COMPONENT_ENDPOINTS.get(component)
    if not endpoint:
        return None
    
    try:
        response = requests.get(
            f"{endpoint}/api/security/incidents/{incident_id}",
            params={"tenant_id": tenant_id},
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
            
    except Exception as e:
        print(f"Failed to get incident {incident_id} from {component}: {e}")
        return None

async def get_component_health_status(component: str, endpoint: str, tenant_id: str) -> Dict[str, Any]:
    """Get health status from a component."""
    
    try:
        response = requests.get(
            f"{endpoint}/api/health",
            timeout=5
        )
        
        if response.status_code == 200:
            health_data = response.json()
            return {
                "name": f"{component.upper()}",
                "component": component,
                "status": health_data.get("status", "healthy"),
                "active_incidents": health_data.get("active_incidents", 0),
                "total_incidents": health_data.get("total_incidents", 0),
                "last_health_check": datetime.utcnow().isoformat(),
                "uptime": health_data.get("uptime", 99.9)
            }
        else:
            return {
                "name": f"{component.upper()}",
                "component": component,
                "status": "warning",
                "active_incidents": 0,
                "total_incidents": 0,
                "last_health_check": datetime.utcnow().isoformat(),
                "uptime": 0.0
            }
            
    except Exception as e:
        return {
            "name": f"{component.upper()}",
            "component": component,
            "status": "unknown",
            "active_incidents": 0,
            "total_incidents": 0,
            "last_health_check": datetime.utcnow().isoformat(),
            "uptime": 0.0
        }

async def sync_incident_with_business_admin(incident_id: str, status_update: Dict[str, Any], tenant_id: str):
    """Sync incident status update with business-admin."""
    
    business_admin_endpoint = COMPONENT_ENDPOINTS.get("business_admin")
    if not business_admin_endpoint:
        return
    
    try:
        response = requests.patch(
            f"{business_admin_endpoint}/api/security/incidents/{incident_id}/sync",
            json={
                "tenant_id": tenant_id,
                "status_update": status_update
            },
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"Failed to sync with business-admin: {response.status_code}")
            
    except Exception as e:
        print(f"Error syncing with business-admin: {e}")

async def notify_business_admin_incident(incident: SecurityIncident, tenant_id: str):
    """Notify business-admin about a new incident."""
    
    business_admin_endpoint = COMPONENT_ENDPOINTS.get("business_admin")
    if not business_admin_endpoint:
        return
    
    try:
        incident_data = {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "severity": incident.severity,
            "status": incident.status,
            "component": "pap",
            "incident_type": incident.incident_type,
            "detected_at": incident.detected_at.isoformat(),
            "affected_systems": incident.affected_systems,
            "affected_users": incident.affected_users,
            "response_actions": incident.response_actions,
            "tenant_id": tenant_id,
            "indicators": incident.indicators,
            "timeline": incident.timeline
        }
        
        response = requests.post(
            f"{business_admin_endpoint}/api/security/incidents/from-component",
            json=incident_data,
            timeout=10
        )
        
        if response.status_code != 201:
            print(f"Failed to notify business-admin: {response.status_code}")
            
    except Exception as e:
        print(f"Error notifying business-admin: {e}")
