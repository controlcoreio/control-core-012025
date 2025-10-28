
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useState } from "react";

interface PBACEducationStepProps {
  onComplete: () => void;
  onNext: () => void;
}

export function PBACEducationStep({ onComplete, onNext }: PBACEducationStepProps) {
  const [deploymentChoice, setDeploymentChoice] = useState<string>('');
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const handleSectionComplete = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  const handleDeploymentChoice = (choice: string) => {
    setDeploymentChoice(choice);
    localStorage.setItem('controlcore-deployment-type', choice);
    localStorage.setItem('controlcore_deployment_model', choice);
    handleSectionComplete('deployment');
    // Call onNext immediately after setting the choice
    onNext();
  };

  const canProceed = deploymentChoice !== '' || completedSections.has('deployment');

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-4 rounded-full">
            <EnterpriseIcon name="shield" size={48} className="text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold">Your Rules. Your Control</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Decide who can use your AI, Data, API or Apps (modern or legacy) and inject instructions as dynamic context.
        </p>
      </div>

      {/* Key Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <EnterpriseIcon name="lock" size={32} className="text-primary" />
              <CardTitle className="text-lg">What is Control Core?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use flexible rules to decide who (including AI Agents) can access what. 
              Enable instant context-aware real-time permissions with no-code changes.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <EnterpriseIcon name="check" size={16} className="text-green-500" />
                <span>Context-aware decisions</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <EnterpriseIcon name="check" size={16} className="text-green-500" />
                <span>No-code policy management</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <EnterpriseIcon name="check" size={16} className="text-green-500" />
                <span>Real-time enforcement</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <EnterpriseIcon name="server" size={32} className="text-primary" />
              <CardTitle className="text-lg">Your Digital Bouncer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The Enforcement Point in Control Core is the 'bouncer' for your digital assets. All requests pass through it, 
              and it instantly checks your rules before allowing access.
            </p>
            <div className="mt-4 bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>Request</span>
                <EnterpriseIcon name="arrow-right" size={12} />
                <span className="bg-primary/20 px-2 py-1 rounded">Bouncer</span>
                <EnterpriseIcon name="arrow-right" size={12} />
                <span>Resource</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <EnterpriseIcon name="shield" size={32} className="text-primary" />
              <CardTitle className="text-lg">Real-Time & Granular</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Prevent unauthorized access from external partners, malicious actors, and crucially, 
              from uncontrolled AI tools with fine-grained, real-time decision making policies.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <EnterpriseIcon name="check" size={16} className="text-green-500" />
                <span>Block unauthorized access</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <EnterpriseIcon name="check" size={16} className="text-green-500" />
                <span>Manage dynamic context</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <EnterpriseIcon name="check" size={16} className="text-green-500" />
                <span>Meet compliance requirements</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Options */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Hire Your Digital Bouncer</h3>
          <p className="text-muted-foreground">
            For the Kickstart Pilot, you download and host everything in your own infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Self-Hosted Option - Recommended for Kickstart */}
          <Card 
            className={`relative border-2 cursor-pointer transition-all ${
              deploymentChoice === 'self-hosted' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleDeploymentChoice('self-hosted')}
          >
            <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
              Kickstart Pilot
            </Badge>
            <CardHeader>
              <div className="flex items-center gap-3">
                <EnterpriseIcon name="server" size={32} className="text-primary" />
                <div>
                  <CardTitle className="text-xl">Host Yourself</CardTitle>
                  <CardDescription>Deploy Within Your Infrastructure</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                You download and deploy both Control Plane and Bouncer within your own infrastructure, for maximum control and data privacy.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <EnterpriseIcon name="check" size={16} className="text-primary" />
                  <span className="font-medium">Full Control</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <EnterpriseIcon name="activity" size={16} className="text-primary" />
                  <span className="font-medium">High Performance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <EnterpriseIcon name="cloud" size={16} className="text-primary" />
                  <span className="font-medium">Your Cloud, Your Rules</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                variant={deploymentChoice === 'self-hosted' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeploymentChoice('self-hosted');
                }}
              >
                Next: Download Control Core
              </Button>
            </CardContent>
          </Card>

          {/* Hosted Option - Future Plan */}
          <Card 
            className={`relative border-2 transition-all ${
              deploymentChoice === 'hosted' 
                ? 'border-primary bg-primary/5' 
                : 'border-border opacity-60'
            }`}
          >
            <Badge className="absolute -top-2 left-4 bg-muted text-muted-foreground">
              Coming Soon
            </Badge>
            <CardHeader>
              <div className="flex items-center gap-3">
                <EnterpriseIcon name="cloud" size={32} className="text-muted-foreground" />
                <div>
                  <CardTitle className="text-xl text-muted-foreground">Control Core Hosted</CardTitle>
                  <CardDescription>Managed Service (Future Plan)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We host and manage the Control Plane, you deploy only the Bouncer. Available in future enterprise plans.
              </p>
              
              <div className="space-y-2 opacity-50">
                <div className="flex items-center gap-2 text-sm">
                  <EnterpriseIcon name="code" size={16} className="text-muted-foreground" />
                  <span className="font-medium">No Code Changes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <EnterpriseIcon name="check" size={16} className="text-muted-foreground" />
                  <span className="font-medium">Quick Setup</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <EnterpriseIcon name="lock" size={16} className="text-muted-foreground" />
                  <span className="font-medium">Data Privacy</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                disabled
              >
                Available in Enterprise Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center pt-6">
        {canProceed && (
          <Button onClick={onNext} size="lg">
            Continue Setup
            <EnterpriseIcon name="arrow-right" size={16} className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
