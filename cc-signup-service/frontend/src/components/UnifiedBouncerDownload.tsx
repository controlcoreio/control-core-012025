import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Server, Shield, Database, ExternalLink, Code, Cpu, FileText, Info, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface UnifiedBouncerDownloadProps {
  showControlPlaneSection?: boolean;
  onDownloadComplete?: (bouncerId: string) => void;
  environment?: 'sandbox' | 'production';
}

const bouncerTypes = [
  { 
    id: "reverse-proxy", 
    name: "Reverse Proxy Bouncer", 
    description: "Deploy in front of your API/webapp. Routes all traffic through Control Core for policy enforcement (deploy in pairs: Sandbox + Production)",
    icon: Server,
    formats: ["docker-compose", "helm-chart", "kubernetes-manifest", "binary"],
    recommended: true
  },
  { 
    id: "sidecar", 
    name: "Sidecar Bouncer", 
    description: "Deploys alongside your service as a sidecar container for fine-grained control",
    icon: Shield,
    formats: ["docker-compose", "helm-chart", "kubernetes-manifest"]
  },
  { 
    id: "mcp", 
    name: "MCP Bouncer (AI Agents)", 
    description: "Control enforcement for Model Context Protocol - secure your AI agent interactions",
    icon: Cpu,
    formats: ["python-library", "docker", "npm-package"],
    new: true
  },
  { 
    id: "agent-to-agent", 
    name: "Google A2A Bouncer", 
    description: "Control enforcement for Google Agent-to-Agent communication protocols",
    icon: Code,
    formats: ["go-library", "cloud-function", "docker"],
    new: true
  },
  { 
    id: "iot", 
    name: "IoT Device Bouncer", 
    description: "Lightweight control enforcement for IoT devices and edge computing",
    icon: Database,
    formats: ["c-library", "edge-gateway", "firmware-module"],
    new: true
  }
];

const versions = [
  { id: "v2.1.0", name: "v2.1.0 (Latest Stable)", stable: true },
  { id: "v2.0.5", name: "v2.0.5 (Stable)", stable: true },
  { id: "v2.2.0-beta", name: "v2.2.0 (Beta)", stable: false }
];

export function UnifiedBouncerDownload({ 
  showControlPlaneSection = false, 
  onDownloadComplete,
  environment = 'sandbox'
}: UnifiedBouncerDownloadProps) {
  const [selectedBouncerType, setSelectedBouncerType] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<string>("v2.1.0");
  const [downloading, setDownloading] = useState(false);

  const selectedBouncer = bouncerTypes.find(b => b.id === selectedBouncerType);

  const handleDownload = async () => {
    if (!selectedBouncerType || !selectedFormat) {
      toast.error("Selection Required", {
        description: "Please select a bouncer type and format"
      });
      return;
    }

    setDownloading(true);

    // Simulate download
    setTimeout(() => {
      toast.success("Download Started", {
        description: `${selectedBouncer?.name} (${selectedFormat}) ${selectedVersion} for ${environment} is being downloaded.`
      });
      
      setDownloading(false);
      onDownloadComplete?.(selectedBouncerType);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Documentation Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-900">Need help with deployment? Check out our comprehensive guide.</span>
          </div>
          <a 
            href="https://docs.controlcore.io/guides/bouncer-deployment" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            View Guide <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Environment Indicator */}
      <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
        <Info className="h-4 w-4" />
        <span className="text-sm font-medium">
          Downloading for: <Badge className={environment === 'production' ? 'bg-red-600' : 'bg-green-600'}>
            {environment === 'production' ? 'Production' : 'Sandbox'}
          </Badge>
        </span>
      </div>

      {/* Bouncer Type Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">1. Select Bouncer Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bouncerTypes.map((bouncer) => {
            const Icon = bouncer.icon;
            return (
              <Card 
                key={bouncer.id} 
                className={`cursor-pointer transition-all hover:border-blue-500 ${
                  selectedBouncerType === bouncer.id ? "border-2 border-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => {
                  setSelectedBouncerType(bouncer.id);
                  setSelectedFormat("");
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Icon className="h-8 w-8 text-blue-600" />
                    <div className="flex gap-1">
                      {bouncer.recommended && (
                        <Badge className="bg-green-600 text-xs">Recommended</Badge>
                      )}
                      {bouncer.new && (
                        <Badge className="bg-blue-100 text-blue-900 text-xs">New</Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-base">{bouncer.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600">{bouncer.description}</p>
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
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select format</option>
                  {selectedBouncer.formats.map((format) => (
                    <option key={format} value={format}>
                      {format.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Version</label>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Download Information */}
            {selectedFormat && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">What you'll get:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Bouncer {selectedFormat} files</li>
                      <li>Configuration templates with environment variables</li>
                      <li>Setup script for auto-registration with Control Plane</li>
                      <li>Deployment guide for {environment} environment</li>
                      <li>Example resource protection configurations</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleDownload} 
              disabled={!selectedFormat || downloading}
              className="w-full"
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

      {/* Deployment Architecture Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dual Environment Deployment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-sm">Sandbox Bouncer</span>
              </div>
              <p className="text-xs text-gray-600">
                Deploy this bouncer in front of your test/staging resources. 
                It connects to the Control Plane in Sandbox mode for policy testing and validation.
              </p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-semibold text-sm">Production Bouncer</span>
              </div>
              <p className="text-xs text-gray-600">
                Deploy this bouncer in front of your live resources. 
                It connects to the Control Plane in Production mode for policy enforcement.
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs">
              <strong>Important:</strong> You must deploy both bouncers in your infrastructure. 
              The deployment guide includes instructions for configuring environment-specific settings.
            </p>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}

