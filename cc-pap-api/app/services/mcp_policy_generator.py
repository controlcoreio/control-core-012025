"""
MCP Policy Generator Service for Control Plane
Generates smart policies based on MCP server capabilities
"""

import json
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class PolicyVariable:
    """Represents a variable in a policy template"""
    
    def __init__(self, name: str, type: str, description: str, required: bool = False, default: str = None, options: List[str] = None):
        self.name = name
        self.type = type
        self.description = description
        self.required = required
        self.default = default
        self.options = options or []

class PolicyCondition:
    """Represents a condition that can be used in policies"""
    
    def __init__(self, id: str, name: str, description: str, condition_type: str, expression: str, examples: List[str] = None):
        self.id = id
        self.name = name
        self.description = description
        self.type = condition_type
        self.expression = expression
        self.examples = examples or []

class PolicyRequirements:
    """Represents requirements for policy generation"""
    
    def __init__(self, access_level: str = "internal", user_roles: List[str] = None, 
                 departments: List[str] = None, time_restrictions: List[str] = None,
                 ip_restrictions: List[str] = None, tool_restrictions: List[str] = None,
                 resource_restrictions: List[str] = None, context_requirements: List[str] = None):
        self.access_level = access_level
        self.user_roles = user_roles or []
        self.departments = departments or []
        self.time_restrictions = time_restrictions or []
        self.ip_restrictions = ip_restrictions or []
        self.tool_restrictions = tool_restrictions or []
        self.resource_restrictions = resource_restrictions or []
        self.context_requirements = context_requirements or []

class MCPPolicyTemplate:
    """Represents a policy template for MCP servers"""
    
    def __init__(self, id: str, name: str, description: str, category: str, template: str, 
                 variables: List[PolicyVariable] = None, conditions: List[PolicyCondition] = None, 
                 metadata: Dict[str, Any] = None):
        self.id = id
        self.name = name
        self.description = description
        self.category = category
        self.template = template
        self.variables = variables or []
        self.conditions = conditions or []
        self.metadata = metadata or {}

class MCPPolicyGenerator:
    """Generates policies for MCP servers"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def generate_policy_for_mcp_server(self, server_data: Dict, requirements: PolicyRequirements) -> MCPPolicyTemplate:
        """Generate a policy for an MCP server"""
        self.logger.info(f"MCP_POLICY_GEN: Generating policy for MCP server {server_data.get('name', 'Unknown')}")
        
        # Analyze server capabilities
        capabilities = self._analyze_server_capabilities(server_data)
        
        # Create policy template
        policy = self._create_policy_template(server_data, requirements, capabilities)
        
        # Add MCP-specific conditions
        self._add_mcp_conditions(policy, server_data)
        
        # Generate the actual policy content
        policy.template = self._generate_policy_content(policy, server_data, requirements)
        
        self.logger.info(f"MCP_POLICY_GEN: Policy generated successfully with {len(policy.variables)} variables and {len(policy.conditions)} conditions")
        
        return policy
    
    def _analyze_server_capabilities(self, server_data: Dict) -> Dict[str, Any]:
        """Analyze MCP server capabilities"""
        capabilities = {}
        
        # Analyze tools
        tools = server_data.get("tools", [])
        tool_categories = {}
        tool_tags = {}
        
        for tool in tools:
            category = tool.get("category", "general")
            if category not in tool_categories:
                tool_categories[category] = []
            tool_categories[category].append(tool.get("name", ""))
            
            tags = tool.get("tags", [])
            for tag in tags:
                tool_tags[tag] = tool_tags.get(tag, 0) + 1
        
        capabilities["tool_categories"] = tool_categories
        capabilities["tool_tags"] = tool_tags
        capabilities["total_tools"] = len(tools)
        
        # Analyze resources
        resources = server_data.get("resources", [])
        resource_types = {}
        
        for resource in resources:
            mime_type = resource.get("mime_type", "")
            if mime_type:
                resource_types[mime_type] = resource_types.get(mime_type, 0) + 1
        
        capabilities["resource_types"] = resource_types
        capabilities["total_resources"] = len(resources)
        
        return capabilities
    
    def _create_policy_template(self, server_data: Dict, requirements: PolicyRequirements, capabilities: Dict) -> MCPPolicyTemplate:
        """Create a policy template"""
        policy = MCPPolicyTemplate(
            id=f"mcp-policy-{server_data.get('id', 'unknown')}-{int(datetime.now().timestamp())}",
            name=f"Policy for {server_data.get('name', 'MCP Server')}",
            description=f"Access control policy for MCP server: {server_data.get('description', '')}",
            category="mcp_access_control",
            metadata={
                "server_id": server_data.get("id"),
                "server_name": server_data.get("name"),
                "generated_at": datetime.now().isoformat(),
                "capabilities": capabilities
            }
        )
        
        # Add variables based on requirements
        self._add_variables(policy, requirements)
        
        # Add conditions based on server capabilities
        self._add_server_conditions(policy, server_data)
        
        return policy
    
    def _add_variables(self, policy: MCPPolicyTemplate, requirements: PolicyRequirements):
        """Add variables to the policy template"""
        # User role variable
        if requirements.user_roles:
            policy.variables.append(PolicyVariable(
                name="allowed_roles",
                type="array",
                description="User roles allowed to access MCP server",
                required=True,
                options=requirements.user_roles
            ))
        
        # Department variable
        if requirements.departments:
            policy.variables.append(PolicyVariable(
                name="allowed_departments",
                type="array",
                description="Departments allowed to access MCP server",
                required=False,
                options=requirements.departments
            ))
        
        # Access level variable
        policy.variables.append(PolicyVariable(
            name="access_level",
            type="string",
            description="Required access level for MCP server",
            required=True,
            default=requirements.access_level,
            options=["public", "internal", "restricted", "confidential"]
        ))
        
        # Tool restrictions variable
        if requirements.tool_restrictions:
            policy.variables.append(PolicyVariable(
                name="restricted_tools",
                type="array",
                description="Tools that are restricted",
                required=False,
                options=requirements.tool_restrictions
            ))
    
    def _add_server_conditions(self, policy: MCPPolicyTemplate, server_data: Dict):
        """Add conditions based on server capabilities"""
        # Tool access conditions
        tools = server_data.get("tools", [])
        for tool in tools:
            tool_name = tool.get("name", "")
            if tool_name:
                condition = PolicyCondition(
                    id=f"tool_{tool_name}_access",
                    name=f"Access to {tool_name}",
                    description=f"Control access to tool: {tool.get('description', '')}",
                    condition_type="resource",
                    expression=f'input.tool.name == "{tool_name}"',
                    examples=[
                        f"Allow {tool_name} for developers",
                        f"Restrict {tool_name} to specific departments"
                    ]
                )
                policy.conditions.append(condition)
        
        # Resource access conditions
        resources = server_data.get("resources", [])
        for resource in resources:
            resource_uri = resource.get("uri", "")
            resource_name = resource.get("name", "")
            if resource_uri:
                condition = PolicyCondition(
                    id=f"resource_{resource_uri.replace('/', '_')}_access",
                    name=f"Access to {resource_name}",
                    description=f"Control access to resource: {resource.get('description', '')}",
                    condition_type="resource",
                    expression=f'input.resource.uri == "{resource_uri}"',
                    examples=[
                        f"Allow {resource_name} for authenticated users",
                        f"Restrict {resource_name} based on user context"
                    ]
                )
                policy.conditions.append(condition)
    
    def _add_mcp_conditions(self, policy: MCPPolicyTemplate, server_data: Dict):
        """Add MCP-specific conditions"""
        # MCP server status condition
        condition = PolicyCondition(
            id="mcp_server_status",
            name="MCP Server Status",
            description="Check if MCP server is available and healthy",
            condition_type="context",
            expression='input.context.mcp_server.status == "active"',
            examples=[
                "Only allow access when MCP server is active",
                "Block access when MCP server is in maintenance mode"
            ]
        )
        policy.conditions.append(condition)
        
        # MCP capability condition
        condition = PolicyCondition(
            id="mcp_capability_check",
            name="MCP Capability Check",
            description="Verify required MCP capabilities are available",
            condition_type="context",
            expression='input.context.mcp_server.capabilities[_] == "tools"',
            examples=[
                "Require tools capability for tool access",
                "Require resources capability for resource access"
            ]
        )
        policy.conditions.append(condition)
    
    def _generate_policy_content(self, policy: MCPPolicyTemplate, server_data: Dict, requirements: PolicyRequirements) -> str:
        """Generate the actual Rego policy content"""
        lines = []
        
        # Header
        lines.append(f"# MCP Access Control Policy for {server_data.get('name', 'MCP Server')}")
        lines.append(f"# Generated: {datetime.now().isoformat()}")
        lines.append(f"# Server: {server_data.get('name', 'Unknown')} ({server_data.get('url', '')})")
        lines.append("")
        
        # Package declaration
        lines.append("package mcp_access_control")
        lines.append("")
        
        # Default deny
        lines.append("# Default deny all access")
        lines.append("default allow = false")
        lines.append("")
        
        # Main allow rule
        lines.append("# Allow access based on user, resource, and context")
        lines.append("allow {")
        lines.append("    # User role check")
        lines.append("    user_role_allowed")
        lines.append("    ")
        lines.append("    # Department check (if required)")
        lines.append("    department_allowed")
        lines.append("    ")
        lines.append("    # MCP server status check")
        lines.append("    mcp_server_available")
        lines.append("    ")
        lines.append("    # Tool/resource specific checks")
        lines.append("    resource_access_allowed")
        lines.append("}")
        lines.append("")
        
        # User role check
        lines.append("# Check if user role is allowed")
        lines.append("user_role_allowed {")
        lines.append("    input.user.roles[_] in allowed_roles")
        lines.append("}")
        lines.append("")
        
        # Department check
        lines.append("# Check if user department is allowed")
        lines.append("department_allowed {")
        lines.append("    not input.user.department")
        lines.append("}")
        lines.append("")
        lines.append("department_allowed {")
        lines.append("    input.user.department in allowed_departments")
        lines.append("}")
        lines.append("")
        
        # MCP server availability check
        lines.append("# Check if MCP server is available")
        lines.append("mcp_server_available {")
        lines.append("    input.context.mcp_server.status == \"active\"")
        lines.append("}")
        lines.append("")
        
        # Resource access check
        lines.append("# Check if resource access is allowed")
        lines.append("resource_access_allowed {")
        lines.append("    # Tool access")
        lines.append("    input.action.type == \"tool_call\"")
        lines.append("    tool_access_allowed")
        lines.append("}")
        lines.append("")
        lines.append("resource_access_allowed {")
        lines.append("    # Resource access")
        lines.append("    input.action.type == \"resource_access\"")
        lines.append("    resource_access_check")
        lines.append("}")
        lines.append("")
        
        # Tool access check
        lines.append("# Check if tool access is allowed")
        lines.append("tool_access_allowed {")
        lines.append("    not input.tool.name in restricted_tools")
        lines.append("}")
        lines.append("")
        
        # Resource access check
        lines.append("# Check if resource access is allowed")
        lines.append("resource_access_check {")
        lines.append("    not input.resource.uri in restricted_resources")
        lines.append("}")
        lines.append("")
        
        # Add tool-specific rules
        tools = server_data.get("tools", [])
        if tools:
            lines.append("# Tool-specific access rules")
            for tool in tools:
                tool_name = tool.get("name", "")
                if tool_name:
                    safe_name = tool_name.replace("-", "_")
                    lines.append(f"# {tool_name} tool access")
                    lines.append(f"allow_tool_{safe_name} {{")
                    lines.append(f'    input.tool.name == "{tool_name}"')
                    lines.append("    user_role_allowed")
                    lines.append("}")
                    lines.append("")
        
        # Add resource-specific rules
        resources = server_data.get("resources", [])
        if resources:
            lines.append("# Resource-specific access rules")
            for resource in resources:
                resource_name = resource.get("name", "").replace(" ", "_")
                resource_uri = resource.get("uri", "")
                if resource_uri:
                    lines.append(f"# {resource.get('name', '')} resource access")
                    lines.append(f"allow_resource_{resource_name} {{")
                    lines.append(f'    input.resource.uri == "{resource_uri}"')
                    lines.append("    user_role_allowed")
                    lines.append("}")
                    lines.append("")
        
        # Add context-based rules
        lines.append("# Context-based access rules")
        lines.append("context_based_access {")
        lines.append('    input.context.user_agent != "bot"')
        lines.append("    input.context.request_time.hour >= 8")
        lines.append("    input.context.request_time.hour <= 18")
        lines.append("}")
        lines.append("")
        
        return "\n".join(lines)
    
    def get_mcp_policy_templates(self) -> List[MCPPolicyTemplate]:
        """Get available MCP policy templates"""
        return [
            MCPPolicyTemplate(
                id="mcp_basic_access",
                name="Basic MCP Access Control",
                description="Basic access control for MCP servers",
                category="basic",
                template=self._get_basic_mcp_template(),
                variables=[
                    PolicyVariable(
                        name="allowed_roles",
                        type="array",
                        description="User roles allowed to access MCP server",
                        required=True
                    )
                ]
            ),
            MCPPolicyTemplate(
                id="mcp_tool_restriction",
                name="MCP Tool Restriction",
                description="Restrict access to specific MCP tools",
                category="tool_control",
                template=self._get_tool_restriction_template(),
                variables=[
                    PolicyVariable(
                        name="restricted_tools",
                        type="array",
                        description="Tools that are restricted",
                        required=True
                    )
                ]
            ),
            MCPPolicyTemplate(
                id="mcp_resource_control",
                name="MCP Resource Control",
                description="Control access to MCP resources",
                category="resource_control",
                template=self._get_resource_control_template(),
                variables=[
                    PolicyVariable(
                        name="allowed_resources",
                        type="array",
                        description="Resources that are allowed",
                        required=True
                    )
                ]
            )
        ]
    
    def _get_basic_mcp_template(self) -> str:
        """Get basic MCP template"""
        return """package mcp_access_control

# Basic MCP access control
default allow = false

allow {
    input.user.roles[_] in allowed_roles
    input.context.mcp_server.status == "active"
}"""
    
    def _get_tool_restriction_template(self) -> str:
        """Get tool restriction template"""
        return """package mcp_access_control

# MCP tool restriction
default allow = false

allow {
    input.user.roles[_] in allowed_roles
    not input.tool.name in restricted_tools
    input.context.mcp_server.status == "active"
}"""
    
    def _get_resource_control_template(self) -> str:
        """Get resource control template"""
        return """package mcp_access_control

# MCP resource control
default allow = false

allow {
    input.user.roles[_] in allowed_roles
    input.resource.uri in allowed_resources
    input.context.mcp_server.status == "active"
}"""
