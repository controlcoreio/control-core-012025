import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Server, Shield, Cpu, ExternalLink, FileText, Info, BookOpen, AlertCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BouncerInfoModal } from "./BouncerInfoModal";

interface UnifiedBouncerDownloadProps {
  showControlPlaneSection?: boolean;
  onDownloadComplete?: (bouncerId: string) => void;
  environment?: 'sandbox' | 'production';
}

const bouncerTypes = [
  { 
    id: "sidecar", 
    name: "Sidecar Bouncer", 
    description: "Container sidecar for runtime application protection. Deploys alongside your service for fine-grained method-level control",
    icon: Shield,
    formats: ["docker-compose", "helm-chart", "kubernetes-manifest"],
    recommended: true,
    architecture: "Application ←→ Sidecar Bouncer ←→ Control Plane",
    examples: [
      "Banking Application - Sidecar Bouncer - Control Plane",
      "Healthcare System - Sidecar Bouncer - Control Plane",
      "Enterprise App - Sidecar Bouncer - Control Plane"
    ],
    useCases: [
      "Fine-grained method-level authorization",
      "Applications requiring embedded policy enforcement",
      "Services that need runtime interception without DNS changes"
    ],
    deploymentTips: [
      "Deploy as a sidecar container alongside your application",
      "No DNS or network routing changes required",
      "Best for Kubernetes deployments with pod-level control"
    ]
  },
  { 
    id: "reverse-proxy", 
    name: "Reverse Proxy Bouncer", 
    description: "Proxy-based enforcement for APIs, AI agents, and web services. Sits in front of resources and generates secure proxy URLs",
    icon: Server,
    formats: ["docker-compose", "helm-chart", "kubernetes-manifest", "binary"],
    recommended: false,
    architecture: "Client/AI Agent → Reverse Proxy Bouncer → Protected API/Service",
    examples: [
      "Client - Reverse Proxy Bouncer - Protected API",
      "AI Agent - Reverse Proxy Bouncer - AI Service",
      "Web App - Reverse Proxy Bouncer - Backend API"
    ],
    useCases: [
      "API Gateway-level control and protection",
      "AI agent communication control",
      "Centralized enforcement point for multiple services"
    ],
    deploymentTips: [
      "Requires DNS configuration to route traffic through bouncer",
      "Generates secure proxy URLs for client access",
      "Ideal for API protection and AI agent control"
    ]
  },
  { 
    id: "mcp", 
    name: "MCP Bouncer (AI Agents)", 
    description: "Specialized control for Model Context Protocol. Secures AI agent interactions and LLM communications",
    icon: Cpu,
    formats: ["python-library", "docker", "npm-package"],
    recommended: false,
    new: true,
    architecture: "AI Application → MCP Bouncer → MCP Server/LLM",
    examples: [
      "Claude Desktop - MCP Bouncer - MCP Server",
      "AI Chatbot - MCP Bouncer - LLM Service",
      "AI Agent Platform - MCP Bouncer - Multiple MCP Servers"
    ],
    useCases: [
      "AI agent security and authorization",
      "MCP server protection and context injection",
      "LLM communication control and monitoring"
    ],
    deploymentTips: [
      "Can be deployed as library or standalone service",
      "Inject dynamic context into AI agent interactions",
      "Monitor and control all MCP protocol communications"
    ]
  }
];

const versions = [
  { id: "042025", name: "v042025 (Latest Stable)", stable: true }
];

export function UnifiedBouncerDownload({ 
  showControlPlaneSection = false, 
  onDownloadComplete,
  environment = 'sandbox'
}: UnifiedBouncerDownloadProps) {
  const { toast } = useToast();
  const [selectedBouncerType, setSelectedBouncerType] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<string>("042025");
  const [downloading, setDownloading] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<any>(null);

  const selectedBouncer = bouncerTypes.find(b => b.id === selectedBouncerType);

  const handleInfoClick = (bouncer: typeof bouncerTypes[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setInfoModalContent(bouncer);
    setInfoModalOpen(true);
  };

  const handleDownload = async () => {
    if (!selectedBouncerType || !selectedFormat) {
      toast({
        title: "Selection Required",
        description: "Please select bouncer type and format",
        variant: "destructive"
      });
      return;
    }

    const bouncer = bouncerTypes.find(b => b.id === selectedBouncerType);
    if (!bouncer) return;

    setDownloading(true);
    
    try {
      // Generate file content based on format
      let fileContent = '';
      let fileName = '';
      
      if (selectedFormat === 'docker-compose') {
        fileName = `${selectedBouncerType}-docker-compose.yml`;
        fileContent = generateDockerCompose(bouncer, environment);
      } else if (selectedFormat === 'helm-chart') {
        fileName = `${selectedBouncerType}-helm-values.yaml`;
        fileContent = generateHelmValues(bouncer, environment);
      } else if (selectedFormat === 'kubernetes-manifest') {
        fileName = `${selectedBouncerType}-kubernetes.yaml`;
        fileContent = generateKubernetesManifest(bouncer, environment);
      } else {
        fileName = `${selectedBouncerType}-${selectedFormat}.txt`;
        fileContent = `# ${bouncer.name} - ${selectedFormat}\n\nFile format: ${selectedFormat}\nVersion: ${selectedVersion}\n\nPlease contact support for this format.`;
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

      toast({
        title: "Download Complete",
        description: `Downloaded ${fileName} successfully!`,
      });
      
      onDownloadComplete?.(selectedBouncerType);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const generateDockerCompose = (bouncer: typeof bouncerTypes[0], env: string) => {
    const bouncerId = `bouncer-${bouncer.id}-${env}-1`;
    const bouncerType = bouncer.id;
    return `version: '3.8'

# Control Core ${bouncer.name}
# Version: ${selectedVersion}
# Environment: ${env}

services:
  cc-bouncer-${bouncerType}:
    image: controlcore/cc-bouncer:${selectedVersion}
    container_name: ${bouncerId}
    ports:
      - "8080:8080"
    environment:
      - BOUNCER_ID=${bouncerId}
      - BOUNCER_NAME=${bouncer.name}
      - BOUNCER_TYPE=${bouncerType}
      - BOUNCER_VERSION=${selectedVersion}
      - CONTROL_PLANE_URL=https://controlplane.yourcompany.com
      - CONTROL_PLANE_API_KEY=your-api-key-here
      - TENANT_ID=your-tenant-id
      - ENVIRONMENT=${env}
      - DEPLOYMENT_PLATFORM=docker
      - RESOURCE_NAME=My Protected Resource
      - RESOURCE_TYPE=api
      - ORIGINAL_HOST_URL=https://api.yourcompany.com
      - SECURITY_POSTURE=deny-all${bouncerType === 'sidecar' ? `
      - TARGET_HOST=your-application:3000
      - TARGET_URL=http://your-application:3000` : ''}${bouncerType === 'reverse-proxy' ? `
      - PROXY_URL=https://bouncer-${env}.yourcompany.com
      - TARGET_URL=https://api.yourcompany.com` : ''}${bouncerType === 'mcp' ? `
      - MCP_SERVER_URL=http://mcp-server:8000
      - MCP_HEADER_NAME=X-Model-Context
      - MCP_INJECTION_ENABLED=true` : ''}
      - HEALTH_CHECK_ENABLED=true
      - HEARTBEAT_INTERVAL=30
      - LOG_LEVEL=info
      - AUDIT_LOGGING_ENABLED=true
      - DECISION_LOG_EXPORT=true
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
# 1. Update all environment variables (URLs, API keys, tenant ID)
# 2. Configure target service/resource details
# 3. Run: docker-compose up -d
# 4. Verify: docker-compose logs -f
# 5. Check Control Core UI for bouncer status
# For help: https://docs.controlcore.io/guides/bouncer-deployment
`;
  };

  const generateHelmValues = (bouncer: typeof bouncerTypes[0], env: string) => {
    return `# Control Core ${bouncer.name} - Helm Values
# Version: ${selectedVersion}
# Environment: ${env}

bouncer:
  id: bouncer-${bouncer.id}-${env}-1
  name: "${bouncer.name}"
  type: ${bouncer.id}
  version: "${selectedVersion}"
  controlPlane:
    url: "https://controlplane.yourcompany.com"
    apiKey: "your-api-key-here"
    tenantId: "your-tenant-id"
  environment: ${env}
  resource:
    name: "My Protected Resource"
    type: api
    originalHostUrl: "https://api.yourcompany.com"
    securityPosture: deny-all

image:
  repository: controlcore/cc-bouncer
  tag: "${selectedVersion}"
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

# Install: helm install cc-${bouncer.id}-bouncer ./chart -f values.yaml
# For help: https://docs.controlcore.io/guides/bouncer-deployment
`;
  };

  const generateKubernetesManifest = (bouncer: typeof bouncerTypes[0], env: string) => {
    const bouncerId = `bouncer-${bouncer.id}-${env}`;
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
    version: "${selectedVersion}"
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
        image: controlcore/cc-bouncer:${selectedVersion}
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: BOUNCER_ID
          value: "${bouncerId}"
        - name: BOUNCER_NAME
          value: "${bouncer.name}"
        - name: BOUNCER_TYPE
          value: "${bouncer.id}"
        - name: ENVIRONMENT
          value: "${env}"
        - name: CONTROL_PLANE_URL
          value: "https://controlplane.yourcompany.com"
        - name: CONTROL_PLANE_API_KEY
          valueFrom:
            secretKeyRef:
              name: ${bouncerId}-secret
              key: api-key
        - name: TENANT_ID
          value: "your-tenant-id"
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
  api-key: "your-api-key-here"

# Deploy: kubectl apply -f ${bouncer.id}-kubernetes.yaml
# For help: https://docs.controlcore.io/guides/bouncer-deployment
`;
  };

  return (
    <div className="space-y-6">
      {/* Documentation Links */}
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm">Need help? Access our comprehensive guides:</span>
            <div className="flex gap-3">
              <Button variant="link" className="h-auto p-0 text-sm" asChild>
                <a href="https://docs.controlcore.io/guides/bouncer-deployment" target="_blank" rel="noopener noreferrer">
                  Deployment Guide <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
              <span className="text-muted-foreground">|</span>
              <Button variant="link" className="h-auto p-0 text-sm" asChild>
                <a href="https://docs.controlcore.io/troubleshooting" target="_blank" rel="noopener noreferrer">
                  Troubleshooting <AlertCircle className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Environment Indicator */}
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <Info className="h-4 w-4" />
        <span className="text-sm font-medium">
          Downloading for: <Badge variant={environment === 'production' ? 'destructive' : 'default'}>
            {environment === 'production' ? 'Production' : 'Sandbox'}
          </Badge>
        </span>
      </div>

      {/* Bouncer Type Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">1. Select Bouncer Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bouncerTypes.map((bouncer) => {
            const Icon = bouncer.icon;
            return (
              <Card 
                key={bouncer.id} 
                className={`cursor-pointer transition-all hover:border-primary relative ${
                  selectedBouncerType === bouncer.id ? "border-2 border-primary bg-primary/5" : ""
                }`}
                onClick={() => {
                  setSelectedBouncerType(bouncer.id);
                  setSelectedFormat("");
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Icon className="h-8 w-8 text-primary" />
                    <div className="flex gap-1 items-center">
                      {bouncer.recommended && (
                        <Badge className="bg-green-600 hover:bg-green-700 text-xs">Recommended</Badge>
                      )}
                      {bouncer.new && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-900 text-xs">New</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-primary/10"
                        onClick={(e) => handleInfoClick(bouncer, e)}
                      >
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-base pr-8">{bouncer.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{bouncer.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Format and Version Selection */}
      {selectedBouncerType && selectedBouncer && (
        <Card>
          <CardHeader>
            <CardTitle>2. Select Format and Version</CardTitle>
            <CardDescription>
              Choose the deployment format that matches your infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Deployment Format</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedBouncer.formats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Version</label>
                <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Download Information */}
            {selectedFormat && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">What you'll get:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Bouncer {selectedFormat} files</li>
                      <li>Configuration templates with environment variables</li>
                      <li>Setup script for auto-registration with Control Plane</li>
                      <li>Deployment guide for {environment} environment</li>
                      <li>Example resource protection configurations</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleDownload} 
              disabled={!selectedFormat || downloading}
              className="w-full"
              size="lg"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Preparing Download...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download {selectedBouncer.name}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Dual Environment Deployment Architecture */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-400 flex items-center justify-center mt-0.5">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Dual Environment Deployment</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Control Core Bouncers should be deployed in <strong>pairs</strong> - one for Sandbox (testing) and one for Production (live traffic). 
              This ensures you can safely test policies before enforcing them on production resources.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-sm text-green-900 dark:text-green-100">Sandbox Environment</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Deploy Sandbox bouncer in front of your test resources. Connected to PAP Sandbox mode for policy validation.
                </p>
              </div>
              
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-sm text-red-900 dark:text-red-100">Production Environment</span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Deploy Production bouncer in front of your live resources. Connected to PAP Production mode for policy enforcement.
                </p>
              </div>
            </div>
            
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Your Responsibility:</strong> You must deploy both bouncers in your infrastructure - one for testing and one for production.
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      {selectedBouncerType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Extract the downloaded package</li>
              <li>Update the configuration file with your Control Plane URL and API key</li>
              <li>Set the ENVIRONMENT variable (sandbox or production)</li>
              <li>Run the setup script to register the bouncer</li>
              <li>Configure resource protection settings</li>
              <li>Verify the bouncer appears in the Deployment Status tab</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Bouncer Info Modal */}
      <BouncerInfoModal
        open={infoModalOpen}
        onOpenChange={setInfoModalOpen}
        bouncerInfo={infoModalContent}
      />
    </div>
  );
}

