/**
 * Shared React hooks for Control Core API
 * Used by both cc-pap and cc-pap-pro-tenant frontends
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { create_api_service, get_default_api_service } from './api_service';
import type { 
  Policy, 
  User, 
  Environment, 
  Resource, 
  PEP, 
  PIP, 
  AuditLog, 
  Decision,
  DashboardMetrics,
  AuthorizationActivity,
  PEPStatus,
  TopPolicy,
  PolicyTemplate,
  HealthStatus,
  ApiResponse,
  PaginatedResponse
} from './api';

// Generic hook for API calls with error handling
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: () => fetchData() };
}

// Policy hooks
export function usePolicies(params?: { skip?: number; limit?: number; status?: string; environment?: string }) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['policies', params],
    queryFn: () => api.get_policies(
      skip=params?.skip || 0,
      limit=params?.limit || 100,
      status=params?.status,
      environment=params?.environment
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePolicy(policyId: string) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['policy', policyId],
    queryFn: () => api.get_policy(policyId),
    enabled: !!policyId,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: (policyData: Partial<Policy>) => api.create_policy(policyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Policy> }) => 
      api.update_policy(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['policy', id] });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: (policyId: string) => api.delete_policy(policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}

export function useEnablePolicy() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: (policyId: string) => api.enable_policy(policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}

export function useDisablePolicy() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: (policyId: string) => api.disable_policy(policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}

// Resource hooks
export function useResources(params?: { skip?: number; limit?: number }) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['resources', params],
    queryFn: () => api.get_resources(
      skip=params?.skip || 0,
      limit=params?.limit || 100
    ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useResource(resourceId: string) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['resource', resourceId],
    queryFn: () => api.get_resource(resourceId),
    enabled: !!resourceId,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: (resourceData: Partial<Resource>) => api.create_resource(resourceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Resource> }) => 
      api.update_resource(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource', id] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: (resourceId: string) => api.delete_resource(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

// User hooks
export function useUsers(params?: { skip?: number; limit?: number }) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => api.get_users(
      skip=params?.skip || 0,
      limit=params?.limit || 100
    ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUser(userId: string) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.get_user(userId),
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: (userData: Partial<User>) => api.create_user(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => 
      api.update_user(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const api = get_default_api_service();
  
  return useMutation({
    mutationFn: (userId: string) => api.delete_user(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Environment hooks
export function useEnvironments() {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['environments'],
    queryFn: () => api.get_environments(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useEnvironment(environmentId: string) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['environment', environmentId],
    queryFn: () => api.get_environment(environmentId),
    enabled: !!environmentId,
  });
}

// PEP hooks
export function usePEPs() {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['peps'],
    queryFn: () => api.get_peps(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePEP(pepId: string) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['pep', pepId],
    queryFn: () => api.get_pep(pepId),
    enabled: !!pepId,
  });
}

// PIP hooks
export function usePIPs() {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['pips'],
    queryFn: () => api.get_pips(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePIP(pipId: string) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['pip', pipId],
    queryFn: () => api.get_pip(pipId),
    enabled: !!pipId,
  });
}

// Audit hooks
export function useAuditLogs(params?: { 
  skip?: number; 
  limit?: number; 
  startDate?: string; 
  endDate?: string;
  outcome?: string;
  resourceId?: string;
}) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => api.get_audit_logs(
      skip=params?.skip || 0,
      limit=params?.limit || 100,
      start_date=params?.startDate,
      end_date=params?.endDate,
      outcome=params?.outcome,
      resource_id=params?.resourceId
    ),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Dashboard hooks
export function useDashboardMetrics() {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get_dashboard_metrics(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useAuthorizationActivity(params?: { period?: string }) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['authorization-activity', params],
    queryFn: () => api.get_authorization_activity(period=params?.period),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function usePEPStatus() {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['pep-status'],
    queryFn: () => api.get_pep_status(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useTopPolicies(params?: { limit?: number }) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['top-policies', params],
    queryFn: () => api.get_top_policies(limit=params?.limit || 10),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Decisions hooks
export function useDecisions(params?: { 
  skip?: number; 
  limit?: number; 
  resourceId?: string;
  outcome?: string;
}) {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['decisions', params],
    queryFn: () => api.get_decisions(
      skip=params?.skip || 0,
      limit=params?.limit || 100,
      resource_id=params?.resourceId,
      outcome=params?.outcome
    ),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Health check hook
export function useHealth() {
  const api = get_default_api_service();
  
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.get_health(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}