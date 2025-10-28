
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import pipService from "@/services/pipService";
import { 
  Database,
  Users,
  Building,
  Calendar,
  MapPin,
  Shield,
  ArrowRight,
  Clock,
  Plus,
  Key,
  Server,
  FileText,
  Package,
  Headphones,
  Cloud,
  Settings,
  BarChart3,
  Globe,
  Folder
} from "lucide-react";
import { AddInformationSourceWizard } from "@/components/pips/AddInformationSourceWizard";

interface DataSourcesStepProps {
  onComplete: (data: any) => void;
  onNext: () => void;
}

export function DataSourcesStep({ onComplete, onNext }: DataSourcesStepProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [configuredSources, setConfiguredSources] = useState<any[]>([]);
  const [selectedSourceType, setSelectedSourceType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const dataSources = [
    // Identity & HR Category
    {
      id: 'identity',
      title: 'Identity Provider (IAM)',
      description: 'Connect your primary Identity Provider for user roles, groups, and authentication context',
      icon: Shield,
      category: 'Identity',
      type: 'identity'
    },
    {
      id: 'hr',
      title: 'User Directory / HR System',
      description: 'Integrate HR or user directories for employee details, departments, and managers',
      icon: Users,
      category: 'Identity',
      type: 'hr'
    },
    
    // Business Apps Category
    {
      id: 'crm',
      title: 'CRM System',
      description: 'Pull customer-specific attributes like customer tier, region, or sales representative ownership',
      icon: Building,
      category: 'Business',
      type: 'crm'
    },
    {
      id: 'erp',
      title: 'ERP System',
      description: 'Connect to your ERP system for financial, project, cost center, and organizational unit data',
      icon: Package,
      category: 'Business',
      type: 'erp'
    },
    {
      id: 'csm',
      title: 'CSM / Ticketing System',
      description: 'Pull context from ticketing systems like ticket status, urgency, or assignee for incident-based access control',
      icon: Headphones,
      category: 'Business',
      type: 'csm'
    },
    
    // Cloud & Infrastructure Category
    {
      id: 'cloud',
      title: 'Cloud Provider Metadata',
      description: 'Fetch real-time metadata and tags about your cloud resources (VMs, storage buckets, functions)',
      icon: Cloud,
      category: 'Infrastructure',
      type: 'cloud'
    },
    {
      id: 'cmdb',
      title: 'Configuration Management DB',
      description: 'Integrate with your CMDB for detailed asset information, ownership, and configuration item relationships',
      icon: Settings,
      category: 'Infrastructure',
      type: 'cmdb'
    },
    {
      id: 'database',
      title: 'Database',
      description: 'Connect to custom databases containing application-specific data or resource attributes',
      icon: Database,
      category: 'Infrastructure',
      type: 'database'
    },
    {
      id: 'warehouse',
      title: 'Data Warehouse / Lake',
      description: 'Connect to centralized data warehouses or lakes for aggregated business intelligence data',
      icon: BarChart3,
      category: 'Infrastructure',
      type: 'warehouse'
    },
    
    // Custom Category
    {
      id: 'api',
      title: 'Custom API / Webhook',
      description: 'Integrate with any custom internal or external API endpoints for dynamic data',
      icon: Globe,
      category: 'Custom',
      type: 'api'
    },
    {
      id: 'documents',
      title: 'Document/File Storage',
      description: 'Retrieve metadata about documents, files, or folders (e.g., sensitivity labels, author, last modified)',
      icon: Folder,
      category: 'Custom',
      type: 'documents'
    },
    {
      id: 'static',
      title: 'Static Data',
      description: 'Upload static files or provide URLs for non-changing policy data',
      icon: FileText,
      category: 'Custom',
      type: 'static'
    }
  ];

  const handleAddSource = (sourceId: string) => {
    const source = dataSources.find(s => s.id === sourceId);
    if (source) {
      setSelectedSourceType(source.type);
      setIsWizardOpen(true);
    }
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
  };

  const handleWizardAdd = async (newSource: any) => {
    try {
      setIsLoading(true);
      const savedConnection = await pipService.createConnection({
        name: newSource.name,
        description: newSource.description,
        connection_type: newSource.selectedType,
        provider: newSource.provider || newSource.selectedType,
        configuration: newSource.oauthConfig || newSource.dbConfig || newSource.configuration,
        credentials: newSource.credentials,
        health_check_url: newSource.endpoint,
        sync_enabled: true,
        sync_frequency: newSource.updateFrequency || 'hourly'
      });
      setConfiguredSources(prev => [...prev, savedConnection]);
      setIsWizardOpen(false);
      toast({ title: "Success", description: "Data source connected successfully" });
    } catch (error) {
      console.error("Failed to save connection:", error);
      toast({ title: "Error", description: "Failed to save data source", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    const data = {
      configuredSources,
      timestamp: new Date().toISOString()
    };
    
    onComplete(data);
    onNext();
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Connect external data sources to enable richer, context-aware policies that can make decisions based on real-time information.
        </p>
      </div>

      {/* Configured Sources */}
      {configuredSources.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Configured Data Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configuredSources.map((source, index) => (
              <Card key={index} className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Database className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{source.name}</CardTitle>
                        <CardDescription className="text-xs">{source.type}</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      Connected
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Data Sources */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Available Data Sources</h3>
          <p className="text-muted-foreground">
            Connect data sources to enhance your policy decisions with real-time context
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((source) => (
            <Card 
              key={source.id}
              className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => handleAddSource(source.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <source.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-sm font-medium">{source.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {source.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {source.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-8">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Enhanced Policy Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Real-time Context</h4>
                  <p className="text-sm text-muted-foreground">
                    Make authorization decisions based on current user status, business relationships, and environmental factors.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Dynamic Policies</h4>
                  <p className="text-sm text-muted-foreground">
                    Policies that adapt based on changing conditions like business hours, user location, or threat levels.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Compliance Ready</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically enforce compliance rules based on data classification and regulatory requirements.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Risk-Based Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Adjust access levels based on risk scores and security intelligence feeds.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation - handled by parent wizard */}

      {/* Add Information Source Wizard */}
      <AddInformationSourceWizard 
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        onAdd={handleWizardAdd}
        preselectedType={selectedSourceType}
      />
    </div>
  );
}
