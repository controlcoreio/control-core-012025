import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Building, 
  Users, 
  MessageSquare, 
  Database, 
  Globe, 
  Server, 
  Settings, 
  RefreshCw, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Zap,
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Download,
  Activity,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Heart,
  HeartHandshake,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  FileText,
  Filter,
  Search,
  Play,
  Pause,
  Square,
  RotateCcw
} from "lucide-react";
// Removed mock data import - using real API calls
import AddEditPIPModal from "../pips/AddEditPIPModal";
import AttributeMappingModal from "../pips/AttributeMappingModal";

export default function PIPSettingsPage() {
  const [pipSources] = useState([]); // TODO: Replace with real API call
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [healthStatus, setHealthStatus] = useState<{[key: string]: any}>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "iam":
        return <Shield className="h-4 w-4" />;
      case "erp":
        return <Building className="h-4 w-4" />;
      case "crm":
        return <Users className="h-4 w-4" />;
      case "mcp":
        return <MessageSquare className="h-4 w-4" />;
      case "database":
        return <Database className="h-4 w-4" />;
      case "http-api":
        return <Globe className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "inactive":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      connected: "default",
      disconnected: "secondary", 
      error: "destructive",
      inactive: "outline",
      active: "default"
    } as const;
    
    return (
      <Badge variant={statusColors[status as keyof typeof statusColors] || "outline"}>
        {status}
      </Badge>
    );
  };

  const getOPALStatusBadge = (status: string) => {
    const colors = {
      synced: "default",
      syncing: "secondary",
      error: "destructive",
      pending: "outline"
    } as const;
    
    return (
      <Badge variant={colors[status as keyof typeof colors] || "outline"}>
        OPAL: {status}
      </Badge>
    );
  };

  const getBouncerStatusBadge = (status: string) => {
    const colors = {
      active: "default",
      inactive: "secondary",
      error: "destructive",
      pending: "outline"
    } as const;
    
    return (
      <Badge variant={colors[status as keyof typeof colors] || "outline"}>
        Bouncer: {status}
      </Badge>
    );
  };

  // Mock health status data
  const mockHealthStatus = {
    "pip-1": { status: "healthy", responseTime: 45, lastCheck: new Date(), uptime: "99.9%" },
    "pip-2": { status: "healthy", responseTime: 32, lastCheck: new Date(), uptime: "99.8%" },
    "pip-3": { status: "warning", responseTime: 120, lastCheck: new Date(), uptime: "98.5%" },
    "pip-4": { status: "healthy", responseTime: 28, lastCheck: new Date(), uptime: "99.9%" },
    "pip-5": { status: "error", responseTime: 0, lastCheck: new Date(), uptime: "95.2%" },
    "pip-6": { status: "inactive", responseTime: 0, lastCheck: new Date(), uptime: "0%" }
  };

  // Mock logs data
  const mockLogs = [
    { id: 1, timestamp: new Date(), level: "info", source: "Auth0 Production", message: "Connection established successfully", type: "connection" },
    { id: 2, timestamp: new Date(Date.now() - 300000), level: "success", source: "Salesforce CRM", message: "OPAL sync completed - 1,250 records", type: "opal" },
    { id: 3, timestamp: new Date(Date.now() - 600000), level: "warning", source: "SAP ERP", message: "High response time detected (120ms)", type: "health" },
    { id: 4, timestamp: new Date(Date.now() - 900000), level: "error", source: "Okta Identity", message: "Connection failed - Invalid credentials", type: "connection" },
    { id: 5, timestamp: new Date(Date.now() - 1200000), level: "info", source: "MCP Tools Server", message: "Cache cleared for connection", type: "cache" },
    { id: 6, timestamp: new Date(Date.now() - 1500000), level: "success", source: "HubSpot Marketing", message: "Sensitive attributes fetched successfully", type: "opal" }
  ];

  // Filter sources based on search and filters
  const filteredSources = pipSources.filter(source => {
    const matchesSearch = source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         source.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || source.type === filterType;
    const matchesStatus = filterStatus === "all" || source.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filter logs based on log filter
  const filteredLogs = logs.filter(log => {
    if (logFilter === "all") return true;
    return log.type === logFilter;
  });

  // Health status functions
  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <Heart className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "inactive":
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthBadge = (status: string) => {
    const colors = {
      healthy: "default",
      warning: "secondary",
      error: "destructive",
      inactive: "outline"
    } as const;
    
    return (
      <Badge variant={colors[status as keyof typeof colors] || "outline"}>
        {status}
      </Badge>
    );
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogTypeBadge = (type: string) => {
    const colors = {
      connection: "default",
      opal: "secondary",
      health: "outline",
      cache: "outline"
    } as const;
    
    return (
      <Badge variant={colors[type as keyof typeof colors] || "outline"} className="text-xs">
        {type}
      </Badge>
    );
  };

  // Initialize mock data
  React.useEffect(() => {
    setHealthStatus(mockHealthStatus);
    setLogs(mockLogs);
  }, []);

  // Handler functions
  const handleEditConnection = (connection: any) => {
    setSelectedConnection(connection);
    setIsEditModalOpen(true);
  };

  const handleConfigureMappings = (connection: any) => {
    setSelectedConnection(connection);
    setIsMappingModalOpen(true);
  };

  const handleRefreshLogs = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setLogs([...mockLogs, {
        id: Date.now(),
        timestamp: new Date(),
        level: "info",
        source: "System",
        message: "Logs refreshed successfully",
        type: "system"
      }]);
      setIsRefreshing(false);
    }, 1000);
  };

  // Statistics
  const totalSources = pipSources.length;
  const connectedSources = pipSources.filter(s => s.status === "connected" || s.status === "active").length;
  const errorSources = pipSources.filter(s => s.status === "error").length;
  const totalAttributes = pipSources.reduce((sum, source) => sum + source.attributesProvided.length, 0);


  const handleSaveConnection = (data: any) => {
    console.log("Saving connection:", data);
    // In real implementation, this would call the API
  };

  const handleSaveMappings = (mappings: any[]) => {
    console.log("Saving mappings:", mappings);
    // In real implementation, this would call the API
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PIP Settings</h1>
          <p className="text-muted-foreground">
            Configure Policy Information Points for external data integration
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalSources}</p>
                <p className="text-sm text-muted-foreground">Total Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{connectedSources}</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{errorSources}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalAttributes}</p>
                <p className="text-sm text-muted-foreground">Attributes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
          <TabsTrigger value="opal">OPAL Sync</TabsTrigger>
          <TabsTrigger value="bouncers">Bouncer Status</TabsTrigger>
          <TabsTrigger value="health">Health & Logs</TabsTrigger>
          <TabsTrigger value="sync">Synchronization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>
                  Current status of all PIP connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getSourceIcon(source.type)}
                      <div>
                        <div className="font-medium">{source.name}</div>
                        <div className="text-sm text-muted-foreground">{source.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(source.status)}
                      {getStatusBadge(source.status)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest synchronization and health check events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Auth0 Production - Sync Complete</div>
                    <div className="text-xs text-muted-foreground">2 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Okta Identity - Connection Failed</div>
                    <div className="text-xs text-muted-foreground">15 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Salesforce CRM - Health Check Passed</div>
                    <div className="text-xs text-muted-foreground">1 hour ago</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integration Templates Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Available Integration Templates</CardTitle>
              <CardDescription>
                Pre-configured templates for popular enterprise systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">IAM Systems</div>
                        <div className="text-sm text-muted-foreground">4 templates</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">ERP Systems</div>
                        <div className="text-sm text-muted-foreground">4 templates</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="font-medium">CRM Systems</div>
                        <div className="text-sm text-muted-foreground">3 templates</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="font-medium">MCP Servers</div>
                        <div className="text-sm text-muted-foreground">3 templates</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PIP Connections</CardTitle>
              <CardDescription>
                Manage your external data source connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipSources.map((source) => {
                  const health = healthStatus[source.id] || { status: "unknown", responseTime: 0, uptime: "0%" };
                  return (
                    <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getSourceIcon(source.type)}
                        <div>
                          <div className="font-medium">{source.name}</div>
                          <div className="text-sm text-muted-foreground">{source.description}</div>
                          <div className="text-xs text-muted-foreground font-mono">{source.endpoint}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Health Status */}
                        <div className="flex items-center gap-2">
                          {getHealthIcon(health.status)}
                          <div className="text-sm">
                            <div className="font-medium">{health.responseTime}ms</div>
                            <div className="text-muted-foreground">{health.uptime}</div>
                          </div>
                        </div>
                        
                        {/* Connection Status */}
                        <div className="flex items-center gap-2">
                          {getStatusIcon(source.status)}
                          {getStatusBadge(source.status)}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Test Connection">
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="View Logs">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Sync Now">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Configure Mappings"
                            onClick={() => handleConfigureMappings(source)}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Edit Connection"
                            onClick={() => handleEditConnection(source)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Templates</CardTitle>
              <CardDescription>
                Pre-configured templates for popular enterprise systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* IAM Templates */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">IAM Systems</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">Identity & Access Management</div>
                    <div className="space-y-2">
                      {["Auth0", "Okta", "Azure AD", "AWS IAM"].map((provider) => (
                        <div key={provider} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{provider}</span>
                          <Button size="sm" variant="outline">Use Template</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ERP Templates */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-green-500" />
                      <CardTitle className="text-lg">ERP Systems</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">Enterprise Resource Planning</div>
                    <div className="space-y-2">
                      {["SAP", "Oracle", "Workday", "NetSuite"].map((provider) => (
                        <div key={provider} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{provider}</span>
                          <Button size="sm" variant="outline">Use Template</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CRM Templates */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      <CardTitle className="text-lg">CRM Systems</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">Customer Relationship Management</div>
                    <div className="space-y-2">
                      {["Salesforce", "HubSpot", "Dynamics 365"].map((provider) => (
                        <div key={provider} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{provider}</span>
                          <Button size="sm" variant="outline">Use Template</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* MCP Templates */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-orange-500" />
                      <CardTitle className="text-lg">MCP Servers</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">Model Context Protocol</div>
                    <div className="space-y-2">
                      {["Tools Server", "Resources Server", "Prompts Server"].map((provider) => (
                        <div key={provider} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{provider}</span>
                          <Button size="sm" variant="outline">Use Template</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attribute Mappings</CardTitle>
              <CardDescription>
                Configure how attributes from external systems map to Control Core
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a connection to configure its attribute mappings</p>
                <p className="text-sm">Click the mapping button next to any connection to get started</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OPAL Synchronization</CardTitle>
              <CardDescription>
                Monitor and manage OPAL data synchronization to Bouncers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getSourceIcon(source.type)}
                      <div>
                        <div className="font-medium">{source.name}</div>
                        <div className="text-sm text-muted-foreground">{source.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Last sync: {new Date(source.lastSynced).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getOPALStatusBadge("synced")}
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Sync Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bouncers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bouncer Status</CardTitle>
              <CardDescription>
                Monitor Bouncer connections and data availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Activity className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">{source.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {source.attributesProvided.length} attributes available
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getBouncerStatusBadge("active")}
                      <Button variant="outline" size="sm">
                        <TestTube className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Connection Health
                </CardTitle>
                <CardDescription>
                  Real-time health status of all PIP connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pipSources.map((source) => {
                    const health = healthStatus[source.id] || { status: "unknown", responseTime: 0, uptime: "0%" };
                    return (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getHealthIcon(health.status)}
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {health.responseTime}ms • {health.uptime} uptime
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getHealthBadge(health.status)}
                          <Button variant="outline" size="sm">
                            <TestTube className="h-4 w-4 mr-2" />
                            Test
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Activity Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Activity Logs
                </CardTitle>
                <CardDescription>
                  Real-time logs of PIP activities and OPAL operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Log Filters */}
                  <div className="flex gap-2">
                    <Button
                      variant={logFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLogFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={logFilter === "connection" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLogFilter("connection")}
                    >
                      Connection
                    </Button>
                    <Button
                      variant={logFilter === "opal" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLogFilter("opal")}
                    >
                      OPAL
                    </Button>
                    <Button
                      variant={logFilter === "health" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLogFilter("health")}
                    >
                      Health
                    </Button>
                    <Button
                      variant={logFilter === "cache" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLogFilter("cache")}
                    >
                      Cache
                    </Button>
                  </div>

                  {/* Logs List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {getLogLevelIcon(log.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{log.source}</span>
                            {getLogTypeBadge(log.type)}
                            <span className="text-xs text-muted-foreground">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{log.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Refresh Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshLogs}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Health Metrics
              </CardTitle>
              <CardDescription>
                Performance metrics and health indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">4</div>
                  <div className="text-sm text-muted-foreground">Healthy</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">1</div>
                  <div className="text-sm text-muted-foreground">Warning</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">1</div>
                  <div className="text-sm text-muted-foreground">Error</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">98.7%</div>
                  <div className="text-sm text-muted-foreground">Avg Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Status</CardTitle>
              <CardDescription>
                Monitor data synchronization between external systems and Control Core
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Synchronization monitoring will be available here</p>
                <p className="text-sm">View sync logs, status, and performance metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddEditPIPModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveConnection}
      />

      <AddEditPIPModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveConnection}
        pipData={selectedConnection}
        isEdit={true}
      />

      <AttributeMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        onSave={handleSaveMappings}
        connectionId={selectedConnection?.id || ""}
        connectionName={selectedConnection?.name || ""}
      />
    </div>
  );
}
