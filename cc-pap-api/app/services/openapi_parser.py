"""
OpenAPI Specification Parser Service for Control Core PIP
Parses OpenAPI/Swagger specs and extracts endpoints, security, and generates attribute mappings
"""

import json
import yaml
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class APIEndpoint:
    """Represents an API endpoint"""
    path: str
    method: str
    operation_id: Optional[str]
    summary: Optional[str]
    description: Optional[str]
    parameters: List[Dict[str, Any]]
    security: List[Dict[str, Any]]
    request_body: Optional[Dict[str, Any]]
    responses: Dict[str, Any]
    tags: List[str]

@dataclass
class SecurityScheme:
    """Represents a security scheme"""
    name: str
    type: str
    description: Optional[str]
    scheme: Optional[str]
    bearer_format: Optional[str]
    flows: Optional[Dict[str, Any]]
    scopes: Optional[List[str]]

@dataclass
class OpenAPISpec:
    """Represents a parsed OpenAPI specification"""
    version: str
    info: Dict[str, Any]
    servers: List[Dict[str, Any]]
    paths: Dict[str, Any]
    components: Dict[str, Any]
    security: List[Dict[str, Any]]
    tags: List[Dict[str, Any]]

class OpenAPIParser:
    """OpenAPI specification parser"""
    
    def __init__(self):
        self.supported_versions = ['2.0', '3.0', '3.1']
    
    def parse_spec(self, spec_content: str, format: str = 'auto') -> OpenAPISpec:
        """Parse OpenAPI specification from content"""
        try:
            # Determine format if auto
            if format == 'auto':
                format = self._detect_format(spec_content)
            
            # Parse based on format
            if format.lower() in ['yaml', 'yml']:
                spec_data = yaml.safe_load(spec_content)
            elif format.lower() == 'json':
                spec_data = json.loads(spec_content)
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            # Validate and create OpenAPISpec object
            return self._create_spec_object(spec_data)
            
        except Exception as e:
            logger.error(f"Failed to parse OpenAPI spec: {str(e)}")
            raise
    
    def _detect_format(self, content: str) -> str:
        """Detect the format of the spec content"""
        content = content.strip()
        if content.startswith('{') or content.startswith('['):
            return 'json'
        elif content.startswith('openapi:') or content.startswith('swagger:'):
            return 'yaml'
        else:
            # Try to parse as JSON first
            try:
                json.loads(content)
                return 'json'
            except:
                return 'yaml'
    
    def _create_spec_object(self, spec_data: Dict[str, Any]) -> OpenAPISpec:
        """Create OpenAPISpec object from parsed data"""
        # Determine version
        version = spec_data.get('openapi') or spec_data.get('swagger', '2.0')
        
        # Extract basic info
        info = spec_data.get('info', {})
        servers = spec_data.get('servers', [])
        paths = spec_data.get('paths', {})
        components = spec_data.get('components', {})
        security = spec_data.get('security', [])
        tags = spec_data.get('tags', [])
        
        return OpenAPISpec(
            version=version,
            info=info,
            servers=servers,
            paths=paths,
            components=components,
            security=security,
            tags=tags
        )
    
    def extract_endpoints(self, spec: OpenAPISpec) -> List[APIEndpoint]:
        """Extract all endpoints from the specification"""
        endpoints = []
        
        for path, path_item in spec.paths.items():
            # Handle different HTTP methods
            methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace']
            
            for method in methods:
                if method in path_item:
                    operation = path_item[method]
                    
                    endpoint = APIEndpoint(
                        path=path,
                        method=method.upper(),
                        operation_id=operation.get('operationId'),
                        summary=operation.get('summary'),
                        description=operation.get('description'),
                        parameters=operation.get('parameters', []),
                        security=operation.get('security', []),
                        request_body=operation.get('requestBody'),
                        responses=operation.get('responses', {}),
                        tags=operation.get('tags', [])
                    )
                    
                    endpoints.append(endpoint)
        
        return endpoints
    
    def extract_security_requirements(self, spec: OpenAPISpec) -> List[SecurityScheme]:
        """Extract security schemes from the specification"""
        security_schemes = []
        
        # Get security schemes from components
        components_security = spec.components.get('securitySchemes', {})
        
        for name, scheme_data in components_security.items():
            security_scheme = SecurityScheme(
                name=name,
                type=scheme_data.get('type', ''),
                description=scheme_data.get('description'),
                scheme=scheme_data.get('scheme'),
                bearer_format=scheme_data.get('bearerFormat'),
                flows=scheme_data.get('flows'),
                scopes=scheme_data.get('scopes')
            )
            security_schemes.append(security_scheme)
        
        return security_schemes
    
    def generate_attribute_mappings(self, spec: OpenAPISpec) -> List[Dict[str, Any]]:
        """Generate attribute mappings for API context"""
        mappings = []
        endpoints = self.extract_endpoints(spec)
        security_schemes = self.extract_security_requirements(spec)
        
        # Create security scheme mapping
        security_mapping = {scheme.name: scheme for scheme in security_schemes}
        
        for endpoint in endpoints:
            # Map endpoint path
            mappings.append({
                'target_attribute': 'api.path',
                'source_value': endpoint.path,
                'description': f'API endpoint path for {endpoint.method} {endpoint.path}',
                'data_type': 'string',
                'is_required': True
            })
            
            # Map HTTP method
            mappings.append({
                'target_attribute': 'api.method',
                'source_value': endpoint.method,
                'description': f'HTTP method for {endpoint.path}',
                'data_type': 'string',
                'is_required': True
            })
            
            # Map operation ID
            if endpoint.operation_id:
                mappings.append({
                    'target_attribute': 'api.operation_id',
                    'source_value': endpoint.operation_id,
                    'description': f'Operation ID for {endpoint.method} {endpoint.path}',
                    'data_type': 'string',
                    'is_required': False
                })
            
            # Map security requirements
            if endpoint.security:
                for security_req in endpoint.security:
                    for scheme_name, scopes in security_req.items():
                        if scheme_name in security_mapping:
                            scheme = security_mapping[scheme_name]
                            mappings.append({
                                'target_attribute': 'api.security',
                                'source_value': scheme_name,
                                'description': f'Security scheme for {endpoint.method} {endpoint.path}',
                                'data_type': 'string',
                                'is_required': True,
                                'metadata': {
                                    'scheme_type': scheme.type,
                                    'scopes': scopes if isinstance(scopes, list) else []
                                }
                            })
            
            # Map parameters
            for param in endpoint.parameters:
                if param.get('required', False):
                    mappings.append({
                        'target_attribute': 'api.parameters',
                        'source_value': param.get('name', ''),
                        'description': f'Required parameter for {endpoint.method} {endpoint.path}',
                        'data_type': param.get('schema', {}).get('type', 'string'),
                        'is_required': True,
                        'metadata': {
                            'parameter_type': param.get('in', 'query'),
                            'description': param.get('description', '')
                        }
                    })
            
            # Map tags
            for tag in endpoint.tags:
                mappings.append({
                    'target_attribute': 'api.tags',
                    'source_value': tag,
                    'description': f'API tag for {endpoint.method} {endpoint.path}',
                    'data_type': 'string',
                    'is_required': False
                })
        
        return mappings
    
    def get_endpoint_summary(self, spec: OpenAPISpec) -> Dict[str, Any]:
        """Get summary of all endpoints"""
        endpoints = self.extract_endpoints(spec)
        security_schemes = self.extract_security_requirements(spec)
        
        # Group endpoints by method
        methods = {}
        for endpoint in endpoints:
            method = endpoint.method
            if method not in methods:
                methods[method] = []
            methods[method].append({
                'path': endpoint.path,
                'operation_id': endpoint.operation_id,
                'summary': endpoint.summary,
                'security': endpoint.security,
                'tags': endpoint.tags
            })
        
        # Group endpoints by tag
        tags = {}
        for endpoint in endpoints:
            for tag in endpoint.tags:
                if tag not in tags:
                    tags[tag] = []
                tags[tag].append({
                    'path': endpoint.path,
                    'method': endpoint.method,
                    'operation_id': endpoint.operation_id,
                    'summary': endpoint.summary
                })
        
        return {
            'total_endpoints': len(endpoints),
            'methods': methods,
            'tags': tags,
            'security_schemes': [
                {
                    'name': scheme.name,
                    'type': scheme.type,
                    'description': scheme.description
                }
                for scheme in security_schemes
            ],
            'info': spec.info,
            'servers': spec.servers
        }
    
    def validate_spec(self, spec: OpenAPISpec) -> Dict[str, Any]:
        """Validate OpenAPI specification"""
        issues = []
        warnings = []
        
        # Check version
        if spec.version not in self.supported_versions:
            issues.append(f"Unsupported OpenAPI version: {spec.version}")
        
        # Check required fields
        if not spec.info:
            issues.append("Missing 'info' section")
        elif not spec.info.get('title'):
            issues.append("Missing 'title' in info section")
        elif not spec.info.get('version'):
            issues.append("Missing 'version' in info section")
        
        # Check paths
        if not spec.paths:
            warnings.append("No paths defined in specification")
        
        # Check endpoints
        endpoints = self.extract_endpoints(spec)
        if not endpoints:
            warnings.append("No endpoints found in specification")
        
        # Check for duplicate operation IDs
        operation_ids = [ep.operation_id for ep in endpoints if ep.operation_id]
        if len(operation_ids) != len(set(operation_ids)):
            warnings.append("Duplicate operation IDs found")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings,
            'endpoint_count': len(endpoints),
            'security_scheme_count': len(self.extract_security_requirements(spec))
        }

class OpenAPIService:
    """Main OpenAPI service for parsing and processing specifications"""
    
    def __init__(self):
        self.parser = OpenAPIParser()
    
    async def parse_and_analyze(self, spec_content: str, format: str = 'auto') -> Dict[str, Any]:
        """Parse OpenAPI spec and return analysis"""
        try:
            # Parse the specification
            spec = self.parser.parse_spec(spec_content, format)
            
            # Extract endpoints and security
            endpoints = self.parser.extract_endpoints(spec)
            security_schemes = self.parser.extract_security_requirements(spec)
            
            # Generate attribute mappings
            mappings = self.parser.generate_attribute_mappings(spec)
            
            # Get summary
            summary = self.parser.get_endpoint_summary(spec)
            
            # Validate
            validation = self.parser.validate_spec(spec)
            
            return {
                'spec': {
                    'version': spec.version,
                    'info': spec.info,
                    'servers': spec.servers,
                    'tags': spec.tags
                },
                'endpoints': [
                    {
                        'path': ep.path,
                        'method': ep.method,
                        'operation_id': ep.operation_id,
                        'summary': ep.summary,
                        'description': ep.description,
                        'parameters': ep.parameters,
                        'security': ep.security,
                        'tags': ep.tags
                    }
                    for ep in endpoints
                ],
                'security_schemes': [
                    {
                        'name': scheme.name,
                        'type': scheme.type,
                        'description': scheme.description,
                        'scheme': scheme.scheme,
                        'bearer_format': scheme.bearer_format,
                        'scopes': scheme.scopes
                    }
                    for scheme in security_schemes
                ],
                'attribute_mappings': mappings,
                'summary': summary,
                'validation': validation,
                'parsed_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to parse and analyze OpenAPI spec: {str(e)}")
            raise
    
    async def test_spec_parsing(self, spec_content: str, format: str = 'auto') -> Dict[str, Any]:
        """Test parsing of OpenAPI specification"""
        try:
            spec = self.parser.parse_spec(spec_content, format)
            validation = self.parser.validate_spec(spec)
            
            return {
                'success': True,
                'status': 'valid' if validation['valid'] else 'invalid',
                'details': {
                    'version': spec.version,
                    'title': spec.info.get('title', 'Unknown'),
                    'endpoint_count': validation['endpoint_count'],
                    'security_scheme_count': validation['security_scheme_count'],
                    'validation': validation
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'status': 'error',
                'error': str(e),
                'details': {
                    'message': 'Failed to parse OpenAPI specification'
                }
            }
    
    def get_sample_spec(self) -> str:
        """Get a sample OpenAPI specification"""
        return """
openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
  description: A sample API for demonstration
servers:
  - url: https://api.example.com/v1
    description: Production server
paths:
  /users:
    get:
      summary: Get all users
      operationId: getUsers
      tags:
        - users
      security:
        - api_key: []
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      summary: Create a new user
      operationId: createUser
      tags:
        - users
      security:
        - oauth2: [write:users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        '201':
          description: User created
  /users/{id}:
    get:
      summary: Get user by ID
      operationId: getUserById
      tags:
        - users
      security:
        - api_key: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
    delete:
      summary: Delete user
      operationId: deleteUser
      tags:
        - users
      security:
        - oauth2: [admin]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: User deleted
components:
  securitySchemes:
    api_key:
      type: apiKey
      in: header
      name: X-API-Key
    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/oauth/authorize
          tokenUrl: https://auth.example.com/oauth/token
          scopes:
            read:users: Read user information
            write:users: Create and update users
            admin: Administrative access
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
          format: email
        role:
          type: string
          enum: [user, admin]
      required:
        - id
        - name
        - email
tags:
  - name: users
    description: User management operations
"""

# Global instance
openapi_service = OpenAPIService()
