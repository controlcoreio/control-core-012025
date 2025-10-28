
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
const Router = BrowserRouter;
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { EnvironmentProvider } from '@/contexts/EnvironmentContext';
import { SubscriptionProvider, useSubscription } from '@/contexts/SubscriptionContext';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from '@/components/auth/LoginPage';
import { PlanSelectionNextPage } from '@/components/onboarding/PlanSelectionNextPage';
import { ProPlanDownloadPage } from '@/components/onboarding/ProPlanDownloadPage';
import { CustomPlanDownloadPage } from '@/components/onboarding/CustomPlanDownloadPage';
import Index from '@/pages/Index';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SecureStorage } from '@/utils/secureStorage';

const queryClient = new QueryClient();

// Protected Route Component - Only for authenticated users with completed setup
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { subscription, isLoading: subLoading, isSetupCompleted } = useSubscription();

  if (authLoading || subLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Builtin admin bypasses subscription setup - always allow direct access
  if (user?.role === 'builtin_admin') {
    return <>{children}</>;
  }

  // If user is authenticated but hasn't completed setup, redirect to appropriate setup page
  if (!isSetupCompleted()) {
    if (subscription?.tier === 'kickstart') {
      return <Navigate to="/plan-selection-next" replace />;
    } else if (subscription?.tier === 'pro') {
      return <Navigate to="/pro-setup" replace />;
    } else if (subscription?.tier === 'custom') {
      return <Navigate to="/custom-setup" replace />;
    }
    // Fallback to login if no subscription tier
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main App Routes
function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  // Check if password change is required (stored in SecureStorage)
  const requiresPasswordChange = () => {
    return SecureStorage.getItem('force_password_change') === 'true';
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={(isAuthenticated && !requiresPasswordChange()) ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      {/* Setup routes - for authenticated users who haven't completed setup */}
      <Route 
        path="/plan-selection-next" 
        element={
          isAuthenticated ? <PlanSelectionNextPage /> : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/pro-setup" 
        element={
          isAuthenticated ? <ProPlanDownloadPage /> : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/custom-setup" 
        element={
          isAuthenticated ? <CustomPlanDownloadPage /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* Protected application routes */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  console.log('[App] App component mounted');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <EnvironmentProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <AppRoutes />
                  <Toaster />
                </BrowserRouter>
              </EnvironmentProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
