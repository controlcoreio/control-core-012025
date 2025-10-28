import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Play,
  Eye,
  Copy,
  Download,
  Upload,
  GitBranch,
  Zap,
  Lock,
  Unlock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PolicyPromotionProps {
  policyId: string;
  policyName: string;
  fromEnvironment: 'sandbox' | 'production';
  toEnvironment: 'sandbox' | 'production';
  open: boolean;
  onClose: () => void;
  onPromote: (policyId: string, fromEnv: string, toEnv: string) => void;
}

interface PromotionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  icon: React.ComponentType<{ className?: string }>;
}

export function PolicyPromotion({
  policyId,
  policyName,
  fromEnvironment,
  toEnvironment,
  open,
  onClose,
  onPromote
}: PolicyPromotionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionSteps, setPromotionSteps] = useState<PromotionStep[]>([
    {
      id: 'validate',
      title: 'Validate Policy',
      description: 'Check policy syntax and dependencies',
      status: 'pending',
      icon: CheckCircle
    },
    {
      id: 'test',
      title: 'Run Tests',
      description: 'Execute automated tests in target environment',
      status: 'pending',
      icon: Play
    },
    {
      id: 'backup',
      title: 'Create Backup',
      description: 'Backup existing policy in target environment',
      status: 'pending',
      icon: Copy
    },
    {
      id: 'deploy',
      title: 'Deploy Policy',
      description: 'Deploy policy to target environment',
      status: 'pending',
      icon: Upload
    },
    {
      id: 'verify',
      title: 'Verify Deployment',
      description: 'Verify policy is working correctly',
      status: 'pending',
      icon: Shield
    }
  ]);

  const { toast } = useToast();

  const handlePromote = async () => {
    setIsPromoting(true);
    setCurrentStep(0);

    try {
      // Simulate promotion process
      for (let i = 0; i < promotionSteps.length; i++) {
        setCurrentStep(i);
        setPromotionSteps(prev => 
          prev.map((step, index) => ({
            ...step,
            status: index === i ? 'in-progress' : step.status
          }))
        );

        // Simulate step processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        setPromotionSteps(prev => 
          prev.map((step, index) => ({
            ...step,
            status: index === i ? 'completed' : step.status
          }))
        );
      }

      // Complete promotion
      onPromote(policyId, fromEnvironment, toEnvironment);
      
      toast({
        title: "Policy Promoted Successfully",
        description: `${policyName} has been promoted to ${toEnvironment}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Promotion Failed",
        description: "Failed to promote policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const getStepIcon = (step: PromotionStep) => {
    const Icon = step.icon;
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Icon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepColor = (step: PromotionStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-600" />
            Promote Policy
          </DialogTitle>
          <DialogDescription>
            Promote {policyName} from {fromEnvironment} to {toEnvironment}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Policy Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Policy Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{policyName}</span>
                <Badge variant="outline">ID: {policyId}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  From: {fromEnvironment}
                </div>
                <ArrowRight className="h-3 w-3" />
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  To: {toEnvironment}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promotion Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Promotion Process</CardTitle>
              <CardDescription>
                The following steps will be executed to promote your policy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {promotionSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg">
                    <div className={`p-2 rounded-full ${getStepColor(step)}`}>
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-1">
                      <h6 className="font-medium">{step.title}</h6>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {step.status === 'completed' && (
                      <Badge className="bg-green-600">Completed</Badge>
                    )}
                    {step.status === 'in-progress' && (
                      <Badge className="bg-blue-600">In Progress</Badge>
                    )}
                    {step.status === 'failed' && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Environment Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Environment Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Sandbox</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Development environment</p>
                    <p>• Safe for testing</p>
                    <p>• No impact on production</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Production</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Live environment</p>
                    <p>• Affects real users</p>
                    <p>• Requires approval</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {toEnvironment === 'production' && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h6 className="font-medium text-yellow-800 dark:text-yellow-200">
                      Production Deployment Warning
                    </h6>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      This will deploy the policy to your production environment. 
                      Make sure you have tested thoroughly in sandbox.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handlePromote}
            disabled={isPromoting}
            className="flex items-center gap-2"
          >
            {isPromoting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Promoting...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Promote Policy
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
