import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/app';
import { SecureStorage } from '@/utils/secureStorage';

interface Policy {
  id: number;
  name: string;
  description: string;
  status: string;
  sandbox_status: string;
  production_status: string;
  scope: string[];
  effect: string;
  resource_id: string;
  version: string;
  created_by: string;
  modified_by: string;
  created_at: string;
  last_modified: string;
}

interface UsePoliciesOptions {
  status?: string;
  environment?: string;
  limit?: number;
  skip?: number;
}

export function usePolicies(options: UsePoliciesOptions = {}) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const token = SecureStorage.getItem('access_token');
        const params = new URLSearchParams();
        
        if (options.status) params.append('status', options.status);
        if (options.environment) params.append('environment', options.environment);
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.skip) params.append('skip', options.skip.toString());
        
        const response = await fetch(
          `${APP_CONFIG.api.baseUrl}/policies?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch policies');
        }

        const data = await response.json();
        setPolicies(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching policies:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, [options.status, options.environment, options.limit, options.skip]);

  return { policies, isLoading, error };
}

export function usePolicyTemplates(category?: string) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const params = new URLSearchParams();
        
        if (category) params.append('category', category);
        
        // Templates endpoint is public, no authentication required
        const response = await fetch(
          `${APP_CONFIG.api.baseUrl}/policies/templates/?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch policy templates');
        }

        const data = await response.json();
        setTemplates(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching policy templates:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [category]);

  return { templates, isLoading, error };
}

