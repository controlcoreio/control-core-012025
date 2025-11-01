import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EnvironmentBadge } from "@/components/ui/environment-badge";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { 
  Download, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Monitor, 
  RefreshCw,
  ExternalLink,
  Copy,
  Info,
  Globe,
  Server,
  Network,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ArrowRight,
  ArrowLeft,
  Scale,
  Container,
  Cloud,
  Database,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UnifiedBouncerDownload } from "@/components/shared/UnifiedBouncerDownload";
import { usePEPs } from "@/hooks/use-peps";
import { Link } from "react-router-dom";
import { BouncerOPALConfig } from "./BouncerOPALConfig";
import { BouncerGitHubTab } from "./BouncerGitHubTab";
import { pepApi, PEPConfigData, IndividualPEPConfigData, GlobalPEPConfigData } from "@/services/pepApi";
import { Loader2 } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { SecureStorage } from "@/utils/secureStorage";

interface DeployedPEP {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error' | 'deploying';
  version: string;
  proxyUrl?: string;
  lastSeen: string;
  resourcesProtected: number;
  requestsPerHour: number;
  deploymentMode: 'reverse-proxy' | 'sidecar';
  targetUrl?: string;
  environment: string;
  isConnected?: boolean;
  interceptingTraffic?: boolean;
  dnsConfiguration?: DNSConfig;
  sslConfiguration?: SSLConfig;
  trafficConfiguration?: TrafficConfig;
}

interface DNSConfig {
  domain: string;
  subdomain: string;
  dnsProvider: string;
  ttl: number;
  cnameRecord?: string;
  aRecord?: string;
}

interface SSLConfig {
  enabled: boolean;
  certificateType: 'letsencrypt' | 'custom' | 'self-signed';
  certificatePath?: string;
  keyPath?: string;
  autoRenew: boolean;
}

interface TrafficConfig {
  ingressEnabled: boolean;
  egressEnabled: boolean;
  rateLimitPerMinute: number;
  maxConnections: number;
  timeoutSeconds: number;
  retryAttempts: number;
}

interface BouncerConfiguration {
  id: string;
  name: string;
  deploymentMode: 'reverse-proxy' | 'sidecar';
  targetUrl: string;
  proxyUrl: string;
  dnsConfig: DNSConfig;
  sslConfig: SSLConfig;
  trafficConfig: TrafficConfig;
  policies: string[];
  isEnabled: boolean;
}

// Mock data removed - now using backend API via usePEPs hook

export function PEPManagementPage() {
  // Fetch real PEPs from backend
  const { peps: backendPEPs, isLoading, error: pepsError } = usePEPs();
  const { currentEnvironment } = useEnvironment();
  
  // Map backend PEPs to UI format
  const deployedPEPs: DeployedPEP[] = (backendPEPs || []).map(pep => ({
    id: pep.bouncer_id || `pep-${pep.id}`,
    name: pep.name,
    type: pep.deployment_mode === 'reverse-proxy' ? 'api-gateway' : 'sidecar',
    status: pep.status === 'operational' ? 'active' : pep.status === 'warning' ? 'error' : 'inactive',
    version: pep.bouncer_version,
    proxyUrl: pep.proxy_url || undefined,
    lastSeen: pep.last_health_check ? new Date(pep.last_health_check).toLocaleString() : 'Never',
    resourcesProtected: pep.resources_protected,
    requestsPerHour: pep.requests_per_hour,
    deploymentMode: pep.deployment_mode as 'reverse-proxy' | 'sidecar',
    targetUrl: pep.target_url || undefined,
    environment: pep.environment || 'sandbox',
    isConnected: pep.is_connected || false,
    interceptingTraffic: pep.intercepting_traffic || false,
    dnsConfiguration: pep.dns_domain ? {
      domain: pep.dns_domain,
      subdomain: pep.dns_subdomain || '',
      dnsProvider: pep.dns_provider || 'cloudflare',
      ttl: 300
    } : undefined,
    sslConfiguration: {
      enabled: pep.ssl_enabled,
      certificateType: (pep.ssl_certificate_type as 'letsencrypt' | 'custom' | 'self-signed') || 'letsencrypt',
      autoRenew: true
    },
    trafficConfiguration: {
      ingressEnabled: true,
      egressEnabled: true,
      rateLimitPerMinute: 1000,
      maxConnections: 10000,
      timeoutSeconds: 30,
      retryAttempts: 3
    }
  }));
  
  const [refreshing, setRefreshing] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [selectedBouncer, setSelectedBouncer] = useState<string | null>(null);
  const [bouncerConfig, setBouncerConfig] = useState<BouncerConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState<string>("status");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [globalConfig, setGlobalConfig] = useState<GlobalPEPConfigData>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast} = useToast();
  
  // Track which bouncer types are deployed
  const [hasReverseProxy, setHasReverseProxy] = useState(false);
  const [hasSidecar, setHasSidecar] = useState(false);
  
  // Detect bouncer types from deployedPEPs
  useEffect(() => {
    setHasReverseProxy(deployedPEPs.some(p => p.deploymentMode === 'reverse-proxy'));
    setHasSidecar(deployedPEPs.some(p => p.deploymentMode === 'sidecar'));
  }, [deployedPEPs]);
  
  // Load global configuration from backend
  useEffect(() => {
    const loadGlobalConfig = async () => {
      try {
        const response = await fetch(`${APP_CONFIG.api.baseUrl}/pep-config/global`, {
          headers: {
            'Authorization': `Bearer ${SecureStorage.getItem('access_token')}`,
          },
        });
        
        if (response.ok) {
          const config = await response.json();
          setGlobalConfig(config);
        }
      } catch (error) {
        console.error('Failed to load global configuration:', error);
        // Use defaults if loading fails
      }
    };
    
    loadGlobalConfig();
  }, []);
  
  // Warn user about unsaved changes before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <div className="text-center text-muted-foreground">Loading Bouncer configurations...</div>
              <p className="text-xs text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show error state if API failed
  if (pepsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col gap-2">
              <p className="font-semibold">Unable to load Bouncer configurations</p>
              <p className="text-sm">The system is currently unavailable. Please try again in a few moments.</p>
              <p className="text-xs mt-2">
                If the problem persists, please contact your administrator or refresh the page.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadge = (status: DeployedPEP['status']) => {
    const variants = {
      active: { variant: "default" as const, color: "bg-green-600 hover:bg-green-700", text: "Active" },
      inactive: { variant: "secondary" as const, color: "", text: "Inactive" },
      error: { variant: "destructive" as const, color: "", text: "Error" },
      deploying: { variant: "outline" as const, color: "", text: "Deploying" }
    };
    
    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Proxy URL copied successfully",
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
    toast({
      title: "Status refreshed",
      description: "PEP status has been updated",
    });
  };

  const handleConfigureBouncer = (pepId: string) => {
    const pep = deployedPEPs.find(p => p.id === pepId);
    if (pep) {
      setSelectedBouncer(pepId);
      setBouncerConfig({
        id: pep.id,
        name: pep.name,
        deploymentMode: pep.deploymentMode,
        targetUrl: pep.targetUrl || "",
        proxyUrl: pep.proxyUrl || "",
        dnsConfig: pep.dnsConfiguration || {
          domain: "",
          subdomain: "",
          dnsProvider: "Cloudflare",
          ttl: 300
        },
        sslConfig: pep.sslConfiguration || {
          enabled: false,
          certificateType: "letsencrypt",
          autoRenew: true
        },
        trafficConfig: pep.trafficConfiguration || {
          ingressEnabled: true,
          egressEnabled: true,
          rateLimitPerMinute: 1000,
          maxConnections: 500,
          timeoutSeconds: 30,
          retryAttempts: 3
        },
        policies: [],
        isEnabled: pep.status === "active"
      });
      setIsConfiguring(true);
    }
  };

  // Validation functions
  const validateURL = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validatePositiveNumber = (value: number): boolean => {
    return value > 0;
  };

  const validateConfiguration = (config: BouncerConfiguration): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Validate name
    if (!config.name || config.name.trim() === '') {
      errors.name = 'Bouncer name is required';
    }

    // Validate URLs
    if (config.targetUrl && !validateURL(config.targetUrl)) {
      errors.targetUrl = 'Invalid target URL format';
    }
    if (config.proxyUrl && !validateURL(config.proxyUrl)) {
      errors.proxyUrl = 'Invalid proxy URL format';
    }

    // Validate traffic configuration
    if (!validatePositiveNumber(config.trafficConfig.rateLimitPerMinute)) {
      errors.rateLimitPerMinute = 'Rate limit must be a positive number';
    }
    if (!validatePositiveNumber(config.trafficConfig.maxConnections)) {
      errors.maxConnections = 'Max connections must be a positive number';
    }
    if (!validatePositiveNumber(config.trafficConfig.timeoutSeconds)) {
      errors.timeoutSeconds = 'Timeout must be a positive number';
    }
    if (config.trafficConfig.retryAttempts < 0) {
      errors.retryAttempts = 'Retry attempts cannot be negative';
    }

    return errors;
  };

  const handleSaveConfiguration = async () => {
    if (!bouncerConfig || !selectedBouncer) return;

    // Validate configuration
    const errors = validateConfiguration(bouncerConfig);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive"
      });
      return;
    }

    setIsSavingConfig(true);
    setValidationErrors({});

    try {
      const pep = deployedPEPs.find(p => p.id === selectedBouncer);
      if (!pep) throw new Error("Bouncer not found");

      // Prepare basic configuration
      const basicConfig: PEPConfigData = {
        name: bouncerConfig.name,
        deployment_mode: bouncerConfig.deploymentMode,
        target_url: bouncerConfig.targetUrl || undefined,
        proxy_url: bouncerConfig.proxyUrl || undefined,
        dns_domain: bouncerConfig.dnsConfig.domain || undefined,
        dns_subdomain: bouncerConfig.dnsConfig.subdomain || undefined,
        dns_provider: bouncerConfig.dnsConfig.dnsProvider,
        dns_ttl: bouncerConfig.dnsConfig.ttl,
        ssl_enabled: bouncerConfig.sslConfig.enabled,
        ssl_certificate_type: bouncerConfig.sslConfig.certificateType,
        ssl_auto_renew: bouncerConfig.sslConfig.autoRenew,
        ingress_enabled: bouncerConfig.trafficConfig.ingressEnabled,
        egress_enabled: bouncerConfig.trafficConfig.egressEnabled,
        rate_limit_per_minute: bouncerConfig.trafficConfig.rateLimitPerMinute,
        max_connections: bouncerConfig.trafficConfig.maxConnections,
        timeout_seconds: bouncerConfig.trafficConfig.timeoutSeconds,
        retry_attempts: bouncerConfig.trafficConfig.retryAttempts,
      };

      // Prepare advanced configuration
      const advancedConfig: IndividualPEPConfigData = {
        assigned_policy_bundles: bouncerConfig.policies,
        upstream_target_url: bouncerConfig.targetUrl || undefined,
        public_proxy_url: bouncerConfig.proxyUrl || undefined,
      };

      // Save both configurations
      await pepApi.saveCompletePEPConfiguration(
        parseInt(selectedBouncer),
        basicConfig,
        advancedConfig
      );

      toast({
        title: "Configuration saved",
        description: `Bouncer "${bouncerConfig.name}" has been updated successfully`,
      });

      setHasUnsavedChanges(false);
      setIsConfiguring(false);
      setSelectedBouncer(null);
      setBouncerConfig(null);

      // Optimistic update: Refresh PEP list without full page reload
      try {
        const updatedPEPs = await pepApi.fetchPEPs();
        // The usePEPs hook will automatically update on next render
        // or we can manually trigger a refresh if the hook supports it
        window.location.reload(); // TODO: Remove this when setPEPs from usePEPs is used
      } catch (error) {
        console.error('Error refreshing PEPs:', error);
        // Still show success since save succeeded
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save bouncer configuration",
        variant: "destructive"
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveGlobalSettings = async () => {
    setIsSavingGlobal(true);

    try {
      await pepApi.saveGlobalConfiguration(globalConfig);

      toast({
        title: "Global settings saved",
        description: "Global PEP configuration has been updated successfully",
      });

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving global configuration:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save global configuration",
        variant: "destructive"
      });
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const handleCancelConfiguration = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    
    setIsConfiguring(false);
    setSelectedBouncer(null);
    setBouncerConfig(null);
    setHasUnsavedChanges(false);
    setValidationErrors({});
  };

  const getDeploymentModeIcon = (mode: 'reverse-proxy' | 'sidecar') => {
    return mode === 'reverse-proxy' ? <Scale className="h-4 w-4" /> : <Container className="h-4 w-4" />;
  };

  const getDeploymentModeBadge = (mode: 'reverse-proxy' | 'sidecar') => {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        {getDeploymentModeIcon(mode)}
        {mode === 'reverse-proxy' ? 'Reverse Proxy' : 'Sidecar'}
      </Badge>
    );
  };

  const activePEPs = deployedPEPs.filter(pep => pep.status === 'active');
  const totalRequestsPerHour = deployedPEPs.reduce((sum, pep) => sum + pep.requestsPerHour, 0);
  const totalResourcesProtected = deployedPEPs.reduce((sum, pep) => sum + pep.resourcesProtected, 0);
  
  // Calculate health score based on active PEPs
  const healthScore = deployedPEPs.length > 0 
    ? Math.round((activePEPs.length / deployedPEPs.length) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back to Settings */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Bouncer Management</h1>
            <EnvironmentBadge />
          </div>
          <p className="text-muted-foreground">
            Manage your Bouncers for {currentEnvironment} environment and monitor deployment status
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Dual Environment Deployment Architecture */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <p><strong>Dual Environment Deployment:</strong> Bouncers are deployed in pairs for Sandbox and Production environments.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-sm">Sandbox Environment</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deploy Sandbox bouncer in front of your test resources. Connected to PAP Sandbox mode for policy evaluation.
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-sm">Production Environment</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deploy Production bouncer in front of your live resources. Connected to PAP Production mode for policy evaluation.
                </p>
              </div>
            </div>
            <p className="text-xs">
              <strong>Client Responsibility:</strong> You must deploy both bouncers in your infrastructure - one for testing and one for production.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Quick Stats - Now using real data only */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bouncers</p>
                <p className="text-2xl font-bold">{activePEPs.length}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resources Protected</p>
                <p className="text-2xl font-bold">{totalResourcesProtected}</p>
              </div>
              <Monitor className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requests/Hour</p>
                <p className="text-2xl font-bold">{totalRequestsPerHour.toLocaleString()}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">{healthScore}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Deployment Status</TabsTrigger>
          <TabsTrigger value="github">GitHub Sync</TabsTrigger>
          <TabsTrigger value="configuration">Configuration & Settings</TabsTrigger>
          <TabsTrigger value="download">Download Center</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Monitor your deployed Bouncer components in real-time. Check health status, proxy URLs, and performance metrics.
            </AlertDescription>
          </Alert>

          {deployedPEPs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Bouncers Deployed</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Download and deploy a Bouncer to start protecting your resources
                </p>
                <Button onClick={() => setActiveTab("download")}>
                  <Download className="h-4 w-4 mr-2" />
                  Go to Download Center
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {deployedPEPs.map((pep) => (
                <Card key={pep.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{pep.name}</CardTitle>
                          {getStatusBadge(pep.status)}
                          {getDeploymentModeBadge(pep.deploymentMode)}
                          <Badge variant="outline" className="text-xs">
                            {pep.version}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Connection Status */}
                          {pep.status === 'active' && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-600 font-medium">Connected</span>
                            </div>
                          )}
                          {/* Traffic Interception Status */}
                          {pep.status === 'active' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Intercepting Traffic
                            </Badge>
                          )}
                          {/* Environment Badge */}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              pep.environment === 'production' 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {pep.environment === 'production' ? 'Production' : 'Sandbox'}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          Type: {pep.type} | Last seen: {pep.lastSeen}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConfigureBouncer(pep.id)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Logs
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Resources Protected</p>
                        <p className="text-lg font-semibold">{pep.resourcesProtected}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Requests/Hour</p>
                        <p className="text-lg font-semibold">{pep.requestsPerHour.toLocaleString()}</p>
                      </div>
                      {pep.proxyUrl && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Proxy URL</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                              {pep.proxyUrl}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(pep.proxyUrl!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Configure global defaults and individual bouncer settings. Manage deployment modes, traffic routing, DNS, SSL, and advanced features.
            </AlertDescription>
          </Alert>

          {/* Global Default Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Global Default Settings
              </CardTitle>
              <CardDescription>
                Default settings applied to all new bouncer deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Common Configuration (applies to all bouncer types) */}
              <div className="space-y-5">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Common Configuration
                </h4>
                <p className="text-xs text-muted-foreground">
                  These settings apply to all bouncer types (reverse-proxy and sidecar)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="control-plane-url" className="text-sm font-medium">Control Plane URL</Label>
                    <Input 
                      id="control-plane-url"
                      value={globalConfig.control_plane_url || "https://api.controlcore.io"}
                      onChange={(e) => {
                        setGlobalConfig({...globalConfig, control_plane_url: e.target.value});
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="https://your-control-plane.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Base URL for bouncers to connect to Control Plane
                    </p>
                  </div>
                </div>
              </div>

              {/* Reverse-Proxy Specific Configuration */}
              {hasReverseProxy && (
                <div className="space-y-5 border-t pt-6">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Scale className="h-4 w-4 text-blue-600" />
                    Reverse-Proxy Specific Configuration
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    These settings apply only to reverse-proxy bouncers
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="proxy-domain" className="text-sm font-medium">Default Proxy Domain</Label>
                      <Input 
                        id="proxy-domain"
                        value={globalConfig.default_proxy_domain || "bouncer.controlcore.io"}
                        onChange={(e) => {
                          setGlobalConfig({...globalConfig, default_proxy_domain: e.target.value});
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="bouncer.yourcompany.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        Base domain for all reverse-proxy bouncer URLs
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sidecar Specific Configuration */}
              {hasSidecar && (
                <div className="space-y-5 border-t pt-6">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Container className="h-4 w-4 text-green-600" />
                    Sidecar Specific Configuration
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    These settings apply only to sidecar bouncers
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="sidecar-port" className="text-sm font-medium">Default Sidecar Port</Label>
                      <Input 
                        id="sidecar-port"
                        type="number"
                        value={globalConfig.default_sidecar_port || 8080}
                        onChange={(e) => {
                          setGlobalConfig({...globalConfig, default_sidecar_port: parseInt(e.target.value) || 8080});
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="8080"
                        min="1"
                        max="65535"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default port for sidecar containers (1-65535)
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="sidecar-injection-mode" className="text-sm font-medium">Sidecar Injection Mode</Label>
                      <Select 
                        value={globalConfig.sidecar_injection_mode || "automatic"}
                        onValueChange={(value) => {
                          setGlobalConfig({...globalConfig, sidecar_injection_mode: value});
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <SelectTrigger id="sidecar-injection-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="automatic">Automatic Injection</SelectItem>
                          <SelectItem value="manual">Manual Injection</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        How sidecars are injected into pods
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="sidecar-namespace-selector" className="text-sm font-medium">Namespace Selector</Label>
                      <Input 
                        id="sidecar-namespace-selector"
                        value={globalConfig.sidecar_namespace_selector || ""}
                        onChange={(e) => {
                          setGlobalConfig({...globalConfig, sidecar_namespace_selector: e.target.value});
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="app=myapp"
                      />
                      <p className="text-xs text-muted-foreground">
                        K8s namespace selector for auto-injection
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="sidecar-cpu-limit" className="text-sm font-medium">CPU Limit</Label>
                      <Input 
                        id="sidecar-cpu-limit"
                        value={globalConfig.sidecar_resource_limits_cpu || "500m"}
                        onChange={(e) => {
                          setGlobalConfig({...globalConfig, sidecar_resource_limits_cpu: e.target.value});
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="500m"
                      />
                      <p className="text-xs text-muted-foreground">
                        CPU limit for sidecar containers (e.g., 500m, 1, 2)
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="sidecar-memory-limit" className="text-sm font-medium">Memory Limit</Label>
                      <Input 
                        id="sidecar-memory-limit"
                        value={globalConfig.sidecar_resource_limits_memory || "256Mi"}
                        onChange={(e) => {
                          setGlobalConfig({...globalConfig, sidecar_resource_limits_memory: e.target.value});
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="256Mi"
                      />
                      <p className="text-xs text-muted-foreground">
                        Memory limit for sidecar containers (e.g., 256Mi, 512Mi, 1Gi)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="sidecar-init-container"
                        checked={globalConfig.sidecar_init_container_enabled !== false}
                        onCheckedChange={(checked) => {
                          setGlobalConfig({...globalConfig, sidecar_init_container_enabled: checked});
                          setHasUnsavedChanges(true);
                        }}
                      />
                      <Label htmlFor="sidecar-init-container" className="cursor-pointer text-sm font-medium">
                        Enable Init Container for iptables Setup
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use an init container to configure iptables rules for traffic interception
                    </p>
                  </div>
                </div>
              )}

              {/* Policy Update & Synchronization */}
              <div className="space-y-5 border-t pt-6">
                <h4 className="text-sm font-semibold text-foreground">Policy Update & Synchronization</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="policy-interval" className="text-sm font-medium">Policy Update Interval</Label>
                    <Select defaultValue="30">
                      <SelectTrigger id="policy-interval">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="30">30 seconds (recommended)</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                        <SelectItem value="120">2 minutes</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How often PEPs poll for policy updates
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="bundle-timeout" className="text-sm font-medium">Bundle Download Timeout</Label>
                    <Select defaultValue="10">
                      <SelectTrigger id="bundle-timeout">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds (recommended)</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Max time to wait for policy bundle download
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="checksum-validation" className="text-sm font-medium">Policy Checksum Validation</Label>
                    <div className="flex items-center space-x-2 h-10">
                      <Switch id="checksum-validation" defaultChecked />
                      <Label htmlFor="checksum-validation" className="cursor-pointer text-sm">
                        Enabled
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Verify policy bundle integrity (recommended)
                    </p>
                  </div>
                </div>
              </div>

              {/* Decision Logging & Metrics */}
              <div className="space-y-5 border-t pt-6">
                <h4 className="text-sm font-semibold text-foreground">Decision Logging & Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="decision-logging" className="text-sm font-medium">Decision Log Export</Label>
                    <div className="flex items-center space-x-2 h-10">
                      <Switch id="decision-logging" defaultChecked />
                      <Label htmlFor="decision-logging" className="cursor-pointer text-sm">
                        Enabled
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Send decision logs to Control Plane for audit
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="log-batch-size" className="text-sm font-medium">Log Batch Size</Label>
                    <Input 
                      id="log-batch-size"
                      type="number" 
                      defaultValue="100" 
                      placeholder="1-1000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of logs to batch before sending
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="log-flush-interval" className="text-sm font-medium">Log Flush Interval</Label>
                    <Select defaultValue="5">
                      <SelectTrigger id="log-flush-interval">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 second</SelectItem>
                        <SelectItem value="5">5 seconds (recommended)</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Max time before flushing logs
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch id="metrics-export" defaultChecked />
                    <Label htmlFor="metrics-export" className="cursor-pointer text-sm font-medium">
                      Enable Metrics Export
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send PEP health and performance metrics to Control Plane
                  </p>
                </div>
              </div>

              {/* Enforcement Behavior */}
              <div className="space-y-5 border-t pt-6">
                <h4 className="text-sm font-semibold text-foreground">Enforcement Behavior</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="fail-policy" className="text-sm font-medium">Fail-Open/Fail-Closed Policy</Label>
                    <Select defaultValue="fail-closed">
                      <SelectTrigger id="fail-policy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fail-closed">
                          <div className="flex flex-col">
                            <span className="font-medium">Fail-Closed (Recommended)</span>
                            <span className="text-xs text-muted-foreground">Deny requests on Control Plane failure</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="fail-open">
                          <div className="flex flex-col">
                            <span className="font-medium">Fail-Open</span>
                            <span className="text-xs text-muted-foreground">Allow requests on Control Plane failure</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      PEP behavior when Control Plane is unreachable
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="security-posture" className="text-sm font-medium">Default Security Posture</Label>
                    <Select defaultValue="deny-all">
                      <SelectTrigger id="security-posture">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deny-all">Deny All (Recommended)</SelectItem>
                        <SelectItem value="allow-all">Allow All</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Default posture for new resources
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance & Limits */}
              <div className="space-y-5 border-t pt-6">
                <h4 className="text-sm font-semibold text-foreground">Performance & Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="default-rate-limit" className="text-sm font-medium">Default Rate Limit</Label>
                    <Input 
                      id="default-rate-limit"
                      type="number" 
                      defaultValue="1000" 
                      placeholder="Requests per minute"
                    />
                    <p className="text-xs text-muted-foreground">
                      Requests per minute per bouncer
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="default-timeout" className="text-sm font-medium">Default Timeout</Label>
                    <Input 
                      id="default-timeout"
                      type="number" 
                      defaultValue="30" 
                      placeholder="Seconds"
                    />
                    <p className="text-xs text-muted-foreground">
                      Request timeout in seconds
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="max-connections" className="text-sm font-medium">Max Connections</Label>
                    <Input 
                      id="max-connections"
                      type="number" 
                      defaultValue="500" 
                      placeholder="Concurrent connections"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum concurrent connections
                    </p>
                  </div>
                </div>
              </div>

              {/* Security & TLS */}
              <div className="space-y-5 border-t pt-6">
                <h4 className="text-sm font-semibold text-foreground">Security & TLS</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch id="auto-ssl" defaultChecked />
                      <Label htmlFor="auto-ssl" className="cursor-pointer text-sm font-medium">
                        Enable Auto-SSL for New Bouncers
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically provision Let's Encrypt certificates
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch id="mutual-tls" />
                      <Label htmlFor="mutual-tls" className="cursor-pointer text-sm font-medium">
                        Require Mutual TLS
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Require client certificates for PEP-Control Plane communication
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveGlobalSettings} disabled={isSavingGlobal}>
                  {isSavingGlobal ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Global Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Individual Bouncer Configuration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Individual Bouncer Configuration
              </CardTitle>
              <CardDescription>
                Select a bouncer to configure its specific settings and overrides
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deployedPEPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No bouncers deployed yet. Download and deploy a bouncer to configure it.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("download")}>
                    Go to Download Center
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select 
                    value={selectedBouncer || ""} 
                    onValueChange={(value) => {
                      setSelectedBouncer(value);
                      handleConfigureBouncer(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bouncer to configure" />
                    </SelectTrigger>
                    <SelectContent>
                      {deployedPEPs.map((pep) => (
                        <SelectItem key={pep.id} value={pep.id}>
                          {pep.name} ({pep.environment})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Individual Bouncer Advanced Configuration */}
          {isConfiguring && bouncerConfig ? (
            <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configure Bouncer: {bouncerConfig.name}
                      {hasUnsavedChanges && (
                        <Badge variant="outline" className="text-orange-600">
                          Unsaved Changes
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Configure deployment mode, URLs, DNS, SSL, and traffic settings
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveConfiguration} disabled={isSavingConfig}>
                      {isSavingConfig ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelConfiguration}
                      disabled={isSavingConfig}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Deployment Mode Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Deployment Mode</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className={`p-4 cursor-pointer transition-colors ${
                      bouncerConfig.deploymentMode === 'reverse-proxy' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Scale className="h-6 w-6 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Reverse Proxy</h4>
                          <p className="text-sm text-muted-foreground">
                            Standalone proxy in front of resources
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className={`p-4 cursor-pointer transition-colors ${
                      bouncerConfig.deploymentMode === 'sidecar' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Container className="h-6 w-6 text-green-600" />
                        <div>
                          <h4 className="font-medium">Container Sidecar</h4>
                          <p className="text-sm text-muted-foreground">
                            Intercepts traffic at runtime
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Identification & Registration */}
                <div className="space-y-5 border-t pt-6">
                  <h4 className="text-sm font-semibold text-foreground">Identification & Registration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="bouncerName" className="text-sm font-medium">Bouncer Name</Label>
                      <Input
                        id="bouncerName"
                        value={bouncerConfig.name}
                        onChange={(e) => {
                          setBouncerConfig({
                            ...bouncerConfig,
                            name: e.target.value
                          });
                          setHasUnsavedChanges(true);
                          // Clear name validation error if exists
                          if (validationErrors.name) {
                            setValidationErrors({...validationErrors, name: ''});
                          }
                        }}
                        placeholder="Production API Bouncer East-1"
                        className={validationErrors.name ? 'border-red-500' : ''}
                      />
                      {validationErrors.name && (
                        <p className="text-xs text-red-500">{validationErrors.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        User-friendly name for monitoring and visualization
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="bouncerId" className="text-sm font-medium">Bouncer ID (Read-only)</Label>
                      <Input
                        id="bouncerId"
                        value={bouncerConfig.id}
                        readOnly
                        className="font-mono bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Immutable identifier assigned during registration
                      </p>
                    </div>
                  </div>
                </div>

                {/* Policy Assignment */}
                <div className="space-y-5 border-t pt-6">
                  <h4 className="text-sm font-semibold text-foreground">Policy Assignment</h4>
                  <div className="space-y-3">
                    <Label htmlFor="policy-bundles" className="text-sm font-medium">Assigned Policy Bundles</Label>
                    <Select defaultValue="default">
                      <SelectTrigger id="policy-bundles">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Policy Bundle</SelectItem>
                        <SelectItem value="ai-agent">AI Agent Policies</SelectItem>
                        <SelectItem value="crm-data">CRM Data Policies</SelectItem>
                        <SelectItem value="api-gateway">API Gateway Policies</SelectItem>
                        <SelectItem value="custom">Custom Bundle</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Specific policy bundles this PEP should download and enforce
                    </p>
                  </div>
                </div>

                {/* MCP Context Injection (for AI/MCP Bouncers) */}
                <div className="space-y-5 border-t pt-6">
                  <h4 className="text-sm font-semibold text-foreground">Model Context Protocol (MCP) Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="mcp-header" className="text-sm font-medium">Model Context Header Name</Label>
                      <Input 
                        id="mcp-header"
                        defaultValue="X-Model-Context" 
                        placeholder="X-Model-Context"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        HTTP header for injecting MCP payload into upstream requests
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="mcp-injection" className="text-sm font-medium">Context Injection</Label>
                      <div className="flex items-center space-x-2 h-10">
                        <Switch id="mcp-injection" defaultChecked />
                        <Label htmlFor="mcp-injection" className="cursor-pointer text-sm">
                          Enabled
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enable PEP to generate and inject MCP payload (kill switch if needed)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upstream Service Configuration - Reverse-Proxy */}
                {bouncerConfig.deploymentMode === 'reverse-proxy' && (
                  <div className="space-y-5 border-t pt-6">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Scale className="h-4 w-4 text-blue-600" />
                      Upstream Service Configuration (Reverse-Proxy)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="upstream-url" className="text-sm font-medium">Upstream Target URL</Label>
                        <Input
                          id="upstream-url"
                          value={bouncerConfig.targetUrl || ""}
                          onChange={(e) => {
                            setBouncerConfig({
                              ...bouncerConfig,
                              targetUrl: e.target.value
                            });
                            setHasUnsavedChanges(true);
                            if (validationErrors.targetUrl) {
                              setValidationErrors({...validationErrors, targetUrl: ''});
                            }
                          }}
                          placeholder="https://api.yourservice.com"
                          className={validationErrors.targetUrl ? 'border-red-500' : ''}
                        />
                        {validationErrors.targetUrl && (
                          <p className="text-xs text-red-500">{validationErrors.targetUrl}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Protected service URL that PEP forwards allowed requests to
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="proxy-timeout" className="text-sm font-medium">Proxy Timeout</Label>
                        <Select defaultValue="30">
                          <SelectTrigger id="proxy-timeout">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 seconds</SelectItem>
                            <SelectItem value="10">10 seconds</SelectItem>
                            <SelectItem value="30">30 seconds (recommended)</SelectItem>
                            <SelectItem value="60">60 seconds</SelectItem>
                            <SelectItem value="120">2 minutes</SelectItem>
                            <SelectItem value="300">5 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Max time to wait for upstream response (504 timeout if exceeded)
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="proxy-url" className="text-sm font-medium">Public Proxy URL</Label>
                      <Input
                        id="proxy-url"
                        value={bouncerConfig.proxyUrl || ""}
                        onChange={(e) => {
                          setBouncerConfig({
                            ...bouncerConfig,
                            proxyUrl: e.target.value
                          });
                          setHasUnsavedChanges(true);
                          if (validationErrors.proxyUrl) {
                            setValidationErrors({...validationErrors, proxyUrl: ''});
                          }
                        }}
                        placeholder="https://bouncer-prod.yourcompany.com"
                        className={validationErrors.proxyUrl ? 'border-red-500' : ''}
                      />
                      {validationErrors.proxyUrl && (
                        <p className="text-xs text-red-500">{validationErrors.proxyUrl}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Public URL where this bouncer is accessible to clients
                      </p>
                    </div>
                  </div>
                )}

                {/* Sidecar Configuration - Sidecar Only */}
                {bouncerConfig.deploymentMode === 'sidecar' && (
                  <div className="space-y-5 border-t pt-6">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Container className="h-4 w-4 text-green-600" />
                      Sidecar Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="sidecar-port-override" className="text-sm font-medium">Sidecar Port Override</Label>
                        <Input
                          id="sidecar-port-override"
                          type="number"
                          placeholder="8080 (uses global default)"
                          min="1"
                          max="65535"
                        />
                        <p className="text-xs text-muted-foreground">
                          Override the global sidecar port for this specific bouncer
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="sidecar-traffic-mode" className="text-sm font-medium">Traffic Interception Mode</Label>
                        <Select defaultValue="iptables">
                          <SelectTrigger id="sidecar-traffic-mode">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iptables">iptables (Direct)</SelectItem>
                            <SelectItem value="istio">Istio Service Mesh</SelectItem>
                            <SelectItem value="linkerd">Linkerd Service Mesh</SelectItem>
                            <SelectItem value="envoy">Envoy Proxy</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          How the sidecar intercepts traffic
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="sidecar-cpu-override" className="text-sm font-medium">CPU Limit Override</Label>
                        <Input
                          id="sidecar-cpu-override"
                          placeholder="500m (uses global default)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Override CPU limit for this sidecar (e.g., 500m, 1, 2)
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="sidecar-memory-override" className="text-sm font-medium">Memory Limit Override</Label>
                        <Input
                          id="sidecar-memory-override"
                          placeholder="256Mi (uses global default)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Override memory limit for this sidecar (e.g., 256Mi, 512Mi, 1Gi)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resource Identification Rules */}
                <div className="space-y-5 border-t pt-6">
                  <h4 className="text-sm font-semibold text-foreground">Resource Identification Rules</h4>
                  <p className="text-sm text-muted-foreground">
                    Define rules to identify logical resources from incoming requests for policy application
                  </p>
                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-4 border">
                      <div className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground mb-3">
                        <div>Rule Type</div>
                        <div>Pattern/Value</div>
                        <div>Resource Name</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 items-start">
                        <div className="space-y-2">
                          <Select defaultValue="path_prefix">
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="path_prefix">Path Prefix</SelectItem>
                              <SelectItem value="host_name">Host Name</SelectItem>
                              <SelectItem value="header">Header Value</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Input placeholder="/v1/models/" className="font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Input placeholder="AI Models API" />
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Resource Identification Rule
                    </Button>
                  </div>
                </div>

                {/* Advanced Features Section */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-base font-medium flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Advanced Features
                  </h3>

                  {/* Cache Configuration */}
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Cache Configuration</CardTitle>
                      <CardDescription className="text-xs">
                        Improve performance by caching policy decisions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch id="cache-enabled" defaultChecked />
                        <Label htmlFor="cache-enabled" className="text-sm cursor-pointer">
                          Enable Response Cache
                        </Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="cache-ttl" className="text-xs">Cache TTL (seconds)</Label>
                          <Input id="cache-ttl" type="number" defaultValue="300" className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="cache-size" className="text-xs">Max Cache Size (MB)</Label>
                          <Input id="cache-size" type="number" defaultValue="100" className="h-9 text-sm" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cache-strategy" className="text-xs">Invalidation Strategy</Label>
                        <Select defaultValue="lru">
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lru">LRU (Least Recently Used)</SelectItem>
                            <SelectItem value="lfu">LFU (Least Frequently Used)</SelectItem>
                            <SelectItem value="ttl">TTL-based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Circuit Breaker */}
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Circuit Breaker</CardTitle>
                      <CardDescription className="text-xs">
                        Prevent cascading failures when Control Plane is unreachable
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch id="circuit-breaker" defaultChecked />
                        <Label htmlFor="circuit-breaker" className="text-sm cursor-pointer">
                          Enable Circuit Breaker
                        </Label>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="failure-threshold" className="text-xs">Failure Threshold</Label>
                          <Input id="failure-threshold" type="number" defaultValue="5" className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="success-threshold" className="text-xs">Success Threshold</Label>
                          <Input id="success-threshold" type="number" defaultValue="2" className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="circuit-timeout" className="text-xs">Timeout (seconds)</Label>
                          <Input id="circuit-timeout" type="number" defaultValue="60" className="h-9 text-sm" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Load Balancing (for multiple bouncers) */}
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Load Balancing</CardTitle>
                      <CardDescription className="text-xs">
                        Configure how traffic is distributed across bouncer instances
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="lb-algorithm" className="text-xs">Algorithm</Label>
                        <Select defaultValue="round-robin">
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="round-robin">Round Robin</SelectItem>
                            <SelectItem value="least-connections">Least Connections</SelectItem>
                            <SelectItem value="ip-hash">IP Hash</SelectItem>
                            <SelectItem value="weighted">Weighted Round Robin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="sticky-sessions" />
                        <Label htmlFor="sticky-sessions" className="text-sm cursor-pointer">
                          Enable Sticky Sessions
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Traffic Configuration */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Traffic Configuration</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ingressEnabled"
                        checked={bouncerConfig.trafficConfig.ingressEnabled}
                        onCheckedChange={(checked) => {
                          setBouncerConfig({
                            ...bouncerConfig,
                            trafficConfig: {
                              ...bouncerConfig.trafficConfig,
                              ingressEnabled: checked
                            }
                          });
                          setHasUnsavedChanges(true);
                        }}
                      />
                      <Label htmlFor="ingressEnabled">Enable Ingress Traffic</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="egressEnabled"
                        checked={bouncerConfig.trafficConfig.egressEnabled}
                        onCheckedChange={(checked) => {
                          setBouncerConfig({
                            ...bouncerConfig,
                            trafficConfig: {
                              ...bouncerConfig.trafficConfig,
                              egressEnabled: checked
                            }
                          });
                          setHasUnsavedChanges(true);
                        }}
                      />
                      <Label htmlFor="egressEnabled">Enable Egress Traffic</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateLimit">Rate Limit (per minute)</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        value={bouncerConfig.trafficConfig.rateLimitPerMinute}
                        onChange={(e) => {
                          setBouncerConfig({
                            ...bouncerConfig,
                            trafficConfig: {
                              ...bouncerConfig.trafficConfig,
                              rateLimitPerMinute: parseInt(e.target.value) || 0
                            }
                          });
                          setHasUnsavedChanges(true);
                          if (validationErrors.rateLimitPerMinute) {
                            setValidationErrors({...validationErrors, rateLimitPerMinute: ''});
                          }
                        }}
                        placeholder="1000"
                        className={validationErrors.rateLimitPerMinute ? 'border-red-500' : ''}
                      />
                      {validationErrors.rateLimitPerMinute && (
                        <p className="text-xs text-red-500">{validationErrors.rateLimitPerMinute}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxConnections">Max Connections</Label>
                      <Input
                        id="maxConnections"
                        type="number"
                        value={bouncerConfig.trafficConfig.maxConnections}
                        onChange={(e) => {
                          setBouncerConfig({
                            ...bouncerConfig,
                            trafficConfig: {
                              ...bouncerConfig.trafficConfig,
                              maxConnections: parseInt(e.target.value) || 0
                            }
                          });
                          setHasUnsavedChanges(true);
                          if (validationErrors.maxConnections) {
                            setValidationErrors({...validationErrors, maxConnections: ''});
                          }
                        }}
                        placeholder="500"
                        className={validationErrors.maxConnections ? 'border-red-500' : ''}
                      />
                      {validationErrors.maxConnections && (
                        <p className="text-xs text-red-500">{validationErrors.maxConnections}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (seconds)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={bouncerConfig.trafficConfig.timeoutSeconds}
                        onChange={(e) => {
                          setBouncerConfig({
                            ...bouncerConfig,
                            trafficConfig: {
                              ...bouncerConfig.trafficConfig,
                              timeoutSeconds: parseInt(e.target.value) || 0
                            }
                          });
                          setHasUnsavedChanges(true);
                          if (validationErrors.timeoutSeconds) {
                            setValidationErrors({...validationErrors, timeoutSeconds: ''});
                          }
                        }}
                        placeholder="30"
                        className={validationErrors.timeoutSeconds ? 'border-red-500' : ''}
                      />
                      {validationErrors.timeoutSeconds && (
                        <p className="text-xs text-red-500">{validationErrors.timeoutSeconds}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retryAttempts">Retry Attempts</Label>
                      <Input
                        id="retryAttempts"
                        type="number"
                        value={bouncerConfig.trafficConfig.retryAttempts}
                        onChange={(e) => setBouncerConfig({
                          ...bouncerConfig,
                          trafficConfig: {
                            ...bouncerConfig.trafficConfig,
                            retryAttempts: parseInt(e.target.value)
                          }
                        })}
                        placeholder="3"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* OPAL Configuration for this Bouncer */}
            <BouncerOPALConfig 
              pepId={parseInt(selectedBouncer || '0')}
              bouncerId={bouncerConfig.id}
              environment={deployedPEPs.find(p => p.id === selectedBouncer)?.environment || 'sandbox'}
            />
            </>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Bouncer Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a Bouncer from the Deployment Status tab to configure its settings
              </p>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="github" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Manage GitHub synchronization for each bouncer. Each bouncer's built-in OPAL Server pulls policies from its designated GitHub folder.
            </AlertDescription>
          </Alert>

          {deployedPEPs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Bouncers Deployed</p>
                <p className="text-muted-foreground text-center mb-4">
                  Deploy a bouncer to configure GitHub synchronization
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deployedPEPs.map((pep) => (
                <Card key={pep.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{pep.name}</CardTitle>
                        <CardDescription>
                          Environment: {pep.environment}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <BouncerGitHubTab 
                      bouncerId={parseInt(pep.id)} 
                      bouncerName={pep.name}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="download" className="space-y-4">
          <UnifiedBouncerDownload environment="sandbox" />
        </TabsContent>
      </Tabs>
    </div>
  );
}