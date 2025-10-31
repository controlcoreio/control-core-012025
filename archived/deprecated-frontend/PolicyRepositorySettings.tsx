import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  GitBranch, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Settings,
  AlertCircle,
  Info,
  FolderTree,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { Link } from "react-router-dom";
import { SecureStorage } from "@/utils/secureStorage";
import { APP_CONFIG } from "@/config/app";

interface GitHubRepoSettings {
  repoUrl: string;
  branch: string;
  accessToken: string;
  autoSync: boolean;
  syncInterval: number; // minutes
  webhookUrl?: string;
  webhookSecret?: string;
  lastSyncTime?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

export function PolicyRepositorySettings() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [settings, setSettings] = useState<GitHubRepoSettings>({
    repoUrl: '',
    branch: 'main',
    accessToken: '',
    autoSync: true,
    syncInterval: 5,
    connectionStatus: 'disconnected'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = SecureStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/settings/github-config`, {
        headers: getAuthHeaders()
      });
      
      // Check content type to avoid JSON parse errors
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType?.includes('application/json')) {
        const data = await response.json();
        setSettings(prev => ({
          repoUrl: data.repo_url || '',
          branch: data.branch || 'main',
          // Keep existing token if masked
          accessToken: (data.access_token === '***' || !data.access_token) ? prev.accessToken : data.access_token,
          autoSync: data.auto_sync !== undefined ? data.auto_sync : true,
          syncInterval: data.sync_interval || 5,
          webhookUrl: data.webhook_url || '',
          // Keep existing secret if masked
          webhookSecret: (data.webhook_secret === '***' || !data.webhook_secret) ? prev.webhookSecret : data.webhook_secret,
          lastSyncTime: data.last_sync_time || '',
          connectionStatus: data.connection_status || 'disconnected'
        }));
      } else if (response.status === 401) {
        console.info('[GitHub Settings] Not authenticated - settings will be empty');
      } else {
        console.info('[GitHub Settings] Backend may not be running - using default settings');
      }
    } catch (error) {
      console.info('[GitHub Settings] Could not load settings. Backend may not be running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/settings/github-config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          repo_url: settings.repoUrl,
          branch: settings.branch,
          access_token: settings.accessToken,
          auto_sync: settings.autoSync,
          sync_interval: settings.syncInterval,
          webhook_url: settings.webhookUrl,
          webhook_secret: settings.webhookSecret
        })
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType?.includes('application/json')) {
        const data = await response.json();
        toast({
          title: "Settings Saved",
          description: "GitHub repository settings have been updated successfully.",
        });
        // Update connection status from response, but keep sensitive fields
        setSettings(prev => ({
          ...prev,
          connectionStatus: data.connection_status || prev.connectionStatus
        }));
      } else {
        throw new Error('Failed to save settings - backend may not be available');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings. Please check that the backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/settings/github-config/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          repo_url: settings.repoUrl,
          branch: settings.branch,
          access_token: settings.accessToken
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Backend is not responding. Please ensure the Control Core backend is running.');
      }

      const data = await response.json();

      if (response.ok && data.success) {
        // Save the connection status to database
        const saveResponse = await fetch(`${APP_CONFIG.api.baseUrl}/settings/github-config`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            repo_url: settings.repoUrl,
            branch: settings.branch,
            access_token: settings.accessToken,
            auto_sync: settings.autoSync,
            sync_interval: settings.syncInterval,
            webhook_url: settings.webhookUrl,
            webhook_secret: settings.webhookSecret,
            connection_status: 'connected'
          })
        });

        if (saveResponse.ok) {
          setSettings(prev => ({ ...prev, connectionStatus: 'connected' }));
          toast({
            title: "Connection Successful",
            description: data.message || "Successfully connected to GitHub repository.",
          });
        } else {
          // Still show success for test, but warn about save
          setSettings(prev => ({ ...prev, connectionStatus: 'connected' }));
          toast({
            title: "Connection Successful",
            description: "GitHub connection verified. Please save settings to persist.",
          });
        }
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Unable to connect to GitHub repository.",
          variant: "destructive",
        });
        setSettings(prev => ({ ...prev, connectionStatus: 'error' }));
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to test GitHub connection. Ensure the backend is running.",
        variant: "destructive",
      });
      setSettings(prev => ({ ...prev, connectionStatus: 'error' }));
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualSync = async () => {
    // Manual sync now triggers all bouncers to pull from GitHub
    // This is different from the old approach which pushed to GitHub
    setIsSyncing(true);
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/peps/sync-all`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "✓ Sync Triggered",
          description: `${data.success_count} bouncers will pull policies from GitHub`,
        });
        
        // Show notifications if any bouncers failed
        if (data.failed_count > 0) {
          addNotification({
            title: "Some Bouncers Failed to Sync",
            message: `${data.failed_count} bouncer(s) could not be synced. Check bouncer status.`,
            category: "system",
            action: {
              label: "View Bouncers",
              url: "/settings/peps"
            }
          });
        }
        
        await loadSettings();
      } else {
        throw new Error('Failed to trigger sync');
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to trigger bouncer sync",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    switch (settings.connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (settings.connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-600">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Not Connected</Badge>;
    }
  };

  if (isLoading && !settings.repoUrl) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Controls Repository Settings</h1>
        <p className="text-muted-foreground">
          Configure your organization's default GitHub repository for policy storage
        </p>
      </div>

      {/* Tenant-Wide Configuration Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Tenant-Wide Default Repository</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            This is your organization's <strong>master policy repository</strong>. When you create or edit policies in the PAP UI, 
            they are written here. All bouncers can use this repository by default.
          </p>
          <div className="space-y-1 text-sm">
            <div>✓ PAP commits <code className="bg-muted px-1 rounded">.rego</code> files to this repository</div>
            <div>✓ Bouncers pull policies from their assigned resource folders</div>
            <div>✓ Individual bouncers can override to use custom repositories if needed</div>
          </div>
          <p className="mt-2 text-sm">
            <strong>Tip:</strong> For most use cases, configure this once and all bouncers will use it automatically.
          </p>
        </AlertDescription>
      </Alert>

      {/* Connection Status Alert */}
      {settings.connectionStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Unable to connect to GitHub repository. Please check your settings and test the connection.
          </AlertDescription>
        </Alert>
      )}

      {settings.connectionStatus === 'connected' && (
        <Alert className="border-green-200 bg-green-50 text-green-900">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">✓ Connected to GitHub</AlertTitle>
          <AlertDescription className="text-green-800">
            Successfully connected to GitHub repository. Controls are being synchronized.
            {settings.lastSyncTime && ` • Last sync: ${new Date(settings.lastSyncTime).toLocaleString()}`}
            {settings.autoSync && ` • Auto-sync enabled (every ${settings.syncInterval} minutes)`}
          </AlertDescription>
        </Alert>
      )}

      {settings.connectionStatus === 'disconnected' && settings.repoUrl && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">GitHub Not Connected</AlertTitle>
          <AlertDescription className="text-yellow-800">
            GitHub repository configured but not tested. Click "Test Connection" to verify access.
          </AlertDescription>
        </Alert>
      )}

      {/* Repository Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Repository Configuration</CardTitle>
              <CardDescription>Configure your GitHub repository for policy storage</CardDescription>
            </div>
            {getStatusIcon()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="repoUrl" className="text-sm font-medium block">Repository URL *</Label>
            <Input
              id="repoUrl"
              placeholder="https://github.com/your-org/policies-repo"
              value={settings.repoUrl}
              onChange={(e) => setSettings({ ...settings, repoUrl: e.target.value })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Full URL to your GitHub repository
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="branch" className="text-sm font-medium block">Branch</Label>
            <Input
              id="branch"
              placeholder="main"
              value={settings.branch}
              onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Branch to use for policy storage (default: main)
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="accessToken" className="text-sm font-medium block">GitHub Access Token *</Label>
            <div className="flex gap-2">
              <Input
                id="accessToken"
                type={showToken ? "text" : "password"}
                placeholder="ghp_xxxxxxxxxxxx"
                value={settings.accessToken}
                onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? "Hide" : "Show"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Personal access token with repo permissions
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTestConnection} disabled={isTesting || !settings.repoUrl || !settings.accessToken}>
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button variant="outline" onClick={handleSaveSettings} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronization Settings</CardTitle>
          <CardDescription>Configure automatic policy synchronization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <div className="flex-1 pr-4">
              <Label htmlFor="autoSync" className="text-base font-medium cursor-pointer">
                Automatic Sync
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically sync controls with GitHub at regular intervals
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${settings.autoSync ? 'text-green-600' : 'text-gray-500'}`}>
                {settings.autoSync ? 'ON' : 'OFF'}
              </span>
              <Switch
                id="autoSync"
                checked={settings.autoSync}
                onCheckedChange={(checked) => setSettings({ ...settings, autoSync: checked })}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>

          {settings.autoSync && (
            <div className="space-y-3 pl-4 border-l-2 border-blue-200">
              <Label htmlFor="syncInterval" className="text-sm font-medium block">Sync Interval (minutes)</Label>
              <Input
                id="syncInterval"
                type="number"
                min="1"
                max="60"
                value={settings.syncInterval}
                onChange={(e) => setSettings({ ...settings, syncInterval: parseInt(e.target.value) || 5 })}
                className="w-full max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                How often to sync controls with GitHub (1-60 minutes)
              </p>
            </div>
          )}

          {!settings.autoSync && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Automatic sync is disabled. You can use Manual Sync to trigger all bouncers to pull policies from GitHub.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleManualSync} 
              disabled={isSyncing || !settings.repoUrl || !settings.accessToken}
              variant="outline"
              className="w-full"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isSyncing ? 'Syncing...' : 'Manual Sync Now'}
            </Button>
            {!settings.repoUrl || !settings.accessToken ? (
              <p className="text-xs text-muted-foreground text-center">
                Configure repository URL and access token above to enable manual sync
              </p>
            ) : settings.connectionStatus !== 'connected' ? (
              <p className="text-xs text-yellow-600 text-center">
                ⚠️ Test connection first to verify GitHub access (recommended)
              </p>
            ) : (
              <p className="text-xs text-green-600 text-center">
                ✓ Ready to trigger all bouncers to pull policies from GitHub
              </p>
            )}
          </div>
          
          {!settings.autoSync && (
            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Manual Sync triggers:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>All active bouncers to pull from their GitHub folders</li>
                  <li>Each bouncer's OPAL Server re-syncs its policies</li>
                  <li>Latest policies loaded into OPA engines</li>
                  <li>For per-bouncer sync, use the GitHub Sync tab in Bouncer details</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Repository Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Repository Structure
          </CardTitle>
          <CardDescription>
            Policies are organized by Protected Resource and Environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Explanation Alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>How it works:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Each Protected Resource gets its own folder</li>
                <li>Each Bouncer watches its resource's folder + environment</li>
                <li>Example: "API Gateway" bouncer in sandbox watches <code className="bg-blue-100 px-1 rounded">policies/api-gateway/sandbox/</code></li>
                <li>PAP automatically creates the correct folder structure when you save policies</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Structure Example */}
          <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
            <div className="text-blue-600 font-semibold">📁 your-repo-name/</div>
            <div className="ml-2">📁 policies/</div>
            
            {/* Example 1 - API Gateway */}
            <div className="ml-4 mt-2 text-purple-600 font-semibold">📁 api-gateway/</div>
            <div className="ml-6 text-muted-foreground text-xs">← Resource: "API Gateway"</div>
            <div className="ml-6">📁 sandbox/</div>
            <div className="ml-8">📁 enabled/</div>
            <div className="ml-10 text-green-600">policy_101.rego</div>
            <div className="ml-10 text-green-600">policy_102.rego</div>
            <div className="ml-8">📁 disabled/</div>
            <div className="ml-10 text-muted-foreground">policy_103.rego</div>
            <div className="ml-6">📁 production/</div>
            <div className="ml-8">📁 enabled/</div>
            <div className="ml-10 text-green-600">policy_104.rego</div>
            
            {/* Example 2 - CRM Service */}
            <div className="ml-4 mt-2 text-purple-600 font-semibold">📁 crm-service/</div>
            <div className="ml-6 text-muted-foreground text-xs">← Resource: "CRM Service"</div>
            <div className="ml-6">📁 sandbox/</div>
            <div className="ml-8">📁 enabled/</div>
            <div className="ml-10 text-green-600">policy_201.rego</div>
            <div className="ml-6">📁 production/</div>
            <div className="ml-8">📁 enabled/</div>
            <div className="ml-10 text-green-600">policy_202.rego</div>
            
            {/* Example 3 - AI Model */}
            <div className="ml-4 mt-2 text-purple-600 font-semibold">📁 ai-model-api/</div>
            <div className="ml-6 text-muted-foreground text-xs">← Resource: "AI Model API"</div>
            <div className="ml-6">📁 production/</div>
            <div className="ml-8">📁 enabled/</div>
            <div className="ml-10 text-green-600">policy_301.rego</div>
          </div>

          {/* Folder Path Explanation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Folder Path Format:</strong><br />
              <code className="bg-muted px-2 py-1 rounded text-sm mt-1 inline-block">
                policies/[resource-name]/[environment]/[enabled|disabled]/policy_[id].rego
              </code>
              <div className="mt-3 space-y-1 text-sm">
                <div><strong>[resource-name]:</strong> From Protected Resource (normalized, lowercase, hyphens)</div>
                <div><strong>[environment]:</strong> "sandbox" or "production"</div>
                <div><strong>[enabled|disabled]:</strong> Policy activation status</div>
                <div><strong>[id]:</strong> Unique policy ID from PAP database</div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Setup Instructions */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Setup Instructions</AlertTitle>
            <AlertDescription className="text-green-800">
              <ol className="list-decimal list-inside space-y-2 mt-2 text-sm">
                <li>Create a GitHub repository (public or private)</li>
                <li>Generate a Personal Access Token with <strong>repo</strong> permissions</li>
                <li>Enter repository URL and token above, then click "Test Connection"</li>
                <li>Save settings - PAP will auto-create folder structure when you save your first policy</li>
                <li>Deploy bouncers - they'll automatically watch their assigned resource folders</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Bouncer Configuration Link */}
          {settings.connectionStatus === 'connected' && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Next Step:</strong> Configure which resources each bouncer should protect in{' '}
                <Link to="/settings/peps" className="underline font-medium hover:text-blue-900">
                  Bouncer Management
                </Link>
                . Each bouncer will automatically sync policies from its resource's folder.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

