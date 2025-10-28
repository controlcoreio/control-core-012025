
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Database, Globe, Server, Settings, RefreshCw, TestTube, Zap, Shield, Users, Building, MessageSquare, Wrench, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { MOCK_PIP_SOURCES } from "@/data/mockData";

export default function PIPsPage() {
  const [pipSources] = useState(MOCK_PIP_SOURCES);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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
      case "ldap":
        return <Server className="h-4 w-4" />;
      case "http-api":
        return <Globe className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
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

  // Filter sources based on search and filters
  const filteredSources = pipSources.filter(source => {
    const matchesSearch = source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         source.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || source.type === filterType;
    const matchesStatus = filterStatus === "all" || source.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get statistics
  const totalSources = pipSources.length;
  const connectedSources = pipSources.filter(s => s.status === "connected" || s.status === "active").length;
  const errorSources = pipSources.filter(s => s.status === "error").length;
  const totalAttributes = pipSources.reduce((sum, source) => sum + source.attributesProvided.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policy Information Points (PIPs)</h1>
          <p className="text-muted-foreground">
            Configure external data sources that provide attributes for policy evaluation
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalSources}</p>
                <p className="text-sm text-muted-foreground">Total Sources</p>
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

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="templates">Integration Templates</TabsTrigger>
          <TabsTrigger value="mappings">Attribute Mappings</TabsTrigger>
          <TabsTrigger value="sync">Synchronization</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search connections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="iam">IAM</SelectItem>
                      <SelectItem value="erp">ERP</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="mcp">MCP</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="connected">Connected</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connections Table */}
          <Card>
            <CardHeader>
              <CardTitle>Data Source Connections</CardTitle>
              <CardDescription>
                Manage your external data source connections and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Connection</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Attributes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="flex items-center gap-3">
                        {getSourceIcon(source.type)}
                        <div>
                          <span className="font-medium">{source.name}</span>
                          <p className="text-sm text-muted-foreground">{source.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {source.type.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-[200px] truncate">
                        {source.endpoint}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {source.attributesProvided.slice(0, 2).map((attr) => (
                            <Badge key={attr} variant="outline" className="text-xs">
                              {attr}
                            </Badge>
                          ))}
                          {source.attributesProvided.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{source.attributesProvided.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(source.status)}
                          {getStatusBadge(source.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(source.lastSynced).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Test Connection">
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Sync Now">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Configure">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* IAM Templates */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">IAM Systems</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">Identity & Access Management</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">Auth0</Badge>
                      <Badge variant="outline">Okta</Badge>
                      <Badge variant="outline">Azure AD</Badge>
                      <Badge variant="outline">AWS IAM</Badge>
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
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">Enterprise Resource Planning</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">SAP</Badge>
                      <Badge variant="outline">Oracle</Badge>
                      <Badge variant="outline">Workday</Badge>
                      <Badge variant="outline">NetSuite</Badge>
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
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">Customer Relationship Management</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">Salesforce</Badge>
                      <Badge variant="outline">HubSpot</Badge>
                      <Badge variant="outline">Dynamics 365</Badge>
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
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">Model Context Protocol</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">Tools Server</Badge>
                      <Badge variant="outline">Resources Server</Badge>
                      <Badge variant="outline">Prompts Server</Badge>
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
                Configure how attributes from external systems map to Control Core attributes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Attribute mapping configuration will be available here.</p>
                <p className="text-sm">Select a connection to configure its attribute mappings.</p>
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
                <p>Synchronization monitoring will be available here.</p>
                <p className="text-sm">View sync logs, status, and performance metrics.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
