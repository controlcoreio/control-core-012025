import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type SubscriptionTier = 'kickstart' | 'pro' | 'custom' | null;
export type DeploymentModel = 'hosted' | 'self-hosted' | null;

export interface SubscriptionStatus {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  trialEnd: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  deploymentModel: DeploymentModel;
  setupCompleted: boolean;
  features: {
    maxActivePolicies: number;
    hasInvoiceAccess: boolean;
    hasPaymentHistory: boolean;
    hasPrioritySupport: boolean;
    hasCustomTemplates: boolean;
    hasRuleRecommender: boolean;
  };
}

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
  createKickstartSubscription: (userId: string) => Promise<void>;
  createProSubscription: (userId: string) => Promise<void>;
  createCustomSubscription: (userId: string) => Promise<void>;
  upgradeToPro: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  completeSetup: () => Promise<void>;
  hasFeature: (feature: keyof SubscriptionStatus['features']) => boolean;
  isTrialActive: () => boolean;
  getDaysUntilTrialEnd: () => number | null;
  isSetupCompleted: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Mock subscription data storage key
  const SUBSCRIPTION_STORAGE_KEY = 'mock_subscription_status';

  const getSubscriptionFeatures = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'kickstart':
        return {
          maxActivePolicies: 100,
          hasInvoiceAccess: false,
          hasPaymentHistory: false,
          hasPrioritySupport: false,
          hasCustomTemplates: false,
          hasRuleRecommender: false,
        };
      case 'pro':
        return {
          maxActivePolicies: 100,
          hasInvoiceAccess: true,
          hasPaymentHistory: true,
          hasPrioritySupport: true,
          hasCustomTemplates: false,
          hasRuleRecommender: false,
        };
      case 'custom':
        return {
          maxActivePolicies: -1, // unlimited
          hasInvoiceAccess: true,
          hasPaymentHistory: true,
          hasPrioritySupport: true,
          hasCustomTemplates: true,
          hasRuleRecommender: true,
        };
      default:
        return {
          maxActivePolicies: 0,
          hasInvoiceAccess: false,
          hasPaymentHistory: false,
          hasPrioritySupport: false,
          hasCustomTemplates: false,
          hasRuleRecommender: false,
        };
    }
  };

  const checkSubscription = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Builtin admin gets automatic custom subscription with setup completed
      if (user?.role === 'builtin_admin') {
        const builtinAdminSubscription: SubscriptionStatus = {
          id: 'builtin_admin_sub',
          userId: user.id,
          tier: 'custom',
          status: 'active',
          trialEnd: null,
          currentPeriodEnd: null,
          createdAt: new Date(),
          deploymentModel: 'hosted',
          setupCompleted: true, // Builtin admin doesn't need setup
          features: getSubscriptionFeatures('custom')
        };
        setSubscription(builtinAdminSubscription);
        setIsLoading(false);
        return;
      }

      // For regular users, check localStorage
      const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (stored) {
        const parsedSubscription = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsedSubscription.trialEnd = parsedSubscription.trialEnd ? new Date(parsedSubscription.trialEnd) : null;
        parsedSubscription.currentPeriodEnd = parsedSubscription.currentPeriodEnd ? new Date(parsedSubscription.currentPeriodEnd) : null;
        parsedSubscription.createdAt = new Date(parsedSubscription.createdAt);
        
        // Backward compatibility: add new fields if they don't exist
        if (parsedSubscription.deploymentModel === undefined) {
          parsedSubscription.deploymentModel = null;
        }
        if (parsedSubscription.setupCompleted === undefined) {
          parsedSubscription.setupCompleted = false;
        }
        
        setSubscription(parsedSubscription);
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createKickstartSubscription = async (userId: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Create 90-day trial subscription
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 90); // 90 days from now

      const newSubscription: SubscriptionStatus = {
        id: `sub_${Date.now()}`,
        userId,
        tier: 'kickstart',
        status: 'trialing',
        trialEnd,
        currentPeriodEnd: trialEnd,
        createdAt: new Date(),
        deploymentModel: null,
        setupCompleted: false,
        features: getSubscriptionFeatures('kickstart'),
      };

      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(newSubscription));
      setSubscription(newSubscription);
    } catch (error) {
      console.error('Failed to create kickstart subscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createProSubscription = async (userId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const newSubscription: SubscriptionStatus = {
        id: `sub_${Date.now()}`,
        userId,
        tier: 'pro',
        status: 'active',
        trialEnd: null,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        deploymentModel: 'hosted',
        setupCompleted: false,
        features: getSubscriptionFeatures('pro'),
      };

      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(newSubscription));
      setSubscription(newSubscription);
    } catch (error) {
      console.error('Failed to create Pro subscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomSubscription = async (userId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const newSubscription: SubscriptionStatus = {
        id: `sub_${Date.now()}`,
        userId,
        tier: 'custom',
        status: 'active',
        trialEnd: null,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        deploymentModel: 'self-hosted',
        setupCompleted: false,
        features: getSubscriptionFeatures('custom'),
      };

      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(newSubscription));
      setSubscription(newSubscription);
    } catch (error) {
      console.error('Failed to create Custom subscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeToPro = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // In real implementation, this would integrate with Stripe
      if (!subscription) throw new Error('No active subscription');

      const updatedSubscription: SubscriptionStatus = {
        ...subscription,
        tier: 'pro',
        status: 'active',
        trialEnd: null,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        features: getSubscriptionFeatures('pro'),
      };

      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(updatedSubscription));
      setSubscription(updatedSubscription);
    } catch (error) {
      console.error('Failed to upgrade to Pro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (!subscription) throw new Error('No active subscription');

      const canceledSubscription: SubscriptionStatus = {
        ...subscription,
        status: 'canceled',
      };

      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(canceledSubscription));
      setSubscription(canceledSubscription);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const hasFeature = (feature: keyof SubscriptionStatus['features']): boolean => {
    if (!subscription) return false;
    return subscription.features[feature] === true || subscription.features[feature] === -1;
  };

  const isTrialActive = (): boolean => {
    if (!subscription || !subscription.trialEnd) return false;
    return subscription.status === 'trialing' && new Date() < subscription.trialEnd;
  };

  const getDaysUntilTrialEnd = (): number | null => {
    if (!subscription || !subscription.trialEnd) return null;
    const now = new Date();
    const diffTime = subscription.trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const completeSetup = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (!subscription) throw new Error('No active subscription');

      const updatedSubscription: SubscriptionStatus = {
        ...subscription,
        setupCompleted: true,
      };

      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(updatedSubscription));
      setSubscription(updatedSubscription);
    } catch (error) {
      console.error('Failed to complete setup:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isSetupCompleted = (): boolean => {
    // Builtin admin always has setup completed
    if (user?.role === 'builtin_admin') {
      return true;
    }
    return subscription?.setupCompleted ?? false;
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user?.id]); // Re-check when user changes

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isLoading,
      checkSubscription,
      createKickstartSubscription,
      createProSubscription,
      createCustomSubscription,
      upgradeToPro,
      cancelSubscription,
      completeSetup,
      hasFeature,
      isTrialActive,
      getDaysUntilTrialEnd,
      isSetupCompleted,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}