
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Copy, ExternalLink, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface OPALServerConfigDialogProps {
  onClose: () => void;
  onSave: (config: any) => void;
}

export function OPALServerConfigDialog({ onClose, onSave }: OPALServerConfigDialogProps) {
  const [deploymentModel, setDeploymentModel] = useState<"hosted" | "self-hosted">("hosted");
  const [formData, setFormData] = useState({
    endpoint: "",
    apiKey: "",
    webhookSecret: "",
    testConnectionStatus: null as "success" | "error" | null
  });

  const generateApiKey = () => {
    const key = `opal_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setFormData(prev => ({ ...prev, apiKey: key }));
  };

  const testConnection = async () => {
    // Simulate API call
    setTimeout(() => {
      setFormData(prev => ({ ...prev, testConnectionStatus: "success" }));
    }, 1000);
  };

  const handleSave = () => {
    onSave({ deploymentModel, ...formData });
  };

  const getOPALClientInstructions = () => {
    return `# OPAL Client Configuration for OPA
OPAL_SERVER_URL=https://opal.ourplatform.com
OPAL_CLIENT_TOKEN=<your-api-key>
OPAL_INLINE_OPA_ENABLED=true
OPAL_INLINE_OPA_CONFIG={"server": {"addr": ":8181"}}

# Start OPA with OPAL client
docker run -it --rm \\
  -p 8181:8181 \\
  -e OPAL_SERVER_URL=https://opal.ourplatform.com \\
  -e OPAL_CLIENT_TOKEN=<your-api-key> \\
  permitio/opal-client:latest`;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>OPAL Server Configuration</DialogTitle>
          <DialogDescription>
            Configure how your PDPs (OPA instances) connect to OPAL for policy and data distribution
          </DialogDescription>
        </DialogHeader>

        <Tabs value={deploymentModel} onValueChange={(value) => setDeploymentModel(value as "hosted" | "self-hosted")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hosted">Managed OPAL Service</TabsTrigger>
            <TabsTrigger value="self-hosted">Self-Hosted OPAL</TabsTrigger>
          </TabsList>

          <TabsContent value="hosted" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your OPAL servers are fully managed by us. No configuration required here.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Managed OPAL Service Details</CardTitle>
                <CardDescription>Read-only information about your managed OPAL instance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>OPAL Server Endpoint</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value="https://opal.ourplatform.com" readOnly className="bg-muted" />
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Service Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Operational
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>OPAL Client Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Use the API key from your PEP Management section for OPAL client authentication. 
                    This key allows your OPA instances to connect to our managed OPAL service.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View PEP Management
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Installation Guides
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">OPAL Client Setup Instructions</CardTitle>
                <CardDescription>Copy these instructions to set up OPA with OPAL client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <pre>{getOPALClientInstructions()}</pre>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Instructions
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download Helm Chart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="self-hosted" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Configure your self-hosted OPAL server(s) to integrate with our Policy Administration Point (PAP).
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">OPAL Server Configuration</CardTitle>
                <CardDescription>Configure connectivity between our PAP and your OPAL server</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="endpoint">OPAL Server Endpoint *</Label>
                  <Input
                    id="endpoint"
                    placeholder="https://your-opal-server.yourdomain.com"
                    value={formData.endpoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key for PAP to OPAL Authentication</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      placeholder="API key for our PAP to authenticate to your OPAL server"
                      value={formData.apiKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    />
                    <Button variant="outline" onClick={generateApiKey}>
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This key allows our PAP to push policies and data to your OPAL server
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
                  <Input
                    id="webhookSecret"
                    placeholder="Secret for OPAL to send status updates back to our PAP"
                    value={formData.webhookSecret}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhookSecret: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={testConnection}>
                    Test OPAL Connection
                  </Button>
                  {formData.testConnectionStatus === "success" && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connection Successful
                    </Badge>
                  )}
                  {formData.testConnectionStatus === "error" && (
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Connection Failed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deployment Resources</CardTitle>
                <CardDescription>Resources to help deploy and configure your OPAL server</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Kubernetes Helm Chart</div>
                      <div className="text-sm text-muted-foreground">Deploy OPAL server on Kubernetes</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Docker Compose</div>
                      <div className="text-sm text-muted-foreground">Run OPAL server with Docker</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Configuration Guide</div>
                      <div className="text-sm text-muted-foreground">Complete setup documentation</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Best Practices</div>
                      <div className="text-sm text-muted-foreground">Security and performance tips</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
