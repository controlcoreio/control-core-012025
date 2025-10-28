/**
 * Deployment Configuration for Control Core
 * Supports both self-hosted and hosted deployments
 * Located in cc-infra for proper infrastructure management
 */

// Node.js environment types
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

export interface DeploymentConfig {
  mode: 'self-hosted' | 'hosted';
  apiUrl: string;
  frontendUrl: string;
  auth0: {
    domain: string;
    clientId: string;
    audience: string;
  };
  stripe: {
    publishableKey: string;
    webhookSecret: string;
  };
  features: {
    multiTenant: boolean;
    analytics: boolean;
    auditLogs: boolean;
    policyTemplates: boolean;
    aiIntegration: boolean;
  };
}

// Self-hosted deployment configuration (Kickstart/Custom plans)
export const selfHostedConfig: DeploymentConfig = {
  mode: 'self-hosted',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  auth0: {
    domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'your-tenant.auth0.com',
    clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'your-client-id',
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || 'your-api-audience',
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...',
  },
  features: {
    multiTenant: false,
    analytics: true,
    auditLogs: true,
    policyTemplates: true,
    aiIntegration: true,
  },
};

// Hosted deployment configuration (Pro plan)
export const hostedConfig: DeploymentConfig = {
  mode: 'hosted',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://app.controlcore.io',
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://app.controlcore.io',
  auth0: {
    domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'controlcore.auth0.com',
    clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'your-client-id',
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || 'https://api.controlcore.io',
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_...',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...',
  },
  features: {
    multiTenant: true,
    analytics: true,
    auditLogs: true,
    policyTemplates: true,
    aiIntegration: true,
  },
};

// Get deployment configuration based on environment
export function getDeploymentConfig(): DeploymentConfig {
  const deploymentMode = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE || 'self-hosted';
  
  if (deploymentMode === 'hosted') {
    return hostedConfig;
  }
  
  return selfHostedConfig;
}

// Environment-specific configurations
export const environments = {
  development: {
    ...selfHostedConfig,
    apiUrl: 'http://localhost:8000',
    frontendUrl: 'http://localhost:3000',
  },
  staging: {
    ...hostedConfig,
    apiUrl: 'https://staging.controlcore.io',
    frontendUrl: 'https://staging.controlcore.io',
  },
  production: {
    ...hostedConfig,
    apiUrl: 'https://app.controlcore.io',
    frontendUrl: 'https://app.controlcore.io',
  },
};

// Feature flags based on deployment mode
export function getFeatureFlags(config: DeploymentConfig) {
  return {
    // Core features available in all deployments
    policyManagement: true,
    resourceProtection: true,
    auditLogging: true,
    userManagement: true,
    
    // Advanced features based on deployment mode
    multiTenant: config.features.multiTenant,
    analytics: config.features.analytics,
    aiIntegration: config.features.aiIntegration,
    policyTemplates: config.features.policyTemplates,
    
    // Pro-only features
    advancedAnalytics: config.mode === 'hosted',
    customIntegrations: config.mode === 'hosted',
    prioritySupport: config.mode === 'hosted',
    usageBasedBilling: config.mode === 'hosted',
  };
}