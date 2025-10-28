
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Copy, Download } from "lucide-react";

interface AddPDPInstanceDialogProps {
  onClose: () => void;
  onSave: (pdp: any) => void;
}

export function AddPDPInstanceDialog({ onClose, onSave }: AddPDPInstanceDialogProps) {
  const [currentStep, setCurrentStep] = useState("details");
  const [formData, setFormData] = useState({
    name: "",
    environment: "",
    description: "",
    location: "",
    deploymentType: "",
    apiEndpoint: "",
    authToken: "",
    policyLoadStrategy: "auto-sync",
    specificBundle: "",
    initialBundle: ""
  });

  const generateToken = () => {
    const token = `pdp_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setFormData(prev => ({ ...prev, authToken: token }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const getConnectionInstructions = () => {
    return `# PDP Configuration
PDP_NAME=${formData.name}
PAP_ENDPOINT=https://your-control-core.com/api/v1
AUTH_TOKEN=${formData.authToken}
ENVIRONMENT=${formData.environment}
POLICY_SYNC_INTERVAL=30s
HEARTBEAT_INTERVAL=10s`;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New PDP Instance</DialogTitle>
          <DialogDescription>
            Register a new Policy Decision Point instance to the platform
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} onValueChange={setCurrentStep}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
            <TabsTrigger value="policy">Policy Config</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">PDP Name/ID *</Label>
                <Input
                  id="name"
                  placeholder="e.g., pdp-prod-us-east-01"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="environment">Deployment Environment *</Label>
                <Select value={formData.environment} onValueChange={(value) => setFormData(prev => ({ ...prev, environment: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="qa">QA / Testing</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this PDP instance"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location/Region</Label>
                <Input
                  id="location"
                  placeholder="e.g., AWS us-east-1"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deploymentType">Deployment Type</Label>
                <Select value={formData.deploymentType} onValueChange={(value) => setFormData(prev => ({ ...prev, deploymentType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="containerized">Containerized</SelectItem>
                    <SelectItem value="vm">Virtual Machine</SelectItem>
                    <SelectItem value="serverless">Serverless</SelectItem>
                    <SelectItem value="bare-metal">Bare Metal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="connectivity" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiEndpoint">API Endpoint (Optional)</Label>
              <Input
                id="apiEndpoint"
                placeholder="https://pdp-instance.example.com/api"
                value={formData.apiEndpoint}
                onChange={(e) => setFormData(prev => ({ ...prev, apiEndpoint: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authToken">Authentication Token</Label>
              <div className="flex gap-2">
                <Input
                  id="authToken"
                  placeholder="Authentication token for secure communication"
                  value={formData.authToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, authToken: e.target.value }))}
                />
                <Button variant="outline" onClick={generateToken}>
                  Generate
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connection Instructions</CardTitle>
                <CardDescription>
                  Use these configuration values to connect your PDP to the PAP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <pre>{getConnectionInstructions()}</pre>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Config File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policy" className="space-y-4">
            <div className="space-y-4">
              <Label>Policy Load Strategy</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="auto-sync"
                    name="strategy"
                    value="auto-sync"
                    checked={formData.policyLoadStrategy === "auto-sync"}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyLoadStrategy: e.target.value }))}
                  />
                  <Label htmlFor="auto-sync">Auto-sync with Environment's Active Bundle (Recommended)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="specific"
                    name="strategy"
                    value="specific"
                    checked={formData.policyLoadStrategy === "specific"}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyLoadStrategy: e.target.value }))}
                  />
                  <Label htmlFor="specific">Load Specific Policy Bundle Version</Label>
                </div>
              </div>

              {formData.policyLoadStrategy === "specific" && (
                <div className="space-y-2">
                  <Label htmlFor="specificBundle">Specific Bundle Version</Label>
                  <Select value={formData.specificBundle} onValueChange={(value) => setFormData(prev => ({ ...prev, specificBundle: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bundle version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v2.1.5">v2.1.5</SelectItem>
                      <SelectItem value="v2.1.4">v2.1.4</SelectItem>
                      <SelectItem value="v2.1.3">v2.1.3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="initialBundle">Initial Policy Bundle</Label>
                <Select value={formData.initialBundle} onValueChange={(value) => setFormData(prev => ({ ...prev, initialBundle: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select initial bundle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest from Environment</SelectItem>
                    <SelectItem value="v2.1.5">v2.1.5</SelectItem>
                    <SelectItem value="v2.1.4">v2.1.4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review & Register</CardTitle>
                <CardDescription>Please review the configuration before registering the PDP</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>PDP Name:</strong> {formData.name}
                  </div>
                  <div>
                    <strong>Environment:</strong> {formData.environment}
                  </div>
                  <div>
                    <strong>Location:</strong> {formData.location}
                  </div>
                  <div>
                    <strong>Deployment Type:</strong> {formData.deploymentType}
                  </div>
                  <div>
                    <strong>Policy Strategy:</strong> {formData.policyLoadStrategy}
                  </div>
                  <div>
                    <strong>Initial Bundle:</strong> {formData.initialBundle}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {currentStep === "review" ? (
            <Button onClick={handleSave}>Register PDP</Button>
          ) : (
            <Button onClick={() => {
              const steps = ["details", "connectivity", "policy", "review"];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex < steps.length - 1) {
                setCurrentStep(steps[currentIndex + 1]);
              }
            }}>
              Next Step
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
