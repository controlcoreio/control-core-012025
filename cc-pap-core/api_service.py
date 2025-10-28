"""
Control Core API Service Layer
Centralized API service for both cc-pap and cc-pap-pro-tenant frontends
"""

import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import os

@dataclass
class APIConfig:
    """API configuration for different deployment modes"""
    base_url: str
    api_key: Optional[str] = None
    tenant_id: Optional[str] = None
    headers: Optional[Dict[str, str]] = None

class ControlCoreAPIService:
    """Centralized API service for Control Core frontends"""
    
    def __init__(self, config: APIConfig):
        self.config = config
        self.session = requests.Session()
        
        # Set default headers
        default_headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        if config.headers:
            default_headers.update(config.headers)
            
        if config.api_key:
            default_headers['Authorization'] = f'Bearer {config.api_key}'
            
        if config.tenant_id:
            default_headers['X-Tenant-ID'] = config.tenant_id
            
        self.session.headers.update(default_headers)
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{self.config.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {str(e)}")
    
    # Policy Management
    def get_policies(self, skip: int = 0, limit: int = 100, status: Optional[str] = None, environment: Optional[str] = None) -> Dict[str, Any]:
        """Get policies with optional filtering"""
        params = {'skip': skip, 'limit': limit}
        if status:
            params['status'] = status
        if environment:
            params['environment'] = environment
            
        return self._make_request('GET', '/api/v1/policies', params=params)
    
    def get_policy(self, policy_id: str) -> Dict[str, Any]:
        """Get specific policy by ID"""
        return self._make_request('GET', f'/api/v1/policies/{policy_id}')
    
    def create_policy(self, policy_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new policy"""
        return self._make_request('POST', '/api/v1/policies', json=policy_data)
    
    def update_policy(self, policy_id: str, policy_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing policy"""
        return self._make_request('PUT', f'/api/v1/policies/{policy_id}', json=policy_data)
    
    def delete_policy(self, policy_id: str) -> Dict[str, Any]:
        """Delete policy"""
        return self._make_request('DELETE', f'/api/v1/policies/{policy_id}')
    
    def enable_policy(self, policy_id: str) -> Dict[str, Any]:
        """Enable policy"""
        return self._make_request('POST', f'/api/v1/policies/{policy_id}/enable')
    
    def disable_policy(self, policy_id: str) -> Dict[str, Any]:
        """Disable policy"""
        return self._make_request('POST', f'/api/v1/policies/{policy_id}/disable')
    
    # Resource Management
    def get_resources(self, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
        """Get resources"""
        params = {'skip': skip, 'limit': limit}
        return self._make_request('GET', '/api/v1/resources', params=params)
    
    def get_resource(self, resource_id: str) -> Dict[str, Any]:
        """Get specific resource by ID"""
        return self._make_request('GET', f'/api/v1/resources/{resource_id}')
    
    def create_resource(self, resource_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new resource"""
        return self._make_request('POST', '/api/v1/resources', json=resource_data)
    
    def update_resource(self, resource_id: str, resource_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing resource"""
        return self._make_request('PUT', f'/api/v1/resources/{resource_id}', json=resource_data)
    
    def delete_resource(self, resource_id: str) -> Dict[str, Any]:
        """Delete resource"""
        return self._make_request('DELETE', f'/api/v1/resources/{resource_id}')
    
    # User Management
    def get_users(self, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
        """Get users"""
        params = {'skip': skip, 'limit': limit}
        return self._make_request('GET', '/api/v1/users', params=params)
    
    def get_user(self, user_id: str) -> Dict[str, Any]:
        """Get specific user by ID"""
        return self._make_request('GET', f'/api/v1/users/{user_id}')
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new user"""
        return self._make_request('POST', '/api/v1/users', json=user_data)
    
    def update_user(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing user"""
        return self._make_request('PUT', f'/api/v1/users/{user_id}', json=user_data)
    
    def delete_user(self, user_id: str) -> Dict[str, Any]:
        """Delete user"""
        return self._make_request('DELETE', f'/api/v1/users/{user_id}')
    
    # Environment Management
    def get_environments(self) -> Dict[str, Any]:
        """Get environments"""
        return self._make_request('GET', '/api/v1/environments')
    
    def get_environment(self, environment_id: str) -> Dict[str, Any]:
        """Get specific environment by ID"""
        return self._make_request('GET', f'/api/v1/environments/{environment_id}')
    
    # PEP Management
    def get_peps(self) -> Dict[str, Any]:
        """Get PEPs (Policy Enforcement Points)"""
        return self._make_request('GET', '/api/v1/peps')
    
    def get_pep(self, pep_id: str) -> Dict[str, Any]:
        """Get specific PEP by ID"""
        return self._make_request('GET', f'/api/v1/peps/{pep_id}')
    
    # PIP Management
    def get_pips(self) -> Dict[str, Any]:
        """Get PIPs (Policy Information Points)"""
        return self._make_request('GET', '/api/v1/pips')
    
    def get_pip(self, pip_id: str) -> Dict[str, Any]:
        """Get specific PIP by ID"""
        return self._make_request('GET', f'/api/v1/pips/{pip_id}')
    
    # Audit Logs
    def get_audit_logs(self, skip: int = 0, limit: int = 100, start_date: Optional[str] = None, 
                      end_date: Optional[str] = None, outcome: Optional[str] = None, 
                      resource_id: Optional[str] = None) -> Dict[str, Any]:
        """Get audit logs with optional filtering"""
        params = {'skip': skip, 'limit': limit}
        if start_date:
            params['start_date'] = start_date
        if end_date:
            params['end_date'] = end_date
        if outcome:
            params['outcome'] = outcome
        if resource_id:
            params['resource_id'] = resource_id
            
        return self._make_request('GET', '/api/v1/audit/logs', params=params)
    
    # Dashboard & Monitoring
    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get dashboard metrics"""
        return self._make_request('GET', '/api/v1/dashboard/metrics')
    
    def get_authorization_activity(self, period: Optional[str] = None) -> Dict[str, Any]:
        """Get authorization activity data"""
        params = {}
        if period:
            params['period'] = period
        return self._make_request('GET', '/api/v1/dashboard/authorization-activity', params=params)
    
    def get_pep_status(self) -> Dict[str, Any]:
        """Get PEP status"""
        return self._make_request('GET', '/api/v1/dashboard/pep-status')
    
    def get_top_policies(self, limit: int = 10) -> Dict[str, Any]:
        """Get top policies by usage"""
        params = {'limit': limit}
        return self._make_request('GET', '/api/v1/dashboard/top-policies', params=params)
    
    # Decisions
    def get_decisions(self, skip: int = 0, limit: int = 100, resource_id: Optional[str] = None, 
                     outcome: Optional[str] = None) -> Dict[str, Any]:
        """Get decisions with optional filtering"""
        params = {'skip': skip, 'limit': limit}
        if resource_id:
            params['resource_id'] = resource_id
        if outcome:
            params['outcome'] = outcome
            
        return self._make_request('GET', '/api/v1/decisions', params=params)
    
    # Health Check
    def get_health(self) -> Dict[str, Any]:
        """Get system health status"""
        return self._make_request('GET', '/health')

# Factory function to create API service based on deployment mode
def create_api_service(deployment_mode: str = "custom", **kwargs) -> ControlCoreAPIService:
    """
    Create API service based on deployment mode
    
    Args:
        deployment_mode: "custom" for self-hosted, "pro" for hosted
        **kwargs: Additional configuration parameters
    """
    
    if deployment_mode == "pro":
        # Pro plan - hosted Control Plane
        base_url = kwargs.get('base_url', 'https://app.controlcore.io')
        api_key = kwargs.get('api_key')
        tenant_id = kwargs.get('tenant_id')
        
        config = APIConfig(
            base_url=base_url,
            api_key=api_key,
            tenant_id=tenant_id,
            headers={'X-Deployment-Mode': 'pro'}
        )
        
    else:
        # Custom/Kickstart plan - self-hosted
        base_url = kwargs.get('base_url', 'http://localhost:8000')
        api_key = kwargs.get('api_key')
        
        config = APIConfig(
            base_url=base_url,
            api_key=api_key,
            headers={'X-Deployment-Mode': 'custom'}
        )
    
    return ControlCoreAPIService(config)

# Default API service instance
def get_default_api_service() -> ControlCoreAPIService:
    """Get default API service based on environment variables"""
    deployment_mode = os.getenv('CONTROL_CORE_DEPLOYMENT_MODE', 'custom')
    base_url = os.getenv('CONTROL_CORE_API_URL')
    api_key = os.getenv('CONTROL_CORE_API_KEY')
    tenant_id = os.getenv('CONTROL_CORE_TENANT_ID')
    
    return create_api_service(
        deployment_mode=deployment_mode,
        base_url=base_url,
        api_key=api_key,
        tenant_id=tenant_id
    )
