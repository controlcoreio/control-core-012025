import { useState, useEffect, useCallback } from 'react';
import { APP_CONFIG } from '@/config/app';
import { SecureStorage } from '@/utils/secureStorage';

export interface PIPAttribute {
  label: string;
  source: string;
  source_id: number;
  source_type: string;
  source_field: string;
  type: string;
  description: string;
  is_sensitive: boolean;
  path: string;
  last_sync: string | null;
}

export interface PIPAttributesResult {
  attributes: PIPAttribute[];
  total_count: number;
  connections_count: number;
}

export function usePIPAttributes() {
  const [attributes, setAttributes] = useState<PIPAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttributes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = SecureStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${APP_CONFIG.api.baseUrl}/pip/attributes/autocomplete`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load PIP attributes: ${response.statusText}`);
      }

      const data: PIPAttributesResult = await response.json();
      setAttributes(data.attributes || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load PIP attributes';
      setError(errorMessage);
      console.error('Error loading PIP attributes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttributes();
  }, [loadAttributes]);

  const refresh = useCallback(() => {
    return loadAttributes();
  }, [loadAttributes]);

  const getAttributesBySource = useCallback((sourceId: number) => {
    return attributes.filter(attr => attr.source_id === sourceId);
  }, [attributes]);

  const getAttributesByType = useCallback((type: string) => {
    return attributes.filter(attr => attr.source_type === type);
  }, [attributes]);

  const searchAttributes = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return attributes.filter(attr => 
      attr.label.toLowerCase().includes(lowerQuery) ||
      attr.description.toLowerCase().includes(lowerQuery) ||
      attr.source.toLowerCase().includes(lowerQuery)
    );
  }, [attributes]);

  return {
    attributes,
    loading,
    error,
    refresh,
    getAttributesBySource,
    getAttributesByType,
    searchAttributes
  };
}

