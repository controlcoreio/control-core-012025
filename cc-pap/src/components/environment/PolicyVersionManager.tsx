import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GitBranch, 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Download, 
  Upload,
  ArrowRight,
  Shield,
  Play,
  Copy,
  Trash2,
  Edit3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PolicyVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  createdAt: string;
  status: 'draft' | 'sandbox' | 'production' | 'archived';
  environment: 'sandbox' | 'production';
  changes: string[];
  isActive: boolean;
}

interface PolicyVersionManagerProps {
  policyId: string;
  currentEnvironment: 'sandbox' | 'production';
  onVersionSelect?: (version: PolicyVersion) => void;
  onVersionPromote?: (version: PolicyVersion) => void;
  onVersionRevert?: (version: PolicyVersion) => void;
}

export function PolicyVersionManager({
  policyId,
  currentEnvironment,
  onVersionSelect,
  onVersionPromote,
  onVersionRevert
}: PolicyVersionManagerProps) {
  const [versions, setVersions] = useState<PolicyVersion[]>([
    {
      id: 'v1.0.0',
      version: '1.0.0',
      name: 'Initial Policy',
      description: 'First version of the policy',
      author: 'John Doe',
      createdAt: '2025-01-27T10:30:00Z',
      status: 'production',
      environment: 'production',
      changes: ['Initial policy creation'],
      isActive: true
    },
    {
      id: 'v1.1.0',
      version: '1.1.0',
      name: 'Enhanced Security',
      description: 'Added additional security checks',
      author: 'Jane Smith',
      createdAt: '2025-01-27T09:15:00Z',
      status: 'sandbox',
      environment: 'sandbox',
      changes: ['Added authentication checks', 'Enhanced input validation'],
      isActive: false
    },
    {
      id: 'v1.2.0',
      version: '1.2.0',
      name: 'Performance Optimization',
      description: 'Optimized policy performance',
      author: 'Mike Johnson',
      createdAt: '2025-01-27T08:45:00Z',
      status: 'draft',
      environment: 'sandbox',
      changes: ['Optimized conditions', 'Reduced evaluation time'],
      isActive: false
    }
  ]);

  const [selectedVersion, setSelectedVersion] = useState<PolicyVersion | null>(null);
  const [activeTab, setActiveTab] = useState<'versions' | 'history' | 'compare'>('versions');
  const { toast } = useToast();

  const handleVersionSelect = (version: PolicyVersion) => {
    setSelectedVersion(version);
    onVersionSelect?.(version);
  };

  const handleVersionPromote = (version: PolicyVersion) => {
    onVersionPromote?.(version);
    toast({
      title: "Version Promoted",
      description: `Version ${version.version} has been promoted to ${currentEnvironment}`,
    });
  };

  const handleVersionRevert = (version: PolicyVersion) => {
    onVersionRevert?.(version);
    toast({
      title: "Version Reverted",
      description: `Reverted to version ${version.version}`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'production':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'sandbox':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'draft':
        return <Edit3 className="h-4 w-4 text-yellow-600" />;
      case 'archived':
        return <Trash2 className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'production':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'sandbox':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'archived':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getEnvironmentIcon = (environment: string) => {
    return environment === 'sandbox' ? Play : Shield;
  };

  const getEnvironmentColor = (environment: string) => {
    return environment === 'sandbox' 
      ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
      : 'text-green-600 bg-green-100 dark:bg-green-900/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Policy Versions</h3>
          <p className="text-sm text-muted-foreground">
            Manage and track policy versions across environments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'versions' | 'history' | 'compare')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="space-y-4">
          <div className="space-y-3">
            {versions.map((version) => (
              <Card key={version.id} className={`cursor-pointer transition-all hover:shadow-md ${
                selectedVersion?.id === version.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(version.status)}`}>
                      {getStatusIcon(version.status)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{version.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          v{version.version}
                        </Badge>
                        {version.isActive && (
                          <Badge className="bg-green-600">Active</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {version.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(version.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`p-1 rounded-full ${getEnvironmentColor(version.environment)}`}>
                            {version.environment === 'sandbox' ? <Play className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                          </div>
                          {version.environment}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVersionSelect(version)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      
                      {version.status === 'sandbox' && currentEnvironment === 'sandbox' && (
                        <Button
                          size="sm"
                          onClick={() => handleVersionPromote(version)}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Promote
                        </Button>
                      )}
                      
                      {version.status === 'production' && currentEnvironment === 'production' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVersionRevert(version)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Revert
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version History</CardTitle>
              <CardDescription>
                Track changes and deployments over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div key={version.id} className="flex items-start gap-3 p-3 border-l-2 border-gray-200 dark:border-gray-700">
                    <div className={`p-1 rounded-full ${getStatusColor(version.status)}`}>
                      {getStatusIcon(version.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h6 className="font-medium">{version.name}</h6>
                        <Badge variant="outline" className="text-xs">
                          v{version.version}
                        </Badge>
                        <Badge className={getStatusColor(version.status)}>
                          {version.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {version.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>By {version.author}</span>
                          <span>{new Date(version.createdAt).toLocaleString()}</span>
                          <span>Environment: {version.environment}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compare Versions</CardTitle>
              <CardDescription>
                Compare different versions of your policy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h5 className="font-medium">Select Versions to Compare</h5>
                <p className="text-sm">
                  Choose two versions from the versions tab to compare them
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
