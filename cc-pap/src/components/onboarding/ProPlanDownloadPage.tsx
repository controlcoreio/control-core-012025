import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, Download, CheckCircle, ArrowRight, Info, AlertTriangle, ArrowLeft } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

const pepOptions = [
  {
    id: "api-gateway",
    name: "API Gateway PEP",
    description: "Proxy-based enforcement for REST APIs and microservices",
    formats: ["docker", "helm-chart", "kubernetes-yaml"],
    icon: "server",
    deploymentType: "proxy",
    recommended: true,
    hostedComplexity: "simple",
    tooltip: "Deploy as a proxy in front of REST APIs and microservices. Generates a secure proxy URL like https://pep.yourcompany.com/api/v1/customers that enforces policies before forwarding to your actual API. Use when protecting customer APIs, payment services, or any HTTP-based endpoints.",
    architecture: "Client → PEP Proxy → Protected API",
    proxyUrlFormat: "https://pep-gateway.domain.com/{original-path}",
    downloadSize: "125 MB"
  },
  {
    id: "application",
    name: "Application PEP", 
    description: "Sidecar/embedded agent for runtime application protection",
    formats: ["library", "agent", "docker"],
    icon: "shield",
    deploymentType: "sidecar",
    recommended: false,
    hostedComplexity: "advanced",
    tooltip: "Deploy as a sidecar container or embedded SDK for runtime interception within applications. Use for fine-grained method-level authorization in banking apps, healthcare systems, or enterprise applications that need embedded policy enforcement.",
    architecture: "Application ←→ PEP Sidecar ←→ Control Plane",
    proxyUrlFormat: "N/A (Runtime interception)",
    downloadSize: "89 MB"
  },
  {
    id: "network",
    name: "Network PEP", 
    description: "Network-level traffic interception and segmentation",
    formats: ["docker", "helm-chart", "executable"],
    icon: "server",
    deploymentType: "transparent-proxy",
    recommended: false,
    hostedComplexity: "advanced",
    tooltip: "Deploy for transparent network traffic control and micro-segmentation. Use for controlling traffic between kubernetes pods, network segments, or when you need to secure east-west traffic in microservices architectures without changing application code.",
    architecture: "Network Traffic → Transparent PEP → Destination",
    proxyUrlFormat: "N/A (Transparent interception)",
    downloadSize: "156 MB"
  },
  {
    id: "ai-agent-a2a",
    name: "AI Agent A2A PEP",
    description: "Proxy-based enforcement for Agent-to-Agent protocol communications",
    formats: ["docker", "helm-chart", "library"],
    icon: "brain",
    deploymentType: "proxy",
    recommended: true,
    hostedComplexity: "simple",
    tooltip: "Deploy as a proxy between AI agents using A2A protocols. Generates secure proxy endpoints like https://a2a-pep.domain.com/agent/financial-analyzer that enforce policies before agent communications. Use when AI agents need controlled access to other agents or services.",
    architecture: "AI Agent → A2A PEP Proxy → Target AI Agent",
    proxyUrlFormat: "https://a2a-pep.domain.com/agent/{target-agent-id}",
    downloadSize: "98 MB"
  },
  {
    id: "mcp-server",
    name: "MCP Server PEP",
    description: "Proxy-based protection for Model Context Protocol servers and AI models",
    formats: ["docker", "helm-chart", "proxy"],
    icon: "cpu",
    deploymentType: "proxy",
    recommended: true,
    hostedComplexity: "simple",
    tooltip: "Deploy as a proxy in front of MCP servers to control AI model access and context sharing. Generates secure endpoints like https://mcp-pep.domain.com/models/gpt-4 that enforce policies before model access. Use when protecting access to language models, knowledge bases, or AI inference services.",
    architecture: "AI Application → MCP PEP Proxy → MCP Server → AI Model",
    proxyUrlFormat: "https://mcp-pep.domain.com/models/{model-id}",
    downloadSize: "112 MB"
  }
];

export function ProPlanDownloadPage() {
  const [selectedPEPs, setSelectedPEPs] = useState<string[]>([]);
  const [downloadedPEPs, setDownloadedPEPs] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { completeSetup } = useSubscription();
  const { toast } = useToast();

  const togglePEPSelection = (pepId: string) => {
    setSelectedPEPs(prev => 
      prev.includes(pepId) 
        ? prev.filter(id => id !== pepId)
        : [...prev, pepId]
    );
  };

  const handleDownload = async (pepId: string) => {
    setIsDownloading(pepId);
    // Simulate download process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setDownloadedPEPs(prev => [...prev, pepId]);
    setIsDownloading(null);
    
    toast({
      title: "Download Complete",
      description: `${pepOptions.find(p => p.id === pepId)?.name} downloaded successfully`,
    });
  };

  const handleContinue = async () => {
    await completeSetup();
    toast({
      title: "Setup Complete!",
      description: "Welcome to your Control Core Pro environment",
    });
    navigate('/');
  };

  const recommendedPEPs = pepOptions.filter(pep => pep.recommended);
  const hasDownloadedAny = downloadedPEPs.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative">
      {/* Navigation */}
      <div className="absolute top-4 left-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/plan-selection-next')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deployment Options
        </Button>
      </div>
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Download Your PEP Components
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your Control Core is hosted and ready. Download the PEP components for your infrastructure.
          </p>
        </div>

        {/* Hosted Information */}
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Pro Plan - Hosted Solution:</strong> Your Control Core is fully managed and hosted by us. 
            You only need to deploy the PEP components in your infrastructure to start enforcing policies.
          </AlertDescription>
        </Alert>

        {/* Quick Start Recommendation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Quick Start Recommendation</p>
              <p className="text-blue-700 dark:text-blue-300">
                For fastest deployment with hosted Control Core, focus on <strong>proxy-based PEPs</strong> marked below. These deploy in front of your resources and generate secure proxy URLs for easy integration without requiring code changes.
              </p>
            </div>
          </div>
        </div>

        {/* Hosted Deployment Guidance */}
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Deployment Complexity Notice:</strong> While all PEP types are available with hosted Control Core, 
            <strong> sidecar and network-level PEPs</strong> require more complex setup and may need enhanced support. 
            Contact our support team for assistance with advanced deployment configurations.
          </AlertDescription>
        </Alert>

        {/* PEP Components Grid */}
        <div className="grid gap-6 mb-6">
          {pepOptions.map((pep) => (
            <Card key={pep.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{pep.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {pep.recommended && (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white">
                            Recommended
                          </Badge>
                        )}
                        <Badge 
                          variant={pep.deploymentType === 'proxy' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {pep.deploymentType === 'proxy' ? 'Proxy-based' : 
                           pep.deploymentType === 'sidecar' ? 'Sidecar' : 'Transparent'}
                        </Badge>
                        {pep.hostedComplexity === 'advanced' && (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-300">
                            Advanced Setup
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="mb-2">
                      {pep.description}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground mb-2">
                      {pep.tooltip}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Architecture:</strong> {pep.architecture}</p>
                      {pep.proxyUrlFormat !== "N/A (Runtime interception)" && 
                       pep.proxyUrlFormat !== "N/A (Transparent interception)" && (
                        <p><strong>Proxy URL Format:</strong> {pep.proxyUrlFormat}</p>
                      )}
                      <p><strong>Download Size:</strong> {pep.downloadSize}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {downloadedPEPs.includes(pep.id) ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Downloaded</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleDownload(pep.id)}
                        disabled={isDownloading === pep.id}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {isDownloading === pep.id ? "Downloading..." : "Download"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {pep.formats.map((format) => (
                    <Badge key={format} variant="secondary" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to continue?</p>
                <p className="text-sm text-muted-foreground">
                  {hasDownloadedAny 
                    ? "You can proceed to your Control Core dashboard and deploy the downloaded components later."
                    : "You can continue without downloading now and come back to download components anytime."
                  }
                </p>
              </div>
              <Button onClick={handleContinue} className="flex items-center gap-2">
                Continue to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}