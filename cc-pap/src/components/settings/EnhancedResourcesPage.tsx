import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Edit, Trash2, ExternalLink, Copy, Shield, Link as LinkIcon, AlertTriangle, Info, Clock, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useResources } from "@/hooks/use-resources";
import { AddEditResourceModal } from "./pep/AddEditResourceModal";
import { APP_CONFIG } from "@/config/app";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { EnvironmentBadge } from "@/components/ui/environment-badge";

interface ProtectedResource {
  id: string;
  name: string;
  type: string;
  policy: string;
  description: string;
  originalUrl: string;
  proxyUrl?: string;
  pepId?: string;
  pepName?: string;
  pepStatus: 'active' | 'inactive' | 'error' | 'not-assigned';
  environment?: string;
  resourcesProtected?: number;
  requestsPerHour?: number;
}

export function EnhancedResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPEP, setFilterPEP] = useState("all");
  const [filterDiscovery, setFilterDiscovery] = useState("all"); // all, auto, manual
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { currentEnvironment } = useEnvironment();
  
  // Fetch real resources from backend filtered by current environment
  const { resources: backendResources, isLoading, setResources } = useResources(currentEnvironment);
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <span className="text-muted-foreground">Loading protected resources...</span>
        </div>
      </div>
    );
  }
  
  // Filter backend resources
  const filteredResources = backendResources.filter((resource) => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (resource.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (resource.business_context || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDiscovery = filterDiscovery === "all" || 
                            (filterDiscovery === "auto" && resource.auto_discovered) ||
                            (filterDiscovery === "manual" && !resource.auto_discovered);
    
    // Resources are already filtered by environment from the hook
    return matchesSearch && matchesDiscovery;
  });

  const getPEPStatusBadge = (status: ProtectedResource['pepStatus']) => {
    const variants = {
      active: { variant: "default" as const, color: "bg-green-600 hover:bg-green-700", text: "Active" },
      inactive: { variant: "secondary" as const, color: "", text: "Inactive" },
      error: { variant: "destructive" as const, color: "", text: "Error" },
      "not-assigned": { variant: "outline" as const, color: "", text: "No Bouncer Assigned" }
    };
    
    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  const handleEditResource = (resourceId: string) => {
    setEditingResourceId(resourceId);
    setIsEditModalOpen(true);
  };

  const handleDeleteResource = async (resourceId: string) => {
    const resource = backendResources.find(r => r.id.toString() === resourceId);
    
    if (resource?.auto_discovered) {
      toast({
        title: "Cannot delete",
        description: "Auto-discovered resources cannot be deleted. Remove the bouncer to delete the resource.",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm("Are you sure you want to delete this resource?")) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/v1/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }

      toast({
        title: "Resource deleted",
        description: "Resource has been removed successfully",
      });

      setResources(prev => prev.filter(r => r.id.toString() !== resourceId));
    } catch (error) {
      console.error("Failed to delete resource:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingResourceId(null);
  };

  const handleSaveSuccess = () => {
    setRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const handleAssignPEP = (resourceId: string) => {
    toast({
      title: "Bouncer Assignment",
      description: "Navigate to Bouncer Management to assign a Bouncer to this resource",
    });
  };

  const uniqueTypes = ["API Resource"]; // Simplified for now
  const unprotectedResources = filteredResources.filter(r => !r.bouncer_id);
  const autoDiscoveredCount = backendResources.filter(r => r.auto_discovered).length;
  const manualCount = backendResources.filter(r => !r.auto_discovered).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
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
          <h1 className="text-3xl font-bold tracking-tight">Protected Resources</h1>
          <p className="text-muted-foreground">
            Manage your protected resources, Bouncer assignments, and proxy URLs
          </p>
        </div>
        <Button asChild>
          <Link to="/settings/peps" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Manage Bouncers
          </Link>
        </Button>
      </div>

      {/* Auto-Discovery Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Resources are automatically discovered from deployed bouncers</p>
            <p className="text-sm">
              When you deploy a bouncer with resource configuration, it automatically registers with the Control Plane. 
              You can then enrich these resources with business context, compliance tags, and metadata.
            </p>
            <div className="flex items-center gap-4 text-xs mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>{autoDiscoveredCount} Auto-Discovered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <span>{manualCount} Manual</span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Alert for unprotected resources */}
      {unprotectedResources.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>{unprotectedResources.length} resource{unprotectedResources.length > 1 ? 's' : ''} not protected:</strong> 
            {" "}Consider assigning Bouncers to secure these resources.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
                <p className="text-2xl font-bold">{backendResources.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Protected</p>
                <p className="text-2xl font-bold">{backendResources.filter(r => r.bouncer_id).length}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bouncers</p>
                <p className="text-2xl font-bold">{backendResources.filter(r => r.bouncer_id && r.bouncer_id !== null).length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Needs Attention</p>
                <p className="text-2xl font-bold">{backendResources.filter(r => !r.bouncer_id || r.bouncer_id === null).length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPEP} onValueChange={setFilterPEP}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Bouncer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            <SelectItem value="assigned">Bouncer Assigned</SelectItem>
            <SelectItem value="unassigned">No Bouncer Assigned</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDiscovery} onValueChange={setFilterDiscovery}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by discovery" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            <SelectItem value="auto">Auto-Discovered</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterEnvironment} onValueChange={setFilterEnvironment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Environments</SelectItem>
            <SelectItem value="sandbox">Sandbox</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resources ({filteredResources.length})</CardTitle>
          <CardDescription>
            View and manage your protected resources and their Bouncer assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Discovery</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Original Host</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchQuery || filterDiscovery !== "all" || filterEnvironment !== "all"
                      ? "No resources match your filters"
                      : "No resources found. Deploy a bouncer to auto-discover resources."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{resource.name}</div>
                        {resource.business_context && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {resource.business_context}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${
                          ((resource as any).environment || 'sandbox') === 'production' 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        {((resource as any).environment || 'sandbox') === 'production' ? 'Production' : 'Sandbox'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {resource.auto_discovered ? (
                          <>
                            <Badge className="bg-blue-600">Auto-Discovered</Badge>
                            {resource.discovered_at && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(resource.discovered_at).toLocaleDateString()}
                              </div>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline">Manual</Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {resource.data_classification ? (
                        <Badge variant="secondary" className="capitalize">
                          {resource.data_classification}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {resource.compliance_tags && resource.compliance_tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {resource.compliance_tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {resource.compliance_tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{resource.compliance_tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                          {resource.original_host}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(resource.original_host, "Host")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {resource.owner_email ? (
                        <div className="text-xs space-y-0.5">
                          <div className="text-muted-foreground">{resource.owner_team || 'N/A'}</div>
                          <div className="font-mono">{resource.owner_email}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditResource(resource.id.toString())}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {resource.auto_discovered ? 'Enrich' : 'Edit'}
                        </Button>
                        {!resource.auto_discovered && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteResource(resource.id.toString())}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Enrichment Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Resource Enrichment Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Why Enrich Resources?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Improve policy generation accuracy</li>
                <li>• Enable compliance-specific templates</li>
                <li>• Better audit trail and reporting</li>
                <li>• Cost allocation and tracking</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Enrichment Fields</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Business context and description</li>
                <li>• Data classification level</li>
                <li>• Compliance tags (GDPR, HIPAA, etc.)</li>
                <li>• Owner information and SLA tier</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Resource Modal */}
      <AddEditResourceModal
        open={isEditModalOpen}
        onOpenChange={handleModalClose}
        editingResourceId={editingResourceId}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}