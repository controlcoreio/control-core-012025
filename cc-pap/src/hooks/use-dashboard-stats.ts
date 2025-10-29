import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/app';
import { SecureStorage } from '@/utils/secureStorage';

interface DashboardStats {
  totalPolicies: number;
  activePolicies: number;
  draftPolicies: number;
  deployedPEPs: number;
  operationalPEPs: number;
  warningPEPs: number;
  smartConnections: number;
  activeConnections: number;
  pendingConnections: number;
  authDecisions24h: number;
  allowedPercentage: number;
  deniedPercentage: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPolicies: 0,
    activePolicies: 0,
    draftPolicies: 0,
    deployedPEPs: 0,
    operationalPEPs: 0,
    warningPEPs: 0,
    smartConnections: 0,
    activeConnections: 0,
    pendingConnections: 0,
    authDecisions24h: 0,
    allowedPercentage: 0,
    deniedPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = SecureStorage.getItem('access_token');
        
        // Don't fetch if user is not authenticated
        if (!token) {
          console.log('[Dashboard Stats] User not authenticated, skipping fetch');
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`${APP_CONFIG.api.baseUrl}/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}

