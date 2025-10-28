
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Users, Key, Settings, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SecureStorage } from "@/utils/secureStorage";
import { APP_CONFIG } from "@/config/app";

interface SSOStatus {
  configured: boolean;
  saml_configured: boolean;
  oidc_configured: boolean;
  providers: {
    saml: boolean;
    oidc: boolean;
  };
}

export default function SSOConfiguration() {
  const [ssoStatus, setSSOStatus] = useState<SSOStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ssoProvider, setSSOProvider] = useState("");
  
  useEffect(() => {
    const fetchSSOStatus = async () => {
      try {
        const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth/sso/status`);
        const data = await response.json();
        setSSOStatus(data);
      } catch (err) {
        console.error('Error fetching SSO status:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSSOStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* SSO Status Alert */}
      {isLoading ? (
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : ssoStatus?.configured ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            SSO is enabled. Users will be automatically provisioned based on your SSO configuration. Manual user creation is disabled.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            SSO is not configured. Users must be created manually in the Users tab or you can configure SSO below.
          </AlertDescription>
        </Alert>
      )}

      {/* SSO Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SSO Configuration Status
          </CardTitle>
          <CardDescription>
            Current SSO provider configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                <div>
                  <p className="font-medium">SAML 2.0</p>
                  <p className="text-sm text-muted-foreground">Enterprise SSO via SAML</p>
                </div>
              </div>
              <Badge variant={ssoStatus?.saml_configured ? "default" : "secondary"}>
                {ssoStatus?.saml_configured ? "Configured" : "Not Configured"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5" />
                <div>
                  <p className="font-medium">OIDC / OAuth 2.0</p>
                  <p className="text-sm text-muted-foreground">Modern SSO via OpenID Connect</p>
                </div>
              </div>
              <Badge variant={ssoStatus?.oidc_configured ? "default" : "secondary"}>
                {ssoStatus?.oidc_configured ? "Configured" : "Not Configured"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SSO Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Configured SSO Providers</CardTitle>
          <CardDescription>
            Manage your single sign-on integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ssoStatus?.configured ? (
            <div className="space-y-4">
              {ssoStatus.saml_configured && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">SAML 2.0 Provider</h3>
                      <p className="text-sm text-muted-foreground">Enterprise SSO via SAML</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="default">Active</Badge>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {ssoStatus.oidc_configured && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">OIDC Provider</h3>
                      <p className="text-sm text-muted-foreground">OpenID Connect SSO</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="default">Active</Badge>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No SSO providers configured</p>
              <p className="text-sm mt-2">Configure a provider below to enable SSO authentication</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SSO Configuration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Configure SSO Provider</CardTitle>
          <CardDescription>
            Set up single sign-on authentication for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              SSO configuration requires setting environment variables. Update your deployment configuration and restart the services to enable SSO.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                SAML 2.0 Configuration
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-muted-foreground">Required Environment Variables:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><code className="bg-muted px-1 py-0.5 rounded">SAML_ENTITY_ID</code> - Your entity identifier</li>
                  <li><code className="bg-muted px-1 py-0.5 rounded">SAML_SSO_URL</code> - Identity provider SSO URL</li>
                  <li><code className="bg-muted px-1 py-0.5 rounded">SAML_CERTIFICATE</code> - X.509 certificate</li>
                </ul>
              </div>
            </div>
            
            <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Key className="h-4 w-4" />
                OIDC / OAuth 2.0 Configuration
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-muted-foreground">Required Environment Variables:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><code className="bg-muted px-1 py-0.5 rounded">OIDC_CLIENT_ID</code> - OAuth client ID</li>
                  <li><code className="bg-muted px-1 py-0.5 rounded">OIDC_CLIENT_SECRET</code> - OAuth client secret</li>
                  <li><code className="bg-muted px-1 py-0.5 rounded">OIDC_ISSUER_URL</code> - OIDC issuer URL</li>
                  <li><code className="bg-muted px-1 py-0.5 rounded">OIDC_REDIRECT_URI</code> - Callback URL (optional)</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold">Configuration Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Set the required environment variables in your deployment configuration</li>
              <li>Restart the Control Core PAP API service</li>
              <li>Configure role mapping in your identity provider</li>
              <li>Test SSO authentication from the login page</li>
              <li>Monitor user provisioning in the Users tab</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Important
            </h4>
            <p className="text-sm text-muted-foreground">
              Once SSO is enabled, manual user creation will be disabled. Users will be automatically provisioned from your identity provider. The built-in Super Administrator (ccadmin) will always remain accessible as a fallback.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
