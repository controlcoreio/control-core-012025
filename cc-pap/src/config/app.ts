
export const APP_CONFIG = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.PROD 
      ? 'https://api.controlcore.com' 
      : 'http://localhost:8000', // FastAPI backend port
    timeout: 10000,
    retryAttempts: 3,
  },

  // Security Configuration
  security: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['.rego', '.json', '.yaml', '.yml'],
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    rateLimiting: {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
  },

  // UI Configuration
  ui: {
    defaultPageSize: 20,
    maxCodeLength: 50000,
    debounceDelay: 300,
    animationDuration: 200,
  },

  // Feature Flags
  features: {
    enableAdvancedAnalytics: true,
    enableRealTimeUpdates: true,
    enableBetaFeatures: false,
  },

  // Deployment Configuration
  deployment: {
    type: 'hosted-saas' as 'hosted-saas' | 'self-deployed', // Mock deployment type
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
