import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Server, Package, CheckCircle, ExternalLink, Clock, Shield, Zap, ArrowRight, BookOpen, Settings, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { SignupResponse, DownloadResponse, DownloadPackage } from '@/types';
import { PageHeader } from '@/components/PageHeader';

const controlPlaneOptions = [
  {
    id: "kubernetes",
    name: "Kubernetes (Helm)",
    description: "Deploy using Helm charts for production-ready clusters",
    formats: ["helm-chart", "kubernetes-yaml"],
    icon: Server
  },
  {
    id: "docker",
    name: "Docker Compose",
    description: "Simple deployment using Docker Compose",
    formats: ["docker-compose", "docker-image"],
    icon: Server
  },
  {
    id: "binary",
    name: "Binary/Executable",
    description: "Standalone executable for custom deployments",
    formats: ["linux-binary", "windows-binary", "macos-binary"],
    icon: Server
  }
];

const bouncerOptions = [
  {
    id: "sidecar-bouncer",
    name: "Sidecar Bouncer",
    description: "Container sidecar for runtime application protection. Deploys alongside your service for fine-grained method-level control",
    formats: ["docker", "helm-chart", "kubernetes-yaml"],
    icon: Shield,
    deploymentType: "sidecar",
    recommended: true,
    available: true,
    examples: [
      "Banking Application - Sidecar Bouncer - Control Plane",
      "Healthcare System - Sidecar Bouncer - Control Plane",
      "Enterprise App - Sidecar Bouncer - Control Plane"
    ]
  },
  {
    id: "reverse-proxy-bouncer",
    name: "Reverse Proxy Bouncer",
    description: "Proxy-based enforcement for APIs, AI agents, and web services. Sits in front of resources and generates secure proxy URLs",
    formats: ["docker", "helm-chart", "kubernetes-yaml"],
    icon: Server,
    deploymentType: "proxy",
    recommended: false,
    available: true,
    examples: [
      "Client - Reverse Proxy Bouncer - Protected API",
      "AI Agent - Reverse Proxy Bouncer - AI Service", 
      "Web App - Reverse Proxy Bouncer - Backend API"
    ]
  },
  {
    id: "mcp-bouncer",
    name: "MCP Bouncer (AI Agents)",
    description: "Specialized control for Model Context Protocol. Secures AI agent interactions and LLM communications",
    formats: ["python-library", "docker", "npm-package"],
    icon: Cpu,
    deploymentType: "mcp",
    recommended: false,
    available: true,
    new: true,
    examples: [
      "Claude Desktop - MCP Bouncer - MCP Server",
      "AI Chatbot - MCP Bouncer - LLM Service",
      "AI Agent Platform - MCP Bouncer - Multiple MCP Servers"
    ]
  }
];

const demoAppOptions = [
  {
    id: "kubernetes",
    name: "Kubernetes (Helm)",
    description: "Deploy using Helm charts for testing and learning. Single unified application container with all demo components.",
    formats: ["helm-chart", "kubernetes-yaml"],
    icon: Server
  },
  {
    id: "docker",
    name: "Docker Compose",
    description: "Simple deployment using Docker Compose for local testing. Single unified application container with all demo components.",
    formats: ["docker-compose", "docker-image"],
    icon: Server
  }
];

export function DownloadPackagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const signupResult = location.state?.signupResult as SignupResponse;
  
  const [downloadPackages, setDownloadPackages] = useState<DownloadPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedControlPlane, setSelectedControlPlane] = useState<string>("");
  const [selectedBouncer, setSelectedBouncer] = useState<string>("");
  const [selectedBouncerFormat, setSelectedBouncerFormat] = useState<string>("");
  const [selectedDemoApp, setSelectedDemoApp] = useState<string>("");

  useEffect(() => {
    if (!signupResult || !signupResult.user_id) {
      toast.error('Signup information missing.');
      navigate('/signup');
      return;
    }
    fetchDownloadPackages(signupResult.user_id);
  }, [signupResult, navigate]);

  const fetchDownloadPackages = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/downloads/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch download packages');
      }
      const data: DownloadResponse = await response.json();
      setDownloadPackages(data.packages);
    } catch (error) {
      console.error('Error fetching download packages:', error);
      toast.error('Failed to load download packages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (packageId: string, downloadUrl: string) => {
    setDownloading(packageId);
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would trigger the actual download
      toast.success('Download started successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleBouncerDownload = () => {
    if (!selectedBouncer || !selectedBouncerFormat) {
      toast.error('Please select both bouncer type and format');
      return;
    }

    const bouncer = bouncerOptions.find(b => b.id === selectedBouncer);
    if (!bouncer) return;

    setDownloading(selectedBouncer);
    
    try {
      // Generate file content based on format
      let fileContent = '';
      let fileName = '';
      
      if (selectedBouncerFormat === 'docker' || selectedBouncerFormat === 'docker-compose') {
        fileName = `${selectedBouncer}-docker-compose.yml`;
        fileContent = generateDockerCompose(bouncer, signupResult);
      } else if (selectedBouncerFormat === 'helm-chart') {
        fileName = `${selectedBouncer}-helm-values.yaml`;
        fileContent = generateHelmValues(bouncer, signupResult);
      } else if (selectedBouncerFormat === 'kubernetes-yaml') {
        fileName = `${selectedBouncer}-kubernetes.yaml`;
        fileContent = generateKubernetesManifest(bouncer, signupResult);
      } else {
        fileName = `${selectedBouncer}-${selectedBouncerFormat}.txt`;
        fileContent = `# ${bouncer.name} - ${selectedBouncerFormat}\n\nFile format: ${selectedBouncerFormat}\nVersion: 042025\n\nPlease contact support for this format.`;
      }

      // Create and download file
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${fileName} successfully!`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const generateDockerCompose = (bouncer: any, user: SignupResponse) => {
    const bouncerId = `bouncer-${bouncer.deploymentType}-sandbox-1`;
    return `version: '3.8'

# Control Core ${bouncer.name}
# Version: 042025
# Environment: sandbox
# Generated for: ${user.company_name}

services:
  cc-bouncer-${bouncer.deploymentType}:
    image: controlcore/cc-bouncer:042025
    container_name: ${bouncerId}
    ports:
      - "8080:8080"  # Bouncer port
    environment:
      # Bouncer Identity
      - BOUNCER_ID=${bouncerId}
      - BOUNCER_NAME=${user.company_name} ${bouncer.name}
      - BOUNCER_TYPE=${bouncer.deploymentType}
      - BOUNCER_VERSION=042025
      
      # Control Plane Connection
      - CONTROL_PLANE_URL=https://controlplane.yourcompany.com  # CHANGE THIS
      - CONTROL_PLANE_API_KEY=your-api-key-here  # CHANGE THIS
      - TENANT_ID=${user.user_id}
      
      # Environment
      - ENVIRONMENT=sandbox
      - DEPLOYMENT_PLATFORM=docker
      
      # Resource Configuration
      - RESOURCE_NAME=My Protected Resource  # CHANGE THIS
      - RESOURCE_TYPE=api  # CHANGE THIS: api, webapp, database, ai-agent
      - ORIGINAL_HOST_URL=https://api.yourcompany.com  # CHANGE THIS
      - SECURITY_POSTURE=deny-all
      ${bouncer.deploymentType === 'sidecar' ? `
      # Upstream Service (for sidecar)
      - TARGET_HOST=your-application:3000  # CHANGE THIS
      - TARGET_URL=http://your-application:3000  # CHANGE THIS` : ''}
      ${bouncer.deploymentType === 'proxy' ? `
      # Proxy Configuration
      - PROXY_URL=https://bouncer-sandbox.yourcompany.com  # CHANGE THIS
      - TARGET_URL=https://api.yourcompany.com  # CHANGE THIS` : ''}
      ${bouncer.deploymentType === 'mcp' ? `
      # MCP Configuration
      - MCP_SERVER_URL=http://mcp-server:8000  # CHANGE THIS
      - MCP_HEADER_NAME=X-Model-Context
      - MCP_INJECTION_ENABLED=true` : ''}
      
      # Health Check & Logging
      - HEALTH_CHECK_ENABLED=true
      - HEARTBEAT_INTERVAL=30
      - LOG_LEVEL=info
      - AUDIT_LOGGING_ENABLED=true
      - DECISION_LOG_EXPORT=true
      
      # Performance
      - CACHE_ENABLED=true
      - RATE_LIMIT_PER_MINUTE=1000
      - TIMEOUT_SECONDS=30
    
    networks:
      - bouncer-network
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    restart: unless-stopped

networks:
  bouncer-network:
    driver: bridge

# DEPLOYMENT INSTRUCTIONS:
# 1. Update all environment variables marked with "CHANGE THIS"
# 2. Set your Control Plane URL and API key
# 3. Configure target service/resource details
# 4. Run: docker-compose up -d
# 5. Verify: docker-compose logs -f
# 6. Check Control Core UI for bouncer status
#
# For help: https://docs.controlcore.io/guides/bouncer-deployment
`;
  };

  const generateHelmValues = (bouncer: any, user: SignupResponse) => {
    return `# Control Core ${bouncer.name} - Helm Values
# Version: 042025
# Generated for: ${user.company_name}

bouncer:
  id: bouncer-${bouncer.deploymentType}-sandbox-1
  name: "${user.company_name} ${bouncer.name}"
  type: ${bouncer.deploymentType}
  version: "042025"
  
  controlPlane:
    url: "https://controlplane.yourcompany.com"  # CHANGE THIS
    apiKey: "your-api-key-here"  # CHANGE THIS (store in Secret)
    tenantId: "${user.user_id}"
  
  environment: sandbox
  
  resource:
    name: "My Protected Resource"  # CHANGE THIS
    type: api  # CHANGE THIS: api, webapp, database, ai-agent
    originalHostUrl: "https://api.yourcompany.com"  # CHANGE THIS
    securityPosture: deny-all

image:
  repository: controlcore/cc-bouncer
  tag: "042025"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8080

resources:
  limits:
    cpu: 1000m
    memory: 512Mi
  requests:
    cpu: 500m
    memory: 256Mi

performance:
  cache:
    enabled: true
    ttl: 300
  rateLimit:
    perMinute: 1000
  timeout:
    seconds: 30

logging:
  level: info
  auditEnabled: true
  decisionLogExport: true

# Install:
# helm install cc-${bouncer.deploymentType}-bouncer ./chart -f values.yaml
#
# For help: https://docs.controlcore.io/guides/bouncer-deployment
`;
  };

  const generateKubernetesManifest = (bouncer: any, user: SignupResponse) => {
    const bouncerId = `bouncer-${bouncer.deploymentType}-sandbox`;
    return `apiVersion: v1
kind: Namespace
metadata:
  name: control-core
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${bouncerId}
  namespace: control-core
  labels:
    app: ${bouncerId}
    version: "042025"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${bouncerId}
  template:
    metadata:
      labels:
        app: ${bouncerId}
    spec:
      containers:
      - name: bouncer
        image: controlcore/cc-bouncer:042025
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: BOUNCER_ID
          value: "${bouncerId}"
        - name: BOUNCER_NAME
          value: "${user.company_name} ${bouncer.name}"
        - name: BOUNCER_TYPE
          value: "${bouncer.deploymentType}"
        - name: ENVIRONMENT
          value: "sandbox"
        - name: CONTROL_PLANE_URL
          value: "https://controlplane.yourcompany.com"  # CHANGE THIS
        - name: CONTROL_PLANE_API_KEY
          valueFrom:
            secretKeyRef:
              name: ${bouncerId}-secret
              key: api-key
        - name: TENANT_ID
          value: "${user.user_id}"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "500m"
            memory: "256Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: ${bouncerId}
  namespace: control-core
spec:
  selector:
    app: ${bouncerId}
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP
---
apiVersion: v1
kind: Secret
metadata:
  name: ${bouncerId}-secret
  namespace: control-core
type: Opaque
stringData:
  api-key: "your-api-key-here"  # CHANGE THIS

# Deploy:
# kubectl apply -f ${bouncer.deploymentType}-kubernetes.yaml
#
# For help: https://docs.controlcore.io/guides/bouncer-deployment
`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <PageHeader 
            title="Download Control Core Components"
            description="Loading your download packages..."
          />
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading download packages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader 
          title="Download Control Core Components"
          description="Download both the Control Plane and Bouncers to deploy in your infrastructure. Optionally, download the Demo App for internal testing, demo, or learning."
        />

        <Tabs defaultValue="control-plane" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="control-plane">Control Plane</TabsTrigger>
            <TabsTrigger value="bouncers">Bouncers</TabsTrigger>
            <TabsTrigger value="demo-app">Demo App (Optional)</TabsTrigger>
          </TabsList>

          <TabsContent value="control-plane" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {controlPlaneOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedControlPlane === option.id ? "border-2 border-primary" : ""
                    }`}
                    onClick={() => setSelectedControlPlane(option.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-6 w-6 text-primary" />
                        <CardTitle className="text-lg">{option.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedControlPlane && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Format</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select format</option>
                      {controlPlaneOptions.find(cp => cp.id === selectedControlPlane)?.formats.map((format) => (
                        <option key={format} value={format}>
                          {format.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Version</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="042025">v042025 (Latest Stable)</option>
                    </select>
                  </div>
                </div>

                <Button className="w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download Control Plane
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bouncers" className="space-y-6">
            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Quick Start Recommendation</p>
                    <p className="text-blue-800">
                      Control Core Bouncers are the Policy Enforcement Points (PEPs) that protect your resources. For faster deployment, you can either deploy the <strong>Sidecar Bouncer</strong> (container sidecar for runtime application protection) or the <strong>Reverse Proxy Bouncer</strong> (which will require additional DNS settings to redirect calls made to the protected resource pass through the Bouncer).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bouncerOptions.map((bouncer) => {
                const Icon = bouncer.icon;
                return (
                  <Card
                    key={bouncer.id}
                    className={`cursor-pointer transition-all hover:border-primary relative ${
                      selectedBouncer === bouncer.id ? "border-2 border-primary" : ""
                    }`}
                    onClick={() => setSelectedBouncer(bouncer.id)}
                  >
                    {bouncer.recommended && (
                      <Badge className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-700 text-white">
                        Recommended
                      </Badge>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-6 w-6 text-primary" />
                        <CardTitle className="text-lg">{bouncer.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{bouncer.description}</p>
                      {bouncer.examples && (
                        <div className="text-xs text-muted-foreground">
                          <div className="font-medium mb-1">Examples:</div>
                          {bouncer.examples.map((example, index) => (
                            <div key={index} className="font-mono bg-muted/50 p-1 rounded text-xs mb-1">
                              {example}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedBouncer && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Format</label>
                    <select 
                      value={selectedBouncerFormat}
                      onChange={(e) => setSelectedBouncerFormat(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select format</option>
                      {bouncerOptions.find(b => b.id === selectedBouncer)?.formats.map((format) => (
                        <option key={format} value={format}>
                          {format.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Version</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="042025">v042025 (Latest Stable)</option>
                    </select>
                  </div>
                </div>

                <Button 
                  className="w-full md:w-auto"
                  onClick={handleBouncerDownload}
                  disabled={!selectedBouncerFormat || downloading === selectedBouncer}
                >
                  {downloading === selectedBouncer ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download {bouncerOptions.find(b => b.id === selectedBouncer)?.name}
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="demo-app" className="space-y-6">
            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-green-900 mb-1">Free Testing & Learning Bundle</p>
                    <p className="text-green-800">
                      The Demo App is packaged as a single unified application container that includes all necessary components (frontend, backend, and sample policies). 
                      It's completely free and doesn't require additional licensing. Any bouncer connected to the Demo App is also free for testing, learning, and demonstration purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoAppOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedDemoApp === option.id ? "border-2 border-primary" : ""
                    }`}
                    onClick={() => setSelectedDemoApp(option.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-6 w-6 text-primary" />
                        <CardTitle className="text-lg">{option.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedDemoApp && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Format</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select format</option>
                      {demoAppOptions.find(demo => demo.id === selectedDemoApp)?.formats.map((format) => (
                        <option key={format} value={format}>
                          {format.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Version</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="042025">v042025 (Latest Stable)</option>
                    </select>
                  </div>
                </div>

                <Button className="w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download Demo App
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer with deployment guidance */}
        <div className="mt-16 border-t pt-8">
          <div className="text-center space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Next Steps After Download</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Once you've downloaded and deployed all components, access your Control Plane dashboard to configure policies and start protecting your resources.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    <div className="bg-blue-100 rounded-full p-3">
                      <Download className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">1. Deploy Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Deploy the Control Plane and Bouncers in your infrastructure using the downloaded packages.
                  </p>
                  <Button variant="outline" size="sm" asChild className="inline-flex items-center">
                    <a href="https://docs.controlcore.io/guides/deployment" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">Deployment Guide</span>
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    <div className="bg-green-100 rounded-full p-3">
                      <Settings className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">2. Configure & Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Access your Control Plane dashboard to configure policies and test your deployment.
                  </p>
                  <Button variant="outline" size="sm" asChild className="inline-flex items-center">
                    <a href="https://docs.controlcore.io/guides/admin" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">Configuration Guide</span>
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    <div className="bg-purple-100 rounded-full p-3">
                      <ExternalLink className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">3. Access Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Open your Control Plane URL to start managing policies and monitoring your resources.
                  </p>
                  <Button variant="outline" size="sm" disabled className="inline-flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="whitespace-nowrap">Control Plane URL</span>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Available after deployment
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" asChild className="inline-flex items-center">
                <a href="https://docs.controlcore.io/troubleshooting" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">Troubleshooting Guide</span>
                </a>
              </Button>
              <Button variant="outline" asChild className="inline-flex items-center">
                <a href="mailto:support@controlcore.io" className="inline-flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">Contact Support</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}