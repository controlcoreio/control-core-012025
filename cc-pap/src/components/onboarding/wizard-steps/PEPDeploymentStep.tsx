import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  ArrowRight, 
  Copy,
  CheckCircle,
  ExternalLink,
  Download,
  Code,
  Cloud,
  Server,
  Loader2,
  AlertTriangle,
  Info,
  Settings
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PEPDeploymentStepProps {
  onComplete: (data: any) => void;
  onNext: () => void;
}

const deploymentTargets = [
  {
    id: 'aws-gateway',
    name: 'AWS API Gateway',
    icon: Cloud,
    description: 'Amazon managed API service',
    popular: true,
    instructions: {
      install: 'Deploy CloudFormation Template',
      code: `# Download and deploy our AWS Lambda authorizer
aws cloudformation deploy --template-file controlcore-pep.yaml --stack-name controlcore-pep`
    }
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud Endpoints',
    icon: Cloud,
    description: 'Google Cloud API management',
    popular: false,
    instructions: {
      install: 'Deploy Cloud Function',
      code: `gcloud functions deploy controlcore-pep --runtime nodejs18 --trigger-http`
    }
  },
  {
    id: 'azure-api',
    name: 'Azure API Management',
    icon: Cloud,
    description: 'Microsoft Azure API gateway',
    popular: false,
    instructions: {
      install: 'Azure Policy Configuration',
      code: `# Configure Azure API Management policy`
    }
  },
  {
    id: 'apigee',
    name: 'Apigee API Gateway',
    icon: Shield,
    description: 'Google Apigee platform',
    popular: false,
    instructions: {
      install: 'Apigee Proxy Bundle',
      code: `# Deploy Apigee proxy with ControlCore PEP`
    }
  },
  {
    id: 'kong',
    name: 'Kong Gateway',
    icon: Shield,
    description: 'Kong API gateway platform',
    popular: true,
    instructions: {
      install: 'Kong Plugin Installation',
      code: `curl -X POST http://localhost:8001/plugins --data "name=controlcore-pep"`
    }
  },
  {
    id: 'nginx',
    name: 'NGINX / NGINX Plus',
    icon: Server,
    description: 'NGINX web server & proxy',
    popular: true,
    instructions: {
      install: 'NGINX Module Installation',
      code: `# Install ControlCore NGINX module
nginx -s reload`
    }
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes Cluster (Sidecar)',
    icon: Settings,
    description: 'K8s sidecar deployment',
    popular: true,
    instructions: {
      install: 'Kubernetes YAML Deployment',
      code: `kubectl apply -f controlcore-pep-sidecar.yaml`
    }
  },
  {
    id: 'docker',
    name: 'Docker Container / VM',
    icon: Server,
    description: 'Containerized deployment',
    popular: false,
    instructions: {
      install: 'Docker Container',
      code: `docker run -d controlcore/pep:latest`
    }
  },
  {
    id: 'custom-sdk',
    name: 'Custom SDK Integration',
    icon: Code,
    description: 'Direct application embedding',
    popular: false,
    instructions: {
      install: 'SDK Installation',
      code: `npm install @controlcore/pep-sdk`
    }
  }
];

export function PEPDeploymentStep({ onComplete, onNext }: PEPDeploymentStepProps) {
  const [apiUrl, setApiUrl] = useState('');
  const [apiPath, setApiPath] = useState('');
  const [environment, setEnvironment] = useState('development');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [pepId, setPepId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const generatePepId = () => {
    const id = `pep_${Math.random().toString(36).substr(2, 9)}`;
    setPepId(id);
    return id;
  };

  const handleDeploymentStart = () => {
    if (!apiUrl || !apiPath || !selectedTarget) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }

    const generatedPepId = generatePepId();
    setIsConnecting(true);

    // Simulate connection process
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      
      const pepData = {
        type: 'client-deployed',
        apiUrl,
        apiPath,
        environment,
        target: selectedTarget,
        pepId: generatedPepId
      };
      
      onComplete(pepData);
      
      toast({
        title: "PEP Connected!",
        description: "Your Policy Enforcement Point is now active and ready to protect your API.",
      });
    }, 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard.",
    });
  };

  const selectedTargetData = deploymentTargets.find(t => t.id === selectedTarget);
  const popularTargets = deploymentTargets.filter(t => t.popular);
  const otherTargets = deploymentTargets.filter(t => !t.popular);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Deploy ControlCore PEP to Your Infrastructure</h2>
        <p className="text-xl text-muted-foreground">
          Integrate ControlCore's PEP directly into your cloud or on-premise infrastructure. This offers maximum control and customizability for high-security or high-volume authorization needs.
        </p>
      </div>

      {/* Education Note */}
      <Alert className="border-sap-corporate-blue-200 bg-sap-corporate-blue-50 dark:bg-sap-corporate-blue-900/20">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sap-corporate-blue-800 dark:text-sap-corporate-blue-200">
          While these API Gateways offer basic security, they lack the context-aware, real-time authorization ControlCore provides. 
          Our PEP integrates seamlessly to deliver granular, dynamic access control far beyond what a typical API Gateway can do alone.
        </AlertDescription>
      </Alert>

      {/* API Information */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Tell us about your API</CardTitle>
          <CardDescription>
            Provide details about the API endpoint you want to protect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">API Base URL *</Label>
              <Input
                id="apiUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.yourcompany.com/v1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiPath">API Path to Protect *</Label>
              <Input
                id="apiPath"
                value={apiPath}
                onChange={(e) => setApiPath(e.target.value)}
                placeholder="/orders, /users/{id}/profile"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Target Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Choose Your Deployment Target</CardTitle>
          <CardDescription>
            Select your platform for seamless integration instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Popular Options */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Badge variant="default" className="text-xs">Popular</Badge>
              Most Common Deployments
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularTargets.map((target) => (
                <Card
                  key={target.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTarget === target.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTarget(target.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <target.icon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-base">{target.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {target.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {selectedTarget === target.id && (
                    <CardContent className="pt-0">
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Other Options */}
          <div>
            <h4 className="font-semibold mb-3">Additional Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherTargets.map((target) => (
                <Card
                  key={target.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTarget === target.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTarget(target.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <target.icon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-base">{target.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {target.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {selectedTarget === target.id && (
                    <CardContent className="pt-0">
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Note */}
      <Alert className="border-sap-enterprise-amber-200 bg-sap-enterprise-amber-50 dark:bg-sap-enterprise-amber-900/20">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sap-enterprise-amber-800 dark:text-sap-enterprise-amber-200">
          For more customized deployment options, including PEP as a sidecar, container, or other formats for specific environments, 
          please explore the 'PEP Deployment Options' in your main Settings page after completing this setup.
        </AlertDescription>
      </Alert>

      {/* Warning Note */}
      <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          <strong>Important:</strong> Deploying and managing a PEP on your infrastructure requires advanced engineering support 
          and familiarity with your chosen environment. Please ensure you have the necessary technical resources available.
        </AlertDescription>
      </Alert>

      {/* Deployment Instructions */}
      {selectedTargetData && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Deploy Your PEP</CardTitle>
            <CardDescription>
              Follow these instructions to integrate with {selectedTargetData.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Installation</h4>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex items-center justify-between">
                  <code className="text-sm">{selectedTargetData.instructions.install}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedTargetData.instructions.install)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Integration Code</h4>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    <code>{selectedTargetData.instructions.code}</code>
                  </pre>
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedTargetData.instructions.code)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* PEP ID Input */}
            <div className="border-t pt-4">
              <Label htmlFor="pepId">Your PEP ID (paste after deployment)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="pepId"
                  value={pepId}
                  onChange={(e) => setPepId(e.target.value)}
                  placeholder="Paste your deployed PEP ID here"
                />
                <Button
                  onClick={handleDeploymentStart}
                  disabled={!pepId || isConnecting || isConnected}
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isConnected ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : null}
                  {isConnecting ? 'Connecting...' : isConnected ? 'Connected!' : 'Test Connection'}
                </Button>
              </div>
            </div>

            {/* Connection Status */}
            {isConnecting && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-blue-800 dark:text-blue-200">
                    Waiting for PEP connection...
                  </span>
                </div>
              </div>
            )}

            {isConnected && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 dark:text-green-200">
                    PEP Connected! Your API is now protected.
                  </span>
                </div>
              </div>
            )}

            {/* Help Links */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Need Help?</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Documentation
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Sample Code
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      {isConnected && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Great! Your PEP is Active</h3>
              <p className="text-muted-foreground mb-4">
                Now let's create your first policy to control access to your protected API.
              </p>
              <Button onClick={onNext} size="lg" className="font-semibold">
                Next: Define Your API Access Rules
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
