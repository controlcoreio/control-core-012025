import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface OAuthFieldsProps {
  config: {
    authUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scopes: string;
    callbackUrl?: string;
  };
  onChange: (config: any) => void;
  provider?: string;
  showEndpoint?: boolean;
  endpoint?: string;
  onEndpointChange?: (value: string) => void;
}

export function OAuthFields({ 
  config, 
  onChange, 
  provider = "generic",
  showEndpoint = false,
  endpoint = "",
  onEndpointChange
}: OAuthFieldsProps) {
  const handleFieldChange = (field: string, value: string) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background border-blue-200 dark:border-blue-800">
      <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200">OAuth 2.0 / OIDC Configuration</h5>
      
      <div className="space-y-4">
        {showEndpoint && (
          <div className="space-y-2">
            <Label htmlFor="oauth-endpoint" className="text-sm font-medium">API Base URL</Label>
            <Input 
              id="oauth-endpoint"
              placeholder="https://api.example.com/v1"
              value={endpoint}
              onChange={(e) => onEndpointChange?.(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Base URL for making authenticated API calls after OAuth flow completes
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="oauth-auth-url" className="text-sm font-medium">Authorization URL</Label>
          <Input 
            id="oauth-auth-url"
            placeholder="https://provider.com/oauth/authorize"
            value={config.authUrl}
            onChange={(e) => handleFieldChange('authUrl', e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="oauth-token-url" className="text-sm font-medium">Token URL</Label>
          <Input 
            id="oauth-token-url"
            placeholder="https://provider.com/oauth/token"
            value={config.tokenUrl}
            onChange={(e) => handleFieldChange('tokenUrl', e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="oauth-client-id" className="text-sm font-medium">Client ID</Label>
            <Input 
              id="oauth-client-id"
              placeholder="Your OAuth client ID"
              value={config.clientId}
              onChange={(e) => handleFieldChange('clientId', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oauth-client-secret" className="text-sm font-medium">Client Secret</Label>
            <Input 
              id="oauth-client-secret"
              type="password"
              placeholder="Your OAuth client secret"
              value={config.clientSecret}
              onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="oauth-scopes" className="text-sm font-medium">Scopes</Label>
          <Input 
            id="oauth-scopes"
            placeholder="openid profile email"
            value={config.scopes}
            onChange={(e) => handleFieldChange('scopes', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Space-separated list of OAuth scopes (e.g., "openid profile email")
          </p>
        </div>
        
        <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <div className="space-y-1">
              <p className="text-sm">Configure your OAuth application with:</p>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded text-xs">
                <p><strong>Callback URL:</strong> <code className="bg-blue-200 dark:bg-blue-800/50 px-1 rounded">http://localhost:8000/pip/oauth/callback/{provider}</code></p>
                <p><strong>Grant Types:</strong> Authorization Code, Refresh Token</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
