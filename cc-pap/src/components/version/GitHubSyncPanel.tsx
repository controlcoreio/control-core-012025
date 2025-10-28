
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, GitBranch, Clock, AlertCircle, CheckCircle, ExternalLink, Settings } from "lucide-react";
import { useState } from "react";

interface GitHubSyncStatus {
  connected: boolean;
  repository: string;
  branch: string;
  lastSync: string;
  pendingChanges: number;
  autoCommit: boolean;
  syncStatus: "synced" | "pending" | "error";
}

interface GitHubSyncPanelProps {
  syncStatus: GitHubSyncStatus;
}

export function GitHubSyncPanel({ syncStatus }: GitHubSyncPanelProps) {
  const [autoCommit, setAutoCommit] = useState(syncStatus.autoCommit);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    // Simulate sync operation
    setTimeout(() => {
      setSyncing(false);
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus.syncStatus) {
      case "synced":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus.syncStatus) {
      case "synced":
        return "All changes synced";
      case "pending":
        return `${syncStatus.pendingChanges} changes pending`;
      case "error":
        return "Sync failed";
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Repository Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={syncStatus.connected ? "default" : "destructive"}>
                  {syncStatus.connected ? "Connected" : "Disconnected"}
                </Badge>
                {syncStatus.connected && (
                  <>
                    <span className="text-sm text-muted-foreground">•</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{syncStatus.repository}</code>
                    <span className="text-sm text-muted-foreground">•</span>
                    <Badge variant="outline">{syncStatus.branch}</Badge>
                  </>
                )}
              </div>
              {syncStatus.connected && (
                <p className="text-sm text-muted-foreground">
                  Last sync: {formatDate(syncStatus.lastSync)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://github.com/${syncStatus.repository}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Repository
              </Button>
              {!syncStatus.connected && (
                <Button size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Connect GitHub
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      {syncStatus.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getSyncStatusIcon()}
              Synchronization Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{getSyncStatusText()}</p>
                <p className="text-sm text-muted-foreground">
                  Repository is {syncStatus.syncStatus === "synced" ? "up to date" : "behind local changes"}
                </p>
              </div>
              <Button
                onClick={handleSync}
                disabled={syncing || syncStatus.syncStatus === "synced"}
                size="sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
            </div>

            {syncStatus.pendingChanges > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm text-yellow-800">
                      {syncStatus.pendingChanges} pending changes
                    </div>
                    <div className="text-sm text-yellow-700">
                      These changes will be committed to GitHub when you sync.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-commit Settings */}
      {syncStatus.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Automation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Auto-commit changes</p>
                <p className="text-sm text-muted-foreground">
                  Automatically commit policy changes to GitHub
                </p>
              </div>
              <Switch
                checked={autoCommit}
                onCheckedChange={setAutoCommit}
              />
            </div>
            
            {autoCommit && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm text-blue-800">
                      Auto-commit enabled
                    </div>
                    <div className="text-sm text-blue-700">
                      Changes will be automatically committed with descriptive messages.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
