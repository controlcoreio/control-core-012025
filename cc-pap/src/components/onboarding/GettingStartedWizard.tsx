
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PBACEducationStep } from "./wizard-steps/PBACEducationStep";
import { ReverseProxyPEPStep } from "./wizard-steps/ReverseProxyPEPStep";
import { DataSourcesStep } from "./wizard-steps/DataSourcesStep";
import { PolicyLibraryStep } from "./wizard-steps/PolicyLibraryStep";
import { SelfHostedDownloadStep } from "./wizard-steps/SelfHostedDownloadStep";
import { VerifyDeploymentStep } from "./wizard-steps/VerifyDeploymentStep";
import { useToast } from "@/hooks/use-toast";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";

export function GettingStartedWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [deploymentModel, setDeploymentModel] = useState<string>("");
  const [hasDeployedComponents, setHasDeployedComponents] = useState<boolean>(false);
  const { updateStepStatus, markOnboardingComplete } = useOnboardingProgress();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check deployment model and component deployment status from localStorage
  useEffect(() => {
    const storedModel = localStorage.getItem('controlcore_deployment_model');
    const deployedComponents = localStorage.getItem('controlcore_components_deployed');
    
    if (storedModel) {
      setDeploymentModel(storedModel);
    }
    
    if (deployedComponents === 'true') {
      setHasDeployedComponents(true);
      // Skip to Step 3 (verification) if components are already deployed
      setCurrentStep(3);
      toast({
        title: "Components Already Deployed",
        description: "Skipping to verification step since you've already deployed your components.",
      });
    }
  }, [toast]);

  const nextStep = () => {
    // Self-hosted: 5 steps, Hosted: 4 steps (removed duplicate PolicyGenerationStep)
    const maxSteps = deploymentModel === 'self-hosted' ? 5 : 4;
    
    if (currentStep === maxSteps) {
      markOnboardingComplete();
      toast({
        title: "Quick Start Complete!",
        description: "You've successfully completed the getting started wizard.",
      });
      navigate("/");
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBackToOverview = () => {
    markOnboardingComplete();
    navigate("/");
  };

  const renderStepContent = () => {
    if (hasDeployedComponents) {
      // Skip Steps 1-2 if components are already deployed
      if (deploymentModel === 'self-hosted') {
        switch (currentStep) {
          case 1:
            return <VerifyDeploymentStep onComplete={nextStep} onNext={nextStep} />;
          case 2:
            return <DataSourcesStep onComplete={nextStep} onNext={nextStep} />;
          case 3:
            return <PolicyLibraryStep onComplete={nextStep} onNext={nextStep} />;
          default:
            return <VerifyDeploymentStep onComplete={nextStep} onNext={nextStep} />;
        }
      } else {
        switch (currentStep) {
          case 1:
            return <VerifyDeploymentStep onComplete={nextStep} onNext={nextStep} />;
          case 2:
            return <DataSourcesStep onComplete={nextStep} onNext={nextStep} />;
          case 3:
            return <PolicyLibraryStep onComplete={nextStep} onNext={nextStep} />;
          default:
            return <VerifyDeploymentStep onComplete={nextStep} onNext={nextStep} />;
        }
      }
    } else {
      // Normal flow for new users
      if (deploymentModel === 'self-hosted') {
        switch (currentStep) {
          case 1:
            return <PBACEducationStep onComplete={nextStep} onNext={nextStep} />;
          case 2:
            return <SelfHostedDownloadStep onComplete={nextStep} onNext={nextStep} />;
          case 3:
            return <VerifyDeploymentStep onComplete={nextStep} onNext={nextStep} />;
          case 4:
            return <DataSourcesStep onComplete={nextStep} onNext={nextStep} />;
          case 5:
            return <PolicyLibraryStep onComplete={nextStep} onNext={nextStep} />;
          default:
            return <PBACEducationStep onComplete={nextStep} onNext={nextStep} />;
        }
      } else {
        // Control Core Hosted flow - go directly to PEP download
        switch (currentStep) {
          case 1:
            return <PBACEducationStep onComplete={nextStep} onNext={nextStep} />;
          case 2:
            return <SelfHostedDownloadStep onComplete={nextStep} onNext={nextStep} defaultTab="bouncers" />;
          case 3:
            return <DataSourcesStep onComplete={nextStep} onNext={nextStep} />;
          case 4:
            return <PolicyLibraryStep onComplete={nextStep} onNext={nextStep} />;
          default:
            return <PBACEducationStep onComplete={nextStep} onNext={nextStep} />;
        }
      }
    }
  };

  const getStepTitles = () => {
    if (hasDeployedComponents) {
      // If components are already deployed, start from verification
      if (deploymentModel === 'self-hosted') {
        return [
          "Verify All Components Deployment",
          "Connect Data Sources",
          "Select a Policy from Templates"
        ];
      } else {
        return [
          "Verify All Components Deployment",
          "Connect Data Sources",
          "Select a Policy from Templates"
        ];
      }
    } else {
      // Normal flow for new users
      if (deploymentModel === 'self-hosted') {
        return [
          "The Basics",
          "Download Control Core Components",
          "Verify All Components Deployment",
          "Connect Data Sources",
          "Select a Policy from Templates"
        ];
      } else {
        return [
          "The Basics",
          "Download Bouncer Components",
          "Connect Data Sources",
          "Select a Policy from Templates"
        ];
      }
    }
  };

  const stepTitles = getStepTitles();
  const maxSteps = stepTitles.length;

  return (
    <div className="container mx-auto py-12">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="p-6">
          <CardTitle className="text-2xl font-bold">
            Get Started with Control Core
          </CardTitle>
          <CardDescription>
            Follow these steps to secure your resources with access controls simplified, reduce risks, and achieve compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Step {currentStep} of {maxSteps}: {stepTitles[currentStep - 1]}
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToOverview}
              >
                <EnterpriseIcon name="arrow-left" size={16} className="mr-2" />
                Back to Overview
              </Button>
            </div>
            {renderStepContent()}
          </div>
          <div className="flex justify-between">
            {currentStep > 1 ? (
              <Button variant="secondary" onClick={prevStep}>
                <EnterpriseIcon name="chevron-left" size={16} className="mr-2" />
                Previous
              </Button>
            ) : (
              <div></div>
            )}
            <Button onClick={nextStep}>
              {currentStep < maxSteps ? (
                <>
                  Next
                  <EnterpriseIcon name="chevron-right" size={16} className="ml-2" />
                </>
              ) : (
                <>
                  <EnterpriseIcon name="check" size={16} className="mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
