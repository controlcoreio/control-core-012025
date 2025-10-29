import { SecureStorage } from './secureStorage';

/**
 * Global 401 Handler for NIST/FedRAMP/SOC2 Compliance
 * Intercepts all fetch requests and handles session revocation
 */

let originalFetch: typeof fetch;

export function setupGlobal401Handler() {
  if (typeof window === 'undefined') return;
  
  // Store original fetch
  if (!originalFetch) {
    originalFetch = window.fetch;
  }
  
  // Override global fetch
  window.fetch = async function(...args: Parameters<typeof fetch>): Promise<Response> {
    const response = await originalFetch(...args);
    
    // Check for 401 Unauthorized
    if (response.status === 401) {
      // Clone response so we can read it
      const clone = response.clone();
      
      try {
        const data = await clone.json();
        
        // Check if session was revoked by administrator
        if (data.detail && (
          data.detail.includes('revoked') || 
          data.detail.includes('Session has been revoked')
        )) {
          console.warn('[Session Management] Session revoked by administrator - forcing logout');
          
          // Clear all auth data
          SecureStorage.removeItem('auth_session');
          SecureStorage.removeItem('access_token');
          SecureStorage.removeItem('force_password_change');
          SecureStorage.removeItem('last_activity');
          
          // Redirect to login with funny message
          setTimeout(() => {
            window.location.href = '/login?reason=session_revoked&message=Looks like we have lost Control here! Go back home now.';
          }, 100);
          
          return response;
        }
        
        // Check if JWT token has expired (not revoked)
        if (data.detail && (
          data.detail.includes('expired') || 
          data.detail.includes('token') ||
          data.detail.includes('credentials')
        )) {
          console.warn('[Session Management] JWT token expired - showing session warning');
          
          // Dispatch custom event to show session warning
          window.dispatchEvent(new CustomEvent('session-expired', {
            detail: { reason: 'token_expired' }
          }));
          
          return response;
        }
      } catch (e) {
        // If JSON parsing fails, assume it's a token expiration
        console.warn('[Session Management] 401 error - assuming token expiration');
        
        // Dispatch custom event to show session warning
        window.dispatchEvent(new CustomEvent('session-expired', {
          detail: { reason: 'token_expired' }
        }));
      }
    }
    
    return response;
  };
  
  console.log('[Session Management] Global 401 handler initialized');
}

// Cleanup function
export function removeGlobal401Handler() {
  if (originalFetch && typeof window !== 'undefined') {
    window.fetch = originalFetch;
    console.log('[Session Management] Global 401 handler removed');
  }
}

