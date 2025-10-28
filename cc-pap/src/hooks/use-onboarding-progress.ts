
import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'controlcore-onboarding-progress';

export function useOnboardingProgress() {
  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      try {
        const progress = JSON.parse(stored);
        setCompleted(progress.completed || false);
      } catch (error) {
        console.error('Failed to parse onboarding progress:', error);
      }
    }
  }, []);

  const markOnboardingComplete = () => {
    const progress = { completed: true };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress));
    setCompleted(true);
  };

  const resetOnboarding = () => {
    const progress = { completed: false };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress));
    setCompleted(false);
  };

  const updateStepStatus = (stepId: string, status: string) => {
    // For now, just mark as completed if any step is completed
    if (status === 'completed') {
      markOnboardingComplete();
    }
  };

  const isCompleted = () => completed;

  return {
    isCompleted,
    markOnboardingComplete,
    resetOnboarding,
    updateStepStatus
  };
}
