
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordChangeModal } from "@/components/auth/PasswordChangeModal";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'passkey' | 'magiclink' | 'sso'>('magiclink');
  const [isLoading, setIsLoading] = useState(false);
  const [ssoConfigured, setSsoConfigured] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const { login, loginWithPasskey, loginWithSSO, checkSSOConfiguration } = useAuth();
  const { theme } = useTheme();
  
  // Check if redirected due to session revocation
  useEffect(() => {
    const reason = searchParams.get('reason');
    const message = searchParams.get('message');
    
    if (message) {
      // Use the custom funny message if provided
      setError(message);
    } else if (reason === 'session_revoked') {
      setError('Your session was terminated by an administrator. Please log in again.');
    } else if (reason === 'session_expired') {
      setError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  // Check SSO configuration on component mount
  useEffect(() => {
    const checkSSO = async () => {
      try {
        const configured = await checkSSOConfiguration();
        setSsoConfigured(configured);
      } catch (error) {
        console.error('Failed to check SSO configuration:', error);
      }
    };

    checkSSO();
  }, [checkSSOConfiguration]);

  const handleSSOLogin = async () => {
    setError("");
    setIsLoading(true);
    
    try {
      await loginWithSSO();
    } catch (err) {
      setError("SSO authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const forcePasswordChange = await login(username, password);
      
      // Reset loading state first
      setIsLoading(false);
      
      if (forcePasswordChange) {
        // Show password change dialog
        setShowPasswordChange(true);
      }
    } catch (err) {
      setError("Invalid username or password. Please try again.");
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError("");
    setIsLoading(true);
    
    try {
      await loginWithPasskey();
      // Redirect to dashboard on success
      window.location.href = '/';
    } catch (err) {
      setError("Passkey authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth0/magic-link/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to send magic link');
      }

      setError("Magic link has been sent to your email address. Please check your inbox.");
    } catch (err) {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <img 
                src="/logo.png"
                alt="Control Core"
                className={cn(
                  "h-16 w-auto",
                  theme === 'dark' ? "brightness-0 invert" : ""
                )}
              />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your Control Core account
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Login Method Selection - Reordered */}
              <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLoginMethod('magiclink')}
                  className={cn(
                    "flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors",
                    loginMethod === 'magiclink' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Magic Link
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('passkey')}
                  className={cn(
                    "flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors",
                    loginMethod === 'passkey' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Passkey
                </button>
                {ssoConfigured && (
                  <button
                    type="button"
                    onClick={() => setLoginMethod('sso')}
                    className={cn(
                      "flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors",
                      loginMethod === 'sso' 
                        ? "bg-background shadow-sm text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    SSO
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLoginMethod('credentials')}
                  className={cn(
                    "flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors",
                    loginMethod === 'credentials' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Password
                </button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <EnterpriseIcon name="exclamation-triangle" size={16} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Magic Link Login - Now first */}
              {loginMethod === 'magiclink' && (
                <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <EnterpriseIcon name="share" size={16} className="mr-2" />
                    {isLoading ? "Sending..." : "Send Magic Link"}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    We'll send you a secure link to sign in without a password.
                  </p>
                </form>
              )}

              {/* Passkey Login - Now second */}
              {loginMethod === 'passkey' && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <EnterpriseIcon name="key" size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Sign in with your passkey</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Use your device's biometric authentication or security key to sign in securely.
                    </p>
                    <Button onClick={handlePasskeyLogin} className="w-full" disabled={isLoading}>
                      <EnterpriseIcon name="key" size={16} className="mr-2" />
                      {isLoading ? "Authenticating..." : "Use Passkey"}
                    </Button>
                  </div>
                </div>
              )}

              {/* SSO Login - Third */}
              {loginMethod === 'sso' && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <EnterpriseIcon name="shield" size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Sign in with SSO</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Use your organization's single sign-on to access Control Core.
                    </p>
                    <Button onClick={handleSSOLogin} className="w-full" disabled={isLoading}>
                      <EnterpriseIcon name="shield" size={16} className="mr-2" />
                      {isLoading ? "Redirecting..." : "Sign in with SSO"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Username/Password Login - Now last */}
              {loginMethod === 'credentials' && (
                <form onSubmit={handleCredentialLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <EnterpriseIcon 
                          name={showPassword ? "eye-slash" : "eye"} 
                          size={16}
                          className="text-muted-foreground"
                        />
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sign up link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        open={showPasswordChange}
        onOpenChange={setShowPasswordChange}
        currentPassword={password}
        isAdminChange={false}
        onSuccess={() => window.location.href = '/'}
      />
    </div>
  );
}
