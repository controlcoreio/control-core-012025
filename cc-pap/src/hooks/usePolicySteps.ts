
import { useState } from "react";

const steps = [
  { id: 1, name: "Resources" },
  { id: 2, name: "Roles" },
  { id: 3, name: "Permissions" },
  { id: 4, name: "Conditions" },
  { id: 5, name: "Review" },
];

export function usePolicySteps() {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    setCurrentStep(Math.min(5, currentStep + 1));
  };

  const previousStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const canGoNext = currentStep < 5;
  const canGoPrevious = currentStep > 1;

  return {
    steps,
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious
  };
}
