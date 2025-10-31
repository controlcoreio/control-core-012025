import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OktaOAuthFieldsProps {
  config: {
    authUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scopes: string;
    callbackUrl: string;
  };
  onChange: (config: any) => void;
  tenantUrl: string;
}

export function OktaOAuthFields({ config, onChange, tenantUrl }: OktaOAuthFieldsProps) {
  const handleFieldChange = (field: string, value: string) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  // Auto-populate URLs based on tenant URL
  React.useEffect(() => {
    if (tenantUrl && !config.authUrl && !config.tokenUrl) {
      const baseUrl = tenantUrl.replace(/\/$/, '');
      onChange({
        ...config,
        authUrl: `${baseUrl}/oauth2/default/v1/authorize`,
        tokenUrl: `${baseUrl}/oauth2/default/v1/token`
      });
    }
  }, [tenantUrl, config, onChange]);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background border-blue-200 dark:border-blue-800">
      <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Okta OAuth 2.0 Configuration</h5>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="okta-domain" className="text-sm font-medium">Okta Domain</Label>
          <Input 
            id="okta-domain" 
            placeholder="your-domain.okta.com"
            value={tenantUrl}
            onChange={(e) => {
              const domain = e.target.value;
              const baseUrl = domain.startsWith('https://') ? domain : `https://${domain}`;
              onChange({
                ...config,
                authUrl: `${baseUrl}/oauth2/default/v1/authorize`,
                tokenUrl: `${baseUrl}/oauth2/default/v1/token`
              });
            }}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="okta-auth-url" className="text-sm font-medium">Authorization URL</Label>
          <Input 
            id="okta-auth-url" 
            placeholder="https://your-domain.okta.com/oauth2/default/v1/authorize"
            value={config.authUrl}
            onChange={(e) => handleFieldChange('authUrl', e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="okta-token-url" className="text-sm font-medium">Token URL</Label>
          <Input 
            id="okta-token-url" 
            placeholder="https://your-domain.okta.com/oauth2/default/v1/token"
            value={config.tokenUrl}
            onChange={(e) => handleFieldChange('tokenUrl', e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="okta-client-id" className="text-sm font-medium">Client ID</Label>
            <Input 
              id="okta-client-id" 
              placeholder="Your Okta OAuth client ID"
              value={config.clientId}
              onChange={(e) => handleFieldChange('clientId', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="okta-client-secret" className="text-sm font-medium">Client Secret</Label>
            <Input 
              id="okta-client-secret" 
              type="password"
              placeholder="Your Okta OAuth client secret"
              value={config.clientSecret}
              onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="okta-scopes" className="text-sm font-medium">Scopes</Label>
          <Input 
            id="okta-scopes" 
            placeholder="openid profile email groups"
            value={config.scopes}
            onChange={(e) => handleFieldChange('scopes', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Required scopes: openid, profile, email. Optional: groups, admin
          </p>
        </div>
        
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p>Configure your Okta OAuth application with:</p>
              <div className="bg-blue-100 p-2 rounded text-sm">
                <p><strong>Redirect URI:</strong> <code className="bg-blue-200 px-1 rounded">http://localhost:8000/pip/oauth/callback/okta</code></p>
                <p><strong>Grant Types:</strong> Authorization Code, Refresh Token</p>
                <p><strong>Response Types:</strong> Code</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.open('https://developer.okta.com/docs/guides/implement-oauth-for-okta/main/', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Okta OAuth Setup Guide
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
