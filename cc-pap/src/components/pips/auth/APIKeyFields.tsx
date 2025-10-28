import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, AlertCircle } from "lucide-react";

interface APIKeyFieldsProps {
  apiKey: string;
  onChange: (value: string) => void;
  endpoint?: string;
  onEndpointChange?: (value: string) => void;
  showEndpoint?: boolean;
  authMethod?: "api-key" | "bearer-token";
  keyLabel?: string;
  keyPlaceholder?: string;
  endpointLabel?: string;
  endpointPlaceholder?: string;
}

export function APIKeyFields({ 
  apiKey, 
  onChange,
  endpoint = "",
  onEndpointChange,
  showEndpoint = true,
  authMethod = "api-key",
  keyLabel,
  keyPlaceholder,
  endpointLabel,
  endpointPlaceholder
}: APIKeyFieldsProps) {
  // Set defaults based on auth method
  const defaultKeyLabel = authMethod === "bearer-token" ? "Bearer Token" : "API Key";
  const defaultKeyPlaceholder = authMethod === "bearer-token" 
    ? "Enter your bearer token" 
    : "Enter your API key";
  const defaultEndpointLabel = "API Base URL";
  const defaultEndpointPlaceholder = "https://api.example.com/v1";
  
  const configTitle = authMethod === "bearer-token" 
    ? "Bearer Token Configuration" 
    : "API Key Configuration";
  
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white border-green-200">
      <h5 className="text-sm font-semibold text-green-800 flex items-center gap-2">
        <Key className="h-4 w-4" />
        {configTitle}
      </h5>
      
      <div className="space-y-4">
        {showEndpoint && (
          <div className="space-y-2">
            <Label htmlFor="apikey-endpoint" className="text-sm font-medium">
              {endpointLabel || defaultEndpointLabel}
            </Label>
            <Input 
              id="apikey-endpoint"
              placeholder={endpointPlaceholder || defaultEndpointPlaceholder}
              value={endpoint}
              onChange={(e) => onEndpointChange?.(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              The base URL for making API requests to this data source
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="apikey-key" className="text-sm font-medium">
            {keyLabel || defaultKeyLabel}
          </Label>
          <Input 
            id="apikey-key"
            type="password"
            placeholder={keyPlaceholder || defaultKeyPlaceholder}
            value={apiKey}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Your {authMethod === "bearer-token" ? "token" : "API key"} will be encrypted and stored securely
          </p>
        </div>
        
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <p className="text-sm">
              <strong>Security Note:</strong> {authMethod === "bearer-token" ? "Bearer tokens" : "API keys"} provide direct access to your data. 
              Consider using OAuth 2.0 for production environments when available.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
