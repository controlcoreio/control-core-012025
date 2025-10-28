import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/app';
import { SecureStorage } from '@/utils/secureStorage';

interface PEP {
  id: number;
  name: string;
  status: string;
  environment: string;
  current_load: number;
  max_capacity: number;
  response_time: number;
  last_health_check: string | null;
  deployment_mode: string;
  target_url: string | null;
  proxy_url: string | null;
  bouncer_id: string | null;
  bouncer_version: string;
  resources_protected: number;
  requests_per_hour: number;
  dns_domain: string | null;
  dns_subdomain: string | null;
  dns_provider: string | null;
  ssl_enabled: boolean;
  ssl_certificate_type: string | null;
  is_connected: boolean;
  intercepting_traffic: boolean;
  last_heartbeat: string | null;
  created_at: string;
  updated_at: string;
}

export function usePEPs() {
  const [peps, setPEPs] = useState<PEP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPEPs = async () => {
      try {
        const token = SecureStorage.getItem('access_token');
        
        const response = await fetch(`${APP_CONFIG.api.baseUrl}/peps`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch PEPs');
        }

        const data = await response.json();
        setPEPs(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching PEPs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPEPs();
  }, []);

  return { peps, isLoading, error, setPEPs };
}

