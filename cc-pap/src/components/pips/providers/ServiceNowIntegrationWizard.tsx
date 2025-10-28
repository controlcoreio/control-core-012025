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
  TestTube,
  Database
} from "lucide-react";

interface ServiceNowIntegrationWizardProps {
  config: {
    instanceUrl: string;
    username: string;
    password: string;
    authType: string;
    clientId: string;
    clientSecret: string;
    selectedTables: string[];
    selectedFields: Record<string, string[]>;
    syncFrequency: string;
    webhookEnabled: boolean;
  };
  onChange: (config: any) => void;
  onTest: () => void;
  isTesting: boolean;
  testResult: any;
}

export function ServiceNowIntegrationWizard({ 
  config, 
  onChange, 
  onTest, 
  isTesting, 
  testResult 
}: ServiceNowIntegrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const handleFieldChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleTableToggle = (tableName: string, checked: boolean) => {
    const selectedTables = checked 
      ? [...config.selectedTables, tableName]
      : config.selectedTables.filter(table => table !== tableName);
    
    onChange({
      ...config,
      selectedTables
    });
  };

  const handleFieldToggle = (tableName: string, fieldName: string, checked: boolean) => {
    const selectedFields = { ...config.selectedFields };
    if (!selectedFields[tableName]) {
      selectedFields[tableName] = [];
    }
    
    if (checked) {
      selectedFields[tableName] = [...selectedFields[tableName], fieldName];
    } else {
      selectedFields[tableName] = selectedFields[tableName].filter(f => f !== fieldName);
    }
    
    onChange({
      ...config,
      selectedFields
    });
  };

  const serviceNowTables = [
    {
      name: "sys_user",
      description: "ServiceNow users and their profiles",
      fields: ["sys_id", "user_name", "first_name", "last_name", "email", "active", "department", "manager", "location"],
      icon: Users
    },
    {
      name: "sys_user_group",
      description: "User groups and roles",
      fields: ["sys_id", "name", "description", "active", "manager", "parent"],
      icon: Users
    },
    {
      name: "incident",
      description: "IT incidents and tickets",
      fields: ["sys_id", "number", "short_description", "priority", "urgency", "state", "assigned_to", "caller_id", "category"],
      icon: FileText
    },
    {
      name: "cmdb_ci",
      description: "Configuration items and assets",
      fields: ["sys_id", "name", "class_name", "operational_status", "install_status", "owned_by", "managed_by"],
      icon: Database
    },
    {
      name: "cmdb_ci_server",
      description: "Server configuration items",
      fields: ["sys_id", "name", "ip_address", "fqdn", "os", "os_version", "cpu_count", "ram", "disk_space"],
      icon: Server
    },
    {
      name: "cmdb_ci_service",
      description: "Service configuration items",
      fields: ["sys_id", "name", "service_classification", "business_service", "operational_status", "business_owner"],
      icon: Settings
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
              ServiceNow Authentication
            </CardTitle>
            <CardDescription>
              Configure your ServiceNow instance connection and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sn-instance-url">ServiceNow Instance URL</Label>
              <Input 
                id="sn-instance-url"
                placeholder="https://your-instance.service-now.com"
                value={config.instanceUrl}
                onChange={(e) => handleFieldChange('instanceUrl', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Your ServiceNow instance URL (e.g., https://mycompany.service-now.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sn-auth-type">Authentication Method</Label>
              <Select value={config.authType} onValueChange={(value) => handleFieldChange('authType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oauth">OAuth 2.0 (Recommended)</SelectItem>
                  <SelectItem value="basic">Username/Password</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.authType === "oauth" && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium text-blue-900">OAuth 2.0 Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sn-client-id">Client ID</Label>
                    <Input 
                      id="sn-client-id"
                      placeholder="Your ServiceNow OAuth client ID"
                      value={config.clientId}
                      onChange={(e) => handleFieldChange('clientId', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sn-client-secret">Client Secret</Label>
                    <Input 
                      id="sn-client-secret"
                      type="password"
                      placeholder="Your ServiceNow OAuth client secret"
                      value={config.clientSecret}
                      onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
                    />
                  </div>
                </div>
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="space-y-2">
                      <p>Configure your ServiceNow OAuth application with:</p>
                      <div className="bg-blue-100 p-2 rounded text-sm">
                        <p><strong>Redirect URL:</strong> <code className="bg-blue-200 px-1 rounded">http://localhost:8000/pip/oauth/callback/servicenow</code></p>
                        <p><strong>Grant Types:</strong> Authorization Code, Refresh Token</p>
                        <p><strong>Scopes:</strong> useraccount, useraccount:read</p>
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
                    <Label htmlFor="sn-username">Username</Label>
                    <Input 
                      id="sn-username"
                      placeholder="admin"
                      value={config.username}
                      onChange={(e) => handleFieldChange('username', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sn-password">Password</Label>
                    <Input 
                      id="sn-password"
                      type="password"
                      placeholder="Your ServiceNow password"
                      value={config.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                    />
                  </div>
                </div>
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <p className="text-sm">
                      <strong>Security Note:</strong> Use OAuth 2.0 for production environments. 
                      Username/Password authentication is less secure and may be disabled by your ServiceNow administrator.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)} disabled={!config.instanceUrl || !config.authType}>
                Next: Table Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Table Selection */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Select ServiceNow Tables
            </CardTitle>
            <CardDescription>
              Choose which ServiceNow tables to sync for policy context
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="core" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="core">Core Tables</TabsTrigger>
                <TabsTrigger value="cmdb">CMDB Tables</TabsTrigger>
                <TabsTrigger value="custom">Custom Tables</TabsTrigger>
              </TabsList>
              
              <TabsContent value="core" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serviceNowTables.slice(0, 3).map((table) => (
                    <div key={table.name} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`table-${table.name}`}
                          checked={config.selectedTables.includes(table.name)}
                          onCheckedChange={(checked) => handleTableToggle(table.name, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <table.icon className="h-4 w-4 text-gray-600" />
                            <Label htmlFor={`table-${table.name}`} className="font-medium">
                              {table.name}
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{table.description}</p>
                          
                          {config.selectedTables.includes(table.name) && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700">Available Fields:</p>
                              <div className="grid grid-cols-2 gap-1">
                                {table.fields.map((field) => (
                                  <div key={field} className="flex items-center space-x-1">
                                    <Checkbox
                                      id={`field-${table.name}-${field}`}
                                      checked={config.selectedFields[table.name]?.includes(field) || false}
                                      onCheckedChange={(checked) => handleFieldToggle(table.name, field, checked as boolean)}
                                    />
                                    <Label htmlFor={`field-${table.name}-${field}`} className="text-xs">
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
              </TabsContent>
              
              <TabsContent value="cmdb" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serviceNowTables.slice(3).map((table) => (
                    <div key={table.name} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`table-${table.name}`}
                          checked={config.selectedTables.includes(table.name)}
                          onCheckedChange={(checked) => handleTableToggle(table.name, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <table.icon className="h-4 w-4 text-gray-600" />
                            <Label htmlFor={`table-${table.name}`} className="font-medium">
                              {table.name}
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{table.description}</p>
                          
                          {config.selectedTables.includes(table.name) && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700">Available Fields:</p>
                              <div className="grid grid-cols-2 gap-1">
                                {table.fields.map((field) => (
                                  <div key={field} className="flex items-center space-x-1">
                                    <Checkbox
                                      id={`field-${table.name}-${field}`}
                                      checked={config.selectedFields[table.name]?.includes(field) || false}
                                      onCheckedChange={(checked) => handleFieldToggle(table.name, field, checked as boolean)}
                                    />
                                    <Label htmlFor={`field-${table.name}-${field}`} className="text-xs">
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
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <p>Custom tables will be discovered automatically after connection testing. 
                    You can select additional tables from your ServiceNow instance.</p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)} 
                disabled={config.selectedTables.length === 0}
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
              Configure how and when to sync data from ServiceNow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sn-sync-frequency">Sync Frequency</Label>
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
                id="sn-webhook-enabled"
                checked={config.webhookEnabled}
                onCheckedChange={(checked) => handleFieldChange('webhookEnabled', checked)}
              />
              <Label htmlFor="sn-webhook-enabled">Enable real-time webhooks</Label>
            </div>

            {config.webhookEnabled && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p>Webhook URL for ServiceNow:</p>
                    <div className="bg-green-100 p-2 rounded text-sm">
                      <code className="bg-green-200 px-1 rounded">http://localhost:8000/pip/webhooks/servicenow</code>
                    </div>
                    <p className="text-xs">
                      Configure this URL in ServiceNow: System Web Services → Outbound → REST Message
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
              Test your ServiceNow connection and verify table access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Connection Test</h4>
                  <p className="text-sm text-gray-600">Verify authentication and table access</p>
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
                          <p><strong>Tables Available:</strong> {testResult.details?.tables_count || 'N/A'}</p>
                          <p><strong>Instance:</strong> {config.instanceUrl}</p>
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
                <h4 className="font-medium">Selected Tables Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {config.selectedTables.map((tableName) => (
                    <div key={tableName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{tableName}</span>
                      <Badge variant="outline" className="text-xs">
                        {config.selectedFields[tableName]?.length || 0} fields
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
                  onClick={() => window.open('https://docs.servicenow.com/bundle/utah-platform-security/page/administer/security/concept/c_OAuthApplications.html', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  ServiceNow OAuth Setup Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
