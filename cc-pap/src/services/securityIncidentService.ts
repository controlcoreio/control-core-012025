/**
 * Security Incident Service for PAP UI
 * Integrates security incidents from PAP, bouncer, OPAL, and business-admin components
 */

import { useAuth } from "@/hooks/use-auth";

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "investigating" | "resolved" | "false_positive";
  component: "pap" | "bouncer" | "opal" | "business_admin";
  incidentType: string;
  detectedAt: string;
  detectedBy?: string;
  affectedSystems: string[];
  affectedUsers: string[];
  responseActions: string[];
  crmTicketId?: string;
  slaDeadline?: string;
  isOverdue?: boolean;
  tenantId?: string;
  indicators?: Record<string, any>;
  timeline?: Array<{
    timestamp: string;
    action: string;
    actor: string;
    details: string;
  }>;
}

export interface ComponentHealth {
  name: string;
  component: "pap" | "bouncer" | "opal" | "business_admin";
  status: "healthy" | "warning" | "critical" | "unknown";
  lastIncident?: string;
  activeIncidents: number;
  totalIncidents: number;
  lastHealthCheck?: string;
  uptime?: number;
}

export interface SecurityMetrics {
  totalIncidents: number;
  criticalIncidents: number;
  activeIncidents: number;
  overdueIncidents: number;
  resolvedIncidents: number;
  averageResponseTime: number;
  slaCompliance: number;
}

export interface IncidentFilter {
  severity?: string[];
  status?: string[];
  component?: string[];
  incidentType?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

class SecurityIncidentService {
  private baseUrl: string;
  private authToken?: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all security incidents for the current tenant
   */
  async getIncidents(filter?: IncidentFilter): Promise<SecurityIncident[]> {
    const params = new URLSearchParams();
    
    if (filter?.severity?.length) {
      params.append('severity', filter.severity.join(','));
    }
    if (filter?.status?.length) {
      params.append('status', filter.status.join(','));
    }
    if (filter?.component?.length) {
      params.append('component', filter.component.join(','));
    }
    if (filter?.incidentType?.length) {
      params.append('incidentType', filter.incidentType.join(','));
    }
    if (filter?.dateRange) {
      params.append('start_date', filter.dateRange.start);
      params.append('end_date', filter.dateRange.end);
    }

    const endpoint = `/api/security/incidents${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<SecurityIncident[]>(endpoint);
  }

  /**
   * Get a specific incident by ID
   */
  async getIncident(incidentId: string): Promise<SecurityIncident> {
    return this.makeRequest<SecurityIncident>(`/api/security/incidents/${incidentId}`);
  }

  /**
   * Get component health status
   */
  async getComponentHealth(): Promise<ComponentHealth[]> {
    return this.makeRequest<ComponentHealth[]>('/api/security/components/health');
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(dateRange?: { start: string; end: string }): Promise<SecurityMetrics> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start_date', dateRange.start);
      params.append('end_date', dateRange.end);
    }

    const endpoint = `/api/security/metrics${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<SecurityMetrics>(endpoint);
  }

  /**
   * Update incident status
   */
  async updateIncidentStatus(
    incidentId: string,
    status: SecurityIncident['status'],
    notes?: string
  ): Promise<SecurityIncident> {
    return this.makeRequest<SecurityIncident>(`/api/security/incidents/${incidentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  /**
   * Assign incident to user
   */
  async assignIncident(
    incidentId: string,
    assignee: string
  ): Promise<SecurityIncident> {
    return this.makeRequest<SecurityIncident>(`/api/security/incidents/${incidentId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignee }),
    });
  }

  /**
   * Add comment to incident
   */
  async addIncidentComment(
    incidentId: string,
    comment: string
  ): Promise<void> {
    await this.makeRequest(`/api/security/incidents/${incidentId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  /**
   * Get incidents from specific component
   */
  async getComponentIncidents(
    component: "pap" | "bouncer" | "opal" | "business_admin",
    limit?: number
  ): Promise<SecurityIncident[]> {
    const params = new URLSearchParams();
    params.append('component', component);
    if (limit) {
      params.append('limit', limit.toString());
    }

    return this.makeRequest<SecurityIncident[]>(`/api/security/incidents?${params.toString()}`);
  }

  /**
   * Get real-time incident updates via WebSocket
   */
  subscribeToIncidents(
    onUpdate: (incident: SecurityIncident) => void,
    onError?: (error: Error) => void
  ): () => void {
    const wsUrl = `${this.baseUrl.replace('http', 'ws')}/ws/security/incidents`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to security incidents WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const incident = JSON.parse(event.data) as SecurityIncident;
        onUpdate(incident);
      } catch (error) {
        console.error('Failed to parse incident update:', error);
        onError?.(error as Error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error as any);
    };

    ws.onclose = () => {
      console.log('Disconnected from security incidents WebSocket');
    };

    // Return cleanup function
    return () => {
      ws.close();
    };
  }

  /**
   * Test alert configuration
   */
  async testAlert(
    alertType: string,
    severity: "critical" | "high" | "medium" | "low"
  ): Promise<void> {
    await this.makeRequest('/api/security/alerts/test', {
      method: 'POST',
      body: JSON.stringify({ alertType, severity }),
    });
  }

  /**
   * Get incident statistics for dashboard
   */
  async getIncidentStatistics(): Promise<{
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    byComponent: Record<string, number>;
    byType: Record<string, number>;
    trends: Array<{
      date: string;
      incidents: number;
      resolved: number;
    }>;
  }> {
    return this.makeRequest('/api/security/statistics');
  }

  /**
   * Export incidents to CSV
   */
  async exportIncidents(filter?: IncidentFilter): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filter?.severity?.length) {
      params.append('severity', filter.severity.join(','));
    }
    if (filter?.status?.length) {
      params.append('status', filter.status.join(','));
    }
    if (filter?.component?.length) {
      params.append('component', filter.component.join(','));
    }
    if (filter?.dateRange) {
      params.append('start_date', filter.dateRange.start);
      params.append('end_date', filter.dateRange.end);
    }

    const response = await fetch(
      `${this.baseUrl}/api/security/incidents/export${params.toString() ? `?${params.toString()}` : ''}`,
      {
        headers: {
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Get incident response templates
   */
  async getResponseTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    incidentTypes: string[];
    actions: string[];
    escalationRules: Record<string, any>;
  }>> {
    return this.makeRequest('/api/security/response-templates');
  }

  /**
   * Create custom incident response template
   */
  async createResponseTemplate(template: {
    name: string;
    description: string;
    incidentTypes: string[];
    actions: string[];
    escalationRules: Record<string, any>;
  }): Promise<void> {
    await this.makeRequest('/api/security/response-templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }
}

// Create singleton instance
export const securityIncidentService = new SecurityIncidentService();

// Hook for using the service
export function useSecurityIncidents() {
  const { user } = useAuth();

  // Set auth token when user changes
  React.useEffect(() => {
    if (user?.token) {
      securityIncidentService.setAuthToken(user.token);
    }
  }, [user?.token]);

  return securityIncidentService;
}

// Utility functions
export const formatIncidentSeverity = (severity: string) => {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
};

export const formatIncidentStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getIncidentIcon = (incidentType: string) => {
  const icons = {
    data_breach: '🔓',
    unauthorized_access: '🚫',
    policy_violation: '⚠️',
    system_compromise: '💥',
    network_intrusion: '🌐',
    account_compromise: '👤',
    sync_failure: '🔄',
    vulnerability_detected: '🛡️',
    data_access_anomaly: '📊',
  };
  return icons[incidentType as keyof typeof icons] || '🔍';
};

export const getSeverityColor = (severity: string) => {
  const colors = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-blue-600 bg-blue-50 border-blue-200',
  };
  return colors[severity as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
};

export const isIncidentOverdue = (slaDeadline?: string) => {
  if (!slaDeadline) return false;
  return new Date() > new Date(slaDeadline);
};

export const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }
};
