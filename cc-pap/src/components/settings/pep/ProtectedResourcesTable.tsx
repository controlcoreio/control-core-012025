
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, MoreHorizontal, Edit, Trash2, Power, TestTube, Sparkles, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResources } from "@/hooks/use-resources";
import { PolicySuggestionsModal } from "./PolicySuggestionsModal";

interface ProtectedResourcesTableProps {
  onEditResource: (resourceId: string) => void;
}

export function ProtectedResourcesTable({ onEditResource }: ProtectedResourcesTableProps) {
  const { toast } = useToast();
  const { resources, isLoading } = useResources();
  const [suggestionsModal, setSuggestionsModal] = useState<{
    open: boolean;
    resourceId: string;
    resourceName: string;
    resourceUrl: string;
  }>({
    open: false,
    resourceId: '',
    resourceName: '',
    resourceUrl: ''
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "URL has been copied to your clipboard.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Connected':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>;
      case 'Pending DNS':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending DNS</Badge>;
      case 'Disconnected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Disconnected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleSuggestPolicies = (resource: typeof resources[0]) => {
    setSuggestionsModal({
      open: true,
      resourceId: resource.id.toString(),
      resourceName: resource.name,
      resourceUrl: resource.original_host || resource.url
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-md border p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
          <span className="text-muted-foreground">Loading resources...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource Name</TableHead>
              <TableHead>Original Host</TableHead>
              <TableHead>Discovery</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No resources found. Deploy a bouncer to auto-discover resources.
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource) => (
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
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {resource.original_host}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(resource.original_host)}
                      className="ml-1"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
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
                  
                  <TableCell>{getStatusBadge(resource.original_host_production ? 'Connected' : 'Pending DNS')}</TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSuggestPolicies(resource)}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Suggest Policies
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditResource(resource.id.toString())}>
                          <Edit className="h-4 w-4 mr-2" />
                          {resource.auto_discovered ? 'Enrich' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <TestTube className="h-4 w-4 mr-2" />
                          Test Connection
                        </DropdownMenuItem>
                        {!resource.auto_discovered && (
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PolicySuggestionsModal
        open={suggestionsModal.open}
        onOpenChange={(open) => setSuggestionsModal(prev => ({ ...prev, open }))}
        resourceName={suggestionsModal.resourceName}
        resourceUrl={suggestionsModal.resourceUrl}
        resourceId={suggestionsModal.resourceId}
      />
    </>
  );
}
