
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle, XCircle, AlertTriangle, Clock, User, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Policy } from "../types";

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

interface OriginalPolicyBundle {
  id: string;
  name: string;
  version: string;
  lastModified: string;
  modifiedBy: string;
  policyCount: number;
}

interface PreflightCheck {
  name: string;
  status: "pending" | "passed" | "failed" | "warning";
  message: string;
}

interface OriginalApprover {
  id: string;
  name: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
}

interface PromotePoliciesWizardProps {
  sourceEnvironment?: PolicyEnvironment;
  selectedPolicies?: Policy[];
  onClose: () => void;
}

// Import centralized mock data
import { 
  MOCK_TARGET_ENVIRONMENTS, 
  MOCK_POLICY_BUNDLES, 
  MOCK_APPROVERS,
  type MockPolicyBundle,
  type MockApprover
} from "@/data/mockData";

// Type compatibility for existing component
type PolicyBundle = MockPolicyBundle;
type Approver = MockApprover;

const targetEnvironments = MOCK_TARGET_ENVIRONMENTS;
const mockBundles: PolicyBundle[] = MOCK_POLICY_BUNDLES;
const mockApprovers: Approver[] = MOCK_APPROVERS;

// Mock policies available for selection
const mockAvailablePolicies: Policy[] = [
  {
    id: "1",
    name: "HR Data Access Policy",
    description: "Controls access to HR sensitive data",
    status: "enabled",
    sandboxStatus: "enabled",
    productionStatus: "enabled",
    scope: ["HR", "Employees"],
    createdBy: "John Admin",
    modifiedBy: "John Admin",
    createdAt: "2024-05-15T10:00:00Z",
    lastModified: "2024-06-01T14:30:00Z",
    version: "v1.2",
    effect: "allow",
    resourceId: "resource-1",
    updatedAt: "2024-06-01T14:30:00Z"
  },
  {
    id: "2", 
    name: "Financial Records Policy",
    description: "Restricts access to financial records",
    status: "enabled",
    sandboxStatus: "enabled",
    productionStatus: "disabled",
    scope: ["Finance", "Accounting"],
    createdBy: "Jane Dev",
    modifiedBy: "Jane Dev", 
    createdAt: "2024-05-10T09:00:00Z",
    lastModified: "2024-05-28T16:45:00Z",
    version: "v2.1",
    effect: "allow",
    resourceId: "resource-2",
    updatedAt: "2024-05-28T16:45:00Z"
  },
  {
    id: "3",
    name: "Admin Dashboard Access",
    description: "Controls admin dashboard permissions",
    status: "enabled",
    sandboxStatus: "draft",
    productionStatus: "not-promoted",
    scope: ["Admin", "System"],
    createdBy: "System",
    modifiedBy: "Admin User",
    createdAt: "2024-04-20T11:00:00Z",
    lastModified: "2024-05-25T13:20:00Z",
    version: "v1.5",
    effect: "allow",
    resourceId: "resource-3",
    updatedAt: "2024-05-25T13:20:00Z"
  }
];

export function PromotePoliciesWizard({ sourceEnvironment, selectedPolicies = [], onClose }: PromotePoliciesWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [sourceEnv, setSourceEnv] = useState(sourceEnvironment?.id || "development");
  const [targetEnvironment, setTargetEnvironment] = useState("");
  const [promotionType, setPromotionType] = useState(selectedPolicies.length > 0 ? "specific" : "bundle");
  const [selectedBundle, setSelectedBundle] = useState<PolicyBundle | null>(null);
  const [selectedPoliciesState, setSelectedPoliciesState] = useState<Policy[]>(selectedPolicies);
  const [searchQuery, setSearchQuery] = useState("");
  const [preflightChecks, setPreflightChecks] = useState<PreflightCheck[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>(mockApprovers);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [comments, setComments] = useState("");
  const { toast } = useToast();

  const runPreflightChecks = () => {
    const checks: PreflightCheck[] = [
      { name: "Syntax & Semantic Validation", status: "pending", message: "Validating policy syntax..." },
      { name: "Environment Connectivity", status: "pending", message: "Checking PEP/PIP connectivity..." },
      { name: "Policy Conflict Analysis", status: "pending", message: "Analyzing policy conflicts..." },
      { name: "Dependency Check", status: "pending", message: "Verifying PIP dependencies..." },
      { name: "Performance Impact", status: "pending", message: "Simulating performance impact..." }
    ];
    
    setPreflightChecks(checks);
    
    // Simulate check execution
    checks.forEach((check, index) => {
      setTimeout(() => {
        const status = index === 2 ? "warning" : "passed";
        const message = index === 2 ? "2 minor conflicts detected - review recommended" : "Check passed successfully";
        
        setPreflightChecks(prev => prev.map((c, i) => 
          i === index ? { ...c, status, message } : c
        ));
      }, (index + 1) * 1000);
    });
  };

  const startDeployment = () => {
    setCurrentStep(6);
    const interval = setInterval(() => {
      setDeploymentProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          toast({
            title: "Deployment Complete",
            description: `Policies successfully promoted to ${targetEnvironment}`,
          });
          setTimeout(() => onClose(), 2000);
        }
        return newProgress;
      });
    }, 300);
  };

  const getCheckIcon = (status: string) => {
    switch (status) {
      case "passed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handlePolicySelection = (policy: Policy) => {
    setSelectedPoliciesState(prev => {
      const isSelected = prev.some(p => p.id === policy.id);
      if (isSelected) {
        return prev.filter(p => p.id !== policy.id);
      }
      return [...prev, policy];
    });
  };

  const filteredPolicies = mockAvailablePolicies.filter(policy =>
    searchQuery === "" || 
    policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Promote From:</label>
              <Select value={sourceEnv} onValueChange={setSourceEnv}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="qa">QA / Testing</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Promote To:</label>
              <Select value={targetEnvironment} onValueChange={setTargetEnvironment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target environment" />
                </SelectTrigger>
                <SelectContent>
                  {targetEnvironments
                    .filter(env => env.id !== sourceEnv)
                    .map(env => (
                      <SelectItem key={env.id} value={env.id}>
                        {env.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {targetEnvironment && (
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{sourceEnv}</Badge>
                  <ArrowRight className="h-4 w-4" />
                  <Badge variant="outline">{targetEnvironments.find(e => e.id === targetEnvironment)?.name}</Badge>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Select What to Promote</h3>
            
            <RadioGroup value={promotionType} onValueChange={setPromotionType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bundle" id="bundle" />
                <Label htmlFor="bundle">Promote Latest Active Bundle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific">Promote Specific Policies</Label>
              </div>
            </RadioGroup>

            {promotionType === "bundle" && (
              <div className="space-y-3">
                {mockBundles.map(bundle => (
                  <Card key={bundle.id} className={`cursor-pointer transition-all ${
                    selectedBundle?.id === bundle.id ? "ring-2 ring-primary" : ""
                  }`} onClick={() => setSelectedBundle(bundle)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={selectedBundle?.id === bundle.id} />
                          <div>
                            <div className="font-medium">{bundle.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {bundle.version} • {bundle.policyCount} policies
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Modified {bundle.lastModified} by {bundle.modifiedBy}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">View Content</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {promotionType === "specific" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search policies..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedPoliciesState.length} policies
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredPolicies.map(policy => (
                    <div key={policy.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedPoliciesState.some(p => p.id === policy.id)}
                        onCheckedChange={() => handlePolicySelection(policy)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{policy.name}</div>
                        <div className="text-xs text-muted-foreground">{policy.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Version {policy.version} • Modified by {policy.modifiedBy}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {policy.scope.join(", ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Pre-flight Checks</h3>
              {preflightChecks.length === 0 && (
                <Button onClick={runPreflightChecks}>Run Checks</Button>
              )}
            </div>

            <div className="space-y-3">
              {preflightChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCheckIcon(check.status)}
                    <div>
                      <div className="font-medium text-sm">{check.name}</div>
                      <div className="text-sm text-muted-foreground">{check.message}</div>
                    </div>
                  </div>
                  {check.status === "warning" && (
                    <Button variant="outline" size="sm">Review</Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Approval Gates</h3>
            <div className="space-y-3">
              {approvers.map(approver => (
                <Card key={approver.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{approver.name}</div>
                          <div className="text-sm text-muted-foreground">{approver.role}</div>
                        </div>
                      </div>
                      <Badge variant={approver.status === "approved" ? "default" : "outline"}>
                        {approver.status}
                      </Badge>
                    </div>
                    {approver.comments && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {approver.comments}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments</label>
              <Textarea 
                placeholder="Add comments for approvers..." 
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Review & Confirm</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Source:</span>
                  <span className="font-medium">{sourceEnv}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Target:</span>
                  <span className="font-medium">{targetEnvironments.find(e => e.id === targetEnvironment)?.name}</span>
                </div>
                {promotionType === "bundle" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Bundle:</span>
                      <span className="font-medium">{selectedBundle?.name} ({selectedBundle?.version})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Policies:</span>
                      <span className="font-medium">{selectedBundle?.policyCount}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Selected Policies:</span>
                    <span className="font-medium">{selectedPoliciesState.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {promotionType === "specific" && selectedPoliciesState.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Policies to Promote:</h4>
                <div className="space-y-1">
                  {selectedPoliciesState.map(policy => (
                    <div key={policy.id} className="text-sm p-2 bg-gray-50 rounded">
                      {policy.name} ({policy.version})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4 text-center">
            <h3 className="font-medium">Deploying Policies</h3>
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

  const canProceed = () => {
    switch (currentStep) {
      case 1: return targetEnvironment !== "";
      case 2: 
        if (promotionType === "bundle") {
          return selectedBundle !== null;
        } else {
          return selectedPoliciesState.length > 0;
        }
      case 3: return preflightChecks.length > 0 && preflightChecks.every(c => c.status !== "pending");
      case 4: return true; // Can proceed even without approvals for demo
      case 5: return true;
      default: return false;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Promote Policies - Step {currentStep} of 5</DialogTitle>
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
            
            {currentStep < 5 ? (
              <Button 
                onClick={() => {
                  if (currentStep === 3 && preflightChecks.length === 0) {
                    runPreflightChecks();
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button onClick={startDeployment}>
                Confirm & Deploy
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
