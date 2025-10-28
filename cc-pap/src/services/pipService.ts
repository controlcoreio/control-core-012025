/**
 * PIP (Policy Information Point) Service
 * Handles all API calls for data source management
 */

import { APP_CONFIG } from '@/config/app';

export interface PIPConnection {
  id: number;
  name: string;
  description?: string;
  connection_type: string;
  provider: string;
  configuration: Record<string, any>;
  credentials: Record<string, any>;
  health_check_url?: string;
  sync_enabled: boolean;
  sync_frequency: string;
  status: 'connected' | 'error' | 'inactive';
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  last_health_check?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AttributeMapping {
  id: number;
  connection_id: number;
  source_attribute: string;
  target_attribute: string;
  transformation_rule?: string;
  is_required: boolean;
  is_sensitive: boolean;
  data_type: string;
  validation_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PIPSyncLog {
  id: number;
  connection_id: number;
  sync_type: string;
  status: 'running' | 'completed' | 'failed';
  records_processed: number;
  records_synced: number;
  records_failed: number;
  duration_seconds: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface TestConnectionRequest {
  connection_type: string;
  provider: string;
  configuration: Record<string, any>;
  credentials: Record<string, any>;
}

export interface TestConnectionResponse {
  success: boolean;
  status: string;
  response_time: number;
  error_message?: string;
  details: Record<string, any>;
  tested_at: string;
}

export interface HealthCheckResponse {
  connection_id: number;
  status: string;
  response_time: number;
  error_message?: string;
  checked_at: string;
  details: Record<string, any>;
}

export interface SyncResponse {
  connection_id: number;
  sync_id: number;
  status: string;
  records_processed: number;
  records_synced: number;
  records_failed: number;
  duration_seconds: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface PIPConnectionCreate {
  name: string;
  description?: string;
  connection_type: string;
  provider: string;
  configuration: Record<string, any>;
  credentials: Record<string, any>;
  health_check_url?: string;
  sync_enabled: boolean;
  sync_frequency: string;
}

export interface PIPConnectionUpdate {
  name?: string;
  description?: string;
  configuration?: Record<string, any>;
  credentials?: Record<string, any>;
  health_check_url?: string;
  sync_enabled?: boolean;
  sync_frequency?: string;
}

const API_BASE_URL = APP_CONFIG.api.baseUrl;

class PIPService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`PIP API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Connection Management
  async getConnections(params?: {
    connection_type?: string;
    provider?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<PIPConnection[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    return this.request<PIPConnection[]>(`/pip/connections${queryString ? `?${queryString}` : ''}`);
  }

  async getConnection(connectionId: number): Promise<PIPConnection> {
    return this.request<PIPConnection>(`/pip/connections/${connectionId}`);
  }

  async createConnection(connection: PIPConnectionCreate): Promise<PIPConnection> {
    return this.request<PIPConnection>('/pip/connections', {
      method: 'POST',
      body: JSON.stringify(connection),
    });
  }

  async updateConnection(connectionId: number, update: PIPConnectionUpdate): Promise<PIPConnection> {
    return this.request<PIPConnection>(`/pip/connections/${connectionId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  }

  async deleteConnection(connectionId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/pip/connections/${connectionId}`, {
      method: 'DELETE',
    });
  }

  // Connection Testing
  async testConnection(testRequest: TestConnectionRequest): Promise<TestConnectionResponse> {
    return this.request<TestConnectionResponse>('/pip/connections/test', {
      method: 'POST',
      body: JSON.stringify(testRequest),
    });
  }

  async healthCheckConnection(connectionId: number): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>(`/pip/connections/${connectionId}/health-check`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Attribute Mappings
  async getAttributeMappings(connectionId: number): Promise<AttributeMapping[]> {
    return this.request<AttributeMapping[]>(`/pip/connections/${connectionId}/mappings`);
  }

  async createAttributeMapping(connectionId: number, mapping: Omit<AttributeMapping, 'id' | 'connection_id' | 'created_at' | 'updated_at'>): Promise<AttributeMapping> {
    return this.request<AttributeMapping>(`/pip/connections/${connectionId}/mappings`, {
      method: 'POST',
      body: JSON.stringify(mapping),
    });
  }

  async updateAttributeMapping(mappingId: number, update: Partial<AttributeMapping>): Promise<AttributeMapping> {
    return this.request<AttributeMapping>(`/pip/mappings/${mappingId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  }

  async deleteAttributeMapping(mappingId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/pip/mappings/${mappingId}`, {
      method: 'DELETE',
    });
  }

  // Data Synchronization
  async syncConnection(connectionId: number, syncType: string = 'full', force: boolean = false): Promise<SyncResponse> {
    return this.request<SyncResponse>(`/pip/connections/${connectionId}/sync`, {
      method: 'POST',
      body: JSON.stringify({ sync_type: syncType, force }),
    });
  }

  async getSyncLogs(connectionId: number, params?: { skip?: number; limit?: number }): Promise<PIPSyncLog[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    return this.request<PIPSyncLog[]>(`/pip/connections/${connectionId}/sync-logs${queryString ? `?${queryString}` : ''}`);
  }

  // Sensitive Data Management
  async fetchSensitiveAttributes(
    connectionId: number,
    requiredAttributes: string[],
    userId: string,
    requestId?: string
  ): Promise<{
    connection_id: number;
    attributes: Record<string, any>;
    fetched_at: string;
    request_id?: string;
  }> {
    return this.request(`/pip/connections/${connectionId}/fetch-sensitive-attributes`, {
      method: 'POST',
      body: JSON.stringify({
        required_attributes: requiredAttributes,
        user_id: userId,
        request_id: requestId,
      }),
    });
  }

  async getAuditLogs(
    connectionId: number,
    params?: {
      user_id?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{
    connection_id: number;
    audit_logs: any[];
    total_logs: number;
    filtered_by: Record<string, any>;
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
    }
    
    const queryString = searchParams.toString();
    return this.request(`/pip/connections/${connectionId}/audit-logs${queryString ? `?${queryString}` : ''}`);
  }

  async clearCache(connectionId: number): Promise<{
    connection_id: number;
    message: string;
    cleared_at: string;
  }> {
    return this.request(`/pip/connections/${connectionId}/clear-cache`, {
      method: 'DELETE',
    });
  }

  async getCacheStatistics(connectionId: number): Promise<{
    connection_id: number;
    cache_statistics: any;
    retrieved_at: string;
  }> {
    return this.request(`/pip/connections/${connectionId}/cache-statistics`);
  }

  async testSensitiveFetch(
    connectionId: number,
    testAttributes: string[],
    userId: string
  ): Promise<{
    connection_id: number;
    test_results: Record<string, any>;
    test_attributes: string[];
    tested_at: string;
    user_id: string;
  }> {
    return this.request(`/pip/connections/${connectionId}/test-sensitive-fetch`, {
      method: 'POST',
      body: JSON.stringify({
        test_attributes: testAttributes,
        user_id: userId,
      }),
    });
  }

  // Integration Templates
  async getIntegrationTemplates(params?: {
    connection_type?: string;
    provider?: string;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
    }
    
    const queryString = searchParams.toString();
    return this.request(`/pip/templates${queryString ? `?${queryString}` : ''}`);
  }

  async getIntegrationTemplate(templateId: number): Promise<any> {
    return this.request(`/pip/templates/${templateId}`);
  }

  // OPAL Integration
  async getOPALSources(): Promise<any[]> {
    return this.request('/pip/opal/sources');
  }

  async publishToOPAL(connectionId: number): Promise<{ message: string }> {
    return this.request(`/pip/opal/publish/${connectionId}`, {
      method: 'POST',
    });
  }

  async getDataSnapshot(connectionId: number): Promise<any> {
    return this.request(`/pip/connections/${connectionId}/data-snapshot`);
  }

  // Webhook Receiver (for IDP events)
  async handleWebhook(connectionId: number, eventData: any): Promise<{ message: string }> {
    return this.request(`/pip/webhooks/${connectionId}`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }
}

export const pipService = new PIPService();
export default pipService;
