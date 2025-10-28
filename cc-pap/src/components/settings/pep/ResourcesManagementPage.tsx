import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Edit,
  Trash2,
  Shield,
  Info,
  RefreshCw,
  ExternalLink,
  Copy,
  Sparkles,
  Plus,
  Filter,
  Clock,
  Server
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResources } from "@/hooks/use-resources";
import { AddEditResourceModal } from "./AddEditResourceModal";
import { APP_CONFIG } from "@/config/app";

export function ResourcesManagementPage() {
  const { toast } = useToast();
  const { resources: backendResources, isLoading, setResources } = useResources();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDiscovery, setFilterDiscovery] = useState<string>("all"); // all, auto, manual
  const [filterClassification, setFilterClassification] = useState<string>("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger refetch
    window.location.reload();
  };

  const handleEditResource = (resourceId: string) => {
    setEditingResourceId(resourceId);
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingResourceId(null);
  };

  const handleSaveSuccess = () => {
    // Refresh resources list
    setRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDeleteResource = async (resourceId: string) => {
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

      // Refresh list
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

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  // Filter resources
  const filteredResources = backendResources.filter((resource) => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (resource.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    const matchesDiscovery = filterDiscovery === "all" || 
                            (filterDiscovery === "auto" && resource.auto_discovered) ||
                            (filterDiscovery === "manual" && !resource.auto_discovered);
    
    const matchesClassification = filterClassification === "all" || 
                                  resource.data_classification === filterClassification;
    
    return matchesSearch && matchesDiscovery && matchesClassification;
  });

  const autoDiscoveredCount = backendResources.filter(r => r.auto_discovered).length;
  const manualCount = backendResources.filter(r => !r.auto_discovered).length;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <span className="text-muted-foreground">Loading resources...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Protected Resources</h1>
          <p className="text-muted-foreground">
            Manage auto-discovered and manual resources protected by your bouncers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Auto-Discovery Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Resources are automatically discovered from deployed bouncers</p>
            <p className="text-sm">
              When you deploy a bouncer with resource configuration, it automatically registers with the Control Plane and creates a protected resource entry. 
              You can then enrich these resources with business context, compliance tags, and other metadata.
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Search Resources</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Discovery Method</Label>
              <Select value={filterDiscovery} onValueChange={setFilterDiscovery}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="auto">Auto-Discovered</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Data Classification</Label>
              <Select value={filterClassification} onValueChange={setFilterClassification}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classifications</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resources ({filteredResources.length})</CardTitle>
              <CardDescription>
                View and enrich your auto-discovered resources
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discovery</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchQuery || filterDiscovery !== "all" || filterClassification !== "all" 
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
                        <div className="text-xs text-muted-foreground font-mono">
                          {resource.original_host}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {resource.url || 'API'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {resource.auto_discovered ? (
                          <>
                            <Badge className="bg-blue-600">
                              Auto-Discovered
                            </Badge>
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
                      {resource.owner_email ? (
                        <div className="text-sm">
                          <div className="text-xs text-muted-foreground">{resource.owner_team || 'N/A'}</div>
                          <div className="text-xs font-mono">{resource.owner_email}</div>
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

