import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DeploymentModelStepProps {
  onComplete: () => void;
  onNext: () => void;
}

export function DeploymentModelStep({ onComplete, onNext }: DeploymentModelStepProps) {
  const [deploymentChoice, setDeploymentChoice] = useState<string>("");
  const { updateUser } = useAuth();
  const { toast } = useToast();

  const handleDeploymentChoice = (choice: 'hosted' | 'self-hosted') => {
    setDeploymentChoice(choice);
    updateUser({ deploymentModel: choice });
    
    localStorage.setItem('controlcore_deployment_model', choice);
    
    toast({
      title: "Deployment Model Selected",
      description: `You've chosen the ${choice === 'hosted' ? 'Control Core Hosted' : 'Self-Hosted'} option.`,
    });
    
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Deployment Model</h2>
        <p className="text-muted-foreground">
          Select how you want to deploy Control Core's Policy Enforcement Points (PEPs)
        </p>
      </div>

      <div className="grid gap-4">
        {/* Control Core Hosted Option */}
        <Card 
          className={`cursor-pointer border-2 transition-all hover:border-primary/50 ${
            deploymentChoice === 'hosted' ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onClick={() => handleDeploymentChoice('hosted')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <EnterpriseIcon name="cloud" size={24} className="text-primary" />
                <CardTitle className="text-lg">Control Core Hosted</CardTitle>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              {deploymentChoice === 'hosted' && (
                <EnterpriseIcon name="check" size={20} className="text-primary" />
              )}
            </div>
            <CardDescription>
              We manage the control plane, you deploy our PEP container in your cloud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <EnterpriseIcon name="check" size={16} className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-sm">Maximum Data Privacy</p>
                  <p className="text-sm text-muted-foreground">Your data never leaves your infrastructure</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <EnterpriseIcon name="lock" size={16} className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-sm">Quick Setup</p>
                  <p className="text-sm text-muted-foreground">Deploy PEP container in minutes</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <EnterpriseIcon name="settings" size={16} className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-sm">Managed Control Plane</p>
                  <p className="text-sm text-muted-foreground">We handle updates, monitoring, and scaling</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <EnterpriseIcon name="check" size={16} className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-sm">GitHub Integration</p>
                  <p className="text-sm text-muted-foreground">Policies sync automatically to your repository</p>
                </div>
              </div>
            </div>
            
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <EnterpriseIcon name="exclamation-triangle" size={16} />
              <AlertDescription>
                <strong>Perfect for:</strong> Organizations wanting enterprise features with minimal operational overhead. 
                Your sensitive data stays in your cloud while we manage the complexity.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Self-Hosted Option - Now enabled */}
        <Card 
          className={`cursor-pointer border-2 transition-all hover:border-primary/50 ${
            deploymentChoice === 'self-hosted' ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onClick={() => handleDeploymentChoice('self-hosted')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <EnterpriseIcon name="server" size={24} className="text-primary" />
                <CardTitle className="text-lg">Host Yourself</CardTitle>
                <Badge variant="secondary">Full Control</Badge>
              </div>
              {deploymentChoice === 'self-hosted' && (
                <EnterpriseIcon name="check" size={20} className="text-primary" />
              )}
            </div>
            <CardDescription>
              Complete on-premises deployment of both control plane and PEPs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <EnterpriseIcon name="lock" size={16} className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-sm">Complete Data Control</p>
                  <p className="text-sm text-muted-foreground">Everything runs on your infrastructure</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <EnterpriseIcon name="server" size={16} className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-sm">Full Customization</p>
                  <p className="text-sm text-muted-foreground">Customize every aspect of the deployment</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <EnterpriseIcon name="shield" size={16} className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-sm">Enhanced Security</p>
                  <p className="text-sm text-muted-foreground">Meet the strictest security requirements</p>
                </div>
              </div>
            </div>
            
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <EnterpriseIcon name="exclamation-triangle" size={16} />
              <AlertDescription>
                <strong>Perfect for:</strong> Organizations with strict data residency requirements or those who need complete control over their infrastructure.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {deploymentChoice && (
        <div className="text-center">
          <Button onClick={() => handleDeploymentChoice(deploymentChoice as 'hosted' | 'self-hosted')}>
            {deploymentChoice === 'self-hosted' 
              ? 'Next: Download your Control Plane and the Bouncer' 
              : `Continue with ${deploymentChoice === 'hosted' ? 'Hosted' : 'Self-Hosted'} Setup`
            }
            <EnterpriseIcon name="arrow-right" size={16} className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}