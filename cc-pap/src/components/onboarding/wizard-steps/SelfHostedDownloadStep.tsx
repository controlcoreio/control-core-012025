import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UnifiedBouncerDownload } from "@/components/shared/UnifiedBouncerDownload";

interface SelfHostedDownloadStepProps {
  onComplete: () => void;
  onNext: () => void;
  defaultTab?: string;
}

const controlPlaneOptions = [
  {
    id: "kubernetes",
    name: "Kubernetes (Helm)",
    description: "Deploy using Helm charts for production-ready clusters",
    formats: ["helm-chart", "kubernetes-yaml"],
    icon: "server"
  },
  {
    id: "docker",
    name: "Docker Compose",
    description: "Simple deployment using Docker Compose",
    formats: ["docker-compose", "docker-image"],
    icon: "server"
  },
  {
    id: "binary",
    name: "Binary/Executable",
    description: "Standalone executable for custom deployments",
    formats: ["linux-binary", "windows-binary", "macos-binary"],
    icon: "server"
  }
];

const demoAppOptions = [
  {
    id: "kubernetes",
    name: "Kubernetes (Helm)",
    description: "Deploy using Helm charts for testing and learning purposes.",
    formats: ["helm-chart", "kubernetes-yaml"],
    icon: "server"
  },
  {
    id: "docker",
    name: "Docker Compose",
    description: "Simple deployment using Docker Compose for local testing and development.",
    formats: ["docker-compose", "docker-image"],
    icon: "server"
  }
];

const bouncerOptions = [
  {
    id: "sidecar-bouncer",
    name: "Sidecar Bouncer",
    description: "Container sidecar for runtime application protection",
    formats: ["docker", "helm-chart", "kubernetes-yaml"],
    icon: "shield",
    deploymentType: "sidecar",
    recommended: false,
    available: true,
    tooltip: "Deploy as a sidecar container alongside your application for runtime interception. Use for fine-grained method-level authorization in applications that need embedded policy enforcement.",
    architecture: "Application ←→ Sidecar Bouncer ← → Control Plane",
    proxyUrlFormat: "N/A (Runtime interception)",
    deploymentInstructions: "Deploy as a sidecar container alongside your application. Intercepts function calls and method invocations at runtime.",
    examples: [
      "Banking Application - Sidecar Bouncer - Control Plane",
      "Healthcare System - Sidecar Bouncer - Control Plane",
      "Enterprise App - Sidecar Bouncer - Control Plane"
    ]
  },
  {
    id: "reverse-proxy-bouncer",
    name: "Reverse Proxy Bouncer",
    description: "Proxy-based enforcement for APIs, AI agents, and services",
    formats: ["docker", "helm-chart", "kubernetes-yaml"],
    icon: "server",
    deploymentType: "proxy",
    recommended: true,
    available: true,
    tooltip: "Deploy as a reverse proxy in front of your resources. Generates secure proxy URLs that enforce policies before forwarding requests. Best choice for API Gateway controls, AI Agent A2A controls, MCP Server controls, etc.",
    architecture: "Client/AI Agent/AI App → Reverse Proxy Bouncer → Protected API/AI Agent/MCP Server/AI Model",
    proxyUrlFormat: "https://bouncer.domain.com/{protected-resource}",
    deploymentInstructions: "Deploy as a reverse proxy that intercepts all requests. Configure upstream backend URLs and policy rules. All requests go through the Bouncer-generated proxy URL.",
    examples: [
      "Client - Reverse Proxy Bouncer - Protected API",
      "AI Agent - Reverse Proxy Bouncer - AI Agent", 
      "AI Application - Reverse Proxy Bouncer - MCP Server",
      "Client - Reverse Proxy Bouncer - AI Model"
    ]
  },
  {
    id: "network-bouncer",
    name: "Network Bouncer",
    description: "Network-level traffic interception and segmentation",
    formats: ["docker", "helm-chart", "executable"],
    icon: "server",
    deploymentType: "transparent-proxy",
    recommended: false,
    available: false,
    tooltip: "Deploy for transparent network traffic control and micro-segmentation. Use for controlling traffic between kubernetes pods, network segments, or when you need to secure east-west traffic in microservices architectures without changing application code.",
    architecture: "Network Traffic → Transparent Bouncer → Destination",
    proxyUrlFormat: "N/A (Transparent interception)",
    deploymentInstructions: "Deploy using iptables rules or service mesh integration for transparent traffic interception. No application changes required.",
    examples: ["Not available in current version"]
  }
];

const versions = [
  { id: "012025", name: "v012025 (Latest)", isStable: true },
  { id: "2.0.0", name: "v2.0.0 (Stable)", isStable: true },
  { id: "1.9.5", name: "v1.9.5 (Stable)", isStable: true }
];

interface DownloadFormValues {
  controlPlaneType: string;
  controlPlaneFormat: string;
  pepType: string;
  pepFormat: string;
  version: string;
}

export function SelfHostedDownloadStep({ onComplete, onNext, defaultTab = "control-plane" }: SelfHostedDownloadStepProps) {
  const { toast } = useToast();
  const [selectedControlPlane, setSelectedControlPlane] = useState<string>("");
  const [selectedPep, setSelectedPep] = useState<string>("");
  const [selectedDemoApp, setSelectedDemoApp] = useState<string>("");
  
  const form = useForm<DownloadFormValues>({
    defaultValues: {
      controlPlaneType: "",
      controlPlaneFormat: "",
      pepType: "",
      pepFormat: "",
      version: "012025"
    }
  });

  const selectedControlPlaneObj = controlPlaneOptions.find(cp => cp.id === selectedControlPlane);
  const selectedBouncerObj = bouncerOptions.find(bouncer => bouncer.id === selectedPep);
  const selectedDemoAppObj = demoAppOptions.find(demo => demo.id === selectedDemoApp);

  const handleControlPlaneDownload = (data: Partial<DownloadFormValues>) => {
    console.log("Control Plane download:", data);
    
    // Generate download URL based on format and version
    let downloadUrl = '';
    let filename = '';
    
    if (data.controlPlaneFormat === 'helm-chart') {
      downloadUrl = `/helm-charts/control-core-control-plane-${data.version}.tgz`;
      filename = `control-core-control-plane-${data.version}.tgz`;
    } else if (data.controlPlaneFormat === 'docker-compose') {
      downloadUrl = `/downloads/control-core-control-plane-${data.version}.yml`;
      filename = `docker-compose-control-plane-${data.version}.yml`;
    } else if (data.controlPlaneFormat === 'linux-binary') {
      downloadUrl = `/downloads/control-core-control-plane-${data.version}-linux-amd64`;
      filename = `control-core-control-plane-${data.version}-linux-amd64`;
    }
    
    if (downloadUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Control Plane ${data.controlPlaneFormat} v${data.version} is being downloaded.`,
      });
    } else {
      toast({
        title: "Download Error",
        description: "Unable to generate download URL. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePepDownload = (data: Partial<DownloadFormValues>) => {
    console.log("PEP download:", data);
    
    // Generate download URL based on PEP type, format and version
    let downloadUrl = '';
    let filename = '';
    
    if (data.pepFormat === 'helm-chart') {
      downloadUrl = `/helm-charts/control-core-bouncer-${data.version}.tgz`;
      filename = `control-core-bouncer-${data.version}.tgz`;
    } else if (data.pepFormat === 'docker') {
      downloadUrl = `/downloads/control-core-bouncer-${data.version}.tar`;
      filename = `control-core-bouncer-${data.version}.tar`;
    } else if (data.pepFormat === 'kubernetes-yaml') {
      downloadUrl = `/downloads/control-core-bouncer-${data.version}.yaml`;
      filename = `control-core-bouncer-${data.version}.yaml`;
    }
    
    if (downloadUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started", 
        description: `${selectedBouncerObj?.name} ${data.pepFormat} v${data.version} is being downloaded.`,
      });
    } else {
      toast({
        title: "Download Error",
        description: "Unable to generate download URL. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDemoAppDownload = (data: Partial<DownloadFormValues>) => {
    console.log("Demo App download:", data);
    
    // Generate download URL based on format and version
    let downloadUrl = '';
    let filename = '';
    
    if (data.controlPlaneFormat === 'helm-chart') {
      downloadUrl = `/helm-charts/control-core-demo-app-${data.version}.tgz`;
      filename = `control-core-demo-app-${data.version}.tgz`;
    } else if (data.controlPlaneFormat === 'docker-compose') {
      downloadUrl = `/downloads/control-core-demo-app-${data.version}.yml`;
      filename = `docker-compose-demo-app-${data.version}.yml`;
    } else if (data.controlPlaneFormat === 'kubernetes-yaml') {
      downloadUrl = `/downloads/control-core-demo-app-${data.version}.yaml`;
      filename = `control-core-demo-app-${data.version}.yaml`;
    }
    
    if (downloadUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Demo App ${data.controlPlaneFormat} v${data.version} is being downloaded.`,
      });
    } else {
      toast({
        title: "Download Error",
        description: "Unable to generate download URL. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          Download both the Control Plane and Bouncers to deploy in your infrastructure. Optionally, download the Demo App for internal testing, demo, or learning.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="control-plane">Control Plane</TabsTrigger>
          <TabsTrigger value="bouncers">Bouncers</TabsTrigger>
          <TabsTrigger value="demo-app">Demo App (Optional)</TabsTrigger>
        </TabsList>

        <TabsContent value="control-plane" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {controlPlaneOptions.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedControlPlane === option.id ? "border-2 border-primary" : ""
                }`}
                onClick={() => {
                  setSelectedControlPlane(option.id);
                  form.setValue("controlPlaneType", option.id);
                  form.setValue("controlPlaneFormat", "");
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <EnterpriseIcon name={option.icon as any} size={24} className="text-primary" />
                    <CardTitle className="text-lg">{option.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedControlPlane && (
            <Form {...form}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="controlPlaneFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedControlPlaneObj?.formats.map((format) => (
                              <SelectItem key={format} value={format}>
                                {format.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select version" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {versions.map((version) => (
                              <SelectItem key={version.id} value={version.id}>
                                <div className="flex items-center gap-2">
                                  <span>{version.name}</span>
                                  {version.isStable && (
                                    <Badge variant="default" className="text-xs">Stable</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  onClick={() => handleControlPlaneDownload(form.getValues())}
                  disabled={!form.watch("controlPlaneFormat")}
                  className="w-full md:w-auto"
                >
                  <EnterpriseIcon name="arrow-down" size={16} className="mr-2" />
                  Download Control Plane
                </Button>
              </div>
            </Form>
          )}
        </TabsContent>

        <TabsContent value="bouncers" className="space-y-6">
          <UnifiedBouncerDownload 
            showControlPlaneSection={false}
            environment="sandbox"
            onDownloadComplete={onNext}
          />
        </TabsContent>

        <TabsContent value="demo-app" className="space-y-6">
          <div className="mb-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-600 dark:bg-green-400 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-green-900 dark:text-green-100 mb-1">Free Testing & Learning Bundle</p>
                  <p className="text-green-700 dark:text-green-300">
                    The Demo App bundle includes optional services that can be used for controls testing, learning and demos. It's completely free, with a Control Core Bouncer linked to it and doesn't require additional licensing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoAppOptions.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedDemoApp === option.id ? "border-2 border-primary" : ""
                }`}
                onClick={() => {
                  setSelectedDemoApp(option.id);
                  form.setValue("controlPlaneType", option.id);
                  form.setValue("controlPlaneFormat", "");
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <EnterpriseIcon name={option.icon as any} size={24} className="text-primary" />
                    <CardTitle className="text-lg">{option.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedDemoApp && (
            <Form {...form}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="controlPlaneFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedDemoAppObj?.formats.map((format) => (
                              <SelectItem key={format} value={format}>
                                {format.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select version" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {versions.map((version) => (
                              <SelectItem key={version.id} value={version.id}>
                                <div className="flex items-center gap-2">
                                  <span>{version.name}</span>
                                  {version.isStable && (
                                    <Badge variant="default" className="text-xs">Stable</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  onClick={() => handleDemoAppDownload(form.getValues())}
                  disabled={!form.watch("controlPlaneFormat")}
                  className="w-full md:w-auto"
                >
                  <EnterpriseIcon name="arrow-down" size={16} className="mr-2" />
                  Download Demo App
                </Button>
              </div>
            </Form>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center pt-6">
        <Button onClick={onNext} size="lg">
          Continue Setup
          <EnterpriseIcon name="arrow-right" size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}