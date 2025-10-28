/**
 * API Type Definitions for Control Core Frontend
 * Replaces mock data interfaces with real API response types
 */

// Policy types
export interface Policy {
  id: string;
  name: string;
  description: string;
  status: "enabled" | "disabled" | "draft" | "archived";
  sandboxStatus: "enabled" | "disabled" | "draft" | "not-promoted";
  productionStatus: "enabled" | "disabled" | "not-promoted";
  scope: string[];
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  lastModified: string;
  version: string;
  effect: "allow" | "deny";
  resourceId: string;
  updatedAt: string;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  lastLogin: string | Date;
  mfaEnabled: boolean;
  username: string;
  permissions?: string[];
  subscriptionTier?: 'kickstart' | 'pro' | 'custom' | null;
  deploymentModel?: 'hosted' | 'self-hosted' | null;
  githubRepo?: string;
}

// Environment types
export interface Environment {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  pdpCount?: number;
  type: string;
}

// PDP (Policy Decision Point) types
export interface PDP {
  id: string;
  status: string;
  environment: string;
  currentLoad?: number;
  associatedResources?: number;
}

// Resource types
export interface Resource {
  id: string;
  name: string;
  url: string;
  originalHost?: string;
  originalHostProduction?: string;
  defaultSecurityPosture: "allow-all" | "deny-all";
  description: string;
}

// PEP (Policy Enforcement Point) types
export interface PEP {
  id: string;
  name: string;
  status: "active" | "inactive" | "degraded" | "critical";
  environment: string;
  endpoint: string;
  description?: string;
  lastCheckIn?: string;
  avgLatency?: number;
  requestVolume?: number;
  denialRate?: number;
}

// PIP (Policy Information Point) types
export interface PIP {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  status: "active" | "inactive";
  description?: string;
  attributes: string[];
  caching: {
    enabled: boolean;
    ttl: number;
    refreshInterval: number;
  };
  auth: {
    type: string;
    apiKey?: string;
    username?: string;
    password?: string;
  };
}

// Audit log types
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  outcome: "ALLOWED" | "DENIED" | "ALLOWED_BY_DEFAULT";
  reason: string;
  ipAddress: string;
  userAgent: string;
  environment: string;
}

// Decision types
export interface Decision {
  id: string;
  timestamp: Date;
  resourceId: string;
  userId: string;
  action: string;
  outcome: "ALLOWED" | "DENIED";
  reason: string;
  policyId?: string;
  environment: string;
}

// Dashboard metrics types
export interface DashboardMetrics {
  totalPolicies: number;
  activePolicies: number;
  totalResources: number;
  totalUsers: number;
  totalDecisions: number;
  allowedDecisions: number;
  deniedDecisions: number;
  avgLatency: number;
  systemHealth: "healthy" | "degraded" | "critical";
}

// Authorization activity types
export interface AuthorizationActivity {
  timestamp: string;
  allowed: number;
  denied: number;
  total: number;
}

// PEP status types
export interface PEPStatus {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "critical";
  avgLatency: number;
  requestVolume: number;
  denialRate: number;
}

// Top policies types
export interface TopPolicy {
  id: string;
  name: string;
  decisionCount: number;
  allowCount: number;
  denyCount: number;
  lastUsed: string;
}

// Policy template types
export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  content: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  useCases: string[];
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Health check types
export interface HealthStatus {
  status: "healthy" | "degraded" | "critical";
  services: {
    database: "up" | "down";
    redis: "up" | "down";
    opa: "up" | "down";
    opal: "up" | "down";
  };
  uptime: number;
  version: string;
}
