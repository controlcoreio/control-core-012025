import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/app';
import { SecureStorage } from '@/utils/secureStorage';

interface PIPConnection {
  id: number;
  name: string;
  connection_type: string;
  provider: string;
  endpoint: string;
  status: string;
  health_status: string;
  last_sync: string | null;
  sync_frequency: number;
  attributes_available: string[];
  data_sensitivity: string;
  cache_strategy: string;
  cache_ttl: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function usePIPConnections() {
  const [connections, setConnections] = useState<PIPConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const token = SecureStorage.getItem('access_token');
        
        const response = await fetch(`${APP_CONFIG.api.baseUrl}/pip/connections`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch PIP connections');
        }

        const data = await response.json();
        setConnections(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching PIP connections:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnections();
  }, []);

  return { connections, isLoading, error };
}

