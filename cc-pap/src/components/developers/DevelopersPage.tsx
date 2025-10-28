import { useState } from "react";
import { 
  Shield, Key, FileText, Code, Info, EyeOff, Eye, Trash2, Plus, 
  ExternalLink, Database, Server, Keyboard, ChevronLeft 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Mock data for API keys
const initialApiKeys = [
  {
    id: "key-1",
    name: "Production API",
    key: "sk_prod_2023xyzabc123456789",
    status: "active",
    createdAt: "2023-12-10T14:30:00Z",
  },
  {
    id: "key-2",
    name: "Testing Environment",
    key: "sk_test_2023defghi987654321",
    status: "active",
    createdAt: "2023-12-15T09:45:00Z",
  },
  {
    id: "key-3",
    name: "Development Only",
    key: "sk_dev_2023jklmno567890123",
    status: "inactive",
    createdAt: "2023-11-28T16:20:00Z",
  },
];

export function DevelopersPage() {
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDialog, setNewKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [uiFramework, setUiFramework] = useState("react");
  const [apiType, setApiType] = useState("rest");

  const toggleKeyVisibility = (keyId: string) => {
    setRevealedKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please provide a name for your API key");
      return;
    }
    
    // Generate a mock API key
    const generatedKey = `sk_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
    setNewApiKey(generatedKey);
    
    const newKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: generatedKey,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    
    setApiKeys(prev => [...prev, newKey]);
    setRevealedKeys(prev => ({
      ...prev,
      [newKey.id]: true
    }));
  };

  const handleRevokeKey = (keyId: string) => {
    setApiKeys(prev => 
      prev.map(key => 
        key.id === keyId 
          ? { ...key, status: "inactive" } 
          : key
      )
    );
    toast.success("API key has been revoked");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API key copied to clipboard");
  };

  const closeNewKeyDialog = () => {
    setNewKeyDialog(false);
    setNewKeyName("");
    setNewApiKey(null);
  };

  const renderPlatformServiceAccess = () => {
    return (
      <TabsContent value="service-access" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Service Access</CardTitle>
            <CardDescription>
              Learn how to interact with core Control Core services programmatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Policy Decision Point (PDP)
                  </CardTitle>
                  <CardDescription>
                    Evaluate access control decisions in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                    <pre>
{`POST /api/v1/policies/evaluate
{
  "policyId": "pol_1234567890",
  "subject": { "id": "user123", "roles": ["admin"] },
  "resource": { "type": "document", "id": "doc456" },
  "action": "read",
  "context": { "location": "office" }
}`}
                    </pre>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <FileText size={14} />
                      API Docs
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Code size={14} />
                      Code Examples
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Policy Administration Point (PAP)
                  </CardTitle>
                  <CardDescription>
                    Create and manage policies programmatically
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                    <pre>
{`POST /api/v1/policies
{
  "name": "Document Access Policy",
  "description": "Controls access to documents",
  "effect": "permit",
  "conditions": [
    { "attribute": "subject.roles", "operator": "includes", "value": "editor" }
  ]
}`}
                    </pre>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <FileText size={14} />
                      API Docs
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Code size={14} />
                      Code Examples
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    Policy Enforcement Point (PEP)
                  </CardTitle>
                  <CardDescription>
                    Integrate enforcement agents into your applications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                    <pre>
{`// Example PEP integration code
const accessDecision = await controlCore.enforce({
  subject: currentUser,
  resource: document,
  action: "edit",
  context: { environment: "production" }
});

if (accessDecision.allowed) {
  // Allow the operation
} else {
  // Deny access, using apiKeys for reference
  console.log(apiKeys.length);
}`}
                    </pre>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <FileText size={14} />
                      API Docs
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Code size={14} />
                      Code Examples
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Policy Information Point (PIP)
                  </CardTitle>
                  <CardDescription>
                    Configure and query external data sources
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                    <pre>
{`// Configure a new PIP source
const pipConfig = {
  name: "User Directory",
  type: "rest-api",
  config: {
    url: "https://directory.example.com/api/users",
    method: "GET",
    headers: { "Authorization": "Bearer \${apiKeys[0]?.key || 'YOUR_API_KEY'}" }
  },
  attributeMapping: {
    "user.department": "$.department",
    "user.clearance": "$.securityClearance"
  }
};`}
                    </pre>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <FileText size={14} />
                      API Docs
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Code size={14} />
                      Code Examples
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-muted p-4 rounded-md mt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Advanced Integration</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    For complex integration scenarios, our service components can be combined to create 
                    sophisticated access control workflows:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Event-driven policy enforcement with webhooks</li>
                    <li>Custom attribute providers for context-aware policies</li>
                    <li>Attribute-based access control (ABAC) implementations</li>
                    <li>Multi-tenant policy management</li>
                  </ul>
                  <Button variant="link" size="sm" className="mt-2 h-auto p-0 text-primary">
                    View Advanced Integration Guide
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  };

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Keyboard className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Developer Resources</h1>
      </div>
      
      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="documentation">API Documentation</TabsTrigger>
          <TabsTrigger value="preferences">Development Preferences</TabsTrigger>
          <TabsTrigger value="service-access">Platform Service Access</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage your API keys for programmatic access to the platform</CardDescription>
                </div>
                <Dialog open={newKeyDialog} onOpenChange={setNewKeyDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus size={16} />
                      Generate New Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{newApiKey ? "Your New API Key" : "Generate API Key"}</DialogTitle>
                      <DialogDescription>
                        {newApiKey 
                          ? "Store this API key securely. For security reasons, it won't be displayed again."
                          : "Create a new API key to access the Control Core API programmatically"}
                      </DialogDescription>
                    </DialogHeader>
                    
                    {!newApiKey ? (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="key-name">API Key Name</Label>
                          <Input 
                            id="key-name" 
                            placeholder="e.g., Production API, Test Environment" 
                            value={newKeyName} 
                            onChange={(e) => setNewKeyName(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Give your key a descriptive name to identify its purpose or environment
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="api-key">API Key</Label>
                          <div className="flex items-center space-x-2">
                            <Input 
                              id="api-key" 
                              value={newApiKey} 
                              readOnly 
                              className="font-mono"
                            />
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => copyToClipboard(newApiKey)}
                            >
                              <FileText size={16} />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Use this key in the Authorization header: <code className="bg-muted p-1 rounded">Authorization: Bearer {'{your-api-key}'}</code>
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <DialogFooter>
                      {!newApiKey ? (
                        <>
                          <Button variant="outline" onClick={closeNewKeyDialog}>Cancel</Button>
                          <Button onClick={handleCreateKey}>Generate Key</Button>
                        </>
                      ) : (
                        <Button onClick={closeNewKeyDialog}>Done</Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted p-1 rounded font-mono text-xs">
                            {revealedKeys[apiKey.id] 
                              ? apiKey.key 
                              : `${apiKey.key.substring(0, 8)}${'•'.repeat(16)}`}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleKeyVisibility(apiKey.id)} 
                            disabled={apiKey.status === "inactive"}
                          >
                            {revealedKeys[apiKey.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                          {revealedKeys[apiKey.id] && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => copyToClipboard(apiKey.key)}
                              disabled={apiKey.status === "inactive"}
                            >
                              <FileText size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={apiKey.status === "active" ? "default" : "secondary"}>
                          {apiKey.status === "active" ? "Active" : "Revoked"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {apiKey.status === "active" && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleRevokeKey(apiKey.id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between text-xs text-muted-foreground">
              <div>
                <p>API keys provide full access to your Control Core account. Keep them secure!</p>
              </div>
              <div>
                <p>{apiKeys.filter(k => k.status === "active").length} active keys</p>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>Access comprehensive documentation for the Control Core API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Interactive API Reference</h3>
                <p className="text-muted-foreground">
                  Explore our API endpoints using the interactive Swagger UI documentation.
                </p>
                <Button variant="outline" className="mt-2 flex items-center gap-2">
                  <ExternalLink size={16} />
                  Open Swagger UI
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Downloads</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">OpenAPI Specification</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Download the OpenAPI 3.0 specification file
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <FileText size={16} />
                        Download JSON
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">SDK Documentation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Access generated client libraries and SDKs
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Code size={16} />
                        View SDKs
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Getting Started</h3>
                <p className="text-muted-foreground">
                  Follow our step-by-step guides to quickly integrate with Control Core
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  <Card className="border border-primary/20 hover:border-primary/50 transition-colors">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Authentication</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm text-muted-foreground">
                        Learn how to authenticate your API requests
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-primary/20 hover:border-primary/50 transition-colors">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Policy Management</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm text-muted-foreground">
                        Create and manage policies programmatically
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-primary/20 hover:border-primary/50 transition-colors">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Decision Points</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm text-muted-foreground">
                        Integrate policy decision points into your app
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Development Preferences</CardTitle>
              <CardDescription>
                Configure your preferred development technologies for interacting with Control Core
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">UI Framework</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred UI framework for custom integrations or UI extensions.
                </p>
                <RadioGroup 
                  value={uiFramework} 
                  onValueChange={setUiFramework}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2"
                >
                  <div>
                    <RadioGroupItem value="react" id="react" className="peer sr-only" />
                    <Label
                      htmlFor="react"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Code className="mb-3 h-6 w-6" />
                      <div className="space-y-1 text-center">
                        <p className="font-medium leading-none">React</p>
                        <p className="text-sm text-muted-foreground">
                          JavaScript library for building user interfaces
                        </p>
                      </div>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="vue" id="vue" className="peer sr-only" />
                    <Label
                      htmlFor="vue"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Code className="mb-3 h-6 w-6" />
                      <div className="space-y-1 text-center">
                        <p className="font-medium leading-none">Vue.js</p>
                        <p className="text-sm text-muted-foreground">
                          Progressive JavaScript framework
                        </p>
                      </div>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="angular" id="angular" className="peer sr-only" />
                    <Label
                      htmlFor="angular"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Code className="mb-3 h-6 w-6" />
                      <div className="space-y-1 text-center">
                        <p className="font-medium leading-none">Angular</p>
                        <p className="text-sm text-muted-foreground">
                          Platform for building web applications
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">API Communication</h3>
                <p className="text-sm text-muted-foreground">
                  Select your preferred API pattern for interacting with Control Core data and services
                </p>
                <RadioGroup 
                  value={apiType} 
                  onValueChange={setApiType}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
                >
                  <div>
                    <RadioGroupItem value="rest" id="rest" className="peer sr-only" />
                    <Label
                      htmlFor="rest"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Database className="mb-3 h-6 w-6" />
                      <div className="space-y-1 text-center">
                        <p className="font-medium leading-none">REST API</p>
                        <p className="text-sm text-muted-foreground">
                          Standard HTTP methods and endpoints
                        </p>
                      </div>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="graphql" id="graphql" className="peer sr-only" />
                    <Label
                      htmlFor="graphql"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Database className="mb-3 h-6 w-6" />
                      <div className="space-y-1 text-center">
                        <p className="font-medium leading-none">GraphQL</p>
                        <p className="text-sm text-muted-foreground">
                          Query language for your API
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="bg-muted p-4 rounded-md mt-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Development Resources</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Based on your selections, we recommend the following resources:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                          {uiFramework.charAt(0).toUpperCase() + uiFramework.slice(1)} SDK Documentation
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                          {apiType === "rest" ? "REST API" : "GraphQL"} Reference Guide
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                          Example Integration Project
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast.success("Development preferences saved")}>
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {renderPlatformServiceAccess()}
      </Tabs>
    </div>
  );
}
