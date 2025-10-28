
// Enhanced security utilities with stricter validation
export const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "https://cdn.gpteng.co"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "https:"],
  fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"],
  baseUri: ["'self'"]
} as const;

// Rate limiting with exponential backoff
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private blocked: Map<string, number> = new Map();

  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    
    // Check if currently blocked
    const blockedUntil = this.blocked.get(key);
    if (blockedUntil && now < blockedUntil) {
      return false;
    }
    
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requestTimes = this.requests.get(key)!;
    
    // Remove old requests outside the window
    const validRequests = requestTimes.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      // Block for increasing duration based on violations
      const blockDuration = Math.min(windowMs * Math.pow(2, validRequests.length - maxRequests), 3600000); // Max 1 hour
      this.blocked.set(key, now + blockDuration);
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  clearBlocked(key: string): void {
    this.blocked.delete(key);
  }
}

// Enhanced XSS protection with more comprehensive sanitization
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

// Input validation for common attack vectors
export function validateInput(input: string, maxLength: number = 1000): boolean {
  if (typeof input !== 'string' || input.length > maxLength) {
    return false;
  }
  
  // Check for common attack patterns
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];
  
  return !maliciousPatterns.some(pattern => pattern.test(input));
}

// Secure random string generation with better entropy
export function generateSecureId(length: number = 16): string {
  if (length <= 0 || length > 64) {
    throw new Error('Invalid length for secure ID');
  }
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// URL validation to prevent SSRF attacks
export function validateURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow https and http protocols
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Prevent internal network access
    const hostname = parsedUrl.hostname.toLowerCase();
    const forbiddenHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'metadata.google.internal'
    ];
    
    if (forbiddenHosts.includes(hostname)) {
      return false;
    }
    
    // Check for private IP ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);
      // Private IP ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      if ((a === 10) || 
          (a === 172 && b >= 16 && b <= 31) || 
          (a === 192 && b === 168) ||
          (a === 169 && b === 254)) { // Link-local
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}
