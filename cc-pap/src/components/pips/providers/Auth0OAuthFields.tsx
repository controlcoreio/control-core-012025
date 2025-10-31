import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Auth0OAuthFieldsProps {
  config: {
    authUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scopes: string;
    callbackUrl: string;
  };
  onChange: (config: any) => void;
  domain: string;
}

export function Auth0OAuthFields({ config, onChange, domain }: Auth0OAuthFieldsProps) {
  const handleFieldChange = (field: string, value: string) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  // Auto-populate URLs based on domain
  React.useEffect(() => {
    if (domain && !config.authUrl && !config.tokenUrl) {
      const baseUrl = domain.startsWith('https://') ? domain : `https://${domain}`;
      onChange({
        ...config,
        authUrl: `${baseUrl}/authorize`,
        tokenUrl: `${baseUrl}/oauth/token`
      });
    }
  }, [domain, config, onChange]);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background border-blue-200 dark:border-blue-800">
      <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Auth0 OAuth 2.0 Configuration</h5>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="auth0-domain" className="text-sm font-medium">Auth0 Domain</Label>
          <Input 
            id="auth0-domain" 
            placeholder="your-domain.auth0.com"
            value={domain}
            onChange={(e) => {
              const domainValue = e.target.value;
              const baseUrl = domainValue.startsWith('https://') ? domainValue : `https://${domainValue}`;
              onChange({
                ...config,
                authUrl: `${baseUrl}/authorize`,
                tokenUrl: `${baseUrl}/oauth/token`
              });
            }}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="auth0-auth-url" className="text-sm font-medium">Authorization URL</Label>
          <Input 
            id="auth0-auth-url" 
            placeholder="https://your-domain.auth0.com/authorize"
            value={config.authUrl}
            onChange={(e) => handleFieldChange('authUrl', e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="auth0-token-url" className="text-sm font-medium">Token URL</Label>
          <Input 
            id="auth0-token-url" 
            placeholder="https://your-domain.auth0.com/oauth/token"
            value={config.tokenUrl}
            onChange={(e) => handleFieldChange('tokenUrl', e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="auth0-client-id" className="text-sm font-medium">Client ID</Label>
            <Input 
              id="auth0-client-id" 
              placeholder="Your Auth0 application client ID"
              value={config.clientId}
              onChange={(e) => handleFieldChange('clientId', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth0-client-secret" className="text-sm font-medium">Client Secret</Label>
            <Input 
              id="auth0-client-secret" 
              type="password"
              placeholder="Your Auth0 application client secret"
              value={config.clientSecret}
              onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="auth0-scopes" className="text-sm font-medium">Scopes</Label>
          <Input 
            id="auth0-scopes" 
            placeholder="openid profile email read:users read:groups"
            value={config.scopes}
            onChange={(e) => handleFieldChange('scopes', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Required: openid, profile, email. Optional: read:users, read:groups, admin
          </p>
        </div>
        
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p>Configure your Auth0 application with:</p>
              <div className="bg-blue-100 p-2 rounded text-sm">
                <p><strong>Allowed Callback URLs:</strong> <code className="bg-blue-200 px-1 rounded">http://localhost:8000/pip/oauth/callback/auth0</code></p>
                <p><strong>Application Type:</strong> Regular Web Application</p>
                <p><strong>Token Endpoint Auth Method:</strong> POST</p>
                <p><strong>Grant Types:</strong> Authorization Code, Refresh Token</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.open('https://auth0.com/docs/get-started/applications', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Auth0 Application Setup Guide
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
