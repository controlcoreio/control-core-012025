import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePEPConfig, useGlobalPEPConfig } from '@/hooks/use-pep-config';
import * as pepApi from '@/services/pepApi';

// Mock the pepApi module
vi.mock('@/services/pepApi', () => ({
  pepApi: {
    saveCompletePEPConfiguration: vi.fn(),
    saveGlobalConfiguration: vi.fn(),
    fetchPEPs: vi.fn(),
  },
}));

describe('usePEPConfig Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePEPConfig(1));

    expect(result.current.config).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.errors).toEqual({});
  });

  it('should validate configuration correctly', () => {
    const { result } = renderHook(() => usePEPConfig(1));

    const invalidConfig = {
      id: '1',
      name: '', // Invalid: empty name
      deploymentMode: 'reverse-proxy' as const,
      targetUrl: 'invalid-url', // Invalid: not a valid URL
      proxyUrl: '',
      dnsConfig: {
        domain: '',
        subdomain: '',
        dnsProvider: 'Cloudflare',
        ttl: 300,
      },
      sslConfig: {
        enabled: true,
        certificateType: 'letsencrypt',
        autoRenew: true,
      },
      trafficConfig: {
        ingressEnabled: true,
        egressEnabled: true,
        rateLimitPerMinute: -1, // Invalid: negative number
        maxConnections: 0, // Invalid: not positive
        timeoutSeconds: 30,
        retryAttempts: 3,
      },
      policies: [],
      isEnabled: true,
    };

    const errors = result.current.validate(invalidConfig);

    expect(errors.name).toBe('Bouncer name is required');
    expect(errors.targetUrl).toBe('Invalid target URL format');
    expect(errors.rateLimitPerMinute).toBe('Rate limit must be a positive number');
    expect(errors.maxConnections).toBe('Max connections must be a positive number');
  });

  it('should pass validation for valid configuration', () => {
    const { result } = renderHook(() => usePEPConfig(1));

    const validConfig = {
      id: '1',
      name: 'Test Bouncer',
      deploymentMode: 'reverse-proxy' as const,
      targetUrl: 'https://api.example.com',
      proxyUrl: 'https://bouncer.example.com',
      dnsConfig: {
        domain: 'example.com',
        subdomain: 'bouncer',
        dnsProvider: 'Cloudflare',
        ttl: 300,
      },
      sslConfig: {
        enabled: true,
        certificateType: 'letsencrypt',
        autoRenew: true,
      },
      trafficConfig: {
        ingressEnabled: true,
        egressEnabled: true,
        rateLimitPerMinute: 1000,
        maxConnections: 500,
        timeoutSeconds: 30,
        retryAttempts: 3,
      },
      policies: ['default'],
      isEnabled: true,
    };

    const errors = result.current.validate(validConfig);

    expect(Object.keys(errors).length).toBe(0);
  });

  it('should save configuration successfully', async () => {
    vi.mocked(pepApi.pepApi.saveCompletePEPConfiguration).mockResolvedValue({});

    const { result } = renderHook(() => usePEPConfig(1));

    const validConfig = {
      id: '1',
      name: 'Test Bouncer',
      deploymentMode: 'reverse-proxy' as const,
      targetUrl: 'https://api.example.com',
      proxyUrl: 'https://bouncer.example.com',
      dnsConfig: {
        domain: 'example.com',
        subdomain: 'bouncer',
        dnsProvider: 'Cloudflare',
        ttl: 300,
      },
      sslConfig: {
        enabled: true,
        certificateType: 'letsencrypt',
        autoRenew: true,
      },
      trafficConfig: {
        ingressEnabled: true,
        egressEnabled: true,
        rateLimitPerMinute: 1000,
        maxConnections: 500,
        timeoutSeconds: 30,
        retryAttempts: 3,
      },
      policies: ['default'],
      isEnabled: true,
    };

    await act(async () => {
      const saveResult = await result.current.save(validConfig);
      expect(saveResult).toBe(true);
    });

    expect(pepApi.pepApi.saveCompletePEPConfiguration).toHaveBeenCalledTimes(1);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should handle save errors', async () => {
    vi.mocked(pepApi.pepApi.saveCompletePEPConfiguration).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => usePEPConfig(1));

    const validConfig = {
      id: '1',
      name: 'Test Bouncer',
      deploymentMode: 'reverse-proxy' as const,
      targetUrl: 'https://api.example.com',
      proxyUrl: 'https://bouncer.example.com',
      dnsConfig: {
        domain: 'example.com',
        subdomain: 'bouncer',
        dnsProvider: 'Cloudflare',
        ttl: 300,
      },
      sslConfig: {
        enabled: true,
        certificateType: 'letsencrypt',
        autoRenew: true,
      },
      trafficConfig: {
        ingressEnabled: true,
        egressEnabled: true,
        rateLimitPerMinute: 1000,
        maxConnections: 500,
        timeoutSeconds: 30,
        retryAttempts: 3,
      },
      policies: ['default'],
      isEnabled: true,
    };

    await expect(async () => {
      await act(async () => {
        await result.current.save(validConfig);
      });
    }).rejects.toThrow('Network error');

    expect(result.current.isSaving).toBe(false);
  });

  it('should update config and set unsaved changes', () => {
    const { result } = renderHook(() => usePEPConfig(1));

    const initialConfig = {
      id: '1',
      name: 'Test Bouncer',
      deploymentMode: 'reverse-proxy' as const,
      targetUrl: 'https://api.example.com',
      proxyUrl: 'https://bouncer.example.com',
      dnsConfig: {
        domain: 'example.com',
        subdomain: 'bouncer',
        dnsProvider: 'Cloudflare',
        ttl: 300,
      },
      sslConfig: {
        enabled: true,
        certificateType: 'letsencrypt',
        autoRenew: true,
      },
      trafficConfig: {
        ingressEnabled: true,
        egressEnabled: true,
        rateLimitPerMinute: 1000,
        maxConnections: 500,
        timeoutSeconds: 30,
        retryAttempts: 3,
      },
      policies: ['default'],
      isEnabled: true,
    };

    act(() => {
      result.current.setConfig(initialConfig);
    });

    act(() => {
      result.current.updateConfig({ name: 'Updated Bouncer' });
    });

    expect(result.current.config?.name).toBe('Updated Bouncer');
    expect(result.current.hasUnsavedChanges).toBe(true);
  });
});

describe('useGlobalPEPConfig Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty config', () => {
    const { result } = renderHook(() => useGlobalPEPConfig());

    expect(result.current.config).toEqual({});
    expect(result.current.isSaving).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should save global configuration successfully', async () => {
    vi.mocked(pepApi.pepApi.saveGlobalConfiguration).mockResolvedValue({});

    const { result } = renderHook(() => useGlobalPEPConfig());

    const globalConfig = {
      default_proxy_domain: 'bouncer.example.com',
      control_plane_url: 'https://api.example.com',
      policy_update_interval: 30,
    };

    await act(async () => {
      const saveResult = await result.current.save(globalConfig);
      expect(saveResult).toBe(true);
    });

    expect(pepApi.pepApi.saveGlobalConfiguration).toHaveBeenCalledWith(globalConfig);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should handle save errors', async () => {
    vi.mocked(pepApi.pepApi.saveGlobalConfiguration).mockRejectedValue(
      new Error('Failed to save')
    );

    const { result } = renderHook(() => useGlobalPEPConfig());

    const globalConfig = {
      default_proxy_domain: 'bouncer.example.com',
    };

    await expect(async () => {
      await act(async () => {
        await result.current.save(globalConfig);
      });
    }).rejects.toThrow('Failed to save');

    expect(result.current.error).toBe('Failed to save');
    expect(result.current.isSaving).toBe(false);
  });

  it('should update config and set unsaved changes', () => {
    const { result } = renderHook(() => useGlobalPEPConfig());

    act(() => {
      result.current.updateConfig({
        default_proxy_domain: 'bouncer.example.com',
      });
    });

    expect(result.current.config.default_proxy_domain).toBe('bouncer.example.com');
    expect(result.current.hasUnsavedChanges).toBe(true);
  });
});

// Validation Tests
describe('Configuration Validation', () => {
  it('should validate URL format', () => {
    const { result } = renderHook(() => usePEPConfig(1));

    const configWithInvalidURL = {
      id: '1',
      name: 'Test',
      deploymentMode: 'reverse-proxy' as const,
      targetUrl: 'not-a-url',
      proxyUrl: '',
      dnsConfig: {
        domain: '',
        subdomain: '',
        dnsProvider: 'Cloudflare',
        ttl: 300,
      },
      sslConfig: {
        enabled: true,
        certificateType: 'letsencrypt',
        autoRenew: true,
      },
      trafficConfig: {
        ingressEnabled: true,
        egressEnabled: true,
        rateLimitPerMinute: 1000,
        maxConnections: 500,
        timeoutSeconds: 30,
        retryAttempts: 3,
      },
      policies: [],
      isEnabled: true,
    };

    const errors = result.current.validate(configWithInvalidURL);
    expect(errors.targetUrl).toBe('Invalid target URL format');
  });

  it('should validate positive numbers', () => {
    const { result } = renderHook(() => usePEPConfig(1));

    const configWithNegativeNumbers = {
      id: '1',
      name: 'Test',
      deploymentMode: 'reverse-proxy' as const,
      targetUrl: 'https://api.example.com',
      proxyUrl: '',
      dnsConfig: {
        domain: '',
        subdomain: '',
        dnsProvider: 'Cloudflare',
        ttl: 300,
      },
      sslConfig: {
        enabled: true,
        certificateType: 'letsencrypt',
        autoRenew: true,
      },
      trafficConfig: {
        ingressEnabled: true,
        egressEnabled: true,
        rateLimitPerMinute: -100,
        maxConnections: 0,
        timeoutSeconds: -5,
        retryAttempts: -1,
      },
      policies: [],
      isEnabled: true,
    };

    const errors = result.current.validate(configWithNegativeNumbers);
    expect(errors.rateLimitPerMinute).toBe('Rate limit must be a positive number');
    expect(errors.maxConnections).toBe('Max connections must be a positive number');
    expect(errors.timeoutSeconds).toBe('Timeout must be a positive number');
    expect(errors.retryAttempts).toBe('Retry attempts cannot be negative');
  });

  it('should require bouncer name', () => {
    const { result } = renderHook(() => usePEPConfig(1));

    const configWithoutName = {
      id: '1',
      name: '',
      deploymentMode: 'reverse-proxy' as const,
      targetUrl: 'https://api.example.com',
      proxyUrl: '',
      dnsConfig: {
        domain: '',
        subdomain: '',
        dnsProvider: 'Cloudflare',
        ttl: 300,
      },
      sslConfig: {
        enabled: true,
        certificateType: 'letsencrypt',
        autoRenew: true,
      },
      trafficConfig: {
        ingressEnabled: true,
        egressEnabled: true,
        rateLimitPerMinute: 1000,
        maxConnections: 500,
        timeoutSeconds: 30,
        retryAttempts: 3,
      },
      policies: [],
      isEnabled: true,
    };

    const errors = result.current.validate(configWithoutName);
    expect(errors.name).toBe('Bouncer name is required');
  });
});

