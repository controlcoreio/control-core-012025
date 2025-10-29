import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/app';
import { SecureStorage } from '@/utils/secureStorage';

interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  result: string;
  event_type: string;
  outcome: string;
  policy_name: string | null;
  reason: string | null;
  source_ip: string | null;
}

interface UseAuditLogsOptions {
  limit?: number;
  skip?: number;
  eventType?: string;
  outcome?: string;
  user?: string;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = SecureStorage.getItem('access_token');
        
        // Don't fetch if user is not authenticated
        if (!token) {
          console.log('[Audit Logs] User not authenticated, skipping fetch');
          setIsLoading(false);
          return;
        }
        
        const params = new URLSearchParams();
        
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.skip) params.append('skip', options.skip.toString());
        if (options.eventType) params.append('event_type', options.eventType);
        if (options.outcome) params.append('outcome', options.outcome);
        if (options.user) params.append('user', options.user);
        
        const response = await fetch(
          `${APP_CONFIG.api.baseUrl}/audit/logs?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated - don't show error, just return empty logs
            setLogs([]);
            setError(null);
            return;
          }
          throw new Error('Failed to fetch audit logs');
        }

        const data = await response.json();
        setLogs(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        // Don't set error for network issues - just return empty logs
        setLogs([]);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [options.limit, options.skip, options.eventType, options.outcome, options.user]);

  return { logs, isLoading, error };
}

