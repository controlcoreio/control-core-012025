
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { SecurityConfig } from '@/utils/securityConfig';
import { SecureStorage } from '@/utils/secureStorage';
import { ErrorHandler } from '@/utils/errorHandling';
import { APP_CONFIG } from '@/config/app';
import { SessionWarningDialog } from '@/components/auth/SessionWarningDialog';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  lastLogin: Date;
  mfaEnabled: boolean;
  username?: string;
  subscriptionTier?: 'kickstart' | 'pro' | 'custom' | null;
  deploymentModel?: 'hosted' | 'self-hosted' | null;
  githubRepo?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, mfaToken?: string) => Promise<boolean>;
  loginWithPasskey: () => Promise<void>;
  loginWithSSO: () => Promise<void>;
  checkSSOConfiguration: () => Promise<boolean>;
  logout: () => void;
  checkSession: () => boolean;
  requiresAuth: () => boolean;
  signup: (userData: any) => Promise<User>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [warningTimeout, setWarningTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const lastActivityRef = useRef<number>(Date.now());

  const checkSession = (): boolean => {
    const sessionData = SecureStorage.getItem('auth_session');
    const lastActivity = SecureStorage.getItem('last_activity');
    
    if (!sessionData || !lastActivity) {
      return false;
    }

    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    if (timeSinceActivity > SecurityConfig.SESSION_TIMEOUT) {
      logout();
      return false;
    }

    // Update last activity
    SecureStorage.setItem('last_activity', Date.now().toString());
    return true;
  };

  const saveUnsavedWork = async () => {
    try {
      // Check for auto-saved data
      const autoSaveItems = SecureStorage.getItemsMatching('autosave_');
      
      if (Object.keys(autoSaveItems).length > 0) {
        console.log('Preserving auto-saved work before logout...');
        // Auto-save data is already in storage, just log it
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving unsaved work:', error);
      return false;
    }
  };

  const resetSessionTimeout = useCallback(() => {
    // Clear existing timeouts
    setSessionTimeout(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });
    setWarningTimeout(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });

    // Hide warning if shown
    setShowSessionWarning(false);

    // Update last activity
    lastActivityRef.current = Date.now();
    SecureStorage.setItem('last_activity', Date.now().toString());

    // Set warning timeout (at SESSION_TIMEOUT - WARNING_BEFORE_LOGOUT)
    const warningTime = SecurityConfig.SESSION_TIMEOUT - SecurityConfig.SESSION_WARNING_BEFORE_LOGOUT;
    const newWarningTimeout = setTimeout(() => {
      setShowSessionWarning(true);
      setRemainingSeconds(Math.floor(SecurityConfig.SESSION_WARNING_BEFORE_LOGOUT / 1000));
    }, warningTime);
    setWarningTimeout(newWarningTimeout);

    // Set logout timeout
    const newSessionTimeout = setTimeout(async () => {
      await saveUnsavedWork();
      logout();
    }, SecurityConfig.SESSION_TIMEOUT);
    setSessionTimeout(newSessionTimeout);
  }, []); // Remove dependencies to prevent infinite loop

  const login = async (username: string, password: string, mfaToken?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Call backend authentication API
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const data = await response.json();
      
      // Create user session from backend response
      const sessionUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        permissions: data.user.permissions || ['read', 'write'],
        lastLogin: new Date(),
        mfaEnabled: data.user.mfa_enabled || false,
        username: data.user.username,
        subscriptionTier: data.user.subscription_tier,
        deploymentModel: data.user.deployment_model,
        githubRepo: data.user.github_repo
      };

      // Store access token
      SecureStorage.setItem('access_token', data.access_token);
      setUser(sessionUser);
      SecureStorage.setItem('auth_session', JSON.stringify(sessionUser));
      SecureStorage.setItem('last_activity', Date.now().toString());
      
      // Store force_password_change flag for route guard
      if (data.force_password_change) {
        SecureStorage.setItem('force_password_change', 'true');
      }
      
      resetSessionTimeout();
      
      // Return force_password_change flag
      return data.force_password_change || false;
      
    } catch (error) {
      const secureError = ErrorHandler.createSecureError(error, 'authentication');
      throw new Error(secureError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    SecureStorage.removeItem('auth_session');
    SecureStorage.removeItem('access_token');
    SecureStorage.removeItem('last_activity');
    SecureStorage.removeItem('force_password_change');
    
    setSessionTimeout(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });
    setWarningTimeout(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });
    
    setShowSessionWarning(false);

    // Redirect to login page
    window.location.href = '/login';
  };

  const handleStayLoggedIn = useCallback(() => {
    setShowSessionWarning(false);
    resetSessionTimeout();
  }, [resetSessionTimeout]);

  const handleLogoutNow = useCallback(async () => {
    await saveUnsavedWork();
    logout();
  }, []);

  const clearInvalidSession = () => {
    // Clear all auth-related storage
    SecureStorage.removeItem('auth_session');
    SecureStorage.removeItem('access_token');
    SecureStorage.removeItem('last_activity');
    SecureStorage.removeItem('force_password_change');
    setUser(null);
    setSessionTimeout(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });
    setWarningTimeout(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });
  };

  const signup = async (userData: any): Promise<User> => {
    try {
      setIsLoading(true);
      
      // Create new user with Kickstart subscription
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: userData.email,
        name: userData.company || userData.email.split('@')[0],
        role: 'Admin',
        permissions: ['read', 'write', 'admin'],
        lastLogin: new Date(),
        mfaEnabled: false,
        username: userData.email,
        subscriptionTier: 'kickstart',
        deploymentModel: null,
        githubRepo: null
      };

      // In real implementation, this would call your Auth0/backend
      setUser(newUser);
      SecureStorage.setItem('auth_session', JSON.stringify(newUser));
      SecureStorage.setItem('last_activity', Date.now().toString());
      resetSessionTimeout();
      
      return newUser;
    } catch (error) {
      const secureError = ErrorHandler.createSecureError(error, 'signup');
      throw new Error(secureError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    SecureStorage.setItem('auth_session', JSON.stringify(updatedUser));
  };

  const loginWithPasskey = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Check if WebAuthn is supported
      if (!navigator.credentials || !navigator.credentials.get) {
        throw new Error('Passkey authentication is not supported in this browser.');
      }

      // Get challenge from backend
      const challengeResponse = await fetch(`${APP_CONFIG.api.baseUrl}/auth0/passkeys/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get authentication challenge');
      }

      const challengeData = await challengeResponse.json();

      // Create WebAuthn credential request
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(challengeData.challenge),
          timeout: 60000,
          rpId: window.location.hostname,
          allowCredentials: challengeData.allowCredentials?.map((cred: any) => ({
            id: new Uint8Array(cred.id),
            type: 'public-key',
            transports: cred.transports
          })) || [],
          userVerification: 'preferred'
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('No passkey found');
      }

      // Verify credential with backend
      const response = credential.response as AuthenticatorAssertionResponse;
      const verificationData = {
        credential_id: challengeData.credential_id,
        authenticator_data: Array.from(new Uint8Array(response.authenticatorData)),
        client_data_json: Array.from(new Uint8Array(response.clientDataJSON)),
        signature: Array.from(new Uint8Array(response.signature)),
        user_handle: response.userHandle ? Array.from(new Uint8Array(response.userHandle)) : null
      };

      const verifyResponse = await fetch(`${APP_CONFIG.api.baseUrl}/auth0/passkeys/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData)
      });

      if (!verifyResponse.ok) {
        throw new Error('Passkey verification failed');
      }

      const authData = await verifyResponse.json();
      
      // Create user session from backend response
      const sessionUser: User = {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.name,
        role: authData.user.role,
        permissions: authData.user.permissions || ['read', 'write'],
        lastLogin: new Date(),
        mfaEnabled: authData.user.mfa_enabled || false,
        username: authData.user.username,
        subscriptionTier: authData.user.subscription_tier,
        deploymentModel: authData.user.deployment_model,
        githubRepo: authData.user.github_repo
      };

      // Store access token and user data
      SecureStorage.setItem('access_token', authData.access_token);
      setUser(sessionUser);
      SecureStorage.setItem('auth_session', JSON.stringify(sessionUser));
      SecureStorage.setItem('last_activity', Date.now().toString());
      resetSessionTimeout();
      
    } catch (error) {
      const secureError = ErrorHandler.createSecureError(error, 'passkey-authentication');
      throw new Error(secureError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSSO = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth/sso/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate SSO login');
      }

      const data = await response.json();
      
      // Redirect to SSO provider
      window.location.href = data.auth_url;
      
    } catch (error) {
      const secureError = ErrorHandler.createSecureError(error, 'sso-authentication');
      throw new Error(secureError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSSOConfiguration = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth/sso/status`);
      if (response.ok) {
        const data = await response.json();
        return data.configured;
      }
      return false;
    } catch (error) {
      console.error('Failed to check SSO configuration:', error);
      return false;
    }
  };

  const requiresAuth = (): boolean => {
    // All routes require authentication except login and signup pages
    return !window.location.pathname.match(/^\/(?:login|signup)$/);
  };

  useEffect(() => {
    // Check for existing session on mount
    if (checkSession()) {
      const sessionData = SecureStorage.getItem('auth_session');
      const accessToken = SecureStorage.getItem('access_token');
      
      if (sessionData && accessToken) {
        try {
          const userData = JSON.parse(sessionData);
          // Validate that the session has required backend fields
          if (userData.id && userData.email && userData.username) {
            setUser(userData);
            resetSessionTimeout();
          } else {
            // Invalid session format (probably old mock data)
            console.log('Invalid session detected, clearing...');
            clearInvalidSession();
          }
        } catch (error) {
          console.log('Error parsing session, clearing...');
          clearInvalidSession();
        }
      } else if (sessionData && !accessToken) {
        // Old session without access token (mock user session)
        console.log('Old session format detected, clearing...');
        clearInvalidSession();
      }
    }
    setIsLoading(false);
  }, []); // Only run once on mount

  useEffect(() => {
    // Set up activity listeners for session management with debouncing
    let activityDebounceTimer: NodeJS.Timeout | null = null;

    const handleActivity = () => {
      if (!user) return;

      // Debounce activity tracking to avoid excessive updates
      if (activityDebounceTimer) {
        clearTimeout(activityDebounceTimer);
      }

      activityDebounceTimer = setTimeout(() => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;

        // Only reset if it's been more than 5 seconds since last activity
        if (timeSinceLastActivity >= 5000) {
          lastActivityRef.current = now;
          SecureStorage.setItem('last_activity', now.toString());
          resetSessionTimeout();
        }
      }, 1000); // 1 second debounce
    };

    if (user) {
      // Track various user interactions
      document.addEventListener('mousedown', handleActivity);
      document.addEventListener('keydown', handleActivity);
      document.addEventListener('scroll', handleActivity, { passive: true });
      document.addEventListener('click', handleActivity);
      document.addEventListener('touchstart', handleActivity, { passive: true });
      window.addEventListener('focus', handleActivity);
      
      // Mousemove with heavier debouncing (only track significant movement)
      let mouseMoveTimer: NodeJS.Timeout | null = null;
      const handleMouseMove = () => {
        if (mouseMoveTimer) return;
        mouseMoveTimer = setTimeout(() => {
          handleActivity();
          mouseMoveTimer = null;
        }, 5000); // Only track mousemove every 5 seconds
      };
      document.addEventListener('mousemove', handleMouseMove, { passive: true });

      return () => {
        document.removeEventListener('mousedown', handleActivity);
        document.removeEventListener('keydown', handleActivity);
        document.removeEventListener('scroll', handleActivity);
        document.removeEventListener('click', handleActivity);
        document.removeEventListener('touchstart', handleActivity);
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('focus', handleActivity);
        
        if (activityDebounceTimer) {
          clearTimeout(activityDebounceTimer);
        }
        if (mouseMoveTimer) {
          clearTimeout(mouseMoveTimer);
        }
      };
    }
  }, [user ? user.id : null, resetSessionTimeout]); // Only depend on user.id to avoid infinite loops

  useEffect(() => {
    return () => {
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, [sessionTimeout]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithPasskey,
      loginWithSSO,
      checkSSOConfiguration,
      logout,
      checkSession,
      requiresAuth,
      signup,
      updateUser
    }}>
      {children}
      <SessionWarningDialog
        isOpen={showSessionWarning}
        remainingSeconds={remainingSeconds}
        onStayLoggedIn={handleStayLoggedIn}
        onLogoutNow={handleLogoutNow}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
