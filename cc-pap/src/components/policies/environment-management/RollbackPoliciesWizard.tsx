import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle, RotateCcw } from "lucide-react";
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

// Import centralized mock data
import { MOCK_HISTORICAL_BUNDLES, type MockHistoricalBundle } from "@/data/mockData";

interface RollbackPoliciesWizardProps {
  environment: PolicyEnvironment;
  onClose: () => void;
}

const mockHistoricalBundles: MockHistoricalBundle[] = MOCK_HISTORICAL_BUNDLES.map(bundle => ({
  ...bundle,
  deployedDate: bundle.createdAt,
  isCurrent: bundle.id === 'bundle-001',
  isRecommended: bundle.id === 'bundle-002'
}));

export function RollbackPoliciesWizard({ environment, onClose }: RollbackPoliciesWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBundle, setSelectedBundle] = useState<MockHistoricalBundle | null>(null);
  const [rollbackProgress, setRollbackProgress] = useState(0);
  const { toast } = useToast();

  const startRollback = () => {
    setCurrentStep(4);
    const interval = setInterval(() => {
      setRollbackProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          toast({
            title: "Rollback Complete",
            description: `Successfully rolled back to ${selectedBundle?.version}`,
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
              <label className="text-sm font-medium">Environment to Rollback:</label>
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium">{environment.name}</div>
                <div className="text-sm text-muted-foreground">{environment.description}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Current Version: {environment.currentBundleVersion}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Select Target Rollback Version</h3>
              {mockHistoricalBundles.map(bundle => (
                <Card 
                  key={bundle.id} 
                  className={`cursor-pointer transition-all ${
                    selectedBundle?.id === bundle.id ? "ring-2 ring-primary" : ""
                  } ${bundle.isCurrent ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !bundle.isCurrent && setSelectedBundle(bundle)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          bundle.status === "success" || bundle.status === "active" ? "bg-green-500" : "bg-red-500"
                        }`}></div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {bundle.version}
                            {bundle.isCurrent && <Badge variant="outline">Current</Badge>}
                            {bundle.isRecommended && <Badge variant="default">Recommended</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bundle.policyCount} policies • Deployed {bundle.deployedDate}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            by {bundle.deployedBy} • Status: {bundle.status}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" disabled={bundle.isCurrent}>
                        View Content
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
            <h3 className="font-medium">Impact Analysis</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Rollback Compatibility</div>
                  <div className="text-sm text-muted-foreground">Version {selectedBundle?.version} is compatible with current environment</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="font-medium text-sm">Feature Impact</div>
                  <div className="text-sm text-muted-foreground">3 policies added after this version will be disabled</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Security Assessment</div>
                  <div className="text-sm text-muted-foreground">No security vulnerabilities introduced by rollback</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm text-yellow-800">Important Notice</div>
                  <div className="text-sm text-yellow-700">
                    Rolling back will revert to an earlier policy configuration. Make sure this aligns with your security requirements.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Review & Confirm Rollback</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Environment:</span>
                  <span className="font-medium">{environment.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Version:</span>
                  <span className="font-medium">{environment.currentBundleVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rollback To:</span>
                  <span className="font-medium">{selectedBundle?.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Deployed Date:</span>
                  <span className="font-medium">{selectedBundle?.deployedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Policy Count:</span>
                  <span className="font-medium">{selectedBundle?.policyCount}</span>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm text-red-800">Confirm Rollback</div>
                  <div className="text-sm text-red-700">
                    This action will rollback the environment to a previous state. This action cannot be undone automatically.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 text-center">
            <RotateCcw className="h-12 w-12 mx-auto text-primary animate-spin" />
            <h3 className="font-medium">Rolling Back Policies</h3>
            <Progress value={rollbackProgress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              {rollbackProgress < 100 ? "Rollback in progress..." : "Rollback completed successfully!"}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedBundle !== null;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rollback Policies - Step {currentStep} of 3</DialogTitle>
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
            
            {currentStep < 3 ? (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : currentStep === 3 ? (
              <Button onClick={startRollback} variant="destructive">
                Confirm Rollback
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
