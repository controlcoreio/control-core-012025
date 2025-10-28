
import { SecureStorage } from './secureStorage';

export class EnhancedCSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_LIFETIME = 30 * 60 * 1000; // 30 minutes
  private static readonly HEADER_NAME = 'X-CSRF-Token';
  
  private static generateSecureToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static generateToken(sessionId?: string): string {
    const token = this.generateSecureToken();
    const timestamp = Date.now();
    
    const tokenData = {
      token,
      timestamp,
      sessionId: sessionId || 'anonymous',
      used: false
    };
    
    SecureStorage.setItem('csrf_token', JSON.stringify(tokenData), this.TOKEN_LIFETIME);
    return token;
  }
  
  static getToken(): string {
    const stored = SecureStorage.getItem('csrf_token');
    if (!stored) {
      return this.generateToken();
    }
    
    try {
      const tokenData = JSON.parse(stored);
      
      // Check if token is expired
      if (Date.now() - tokenData.timestamp > this.TOKEN_LIFETIME) {
        return this.generateToken();
      }
      
      return tokenData.token;
    } catch {
      return this.generateToken();
    }
  }
  
  static validateToken(submittedToken: string, sessionId?: string): boolean {
    const stored = SecureStorage.getItem('csrf_token');
    if (!stored || !submittedToken) {
      return false;
    }
    
    try {
      const tokenData = JSON.parse(stored);
      
      // Check token expiry
      if (Date.now() - tokenData.timestamp > this.TOKEN_LIFETIME) {
        this.clearToken();
        return false;
      }
      
      // Check if token was already used (one-time use)
      if (tokenData.used) {
        return false;
      }
      
      // Validate token and session
      const isValid = tokenData.token === submittedToken && 
                     (!sessionId || tokenData.sessionId === sessionId);
      
      if (isValid) {
        // Mark token as used
        tokenData.used = true;
        SecureStorage.setItem('csrf_token', JSON.stringify(tokenData), this.TOKEN_LIFETIME);
      }
      
      return isValid;
    } catch {
      this.clearToken();
      return false;
    }
  }
  
  static clearToken(): void {
    SecureStorage.removeItem('csrf_token');
  }
  
  static getHeaderName(): string {
    return this.HEADER_NAME;
  }
  
  // For API requests
  static attachToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...headers,
      [this.HEADER_NAME]: this.getToken()
    };
  }
}
