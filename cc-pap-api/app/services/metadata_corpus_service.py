"""
Metadata Corpus Service for Control Core PIP
Generates structured metadata for LLM consumption and policy suggestions
"""

import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import logging

from app.models import PIPConnection, AttributeMapping
from .openapi_parser import openapi_service

logger = logging.getLogger(__name__)

class MetadataCorpusService:
    """Service for generating metadata corpus for LLM consumption"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def generate_metadata_corpus(self) -> Dict[str, Any]:
        """Generate complete metadata corpus from all configured PIPs"""
        try:
            # Get all active PIP connections
            connections = self.db.query(PIPConnection).filter(
                PIPConnection.sync_enabled == True
            ).all()
            
            # Initialize corpus structure
            corpus = {
                'policy_attributes': {},
                'connected_sources': [],
                'api_specifications': [],
                'attribute_taxonomy': {},
                'generated_at': datetime.utcnow().isoformat(),
                'version': '1.0'
            }
            
            # Process each connection
            for connection in connections:
                await self._process_connection_for_corpus(connection, corpus)
            
            # Generate attribute taxonomy
            corpus['attribute_taxonomy'] = self._generate_attribute_taxonomy(corpus['policy_attributes'])
            
            # Generate policy suggestions
            corpus['policy_suggestions'] = self._generate_policy_suggestions(corpus)
            
            return corpus
            
        except Exception as e:
            logger.error(f"Failed to generate metadata corpus: {str(e)}")
            raise
    
    async def get_available_attributes(self) -> Dict[str, Any]:
        """Get all available policy attributes from configured sources"""
        try:
            connections = self.db.query(PIPConnection).filter(
                PIPConnection.sync_enabled == True
            ).all()
            
            attributes = {
                'user': {},
                'resource': {},
                'api': {},
                'environment': {},
                'temporal': {}
            }
            
            for connection in connections:
                connection_attributes = await self._get_connection_attributes(connection)
                self._merge_attributes(attributes, connection_attributes)
            
            return {
                'attributes': attributes,
                'total_attributes': sum(len(cat) for cat in attributes.values()),
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get available attributes: {str(e)}")
            raise
    
    async def suggest_policy(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest policy based on available attributes"""
        try:
            action = request.get('action', '')
            resource = request.get('resource', '')
            context = request.get('context', {})
            
            # Get available attributes
            available_attrs = await self.get_available_attributes()
            
            # Generate policy suggestions
            suggestions = self._generate_policy_suggestions_for_request(
                action, resource, context, available_attrs
            )
            
            return {
                'suggestions': suggestions,
                'available_attributes': available_attrs,
                'request': request,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to suggest policy: {str(e)}")
            raise
    
    async def _process_connection_for_corpus(self, connection: PIPConnection, corpus: Dict[str, Any]):
        """Process a single connection and add its metadata to the corpus"""
        try:
            # Get attribute mappings for this connection
            mappings = self.db.query(AttributeMapping).filter(
                AttributeMapping.connection_id == connection.id
            ).all()
            
            # Process based on connection type
            if connection.connection_type == 'identity' or connection.provider in ['okta', 'azure_ad', 'auth0', 'ldap']:
                await self._process_iam_connection(connection, mappings, corpus)
            elif connection.connection_type == 'database' or connection.provider in ['postgresql', 'mysql', 'mongodb']:
                await self._process_database_connection(connection, mappings, corpus)
            elif connection.connection_type == 'openapi':
                await self._process_openapi_connection(connection, mappings, corpus)
            
        except Exception as e:
            logger.error(f"Failed to process connection {connection.id} for corpus: {str(e)}")
    
    async def _process_iam_connection(self, connection: PIPConnection, mappings: List[AttributeMapping], corpus: Dict[str, Any]):
        """Process IAM connection for corpus"""
        # Add to connected sources
        corpus['connected_sources'].append({
            'name': connection.name,
            'type': 'identity',
            'provider': connection.provider,
            'attributes': [mapping.target_attribute for mapping in mappings],
            'sync_frequency': connection.sync_frequency
        })
        
        # Add user attributes
        for mapping in mappings:
            if mapping.target_attribute.startswith('user.'):
                attr_name = mapping.target_attribute
                corpus['policy_attributes'].setdefault('user', {})[attr_name] = {
                    'type': mapping.data_type,
                    'source': connection.name,
                    'description': f"User attribute from {connection.provider}",
                    'is_required': mapping.is_required,
                    'is_sensitive': mapping.is_sensitive,
                    'validation_rules': mapping.validation_rules or {}
                }
    
    async def _process_database_connection(self, connection: PIPConnection, mappings: List[AttributeMapping], corpus: Dict[str, Any]):
        """Process database connection for corpus"""
        # Add to connected sources
        corpus['connected_sources'].append({
            'name': connection.name,
            'type': 'database',
            'provider': connection.provider,
            'attributes': [mapping.target_attribute for mapping in mappings],
            'sync_frequency': connection.sync_frequency
        })
        
        # Add resource attributes
        for mapping in mappings:
            if mapping.target_attribute.startswith('resource.'):
                attr_name = mapping.target_attribute
                corpus['policy_attributes'].setdefault('resource', {})[attr_name] = {
                    'type': mapping.data_type,
                    'source': connection.name,
                    'description': f"Resource attribute from {connection.provider} database",
                    'is_required': mapping.is_required,
                    'is_sensitive': mapping.is_sensitive,
                    'validation_rules': mapping.validation_rules or {}
                }
    
    async def _process_openapi_connection(self, connection: PIPConnection, mappings: List[AttributeMapping], corpus: Dict[str, Any]):
        """Process OpenAPI connection for corpus"""
        # Add to connected sources
        corpus['connected_sources'].append({
            'name': connection.name,
            'type': 'api',
            'provider': 'openapi',
            'attributes': [mapping.target_attribute for mapping in mappings],
            'sync_frequency': connection.sync_frequency
        })
        
        # Parse OpenAPI spec if available
        spec_content = connection.configuration.get('spec_content', '')
        if spec_content:
            try:
                analysis = await openapi_service.parse_and_analyze(spec_content)
                
                # Add API specification
                corpus['api_specifications'].append({
                    'name': connection.name,
                    'endpoints': analysis['endpoints'],
                    'security_schemes': analysis['security_schemes'],
                    'summary': analysis['summary']
                })
                
                # Add API attributes
                for mapping in mappings:
                    if mapping.target_attribute.startswith('api.'):
                        attr_name = mapping.target_attribute
                        corpus['policy_attributes'].setdefault('api', {})[attr_name] = {
                            'type': mapping.data_type,
                            'source': connection.name,
                            'description': f"API attribute from OpenAPI specification",
                            'is_required': mapping.is_required,
                            'is_sensitive': mapping.is_sensitive,
                            'validation_rules': mapping.validation_rules or {}
                        }
                        
            except Exception as e:
                logger.error(f"Failed to parse OpenAPI spec for connection {connection.id}: {str(e)}")
    
    async def _get_connection_attributes(self, connection: PIPConnection) -> Dict[str, Any]:
        """Get attributes for a single connection"""
        mappings = self.db.query(AttributeMapping).filter(
            AttributeMapping.connection_id == connection.id
        ).all()
        
        attributes = {
            'user': {},
            'resource': {},
            'api': {},
            'environment': {},
            'temporal': {}
        }
        
        for mapping in mappings:
            attr_name = mapping.target_attribute
            attr_info = {
                'type': mapping.data_type,
                'source': connection.name,
                'provider': connection.provider,
                'is_required': mapping.is_required,
                'is_sensitive': mapping.is_sensitive
            }
            
            if attr_name.startswith('user.'):
                attributes['user'][attr_name] = attr_info
            elif attr_name.startswith('resource.'):
                attributes['resource'][attr_name] = attr_info
            elif attr_name.startswith('api.'):
                attributes['api'][attr_name] = attr_info
            elif attr_name.startswith('environment.'):
                attributes['environment'][attr_name] = attr_info
            elif attr_name.startswith('temporal.'):
                attributes['temporal'][attr_name] = attr_info
        
        return attributes
    
    def _merge_attributes(self, target: Dict[str, Any], source: Dict[str, Any]):
        """Merge source attributes into target"""
        for category, attrs in source.items():
            if category in target:
                target[category].update(attrs)
            else:
                target[category] = attrs
    
    def _generate_attribute_taxonomy(self, policy_attributes: Dict[str, Any]) -> Dict[str, Any]:
        """Generate attribute taxonomy and relationships"""
        taxonomy = {
            'categories': {},
            'relationships': [],
            'patterns': {}
        }
        
        # Categorize attributes
        for category, attrs in policy_attributes.items():
            taxonomy['categories'][category] = {
                'count': len(attrs),
                'attributes': list(attrs.keys()),
                'types': list(set(attr['type'] for attr in attrs.values())),
                'sources': list(set(attr['source'] for attr in attrs.values()))
            }
        
        # Identify patterns
        taxonomy['patterns'] = {
            'user_identity': [attr for attr in policy_attributes.get('user', {}).keys() if 'id' in attr or 'email' in attr],
            'user_roles': [attr for attr in policy_attributes.get('user', {}).keys() if 'role' in attr or 'group' in attr],
            'resource_sensitivity': [attr for attr in policy_attributes.get('resource', {}).keys() if 'sensitivity' in attr or 'classification' in attr],
            'api_security': [attr for attr in policy_attributes.get('api', {}).keys() if 'security' in attr or 'auth' in attr]
        }
        
        return taxonomy
    
    def _generate_policy_suggestions(self, corpus: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate policy suggestions based on available attributes"""
        suggestions = []
        
        # Check for common policy patterns
        user_attrs = corpus['policy_attributes'].get('user', {})
        resource_attrs = corpus['policy_attributes'].get('resource', {})
        api_attrs = corpus['policy_attributes'].get('api', {})
        
        # Role-based access control
        if 'user.roles' in user_attrs or 'user.groups' in user_attrs:
            suggestions.append({
                'type': 'rbac',
                'title': 'Role-Based Access Control',
                'description': 'Implement role-based access control using user roles or groups',
                'attributes': ['user.roles', 'user.groups'],
                'example': 'allow if user.roles contains "admin" or user.groups contains "managers"'
            })
        
        # Data sensitivity-based access
        if 'resource.sensitivity_level' in resource_attrs:
            suggestions.append({
                'type': 'data_classification',
                'title': 'Data Classification Access Control',
                'description': 'Control access based on data sensitivity levels',
                'attributes': ['resource.sensitivity_level', 'user.clearance_level'],
                'example': 'allow if resource.sensitivity_level == "public" or user.clearance_level >= resource.sensitivity_level'
            })
        
        # MFA requirements
        if 'user.mfa_enabled' in user_attrs:
            suggestions.append({
                'type': 'mfa_requirement',
                'title': 'Multi-Factor Authentication',
                'description': 'Require MFA for sensitive operations',
                'attributes': ['user.mfa_enabled', 'resource.sensitivity_level'],
                'example': 'allow if user.mfa_enabled == true or resource.sensitivity_level == "public"'
            })
        
        # Time-based access
        if any('time' in attr or 'hour' in attr for attr in user_attrs.keys()):
            suggestions.append({
                'type': 'time_based',
                'title': 'Time-Based Access Control',
                'description': 'Control access based on time of day or business hours',
                'attributes': ['temporal.business_hours', 'temporal.current_time'],
                'example': 'allow if temporal.business_hours == true'
            })
        
        # API security requirements
        if 'api.security' in api_attrs:
            suggestions.append({
                'type': 'api_security',
                'title': 'API Security Requirements',
                'description': 'Enforce API security requirements based on endpoint',
                'attributes': ['api.security', 'api.path', 'user.roles'],
                'example': 'allow if api.security contains "oauth2" and user.roles contains "api_user"'
            })
        
        return suggestions
    
    def _generate_policy_suggestions_for_request(
        self, 
        action: str, 
        resource: str, 
        context: Dict[str, Any], 
        available_attrs: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate policy suggestions for a specific request"""
        suggestions = []
        
        # Analyze the request
        if 'admin' in action.lower() or 'delete' in action.lower():
            # High-privilege actions
            suggestions.append({
                'priority': 'high',
                'title': 'Admin Action Protection',
                'description': 'This action requires elevated privileges',
                'conditions': [
                    'user.roles contains "admin"',
                    'user.mfa_enabled == true',
                    'temporal.business_hours == true'
                ],
                'attributes': ['user.roles', 'user.mfa_enabled', 'temporal.business_hours']
            })
        
        if 'sensitive' in resource.lower() or 'confidential' in resource.lower():
            # Sensitive resource access
            suggestions.append({
                'priority': 'high',
                'title': 'Sensitive Resource Access',
                'description': 'This resource contains sensitive data',
                'conditions': [
                    'resource.sensitivity_level == "confidential"',
                    'user.clearance_level >= "confidential"',
                    'user.department == resource.owner_department'
                ],
                'attributes': ['resource.sensitivity_level', 'user.clearance_level', 'user.department']
            })
        
        if 'api' in action.lower():
            # API access
            suggestions.append({
                'priority': 'medium',
                'title': 'API Access Control',
                'description': 'Control access to API endpoints',
                'conditions': [
                    'api.security contains "oauth2"',
                    'user.roles contains "api_user"',
                    'api.path matches "/api/v1/*"'
                ],
                'attributes': ['api.security', 'user.roles', 'api.path']
            })
        
        return suggestions
    
    async def get_connection_metadata(self, connection_id: int) -> Dict[str, Any]:
        """Get metadata for a specific connection"""
        connection = self.db.query(PIPConnection).filter(PIPConnection.id == connection_id).first()
        if not connection:
            raise ValueError(f"PIP connection {connection_id} not found")
        
        mappings = self.db.query(AttributeMapping).filter(
            AttributeMapping.connection_id == connection.id
        ).all()
        
        return {
            'connection_id': connection_id,
            'connection_name': connection.name,
            'provider': connection.provider,
            'connection_type': connection.connection_type,
            'attributes': [
                {
                    'target_attribute': mapping.target_attribute,
                    'source_attribute': mapping.source_attribute,
                    'data_type': mapping.data_type,
                    'is_required': mapping.is_required,
                    'is_sensitive': mapping.is_sensitive
                }
                for mapping in mappings
            ],
            'sync_frequency': connection.sync_frequency,
            'last_sync': connection.last_health_check.isoformat() if connection.last_health_check else None,
            'status': connection.health_status
        }
    
    async def export_corpus_for_llm(self, format: str = 'json') -> str:
        """Export metadata corpus in format suitable for LLM consumption"""
        corpus = await self.generate_metadata_corpus()
        
        if format.lower() == 'json':
            return json.dumps(corpus, indent=2, default=str)
        elif format.lower() == 'yaml':
            import yaml
            return yaml.dump(corpus, default_flow_style=False)
        else:
            raise ValueError(f"Unsupported format: {format}")

# Global instance (will be initialized with proper dependencies)
metadata_corpus_service = None

def initialize_metadata_corpus_service(db: Session):
    """Initialize metadata corpus service with dependencies"""
    global metadata_corpus_service
    metadata_corpus_service = MetadataCorpusService(db)
