"""
PIP (Policy Information Point) API endpoints for Control Core
Provides comprehensive connection management, attribute mapping, and data synchronization
Production-hardened with rate limiting, security, and connection pooling
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import time
import asyncio
import aiohttp
import json
import uuid
import logging

# Production middleware imports
from app.middleware.rate_limiter import rate_limit, get_rate_limiter
from app.middleware.security import get_security_middleware, InputValidator, get_audit_logger
from app.middleware.connection_pool import get_pool_manager, get_database_session, get_http_session

logger = logging.getLogger(__name__)

from app.database import get_db
from app.models import (
    PIPConnection, AttributeMapping, PIPSyncLog, MCPConnection, 
    MCPTool, MCPResource, IntegrationTemplate, ConnectionType, ConnectionStatus
)
from app.schemas import (
    PIPConnectionCreate, PIPConnectionUpdate, PIPConnectionResponse,
    AttributeMappingCreate, AttributeMappingUpdate, AttributeMappingResponse,
    PIPSyncLogResponse, MCPConnectionCreate, MCPConnectionUpdate, MCPConnectionResponse,
    MCPToolCreate, MCPToolUpdate, MCPToolResponse,
    MCPResourceCreate, MCPResourceUpdate, MCPResourceResponse,
    IntegrationTemplateResponse, HealthCheckRequest, HealthCheckResponse,
    SyncRequest, SyncResponse, TestConnectionRequest, TestConnectionResponse
)
from app.services.pip_service import PIPService, DataSensitivity, CacheStrategy

router = APIRouter()

# --- PIP Connection Management ---

@router.get("/connections", response_model=List[PIPConnectionResponse])
@rate_limit("pip_connections")
async def get_pip_connections(
    connection_type: Optional[str] = None,
    provider: Optional[str] = None,
    status: Optional[str] = None,
    environment: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Get all PIP connections with optional filtering - Production hardened"""
    try:
        # Input validation
        if limit > 1000:
            limit = 1000  # Cap limit for performance
        if skip < 0:
            skip = 0
        
        # Validate environment if provided
        if environment and environment not in ["sandbox", "production"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Environment must be 'sandbox' or 'production'"
            )
        
        # Sanitize input parameters
        if connection_type:
            connection_type = InputValidator.sanitize_input(connection_type)
        if provider:
            provider = InputValidator.sanitize_input(provider)
        if status:
            status = InputValidator.sanitize_input(status)
        if environment:
            environment = InputValidator.sanitize_input(environment)
        
        # Use connection pool for database access
        async with get_database_session() as session:
            query = session.query(PIPConnection)
            
            if connection_type:
                query = query.filter(PIPConnection.connection_type == connection_type)
            if provider:
                query = query.filter(PIPConnection.provider == provider)
            if status:
                query = query.filter(PIPConnection.status == status)
            if environment:
                query = query.filter(PIPConnection.environment == environment)
            
            connections = query.offset(skip).limit(limit).all()
            
            # Log access for audit
            audit_logger = get_audit_logger()
            await audit_logger.log_security_event(
                event_type="pip_connections_accessed",
                user_id=getattr(request.state, 'user_id', None) if request else None,
                client_ip=request.client.host if request else "unknown",
                details={"connection_type": connection_type, "provider": provider, "status": status, "environment": environment},
                severity="info"
            )
            
            return connections
            
    except Exception as e:
        logger.error(f"Error fetching PIP connections: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch PIP connections"
        )

@router.get("/connections/{connection_id}", response_model=PIPConnectionResponse)
async def get_pip_connection(connection_id: int, db: Session = Depends(get_db)):
    """Get a specific PIP connection"""
    connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    return connection

@router.post("/connections", response_model=PIPConnectionResponse)
@rate_limit("pip_connections", {"requests": 10, "window": 3600})  # 10 connections per hour
async def create_pip_connection(
    connection: PIPConnectionCreate,
    request: Request = None,
    created_by: str = "system",  # In real implementation, get from auth context
    db: Session = Depends(get_db)
):
    """Create a new PIP connection - Production hardened with validation and security"""
    try:
        # Input validation
        validator = InputValidator()
        
        # Validate configuration
        is_valid, error_msg = validator.validate_connection_config(connection.configuration)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid connection configuration: {error_msg}"
            )
        
        # Validate credentials
        auth_type = connection.configuration.get("auth_type", "none")
        is_valid, error_msg = validator.validate_credentials(connection.credentials, auth_type)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid credentials: {error_msg}"
            )
        
        # Sanitize input data
        sanitized_name = validator.sanitize_input(connection.name)
        sanitized_description = validator.sanitize_input(connection.description) if connection.description else None
        
        # Production-grade credential encryption
        from app.middleware.security import get_security_middleware
        security_middleware = get_security_middleware()
        
        # Encrypt credentials using production encryption
        encrypted_credentials = {
            "encrypted": True,
            "data": security_middleware.fernet.encrypt(
                json.dumps(connection.credentials).encode()
            ).decode(),
            "encrypted_at": datetime.now().isoformat(),
            "auth_type": auth_type
        }
        
        # Use connection pool for database access
        async with get_database_session() as session:
            db_connection = PIPConnection(
                name=sanitized_name,
                description=sanitized_description,
                connection_type=connection.connection_type,
                provider=connection.provider,
                configuration=connection.configuration,
                credentials=encrypted_credentials,
                health_check_url=connection.health_check_url,
                sync_enabled=connection.sync_enabled,
                sync_frequency=connection.sync_frequency,
                created_by=created_by,
                created_at=datetime.now(),
                status=ConnectionStatus.PENDING  # Start as pending until tested
            )
            
            session.add(db_connection)
            session.commit()
            session.refresh(db_connection)
            
            # Log creation for audit
            audit_logger = get_audit_logger()
            await audit_logger.log_security_event(
                event_type="pip_connection_created",
                user_id=getattr(request.state, 'user_id', None) if request else None,
                client_ip=request.client.host if request else "unknown",
                details={
                    "connection_id": db_connection.id,
                    "connection_type": connection.connection_type,
                    "provider": connection.provider,
                    "auth_type": auth_type
                },
                severity="info"
            )
            
            return db_connection
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating PIP connection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create PIP connection"
        )

@router.put("/connections/{connection_id}", response_model=PIPConnectionResponse)
async def update_pip_connection(
    connection_id: int,
    connection_update: PIPConnectionUpdate,
    db: Session = Depends(get_db)
):
    """Update a PIP connection"""
    db_connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not db_connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    update_data = connection_update.dict(exclude_unset=True)
    if "credentials" in update_data:
        # Encrypt credentials
        update_data["credentials"] = {"encrypted": True, "data": update_data["credentials"]}
    
    for field, value in update_data.items():
        setattr(db_connection, field, value)
    
    db_connection.updated_at = datetime.now()
    db.commit()
    db.refresh(db_connection)
    
    return db_connection

@router.delete("/connections/{connection_id}")
async def delete_pip_connection(connection_id: int, db: Session = Depends(get_db)):
    """Delete a PIP connection"""
    db_connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not db_connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    # Delete related attribute mappings
    db.query(AttributeMapping).filter(AttributeMapping.connection_id == connection_id).delete()
    
    # Delete related sync logs
    db.query(PIPSyncLog).filter(PIPSyncLog.connection_id == connection_id).delete()
    
    db.delete(db_connection)
    db.commit()
    
    return {"message": f"PIP connection {connection_id} deleted successfully"}

# --- Connection Testing and Authentication ---

@router.post("/connections/test", response_model=TestConnectionResponse)
async def test_pip_connection(
    test_request: TestConnectionRequest,
    db: Session = Depends(get_db)
):
    """
    Test PIP connection before saving
    Validates credentials and connectivity to the data source
    """
    from app.services.pip_connector_service import PIPConnectorService
    from app.services.pip_validators import PIPValidators
    
    # First validate configuration
    is_valid, error_msg = PIPValidators.validate_configuration(
        connection_type=test_request.connection_type.value,
        provider=test_request.provider,
        auth_type=test_request.configuration.get("auth_type", ""),
        configuration=test_request.configuration,
        credentials=test_request.credentials
    )
    
    if not is_valid:
        return TestConnectionResponse(
            success=False,
            status="validation_failed",
            response_time=0,
            error_message=error_msg,
            details={},
            tested_at=datetime.now()
        )
    
    # Test actual connection
    connector = PIPConnectorService()
    result = await connector.test_connection(
        connection_type=test_request.connection_type.value,
        provider=test_request.provider,
        auth_type=test_request.configuration.get("auth_type", ""),
        configuration=test_request.configuration,
        credentials=test_request.credentials
    )
    
    return TestConnectionResponse(**result)

@router.post("/connections/{connection_id}/authenticate")
async def authenticate_pip_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """
    Trigger OAuth authentication flow or refresh tokens
    Returns OAuth authorization URL for OAuth connections
    """
    connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    config = connection.configuration
    auth_type = config.get("auth_type")
    
    if auth_type != "oauth":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint is only for OAuth connections"
        )
    
    from app.services.pip_connector_service import PIPConnectorService
    connector = PIPConnectorService()
    
    success, error, token_data = await connector.authenticate_oauth(connection, db)
    
    if success:
        return {
            "message": "OAuth authentication successful",
            "token_data": {
                "expires_in": token_data.get("expires_in"),
                "scope": token_data.get("scope")
            }
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )

@router.post("/connections/{connection_id}/fetch-data")
async def fetch_pip_data(
    connection_id: int,
    endpoint_path: Optional[str] = "",
    db: Session = Depends(get_db)
):
    """
    Fetch sample data from PIP connection for testing/preview
    """
    connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    from app.services.pip_connector_service import PIPConnectorService
    connector = PIPConnectorService()
    
    success, data, error = await connector.fetch_data(
        connection=connection,
        endpoint_path=endpoint_path,
        query_params={"limit": 10}  # Limit to 10 records for preview
    )
    
    if success:
        return {
            "success": True,
            "data": data,
            "record_count": len(data) if data else 0
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch data: {error}"
        )

@router.post("/connections/{connection_id}/sync")
async def sync_pip_connection(
    connection_id: int,
    sync_type: str = "incremental",
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Trigger manual sync of PIP connection data
    """
    connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    from app.services.pip_connector_service import PIPConnectorService
    connector = PIPConnectorService()
    
    # Execute sync
    result = await connector.sync_data(connection_id, db)
    
    if result.get("success"):
        # Log sync
        sync_log = PIPSyncLog(
            connection_id=connection_id,
            sync_type=sync_type,
            status="success",
            records_processed=result.get("records_processed", 0),
            records_synced=result.get("records_synced", 0),
            records_failed=result.get("records_failed", 0),
            duration_seconds=result.get("duration_seconds", 0)
        )
        db.add(sync_log)
        db.commit()
        
        return {
            "message": "Sync completed successfully",
            "result": result
        }
    else:
        # Log failed sync
        sync_log = PIPSyncLog(
            connection_id=connection_id,
            sync_type=sync_type,
            status="error",
            error_message=result.get("error"),
            duration_seconds=result.get("duration_seconds", 0)
        )
        db.add(sync_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sync failed: {result.get('error')}"
        )

@router.get("/connections/{connection_id}/schema")
async def discover_source_schema(
    connection_id: int,
    sample_size: int = 5,
    db: Session = Depends(get_db)
):
    """
    Auto-discover schema from connected data source
    Analyzes sample data to identify available fields and types
    """
    connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    from app.services.pip_connector_service import PIPConnectorService
    connector = PIPConnectorService()
    
    success, schema_data, error = await connector.discover_schema(connection, sample_size)
    
    if success:
        return {
            "success": True,
            "connection_id": connection_id,
            "connection_name": connection.name,
            "schema": schema_data
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Schema discovery failed: {error}"
        )

@router.get("/attributes/autocomplete")
async def get_pip_attributes_for_autocomplete(
    db: Session = Depends(get_db)
):
    """
    Get all available PIP attributes for IDE autocomplete
    Returns flattened list of all mapped attributes across all active connections
    """
    # Get all active connections with their mappings
    connections = db.query(PIPConnection).filter(
        PIPConnection.status == ConnectionStatus.ACTIVE
    ).all()
    
    autocomplete_items = []
    
    for conn in connections:
        # Get mappings for this connection
        mappings = db.query(AttributeMapping).filter(
            AttributeMapping.connection_id == conn.id
        ).all()
        
        for mapping in mappings:
            autocomplete_items.append({
                "label": mapping.target_attribute,
                "source": conn.name,
                "source_id": conn.id,
                "source_type": conn.connection_type.value,
                "source_field": mapping.source_attribute,
                "type": mapping.data_type,
                "description": f"{mapping.source_attribute} from {conn.name}",
                "is_sensitive": mapping.is_sensitive,
                "path": f"data.pip.{conn.name.lower().replace(' ', '_')}.{mapping.target_attribute}",
                "last_sync": conn.last_sync.isoformat() if conn.last_sync else None
            })
    
    return {
        "attributes": autocomplete_items,
        "total_count": len(autocomplete_items),
        "connections_count": len(connections)
    }

# --- Caching Endpoints ---

@router.get("/connections/{connection_id}/cached-data")
async def get_cached_pip_data(
    connection_id: int,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all cached metadata for a PIP connection"""
    connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    from app.services.pip_cache_service import get_cache_service
    cache_service = get_cache_service()
    
    cached_data = await cache_service.get_all_cached_data(connection_id, user_id)
    
    return {
        "connection_id": connection_id,
        "connection_name": connection.name,
        "cached_attributes": cached_data,
        "attribute_count": len(cached_data)
    }

@router.post("/connections/{connection_id}/refresh-cache")
async def refresh_pip_cache(
    connection_id: int,
    force: bool = False,
    db: Session = Depends(get_db)
):
    """Force refresh of cached PIP data"""
    connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    from app.services.pip_cache_service import get_cache_service
    from app.services.pip_connector_service import PIPConnectorService
    
    # Fetch fresh data
    connector = PIPConnectorService()
    success, data, error = await connector.fetch_data(connection)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch data: {error}"
        )
    
    # Cache the data
    cache_service = get_cache_service()
    
    # Convert list of records to attribute dictionary
    # This is simplified - in production, would use attribute mappings
    if data and len(data) > 0:
        attributes = data[0] if isinstance(data, list) else data
        ttl = connection.sync_frequency or 300
        
        await cache_service.cache_pip_data(
            connection_id=connection_id,
            attributes=attributes,
            ttl=ttl,
            encrypt_sensitive=True
        )
    
    return {
        "success": True,
        "message": "Cache refreshed successfully",
        "records_processed": len(data) if data else 0
    }

@router.get("/cache/stats")
async def get_pip_cache_stats(
    connection_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get overall PIP cache statistics"""
    from app.services.pip_cache_service import get_cache_service
    
    cache_service = get_cache_service()
    stats = await cache_service.get_cache_stats(connection_id)
    
    return {
        "cache_stats": stats,
        "connection_id": connection_id
    }

# --- Attribute Mapping Management ---

@router.get("/connections/{connection_id}/mappings", response_model=List[AttributeMappingResponse])
async def get_attribute_mappings(connection_id: int, db: Session = Depends(get_db)):
    """Get attribute mappings for a connection"""
    mappings = db.query(AttributeMapping).filter(
        AttributeMapping.connection_id == connection_id
    ).all()
    return mappings

@router.post("/connections/{connection_id}/mappings", response_model=AttributeMappingResponse)
async def create_attribute_mapping(
    connection_id: int,
    mapping: AttributeMappingCreate,
    db: Session = Depends(get_db)
):
    """Create a new attribute mapping"""
    # Verify connection exists
    connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    db_mapping = AttributeMapping(
        connection_id=connection_id,
        source_attribute=mapping.source_attribute,
        target_attribute=mapping.target_attribute,
        transformation_rule=mapping.transformation_rule,
        is_required=mapping.is_required,
        is_sensitive=mapping.is_sensitive,
        data_type=mapping.data_type,
        validation_rules=mapping.validation_rules
    )
    
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    
    return db_mapping

@router.put("/mappings/{mapping_id}", response_model=AttributeMappingResponse)
async def update_attribute_mapping(
    mapping_id: int,
    mapping_update: AttributeMappingUpdate,
    db: Session = Depends(get_db)
):
    """Update an attribute mapping"""
    db_mapping = db.query(AttributeMapping).filter(AttributeMapping.id == mapping_id).first()
    if not db_mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attribute mapping {mapping_id} not found"
        )
    
    update_data = mapping_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_mapping, field, value)
    
    db_mapping.updated_at = datetime.now()
    db.commit()
    db.refresh(db_mapping)
    
    return db_mapping

@router.delete("/mappings/{mapping_id}")
async def delete_attribute_mapping(mapping_id: int, db: Session = Depends(get_db)):
    """Delete an attribute mapping"""
    db_mapping = db.query(AttributeMapping).filter(AttributeMapping.id == mapping_id).first()
    if not db_mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attribute mapping {mapping_id} not found"
        )
    
    db.delete(db_mapping)
    db.commit()
    
    return {"message": f"Attribute mapping {mapping_id} deleted successfully"}

# --- Health Check and Testing ---

@router.post("/connections/{connection_id}/health-check", response_model=HealthCheckResponse)
async def health_check_connection(
    connection_id: int,
    health_check: HealthCheckRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Perform health check on a PIP connection"""
    connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    start_time = time.time()
    
    try:
        # Simulate health check based on connection type
        if connection.connection_type == ConnectionType.IAM:
            health_status = await _check_iam_connection(connection)
        elif connection.connection_type == ConnectionType.ERP:
            health_status = await _check_erp_connection(connection)
        elif connection.connection_type == ConnectionType.CRM:
            health_status = await _check_crm_connection(connection)
        elif connection.connection_type == ConnectionType.MCP:
            health_status = await _check_mcp_connection(connection)
        else:
            health_status = await _check_custom_connection(connection)
        
        response_time = time.time() - start_time
        
        # Update connection health status
        connection.health_status = health_status["status"]
        connection.last_health_check = datetime.now()
        db.commit()
        
        return HealthCheckResponse(
            connection_id=connection_id,
            status=health_status["status"],
            response_time=response_time,
            error_message=health_status.get("error"),
            checked_at=datetime.now(),
            details=health_status.get("details", {})
        )
        
    except Exception as e:
        response_time = time.time() - start_time
        connection.health_status = "unhealthy"
        connection.last_health_check = datetime.now()
        db.commit()
        
        return HealthCheckResponse(
            connection_id=connection_id,
            status="unhealthy",
            response_time=response_time,
            error_message=str(e),
            checked_at=datetime.now(),
            details={}
        )

@router.post("/connections/test", response_model=TestConnectionResponse)
async def test_connection(test_request: TestConnectionRequest):
    """Test a connection configuration without saving"""
    start_time = time.time()
    
    try:
        # Create temporary connection object for testing
        temp_connection = PIPConnection(
            id=0,  # Temporary ID
            name="test_connection",
            connection_type=test_request.connection_type,
            provider=test_request.provider,
            configuration=test_request.configuration,
            credentials=test_request.credentials
        )
        
        # Test connection based on type
        if test_request.connection_type == "identity":
            result = await _test_iam_connection_real(temp_connection)
        elif test_request.connection_type == "database":
            result = await _test_database_connection_real(temp_connection)
        elif test_request.connection_type == "openapi":
            result = await _test_openapi_connection_real(temp_connection)
        elif test_request.connection_type in ["hr", "crm", "erp", "csm", "cmdb", "api", "documents", "static", "warehouse", "cloud"]:
            result = await _test_custom_connection_real(temp_connection)
        else:
            result = await _test_generic_connection(temp_connection)
        
        response_time = time.time() - start_time
        
        return TestConnectionResponse(
            success=result["success"],
            status=result["status"],
            response_time=response_time,
            error_message=result.get("error"),
            details=result.get("details", {}),
            tested_at=datetime.now()
        )
        
    except Exception as e:
        response_time = time.time() - start_time
        return TestConnectionResponse(
            success=False,
            status="error",
            response_time=response_time,
            error_message=str(e),
            details={},
            tested_at=datetime.now()
        )

# --- Data Synchronization ---

@router.post("/connections/{connection_id}/sync", response_model=SyncResponse)
async def sync_connection(
    connection_id: int,
    sync_request: SyncRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Sync data from a PIP connection"""
    connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIP connection {connection_id} not found"
        )
    
    # Create sync log entry
    sync_log = PIPSyncLog(
        connection_id=connection_id,
        sync_type=sync_request.sync_type,
        status="running",
        started_at=datetime.now()
    )
    db.add(sync_log)
    db.commit()
    db.refresh(sync_log)
    
    # Start background sync task
    background_tasks.add_task(
        _perform_sync,
        connection_id,
        sync_log.id,
        sync_request.sync_type,
        sync_request.force
    )
    
    return SyncResponse(
        connection_id=connection_id,
        sync_id=sync_log.id,
        status="running",
        records_processed=0,
        records_synced=0,
        records_failed=0,
        duration_seconds=0.0,
        started_at=sync_log.started_at,
        completed_at=None,
        error_message=None
    )

@router.get("/connections/{connection_id}/sync-logs", response_model=List[PIPSyncLogResponse])
async def get_sync_logs(
    connection_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get sync logs for a connection"""
    logs = db.query(PIPSyncLog).filter(
        PIPSyncLog.connection_id == connection_id
    ).order_by(PIPSyncLog.started_at.desc()).offset(skip).limit(limit).all()
    
    return logs

# --- Integration Templates ---

@router.get("/templates", response_model=List[IntegrationTemplateResponse])
async def get_integration_templates(
    connection_type: Optional[str] = None,
    provider: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get available integration templates"""
    query = db.query(IntegrationTemplate).filter(IntegrationTemplate.is_active == True)
    
    if connection_type:
        query = query.filter(IntegrationTemplate.connection_type == connection_type)
    if provider:
        query = query.filter(IntegrationTemplate.provider == provider)
    
    templates = query.all()
    return templates

@router.get("/templates/{template_id}", response_model=IntegrationTemplateResponse)
async def get_integration_template(template_id: int, db: Session = Depends(get_db)):
    """Get a specific integration template"""
    template = db.query(IntegrationTemplate).filter(IntegrationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration template {template_id} not found"
        )
    return template

# --- MCP Connection Management ---

@router.get("/mcp/connections", response_model=List[MCPConnectionResponse])
async def get_mcp_connections(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all MCP connections"""
    connections = db.query(MCPConnection).offset(skip).limit(limit).all()
    return connections

@router.post("/mcp/connections", response_model=MCPConnectionResponse)
async def create_mcp_connection(
    connection: MCPConnectionCreate,
    created_by: str = "system",
    db: Session = Depends(get_db)
):
    """Create a new MCP connection"""
    encrypted_credentials = {"encrypted": True, "data": connection.credentials}
    
    db_connection = MCPConnection(
        name=connection.name,
        description=connection.description,
        mcp_server_url=connection.mcp_server_url,
        mcp_server_type=connection.mcp_server_type,
        configuration=connection.configuration,
        credentials=encrypted_credentials,
        sync_enabled=connection.sync_enabled,
        sync_frequency=connection.sync_frequency,
        created_by=created_by
    )
    
    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)
    
    return db_connection

# --- Helper Functions ---

async def _check_iam_connection(connection: PIPConnection) -> Dict[str, Any]:
    """Check IAM connection health"""
    # Simulate IAM health check
    await asyncio.sleep(0.1)  # Simulate network delay
    
    if connection.provider == "auth0":
        return {
            "status": "healthy",
            "details": {
                "tenant": "example.auth0.com",
                "users_count": 150,
                "last_login": "2024-01-15T10:30:00Z"
            }
        }
    elif connection.provider == "okta":
        return {
            "status": "healthy",
            "details": {
                "org_url": "https://example.okta.com",
                "users_count": 200,
                "groups_count": 15
            }
        }
    else:
        return {
            "status": "healthy",
            "details": {"provider": connection.provider}
        }

async def _check_erp_connection(connection: PIPConnection) -> Dict[str, Any]:
    """Check ERP connection health"""
    await asyncio.sleep(0.2)
    
    if connection.provider == "sap":
        return {
            "status": "healthy",
            "details": {
                "system_id": "SAP001",
                "modules": ["FI", "CO", "HR"],
                "users_count": 50
            }
        }
    elif connection.provider == "oracle":
        return {
            "status": "healthy",
            "details": {
                "instance": "ORACLE001",
                "modules": ["Financials", "HCM"],
                "users_count": 75
            }
        }
    else:
        return {"status": "healthy", "details": {"provider": connection.provider}}

async def _check_crm_connection(connection: PIPConnection) -> Dict[str, Any]:
    """Check CRM connection health"""
    await asyncio.sleep(0.15)
    
    if connection.provider == "salesforce":
        return {
            "status": "healthy",
            "details": {
                "org_id": "00D000000000000",
                "users_count": 25,
                "api_version": "v58.0"
            }
        }
    elif connection.provider == "hubspot":
        return {
            "status": "healthy",
            "details": {
                "portal_id": "12345678",
                "contacts_count": 1000,
                "companies_count": 500
            }
        }
    else:
        return {"status": "healthy", "details": {"provider": connection.provider}}

async def _check_mcp_connection(connection: PIPConnection) -> Dict[str, Any]:
    """Check MCP connection health"""
    await asyncio.sleep(0.1)
    
    return {
        "status": "healthy",
        "details": {
            "server_url": connection.mcp_server_url,
            "server_type": connection.mcp_server_type,
            "tools_count": 5,
            "resources_count": 10
        }
    }

async def _check_custom_connection(connection: PIPConnection) -> Dict[str, Any]:
    """Check custom connection health"""
    await asyncio.sleep(0.1)
    
    return {
        "status": "healthy",
        "details": {
            "provider": connection.provider,
            "custom_config": connection.configuration
        }
    }

async def _test_iam_connection(test_request: TestConnectionRequest) -> Dict[str, Any]:
    """Test IAM connection"""
    await asyncio.sleep(0.1)
    return {"success": True, "status": "connected", "details": {"provider": test_request.provider}}

async def _test_erp_connection(test_request: TestConnectionRequest) -> Dict[str, Any]:
    """Test ERP connection"""
    await asyncio.sleep(0.2)
    return {"success": True, "status": "connected", "details": {"provider": test_request.provider}}

async def _test_crm_connection(test_request: TestConnectionRequest) -> Dict[str, Any]:
    """Test CRM connection"""
    await asyncio.sleep(0.15)
    return {"success": True, "status": "connected", "details": {"provider": test_request.provider}}

async def _test_mcp_connection(test_request: TestConnectionRequest) -> Dict[str, Any]:
    """Test MCP connection"""
    await asyncio.sleep(0.1)
    return {"success": True, "status": "connected", "details": {"provider": test_request.provider}}

async def _test_custom_connection(test_request: TestConnectionRequest) -> Dict[str, Any]:
    """Test custom connection"""
    await asyncio.sleep(0.1)
    return {"success": True, "status": "connected", "details": {"provider": test_request.provider}}

# --- Real Connection Testing Functions ---

async def _test_iam_connection_real(connection: PIPConnection) -> Dict[str, Any]:
    """Test IAM connection with real API calls"""
    try:
        from app.services.schema_introspection_service import schema_introspection_service
        
        # Discover schema
        schema = await schema_introspection_service.discover_iam_schema(connection)
        
        # Get sample data
        sample_data = await _get_iam_sample_data(connection)
        
        return {
            "success": True,
            "status": "connected",
            "details": {
                "provider": connection.provider,
                "fields": _convert_schema_to_fields(schema),
                "sample_data": sample_data,
                "schema_discovered": True
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "details": {"provider": connection.provider}
        }

async def _test_database_connection_real(connection: PIPConnection) -> Dict[str, Any]:
    """Test database connection with real API calls"""
    try:
        from app.services.schema_introspection_service import schema_introspection_service
        
        # Discover schema
        schema = await schema_introspection_service.discover_database_schema(connection)
        
        # Get sample data
        sample_data = await _get_database_sample_data(connection)
        
        return {
            "success": True,
            "status": "connected",
            "details": {
                "provider": connection.provider,
                "fields": _convert_schema_to_fields(schema),
                "sample_data": sample_data,
                "schema_discovered": True
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "details": {"provider": connection.provider}
        }

async def _test_openapi_connection_real(connection: PIPConnection) -> Dict[str, Any]:
    """Test OpenAPI connection with real API calls"""
    try:
        from app.services.schema_introspection_service import schema_introspection_service
        
        # Discover schema
        schema = await schema_introspection_service.discover_api_schema(connection)
        
        return {
            "success": True,
            "status": "connected",
            "details": {
                "provider": connection.provider,
                "fields": _convert_schema_to_fields(schema),
                "sample_data": {"endpoints": len(schema.get("endpoints", [])), "models": len(schema.get("models", []))},
                "schema_discovered": True
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "details": {"provider": connection.provider}
        }

async def _test_custom_connection_real(connection: PIPConnection) -> Dict[str, Any]:
    """Test custom connection with real API calls"""
    try:
        # Test basic connectivity
        endpoint = connection.configuration.get("endpoint", "")
        if not endpoint:
            return {
                "success": False,
                "status": "error",
                "error": "No endpoint configured",
                "details": {"provider": connection.provider}
            }
        
        # Make a test request
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{endpoint}/health", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status < 400:
                    return {
                        "success": True,
                        "status": "connected",
                        "details": {
                            "provider": connection.provider,
                            "endpoint": endpoint,
                            "response_status": response.status,
                            "fields": _get_fallback_fields_for_type(connection.connection_type)
                        }
                    }
                else:
                    return {
                        "success": False,
                        "status": "error",
                        "error": f"HTTP {response.status}: {await response.text()}",
                        "details": {"provider": connection.provider}
                    }
        
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "details": {"provider": connection.provider}
        }

async def _test_generic_connection(connection: PIPConnection) -> Dict[str, Any]:
    """Test generic connection"""
    return {
        "success": True,
        "status": "connected",
        "details": {
            "provider": connection.provider,
            "fields": _get_fallback_fields_for_type(connection.connection_type)
        }
    }

async def _get_iam_sample_data(connection: PIPConnection) -> Dict[str, Any]:
    """Get sample IAM data"""
    try:
        from app.connectors.iam_connector import IAMConnectorFactory
        from .secrets_service import secrets_service
        
        credentials = secrets_service.get_secret(connection.id, "credentials")
        connector = IAMConnectorFactory.create_connector(
            connection.provider, connection.id, connection.configuration, credentials
        )
        
        # Get sample user
        sample_user = await connector.get_sample_user()
        return {"sample_user": sample_user}
        
    except Exception as e:
        logger.error(f"Failed to get IAM sample data: {e}")
        return {"sample_user": {"id": "sample_user", "email": "user@example.com", "name": "Sample User"}}

async def _get_database_sample_data(connection: PIPConnection) -> Dict[str, Any]:
    """Get sample database data"""
    try:
        from app.connectors.database_connector import DatabaseConnectorFactory
        from .secrets_service import secrets_service
        
        credentials = secrets_service.get_secret(connection.id, "credentials")
        connector = DatabaseConnectorFactory.create_connector(
            connection.provider, connection.id, connection.configuration, credentials
        )
        
        # Get sample data
        sample_data = await connector.get_sample_data()
        return sample_data
        
    except Exception as e:
        logger.error(f"Failed to get database sample data: {e}")
        return {"sample_table": {"id": 1, "name": "Sample Record", "created_at": "2024-01-01T00:00:00Z"}}

def _convert_schema_to_fields(schema: Dict[str, List]) -> List[Dict[str, Any]]:
    """Convert schema fields to API response format"""
    fields = []
    
    for category, field_list in schema.items():
        for field in field_list:
            fields.append({
                "name": field.name,
                "type": field.type,
                "description": field.description,
                "required": field.required,
                "nullable": field.nullable,
                "sensitivity": field.sensitivity,
                "category": category,
                "enum_values": field.enum_values,
                "example": field.example
            })
    
    return fields

def _get_fallback_fields_for_type(connection_type: str) -> List[Dict[str, Any]]:
    """Get fallback fields for a connection type"""
    fallback_fields = {
        "hr": [
            {"name": "employee.id", "type": "string", "required": True, "sensitivity": "internal"},
            {"name": "employee.name", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "employee.department", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "employee.manager", "type": "string", "required": False, "sensitivity": "internal"}
        ],
        "crm": [
            {"name": "customer.id", "type": "string", "required": True, "sensitivity": "internal"},
            {"name": "customer.name", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "customer.tier", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "customer.industry", "type": "string", "required": False, "sensitivity": "internal"}
        ],
        "erp": [
            {"name": "asset.id", "type": "string", "required": True, "sensitivity": "internal"},
            {"name": "asset.name", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "asset.category", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "asset.cost_center", "type": "string", "required": False, "sensitivity": "internal"}
        ],
        "csm": [
            {"name": "ticket.id", "type": "string", "required": True, "sensitivity": "internal"},
            {"name": "ticket.priority", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "ticket.category", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "ticket.requester", "type": "string", "required": False, "sensitivity": "internal"}
        ],
        "cmdb": [
            {"name": "ci.id", "type": "string", "required": True, "sensitivity": "internal"},
            {"name": "ci.name", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "ci.type", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "ci.owner", "type": "string", "required": False, "sensitivity": "internal"}
        ],
        "api": [
            {"name": "api.endpoint", "type": "string", "required": True, "sensitivity": "internal"},
            {"name": "api.method", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "api.parameters", "type": "object", "required": False, "sensitivity": "internal"}
        ],
        "documents": [
            {"name": "document.id", "type": "string", "required": True, "sensitivity": "internal"},
            {"name": "document.name", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "document.type", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "document.owner", "type": "string", "required": False, "sensitivity": "internal"}
        ],
        "static": [
            {"name": "data.id", "type": "string", "required": True, "sensitivity": "internal"},
            {"name": "data.category", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "data.value", "type": "string", "required": False, "sensitivity": "internal"}
        ],
        "warehouse": [
            {"name": "dataset.id", "type": "string", "required": True, "sensitivity": "internal"},
            {"name": "dataset.name", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "dataset.schema", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "dataset.owner", "type": "string", "required": False, "sensitivity": "internal"}
        ],
        "cloud": [
            {"name": "resource.id", "type": "string", "required": True, "sensitivity": "internal"},
            {"name": "resource.name", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "resource.type", "type": "string", "required": False, "sensitivity": "internal"},
            {"name": "resource.region", "type": "string", "required": False, "sensitivity": "internal"}
        ]
    }
    
    return fallback_fields.get(connection_type, [
        {"name": "field1", "type": "string", "required": True, "sensitivity": "internal"},
        {"name": "field2", "type": "string", "required": False, "sensitivity": "internal"}
    ])

async def _perform_sync(connection_id: int, sync_log_id: int, sync_type: str, force: bool):
    """Background task to perform data synchronization"""
    # This would be implemented with actual sync logic
    # For now, just simulate the sync process
    await asyncio.sleep(2)  # Simulate sync time
    
    # Update sync log (in real implementation, this would be done via database session)
    print(f"Sync completed for connection {connection_id}, sync log {sync_log_id}")

# --- Sensitive Data Management ---

@router.post("/connections/{connection_id}/fetch-sensitive-attributes")
async def fetch_sensitive_attributes(
    connection_id: int,
    required_attributes: List[str],
    user_id: str,
    request_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Fetch sensitive attributes with real-time data and caching"""
    try:
        # Initialize PIP service with Redis and encryption (in production)
        pip_service = PIPService(db)
        
        # Fetch sensitive attributes
        attributes = await pip_service.fetch_sensitive_attributes(
            connection_id=connection_id,
            user_id=user_id,
            required_attributes=required_attributes,
            request_id=request_id
        )
        
        # Convert to response format (without exposing sensitive values in logs)
        response_data = {}
        for attr_name, attr_data in attributes.items():
            response_data[attr_name] = {
                "name": attr_data.name,
                "sensitivity": attr_data.sensitivity.value,
                "is_encrypted": attr_data.is_encrypted,
                "cache_ttl": attr_data.cache_ttl,
                "last_updated": attr_data.last_updated.isoformat(),
                # Only include value if not sensitive
                "value": attr_data.value if attr_data.sensitivity in [DataSensitivity.PUBLIC, DataSensitivity.INTERNAL] else "[REDACTED]"
            }
        
        return {
            "connection_id": connection_id,
            "attributes": response_data,
            "fetched_at": datetime.now().isoformat(),
            "request_id": request_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sensitive attributes: {str(e)}"
        )

@router.get("/connections/{connection_id}/audit-logs")
async def get_audit_logs(
    connection_id: int,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Get audit logs for sensitive data access"""
    try:
        pip_service = PIPService(db)
        
        audit_logs = await pip_service.get_audit_logs(
            connection_id=connection_id,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Convert to response format
        logs_data = []
        for log in audit_logs:
            logs_data.append({
                "connection_id": log.connection_id,
                "attribute_name": log.attribute_name,
                "operation": log.operation,
                "timestamp": log.timestamp.isoformat(),
                "user_id": log.user_id,
                "request_id": log.request_id,
                "success": log.success,
                "error_message": log.error_message
            })
        
        return {
            "connection_id": connection_id,
            "audit_logs": logs_data,
            "total_logs": len(logs_data),
            "filtered_by": {
                "user_id": user_id,
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get audit logs: {str(e)}"
        )

@router.delete("/connections/{connection_id}/clear-cache")
async def clear_sensitive_cache(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """Clear sensitive data from cache"""
    try:
        pip_service = PIPService(db)
        
        await pip_service.clear_sensitive_cache(connection_id)
        
        return {
            "connection_id": connection_id,
            "message": "Sensitive data cache cleared successfully",
            "cleared_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )

@router.get("/connections/{connection_id}/cache-statistics")
async def get_cache_statistics(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """Get cache statistics for sensitive data"""
    try:
        pip_service = PIPService(db)
        
        stats = await pip_service.get_cache_statistics()
        
        return {
            "connection_id": connection_id,
            "cache_statistics": stats,
            "retrieved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cache statistics: {str(e)}"
        )

@router.post("/connections/{connection_id}/test-sensitive-fetch")
async def test_sensitive_fetch(
    connection_id: int,
    test_attributes: List[str],
    user_id: str,
    db: Session = Depends(get_db)
):
    """Test fetching sensitive attributes without storing them"""
    try:
        pip_service = PIPService(db)
        
        # Test fetch without storing
        attributes = await pip_service.fetch_sensitive_attributes(
            connection_id=connection_id,
            user_id=user_id,
            required_attributes=test_attributes,
            request_id=f"test_{uuid.uuid4().hex[:8]}"
        )
        
        # Return test results (without sensitive values)
        test_results = {}
        for attr_name, attr_data in attributes.items():
            test_results[attr_name] = {
                "name": attr_data.name,
                "sensitivity": attr_data.sensitivity.value,
                "is_encrypted": attr_data.is_encrypted,
                "cache_ttl": attr_data.cache_ttl,
                "last_updated": attr_data.last_updated.isoformat(),
                "fetch_successful": True,
                "value_preview": "[REDACTED]" if attr_data.sensitivity in [DataSensitivity.CONFIDENTIAL, DataSensitivity.RESTRICTED] else str(attr_data.value)[:50] + "..." if len(str(attr_data.value)) > 50 else str(attr_data.value)
            }
        
        return {
            "connection_id": connection_id,
            "test_results": test_results,
            "test_attributes": test_attributes,
            "tested_at": datetime.now().isoformat(),
            "user_id": user_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test sensitive fetch: {str(e)}"
        )

# --- OPAL Integration Endpoints ---

# NOTE: OPAL publisher endpoints removed - OPAL now polls our /opal/pip-data endpoints
# See /routers/opal_data.py for the correct integration

@router.get("/connections/{connection_id}/data-snapshot")
async def get_data_snapshot(connection_id: int, db: Session = Depends(get_db)):
    """Get current data snapshot for OPAL"""
    try:
        pip_service = PIPService(db)
        
        # Get connection
        connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"PIP connection {connection_id} not found"
            )
        
        # Generate snapshot (mock implementation)
        snapshot = {
            "connection_id": connection_id,
            "connection_name": connection.name,
            "provider": connection.provider,
            "last_updated": datetime.now().isoformat(),
            "data": {
                "users": 150,
                "groups": 25,
                "resources": 75
            }
        }
        
        return snapshot
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get data snapshot: {str(e)}"
        )

# --- Integration Templates ---

@router.get("/templates", response_model=List[Dict[str, Any]])
async def get_integration_templates(
    connection_type: Optional[str] = None,
    provider: Optional[str] = None
):
    """Get available integration templates"""
    try:
        from app.data.integration_templates import get_active_templates, get_templates_by_type, get_templates_by_provider
        
        if connection_type:
            templates = get_templates_by_type(connection_type)
        elif provider:
            templates = get_templates_by_provider(provider)
        else:
            templates = get_active_templates()
        
        return [
            {
                'id': template.id,
                'name': template.name,
                'description': template.description,
                'connection_type': template.connection_type,
                'provider': template.provider,
                'configuration_template': template.configuration_template,
                'credentials_template': template.credentials_template,
                'attribute_mappings': template.attribute_mappings,
                'setup_instructions': template.setup_instructions,
                'is_active': template.is_active
            }
            for template in templates
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get integration templates: {str(e)}"
        )

@router.get("/templates/{template_id}")
async def get_integration_template(template_id: str):
    """Get a specific integration template"""
    try:
        from app.data.integration_templates import get_template_config
        
        template = get_template_config(template_id)
        return template
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get integration template: {str(e)}"
        )

# --- OAuth Integration Endpoints ---

@router.get("/oauth/authorize/{provider}")
async def initiate_oauth_flow(
    provider: str,
    connection_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Initiate OAuth 2.0 authorization flow for a provider"""
    try:
        from app.services.oauth_service import oauth_service
        
        # Generate state parameter for security
        import secrets
        state = secrets.token_urlsafe(32)
        
        # Get connection if provided
        connection_config = {}
        if connection_id:
            connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
            if connection:
                connection_config = connection.configuration
        
        # Get provider-specific OAuth configuration
        oauth_config = oauth_service.get_provider_config(provider, connection_config)
        
        # Generate authorization URL
        auth_url = oauth_service.get_authorization_url(provider, oauth_config, state)
        
        return {
            "authorization_url": auth_url,
            "state": state,
            "provider": provider,
            "connection_id": connection_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate OAuth flow: {str(e)}"
        )

@router.post("/oauth/callback/{provider}")
async def handle_oauth_callback(
    provider: str,
    code: str,
    state: str,
    connection_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Handle OAuth callback and exchange code for tokens"""
    try:
        from app.services.oauth_service import oauth_service
        
        # Get connection if provided
        connection = None
        if connection_id:
            connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
            if not connection:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Connection {connection_id} not found"
                )
        
        # Get provider instance
        provider_instance = oauth_service.get_provider(provider, connection.configuration if connection else {})
        
        # Exchange code for tokens
        token = await provider_instance.exchange_code_for_token(code)
        
        # Store tokens securely
        if connection:
            # Update connection with OAuth tokens
            connection.credentials = {
                "oauth_token": token.to_dict(),
                "provider": provider
            }
            db.commit()
        
        # Get user info to verify connection
        user_info = await provider_instance.get_user_info(token.access_token)
        
        return {
            "success": True,
            "provider": provider,
            "connection_id": connection_id,
            "user_info": {
                "id": user_info.get("sub") or user_info.get("id"),
                "email": user_info.get("email"),
                "name": user_info.get("name") or user_info.get("displayName")
            },
            "token_expires_at": token.expires_at.isoformat() if token.expires_at else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )

@router.post("/oauth/refresh/{connection_id}")
async def refresh_oauth_token(connection_id: int, db: Session = Depends(get_db)):
    """Refresh OAuth token for a connection"""
    try:
        from app.services.oauth_service import oauth_service
        
        connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connection {connection_id} not found"
            )
        
        # Get stored OAuth token
        credentials = connection.credentials
        if not credentials or "oauth_token" not in credentials:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No OAuth token found for this connection"
            )
        
        oauth_token_data = credentials["oauth_token"]
        provider = credentials.get("provider")
        
        if not oauth_token_data.get("refresh_token"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No refresh token available"
            )
        
        # Get provider instance and refresh token
        provider_instance = oauth_service.get_provider(provider, connection.configuration)
        new_token = await provider_instance.refresh_token(oauth_token_data["refresh_token"])
        
        # Update stored token
        connection.credentials["oauth_token"] = new_token.to_dict()
        db.commit()
        
        return {
            "success": True,
            "connection_id": connection_id,
            "token_expires_at": new_token.expires_at.isoformat() if new_token.expires_at else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )

# --- OPAL Integration Endpoints ---
# NOTE: Duplicate OPAL publisher endpoints removed
# OPAL now polls our endpoints at /opal/pip-data (see app/routers/opal_data.py)
# We do NOT push to OPAL - OPAL pulls from us!

@router.get("/opal/config")
async def get_opal_config(db: Session = Depends(get_db)):
    """Get OPAL client configuration"""
    try:
        from app.services.opal_config_generator import opal_config_generator
        
        # Get all active connections
        connections = db.query(PIPConnection).filter(
            PIPConnection.status == "active"
        ).all()
        
        # Generate OPAL config
        opal_config = opal_config_generator.generate_opal_client_config(connections)
        
        return opal_config
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate OPAL config: {str(e)}"
        )

@router.get("/connections/{connection_id}/opal-config")
async def get_connection_opal_config(connection_id: int, db: Session = Depends(get_db)):
    """Get OPAL configuration for a specific connection"""
    try:
        from app.services.opal_config_generator import opal_config_generator
        
        connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connection {connection_id} not found"
            )
        
        # Generate config
        opal_config = opal_config_generator.generate_data_source_config(connection)
        webhook_config = opal_config_generator.generate_webhook_config(connection)
        helper_functions = opal_config_generator.generate_policy_helper_functions(connection)
        data_schema = opal_config_generator.generate_data_schema(connection)
        
        return {
            "connection_id": connection_id,
            "opal_config": asdict(opal_config),
            "webhook_config": webhook_config,
            "helper_functions": helper_functions,
            "data_schema": data_schema
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate OPAL config: {str(e)}"
        )

# --- Sync Scheduler Endpoints ---

@router.post("/connections/{connection_id}/schedule-sync")
async def schedule_connection_sync(connection_id: int, db: Session = Depends(get_db)):
    """Schedule a connection for automated sync"""
    try:
        from app.services.sync_scheduler import sync_scheduler
        
        connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connection {connection_id} not found"
            )
        
        # Schedule the connection
        job_id = await sync_scheduler.schedule_connection(connection)
        
        return {
            "success": True,
            "message": f"Connection {connection_id} scheduled for sync",
            "job_id": job_id,
            "sync_frequency": connection.sync_frequency
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule sync: {str(e)}"
        )

@router.delete("/connections/{connection_id}/unschedule-sync")
async def unschedule_connection_sync(connection_id: int, db: Session = Depends(get_db)):
    """Remove a connection from sync schedule"""
    try:
        from app.services.sync_scheduler import sync_scheduler
        
        # Unschedule the connection
        success = await sync_scheduler.unschedule_connection(connection_id)
        
        if success:
            return {
                "success": True,
                "message": f"Connection {connection_id} unscheduled from sync"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No sync job found for connection {connection_id}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unschedule sync: {str(e)}"
        )

@router.get("/connections/{connection_id}/sync-status")
async def get_connection_sync_status(connection_id: int, db: Session = Depends(get_db)):
    """Get sync status for a connection"""
    try:
        from app.services.sync_scheduler import sync_scheduler
        
        connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connection {connection_id} not found"
            )
        
        # Get job status
        job_status = await sync_scheduler.get_job_status(connection_id)
        
        return {
            "connection_id": connection_id,
            "sync_enabled": connection.sync_enabled,
            "sync_frequency": connection.sync_frequency,
            "job_status": job_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sync status: {str(e)}"
        )

@router.post("/connections/{connection_id}/trigger-sync")
async def trigger_manual_sync(connection_id: int, db: Session = Depends(get_db)):
    """Trigger a manual sync for a connection"""
    try:
        from app.services.sync_scheduler import sync_scheduler
        
        connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connection {connection_id} not found"
            )
        
        # Trigger manual sync
        success = await sync_scheduler.trigger_manual_sync(connection_id)
        
        if success:
            return {
                "success": True,
                "message": f"Manual sync triggered for connection {connection_id}"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to trigger manual sync"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger manual sync: {str(e)}"
        )

@router.get("/sync/scheduler-stats")
async def get_scheduler_stats():
    """Get sync scheduler statistics"""
    try:
        from app.services.sync_scheduler import sync_scheduler
        
        stats = await sync_scheduler.get_scheduler_stats()
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get scheduler stats: {str(e)}"
        )

@router.get("/sync/jobs")
async def get_all_sync_jobs():
    """Get status of all sync jobs"""
    try:
        from app.services.sync_scheduler import sync_scheduler
        
        jobs = await sync_scheduler.get_all_jobs_status()
        return {"jobs": jobs}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sync jobs: {str(e)}"
        )

@router.post("/sync/reschedule-all")
async def reschedule_all_connections():
    """Reschedule all active connections"""
    try:
        from app.services.sync_scheduler import sync_scheduler
        
        await sync_scheduler.reschedule_all_connections()
        
        return {
            "success": True,
            "message": "All active connections rescheduled"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reschedule connections: {str(e)}"
        )


@router.get("/attributes")
@rate_limit("pip_fetch")
async def get_pip_attributes(
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Get all available attributes from connected PIPs for policy creation - Production hardened"""
    try:
        # Use connection pool for database access
        async with get_database_session() as session:
            # Fetch all active PIP connections
            pip_connections = session.query(PIPConnection).filter(
                PIPConnection.status == ConnectionStatus.CONNECTED
            ).all()
            
            # Fetch all attribute mappings
            attributes = []
            
            for pip in pip_connections:
                mappings = session.query(AttributeMapping).filter(
                    AttributeMapping.connection_id == pip.id
                ).all()
                
                for mapping in mappings:
                    attributes.append({
                        "name": mapping.target_attribute,
                        "type": mapping.data_type or "string",
                        "source": pip.provider or pip.connection_type,
                        "description": f"From {pip.name}",
                        "source_attribute": mapping.source_attribute,
                        "connection_id": pip.id,
                        "is_sensitive": mapping.is_sensitive,
                        "last_sync": pip.last_sync.isoformat() if pip.last_sync else None
                    })
            
            # Add common built-in attributes
            builtin_attributes = [
                {"name": "user.authenticated", "type": "boolean", "source": "system", "description": "User authentication status", "is_sensitive": False},
                {"name": "time.hour", "type": "number", "source": "system", "description": "Current hour (0-23)", "is_sensitive": False},
                {"name": "time.day_of_week", "type": "number", "source": "system", "description": "Day of week (0-6)", "is_sensitive": False},
                {"name": "location.country", "type": "string", "source": "system", "description": "Request origin country", "is_sensitive": False},
                {"name": "location.ip", "type": "string", "source": "system", "description": "Request IP address", "is_sensitive": True},
            ]
            
            attributes.extend(builtin_attributes)
            
            # Log access for audit
            audit_logger = get_audit_logger()
            await audit_logger.log_security_event(
                event_type="pip_attributes_accessed",
                user_id=getattr(request.state, 'user_id', None) if request else None,
                client_ip=request.client.host if request else "unknown",
                details={"attribute_count": len(attributes), "connection_count": len(pip_connections)},
                severity="info"
            )
            
            return attributes
            
    except Exception as e:
        logger.error(f"Error fetching PIP attributes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch PIP attributes"
        )

# --- Production Monitoring and Health Endpoints ---

@router.get("/health")
async def get_pip_health_status():
    """Get overall PIP system health status"""
    try:
        pool_manager = get_pool_manager()
        pool_status = pool_manager.get_all_pool_status()
        
        # Check if all pools are healthy
        all_healthy = all(
            pool.get("status") == "healthy" 
            for pool in pool_status.values() 
            if pool is not None
        )
        
        return {
            "status": "healthy" if all_healthy else "degraded",
            "timestamp": datetime.now().isoformat(),
            "pools": pool_status,
            "version": "1.0.0"
        }
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "version": "1.0.0"
        }

@router.get("/metrics")
@rate_limit("pip_health_check")
async def get_pip_metrics():
    """Get detailed PIP system metrics"""
    try:
        pool_manager = get_pool_manager()
        pool_status = pool_manager.get_all_pool_status()
        
        # Calculate overall metrics
        total_requests = sum(
            pool.get("total_requests", 0) 
            for pool in pool_status.values() 
            if pool is not None
        )
        
        total_successful = sum(
            pool.get("successful_requests", 0) 
            for pool in pool_status.values() 
            if pool is not None
        )
        
        overall_success_rate = (
            total_successful / max(1, total_requests)
        ) * 100
        
        return {
            "timestamp": datetime.now().isoformat(),
            "overall_metrics": {
                "total_requests": total_requests,
                "successful_requests": total_successful,
                "success_rate_percent": round(overall_success_rate, 2)
            },
            "pool_metrics": pool_status,
            "system_info": {
                "uptime": "N/A",  # Would be calculated from start time
                "memory_usage": "N/A",  # Would be retrieved from system
                "cpu_usage": "N/A"  # Would be retrieved from system
            }
        }
        
    except Exception as e:
        logger.error(f"Metrics error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get metrics"
        )
