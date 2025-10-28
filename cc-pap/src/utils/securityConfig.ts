
export class SecurityConfig {
  // Security headers configuration
  static readonly SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };

  // Content Security Policy - Updated to allow Google Fonts
  static readonly CSP_POLICY = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "img-src 'self' data: https:",
    "connect-src 'self' http://localhost:8000 http://localhost:8082 https:",
    "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "base-uri 'self'"
  ].join('; ');

  // Session timeout (30 minutes for SOC2/FedRAMP compliance)
  static readonly SESSION_TIMEOUT = 30 * 60 * 1000;
  
  // Session warning (2 minutes before logout)
  static readonly SESSION_WARNING_BEFORE_LOGOUT = 2 * 60 * 1000;
  
  // Inactivity check interval (check every 30 seconds)
  static readonly INACTIVITY_CHECK_INTERVAL = 30 * 1000;

  // Maximum login attempts
  static readonly MAX_LOGIN_ATTEMPTS = 5;

  // Password requirements
  static readonly PASSWORD_REQUIREMENTS = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbiddenPatterns: [
      'password', '123456', 'admin', 'letmein', 'welcome',
      'qwerty', 'abc123', 'password123', '12345678'
    ]
  };

  // File upload restrictions
  static readonly FILE_UPLOAD = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/json'
    ],
    scanForMalware: true
  };

  // Rate limiting
  static readonly RATE_LIMITS = {
    login: { attempts: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    apiRequests: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
    fileUpload: { uploads: 10, window: 60 * 1000 } // 10 uploads per minute
  };
}
