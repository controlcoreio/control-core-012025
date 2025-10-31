import { useState, useCallback } from 'react';
import { pepApi, PEPConfigData, IndividualPEPConfigData, GlobalPEPConfigData } from '@/services/pepApi';

interface ValidationErrors {
  [key: string]: string;
}

interface BouncerConfiguration {
  id: string;
  name: string;
  deploymentMode: 'reverse-proxy' | 'sidecar';
  targetUrl: string;
  proxyUrl: string;
  dnsConfig: {
    domain: string;
    subdomain: string;
    dnsProvider: string;
    ttl: number;
  };
  sslConfig: {
    enabled: boolean;
    certificateType: string;
    autoRenew: boolean;
  };
  trafficConfig: {
    ingressEnabled: boolean;
    egressEnabled: boolean;
    rateLimitPerMinute: number;
    maxConnections: number;
    timeoutSeconds: number;
    retryAttempts: number;
  };
  policies: string[];
  isEnabled: boolean;
}

/**
 * Hook for managing individual bouncer configuration
 */
export function usePEPConfig(pepId?: number) {
  const [config, setConfig] = useState<BouncerConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateURL = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validatePositiveNumber = (value: number): boolean => {
    return value > 0;
  };

  const validate = useCallback((cfg: BouncerConfiguration): ValidationErrors => {
    const validationErrors: ValidationErrors = {};

    if (!cfg.name || cfg.name.trim() === '') {
      validationErrors.name = 'Bouncer name is required';
    }

    if (cfg.targetUrl && !validateURL(cfg.targetUrl)) {
      validationErrors.targetUrl = 'Invalid target URL format';
    }

    if (cfg.proxyUrl && !validateURL(cfg.proxyUrl)) {
      validationErrors.proxyUrl = 'Invalid proxy URL format';
    }

    if (!validatePositiveNumber(cfg.trafficConfig.rateLimitPerMinute)) {
      validationErrors.rateLimitPerMinute = 'Rate limit must be a positive number';
    }

    if (!validatePositiveNumber(cfg.trafficConfig.maxConnections)) {
      validationErrors.maxConnections = 'Max connections must be a positive number';
    }

    if (!validatePositiveNumber(cfg.trafficConfig.timeoutSeconds)) {
      validationErrors.timeoutSeconds = 'Timeout must be a positive number';
    }

    if (cfg.trafficConfig.retryAttempts < 0) {
      validationErrors.retryAttempts = 'Retry attempts cannot be negative';
    }

    return validationErrors;
  }, []);

  const save = useCallback(async (cfg: BouncerConfiguration) => {
    if (!pepId) {
      throw new Error('PEP ID is required');
    }

    // Validate
    const validationErrors = validate(cfg);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      throw new Error('Validation failed');
    }

    setIsSaving(true);
    setErrors({});

    try {
      // Prepare basic configuration
      const basicConfig: PEPConfigData = {
        name: cfg.name,
        deployment_mode: cfg.deploymentMode,
        target_url: cfg.targetUrl || undefined,
        proxy_url: cfg.proxyUrl || undefined,
        dns_domain: cfg.dnsConfig.domain || undefined,
        dns_subdomain: cfg.dnsConfig.subdomain || undefined,
        dns_provider: cfg.dnsConfig.dnsProvider,
        dns_ttl: cfg.dnsConfig.ttl,
        ssl_enabled: cfg.sslConfig.enabled,
        ssl_certificate_type: cfg.sslConfig.certificateType,
        ssl_auto_renew: cfg.sslConfig.autoRenew,
        ingress_enabled: cfg.trafficConfig.ingressEnabled,
        egress_enabled: cfg.trafficConfig.egressEnabled,
        rate_limit_per_minute: cfg.trafficConfig.rateLimitPerMinute,
        max_connections: cfg.trafficConfig.maxConnections,
        timeout_seconds: cfg.trafficConfig.timeoutSeconds,
        retry_attempts: cfg.trafficConfig.retryAttempts,
      };

      // Prepare advanced configuration
      const advancedConfig: IndividualPEPConfigData = {
        assigned_policy_bundles: cfg.policies,
        upstream_target_url: cfg.targetUrl || undefined,
        public_proxy_url: cfg.proxyUrl || undefined,
      };

      // Save both configurations
      await pepApi.saveCompletePEPConfiguration(pepId, basicConfig, advancedConfig);

      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [pepId, validate]);

  const updateConfig = useCallback((updates: Partial<BouncerConfiguration>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
    // Clear related errors
    Object.keys(updates).forEach(key => {
      if (errors[key]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }
    });
  }, [errors]);

  return {
    config,
    setConfig,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    errors,
    setErrors,
    validate,
    save,
    updateConfig,
  };
}

/**
 * Hook for managing global PEP configuration
 */
export function useGlobalPEPConfig() {
  const [config, setConfig] = useState<GlobalPEPConfigData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (cfg: GlobalPEPConfigData) => {
    setIsSaving(true);
    setError(null);

    try {
      await pepApi.saveGlobalConfiguration(cfg);
      setHasUnsavedChanges(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save global configuration';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateConfig = useCallback((updates: Partial<GlobalPEPConfigData>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  return {
    config,
    setConfig,
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    error,
    save,
    updateConfig,
  };
}

