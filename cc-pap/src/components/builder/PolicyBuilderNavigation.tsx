
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface PolicyBuilderNavigationProps {
  currentStep: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  previousStep: () => void;
  nextStep: () => void;
}

export function PolicyBuilderNavigation({
  currentStep,
  canGoPrevious,
  canGoNext,
  previousStep,
  nextStep
}: PolicyBuilderNavigationProps) {
  // Don't show navigation on the final builder step (step 4) as it has its own save button
  if (currentStep === 4) {
    return null;
  }

  return (
    <div className="flex justify-between items-center pt-4 border-t">
      <Button
        variant="outline"
        onClick={previousStep}
        disabled={!canGoPrevious}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <div className="text-sm text-muted-foreground">
        Step {currentStep} of 4
      </div>
      
      <Button
        onClick={nextStep}
        disabled={!canGoNext}
        className="flex items-center gap-2"
      >
        Next Step
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
