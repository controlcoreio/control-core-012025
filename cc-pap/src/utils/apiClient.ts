import { SecureStorage } from './secureStorage';
import { APP_CONFIG } from '@/config/app';

/**
 * Enhanced fetch wrapper with automatic 401 handling for NIST/FedRAMP/SOC2 compliance
 * Automatically redirects to login when session is revoked
 */
export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = SecureStorage.getItem('access_token');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };
  
  try {
    const response = await fetch(`${APP_CONFIG.api.baseUrl}${endpoint}`, config);
    
    // Check for 401 Unauthorized - session revoked or expired
    if (response.status === 401) {
      const data = await response.json().catch(() => ({ detail: 'Unauthorized' }));
      
      // Check if it's a revoked session
      if (data.detail && data.detail.includes('revoked')) {
        console.warn('[Session Management] Session has been revoked by administrator');
        
        // Clear all auth data
        SecureStorage.removeItem('auth_session');
        SecureStorage.removeItem('access_token');
        SecureStorage.removeItem('force_password_change');
        SecureStorage.removeItem('last_activity');
        
        // Redirect to login with message
        window.location.href = '/login?reason=session_revoked';
        
        throw new Error('Session has been revoked. Please log in again.');
      } else {
        // Regular 401 - expired or invalid token
        console.warn('[Session Management] Session expired or invalid');
        
        SecureStorage.removeItem('auth_session');
        SecureStorage.removeItem('access_token');
        SecureStorage.removeItem('force_password_change');
        SecureStorage.removeItem('last_activity');
        
        window.location.href = '/login?reason=session_expired';
        
        throw new Error('Session expired. Please log in again.');
      }
    }
    
    return response;
  } catch (error) {
    // Re-throw for caller to handle
    throw error;
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint: string, options?: RequestInit) => 
    apiClient(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, body?: any, options?: RequestInit) => 
    apiClient(endpoint, { 
      ...options, 
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined 
    }),
  
  put: (endpoint: string, body?: any, options?: RequestInit) => 
    apiClient(endpoint, { 
      ...options, 
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined 
    }),
  
  delete: (endpoint: string, options?: RequestInit) => 
    apiClient(endpoint, { ...options, method: 'DELETE' }),
  
  patch: (endpoint: string, body?: any, options?: RequestInit) => 
    apiClient(endpoint, { 
      ...options, 
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined 
    }),
};

