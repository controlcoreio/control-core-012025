/**
 * Mock Data - Minimal Exports for Backward Compatibility
 * 
 * This file previously contained mock data for development.
 * All mock data has been removed in favor of real API integrations.
 * Empty exports are maintained for backward compatibility only.
 * 
 * Migration: All components should use API hooks from services/useApi.ts
 */

// Empty exports for backward compatibility
export const ALL_POLICY_TEMPLATES: any[] = [];
export const MOCK_CONTROLLED_RESOURCES: any[] = [];
export const POLICY_TEMPLATES: any[] = [];
export const MOCK_FLOW_NODES: any[] = [];
export const MOCK_FLOW_EDGES: any[] = [];
export const MOCK_LEAST_PRIVILEGE_RECOMMENDATIONS: any[] = [];
export const MOCK_HISTORICAL_BUNDLES: any[] = [];
export const MOCK_PIP_SOURCES: any[] = [];
export const MOCK_POLICY_CONFLICTS: any[] = [];
export const MOCK_AUDIT_LOGS: any[] = [];
export const MOCK_POLICIES: any[] = [];
export const MOCK_CROSS_SCOPE_CONFLICTS: any[] = [];
export const MOCK_TARGET_ENVIRONMENTS: any[] = [];
export const MOCK_POLICY_BUNDLES: any[] = [];
export const MOCK_APPROVERS: any[] = [];

// Category colors for UI (not mock data, keep this)
export const CATEGORY_COLORS = {
  'Security': 'red',
  'Compliance': 'blue',
  'Data': 'green',
  'Privacy': 'purple',
  'Governance': 'indigo'
};

// Types
export interface MockUser {
  id: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  role: string;
  status: string;
  permissions?: string[];
  mfaEnabled?: boolean;
  subscriptionTier?: string;
  deploymentModel?: string;
  githubRepo?: string;
}

export interface MockPolicy {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface MockControlledAPI {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface MockFlowNode {
  id: string;
  type: string;
  data: any;
}

export interface MockFlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface MockLeastPrivilegeRecommendation {
  id: string;
  title: string;
  description: string;
  priority: string;
}

export interface MockHistoricalBundle {
  id: string;
  name: string;
  version: string;
  timestamp: string;
}

export interface MockPIPSource {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface MockPolicyConflict {
  id: string;
  policy1: string;
  policy2: string;
  conflict: string;
}

export interface MockAuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

export interface MockCrossScopeConflict {
  id: string;
  scope1: string;
  scope2: string;
  conflict: string;
}

// Helper functions - deprecated, use API services instead
export function getAvailableResourcesByDeployment() {
  console.warn('getAvailableResourcesByDeployment is deprecated. Use useResources() hook from services/useApi.ts');
  return [];
}

export function addControlledResource(resource: MockControlledAPI) {
  console.warn('addControlledResource is deprecated. Use API endpoint: POST /api/resources');
  // No-op in production
}
