import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Shield, Download, CheckCircle, ArrowRight, Info, Server, ArrowLeft } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

const controlPlaneOptions = [
  {
    id: "docker-compose",
    name: "Docker Compose",
    description: "Single-node deployment with Docker Compose",
    downloadSize: "2.1 GB",
    recommended: true
  },
  {
    id: "kubernetes",
    name: "Kubernetes Helm Chart",
    description: "Production-ready Kubernetes deployment",
    downloadSize: "1.8 GB",
    recommended: false
  },
  {
    id: "standalone",
    name: "Standalone Binary",
    description: "Direct installation on Linux/macOS",
    downloadSize: "890 MB",
    recommended: false
  }
];

const pepOptions = [
  {
    id: "api-pep",
    name: "API & Microservices PEP",
    description: "Proxy-based protection for REST APIs and microservices",
    formats: ["docker", "helm-chart", "kubernetes-yaml"],
    recommended: true,
    downloadSize: "125 MB"
  },
  {
    id: "sidecar-pep",
    name: "Application Sidecar PEP",
    description: "Runtime interception within applications",
    formats: ["library", "agent", "docker"],
    recommended: false,
    downloadSize: "89 MB"
  },
  {
    id: "network-pep",
    name: "Network Transparent PEP",
    description: "Network-level traffic control and micro-segmentation",
    formats: ["docker", "helm-chart", "executable"],
    recommended: false,
    downloadSize: "156 MB"
  },
  {
    id: "a2a-pep",
    name: "Agent-to-Agent (A2A) PEP",
    description: "Control AI agent communications and access",
    formats: ["docker", "helm-chart", "library"],
    recommended: true,
    downloadSize: "98 MB"
  },
  {
    id: "mcp-pep",
    name: "Model Context Protocol (MCP) PEP",
    description: "Secure AI model access and context sharing",
    formats: ["docker", "helm-chart", "proxy"],
    recommended: true,
    downloadSize: "112 MB"
  }
];

export function CustomPlanDownloadPage() {
  const [downloadedControlPlane, setDownloadedControlPlane] = useState<string[]>([]);
  const [downloadedPEPs, setDownloadedPEPs] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { completeSetup } = useSubscription();
  const { toast } = useToast();

  const handleDownload = async (type: 'control-plane' | 'pep', itemId: string) => {
    setIsDownloading(itemId);
    // Simulate download process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (type === 'control-plane') {
      setDownloadedControlPlane(prev => [...prev, itemId]);
    } else {
      setDownloadedPEPs(prev => [...prev, itemId]);
    }
    
    setIsDownloading(null);
    
    const itemName = type === 'control-plane' 
      ? controlPlaneOptions.find(p => p.id === itemId)?.name
      : pepOptions.find(p => p.id === itemId)?.name;
    
    toast({
      title: "Download Complete",
      description: `${itemName} downloaded successfully`,
    });
  };

  const handleContinue = async () => {
    await completeSetup();
    toast({
      title: "Setup Complete!",
      description: "Welcome to your Control Core Custom environment",
    });
    navigate('/');
  };

  const hasDownloadedControlPlane = downloadedControlPlane.length > 0;
  const hasDownloadedAnyPEP = downloadedPEPs.length > 0;

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
      
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Download Your Control Core Infrastructure
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Self-hosted deployment with full control over your infrastructure
          </p>
        </div>

        {/* Self-Hosted Information */}
        <Alert className="mb-6 border-purple-200 bg-purple-50 dark:bg-purple-900/20">
          <Info className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800 dark:text-purple-200">
            <strong>Custom Plan - Self-Hosted Solution:</strong> You have full control over your deployment. 
            Download both the Control Plane and PEP components to deploy on your own infrastructure.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="control-plane" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="control-plane" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Control Plane
            </TabsTrigger>
            <TabsTrigger value="pep-components" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              PEP Components
            </TabsTrigger>
          </TabsList>

          <TabsContent value="control-plane" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Control Plane Components</CardTitle>
                <CardDescription>
                  The core Control Core platform that manages policies, decisions, and PEP communications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {controlPlaneOptions.map((option) => (
                    <Card key={option.id} className="relative">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{option.name}</h4>
                              {option.recommended && (
                                <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {option.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Download Size:</strong> {option.downloadSize}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {downloadedControlPlane.includes(option.id) ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">Downloaded</span>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleDownload('control-plane', option.id)}
                                disabled={isDownloading === option.id}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                {isDownloading === option.id ? "Downloading..." : "Download"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pep-components" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>PEP Components</CardTitle>
                <CardDescription>
                  Policy Enforcement Points that deploy alongside your applications and services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Quick Start Recommendation */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Quick Start Recommendation</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        For fastest deployment, focus on <strong>proxy-based PEPs</strong> marked below. These deploy in front of your resources and generate secure proxy URLs for easy integration without requiring code changes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {pepOptions.map((pep) => (
                    <Card key={pep.id} className="relative">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{pep.name}</h4>
                              {pep.recommended && (
                                <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {pep.description}
                            </p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p><strong>Download Size:</strong> {pep.downloadSize}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {pep.formats.map((format) => (
                                  <Badge key={format} variant="secondary" className="text-xs">
                                    {format}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {downloadedPEPs.includes(pep.id) ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">Downloaded</span>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleDownload('pep', pep.id)}
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Continue Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to continue?</p>
                <p className="text-sm text-muted-foreground">
                  {hasDownloadedControlPlane || hasDownloadedAnyPEP
                    ? "You can proceed to your Control Core dashboard and deploy the downloaded components when ready."
                    : "You can continue without downloading now and access the download center anytime from your dashboard."
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