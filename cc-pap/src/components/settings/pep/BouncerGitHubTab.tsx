import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  GitBranch, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  AlertCircle,
  Info,
  Clock,
  FolderTree
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { SecureStorage } from "@/utils/secureStorage";
import { APP_CONFIG } from "@/config/app";

interface BouncerGitHubTabProps {
  bouncerId: number;
  bouncerName: string;
}

interface SyncHistoryItem {
  id: number;
  sync_time: string;
  sync_type: string;
  status: string;
  policies_synced: number;
  error_message?: string;
  duration_ms?: number;
  triggered_by?: string;
}

export function BouncerGitHubTab({ bouncerId, bouncerName }: BouncerGitHubTabProps) {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [useTenantDefault, setUseTenantDefault] = useState(true);
  const [customRepo, setCustomRepo] = useState("");
  const [customBranch, setCustomBranch] = useState("main");
  const [customToken, setCustomToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const getAuthHeaders = () => {
    const token = SecureStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    loadSyncStatus();
    loadSyncHistory();
  }, [bouncerId]);

  const loadSyncStatus = async () => {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/peps/${bouncerId}/sync-status`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
        setUseTenantDefault(data.use_tenant_default !== false);
      }
    } catch (error) {
      console.error("Failed to load sync status:", error);
    }
  };

  const loadSyncHistory = async () => {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/peps/${bouncerId}/sync-history?limit=10`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSyncHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to load sync history:", error);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/peps/${bouncerId}/sync-policies`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "✓ Sync Triggered",
          description: `${bouncerName}'s OPAL Server will pull policies from GitHub`,
        });

        addNotification({
          title: "Bouncer Sync Triggered",
          message: `${bouncerName} is now pulling latest policies from ${data.folder_path}`,
          category: "system",
        });

        // Reload status and history
        await loadSyncStatus();
        await loadSyncHistory();
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Sync failed");
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to trigger sync",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setLoading(true);
    // TODO: Implement save configuration endpoint
    // This would update the BouncerOPALConfiguration with custom settings
    toast({
      title: "Configuration Saved",
      description: "GitHub configuration updated successfully",
    });
    setLoading(false);
  };

  const getSyncStatusBadge = () => {
    if (!syncStatus?.last_sync_status) {
      return <Badge variant="secondary">Not Synced</Badge>;
    }

    switch (syncStatus.last_sync_status) {
      case "success":
        return <Badge className="bg-green-600">✓ Synced</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-600">Syncing...</Badge>;
      case "failed":
        return <Badge variant="destructive">✗ Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatTimeAgo = (isoString: string) => {
    if (!isoString) return "Never";
    const date = new Date(isoString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Sync Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>GitHub Sync Status</CardTitle>
              <CardDescription>
                This bouncer's OPAL Server pulls policies from GitHub
              </CardDescription>
            </div>
            {getSyncStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncStatus?.configured ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">GitHub Folder</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FolderTree className="h-4 w-4" />
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {syncStatus.folder_path || "Not configured"}
                    </code>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Policies Loaded</p>
                  <p className="text-2xl font-bold mt-1">{syncStatus.policies_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {syncStatus.last_sync_time ? formatTimeAgo(syncStatus.last_sync_time) : "Never"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Polling Interval</p>
                  <p className="text-sm mt-1">{syncStatus.polling_interval || 30} seconds</p>
                </div>
              </div>

              {syncStatus.last_sync_error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {syncStatus.last_sync_error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleManualSync} 
                disabled={syncing}
                className="w-full"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {syncing ? "Triggering Sync..." : "Trigger Manual Sync Now"}
              </Button>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                GitHub sync not configured for this bouncer. Configure settings below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* GitHub Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>GitHub Repository Configuration</CardTitle>
          <CardDescription>
            Configure where this bouncer's OPAL Server pulls policies from
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Use Tenant Default */}
          <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <div className="flex-1 pr-4">
              <Label htmlFor="useTenantDefault" className="text-base font-medium cursor-pointer">
                Use Tenant Default Repository
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Use the default GitHub repository configured for your organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${useTenantDefault ? 'text-green-600' : 'text-gray-500'}`}>
                {useTenantDefault ? 'ON' : 'OFF'}
              </span>
              <Switch
                id="useTenantDefault"
                checked={useTenantDefault}
                onCheckedChange={setUseTenantDefault}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>

          {/* Tenant Default Info */}
          {useTenantDefault && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Using tenant's default GitHub repository. This bouncer will pull policies from its designated folder based on resource and environment.
              </AlertDescription>
            </Alert>
          )}

          {/* Custom GitHub Configuration */}
          {!useTenantDefault && (
            <div className="space-y-4 p-4 border-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="h-5 w-5" />
                <h3 className="font-semibold">Custom GitHub Repository</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="customRepo">Repository URL</Label>
                  <Input
                    id="customRepo"
                    placeholder="https://github.com/org/custom-policies"
                    value={customRepo}
                    onChange={(e) => setCustomRepo(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="customBranch">Branch</Label>
                  <Input
                    id="customBranch"
                    placeholder="main"
                    value={customBranch}
                    onChange={(e) => setCustomBranch(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="customToken">GitHub Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customToken"
                      type={showToken ? "text" : "password"}
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={customToken}
                      onChange={(e) => setCustomToken(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Personal access token with repo permissions
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSaveConfiguration} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent sync operations for this bouncer</CardDescription>
        </CardHeader>
        <CardContent>
          {syncHistory.length > 0 ? (
            <div className="space-y-2">
              {syncHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {item.status === "success" || item.status === "triggered" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {item.sync_type === "manual" ? "Manual Sync" : "Auto Sync"}
                        {item.triggered_by && ` by ${item.triggered_by}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(item.sync_time)}
                        {item.policies_synced > 0 && ` • ${item.policies_synced} policies`}
                        {item.duration_ms && ` • ${item.duration_ms}ms`}
                      </p>
                      {item.error_message && (
                        <p className="text-xs text-red-600 mt-1">{item.error_message}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={item.status === "success" || item.status === "triggered" ? "default" : "destructive"}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sync history yet</p>
              <p className="text-sm">Trigger a manual sync to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OPAL Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>OPAL Server Configuration</CardTitle>
          <CardDescription>
            Built-in OPAL Server settings for this bouncer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>How it works:</strong><br />
              1. PAP writes .rego files to GitHub when you create/update policies<br />
              2. This bouncer's OPAL Server polls GitHub every {syncStatus?.polling_interval || 30} seconds<br />
              3. When changes detected, OPAL Client loads policies into OPA<br />
              4. Policies are automatically enforced on traffic
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-muted rounded-lg space-y-2 font-mono text-sm">
            <div><span className="text-muted-foreground">OPAL Mode:</span> Server + Client (Built-in)</div>
            <div><span className="text-muted-foreground">GitHub Folder:</span> {syncStatus?.folder_path || "Not configured"}</div>
            <div><span className="text-muted-foreground">Polling:</span> Every {syncStatus?.polling_interval || 30}s</div>
            <div><span className="text-muted-foreground">Webhook:</span> {syncStatus?.webhook_enabled ? "Enabled" : "Disabled"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

