"""
MCP Detection Service for Control Plane
Handles MCP server detection, analysis, and policy generation
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
import httpx
import logging

logger = logging.getLogger(__name__)

class MCPCapability:
    """Represents a capability of an MCP server"""
    
    def __init__(self, type: str, description: str, schema: Optional[Dict] = None, parameters: Optional[Dict] = None):
        self.type = type
        self.description = description
        self.schema = schema or {}
        self.parameters = parameters or {}

class MCPServer:
    """Represents an MCP server with its capabilities"""
    
    def __init__(self, id: str, name: str, description: str, url: str, version: str = "1.0"):
        self.id = id
        self.name = name
        self.description = description
        self.url = url
        self.version = version
        self.capabilities: List[MCPCapability] = []
        self.tools: List[Dict] = []
        self.resources: List[Dict] = []
        self.prompts: List[Dict] = []
        self.last_checked = datetime.now()
        self.status = "active"
        self.metadata: Dict[str, Any] = {}

class MCPTool:
    """Represents a tool available in an MCP server"""
    
    def __init__(self, name: str, description: str, input_schema: Dict, category: str = "general", tags: List[str] = None):
        self.name = name
        self.description = description
        self.input_schema = input_schema
        self.category = category
        self.tags = tags or []

class MCPResource:
    """Represents a resource available in an MCP server"""
    
    def __init__(self, uri: str, name: str, description: str, mime_type: str = None, metadata: Dict = None):
        self.uri = uri
        self.name = name
        self.description = description
        self.mime_type = mime_type
        self.metadata = metadata or {}

class MCPDetectionService:
    """Service for detecting and analyzing MCP servers"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.logger = logging.getLogger(__name__)
    
    async def detect_mcp_server(self, resource_url: str) -> Optional[MCPServer]:
        """Detect if a resource is an MCP server"""
        self.logger.info(f"MCP_DETECTION: Starting detection for {resource_url}")
        
        try:
            # Try to discover MCP server capabilities
            server = await self._discover_mcp_server(resource_url)
            if not server:
                return None
            
            # Analyze capabilities for policy generation
            await self._analyze_capabilities(server)
            
            self.logger.info(f"MCP_DETECTION: Successfully detected MCP server {server.name}")
            return server
            
        except Exception as e:
            self.logger.error(f"MCP_DETECTION: Failed to detect MCP server: {e}")
            return None
    
    async def _discover_mcp_server(self, url: str) -> Optional[MCPServer]:
        """Discover MCP server capabilities"""
        endpoints = [
            "/mcp/capabilities",
            "/mcp/info", 
            "/capabilities",
            "/info",
            "/"
        ]
        
        for endpoint in endpoints:
            discovery_url = url + endpoint
            self.logger.debug(f"MCP_DETECTION: Trying endpoint {discovery_url}")
            
            try:
                response = await self.client.get(
                    discovery_url,
                    headers={
                        "Accept": "application/json",
                        "User-Agent": "ControlCore-MCP-Detector/1.0"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    server = self._parse_mcp_response(url, data)
                    if server:
                        # Try to get tools and resources
                        await self._discover_tools(server)
                        await self._discover_resources(server)
                        return server
                        
            except Exception as e:
                self.logger.debug(f"MCP_DETECTION: Endpoint {endpoint} failed: {e}")
                continue
        
        return None
    
    def _parse_mcp_response(self, base_url: str, data: Dict) -> Optional[MCPServer]:
        """Parse MCP server response"""
        try:
            # Extract basic information
            name = data.get("name", "Unknown MCP Server")
            description = data.get("description", "MCP Server")
            version = data.get("version", "1.0")
            
            server = MCPServer(
                id=f"mcp-{name.lower().replace(' ', '-')}",
                name=name,
                description=description,
                url=base_url,
                version=version
            )
            
            # Extract capabilities
            capabilities = data.get("capabilities", [])
            for cap_data in capabilities:
                if isinstance(cap_data, dict):
                    capability = MCPCapability(
                        type=cap_data.get("type", ""),
                        description=cap_data.get("description", ""),
                        schema=cap_data.get("schema", {}),
                        parameters=cap_data.get("parameters", {})
                    )
                    server.capabilities.append(capability)
            
            # Store raw response as metadata
            server.metadata["raw_response"] = data
            
            return server
            
        except Exception as e:
            self.logger.error(f"MCP_DETECTION: Failed to parse MCP response: {e}")
            return None
    
    async def _discover_tools(self, server: MCPServer):
        """Discover available tools in the MCP server"""
        tool_endpoints = ["/mcp/tools", "/tools", "/api/tools"]
        
        for endpoint in tool_endpoints:
            tools_url = server.url + endpoint
            self.logger.debug(f"MCP_DETECTION: Discovering tools at {tools_url}")
            
            try:
                response = await self.client.get(tools_url)
                if response.status_code == 200:
                    data = response.json()
                    tools = data.get("tools", [])
                    
                    for tool_data in tools:
                        if isinstance(tool_data, dict):
                            tool = MCPTool(
                                name=tool_data.get("name", ""),
                                description=tool_data.get("description", ""),
                                input_schema=tool_data.get("inputSchema", {}),
                                category=tool_data.get("category", "general"),
                                tags=tool_data.get("tags", [])
                            )
                            server.tools.append(tool.__dict__)
                    
                    break
                    
            except Exception as e:
                self.logger.debug(f"MCP_DETECTION: Tools endpoint {endpoint} failed: {e}")
                continue
    
    async def _discover_resources(self, server: MCPServer):
        """Discover available resources in the MCP server"""
        resource_endpoints = ["/mcp/resources", "/resources", "/api/resources"]
        
        for endpoint in resource_endpoints:
            resources_url = server.url + endpoint
            self.logger.debug(f"MCP_DETECTION: Discovering resources at {resources_url}")
            
            try:
                response = await self.client.get(resources_url)
                if response.status_code == 200:
                    data = response.json()
                    resources = data.get("resources", [])
                    
                    for resource_data in resources:
                        if isinstance(resource_data, dict):
                            resource = MCPResource(
                                uri=resource_data.get("uri", ""),
                                name=resource_data.get("name", ""),
                                description=resource_data.get("description", ""),
                                mime_type=resource_data.get("mimeType", ""),
                                metadata=resource_data.get("metadata", {})
                            )
                            server.resources.append(resource.__dict__)
                    
                    break
                    
            except Exception as e:
                self.logger.debug(f"MCP_DETECTION: Resources endpoint {endpoint} failed: {e}")
                continue
    
    async def _analyze_capabilities(self, server: MCPServer):
        """Analyze MCP server capabilities for policy generation"""
        suggestions = []
        
        # Tool-based suggestions
        for tool in server.tools:
            tool_name = tool.get("name", "")
            if tool_name:
                suggestions.append(f"Control access to tool: {tool_name}")
                
                tags = tool.get("tags", [])
                if tags:
                    suggestions.append(f"Filter tools by tags: {tags}")
        
        # Resource-based suggestions
        for resource in server.resources:
            resource_uri = resource.get("uri", "")
            if resource_uri:
                suggestions.append(f"Control access to resource: {resource_uri}")
                
                mime_type = resource.get("mime_type", "")
                if mime_type:
                    suggestions.append(f"Filter resources by MIME type: {mime_type}")
        
        # Capability-based suggestions
        for capability in server.capabilities:
            suggestions.append(f"Control capability: {capability.type}")
        
        server.metadata["policy_suggestions"] = suggestions
        
        self.logger.info(f"MCP_DETECTION: Generated {len(suggestions)} policy suggestions")
    
    async def analyze_mcp_server(self, resource_url: str) -> Dict[str, Any]:
        """Comprehensive analysis of an MCP server"""
        server = await self.detect_mcp_server(resource_url)
        if not server:
            return {"error": "MCP server not detected"}
        
        # Generate analysis report
        analysis = {
            "server": {
                "id": server.id,
                "name": server.name,
                "description": server.description,
                "url": server.url,
                "version": server.version,
                "status": server.status,
                "last_checked": server.last_checked.isoformat()
            },
            "capabilities": {
                "tools_count": len(server.tools),
                "resources_count": len(server.resources),
                "capabilities_count": len(server.capabilities)
            },
            "policy_suggestions": server.metadata.get("policy_suggestions", []),
            "recommended_templates": [
                "mcp_basic_access",
                "mcp_tool_restriction", 
                "mcp_resource_control"
            ]
        }
        
        return analysis
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
