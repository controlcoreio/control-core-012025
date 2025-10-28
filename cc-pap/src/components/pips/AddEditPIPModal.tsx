import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield, Building, Users, MessageSquare, Database, Globe, Server, TestTube, CheckCircle, AlertCircle } from "lucide-react";

interface AddEditPIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  pipData?: any;
  isEdit?: boolean;
}

export default function AddEditPIPModal({ isOpen, onClose, onSave, pipData, isEdit = false }: AddEditPIPModalProps) {
  const [formData, setFormData] = useState({
    name: pipData?.name || "",
    description: pipData?.description || "",
    connection_type: pipData?.connection_type || "",
    provider: pipData?.provider || "",
    endpoint: pipData?.endpoint || "",
    configuration: pipData?.configuration || {},
    credentials: pipData?.credentials || {},
    sync_enabled: pipData?.sync_enabled ?? true,
    sync_frequency: pipData?.sync_frequency || 300,
    health_check_url: pipData?.health_check_url || "",
    ...pipData
  });

  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const connectionTypes = [
    { value: "iam", label: "IAM", icon: Shield, description: "Identity & Access Management" },
    { value: "erp", label: "ERP", icon: Building, description: "Enterprise Resource Planning" },
    { value: "crm", label: "CRM", icon: Users, description: "Customer Relationship Management" },
    { value: "mcp", label: "MCP", icon: MessageSquare, description: "Model Context Protocol" },
    { value: "database", label: "Database", icon: Database, description: "Database Connection" },
    { value: "http-api", label: "HTTP API", icon: Globe, description: "REST API Connection" },
    { value: "custom", label: "Custom", icon: Server, description: "Custom Integration" }
  ];

  const providers = {
    iam: [
      { value: "auth0", label: "Auth0", description: "Auth0 identity platform" },
      { value: "okta", label: "Okta", description: "Okta identity management" },
      { value: "azure_ad", label: "Azure AD", description: "Microsoft Azure Active Directory" },
      { value: "aws_iam", label: "AWS IAM", description: "Amazon Web Services IAM" }
    ],
    erp: [
      { value: "sap", label: "SAP", description: "SAP ERP system" },
      { value: "oracle", label: "Oracle ERP", description: "Oracle Cloud ERP" },
      { value: "workday", label: "Workday", description: "Workday HCM" },
      { value: "netsuite", label: "NetSuite", description: "NetSuite cloud ERP" }
    ],
    crm: [
      { value: "salesforce", label: "Salesforce", description: "Salesforce CRM" },
      { value: "hubspot", label: "HubSpot", description: "HubSpot marketing platform" },
      { value: "dynamics365", label: "Dynamics 365", description: "Microsoft Dynamics 365" }
    ],
    mcp: [
      { value: "mcp_tools", label: "MCP Tools", description: "MCP Tools server" },
      { value: "mcp_resources", label: "MCP Resources", description: "MCP Resources server" },
      { value: "mcp_prompts", label: "MCP Prompts", description: "MCP Prompts server" }
    ]
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate test result
    const success = Math.random() > 0.3; // 70% success rate for demo
    setTestResult({
      success,
      status: success ? "connected" : "error",
      response_time: Math.random() * 1000 + 100,
      error_message: success ? null : "Connection failed: Invalid credentials",
      details: success ? {
        provider: formData.provider,
        endpoint: formData.endpoint,
        version: "v1.0"
      } : {}
    });
    
    setIsTesting(false);
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const getConnectionTypeIcon = (type: string) => {
    const connectionType = connectionTypes.find(ct => ct.value === type);
    if (connectionType) {
      const Icon = connectionType.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Server className="h-4 w-4" />;
  };

  const getAvailableProviders = () => {
    if (!formData.connection_type) return [];
    return providers[formData.connection_type as keyof typeof providers] || [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit PIP Connection" : "Add New PIP Connection"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update the configuration for your PIP connection"
              : "Configure a new Policy Information Point connection to integrate with external systems"
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Auth0 Production"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of this connection"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Connection Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {connectionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card 
                      key={type.value}
                      className={`cursor-pointer transition-colors ${
                        formData.connection_type === type.value 
                          ? "ring-2 ring-blue-500 bg-blue-50" 
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleInputChange("connection_type", type.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {formData.connection_type && (
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={formData.provider} onValueChange={(value) => handleInputChange("provider", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableProviders().map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center gap-2">
                          {getConnectionTypeIcon(formData.connection_type)}
                          <div>
                            <div className="font-medium">{provider.label}</div>
                            <div className="text-sm text-muted-foreground">{provider.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="connection" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => handleInputChange("endpoint", e.target.value)}
                placeholder="https://api.example.com/v1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="health_check_url">Health Check URL (Optional)</Label>
              <Input
                id="health_check_url"
                value={formData.health_check_url}
                onChange={(e) => handleInputChange("health_check_url", e.target.value)}
                placeholder="https://api.example.com/health"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sync_enabled">Enable Synchronization</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync data from this connection
                </p>
              </div>
              <Switch
                id="sync_enabled"
                checked={formData.sync_enabled}
                onCheckedChange={(checked) => handleInputChange("sync_enabled", checked)}
              />
            </div>

            {formData.sync_enabled && (
              <div className="space-y-2">
                <Label htmlFor="sync_frequency">Sync Frequency (seconds)</Label>
                <Input
                  id="sync_frequency"
                  type="number"
                  value={formData.sync_frequency}
                  onChange={(e) => handleInputChange("sync_frequency", parseInt(e.target.value))}
                  placeholder="300"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="credentials" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    type="password"
                    placeholder="Enter client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    placeholder="Enter client secret"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_token">API Token</Label>
                <Input
                  id="api_token"
                  type="password"
                  placeholder="Enter API token"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="company.auth0.com"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <TestTube className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <Card className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {testResult.success ? "Connection Successful" : "Connection Failed"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Response time: {testResult.response_time.toFixed(0)}ms
                      </div>
                      {testResult.error_message && (
                        <div className="text-sm text-red-600 mt-1">
                          {testResult.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label>Configuration (JSON)</Label>
              <Textarea
                placeholder='{"api_version": "v2", "timeout": 30}'
                className="min-h-[100px] font-mono text-sm"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Rate Limits</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requests_per_minute">Requests per Minute</Label>
                  <Input
                    id="requests_per_minute"
                    type="number"
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="burst_limit">Burst Limit</Label>
                  <Input
                    id="burst_limit"
                    type="number"
                    placeholder="100"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Security Settings</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Encrypt Credentials</div>
                    <div className="text-sm text-muted-foreground">
                      Encrypt stored credentials
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">SSL/TLS Required</div>
                    <div className="text-sm text-muted-foreground">
                      Require secure connections
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEdit ? "Update Connection" : "Create Connection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}