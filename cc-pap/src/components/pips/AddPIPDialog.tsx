import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Database, Shield, Check, Plus, Minus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface PIP {
  id: string;
  name: string;
  description: string;
  type: string;
  connectionStatus: "connected" | "disconnected";
}

interface AddPIPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pip: any) => void;
  editingPIP?: PIP | null;
}

export function AddPIPDialog({ isOpen, onClose, onSave, editingPIP }: AddPIPDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [pipName, setPipName] = useState("");
  const [pipType, setPipType] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [authType, setAuthType] = useState("api-key");
  const [apiKey, setApiKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [attributes, setAttributes] = useState<string[]>([]);
  const [newAttribute, setNewAttribute] = useState("");
  const [enableCaching, setEnableCaching] = useState(true);
  const [cacheTTL, setCacheTTL] = useState("300");
  const [refreshInterval, setRefreshInterval] = useState("3600");
  const [activeTab, setActiveTab] = useState("source");

  const resetForm = () => {
    setPipName("");
    setPipType("");
    setEndpoint("");
    setAuthType("api-key");
    setApiKey("");
    setUsername("");
    setPassword("");
    setAttributes([]);
    setNewAttribute("");
    setEnableCaching(true);
    setCacheTTL("300");
    setRefreshInterval("3600");
    setCurrentStep(1);
    setActiveTab("source");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    const newPIP = {
      name: pipName,
      type: pipType,
      endpoint,
      attributes,
      caching: {
        enabled: enableCaching,
        ttl: parseInt(cacheTTL),
        refreshInterval: parseInt(refreshInterval)
      },
      // In a real app, we would handle auth credentials securely
      auth: {
        type: authType,
        apiKey: authType === "api-key" ? apiKey : undefined,
        username: authType === "basic" ? username : undefined,
        password: authType === "basic" ? password : undefined
      }
    };

    onSave(newPIP);
    resetForm();
  };

  const handleAddAttribute = () => {
    if (newAttribute && !attributes.includes(newAttribute)) {
      setAttributes([...attributes, newAttribute]);
      setNewAttribute("");
    }
  };

  const handleRemoveAttribute = (attr: string) => {
    setAttributes(attributes.filter(a => a !== attr));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);

      // Update the active tab based on the current step
      if (currentStep === 1) setActiveTab("attributes");
      if (currentStep === 2) setActiveTab("caching");
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);

      // Update the active tab based on the current step
      if (currentStep === 2) setActiveTab("source");
      if (currentStep === 3) setActiveTab("attributes");
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 1) {
      return !pipName || !pipType || !endpoint || 
        (authType === "api-key" && !apiKey) || 
        (authType === "basic" && (!username || !password));
    }
    if (currentStep === 2) {
      return attributes.length === 0;
    }
    return false;
  };

  // Function to get the icon for data source type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "IAM":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "CRM":
        return <Database className="h-4 w-4 text-purple-500" />;
      case "SIEM":
        return <Database className="h-4 w-4 text-red-500" />;
      case "Threat Intelligence":
        return <Database className="h-4 w-4 text-amber-500" />;
      case "Database":
        return <Database className="h-4 w-4 text-green-500" />;
      case "Custom":
        return <Database className="h-4 w-4 text-gray-500" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Policy Information Point (PIP)</DialogTitle>
          <DialogDescription>
            Configure a new data source to be used as a Policy Information Point for context-aware authorization decisions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center mb-4">
          <div className="flex w-full items-center gap-1 text-sm text-muted-foreground">
            <div className={`flex items-center ${currentStep >= 1 ? "text-primary" : ""}`}>
              <Badge variant={currentStep >= 1 ? "default" : "outline"} className="mr-2">1</Badge>
              Data Source
            </div>
            <div className="h-px flex-1 bg-border mx-2"></div>
            <div className={`flex items-center ${currentStep >= 2 ? "text-primary" : ""}`}>
              <Badge variant={currentStep >= 2 ? "default" : "outline"} className="mr-2">2</Badge>
              Attributes
            </div>
            <div className="h-px flex-1 bg-border mx-2"></div>
            <div className={`flex items-center ${currentStep >= 3 ? "text-primary" : ""}`}>
              <Badge variant={currentStep >= 3 ? "default" : "outline"} className="mr-2">3</Badge>
              Caching
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="source" onClick={() => setCurrentStep(1)}>Data Source</TabsTrigger>
            <TabsTrigger value="attributes" onClick={() => setCurrentStep(2)}>Attributes</TabsTrigger>
            <TabsTrigger value="caching" onClick={() => setCurrentStep(3)}>Caching</TabsTrigger>
          </TabsList>

          <TabsContent value="source" className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pip-name">PIP Name</Label>
                  <Input 
                    id="pip-name" 
                    placeholder="Enter a descriptive name" 
                    value={pipName}
                    onChange={(e) => setPipName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-source-type">Data Source Type</Label>
                  <Select value={pipType} onValueChange={setPipType}>
                    <SelectTrigger id="data-source-type">
                      <SelectValue placeholder="Select data source type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IAM">IAM System</SelectItem>
                      <SelectItem value="CRM">CRM System</SelectItem>
                      <SelectItem value="SIEM">SIEM System</SelectItem>
                      <SelectItem value="Threat Intelligence">Threat Intelligence</SelectItem>
                      <SelectItem value="Database">Database</SelectItem>
                      <SelectItem value="Custom">Custom API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint">API Endpoint / Connection String</Label>
                <Input 
                  id="endpoint" 
                  placeholder="https://api.example.com/v1 or database connection string" 
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-type">Authentication Type</Label>
                <Select value={authType} onValueChange={setAuthType}>
                  <SelectTrigger id="auth-type">
                    <SelectValue placeholder="Select authentication type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api-key">API Key</SelectItem>
                    <SelectItem value="basic">Basic Auth (Username/Password)</SelectItem>
                    <SelectItem value="none">No Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authType === "api-key" && (
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input 
                    id="api-key" 
                    type="password" 
                    placeholder="Enter API key" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
              )}

              {authType === "basic" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      placeholder="Enter username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Enter password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="attributes" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Define Data Attributes</Label>
                <p className="text-sm text-muted-foreground">
                  Specify the data attributes that will be available from this PIP for use in policies.
                </p>
              </div>
              
              <div className="flex items-end gap-2 mb-2">
                <div className="flex-1">
                  <Label htmlFor="new-attribute" className="sr-only">New Attribute</Label>
                  <Input 
                    id="new-attribute" 
                    placeholder="e.g., userRole, riskScore, region" 
                    value={newAttribute}
                    onChange={(e) => setNewAttribute(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newAttribute) {
                        e.preventDefault();
                        handleAddAttribute();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleAddAttribute} disabled={!newAttribute} type="button">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="p-4 border rounded-md bg-muted/30 min-h-[120px]">
                {attributes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {attributes.map(attr => (
                      <div key={attr} className="flex items-center bg-background border rounded-md p-2 text-sm">
                        <span>{attr}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 ml-1" 
                          onClick={() => handleRemoveAttribute(attr)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center pt-8">
                    No attributes defined yet. Add at least one attribute.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="caching" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="enable-caching" 
                  checked={enableCaching} 
                  onCheckedChange={(checked) => setEnableCaching(checked as boolean)}
                />
                <Label htmlFor="enable-caching">Enable caching for this PIP</Label>
              </div>
              
              {enableCaching && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cache-ttl">Cache TTL (seconds)</Label>
                      <Input 
                        id="cache-ttl" 
                        type="number" 
                        placeholder="300" 
                        value={cacheTTL}
                        onChange={(e) => setCacheTTL(e.target.value)}
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        How long to keep data in cache before expiring
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                      <Input 
                        id="refresh-interval" 
                        type="number" 
                        placeholder="3600" 
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(e.target.value)}
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        How often to proactively refresh the cache in the background
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md">
                    <p className="text-sm font-medium mb-2">Caching Recommendations</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use shorter TTLs for frequently changing data</li>
                      <li>• Use longer TTLs for static or slow-changing data</li>
                      <li>• Set refresh intervals longer than TTL for efficient operation</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between gap-2">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" type="button" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleNext} 
              disabled={isNextDisabled()}
            >
              {currentStep < 3 ? "Next" : "Save PIP"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
