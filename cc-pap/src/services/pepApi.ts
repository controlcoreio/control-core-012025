import { APP_CONFIG } from '@/config/app';
import { SecureStorage } from '@/utils/secureStorage';

interface PEPConfigData {
  // Basic fields
  name?: string;
  deployment_mode?: string;
  target_url?: string;
  proxy_url?: string;
  
  // DNS Configuration
  dns_domain?: string;
  dns_subdomain?: string;
  dns_provider?: string;
  dns_ttl?: number;
  dns_cname_record?: string;
  dns_a_record?: string;
  
  // SSL Configuration
  ssl_enabled?: boolean;
  ssl_certificate_type?: string;
  ssl_certificate_path?: string;
  ssl_key_path?: string;
  ssl_auto_renew?: boolean;
  
  // Traffic Configuration
  ingress_enabled?: boolean;
  egress_enabled?: boolean;
  rate_limit_per_minute?: number;
  max_connections?: number;
  timeout_seconds?: number;
  retry_attempts?: number;
}

interface IndividualPEPConfigData {
  assigned_policy_bundles?: string[];
  mcp_header_name?: string;
  mcp_injection_enabled?: boolean;
  upstream_target_url?: string;
  public_proxy_url?: string;
  proxy_timeout?: number;
  resource_identification_rules?: Array<{
    type: string;
    value: string;
    resource_name: string;
  }>;
  cache_enabled?: boolean;
  cache_ttl?: number;
  cache_max_size?: number;
  cache_invalidation_strategy?: string;
  circuit_breaker_enabled?: boolean;
  circuit_breaker_failure_threshold?: number;
  circuit_breaker_success_threshold?: number;
  circuit_breaker_timeout?: number;
  load_balancing_algorithm?: string;
  sticky_sessions_enabled?: boolean;
  policy_update_interval_override?: number;
  fail_policy_override?: string;
  rate_limit_override?: number;
}

interface GlobalPEPConfigData {
  default_proxy_domain?: string;
  control_plane_url?: string;
  policy_update_interval?: number;
  bundle_download_timeout?: number;
  policy_checksum_validation?: boolean;
  decision_log_export_enabled?: boolean;
  decision_log_batch_size?: number;
  decision_log_flush_interval?: number;
  metrics_export_enabled?: boolean;
  fail_policy?: string;
  default_security_posture?: string;
  default_rate_limit?: number;
  default_timeout?: number;
  max_connections?: number;
  auto_ssl_enabled?: boolean;
  mutual_tls_required?: boolean;
}

const getAuthHeaders = () => {
  const token = SecureStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const pepApi = {
  /**
   * Save basic PEP configuration (deployment, DNS, SSL, traffic settings)
   */
  async savePEPBasicConfiguration(pepId: number, config: PEPConfigData) {
    const response = await fetch(
      `${APP_CONFIG.api.baseUrl}/peps/${pepId}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(config)
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to save configuration' }));
      throw new Error(error.detail || 'Failed to save configuration');
    }

    return await response.json();
  },

  /**
   * Save advanced individual PEP configuration (policies, MCP, cache, circuit breaker, etc.)
   */
  async saveIndividualPEPConfiguration(pepId: number, config: IndividualPEPConfigData) {
    const response = await fetch(
      `${APP_CONFIG.api.baseUrl}/pep-config/individual/${pepId}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(config)
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to save advanced configuration' }));
      throw new Error(error.detail || 'Failed to save advanced configuration');
    }

    return await response.json();
  },

  /**
   * Save complete PEP configuration (both basic and advanced)
   */
  async saveCompletePEPConfiguration(
    pepId: number,
    basicConfig: PEPConfigData,
    advancedConfig: IndividualPEPConfigData
  ) {
    // Save basic configuration first
    await this.savePEPBasicConfiguration(pepId, basicConfig);
    
    // Then save advanced configuration
    await this.saveIndividualPEPConfiguration(pepId, advancedConfig);
  },

  /**
   * Save global PEP configuration
   */
  async saveGlobalConfiguration(config: GlobalPEPConfigData) {
    const response = await fetch(
      `${APP_CONFIG.api.baseUrl}/pep-config/global`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(config)
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to save global configuration' }));
      throw new Error(error.detail || 'Failed to save global configuration');
    }

    return await response.json();
  },

  /**
   * Fetch all PEPs
   */
  async fetchPEPs(environment?: string) {
    const url = new URL(`${APP_CONFIG.api.baseUrl}/peps`);
    if (environment) {
      url.searchParams.append('environment', environment);
    }

    const response = await fetch(url.toString(), {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch PEPs');
    }

    return await response.json();
  }
};

export type { PEPConfigData, IndividualPEPConfigData, GlobalPEPConfigData };

