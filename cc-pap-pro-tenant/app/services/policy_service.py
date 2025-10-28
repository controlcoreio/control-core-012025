from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models import TenantPolicy
from app.schemas import PolicyCreate, PolicyUpdate
from typing import List, Optional, Dict, Any
import uuid
import logging
from datetime import datetime
import re

logger = logging.getLogger(__name__)

class PolicyService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_policy(self, tenant_id: str, policy_data: PolicyCreate, created_by: str) -> TenantPolicy:
        """Create a new policy"""
        try:
            # Validate policy content
            validation_result = self._validate_policy_content(policy_data.policy_content)
            if not validation_result["valid"]:
                raise ValueError(f"Invalid policy content: {validation_result['error']}")
            
            policy = TenantPolicy(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                name=policy_data.name,
                description=policy_data.description,
                policy_content=policy_data.policy_content,
                status="draft",
                version="1.0.0",
                created_by=created_by,
                category=policy_data.category,
                tags=policy_data.tags or []
            )
            
            self.db.add(policy)
            self.db.commit()
            self.db.refresh(policy)
            
            logger.info(f"Created policy {policy.id} for tenant {tenant_id}")
            return policy
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating policy: {e}")
            raise
    
    def get_policies(self, tenant_id: str, skip: int = 0, limit: int = 100, 
                    status: Optional[str] = None, category: Optional[str] = None) -> List[TenantPolicy]:
        """Get policies for tenant with filters"""
        try:
            query = self.db.query(TenantPolicy).filter(TenantPolicy.tenant_id == tenant_id)
            
            if status:
                query = query.filter(TenantPolicy.status == status)
            
            if category:
                query = query.filter(TenantPolicy.category == category)
            
            policies = query.offset(skip).limit(limit).all()
            return policies
            
        except Exception as e:
            logger.error(f"Error getting policies: {e}")
            raise
    
    def get_policy_by_id(self, policy_id: str, tenant_id: str) -> Optional[TenantPolicy]:
        """Get policy by ID"""
        try:
            policy = self.db.query(TenantPolicy).filter(
                and_(
                    TenantPolicy.id == policy_id,
                    TenantPolicy.tenant_id == tenant_id
                )
            ).first()
            
            return policy
            
        except Exception as e:
            logger.error(f"Error getting policy: {e}")
            raise
    
    def update_policy(self, policy_id: str, tenant_id: str, policy_data: PolicyUpdate) -> Optional[TenantPolicy]:
        """Update policy"""
        try:
            policy = self.get_policy_by_id(policy_id, tenant_id)
            if not policy:
                return None
            
            update_data = policy_data.dict(exclude_unset=True)
            
            # Validate policy content if being updated
            if "policy_content" in update_data:
                validation_result = self._validate_policy_content(update_data["policy_content"])
                if not validation_result["valid"]:
                    raise ValueError(f"Invalid policy content: {validation_result['error']}")
                
                # Increment version if content changed
                version_parts = policy.version.split(".")
                version_parts[-1] = str(int(version_parts[-1]) + 1)
                update_data["version"] = ".".join(version_parts)
            
            for field, value in update_data.items():
                setattr(policy, field, value)
            
            policy.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(policy)
            
            logger.info(f"Updated policy {policy_id}")
            return policy
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating policy: {e}")
            raise
    
    def delete_policy(self, policy_id: str, tenant_id: str) -> bool:
        """Delete policy"""
        try:
            policy = self.get_policy_by_id(policy_id, tenant_id)
            if not policy:
                return False
            
            self.db.delete(policy)
            self.db.commit()
            
            logger.info(f"Deleted policy {policy_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting policy: {e}")
            raise
    
    def activate_policy(self, policy_id: str, tenant_id: str) -> Optional[TenantPolicy]:
        """Activate policy"""
        try:
            policy = self.get_policy_by_id(policy_id, tenant_id)
            if not policy:
                return None
            
            # Validate policy before activation
            validation_result = self._validate_policy_content(policy.policy_content)
            if not validation_result["valid"]:
                raise ValueError(f"Cannot activate invalid policy: {validation_result['error']}")
            
            policy.status = "active"
            policy.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(policy)
            
            logger.info(f"Activated policy {policy_id}")
            return policy
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error activating policy: {e}")
            raise
    
    def deactivate_policy(self, policy_id: str, tenant_id: str) -> Optional[TenantPolicy]:
        """Deactivate policy"""
        try:
            policy = self.get_policy_by_id(policy_id, tenant_id)
            if not policy:
                return None
            
            policy.status = "inactive"
            policy.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(policy)
            
            logger.info(f"Deactivated policy {policy_id}")
            return policy
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deactivating policy: {e}")
            raise
    
    def validate_policy(self, policy_id: str, tenant_id: str) -> Dict[str, Any]:
        """Validate policy syntax and logic"""
        try:
            policy = self.get_policy_by_id(policy_id, tenant_id)
            if not policy:
                return {"valid": False, "error": "Policy not found"}
            
            validation_result = self._validate_policy_content(policy.policy_content)
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating policy: {e}")
            return {"valid": False, "error": str(e)}
    
    def get_policy_versions(self, policy_id: str, tenant_id: str) -> List[Dict[str, Any]]:
        """Get policy version history"""
        try:
            # In a real implementation, this would query a versions table
            # For now, return mock data
            policy = self.get_policy_by_id(policy_id, tenant_id)
            if not policy:
                return []
            
            return [
                {
                    "version": policy.version,
                    "status": policy.status,
                    "created_at": policy.created_at,
                    "updated_at": policy.updated_at,
                    "created_by": policy.created_by
                }
            ]
            
        except Exception as e:
            logger.error(f"Error getting policy versions: {e}")
            raise
    
    def _validate_policy_content(self, content: str) -> Dict[str, Any]:
        """Validate Rego policy content"""
        try:
            # Basic Rego syntax validation
            if not content.strip():
                return {"valid": False, "error": "Policy content is empty"}
            
            # Check for required Rego keywords
            required_keywords = ["package", "allow"]
            for keyword in required_keywords:
                if keyword not in content:
                    return {"valid": False, "error": f"Missing required keyword: {keyword}"}
            
            # Check for basic syntax errors
            if "{" not in content or "}" not in content:
                return {"valid": False, "error": "Invalid syntax: missing braces"}
            
            # Check for balanced braces
            brace_count = 0
            for char in content:
                if char == "{":
                    brace_count += 1
                elif char == "}":
                    brace_count -= 1
                    if brace_count < 0:
                        return {"valid": False, "error": "Unbalanced braces"}
            
            if brace_count != 0:
                return {"valid": False, "error": "Unbalanced braces"}
            
            # Check for common Rego patterns
            if not re.search(r'allow\s*\{', content):
                return {"valid": False, "error": "Missing allow rule"}
            
            return {"valid": True, "error": None}
            
        except Exception as e:
            logger.error(f"Error validating policy content: {e}")
            return {"valid": False, "error": str(e)}
    
    def get_policy_statistics(self, tenant_id: str) -> Dict[str, Any]:
        """Get policy statistics for tenant"""
        try:
            total_policies = self.db.query(TenantPolicy).filter(
                TenantPolicy.tenant_id == tenant_id
            ).count()
            
            active_policies = self.db.query(TenantPolicy).filter(
                and_(
                    TenantPolicy.tenant_id == tenant_id,
                    TenantPolicy.status == "active"
                )
            ).count()
            
            draft_policies = self.db.query(TenantPolicy).filter(
                and_(
                    TenantPolicy.tenant_id == tenant_id,
                    TenantPolicy.status == "draft"
                )
            ).count()
            
            return {
                "total_policies": total_policies,
                "active_policies": active_policies,
                "draft_policies": draft_policies,
                "inactive_policies": total_policies - active_policies - draft_policies
            }
            
        except Exception as e:
            logger.error(f"Error getting policy statistics: {e}")
            raise
