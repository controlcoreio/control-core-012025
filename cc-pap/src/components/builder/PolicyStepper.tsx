
import React from "react";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";

interface Step {
  id: number;
  name: string;
}

interface PolicyStepperProps {
  steps: Step[];
  currentStep: number;
  setCurrentStep: (val: number) => void;
}

export function PolicyStepper({ steps, currentStep, setCurrentStep }: PolicyStepperProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border ${
              currentStep === step.id
                ? "bg-primary text-primary-foreground border-primary"
                : currentStep > step.id
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-muted text-muted-foreground border-muted"
            }`}
            onClick={() => setCurrentStep(step.id)}
            style={{ cursor: "pointer" }}
          >
            {currentStep > step.id ? (
              <EnterpriseIcon name="check" size={20} />
            ) : (
              <span>{step.id}</span>
            )}
          </div>
          <div
            className={`ml-2 ${
              currentStep === step.id
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {step.name}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`mx-2 h-0.5 w-10 ${
                currentStep > step.id + 1
                  ? "bg-primary/60"
                  : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
