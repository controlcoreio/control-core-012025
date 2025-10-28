import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Settings,
  Shield,
  AlertCircle,
  Info,
  Database,
  Zap,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OPALServerConfig {
  serverUrl: string;
  clientUrl: string;
  apiKey: string;
  broadcastChannel: string;
  dataUpdateInterval: number;
  enableStatistics: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

interface BouncerOPALConfig {
  id: string;
  bouncerId: string;
  bouncerName: string;
  policyFilters: string[];
  dataFilters: string[];
  cacheSettings: {
    enabled: boolean;
    ttl: number;
    maxSize: string;
  };
  rateLimits: {
    requestsPerSecond: number;
    burstSize: number;
  };
}

export function OPALSettings() {
  const { toast } = useToast();
  const [globalConfig, setGlobalConfig] = useState<OPALServerConfig>({
    serverUrl: '',
    clientUrl: '',
    apiKey: '',
    broadcastChannel: 'policy_updates',
    dataUpdateInterval: 10,
    enableStatistics: true,
    connectionStatus: 'disconnected'
  });
  const [bouncerConfigs, setBouncerConfigs] = useState<BouncerOPALConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [editingBouncer, setEditingBouncer] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Load global OPAL config
      const globalResponse = await fetch('/api/settings/opal-config');
      if (globalResponse.ok) {
        const globalData = await globalResponse.json();
        setGlobalConfig(globalData);
      }

      // Load per-bouncer configs
      const bouncersResponse = await fetch('/api/settings/opal-config/bouncers');
      if (bouncersResponse.ok) {
        const bouncersData = await bouncersResponse.json();
        setBouncerConfigs(bouncersData);
      }
    } catch (error) {
      console.error('Failed to load OPAL settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGlobalConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/opal-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(globalConfig)
      });

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "OPAL server settings have been updated successfully.",
        });
        await loadSettings();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save OPAL settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/settings/opal-config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(globalConfig)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to OPAL server. ${data.connectedClients || 0} clients connected.`,
        });
        setGlobalConfig(prev => ({ ...prev, connectionStatus: 'connected' }));
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Unable to connect to OPAL server.",
          variant: "destructive",
        });
        setGlobalConfig(prev => ({ ...prev, connectionStatus: 'error' }));
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to test OPAL connection.",
        variant: "destructive",
      });
      setGlobalConfig(prev => ({ ...prev, connectionStatus: 'error' }));
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (globalConfig.connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  if (isLoading && !globalConfig.serverUrl) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-6xl mx-auto space-y-6">
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
        <h1 className="text-3xl font-bold">OPAL Configuration</h1>
        <p className="text-muted-foreground">
          Configure policy and data distribution to bouncers via OPAL
        </p>
      </div>

      {/* Global OPAL Server Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Global OPAL Server Configuration
              </CardTitle>
              <CardDescription>Configure your OPAL server endpoints and settings</CardDescription>
            </div>
            {getStatusIcon()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serverUrl">OPAL Server URL *</Label>
              <Input
                id="serverUrl"
                placeholder="http://localhost:8084"
                value={globalConfig.serverUrl}
                onChange={(e) => setGlobalConfig({ ...globalConfig, serverUrl: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="clientUrl">OPAL Client URL</Label>
              <Input
                id="clientUrl"
                placeholder="http://localhost:8083"
                value={globalConfig.clientUrl}
                onChange={(e) => setGlobalConfig({ ...globalConfig, clientUrl: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="opal_api_key"
                value={globalConfig.apiKey}
                onChange={(e) => setGlobalConfig({ ...globalConfig, apiKey: e.target.value })}
              />
              <Button
                variant="outline"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? "Hide" : "Show"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="broadcastChannel">Broadcast Channel</Label>
              <Input
                id="broadcastChannel"
                value={globalConfig.broadcastChannel}
                onChange={(e) => setGlobalConfig({ ...globalConfig, broadcastChannel: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dataUpdateInterval">Data Update Interval (seconds)</Label>
              <Input
                id="dataUpdateInterval"
                type="number"
                min="1"
                value={globalConfig.dataUpdateInterval}
                onChange={(e) => setGlobalConfig({ ...globalConfig, dataUpdateInterval: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableStats">Enable Statistics</Label>
              <p className="text-sm text-muted-foreground">
                Collect and display OPAL sync statistics
              </p>
            </div>
            <Switch
              id="enableStats"
              checked={globalConfig.enableStatistics}
              onCheckedChange={(checked) => setGlobalConfig({ ...globalConfig, enableStatistics: checked })}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTestConnection} disabled={isTesting || !globalConfig.serverUrl}>
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button variant="outline" onClick={handleSaveGlobalConfig} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-Bouncer Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Bouncer-Specific Configuration
          </CardTitle>
          <CardDescription>
            Configure OPAL settings for individual bouncers (PEPs)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bouncerConfigs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No bouncers configured yet.</p>
              <Link to="/settings/peps">
                <Button variant="outline" className="mt-4">
                  Configure Bouncers
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bouncer Name</TableHead>
                    <TableHead>Cache</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Policy Filters</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bouncerConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          {config.bouncerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {config.cacheSettings.enabled ? (
                          <Badge variant="outline" className="bg-green-50">
                            <Database className="h-3 w-3 mr-1" />
                            {config.cacheSettings.ttl}s TTL
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Zap className="h-3 w-3 mr-1" />
                          {config.rateLimits.requestsPerSecond}/s
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {config.policyFilters.length > 0 ? (
                          <div className="flex gap-1">
                            {config.policyFilters.slice(0, 2).map((filter, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {filter}
                              </Badge>
                            ))}
                            {config.policyFilters.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{config.policyFilters.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">All policies</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Policy Filters:</strong> Limit which policies are sent to each bouncer.
                  Leave empty to receive all policies. <br />
                  <strong>Data Filters:</strong> Control which data sources this bouncer should receive.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OPAL Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>About OPAL</CardTitle>
          <CardDescription>Open Policy Administration Layer for policy distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            OPAL (Open Policy Administration Layer) keeps your policies and data in sync across all bouncers in real-time.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Automatically distributes policies from GitHub to all connected bouncers</li>
            <li>Pushes policy updates in real-time via pub/sub</li>
            <li>Maintains data consistency across distributed policy decision points</li>
            <li>Supports filtering to send specific policies to specific bouncers</li>
          </ul>
          <div className="mt-4">
            <a 
              href="https://docs.opal.ac" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Learn more about OPAL →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

