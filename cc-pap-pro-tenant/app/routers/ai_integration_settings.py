"""
AI Integration Settings API Router for PAP Pro Tenant
Handles customer LLM service connections and AI-enhanced features for multi-tenant environment
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

from app.database import get_db
from app.services.ai_integration_service import (
    TenantAIIntegrationService, AIConfiguration, AIRequest, AIResponse,
    LLMProvider, AIUseCase, ComplianceFramework
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Request/Response Models
class AIConfigurationRequest(BaseModel):
    config_id: str
    provider: LLMProvider
    api_key: str
    base_url: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = 4000
    temperature: Optional[float] = 0.1
    enabled_use_cases: List[AIUseCase] = []
    cost_limits: Optional[Dict[str, Any]] = None

class RegoEditorRequest(BaseModel):
    code: str
    cursor_position: int
    config_id: str = "default"

class PolicyWizardRequest(BaseModel):
    requirements: Dict[str, Any]
    config_id: str = "default"

class ConflictAnalysisRequest(BaseModel):
    policies: List[Dict[str, Any]]
    config_id: str = "default"

class ComplianceAnalysisRequest(BaseModel):
    resource_info: Dict[str, Any]
    frameworks: List[ComplianceFramework]
    config_id: str = "default"

class PIPSuggestionsRequest(BaseModel):
    pip_sources: List[Dict[str, Any]]
    context: Dict[str, Any]
    config_id: str = "default"

class AIResponseModel(BaseModel):
    success: bool
    content: str
    suggestions: List[str] = []
    confidence: float = 0.0
    cost: float = 0.0
    usage: Dict[str, Any] = {}
    error: Optional[str] = None

@router.post("/configure")
async def configure_ai_service(request: AIConfigurationRequest, db: Session = Depends(get_db)):
    """
    Configure an AI service for Control Core (tenant-specific)
    """
    try:
        # Get tenant ID from request context (in real implementation)
        tenant_id = "demo-tenant"  # This would come from authentication
        
        logger.info(f"AI_INTEGRATION: Configuring AI service {request.config_id} for tenant {tenant_id} with provider {request.provider}")
        
        # Create AI configuration
        config = AIConfiguration(
            tenant_id=tenant_id,
            provider=request.provider,
            api_key=request.api_key,
            base_url=request.base_url,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            enabled_use_cases=request.enabled_use_cases,
            cost_limits=request.cost_limits or {}
        )
        
        # Initialize AI service
        ai_service = TenantAIIntegrationService(db)
        
        # Configure the service
        success = await ai_service.configure_ai_service(tenant_id, request.config_id, config)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to configure AI service. Please check your credentials and settings."
            )
        
        return {
            "success": True,
            "message": f"AI service {request.config_id} configured successfully for tenant {tenant_id}",
            "config_id": request.config_id,
            "provider": request.provider.value,
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        logger.error(f"AI_INTEGRATION: Configuration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to configure AI service: {str(e)}"
        )

@router.get("/configurations")
async def list_ai_configurations(db: Session = Depends(get_db)):
    """
    List all configured AI services for the tenant
    """
    try:
        tenant_id = "demo-tenant"  # This would come from authentication
        
        # Mock configurations for demonstration
        configurations = [
            {
                "config_id": f"{tenant_id}-openai-primary",
                "provider": "openai",
                "model": "gpt-4",
                "is_enabled": True,
                "enabled_use_cases": ["rego_editor", "policy_wizard"],
                "last_used": "2024-01-15T10:30:00Z",
                "usage_stats": {
                    "total_requests": 1250,
                    "total_tokens": 45000,
                    "total_cost": 12.50,
                    "requests_by_use_case": {
                        "rego_editor": 800,
                        "policy_wizard": 450
                    }
                }
            }
        ]
        
        return {
            "success": True,
            "configurations": configurations,
            "count": len(configurations),
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        logger.error(f"AI_INTEGRATION: Failed to list configurations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list AI configurations: {str(e)}"
        )

@router.post("/rego-suggestions", response_model=AIResponseModel)
async def get_rego_suggestions(request: RegoEditorRequest, db: Session = Depends(get_db)):
    """
    Get AI-powered suggestions for Rego code editor (tenant-specific)
    """
    try:
        tenant_id = "demo-tenant"  # This would come from authentication
        
        logger.info(f"AI_INTEGRATION: Getting Rego suggestions for tenant {tenant_id}, config {request.config_id}")
        
        ai_service = TenantAIIntegrationService(db)
        response = await ai_service.get_rego_suggestions(
            tenant_id,
            request.code, 
            request.cursor_position, 
            request.config_id
        )
        
        return AIResponseModel(
            success=True,
            content=response.content,
            suggestions=response.suggestions,
            confidence=response.confidence,
            cost=response.cost,
            usage=response.usage
        )
        
    except Exception as e:
        logger.error(f"AI_INTEGRATION: Failed to get Rego suggestions: {e}")
        return AIResponseModel(
            success=False,
            content="",
            error=f"Failed to get Rego suggestions: {str(e)}"
        )

@router.post("/policy-wizard-suggestions", response_model=AIResponseModel)
async def get_policy_wizard_suggestions(request: PolicyWizardRequest, db: Session = Depends(get_db)):
    """
    Get AI-powered suggestions for policy wizard (tenant-specific)
    """
    try:
        tenant_id = "demo-tenant"  # This would come from authentication
        
        logger.info(f"AI_INTEGRATION: Getting policy wizard suggestions for tenant {tenant_id}, config {request.config_id}")
        
        ai_service = TenantAIIntegrationService(db)
        response = await ai_service.get_policy_wizard_suggestions(
            tenant_id,
            request.requirements,
            request.config_id
        )
        
        return AIResponseModel(
            success=True,
            content=response.content,
            suggestions=response.suggestions,
            confidence=response.confidence,
            cost=response.cost,
            usage=response.usage
        )
        
    except Exception as e:
        logger.error(f"AI_INTEGRATION: Failed to get policy wizard suggestions: {e}")
        return AIResponseModel(
            success=False,
            content="",
            error=f"Failed to get policy wizard suggestions: {str(e)}"
        )

@router.post("/analyze-conflicts", response_model=AIResponseModel)
async def analyze_policy_conflicts(request: ConflictAnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyze policies for conflicts using AI (tenant-specific)
    """
    try:
        tenant_id = "demo-tenant"  # This would come from authentication
        
        logger.info(f"AI_INTEGRATION: Analyzing policy conflicts for tenant {tenant_id}, config {request.config_id}")
        
        ai_service = TenantAIIntegrationService(db)
        response = await ai_service.analyze_policy_conflicts(
            tenant_id,
            request.policies,
            request.config_id
        )
        
        return AIResponseModel(
            success=True,
            content=response.content,
            suggestions=response.suggestions,
            confidence=response.confidence,
            cost=response.cost,
            usage=response.usage
        )
        
    except Exception as e:
        logger.error(f"AI_INTEGRATION: Failed to analyze policy conflicts: {e}")
        return AIResponseModel(
            success=False,
            content="",
            error=f"Failed to analyze policy conflicts: {str(e)}"
        )

@router.post("/compliance-suggestions", response_model=AIResponseModel)
async def get_compliance_suggestions(request: ComplianceAnalysisRequest, db: Session = Depends(get_db)):
    """
    Get compliance framework suggestions using AI (tenant-specific)
    """
    try:
        tenant_id = "demo-tenant"  # This would come from authentication
        
        logger.info(f"AI_INTEGRATION: Getting compliance suggestions for tenant {tenant_id}, config {request.config_id}")
        
        ai_service = TenantAIIntegrationService(db)
        response = await ai_service.get_compliance_suggestions(
            tenant_id,
            request.resource_info,
            request.frameworks,
            request.config_id
        )
        
        return AIResponseModel(
            success=True,
            content=response.content,
            suggestions=response.suggestions,
            confidence=response.confidence,
            cost=response.cost,
            usage=response.usage
        )
        
    except Exception as e:
        logger.error(f"AI_INTEGRATION: Failed to get compliance suggestions: {e}")
        return AIResponseModel(
            success=False,
            content="",
            error=f"Failed to get compliance suggestions: {str(e)}"
        )

@router.post("/pip-suggestions", response_model=AIResponseModel)
async def get_pip_suggestions(request: PIPSuggestionsRequest, db: Session = Depends(get_db)):
    """
    Get PIP attribute and parameter suggestions using AI (tenant-specific)
    """
    try:
        tenant_id = "demo-tenant"  # This would come from authentication
        
        logger.info(f"AI_INTEGRATION: Getting PIP suggestions for tenant {tenant_id}, config {request.config_id}")
        
        ai_service = TenantAIIntegrationService(db)
        response = await ai_service.get_pip_suggestions(
            tenant_id,
            request.pip_sources,
            request.context,
            request.config_id
        )
        
        return AIResponseModel(
            success=True,
            content=response.content,
            suggestions=response.suggestions,
            confidence=response.confidence,
            cost=response.cost,
            usage=response.usage
        )
        
    except Exception as e:
        logger.error(f"AI_INTEGRATION: Failed to get PIP suggestions: {e}")
        return AIResponseModel(
            success=False,
            content="",
            error=f"Failed to get PIP suggestions: {str(e)}"
        )

@router.get("/usage-stats")
async def get_usage_stats(config_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Get AI service usage statistics for the tenant
    """
    try:
        tenant_id = "demo-tenant"  # This would come from authentication
        
        ai_service = TenantAIIntegrationService(db)
        stats = ai_service.get_usage_stats(tenant_id, config_id)
        
        return {
            "success": True,
            "usage_stats": stats,
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        logger.error(f"AI_INTEGRATION: Failed to get usage stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get usage stats: {str(e)}"
        )

@router.get("/providers")
async def get_supported_providers(db: Session = Depends(get_db)):
    """
    Get list of supported LLM providers
    """
    providers = [
        {
            "id": provider.value,
            "name": provider.value.replace("_", " ").title(),
            "description": f"Connect to {provider.value.replace('_', ' ').title()} API"
        } for provider in LLMProvider
    ]
    
    return {
        "success": True,
        "providers": providers,
        "count": len(providers)
    }

@router.get("/use-cases")
async def get_supported_use_cases(db: Session = Depends(get_db)):
    """
    Get list of supported AI use cases
    """
    use_cases = [
        {
            "id": use_case.value,
            "name": use_case.value.replace("_", " ").title(),
            "description": f"AI assistance for {use_case.value.replace('_', ' ')}"
        } for use_case in AIUseCase
    ]
    
    return {
        "success": True,
        "use_cases": use_cases,
        "count": len(use_cases)
    }

@router.get("/compliance-frameworks")
async def get_supported_frameworks(db: Session = Depends(get_db)):
    """
    Get list of supported compliance frameworks
    """
    frameworks = [
        {
            "id": framework.value,
            "name": framework.value.upper(),
            "description": f"Compliance with {framework.value.upper()} requirements"
        } for framework in ComplianceFramework
    ]
    
    return {
        "success": True,
        "frameworks": frameworks,
        "count": len(frameworks)
    }

@router.delete("/configurations/{config_id}")
async def delete_ai_configuration(config_id: str, db: Session = Depends(get_db)):
    """
    Delete an AI configuration for the tenant
    """
    try:
        tenant_id = "demo-tenant"  # This would come from authentication
        
        # In real implementation, this would delete from database
        logger.info(f"AI_INTEGRATION: Deleting AI configuration {config_id} for tenant {tenant_id}")
        
        return {
            "success": True,
            "message": f"AI configuration {config_id} deleted successfully for tenant {tenant_id}",
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        logger.error(f"AI_INTEGRATION: Failed to delete configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete AI configuration: {str(e)}"
        )

@router.post("/test-configuration")
async def test_ai_configuration(request: AIConfigurationRequest, db: Session = Depends(get_db)):
    """
    Test an AI configuration without saving it (tenant-specific)
    """
    try:
        tenant_id = "demo-tenant"  # This would come from authentication
        
        logger.info(f"AI_INTEGRATION: Testing AI configuration for tenant {tenant_id}, provider {request.provider}")
        
        # Create temporary configuration
        config = AIConfiguration(
            tenant_id=tenant_id,
            provider=request.provider,
            api_key=request.api_key,
            base_url=request.base_url,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            enabled_use_cases=request.enabled_use_cases,
            cost_limits=request.cost_limits or {}
        )
        
        # Initialize AI service
        ai_service = TenantAIIntegrationService(db)
        
        # Test the configuration
        test_success = await ai_service._test_ai_configuration(config)
        
        return {
            "success": test_success,
            "message": "AI configuration test successful" if test_success else "AI configuration test failed",
            "provider": request.provider.value,
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        logger.error(f"AI_INTEGRATION: Configuration test failed: {e}")
        return {
            "success": False,
            "message": f"AI configuration test failed: {str(e)}",
            "provider": request.provider.value,
            "tenant_id": tenant_id
        }
