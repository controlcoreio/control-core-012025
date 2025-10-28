"""
AI Integration Service for Control Core
Allows customers to connect their own LLM services to enhance Control Core capabilities
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
import httpx
import logging
from enum import Enum

logger = logging.getLogger(__name__)

class LLMProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    AZURE_OPENAI = "azure_openai"
    AWS_BEDROCK = "aws_bedrock"
    GOOGLE_AI = "google_ai"
    COHERE = "cohere"
    CUSTOM = "custom"

class AIUseCase(str, Enum):
    """AI use cases in Control Core"""
    REGO_EDITOR = "rego_editor"
    POLICY_WIZARD = "policy_wizard"
    CONFLICT_DETECTION = "conflict_detection"
    COMPLIANCE_ANALYSIS = "compliance_analysis"
    PIP_SUGGESTIONS = "pip_suggestions"
    POLICY_OPTIMIZATION = "policy_optimization"

class ComplianceFramework(str, Enum):
    """Supported compliance frameworks"""
    GDPR = "gdpr"
    PIPEDA = "pipeda"
    SOC2 = "soc2"
    CCPA = "ccpa"
    HIPAA = "hipaa"
    PCI_DSS = "pci_dss"
    ISO27001 = "iso27001"

class AIConfiguration:
    """AI service configuration"""
    
    def __init__(self, provider: LLMProvider, api_key: str, base_url: str = None, 
                 model: str = None, max_tokens: int = 4000, temperature: float = 0.1,
                 enabled_use_cases: List[AIUseCase] = None, cost_limits: Dict = None):
        self.provider = provider
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.enabled_use_cases = enabled_use_cases or []
        self.cost_limits = cost_limits or {}
        self.is_enabled = True
        self.last_used = None
        self.usage_stats = {
            "total_requests": 0,
            "total_tokens": 0,
            "total_cost": 0.0,
            "requests_by_use_case": {}
        }

class AIRequest:
    """AI service request"""
    
    def __init__(self, use_case: AIUseCase, prompt: str, context: Dict = None, 
                 max_tokens: int = None, temperature: float = None):
        self.use_case = use_case
        self.prompt = prompt
        self.context = context or {}
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.timestamp = datetime.now()
        self.request_id = f"ai_req_{int(time.time())}"

class AIResponse:
    """AI service response"""
    
    def __init__(self, content: str, usage: Dict = None, cost: float = 0.0, 
                 suggestions: List[str] = None, confidence: float = 0.0):
        self.content = content
        self.usage = usage or {}
        self.cost = cost
        self.suggestions = suggestions or []
        self.confidence = confidence
        self.timestamp = datetime.now()

class AIIntegrationService:
    """Service for integrating customer LLM services"""
    
    def __init__(self):
        self.configurations: Dict[str, AIConfiguration] = {}
        self.client = httpx.AsyncClient(timeout=60.0)
        self.logger = logging.getLogger(__name__)
        self._load_default_configurations()
    
    def _load_default_configurations(self):
        """Load default AI configurations"""
        # Default configurations for common providers
        self.configurations["default_openai"] = AIConfiguration(
            provider=LLMProvider.OPENAI,
            api_key="",
            model="gpt-4",
            enabled_use_cases=[AIUseCase.REGO_EDITOR, AIUseCase.POLICY_WIZARD]
        )
        
        self.configurations["default_anthropic"] = AIConfiguration(
            provider=LLMProvider.ANTHROPIC,
            api_key="",
            model="claude-3-sonnet-20240229",
            enabled_use_cases=[AIUseCase.REGO_EDITOR, AIUseCase.POLICY_WIZARD]
        )
    
    async def configure_ai_service(self, config_id: str, config: AIConfiguration) -> bool:
        """Configure an AI service"""
        try:
            # Test the configuration
            test_success = await self._test_ai_configuration(config)
            if not test_success:
                return False
            
            self.configurations[config_id] = config
            self.logger.info(f"AI_INTEGRATION: Configured AI service {config_id} with provider {config.provider}")
            return True
            
        except Exception as e:
            self.logger.error(f"AI_INTEGRATION: Failed to configure AI service: {e}")
            return False
    
    async def _test_ai_configuration(self, config: AIConfiguration) -> bool:
        """Test AI configuration"""
        try:
            test_prompt = "Hello, this is a test message. Please respond with 'OK'."
            response = await self._make_ai_request(config, AIRequest(
                use_case=AIUseCase.REGO_EDITOR,
                prompt=test_prompt
            ))
            return response is not None
        except Exception as e:
            self.logger.error(f"AI_INTEGRATION: Configuration test failed: {e}")
            return False
    
    async def get_rego_suggestions(self, code: str, cursor_position: int, 
                                 config_id: str = "default") -> AIResponse:
        """Get Rego code suggestions for the editor"""
        try:
            config = self.configurations.get(config_id)
            if not config or AIUseCase.REGO_EDITOR not in config.enabled_use_cases:
                return AIResponse(content="AI assistance not available")
            
            prompt = self._build_rego_editor_prompt(code, cursor_position)
            
            response = await self._make_ai_request(config, AIRequest(
                use_case=AIUseCase.REGO_EDITOR,
                prompt=prompt,
                context={"code": code, "cursor_position": cursor_position}
            ))
            
            return response
            
        except Exception as e:
            self.logger.error(f"AI_INTEGRATION: Failed to get Rego suggestions: {e}")
            return AIResponse(content="Error generating suggestions")
    
    async def get_policy_wizard_suggestions(self, requirements: Dict, 
                                          config_id: str = "default") -> AIResponse:
        """Get policy wizard suggestions"""
        try:
            config = self.configurations.get(config_id)
            if not config or AIUseCase.POLICY_WIZARD not in config.enabled_use_cases:
                return AIResponse(content="AI assistance not available")
            
            prompt = self._build_policy_wizard_prompt(requirements)
            
            response = await self._make_ai_request(config, AIRequest(
                use_case=AIUseCase.POLICY_WIZARD,
                prompt=prompt,
                context={"requirements": requirements}
            ))
            
            return response
            
        except Exception as e:
            self.logger.error(f"AI_INTEGRATION: Failed to get policy wizard suggestions: {e}")
            return AIResponse(content="Error generating wizard suggestions")
    
    async def analyze_policy_conflicts(self, policies: List[Dict], 
                                     config_id: str = "default") -> AIResponse:
        """Analyze policy conflicts"""
        try:
            config = self.configurations.get(config_id)
            if not config or AIUseCase.CONFLICT_DETECTION not in config.enabled_use_cases:
                return AIResponse(content="AI assistance not available")
            
            prompt = self._build_conflict_analysis_prompt(policies)
            
            response = await self._make_ai_request(config, AIRequest(
                use_case=AIUseCase.CONFLICT_DETECTION,
                prompt=prompt,
                context={"policies": policies}
            ))
            
            return response
            
        except Exception as e:
            self.logger.error(f"AI_INTEGRATION: Failed to analyze policy conflicts: {e}")
            return AIResponse(content="Error analyzing policy conflicts")
    
    async def get_compliance_suggestions(self, resource_info: Dict, 
                                       frameworks: List[ComplianceFramework],
                                       config_id: str = "default") -> AIResponse:
        """Get compliance framework suggestions"""
        try:
            config = self.configurations.get(config_id)
            if not config or AIUseCase.COMPLIANCE_ANALYSIS not in config.enabled_use_cases:
                return AIResponse(content="AI assistance not available")
            
            prompt = self._build_compliance_prompt(resource_info, frameworks)
            
            response = await self._make_ai_request(config, AIRequest(
                use_case=AIUseCase.COMPLIANCE_ANALYSIS,
                prompt=prompt,
                context={"resource_info": resource_info, "frameworks": frameworks}
            ))
            
            return response
            
        except Exception as e:
            self.logger.error(f"AI_INTEGRATION: Failed to get compliance suggestions: {e}")
            return AIResponse(content="Error generating compliance suggestions")
    
    async def get_pip_suggestions(self, pip_sources: List[Dict], 
                                context: Dict, config_id: str = "default") -> AIResponse:
        """Get PIP attribute and parameter suggestions"""
        try:
            config = self.configurations.get(config_id)
            if not config or AIUseCase.PIP_SUGGESTIONS not in config.enabled_use_cases:
                return AIResponse(content="AI assistance not available")
            
            prompt = self._build_pip_suggestions_prompt(pip_sources, context)
            
            response = await self._make_ai_request(config, AIRequest(
                use_case=AIUseCase.PIP_SUGGESTIONS,
                prompt=prompt,
                context={"pip_sources": pip_sources, "context": context}
            ))
            
            return response
            
        except Exception as e:
            self.logger.error(f"AI_INTEGRATION: Failed to get PIP suggestions: {e}")
            return AIResponse(content="Error generating PIP suggestions")
    
    async def _make_ai_request(self, config: AIConfiguration, request: AIRequest) -> AIResponse:
        """Make a request to the AI service"""
        try:
            # Update usage stats
            config.usage_stats["total_requests"] += 1
            config.usage_stats["requests_by_use_case"][request.use_case.value] = \
                config.usage_stats["requests_by_use_case"].get(request.use_case.value, 0) + 1
            config.last_used = datetime.now()
            
            # Prepare request based on provider
            if config.provider == LLMProvider.OPENAI:
                return await self._make_openai_request(config, request)
            elif config.provider == LLMProvider.ANTHROPIC:
                return await self._make_anthropic_request(config, request)
            elif config.provider == LLMProvider.AZURE_OPENAI:
                return await self._make_azure_openai_request(config, request)
            elif config.provider == LLMProvider.CUSTOM:
                return await self._make_custom_request(config, request)
            else:
                raise ValueError(f"Unsupported provider: {config.provider}")
                
        except Exception as e:
            self.logger.error(f"AI_INTEGRATION: AI request failed: {e}")
            return AIResponse(content="AI request failed")
    
    async def _make_openai_request(self, config: AIConfiguration, request: AIRequest) -> AIResponse:
        """Make OpenAI API request"""
        url = f"{config.base_url or 'https://api.openai.com/v1'}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": config.model,
            "messages": [
                {"role": "system", "content": self._get_system_prompt(request.use_case)},
                {"role": "user", "content": request.prompt}
            ],
            "max_tokens": request.max_tokens or config.max_tokens,
            "temperature": request.temperature or config.temperature
        }
        
        response = await self.client.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        usage = result.get("usage", {})
        
        # Calculate cost (approximate)
        cost = self._calculate_openai_cost(usage, config.model)
        
        return AIResponse(
            content=content,
            usage=usage,
            cost=cost
        )
    
    async def _make_anthropic_request(self, config: AIConfiguration, request: AIRequest) -> AIResponse:
        """Make Anthropic API request"""
        url = f"{config.base_url or 'https://api.anthropic.com/v1'}/messages"
        
        headers = {
            "x-api-key": config.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        data = {
            "model": config.model,
            "max_tokens": request.max_tokens or config.max_tokens,
            "temperature": request.temperature or config.temperature,
            "messages": [
                {"role": "user", "content": f"{self._get_system_prompt(request.use_case)}\n\n{request.prompt}"}
            ]
        }
        
        response = await self.client.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        content = result["content"][0]["text"]
        usage = result.get("usage", {})
        
        # Calculate cost (approximate)
        cost = self._calculate_anthropic_cost(usage, config.model)
        
        return AIResponse(
            content=content,
            usage=usage,
            cost=cost
        )
    
    async def _make_custom_request(self, config: AIConfiguration, request: AIRequest) -> AIResponse:
        """Make custom API request"""
        url = config.base_url
        
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "prompt": request.prompt,
            "max_tokens": request.max_tokens or config.max_tokens,
            "temperature": request.temperature or config.temperature,
            "context": request.context
        }
        
        response = await self.client.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        content = result.get("content", result.get("text", ""))
        usage = result.get("usage", {})
        cost = result.get("cost", 0.0)
        
        return AIResponse(
            content=content,
            usage=usage,
            cost=cost
        )
    
    def _get_system_prompt(self, use_case: AIUseCase) -> str:
        """Get system prompt for specific use case"""
        prompts = {
            AIUseCase.REGO_EDITOR: """You are an expert in Rego policy language. Provide helpful suggestions for Rego code completion, syntax corrections, and best practices. Focus on security and access control policies.""",
            
            AIUseCase.POLICY_WIZARD: """You are a policy expert specializing in access control and security policies. Help users create effective policies based on their requirements. Consider security best practices and compliance requirements.""",
            
            AIUseCase.CONFLICT_DETECTION: """You are a policy analysis expert. Analyze policies for conflicts, redundancies, and potential security issues. Provide clear explanations and recommendations for resolution.""",
            
            AIUseCase.COMPLIANCE_ANALYSIS: """You are a compliance expert specializing in data protection and security frameworks. Analyze resources and suggest policies that align with compliance requirements like GDPR, PIPEDA, SOC2, CCPA, etc.""",
            
            AIUseCase.PIP_SUGGESTIONS: """You are an expert in identity and access management systems. Suggest relevant attributes and parameters from IAM, ERP, CRM systems for policy creation.""",
            
            AIUseCase.POLICY_OPTIMIZATION: """You are a policy optimization expert. Analyze existing policies and suggest improvements for performance, security, and maintainability."""
        }
        
        return prompts.get(use_case, "You are a helpful AI assistant.")
    
    def _build_rego_editor_prompt(self, code: str, cursor_position: int) -> str:
        """Build prompt for Rego editor suggestions"""
        return f"""Analyze this Rego policy code and provide suggestions for completion at cursor position {cursor_position}:

```rego
{code}
```

Provide:
1. Code completion suggestions
2. Syntax corrections if needed
3. Best practices recommendations
4. Security considerations

Format your response as JSON with fields: suggestions, corrections, best_practices, security_notes."""
    
    def _build_policy_wizard_prompt(self, requirements: Dict) -> str:
        """Build prompt for policy wizard suggestions"""
        return f"""Based on these policy requirements, suggest a Rego policy:

Requirements: {json.dumps(requirements, indent=2)}

Provide:
1. A complete Rego policy
2. Explanation of the policy logic
3. Security considerations
4. Testing recommendations

Format your response as JSON with fields: policy, explanation, security_notes, test_cases."""
    
    def _build_conflict_analysis_prompt(self, policies: List[Dict]) -> str:
        """Build prompt for conflict analysis"""
        return f"""Analyze these policies for conflicts and issues:

Policies: {json.dumps(policies, indent=2)}

Provide:
1. Identified conflicts
2. Redundancies
3. Security issues
4. Recommendations for resolution

Format your response as JSON with fields: conflicts, redundancies, security_issues, recommendations."""
    
    def _build_compliance_prompt(self, resource_info: Dict, frameworks: List[ComplianceFramework]) -> str:
        """Build prompt for compliance analysis"""
        return f"""Analyze this resource for compliance with these frameworks:

Resource: {json.dumps(resource_info, indent=2)}
Frameworks: {[f.value for f in frameworks]}

Provide:
1. Compliance requirements for each framework
2. Suggested policies
3. Risk assessments
4. Implementation recommendations

Format your response as JSON with fields: compliance_requirements, suggested_policies, risk_assessment, implementation_guide."""
    
    def _build_pip_suggestions_prompt(self, pip_sources: List[Dict], context: Dict) -> str:
        """Build prompt for PIP suggestions"""
        return f"""Based on these PIP sources and context, suggest relevant attributes and parameters:

PIP Sources: {json.dumps(pip_sources, indent=2)}
Context: {json.dumps(context, indent=2)}

Provide:
1. Relevant attributes from each source
2. Parameter mappings
3. Policy conditions using these attributes
4. Best practices for attribute usage

Format your response as JSON with fields: attributes, mappings, policy_conditions, best_practices."""
    
    def _calculate_openai_cost(self, usage: Dict, model: str) -> float:
        """Calculate OpenAI cost"""
        # Approximate costs per 1K tokens
        costs = {
            "gpt-4": {"input": 0.03, "output": 0.06},
            "gpt-4-turbo": {"input": 0.01, "output": 0.03},
            "gpt-3.5-turbo": {"input": 0.001, "output": 0.002}
        }
        
        model_costs = costs.get(model, {"input": 0.001, "output": 0.002})
        input_tokens = usage.get("prompt_tokens", 0)
        output_tokens = usage.get("completion_tokens", 0)
        
        cost = (input_tokens / 1000 * model_costs["input"]) + (output_tokens / 1000 * model_costs["output"])
        return cost
    
    def _calculate_anthropic_cost(self, usage: Dict, model: str) -> float:
        """Calculate Anthropic cost"""
        # Approximate costs per 1K tokens
        costs = {
            "claude-3-sonnet-20240229": {"input": 0.003, "output": 0.015},
            "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125}
        }
        
        model_costs = costs.get(model, {"input": 0.001, "output": 0.005})
        input_tokens = usage.get("input_tokens", 0)
        output_tokens = usage.get("output_tokens", 0)
        
        cost = (input_tokens / 1000 * model_costs["input"]) + (output_tokens / 1000 * model_costs["output"])
        return cost
    
    def get_usage_stats(self, config_id: str = None) -> Dict:
        """Get usage statistics"""
        if config_id:
            config = self.configurations.get(config_id)
            return config.usage_stats if config else {}
        
        # Aggregate stats for all configurations
        total_stats = {
            "total_requests": 0,
            "total_tokens": 0,
            "total_cost": 0.0,
            "configurations": {}
        }
        
        for cid, config in self.configurations.items():
            total_stats["total_requests"] += config.usage_stats["total_requests"]
            total_stats["total_tokens"] += config.usage_stats["total_tokens"]
            total_stats["total_cost"] += config.usage_stats["total_cost"]
            total_stats["configurations"][cid] = config.usage_stats
        
        return total_stats
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
