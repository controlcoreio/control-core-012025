import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Server, 
  Key, 
  GitBranch, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  RefreshCw,
  ArrowLeft,
  Info,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface EnvironmentConfig {
  environment: string;
  api_key_configured: boolean;
  github_repo: string | null;
  opal_server_url: string | null;
}

export function EnvironmentSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sandboxConfig, setSandboxConfig] = useState<EnvironmentConfig | null>(null);
  const [productionConfig, setProductionConfig] = useState<EnvironmentConfig | null>(null);
  
  // Sandbox settings
  const [sandboxApiKey, setSandboxApiKey] = useState("");
  
  // Production settings
  const [productionApiKey, setProductionApiKey] = useState("");

  useEffect(() => {
    loadEnvironmentSettings();
  }, []);

  const loadEnvironmentSettings = async () => {
    setLoading(true);
    try {
      // In real implementation, fetch from backend
      // const response = await fetch('/api/v1/settings/environments');
      // const data = await response.json();
      
      // Mock data for now
      setSandboxConfig({
        environment: "sandbox",
        api_key_configured: false,
        github_repo: null,
        opal_server_url: "http://cc-opal:7000"
      });
      
      setProductionConfig({
        environment: "production",
        api_key_configured: false,
        github_repo: null,
        opal_server_url: "http://cc-opal:7000"
      });
    } catch (error) {
      console.error("Failed to load environment settings:", error);
      toast({
        title: "Error",
        description: "Failed to load environment settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSandboxApiKey = async () => {
    setLoading(true);
    try {
      // In real implementation, call backend
      // const response = await fetch('/api/v1/settings/environments/sandbox/api-key', {
      //   method: 'POST'
      // });
      // const data = await response.json();
      
      // Mock generated key
      const generatedKey = `sk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setSandboxApiKey(generatedKey);
      
      toast({
        title: "Sandbox API Key Generated",
        description: "Copy this key now - it won't be shown again!",
        duration: 5000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sandbox API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateProductionApiKey = async () => {
    setLoading(true);
    try {
      // In real implementation, call backend
      // const response = await fetch('/api/v1/settings/environments/production/api-key', {
      //   method: 'POST'
      // });
      // const data = await response.json();
      
      // Mock generated key
      const generatedKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setProductionApiKey(generatedKey);
      
      toast({
        title: "Production API Key Generated",
        description: "Copy this key now - it won't be shown again!",
        variant: "destructive",
        duration: 5000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate production API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    });
  };

  const saveEnvironmentSettings = async () => {
    // Note: GitHub repository is configured per-bouncer in Settings > PEP Management
    // Each bouncer can have its own GitHub repository configuration
    toast({
      title: "Info",
      description: "GitHub repository is configured per-bouncer in Settings > PEP Management"
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Environment Management</h1>
        <p className="text-muted-foreground">
          Manage Sandbox and Production environment configurations
        </p>
      </div>

      {/* Architecture Overview Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Dual Environment Architecture (Like Stripe)</p>
            <ul className="text-sm space-y-1 mt-2">
              <li>• <strong>Sandbox</strong>: Where ALL policies are created and tested (Required)</li>
              <li>• <strong>Production</strong>: Where tested policies are promoted and enforced (Optional)</li>
              <li>• <strong>API Keys</strong>: Separate keys for each environment (`sk_test_` vs `sk_live_`)</li>
              <li>• <strong>Bouncer Pairs</strong>: Each resource has sandbox + production bouncers</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Environment Tabs */}
      <Tabs defaultValue="sandbox" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sandbox" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Sandbox Environment
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Production Environment
          </TabsTrigger>
        </TabsList>

        {/* Sandbox Tab */}
        <TabsContent value="sandbox" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Sandbox Environment Configuration
                  </CardTitle>
                  <CardDescription>
                    This is your development environment where all policies are created and tested
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  REQUIRED
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Sandbox API Key</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use this key for your sandbox bouncers (starts with `sk_test_`)
                    </p>
                  </div>
                  {sandboxConfig?.api_key_configured && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>

                {sandboxApiKey ? (
                  <div className="space-y-2">
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Save this key now!</strong> It won't be shown again for security reasons.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Input 
                        value={sandboxApiKey} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(sandboxApiKey, "Sandbox API Key")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={generateSandboxApiKey}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {sandboxConfig?.api_key_configured ? "Regenerate Sandbox API Key" : "Generate Sandbox API Key"}
                  </Button>
                )}
              </div>

              <Separator />

              {/* Status Section */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Configuration Status</Label>
                <div className="grid gap-2 mt-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">API Key Configured</span>
                    {sandboxConfig?.api_key_configured ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">GitHub Repository</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      <Link to="/settings/peps" className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        Configure in PEP Management
                      </Link>
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Production Environment Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your production environment for enforcing validated policies
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  OPTIONAL
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Warning */}
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Production Environment:</strong> Only generate these credentials when you're ready to deploy production bouncers. Ensure you have tested policies in Sandbox first.
                </AlertDescription>
              </Alert>

              {/* API Key Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Production API Key</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use this key for your production bouncers (starts with `sk_live_`)
                    </p>
                  </div>
                  {productionConfig?.api_key_configured && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>

                {productionApiKey ? (
                  <div className="space-y-2">
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Critical:</strong> Save this key immediately! It won't be shown again. Use only with production bouncers.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Input 
                        value={productionApiKey} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(productionApiKey, "Production API Key")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={generateProductionApiKey}
                    disabled={loading}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {productionConfig?.api_key_configured ? "Regenerate Production API Key" : "Generate Production API Key"}
                  </Button>
                )}
              </div>

              <Separator />

              {/* Status Section */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Configuration Status</Label>
                <div className="grid gap-2 mt-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">API Key Configured</span>
                    {productionConfig?.api_key_configured ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">GitHub Repository</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      <Link to="/settings/peps" className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        Configure in PEP Management
                      </Link>
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bouncer Pairing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Bouncer Pairs</CardTitle>
          <CardDescription>
            How sandbox and production bouncers work together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Each logical resource (e.g., "Payment API") should have a <strong>pair</strong> of bouncers:
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-green-200 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h4 className="font-semibold text-sm">Sandbox Bouncer</h4>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Environment: <code>sandbox</code></li>
                <li>• API Key: <code>sk_test_...</code></li>
                <li>• Resource: <code>Payment API</code></li>
                <li>• Target: Test/staging systems</li>
                <li>• Purpose: Policy development</li>
              </ul>
            </div>

            <div className="p-4 border-2 border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h4 className="font-semibold text-sm">Production Bouncer</h4>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Environment: <code>production</code></li>
                <li>• API Key: <code>sk_live_...</code></li>
                <li>• Resource: <code>Payment API</code> (SAME)</li>
                <li>• Target: Production systems</li>
                <li>• Purpose: Policy enforcement</li>
              </ul>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              Both bouncers use the <strong>same RESOURCE_NAME</strong> (e.g., "Payment API") so Control Core recognizes them as a pair. The PAP UI will link them together automatically.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Deployment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Order</CardTitle>
          <CardDescription>
            Follow this sequence when deploying bouncers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium">Deploy Sandbox Bouncer First</p>
                <p className="text-sm text-muted-foreground">
                  Generate sandbox API key, deploy bouncer with <code>ENVIRONMENT=sandbox</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium">Create & Test Policies</p>
                <p className="text-sm text-muted-foreground">
                  Create policies in sandbox (switch to "Now viewing: Sandbox"), test thoroughly
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium">Deploy Production Bouncer (When Ready)</p>
                <p className="text-sm text-muted-foreground">
                  Generate production API key, deploy bouncer with <code>ENVIRONMENT=production</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <p className="font-medium">Promote Policies</p>
                <p className="text-sm text-muted-foreground">
                  Click "Promote to Production" on tested policies to enable in production
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={loadEnvironmentSettings} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={saveEnvironmentSettings} disabled={loading}>
          Save Environment Settings
        </Button>
      </div>
    </div>
  );
}

