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
        
        // Don't fetch if user is not authenticated
        if (!token) {
          console.log('[PEPs] User not authenticated, skipping fetch');
          setIsLoading(false);
          setPEPs([]); // Set empty array
          return;
        }
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${APP_CONFIG.api.baseUrl}/peps`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            console.error('[PEPs] Unauthorized - token may be expired');
            setError('Unauthorized');
          } else {
            throw new Error(`Failed to fetch PEPs: ${response.status}`);
          }
          setPEPs([]);
          return;
        }

        const data = await response.json();
        setPEPs(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching PEPs:', err);
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError('Unable to load configurations. Please try again.');
        }
        setPEPs([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPEPs();
  }, []);

  return { peps, isLoading, error, setPEPs };
}

