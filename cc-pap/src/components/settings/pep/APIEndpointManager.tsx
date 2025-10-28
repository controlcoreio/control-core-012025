
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Shield, 
  Globe,
  Copy,
  Settings
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface APIEndpoint {
  id: string;
  name: string;
  originalHost: string;
  apiPaths: string[];
  proxyUrl: string;
  tlsCertificate: 'controlcore' | 'custom';
  status: 'active' | 'pending' | 'error';
  associatedPolicies: number;
  createdAt: string;
}

export function APIEndpointManager() {
  // No mock data - endpoints will be loaded from backend when API is ready
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<APIEndpoint | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    originalHost: "",
    apiPaths: [] as string[],
    newPath: "",
    tlsCertificate: "controlcore" as 'controlcore' | 'custom'
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: "",
      originalHost: "",
      apiPaths: [],
      newPath: "",
      tlsCertificate: "controlcore"
    });
  };

  const handleAddPath = () => {
    if (formData.newPath.trim() && !formData.apiPaths.includes(formData.newPath.trim())) {
      setFormData(prev => ({
        ...prev,
        apiPaths: [...prev.apiPaths, prev.newPath.trim()],
        newPath: ""
      }));
    }
  };

  const handleRemovePath = (index: number) => {
    setFormData(prev => ({
      ...prev,
      apiPaths: prev.apiPaths.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.originalHost.trim() || formData.apiPaths.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide endpoint name, host, and at least one API path.",
        variant: "destructive",
      });
      return;
    }

    const generateProxyUrl = (host: string, name: string) => {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      return `https://${cleanName}.controlcore.io`;
    };

    if (editingEndpoint) {
      // Update existing endpoint
      const updatedEndpoint: APIEndpoint = {
        ...editingEndpoint,
        name: formData.name,
        originalHost: formData.originalHost,
        apiPaths: formData.apiPaths,
        tlsCertificate: formData.tlsCertificate
      };
      
      setEndpoints(prev => prev.map(ep => ep.id === editingEndpoint.id ? updatedEndpoint : ep));
      toast({
        title: "Endpoint Updated",
        description: "API endpoint configuration has been updated.",
      });
    } else {
      // Add new endpoint
      const newEndpoint: APIEndpoint = {
        id: Date.now().toString(),
        name: formData.name,
        originalHost: formData.originalHost,
        apiPaths: formData.apiPaths,
        proxyUrl: generateProxyUrl(formData.originalHost, formData.name),
        tlsCertificate: formData.tlsCertificate,
        status: "active",
        associatedPolicies: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      setEndpoints(prev => [...prev, newEndpoint]);
      toast({
        title: "Endpoint Added",
        description: "New API endpoint has been configured and is ready for policy application.",
      });
    }

    setShowAddDialog(false);
    setEditingEndpoint(null);
    resetForm();
  };

  const handleEdit = (endpoint: APIEndpoint) => {
    setEditingEndpoint(endpoint);
    setFormData({
      name: endpoint.name,
      originalHost: endpoint.originalHost,
      apiPaths: [...endpoint.apiPaths],
      newPath: "",
      tlsCertificate: endpoint.tlsCertificate
    });
    setShowAddDialog(true);
  };

  const handleDelete = (id: string) => {
    setEndpoints(prev => prev.filter(ep => ep.id !== id));
    toast({
      title: "Endpoint Removed",
      description: "API endpoint has been removed from protection.",
    });
  };

  const copyProxyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Proxy URL copied to clipboard.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              API Endpoints & Reverse Proxy Management
            </CardTitle>
            <CardDescription>
              Manage your protected API endpoints and their ControlCore reverse proxy configurations
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingEndpoint(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add API Endpoint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEndpoint ? 'Edit API Endpoint' : 'Add New API Endpoint'}
                </DialogTitle>
                <DialogDescription>
                  Configure a new API endpoint for protection through ControlCore's reverse proxy
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Endpoint Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Production API"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalHost">Original Host</Label>
                    <Input
                      id="originalHost"
                      value={formData.originalHost}
                      onChange={(e) => setFormData(prev => ({ ...prev, originalHost: e.target.value }))}
                      placeholder="api.yourcompany.com"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>API Paths to Protect</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.newPath}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPath: e.target.value }))}
                      placeholder="/customer-info, /orders, /users/*"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddPath()}
                    />
                    <Button onClick={handleAddPath} size="sm" disabled={!formData.newPath.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.apiPaths.map((path, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {path}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 w-4 h-4"
                          onClick={() => handleRemovePath(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>TLS/SSL Certificate</Label>
                  <RadioGroup 
                    value={formData.tlsCertificate} 
                    onValueChange={(value: 'controlcore' | 'custom') => 
                      setFormData(prev => ({ ...prev, tlsCertificate: value }))
                    }
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="controlcore" id="controlcore-cert" />
                      <div className="flex-1">
                        <Label htmlFor="controlcore-cert" className="font-medium cursor-pointer">
                          ControlCore Managed Certificate
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatic certificate management and renewal
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="custom" id="custom-cert" />
                      <div className="flex-1">
                        <Label htmlFor="custom-cert" className="font-medium cursor-pointer">
                          Custom Certificate
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Upload your own certificate
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingEndpoint ? 'Update Endpoint' : 'Add Endpoint'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {endpoints.length === 0 ? (
          <Alert>
            <AlertDescription>
              No API endpoints configured. Add your first endpoint to start protecting your APIs with ControlCore.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint Name</TableHead>
                <TableHead>Original Host</TableHead>
                <TableHead>API Paths</TableHead>
                <TableHead>Proxy URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Policies</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((endpoint) => (
                <TableRow key={endpoint.id}>
                  <TableCell className="font-medium">{endpoint.name}</TableCell>
                  <TableCell className="font-mono text-sm">{endpoint.originalHost}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {endpoint.apiPaths.slice(0, 2).map((path, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {path}
                        </Badge>
                      ))}
                      {endpoint.apiPaths.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{endpoint.apiPaths.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm">{endpoint.proxyUrl}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyProxyUrl(endpoint.proxyUrl)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(endpoint.status)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {endpoint.associatedPolicies} policies
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(endpoint.proxyUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(endpoint)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(endpoint.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
