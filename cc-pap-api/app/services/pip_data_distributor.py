"""
PIP Data Formatter - Formats PIP metadata for OPAL consumption
NOTE: This service DOES NOT push data to OPAL. OPAL polls our endpoints.
OPAL handles all distribution to OPA instances - we just provide the data.
"""

import json
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.models import PIPConnection, AttributeMapping
from sqlalchemy.orm import Session


class PIPDataFormatter:
    """
    Service for formatting PIP data for OPAL endpoints
    
    IMPORTANT: This does NOT push to OPAL. OPAL polls our /opal/pip-data endpoints.
    OPAL then handles distribution to all connected OPA clients.
    """
    
    def __init__(self):
        pass
    
    async def sync_to_opa_bundle(
        self,
        connection_id: int,
        mapped_data: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """
        Sync PIP data directly to OPA bundle format
        Used when OPAL is not available
        
        Returns:
            OPA bundle entry
        """
        try:
            connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
            if not connection:
                return {"error": "Connection not found"}
            
            # Build OPA data document
            connection_name = connection.name.lower().replace(' ', '_').replace('-', '_')
            
            opa_data = {
                connection_name: {
                    "metadata": {
                        "connection_id": connection_id,
                        "connection_type": connection.connection_type.value,
                        "provider": connection.provider,
                        "last_sync": datetime.now().isoformat(),
                        "status": connection.health_status
                    },
                    "attributes": mapped_data
                }
            }
            
            return opa_data
            
        except Exception as e:
            return {"error": str(e)}
    
    def _get_topic_for_connection(self, connection: PIPConnection) -> str:
        """Get OPAL topic name for a connection"""
        connection_type = connection.connection_type.value
        connection_name = connection.name.lower().replace(' ', '_').replace('-', '_')
        return f"pip_{connection_type}_{connection_name}"
    
    def get_opal_topics_for_connection(self, connection_id: int, db: Session) -> List[str]:
        """Get list of OPAL topics for a connection"""
        connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            return []
        
        return [self._get_topic_for_connection(connection)]
    
    async def get_pip_data_for_opal_endpoint(
        self,
        connection_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """
        Format PIP data for OPAL endpoint consumption
        This endpoint is called by OPAL to fetch data
        
        Returns:
            Formatted data ready for OPA ingestion
        """
        try:
            connection = db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
            if not connection:
                return {"error": "Connection not found"}
            
            # Get mapped attributes
            mappings = db.query(AttributeMapping).filter(
                AttributeMapping.connection_id == connection_id
            ).all()
            
            # Get cached data from cache service
            from app.services.pip_cache_service import get_cache_service
            cache_service = get_cache_service()
            cached_data = await cache_service.get_all_cached_data(connection_id)
            
            # Build mapped data structure
            mapped_data = {}
            for mapping in mappings:
                source_field = mapping.source_attribute
                target_field = mapping.target_attribute
                
                # Get value from cache or set to null
                if source_field in cached_data:
                    value = cached_data[source_field]
                    
                    # Apply transformation if defined
                    if mapping.transformation_rule:
                        value = self._apply_transformation(value, mapping.transformation_rule)
                    
                    mapped_data[target_field] = value
            
            # Format for OPA
            connection_name = connection.name.lower().replace(' ', '_').replace('-', '_')
            
            return {
                connection_name: {
                    "metadata": {
                        "connection_id": connection_id,
                        "connection_type": connection.connection_type.value,
                        "provider": connection.provider,
                        "last_sync": connection.last_sync.isoformat() if connection.last_sync else None,
                        "health_status": connection.health_status
                    },
                    "attributes": mapped_data
                }
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def _apply_transformation(self, value: Any, transformation_rule: Dict[str, Any]) -> Any:
        """Apply transformation rule to a value"""
        try:
            transform_type = transformation_rule.get("type")
            
            if transform_type == "lowercase":
                return str(value).lower()
            elif transform_type == "uppercase":
                return str(value).upper()
            elif transform_type == "trim":
                return str(value).strip()
            elif transform_type == "split":
                delimiter = transformation_rule.get("delimiter", ",")
                return str(value).split(delimiter)
            elif transform_type == "json_extract":
                path = transformation_rule.get("path", "")
                if isinstance(value, dict):
                    keys = path.split(".")
                    result = value
                    for key in keys:
                        if isinstance(result, dict):
                            result = result.get(key)
                    return result
            
            return value
        except:
            return value


# Global instance
_formatter = None

def get_formatter() -> PIPDataFormatter:
    """Get global formatter instance"""
    global _formatter
    if _formatter is None:
        _formatter = PIPDataFormatter()
    return _formatter

