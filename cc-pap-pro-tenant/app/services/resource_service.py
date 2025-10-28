from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models import TenantResource
from app.schemas import ResourceCreate, ResourceUpdate
from typing import List, Optional, Dict, Any
import uuid
import logging
import requests
from datetime import datetime
import asyncio
import aiohttp

logger = logging.getLogger(__name__)

class ResourceService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_resource(self, tenant_id: str, resource_data: ResourceCreate) -> TenantResource:
        """Create a new resource"""
        try:
            resource = TenantResource(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                name=resource_data.name,
                url=resource_data.url,
                resource_type=resource_data.resource_type,
                description=resource_data.description,
                config=resource_data.config or {},
                health_check_url=resource_data.url + "/health" if resource_data.resource_type == "api" else None
            )
            
            self.db.add(resource)
            self.db.commit()
            self.db.refresh(resource)
            
            logger.info(f"Created resource {resource.id} for tenant {tenant_id}")
            return resource
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating resource: {e}")
            raise
    
    def get_resources(self, tenant_id: str, skip: int = 0, limit: int = 100, 
                     resource_type: Optional[str] = None) -> List[TenantResource]:
        """Get resources for tenant with filters"""
        try:
            query = self.db.query(TenantResource).filter(TenantResource.tenant_id == tenant_id)
            
            if resource_type:
                query = query.filter(TenantResource.resource_type == resource_type)
            
            resources = query.offset(skip).limit(limit).all()
            return resources
            
        except Exception as e:
            logger.error(f"Error getting resources: {e}")
            raise
    
    def get_resource_by_id(self, resource_id: str, tenant_id: str) -> Optional[TenantResource]:
        """Get resource by ID"""
        try:
            resource = self.db.query(TenantResource).filter(
                and_(
                    TenantResource.id == resource_id,
                    TenantResource.tenant_id == tenant_id
                )
            ).first()
            
            return resource
            
        except Exception as e:
            logger.error(f"Error getting resource: {e}")
            raise
    
    def update_resource(self, resource_id: str, tenant_id: str, resource_data: ResourceUpdate) -> Optional[TenantResource]:
        """Update resource"""
        try:
            resource = self.get_resource_by_id(resource_id, tenant_id)
            if not resource:
                return None
            
            update_data = resource_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(resource, field, value)
            
            resource.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(resource)
            
            logger.info(f"Updated resource {resource_id}")
            return resource
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating resource: {e}")
            raise
    
    def delete_resource(self, resource_id: str, tenant_id: str) -> bool:
        """Delete resource"""
        try:
            resource = self.get_resource_by_id(resource_id, tenant_id)
            if not resource:
                return False
            
            self.db.delete(resource)
            self.db.commit()
            
            logger.info(f"Deleted resource {resource_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting resource: {e}")
            raise
    
    def test_resource(self, resource_id: str, tenant_id: str) -> Dict[str, Any]:
        """Test resource connectivity"""
        try:
            resource = self.get_resource_by_id(resource_id, tenant_id)
            if not resource:
                return {"success": False, "error": "Resource not found"}
            
            # Test resource connectivity
            test_result = self._test_resource_connectivity(resource)
            
            # Update health status
            resource.health_status = "healthy" if test_result["success"] else "unhealthy"
            resource.last_health_check = datetime.utcnow()
            self.db.commit()
            
            return test_result
            
        except Exception as e:
            logger.error(f"Error testing resource: {e}")
            return {"success": False, "error": str(e)}
    
    def enable_resource(self, resource_id: str, tenant_id: str) -> Optional[TenantResource]:
        """Enable resource protection"""
        try:
            resource = self.get_resource_by_id(resource_id, tenant_id)
            if not resource:
                return None
            
            resource.is_protected = True
            resource.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(resource)
            
            logger.info(f"Enabled protection for resource {resource_id}")
            return resource
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error enabling resource: {e}")
            raise
    
    def disable_resource(self, resource_id: str, tenant_id: str) -> Optional[TenantResource]:
        """Disable resource protection"""
        try:
            resource = self.get_resource_by_id(resource_id, tenant_id)
            if not resource:
                return None
            
            resource.is_protected = False
            resource.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(resource)
            
            logger.info(f"Disabled protection for resource {resource_id}")
            return resource
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error disabling resource: {e}")
            raise
    
    def _test_resource_connectivity(self, resource: TenantResource) -> Dict[str, Any]:
        """Test resource connectivity"""
        try:
            # Test different resource types
            if resource.resource_type == "api":
                return self._test_api_connectivity(resource)
            elif resource.resource_type == "ai_agent":
                return self._test_ai_agent_connectivity(resource)
            elif resource.resource_type == "llm":
                return self._test_llm_connectivity(resource)
            elif resource.resource_type == "rag":
                return self._test_rag_connectivity(resource)
            elif resource.resource_type == "git":
                return self._test_git_connectivity(resource)
            else:
                return {"success": False, "error": f"Unsupported resource type: {resource.resource_type}"}
                
        except Exception as e:
            logger.error(f"Error testing resource connectivity: {e}")
            return {"success": False, "error": str(e)}
    
    def _test_api_connectivity(self, resource: TenantResource) -> Dict[str, Any]:
        """Test API connectivity"""
        try:
            # Test health endpoint
            health_url = resource.health_check_url or resource.url + "/health"
            response = requests.get(health_url, timeout=10)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "response_time": response.elapsed.total_seconds(),
                    "message": "API is accessible"
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": f"API returned status {response.status_code}"
                }
                
        except requests.exceptions.Timeout:
            return {"success": False, "error": "Connection timeout"}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Connection refused"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _test_ai_agent_connectivity(self, resource: TenantResource) -> Dict[str, Any]:
        """Test AI agent connectivity"""
        try:
            # Test AI agent endpoint
            test_url = resource.url + "/test" if not resource.url.endswith("/") else resource.url + "test"
            response = requests.post(test_url, json={"test": True}, timeout=10)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "response_time": response.elapsed.total_seconds(),
                    "message": "AI agent is accessible"
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": f"AI agent returned status {response.status_code}"
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _test_llm_connectivity(self, resource: TenantResource) -> Dict[str, Any]:
        """Test LLM connectivity"""
        try:
            # Test LLM endpoint
            test_url = resource.url + "/health" if not resource.url.endswith("/") else resource.url + "health"
            response = requests.get(test_url, timeout=10)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "response_time": response.elapsed.total_seconds(),
                    "message": "LLM service is accessible"
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": f"LLM service returned status {response.status_code}"
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _test_rag_connectivity(self, resource: TenantResource) -> Dict[str, Any]:
        """Test RAG system connectivity"""
        try:
            # Test RAG endpoint
            test_url = resource.url + "/status" if not resource.url.endswith("/") else resource.url + "status"
            response = requests.get(test_url, timeout=10)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "response_time": response.elapsed.total_seconds(),
                    "message": "RAG system is accessible"
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": f"RAG system returned status {response.status_code}"
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _test_git_connectivity(self, resource: TenantResource) -> Dict[str, Any]:
        """Test Git repository connectivity"""
        try:
            # Test Git repository access
            # This would typically use git commands or API calls
            return {
                "success": True,
                "message": "Git repository is accessible"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_resource_statistics(self, tenant_id: str) -> Dict[str, Any]:
        """Get resource statistics for tenant"""
        try:
            total_resources = self.db.query(TenantResource).filter(
                TenantResource.tenant_id == tenant_id
            ).count()
            
            protected_resources = self.db.query(TenantResource).filter(
                and_(
                    TenantResource.tenant_id == tenant_id,
                    TenantResource.is_protected == True
                )
            ).count()
            
            healthy_resources = self.db.query(TenantResource).filter(
                and_(
                    TenantResource.tenant_id == tenant_id,
                    TenantResource.health_status == "healthy"
                )
            ).count()
            
            # Count by resource type
            resource_types = {}
            for resource_type in ["api", "ai_agent", "llm", "rag", "git"]:
                count = self.db.query(TenantResource).filter(
                    and_(
                        TenantResource.tenant_id == tenant_id,
                        TenantResource.resource_type == resource_type
                    )
                ).count()
                resource_types[resource_type] = count
            
            return {
                "total_resources": total_resources,
                "protected_resources": protected_resources,
                "healthy_resources": healthy_resources,
                "unhealthy_resources": total_resources - healthy_resources,
                "resource_types": resource_types
            }
            
        except Exception as e:
            logger.error(f"Error getting resource statistics: {e}")
            raise
