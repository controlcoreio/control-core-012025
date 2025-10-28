
export type GatewayType = "Kong" | "Tyk" | "Azure API Management" | "AWS API Gateway" | "Google Apigee" | "Custom API Gateway";

export interface PEPGatewayConfig {
  interceptAll: boolean;
  specificPaths?: string[];
  httpMethods?: string[];
  controlActions?: string[];
}

export interface GatewayConnection {
  id: string;
  name: string;
  type: GatewayType;
  endpoint: string;
  authType: string;
  authDetails: Record<string, any>;
  status: "connected" | "error" | "pending";
  pdpQueryEndpoint?: string;
  additionalHeaders?: Record<string, string>;
  pepConfig?: PEPGatewayConfig;
}

export type AIAgentType = "OpenAI" | "Custom LLM" | "Azure AI" | "Anthropic" | "Google Gemini" | "Robotics Platform" | "Other";

export interface PEPAgentConfig {
  interceptAll: boolean;
  specificEndpoints?: string[];
  messageTypes?: string[];
  controlActions?: string[];
}

export interface AIAgentConnection {
  id: string;
  name: string;
  type: AIAgentType;
  status: "connected" | "error" | "pending";
  protocol?: "REST" | "gRPC" | "WebSocket" | "Other";
  authEndpoint?: string;
  apiKey?: string;
  customConfig?: Record<string, string>;
  pepConfig?: PEPAgentConfig;
}

export type MCPType = "MQTT" | "CoAP" | "AMQP" | "DDS" | "Other" | "AI Agent MCP" | "IoT Device";
export type MCPAuthMethod = "TLS Certificate" | "Username/Password" | "API Key" | "OAuth" | "None";

export interface MCPConnection {
  id: string;
  name: string;
  type: MCPType;
  endpoint: string;
  status: "connected" | "error" | "pending";
  authMethod: MCPAuthMethod;
  authDetails: Record<string, string>;
  pdpQueryEndpoint?: string;
  deviceIdMethod?: string;
  aiAgentName?: string;
}

export type A2AType = "gRPC" | "REST" | "WebSocket" | "Google Agent to Agent" | "Other";
export type A2AAuthMethod = "Mutual TLS" | "JWT" | "API Key" | "Custom Headers" | "OAuth" | "Service Account" | "None";

export interface A2AConnection {
  id: string;
  name: string;
  type: A2AType;
  serviceEndpoints: string[];
  status: "connected" | "error" | "pending";
  authMethod: A2AAuthMethod;
  authDetails: Record<string, any>;
  interceptorEndpoint?: string;
  sourceAgent?: string;
  destinationAgent?: string;
  authorizationScope?: string;
  trustConfiguration?: string;
}

export type ResourceType = 
  | "APIs" 
  | "AI Agents" 
  | "Model Context Protocol (MCP) for AI Agents" 
  | "IoT Devices" 
  | "Google Agent to Agent (A2A)" 
  | "Datalakes" 
  | "Databases"
  | "Network Endpoints";

export interface IntegratedResource {
  type: ResourceType;
  count: number;
  status: "active" | "inactive" | "partial";
}
