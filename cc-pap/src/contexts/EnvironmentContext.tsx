
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ProductionWarningModal } from '@/components/layout/ProductionWarningModal';

export type Environment = 'sandbox' | 'production';

interface EnvironmentContextType {
  currentEnvironment: Environment;
  setCurrentEnvironment: (env: Environment) => void;
  canModifyPolicies: boolean;
  canCreatePolicies: boolean;
  canPromotePolicies: boolean;
  isEnvironmentLoading: boolean;
  isProduction: boolean;
  refreshEnvironmentData: () => void;
  showProductionWarning: (callback: (env: Environment) => void) => void;
  userTier: 'free' | 'hosted' | 'enterprise';
  isStrictProductionLockEnabled: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>('sandbox');
  const [isEnvironmentLoading, setIsEnvironmentLoading] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [productionCallback, setProductionCallback] = useState<((env: Environment) => void) | null>(null);
  
  // Mock user tier - in real app this would come from auth/subscription context
  const userTier: 'free' | 'hosted' | 'enterprise' = 'hosted';
  const [isStrictProductionLockEnabled, setIsStrictProductionLockEnabled] = useState(false);

  // Computed property for checking if in production
  const isProduction = currentEnvironment === 'production';

  // Policies can only be CREATED in sandbox, but can be EDITED in both
  // Production policies can only be edited if they were promoted from sandbox
  const canModifyPolicies = true; // Always allow editing, with restrictions
  const canCreatePolicies = currentEnvironment === 'sandbox'; // Only create in sandbox
  const canPromotePolicies = currentEnvironment === 'sandbox'; // Only promote from sandbox

  const refreshEnvironmentData = () => {
    setIsEnvironmentLoading(true);
    // Trigger a global data refresh across all components
    setTimeout(() => {
      setIsEnvironmentLoading(false);
      // This will trigger useEffect in components that depend on environment
      window.dispatchEvent(new CustomEvent('environmentChanged', { 
        detail: { environment: currentEnvironment } 
      }));
    }, 500);
  };

  const handleEnvironmentChange = (env: Environment) => {
    if (env === 'production' && currentEnvironment !== 'production') {
      // Show production warning modal
      showProductionWarning((confirmedEnv) => {
        setCurrentEnvironment(confirmedEnv);
        setIsEnvironmentLoading(true);
        setTimeout(() => {
          setIsEnvironmentLoading(false);
          window.dispatchEvent(new CustomEvent('environmentChanged', { 
            detail: { environment: confirmedEnv } 
          }));
        }, 300);
      });
    } else {
      setCurrentEnvironment(env);
      setIsEnvironmentLoading(true);
      setTimeout(() => {
        setIsEnvironmentLoading(false);
        window.dispatchEvent(new CustomEvent('environmentChanged', { 
          detail: { environment: env } 
        }));
      }, 300);
    }
  };

  const showProductionWarning = (callback: (env: Environment) => void) => {
    setProductionCallback(() => callback);
    setShowProductionModal(true);
  };

  const handleProductionConfirm = () => {
    if (productionCallback) {
      productionCallback('production');
    }
    setShowProductionModal(false);
    setProductionCallback(null);
  };

  const handleProductionCancel = () => {
    setShowProductionModal(false);
    setProductionCallback(null);
  };

  return (
    <>
      <EnvironmentContext.Provider 
        value={{
          currentEnvironment,
          setCurrentEnvironment: handleEnvironmentChange,
          canModifyPolicies,
          canCreatePolicies,
          canPromotePolicies,
          isEnvironmentLoading,
          isProduction,
          refreshEnvironmentData,
          showProductionWarning,
          userTier,
          isStrictProductionLockEnabled,
        }}
      >
        {children}
      </EnvironmentContext.Provider>
      
      <ProductionWarningModal 
        open={showProductionModal}
        onOpenChange={setShowProductionModal}
        onConfirm={handleProductionConfirm}
        onCancel={handleProductionCancel}
      />
    </>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
}
