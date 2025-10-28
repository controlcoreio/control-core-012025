
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Key, Fingerprint, Settings, Clock, Shield, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { SecureStorage } from "@/utils/secureStorage";
import { APP_CONFIG } from "@/config/app";

interface AuthMethodStats {
  total_users: number;
  password_auth: {
    total: number;
    percentage: number;
  };
  mfa: {
    enabled: number;
    percentage: number;
  };
  sso: {
    saml: number;
    oidc: number;
    total: number;
    percentage: number;
  };
  passkeys: {
    total: number;
    users_with_passkeys: number;
  };
}

export default function AuthenticationMethods() {
  const [stats, setStats] = useState<AuthMethodStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [magicLinkEnabled, setMagicLinkEnabled] = useState(true);
  const [passkeyEnabled, setPasskeyEnabled] = useState(true);
  const [passwordEnabled, setPasswordEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("4");
  
  const canDisablePassword = () => {
    // Can't disable password if it's the only method
    if (!stats) return false;
    
    const hasSSO = (stats.sso.total || 0) > 0;
    const hasPasskeys = (stats.passkeys.total || 0) > 0;
    const hasMagicLink = magicLinkEnabled;
    
    // Must have at least one other method enabled
    return hasSSO || hasPasskeys || hasMagicLink;
  };
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = SecureStorage.getItem('access_token');
        const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth/auth-methods/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching auth method stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Authentication Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.total_users}</div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Password Auth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.password_auth.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.password_auth.percentage}% of users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>MFA Enabled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.mfa.enabled}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.mfa.percentage}% of users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Passkeys</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.passkeys.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered passkeys
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Authentication Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Methods</CardTitle>
          <CardDescription>
            Configure which authentication methods are available to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Magic Link */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium">Magic Link</h3>
                <p className="text-sm text-muted-foreground">
                  Passwordless authentication via email links
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={magicLinkEnabled ? "default" : "secondary"}>
                {magicLinkEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Switch
                checked={magicLinkEnabled}
                onCheckedChange={setMagicLinkEnabled}
              />
            </div>
          </div>

          {/* Passkey */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Fingerprint className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium">Passkey</h3>
                <p className="text-sm text-muted-foreground">
                  WebAuthn-based biometric and device authentication
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={passkeyEnabled ? "default" : "secondary"}>
                {passkeyEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Switch
                checked={passkeyEnabled}
                onCheckedChange={setPasskeyEnabled}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">
                  Traditional username and password authentication
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={passwordEnabled ? "default" : "secondary"}>
                {passwordEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Switch
                checked={passwordEnabled}
                onCheckedChange={setPasswordEnabled}
                disabled={!canDisablePassword()}
                title={!canDisablePassword() ? "Cannot disable - only authentication method available" : ""}
              />
            </div>
          </div>
          
          {/* Warning when password is the only method */}
          {!canDisablePassword() && passwordEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Password authentication cannot be disabled as it is the only available authentication method. 
                Enable at least one other method (Magic Link, Passkey, or SSO) before disabling password authentication.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Magic Link Configuration */}
      {magicLinkEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Magic Link Settings
            </CardTitle>
            <CardDescription>
              Configure magic link authentication behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-expiry">Link Expiration Time</Label>
              <Select defaultValue="15">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-template">Email Template</Label>
              <Textarea
                id="email-template"
                placeholder="Customize your magic link email template..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirect-url">Success Redirect URL</Label>
              <Input
                id="redirect-url"
                placeholder="https://your-app.com/dashboard"
                defaultValue="/dashboard"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passkey Configuration */}
      {passkeyEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Passkey Settings
            </CardTitle>
            <CardDescription>
              Configure WebAuthn passkey authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authenticator-attachment">Authenticator Type</Label>
              <Select defaultValue="cross-platform">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Platform (built-in biometrics)</SelectItem>
                  <SelectItem value="cross-platform">Cross-platform (external devices)</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-verification">User Verification</Label>
              <Select defaultValue="preferred">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="preferred">Preferred</SelectItem>
                  <SelectItem value="discouraged">Discouraged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Configure user session behavior and security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
            <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="concurrent-sessions">Allow Concurrent Sessions</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to be logged in from multiple devices
              </p>
            </div>
            <Switch id="concurrent-sessions" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="remember-device">Remember Device</Label>
              <p className="text-sm text-muted-foreground">
                Skip MFA for trusted devices for 30 days
              </p>
            </div>
            <Switch id="remember-device" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
