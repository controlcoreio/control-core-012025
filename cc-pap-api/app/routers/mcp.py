"""
MCP Detection and Policy Generation API Router
Handles MCP server detection, analysis, and smart policy generation
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

from app.database import get_db
from app.services.mcp_detection_service import MCPDetectionService
from app.services.mcp_policy_generator import MCPPolicyGenerator

# Define PolicyRequirements locally
class PolicyRequirements(BaseModel):
    """Requirements for generating MCP policies"""
    security_level: str = "standard"
    allowed_operations: List[str] = []
    denied_operations: List[str] = []
    require_authentication: bool = True
    rate_limiting: Optional[Dict[str, Any]] = None

router = APIRouter()
logger = logging.getLogger(__name__)

# Request/Response Models
class MCPDetectionRequest(BaseModel):
    resource_url: str

class MCPAnalysisRequest(BaseModel):
    resource_url: str

class MCPPolicyGenerationRequest(BaseModel):
    server_id: str
    requirements: PolicyRequirements

class MCPDetectionResponse(BaseModel):
    success: bool
    message: str
    server: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class MCPAnalysisResponse(BaseModel):
    success: bool
    message: str
    analysis: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class MCPPolicyResponse(BaseModel):
    success: bool
    message: str
    policy: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Initialize services
mcp_detector = MCPDetectionService()
mcp_policy_gen = MCPPolicyGenerator()

@router.post("/detect", response_model=MCPDetectionResponse)
async def detect_mcp_server(request: MCPDetectionRequest, db: Session = Depends(get_db)):
    """
    Detect if a resource is an MCP server and analyze its capabilities
    """
    try:
        logger.info(f"MCP_API: Detecting MCP server at {request.resource_url}")
        
        # Detect MCP server
        server = await mcp_detector.detect_mcp_server(request.resource_url)
        
        if not server:
            return MCPDetectionResponse(
                success=False,
                message="MCP server not detected",
                error="No MCP server found at the provided URL"
            )
        
        # Convert server to dict for response
        server_dict = {
            "id": server.id,
            "name": server.name,
            "description": server.description,
            "url": server.url,
            "version": server.version,
            "status": server.status,
            "last_checked": server.last_checked.isoformat(),
            "capabilities": [{"type": cap.type, "description": cap.description} for cap in server.capabilities],
            "tools": server.tools,
            "resources": server.resources,
            "metadata": server.metadata
        }
        
        return MCPDetectionResponse(
            success=True,
            message="MCP server detected successfully",
            server=server_dict
        )
        
    except Exception as e:
        logger.error(f"MCP_API: Detection failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to detect MCP server: {str(e)}"
        )

@router.post("/analyze", response_model=MCPAnalysisResponse)
async def analyze_mcp_server(request: MCPAnalysisRequest, db: Session = Depends(get_db)):
    """
    Comprehensive analysis of an MCP server for policy generation
    """
    try:
        logger.info(f"MCP_API: Analyzing MCP server at {request.resource_url}")
        
        # Analyze MCP server
        analysis = await mcp_detector.analyze_mcp_server(request.resource_url)
        
        if "error" in analysis:
            return MCPAnalysisResponse(
                success=False,
                message="MCP server analysis failed",
                error=analysis["error"]
            )
        
        return MCPAnalysisResponse(
            success=True,
            message="MCP server analysis completed",
            analysis=analysis
        )
        
    except Exception as e:
        logger.error(f"MCP_API: Analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze MCP server: {str(e)}"
        )

@router.post("/generate-policy", response_model=MCPPolicyResponse)
async def generate_mcp_policy(request: MCPPolicyGenerationRequest, db: Session = Depends(get_db)):
    """
    Generate a smart policy for an MCP server based on its capabilities
    """
    try:
        logger.info(f"MCP_API: Generating policy for MCP server {request.server_id}")
        
        # In a real implementation, you would fetch the server data from the database
        # For now, we'll use mock data
        server_data = {
            "id": request.server_id,
            "name": "Example MCP Server",
            "description": "An example MCP server",
            "url": "https://example.com/mcp",
            "tools": [
                {
                    "name": "search_tool",
                    "description": "Search functionality",
                    "category": "search",
                    "tags": ["search", "query"]
                },
                {
                    "name": "analyze_tool", 
                    "description": "Analysis functionality",
                    "category": "analysis",
                    "tags": ["analysis", "data"]
                }
            ],
            "resources": [
                {
                    "uri": "mcp://example.com/documents",
                    "name": "Documents",
                    "description": "Document resources",
                    "mime_type": "application/json"
                }
            ]
        }
        
        # Generate policy
        policy = mcp_policy_gen.generate_policy_for_mcp_server(server_data, request.requirements)
        
        # Convert policy to dict for response
        policy_dict = {
            "id": policy.id,
            "name": policy.name,
            "description": policy.description,
            "category": policy.category,
            "template": policy.template,
            "variables": [
                {
                    "name": var.name,
                    "type": var.type,
                    "description": var.description,
                    "required": var.required,
                    "default": var.default,
                    "options": var.options
                } for var in policy.variables
            ],
            "conditions": [
                {
                    "id": cond.id,
                    "name": cond.name,
                    "description": cond.description,
                    "type": cond.type,
                    "expression": cond.expression,
                    "examples": cond.examples
                } for cond in policy.conditions
            ],
            "metadata": policy.metadata
        }
        
        return MCPPolicyResponse(
            success=True,
            message="Policy generated successfully",
            policy=policy_dict
        )
        
    except Exception as e:
        logger.error(f"MCP_API: Policy generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate policy: {str(e)}"
        )

@router.get("/templates")
async def get_mcp_templates(db: Session = Depends(get_db)):
    """
    Get available MCP policy templates
    """
    try:
        logger.info("MCP_API: Fetching MCP policy templates")
        
        templates = mcp_policy_gen.get_mcp_policy_templates()
        
        templates_dict = [
            {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "category": template.category,
                "template": template.template,
                "variables": [
                    {
                        "name": var.name,
                        "type": var.type,
                        "description": var.description,
                        "required": var.required,
                        "default": var.default,
                        "options": var.options
                    } for var in template.variables
                ],
                "conditions": [
                    {
                        "id": cond.id,
                        "name": cond.name,
                        "description": cond.description,
                        "type": cond.type,
                        "expression": cond.expression,
                        "examples": cond.examples
                    } for cond in template.conditions
                ],
                "metadata": template.template_metadata
            } for template in templates
        ]
        
        return {
            "success": True,
            "message": "MCP policy templates retrieved successfully",
            "templates": templates_dict,
            "count": len(templates_dict)
        }
        
    except Exception as e:
        logger.error(f"MCP_API: Failed to get templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get MCP templates: {str(e)}"
        )

@router.get("/servers")
async def list_mcp_servers(db: Session = Depends(get_db)):
    """
    List detected MCP servers
    """
    try:
        logger.info("MCP_API: Listing MCP servers")
        
        # In a real implementation, this would fetch from the database
        servers = [
            {
                "id": "mcp-example-server",
                "name": "Example MCP Server",
                "url": "https://example.com/mcp",
                "status": "active",
                "tools_count": 5,
                "resources_count": 3,
                "last_checked": "2024-01-20T12:00:00Z"
            }
        ]
        
        return {
            "success": True,
            "message": "MCP servers retrieved successfully",
            "servers": servers,
            "count": len(servers)
        }
        
    except Exception as e:
        logger.error(f"MCP_API: Failed to list servers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list MCP servers: {str(e)}"
        )

@router.get("/servers/{server_id}")
async def get_mcp_server(server_id: str, db: Session = Depends(get_db)):
    """
    Get details of a specific MCP server
    """
    try:
        logger.info(f"MCP_API: Getting MCP server {server_id}")
        
        # In a real implementation, this would fetch from the database
        server = {
            "id": server_id,
            "name": "Example MCP Server",
            "description": "An example MCP server with various tools and resources",
            "url": "https://example.com/mcp",
            "status": "active",
            "version": "1.0",
            "tools": [
                {
                    "name": "search_tool",
                    "description": "Search functionality",
                    "category": "search",
                    "tags": ["search", "query"]
                },
                {
                    "name": "analyze_tool",
                    "description": "Analysis functionality", 
                    "category": "analysis",
                    "tags": ["analysis", "data"]
                }
            ],
            "resources": [
                {
                    "uri": "mcp://example.com/documents",
                    "name": "Documents",
                    "description": "Document resources",
                    "mime_type": "application/json"
                }
            ],
            "capabilities": [
                {
                    "type": "tools",
                    "description": "Tool execution capability"
                },
                {
                    "type": "resources",
                    "description": "Resource access capability"
                }
            ],
            "last_checked": "2024-01-20T12:00:00Z"
        }
        
        return {
            "success": True,
            "message": "MCP server retrieved successfully",
            "server": server
        }
        
    except Exception as e:
        logger.error(f"MCP_API: Failed to get server {server_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get MCP server: {str(e)}"
        )

@router.post("/smart-suggestions")
async def get_smart_suggestions(request: MCPDetectionRequest, db: Session = Depends(get_db)):
    """
    Get smart policy suggestions based on MCP server analysis
    """
    try:
        logger.info(f"MCP_API: Getting smart suggestions for {request.resource_url}")
        
        # Analyze the MCP server
        analysis = await mcp_detector.analyze_mcp_server(request.resource_url)
        
        if "error" in analysis:
            return {
                "success": False,
                "message": "Failed to analyze MCP server",
                "error": analysis["error"]
            }
        
        # Generate smart suggestions
        suggestions = {
            "policy_suggestions": analysis.get("policy_suggestions", []),
            "recommended_templates": analysis.get("recommended_templates", []),
            "capability_analysis": analysis.get("capabilities", {}),
            "security_recommendations": [
                "Implement role-based access control",
                "Add time-based restrictions for sensitive tools",
                "Enable audit logging for all MCP operations",
                "Implement rate limiting for tool calls"
            ],
            "integration_recommendations": [
                "Configure OPAL synchronization for real-time policy updates",
                "Set up monitoring and alerting for MCP server health",
                "Implement context-aware access control",
                "Configure attribute mapping for user context"
            ]
        }
        
        return {
            "success": True,
            "message": "Smart suggestions generated successfully",
            "suggestions": suggestions
        }
        
    except Exception as e:
        logger.error(f"MCP_API: Failed to get smart suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get smart suggestions: {str(e)}"
        )
