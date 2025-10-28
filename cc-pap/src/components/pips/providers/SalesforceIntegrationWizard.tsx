import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  CheckCircle, 
  ExternalLink, 
  Settings, 
  Users, 
  Building, 
  FileText,
  Shield,
  Clock,
  TestTube
} from "lucide-react";

interface SalesforceIntegrationWizardProps {
  config: {
    instanceUrl: string;
    apiVersion: string;
    authType: string;
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
    securityToken: string;
    selectedObjects: string[];
    selectedFields: Record<string, string[]>;
    syncFrequency: string;
    webhookEnabled: boolean;
  };
  onChange: (config: any) => void;
  onTest: () => void;
  isTesting: boolean;
  testResult: any;
}

export function SalesforceIntegrationWizard({ 
  config, 
  onChange, 
  onTest, 
  isTesting, 
  testResult 
}: SalesforceIntegrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const handleFieldChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleObjectToggle = (objectName: string, checked: boolean) => {
    const selectedObjects = checked 
      ? [...config.selectedObjects, objectName]
      : config.selectedObjects.filter(obj => obj !== objectName);
    
    onChange({
      ...config,
      selectedObjects
    });
  };

  const handleFieldToggle = (objectName: string, fieldName: string, checked: boolean) => {
    const selectedFields = { ...config.selectedFields };
    if (!selectedFields[objectName]) {
      selectedFields[objectName] = [];
    }
    
    if (checked) {
      selectedFields[objectName] = [...selectedFields[objectName], fieldName];
    } else {
      selectedFields[objectName] = selectedFields[objectName].filter(f => f !== fieldName);
    }
    
    onChange({
      ...config,
      selectedFields
    });
  };

  const salesforceObjects = [
    {
      name: "Account",
      description: "Customer accounts and organizations",
      fields: ["Id", "Name", "Type", "Industry", "AnnualRevenue", "NumberOfEmployees", "BillingAddress", "OwnerId"],
      icon: Building
    },
    {
      name: "Contact",
      description: "Individual people associated with accounts",
      fields: ["Id", "FirstName", "LastName", "Email", "Phone", "Title", "Department", "AccountId", "OwnerId"],
      icon: Users
    },
    {
      name: "Opportunity",
      description: "Sales opportunities and deals",
      fields: ["Id", "Name", "StageName", "Amount", "CloseDate", "Probability", "AccountId", "OwnerId"],
      icon: FileText
    },
    {
      name: "User",
      description: "Salesforce users and their profiles",
      fields: ["Id", "Username", "Email", "FirstName", "LastName", "ProfileId", "UserRoleId", "IsActive"],
      icon: Users
    },
    {
      name: "UserRole",
      description: "User roles and hierarchy",
      fields: ["Id", "Name", "ParentRoleId", "OpportunityAccessForAccountOwner", "CaseAccessForAccountOwner"],
      icon: Shield
    }
  ];

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 4 && (
              <div className={`w-12 h-0.5 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Authentication */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Salesforce Authentication
            </CardTitle>
            <CardDescription>
              Configure your Salesforce connection and authentication method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sf-instance-url">Salesforce Instance URL</Label>
              <Input 
                id="sf-instance-url"
                placeholder="https://your-instance.salesforce.com"
                value={config.instanceUrl}
                onChange={(e) => handleFieldChange('instanceUrl', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Your Salesforce instance URL (e.g., https://mycompany.salesforce.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sf-api-version">API Version</Label>
              <Select value={config.apiVersion} onValueChange={(value) => handleFieldChange('apiVersion', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select API version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v58.0">v58.0 (Latest)</SelectItem>
                  <SelectItem value="v57.0">v57.0</SelectItem>
                  <SelectItem value="v56.0">v56.0</SelectItem>
                  <SelectItem value="v55.0">v55.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sf-auth-type">Authentication Method</Label>
              <Select value={config.authType} onValueChange={(value) => handleFieldChange('authType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oauth">OAuth 2.0 (Recommended)</SelectItem>
                  <SelectItem value="basic">Username/Password + Security Token</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.authType === "oauth" && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium text-blue-900">OAuth 2.0 Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sf-client-id">Consumer Key (Client ID)</Label>
                    <Input 
                      id="sf-client-id"
                      placeholder="Your Salesforce Connected App Consumer Key"
                      value={config.clientId}
                      onChange={(e) => handleFieldChange('clientId', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sf-client-secret">Consumer Secret (Client Secret)</Label>
                    <Input 
                      id="sf-client-secret"
                      type="password"
                      placeholder="Your Salesforce Connected App Consumer Secret"
                      value={config.clientSecret}
                      onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
                    />
                  </div>
                </div>
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="space-y-2">
                      <p>Configure your Salesforce Connected App with:</p>
                      <div className="bg-blue-100 p-2 rounded text-sm">
                        <p><strong>Callback URL:</strong> <code className="bg-blue-200 px-1 rounded">http://localhost:8000/pip/oauth/callback/salesforce</code></p>
                        <p><strong>Selected OAuth Scopes:</strong> Full access (full), Perform requests on your behalf at any time (refresh_token, offline_access)</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {config.authType === "basic" && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900">Username/Password Authentication</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sf-username">Username</Label>
                    <Input 
                      id="sf-username"
                      placeholder="your-username@company.com"
                      value={config.username}
                      onChange={(e) => handleFieldChange('username', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sf-password">Password</Label>
                    <Input 
                      id="sf-password"
                      type="password"
                      placeholder="Your Salesforce password"
                      value={config.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sf-security-token">Security Token</Label>
                  <Input 
                    id="sf-security-token"
                    type="password"
                    placeholder="Your Salesforce security token"
                    value={config.securityToken}
                    onChange={(e) => handleFieldChange('securityToken', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Get your security token from: Setup → My Personal Information → Reset My Security Token
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)} disabled={!config.instanceUrl || !config.authType}>
                Next: Object Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Object Selection */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Select Salesforce Objects
            </CardTitle>
            <CardDescription>
              Choose which Salesforce objects to sync for policy context
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salesforceObjects.map((obj) => (
                <div key={obj.name} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`obj-${obj.name}`}
                      checked={config.selectedObjects.includes(obj.name)}
                      onCheckedChange={(checked) => handleObjectToggle(obj.name, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <obj.icon className="h-4 w-4 text-gray-600" />
                        <Label htmlFor={`obj-${obj.name}`} className="font-medium">
                          {obj.name}
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{obj.description}</p>
                      
                      {config.selectedObjects.includes(obj.name) && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Available Fields:</p>
                          <div className="grid grid-cols-2 gap-1">
                            {obj.fields.map((field) => (
                              <div key={field} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`field-${obj.name}-${field}`}
                                  checked={config.selectedFields[obj.name]?.includes(field) || false}
                                  onCheckedChange={(checked) => handleFieldToggle(obj.name, field, checked as boolean)}
                                />
                                <Label htmlFor={`field-${obj.name}-${field}`} className="text-xs">
                                  {field}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)} 
                disabled={config.selectedObjects.length === 0}
              >
                Next: Sync Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sync Configuration */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sync Configuration
            </CardTitle>
            <CardDescription>
              Configure how and when to sync data from Salesforce
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sf-sync-frequency">Sync Frequency</Label>
              <Select value={config.syncFrequency} onValueChange={(value) => handleFieldChange('syncFrequency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sync frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time (Webhooks)</SelectItem>
                  <SelectItem value="5min">Every 5 minutes</SelectItem>
                  <SelectItem value="15min">Every 15 minutes</SelectItem>
                  <SelectItem value="hourly">Every hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sf-webhook-enabled"
                checked={config.webhookEnabled}
                onCheckedChange={(checked) => handleFieldChange('webhookEnabled', checked)}
              />
              <Label htmlFor="sf-webhook-enabled">Enable real-time webhooks</Label>
            </div>

            {config.webhookEnabled && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p>Webhook URL for Salesforce:</p>
                    <div className="bg-green-100 p-2 rounded text-sm">
                      <code className="bg-green-200 px-1 rounded">http://localhost:8000/pip/webhooks/salesforce</code>
                    </div>
                    <p className="text-xs">
                      Configure this URL in Salesforce: Setup → Platform Events → Event Subscriptions
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep(4)}>
                Next: Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Test Connection */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Connection
            </CardTitle>
            <CardDescription>
              Test your Salesforce connection and verify object access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Connection Test</h4>
                  <p className="text-sm text-gray-600">Verify authentication and object access</p>
                </div>
                <Button 
                  onClick={onTest} 
                  disabled={isTesting}
                  className="flex items-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                    {testResult.success ? (
                      <div className="space-y-2">
                        <p>✅ Connection successful!</p>
                        <div className="bg-green-100 p-2 rounded text-sm">
                          <p><strong>Response Time:</strong> {testResult.responseTime}s</p>
                          <p><strong>Objects Available:</strong> {testResult.details?.objects_count || 'N/A'}</p>
                          <p><strong>API Version:</strong> {config.apiVersion}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p>❌ Connection failed</p>
                        <p className="text-sm">{testResult.error}</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Selected Objects Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {config.selectedObjects.map((objName) => (
                    <div key={objName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{objName}</span>
                      <Badge variant="outline" className="text-xs">
                        {config.selectedFields[objName]?.length || 0} fields
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://help.salesforce.com/s/articleView?id=sf.connected_app_overview.htm', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Salesforce Setup Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
