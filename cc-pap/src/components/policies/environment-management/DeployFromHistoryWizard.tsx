
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PolicyEnvironment {
  id: string;
  name: string;
  description: string;
  activePolicies: number;
  pendingPromotions: number;
  conflictsDetected: number;
  lastUpdated: string;
  updatedBy: string;
  currentBundleVersion: string;
  status: "healthy" | "warning" | "error";
}


interface DeployFromHistoryWizardProps {
  environment: PolicyEnvironment;
  onClose: () => void;
}

// Import centralized mock data
import { MOCK_HISTORICAL_BUNDLES, type MockHistoricalBundle } from "@/data/mockData";

type HistoricalBundle = MockHistoricalBundle;
const mockHistoricalBundles: HistoricalBundle[] = MOCK_HISTORICAL_BUNDLES;

export function DeployFromHistoryWizard({ environment, onClose }: DeployFromHistoryWizardProps) {
  const [selectedBundle, setSelectedBundle] = useState<HistoricalBundle | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const { toast } = useToast();

  const startDeployment = () => {
    setCurrentStep(3);
    const interval = setInterval(() => {
      setDeploymentProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          toast({
            title: "Deployment Complete",
            description: `Successfully deployed ${selectedBundle?.version} to ${environment.name}`,
          });
          setTimeout(() => onClose(), 2000);
        }
        return newProgress;
      });
    }, 300);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deploy To:</label>
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium">{environment.name}</div>
                <div className="text-sm text-muted-foreground">{environment.description}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Current Version: {environment.currentBundleVersion}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Select Version from History</h3>
              {mockHistoricalBundles.map(bundle => (
                <Card 
                  key={bundle.id} 
                  className={`cursor-pointer transition-all ${
                    selectedBundle?.id === bundle.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedBundle(bundle)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {bundle.version}
                            <Badge variant="outline">{bundle.environment}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bundle.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {bundle.policyCount} policies • Created {bundle.createdAt} by {bundle.createdBy}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Review & Confirm Deployment</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Target Environment:</span>
                  <span className="font-medium">{environment.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bundle Version:</span>
                  <span className="font-medium">{selectedBundle?.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Source Environment:</span>
                  <span className="font-medium">{selectedBundle?.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Policy Count:</span>
                  <span className="font-medium">{selectedBundle?.policyCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created By:</span>
                  <span className="font-medium">{selectedBundle?.createdBy}</span>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm">
                <div className="font-medium text-blue-800 mb-1">Description</div>
                <div className="text-blue-700">{selectedBundle?.description}</div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 text-center">
            <History className="h-12 w-12 mx-auto text-primary" />
            <h3 className="font-medium">Deploying from History</h3>
            <Progress value={deploymentProgress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              {deploymentProgress < 100 ? "Deployment in progress..." : "Deployment completed successfully!"}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deploy from History - Step {currentStep} of 2</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderStep()}

          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
            >
              {currentStep === 1 ? "Cancel" : "Previous"}
            </Button>
            
            {currentStep === 1 ? (
              <Button 
                onClick={() => setCurrentStep(2)}
                disabled={!selectedBundle}
              >
                Next
              </Button>
            ) : currentStep === 2 ? (
              <Button onClick={startDeployment}>
                Confirm & Deploy
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
