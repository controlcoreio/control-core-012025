import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, RefreshCw, Info, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SecureStorage } from "@/utils/secureStorage";
import { APP_CONFIG } from "@/config/app";

interface BouncerOPALConfigProps {
  pepId: number;
  bouncerId: string;
  environment: string;
}

interface OPALConfig {
  bouncer_id: string;
  environment: string;
  cache_enabled: boolean;
  cache_ttl: number;
  cache_max_size: string;
  rate_limit_rps: number;
  rate_limit_burst: number;
  auto_configured: boolean;
  resource_name: string;
}

export function BouncerOPALConfig({ pepId, bouncerId, environment }: BouncerOPALConfigProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<OPALConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getAuthHeaders = () => {
    const token = SecureStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    loadConfig();
  }, [pepId]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${APP_CONFIG.api.baseUrl}/peps/${pepId}/opal-config`,
        {
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        throw new Error('Failed to load OPAL configuration');
      }
    } catch (error) {
      console.error('Error loading OPAL config:', error);
      toast({
        title: "Error",
        description: "Failed to load OPAL configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `${APP_CONFIG.api.baseUrl}/peps/${pepId}/opal-config`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            cache_enabled: config.cache_enabled,
            cache_ttl: config.cache_ttl,
            cache_max_size: config.cache_max_size,
            rate_limit_rps: config.rate_limit_rps,
            rate_limit_burst: config.rate_limit_burst
          })
        }
      );

      if (response.ok) {
        await loadConfig();
        setIsEditing(false);
        toast({
          title: "Success",
          description: "OPAL configuration updated successfully"
        });
      } else {
        throw new Error('Failed to update OPAL configuration');
      }
    } catch (error) {
      console.error('Error saving OPAL config:', error);
      toast({
        title: "Error",
        description: "Failed to update OPAL configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    loadConfig();
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            OPAL Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            OPAL Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No OPAL configuration found for this bouncer.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              OPAL Configuration
            </CardTitle>
            <CardDescription>
              Configure policy distribution and caching settings for this bouncer
            </CardDescription>
          </div>
          {config.auto_configured && !isEditing && (
            <Badge variant="secondary">Auto-Configured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            These settings control how this bouncer receives and caches policies. 
            Auto-configured values are optimized for typical usage but can be customized if needed.
          </AlertDescription>
        </Alert>

        {/* Cache Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Cache Settings</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cache_enabled">Enable Caching</Label>
              <p className="text-sm text-muted-foreground">
                Cache policy evaluation results for improved performance
              </p>
            </div>
            <Switch
              id="cache_enabled"
              checked={config.cache_enabled}
              onCheckedChange={(checked) => {
                setConfig({ ...config, cache_enabled: checked });
                setIsEditing(true);
              }}
            />
          </div>

          {config.cache_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cache_ttl">Cache TTL (seconds)</Label>
                <Input
                  id="cache_ttl"
                  type="number"
                  min="1"
                  max="3600"
                  value={config.cache_ttl}
                  onChange={(e) => {
                    setConfig({ ...config, cache_ttl: parseInt(e.target.value) || 300 });
                    setIsEditing(true);
                  }}
                  disabled={!config.cache_enabled}
                />
                <p className="text-xs text-muted-foreground">
                  How long to cache policy evaluations (1-3600 seconds)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cache_max_size">Cache Max Size</Label>
                <Input
                  id="cache_max_size"
                  type="text"
                  value={config.cache_max_size}
                  onChange={(e) => {
                    setConfig({ ...config, cache_max_size: e.target.value });
                    setIsEditing(true);
                  }}
                  placeholder="100MB"
                  disabled={!config.cache_enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum cache size (e.g., 100MB, 1GB)
                </p>
              </div>
            </>
          )}
        </div>

        {/* Rate Limiting */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Rate Limiting</h3>
          
          <div className="space-y-2">
            <Label htmlFor="rate_limit_rps">Requests Per Second</Label>
            <Input
              id="rate_limit_rps"
              type="number"
              min="1"
              max="10000"
              value={config.rate_limit_rps}
              onChange={(e) => {
                setConfig({ ...config, rate_limit_rps: parseInt(e.target.value) || 100 });
                setIsEditing(true);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Maximum policy evaluations per second
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate_limit_burst">Burst Size</Label>
            <Input
              id="rate_limit_burst"
              type="number"
              min="1"
              max="20000"
              value={config.rate_limit_burst}
              onChange={(e) => {
                setConfig({ ...config, rate_limit_burst: parseInt(e.target.value) || 200 });
                setIsEditing(true);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Maximum burst capacity for handling traffic spikes
            </p>
          </div>
        </div>

        {/* Environment Info */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Environment:</span>
              <span className="ml-2 font-medium">{config.environment}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Resource:</span>
              <span className="ml-2 font-medium">{config.resource_name}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

