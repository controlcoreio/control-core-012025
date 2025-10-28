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
  Shield,
  Clock,
  TestTube,
  UserCheck,
  Briefcase,
  GraduationCap
} from "lucide-react";

interface HRIntegrationWizardProps {
  config: {
    provider: string;
    instanceUrl: string;
    apiVersion: string;
    authType: string;
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
    selectedModules: string[];
    selectedFields: Record<string, string[]>;
    syncFrequency: string;
    webhookEnabled: boolean;
  };
  onChange: (config: any) => void;
  onTest: () => void;
  isTesting: boolean;
  testResult: any;
}

export function HRIntegrationWizard({ 
  config, 
  onChange, 
  onTest, 
  isTesting, 
  testResult 
}: HRIntegrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const handleFieldChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleModuleToggle = (moduleName: string, checked: boolean) => {
    const selectedModules = checked 
      ? [...config.selectedModules, moduleName]
      : config.selectedModules.filter(module => module !== moduleName);
    
    onChange({
      ...config,
      selectedModules
    });
  };

  const handleFieldToggle = (moduleName: string, fieldName: string, checked: boolean) => {
    const selectedFields = { ...config.selectedFields };
    if (!selectedFields[moduleName]) {
      selectedFields[moduleName] = [];
    }
    
    if (checked) {
      selectedFields[moduleName] = [...selectedFields[moduleName], fieldName];
    } else {
      selectedFields[moduleName] = selectedFields[moduleName].filter(f => f !== fieldName);
    }
    
    onChange({
      ...config,
      selectedFields
    });
  };

  const hrProviders = [
    {
      id: "workday",
      name: "Workday",
      description: "Enterprise HR and financial management",
      icon: "💼",
      authTypes: ["oauth", "basic"],
      apiVersions: ["v40.0", "v39.0", "v38.0"]
    },
    {
      id: "bamboohr",
      name: "BambooHR",
      description: "HR software for small to medium businesses",
      icon: "🎋",
      authTypes: ["api_key", "oauth"],
      apiVersions: ["v1"]
    },
    {
      id: "adp",
      name: "ADP Workforce Now",
      description: "Comprehensive HR and payroll solution",
      icon: "🏢",
      authTypes: ["oauth", "basic"],
      apiVersions: ["v1"]
    },
    {
      id: "successfactors",
      name: "SAP SuccessFactors",
      description: "Cloud-based HR management suite",
      icon: "☁️",
      authTypes: ["oauth", "basic"],
      apiVersions: ["v2", "v1"]
    },
    {
      id: "greenhouse",
      name: "Greenhouse",
      description: "Recruiting and applicant tracking system",
      icon: "🌱",
      authTypes: ["api_key", "oauth"],
      apiVersions: ["v1"]
    }
  ];

  const currentProvider = hrProviders.find(p => p.id === config.provider);

  const hrModules = [
    {
      name: "employees",
      description: "Employee profiles and personal information",
      fields: ["employee_id", "first_name", "last_name", "email", "phone", "hire_date", "department", "job_title", "manager", "location", "employment_status"],
      icon: Users
    },
    {
      name: "departments",
      description: "Organizational structure and departments",
      fields: ["department_id", "name", "description", "manager", "parent_department", "cost_center", "location"],
      icon: Building
    },
    {
      name: "positions",
      description: "Job positions and roles",
      fields: ["position_id", "title", "description", "department", "level", "salary_range", "requirements", "reports_to"],
      icon: Briefcase
    },
    {
      name: "compensation",
      description: "Salary and compensation data",
      fields: ["employee_id", "salary", "bonus", "equity", "benefits", "effective_date", "review_date"],
      icon: "💰"
    },
    {
      name: "performance",
      description: "Performance reviews and ratings",
      fields: ["employee_id", "review_period", "overall_rating", "goals", "achievements", "development_plans", "reviewer"],
      icon: "📊"
    },
    {
      name: "training",
      description: "Training and development records",
      fields: ["employee_id", "course_name", "completion_date", "certification", "skills_acquired", "instructor", "status"],
      icon: GraduationCap
    }
  ];

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 5 && (
              <div className={`w-12 h-0.5 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: HR Provider Selection */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Select HR System
            </CardTitle>
            <CardDescription>
              Choose your HR management system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hrProviders.map((provider) => (
                <div 
                  key={provider.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    config.provider === provider.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleFieldChange('provider', provider.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium">{provider.name}</h3>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {provider.authTypes.map((authType) => (
                          <Badge key={authType} variant="outline" className="text-xs">
                            {authType}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={!config.provider}
              >
                Next: Authentication
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Authentication */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              HR System Authentication
            </CardTitle>
            <CardDescription>
              Configure your HR system connection and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hr-instance-url">Instance URL</Label>
              <Input 
                id="hr-instance-url"
                placeholder={config.provider === 'workday' ? 'https://your-tenant.workday.com' : 'https://your-instance.hrsystem.com'}
                value={config.instanceUrl}
                onChange={(e) => handleFieldChange('instanceUrl', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hr-api-version">API Version</Label>
              <Select value={config.apiVersion} onValueChange={(value) => handleFieldChange('apiVersion', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select API version" />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider?.apiVersions.map((version) => (
                    <SelectItem key={version} value={version}>
                      {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hr-auth-type">Authentication Method</Label>
              <Select value={config.authType} onValueChange={(value) => handleFieldChange('authType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider?.authTypes.map((authType) => (
                    <SelectItem key={authType} value={authType}>
                      {authType === 'oauth' ? 'OAuth 2.0' : 
                       authType === 'api_key' ? 'API Key' : 
                       authType === 'basic' ? 'Username/Password' : authType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config.authType === "oauth" && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium text-blue-900">OAuth 2.0 Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hr-client-id">Client ID</Label>
                    <Input 
                      id="hr-client-id"
                      placeholder="Your HR system OAuth client ID"
                      value={config.clientId}
                      onChange={(e) => handleFieldChange('clientId', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hr-client-secret">Client Secret</Label>
                    <Input 
                      id="hr-client-secret"
                      type="password"
                      placeholder="Your HR system OAuth client secret"
                      value={config.clientSecret}
                      onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {config.authType === "api_key" && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900">API Key Configuration</h4>
                <div className="space-y-2">
                  <Label htmlFor="hr-api-key">API Key</Label>
                  <Input 
                    id="hr-api-key"
                    type="password"
                    placeholder="Your HR system API key"
                    value={config.clientSecret}
                    onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
                  />
                </div>
              </div>
            )}

            {config.authType === "basic" && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900">Username/Password Authentication</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hr-username">Username</Label>
                    <Input 
                      id="hr-username"
                      placeholder="your-username"
                      value={config.username}
                      onChange={(e) => handleFieldChange('username', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hr-password">Password</Label>
                    <Input 
                      id="hr-password"
                      type="password"
                      placeholder="Your HR system password"
                      value={config.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)} 
                disabled={!config.instanceUrl || !config.authType}
              >
                Next: Module Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Module Selection */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Select HR Modules
            </CardTitle>
            <CardDescription>
              Choose which HR modules to sync for policy context
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hrModules.map((module) => (
                <div key={module.name} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`module-${module.name}`}
                      checked={config.selectedModules.includes(module.name)}
                      onCheckedChange={(checked) => handleModuleToggle(module.name, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {typeof module.icon === 'string' ? (
                          <span className="text-lg">{module.icon}</span>
                        ) : (
                          <module.icon className="h-4 w-4 text-gray-600" />
                        )}
                        <Label htmlFor={`module-${module.name}`} className="font-medium">
                          {module.name}
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                      
                      {config.selectedModules.includes(module.name) && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Available Fields:</p>
                          <div className="grid grid-cols-2 gap-1">
                            {module.fields.map((field) => (
                              <div key={field} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`field-${module.name}-${field}`}
                                  checked={config.selectedFields[module.name]?.includes(field) || false}
                                  onCheckedChange={(checked) => handleFieldToggle(module.name, field, checked as boolean)}
                                />
                                <Label htmlFor={`field-${module.name}-${field}`} className="text-xs">
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
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(4)} 
                disabled={config.selectedModules.length === 0}
              >
                Next: Sync Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Sync Configuration */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sync Configuration
            </CardTitle>
            <CardDescription>
              Configure how and when to sync data from your HR system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hr-sync-frequency">Sync Frequency</Label>
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
                id="hr-webhook-enabled"
                checked={config.webhookEnabled}
                onCheckedChange={(checked) => handleFieldChange('webhookEnabled', checked)}
              />
              <Label htmlFor="hr-webhook-enabled">Enable real-time webhooks</Label>
            </div>

            {config.webhookEnabled && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p>Webhook URL for HR system:</p>
                    <div className="bg-green-100 p-2 rounded text-sm">
                      <code className="bg-green-200 px-1 rounded">http://localhost:8000/pip/webhooks/{config.provider}</code>
                    </div>
                    <p className="text-xs">
                      Configure this URL in your HR system's webhook settings
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="space-y-2">
                  <p><strong>Data Privacy Notice:</strong></p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>HR data is highly sensitive and will be encrypted in transit and at rest</li>
                    <li>Only authorized personnel can access HR data through policies</li>
                    <li>Data retention follows your organization's HR data policies</li>
                    <li>Consider using read-only API access for security</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep(5)}>
                Next: Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Test Connection */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test HR System Connection
            </CardTitle>
            <CardDescription>
              Test your HR system connection and verify module access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Connection Test</h4>
                  <p className="text-sm text-gray-600">Verify authentication and module access</p>
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
                          <p><strong>Provider:</strong> {currentProvider?.name}</p>
                          <p><strong>API Version:</strong> {config.apiVersion}</p>
                          <p><strong>Modules Available:</strong> {testResult.details?.modules_count || 'N/A'}</p>
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
                <h4 className="font-medium">Selected Modules Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {config.selectedModules.map((moduleName) => (
                    <div key={moduleName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{moduleName}</span>
                      <Badge variant="outline" className="text-xs">
                        {config.selectedFields[moduleName]?.length || 0} fields
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  Back
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://docs.controlcore.com/hr-integration', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  HR Integration Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
