import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCheck, AlertCircle } from "lucide-react";

interface BasicAuthFieldsProps {
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  endpoint?: string;
  onEndpointChange?: (value: string) => void;
  loginUrl?: string;
  onLoginUrlChange?: (value: string) => void;
  showEndpoint?: boolean;
  showLoginUrl?: boolean;
  usernameLabel?: string;
  passwordLabel?: string;
  usernamePlaceholder?: string;
  passwordPlaceholder?: string;
  endpointLabel?: string;
  loginUrlLabel?: string;
}

export function BasicAuthFields({ 
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  endpoint = "",
  onEndpointChange,
  loginUrl = "",
  onLoginUrlChange,
  showEndpoint = true,
  showLoginUrl = true,
  usernameLabel = "Username",
  passwordLabel = "Password",
  usernamePlaceholder = "Enter your username",
  passwordPlaceholder = "Enter your password",
  endpointLabel = "API Base URL",
  loginUrlLabel = "Login URL"
}: BasicAuthFieldsProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background border-gray-200 dark:border-gray-700">
      <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <UserCheck className="h-4 w-4" />
        Username/Password Configuration
      </h5>
      
      <div className="space-y-4">
        {showLoginUrl && (
          <div className="space-y-2">
            <Label htmlFor="basic-login-url" className="text-sm font-medium">{loginUrlLabel}</Label>
            <Input 
              id="basic-login-url"
              placeholder="https://api.example.com/auth/login"
              value={loginUrl}
              onChange={(e) => onLoginUrlChange?.(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The authentication endpoint where credentials are validated
            </p>
          </div>
        )}
        
        {showEndpoint && (
          <div className="space-y-2">
            <Label htmlFor="basic-endpoint" className="text-sm font-medium">{endpointLabel}</Label>
            <Input 
              id="basic-endpoint"
              placeholder="https://api.example.com/v1"
              value={endpoint}
              onChange={(e) => onEndpointChange?.(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The base URL for making authenticated API requests after login (optional if same as login URL)
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="basic-username" className="text-sm font-medium">{usernameLabel}</Label>
            <Input 
              id="basic-username"
              placeholder={usernamePlaceholder}
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="w-full"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="basic-password" className="text-sm font-medium">{passwordLabel}</Label>
            <Input 
              id="basic-password"
              type="password"
              placeholder={passwordPlaceholder}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full"
              autoComplete="current-password"
            />
          </div>
        </div>
        
        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <p className="text-sm">
              <strong>Security Note:</strong> Credentials will be encrypted and stored securely. 
              Consider using OAuth 2.0 for enhanced security in production environments.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
