import { BookText, Save, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export function AuditLogsPage() {
  const { toast } = useToast();
  
  // State for General Settings
  const [enableAuditLogging, setEnableAuditLogging] = useState(true);
  const [logRetentionPeriod, setLogRetentionPeriod] = useState("90");
  
  // State for event categories to log
  const [logPolicyManagement, setLogPolicyManagement] = useState(true);
  const [logPolicyEvaluation, setLogPolicyEvaluation] = useState(true);
  const [logUserManagement, setLogUserManagement] = useState(true);
  const [logSystemConfig, setLogSystemConfig] = useState(true);
  const [logPIPActivity, setLogPIPActivity] = useState(true);
  const [logPEPConnection, setLogPEPConnection] = useState(true);
  
  // State for SIEM Integration
  const [enableSIEMIntegration, setEnableSIEMIntegration] = useState(false);
  const [siemType, setSiemType] = useState("splunk");
  const [siemEndpoint, setSiemEndpoint] = useState("");
  const [siemAPIKey, setSiemAPIKey] = useState("");
  
  // State for Log Level
  const [logLevel, setLogLevel] = useState("info");

  // Handle save settings
  const handleSaveSettings = () => {
    // In a real app, would save to backend
    toast({
      title: "Settings saved",
      description: "Your audit log settings have been updated successfully.",
    });
  };

  // Handle test SIEM connection
  const handleTestSIEM = () => {
    if (!siemEndpoint || !siemAPIKey) {
      toast({
        title: "Missing information",
        description: "Please provide both endpoint URL and API key.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, would test the connection
    toast({
      title: "Connection successful",
      description: `Successfully connected to ${siemType.toUpperCase()} endpoint.`,
    });
  };

  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <BookText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Audit Log Settings</h1>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure how audit logging works across the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-logging">Enable Audit Logging</Label>
                <p className="text-sm text-muted-foreground">Turn audit logging on or off for the entire platform</p>
              </div>
              <Switch 
                id="enable-logging" 
                checked={enableAuditLogging}
                onCheckedChange={setEnableAuditLogging}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="retention-period">Log Retention Period</Label>
              <p className="text-sm text-muted-foreground">How long to store audit logs before automatic deletion</p>
              <Select value={logRetentionPeriod} onValueChange={setLogRetentionPeriod}>
                <SelectTrigger id="retention-period" className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Log Level</Label>
              <p className="text-sm text-muted-foreground">Set the verbosity of the logs</p>
              <Select value={logLevel} onValueChange={setLogLevel}>
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select log level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug (All logs)</SelectItem>
                  <SelectItem value="info">Info (Normal operations)</SelectItem>
                  <SelectItem value="warning">Warning (Issues only)</SelectItem>
                  <SelectItem value="error">Error (Critical issues only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Event Categories to Log</CardTitle>
            <CardDescription>Select which types of events should be recorded in the audit log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Policy Management</Label>
                  <p className="text-sm text-muted-foreground">Creating, updating, and deleting policies</p>
                </div>
                <Switch 
                  checked={logPolicyManagement}
                  onCheckedChange={setLogPolicyManagement}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Policy Evaluation</Label>
                  <p className="text-sm text-muted-foreground">Authorization requests and decisions</p>
                </div>
                <Switch 
                  checked={logPolicyEvaluation}
                  onCheckedChange={setLogPolicyEvaluation}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>User Management</Label>
                  <p className="text-sm text-muted-foreground">User creation, role assignments, logins</p>
                </div>
                <Switch 
                  checked={logUserManagement}
                  onCheckedChange={setLogUserManagement}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>System Configuration</Label>
                  <p className="text-sm text-muted-foreground">Changes to system settings and configurations</p>
                </div>
                <Switch 
                  checked={logSystemConfig}
                  onCheckedChange={setLogSystemConfig}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>PIP Activity</Label>
                  <p className="text-sm text-muted-foreground">Policy Information Point operations</p>
                </div>
                <Switch 
                  checked={logPIPActivity}
                  onCheckedChange={setLogPIPActivity}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>PEP Connection</Label>
                  <p className="text-sm text-muted-foreground">Policy Enforcement Point connection events</p>
                </div>
                <Switch 
                  checked={logPEPConnection}
                  onCheckedChange={setLogPEPConnection}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Integration Settings</CardTitle>
            <CardDescription>Configure how audit logs are shared with external systems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="siem">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="siem">SIEM Integration</TabsTrigger>
                <TabsTrigger value="other">Other Security Tools</TabsTrigger>
              </TabsList>
              <TabsContent value="siem" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-siem">Enable SIEM Integration</Label>
                    <p className="text-sm text-muted-foreground">Send audit logs to a Security Information and Event Management system</p>
                  </div>
                  <Switch 
                    id="enable-siem" 
                    checked={enableSIEMIntegration}
                    onCheckedChange={setEnableSIEMIntegration}
                  />
                </div>
                
                {enableSIEMIntegration && (
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="siem-type">SIEM Type</Label>
                      <Select value={siemType} onValueChange={setSiemType}>
                        <SelectTrigger id="siem-type">
                          <SelectValue placeholder="Select SIEM type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="splunk">Splunk</SelectItem>
                          <SelectItem value="elastic">Elastic SIEM</SelectItem>
                          <SelectItem value="qradar">IBM QRadar</SelectItem>
                          <SelectItem value="sentinel">Microsoft Sentinel</SelectItem>
                          <SelectItem value="custom">Custom (API Endpoint)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="siem-endpoint">Endpoint URL</Label>
                      <Input 
                        id="siem-endpoint" 
                        placeholder="https://your-siem-endpoint.com" 
                        value={siemEndpoint}
                        onChange={(e) => setSiemEndpoint(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="siem-api-key">API Key / Token</Label>
                      <Input 
                        id="siem-api-key" 
                        type="password"
                        placeholder="Enter your API key or token" 
                        value={siemAPIKey}
                        onChange={(e) => setSiemAPIKey(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleTestSIEM}
                      variant="outline"
                    >
                      Test Connection
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="other" className="pt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p>Additional security tool integrations are coming soon.</p>
                  <p className="text-sm mt-2">Support for data lake exports, SOC tools, and custom webhooks is under development.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default" 
              className="ml-auto"
              onClick={handleSaveSettings}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}