import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/app';
import { SecureStorage } from '@/utils/secureStorage';

interface ProtectedResource {
  id: number;
  name: string;
  url: string;
  original_host: string;
  original_host_production: string;
  default_security_posture: string;
  description: string;
  environment: string;
  created_at: string;
  updated_at: string;
  
  // Auto-discovery fields
  auto_discovered: boolean;
  discovered_at?: string;
  bouncer_id?: number;
  
  // Enrichment fields
  business_context?: string;
  data_classification?: string;
  compliance_tags?: string[];
  cost_center?: string;
  owner_email?: string;
  owner_team?: string;
  sla_tier?: string;
  data_residency?: string;
  audit_level?: string;
}

export function useResources(environment?: string) {
  const [resources, setResources] = useState<ProtectedResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const token = SecureStorage.getItem('access_token');
        
        // Don't fetch if user is not authenticated
        if (!token) {
          console.log('[Resources] User not authenticated, skipping fetch');
          setIsLoading(false);
          return;
        }
        
        // Build URL with optional environment filter
        let url = `${APP_CONFIG.api.baseUrl}/resources`;
        if (environment) {
          url += `?environment=${environment}`;
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }

        const data = await response.json();
        setResources(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [environment]);

  return { resources, isLoading, error, setResources };
}

