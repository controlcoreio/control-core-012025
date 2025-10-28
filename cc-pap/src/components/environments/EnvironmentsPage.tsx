import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Settings, 
  ChevronLeft, 
  Activity, 
  Plus, 
  Server, 
  AlertCircle,
  CheckCircle,
  Loader,
  Trash2,
  Eye,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  MOCK_ENVIRONMENTS,
  MOCK_PDPS,
  MOCK_CONTROLLED_RESOURCES,
  type MockEnvironment,
  type MockPDP,
  type MockResource
} from "@/data/mockData";

export function EnvironmentsPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('sandbox');
  const [showPDPCostModal, setShowPDPCostModal] = useState(false);
  const [showProductionWarning, setShowProductionWarning] = useState(false);
  const [resourcePDPMapping, setResourcePDPMapping] = useState<Record<string, string[]>>({
    'resource-1': ['pdp-sandbox-1', 'pdp-sandbox-2'],
    'resource-2': ['pdp-sandbox-1'],
    'resource-3': ['pdp-sandbox-2'],
    'resource-4': ['pdp-sandbox-1', 'pdp-sandbox-2']
  });
  const { toast } = useToast();

  const currentEnvPDPs = MOCK_PDPS.filter(pdp => pdp.environment === selectedEnvironment);
  const currentEnvironment = MOCK_ENVIRONMENTS.find(env => env.id === selectedEnvironment);

  const handleEnvironmentSwitch = (envId: string) => {
    if (envId === 'production') {
      setShowProductionWarning(true);
      return;
    }
    setSelectedEnvironment(envId);
  };

  const confirmProductionSwitch = () => {
    setShowProductionWarning(false);
    setSelectedEnvironment('production');
  };

  const handleAddPDP = () => {
    setShowPDPCostModal(true);
  };

  const confirmAddPDP = () => {
    setShowPDPCostModal(false);
    toast({
      title: "PDP Deployment Started",
      description: "New Policy Decision Point instance is being deployed.",
      duration: 3000,
    });
  };

  const handleResourcePDPMapping = (resourceId: string, pdpId: string, checked: boolean) => {
    setResourcePDPMapping(prev => {
      const current = prev[resourceId] || [];
      if (checked) {
        return { ...prev, [resourceId]: [...current, pdpId] };
      } else {
        return { ...prev, [resourceId]: current.filter(id => id !== pdpId) };
      }
    });
    
    toast({
      title: "Mapping Updated",
      description: "Resource to PDP mapping has been saved.",
      duration: 2000,
    });
  };

  const saveMappings = () => {
    toast({
      title: "Mappings Saved",
      description: "All resource to PDP mappings have been applied.",
      duration: 3000,
    });
  };

  const getPDPStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scaling':
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="mr-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings - Environments</h1>
            <p className="text-muted-foreground">
              Manage your deployment environments and Policy Decision Point (PDP) instances. Policies are enforced by PDPs within your chosen environment.
            </p>
          </div>
        </div>
      </div>

      {/* Environment Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Selector</CardTitle>
          <CardDescription>
            Switch between Sandbox and Production environments. All changes will apply to the selected environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {MOCK_ENVIRONMENTS.map((env) => (
              <Button
                key={env.id}
                variant={selectedEnvironment === env.id ? "default" : "outline"}
                onClick={() => handleEnvironmentSwitch(env.id)}
                className="flex-1"
              >
                <Activity className="h-4 w-4 mr-2" />
                {env.name}
                {selectedEnvironment === env.id && <Badge className="ml-2">Active</Badge>}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Your Environments Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              ControlCore operates on dedicated, highly scalable instances for each client account in the cloud. 
              Within your selected environment, policies are evaluated by Policy Decision Point (PDP) containers. 
              When you add a new Resource (Reverse Proxy, Container, Sidecar), ControlCore automatically spins up 
              additional PDP containers on your instance to handle the increased load.
            </p>
            <p className="text-sm text-blue-800 font-medium mt-2">
              Note: Adding additional PDP instances for increased capacity or redundancy may incur additional 
              infrastructure costs beyond your monthly subscription.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="environments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="environments">Environment Details</TabsTrigger>
          <TabsTrigger value="pdps">Policy Decision Points (PDPs)</TabsTrigger>
          <TabsTrigger value="mapping">Resource to PDP Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="environments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Deployment Environments</CardTitle>
              <CardDescription>
                Current: <strong>{currentEnvironment?.name}</strong> - {currentEnvironment?.description || 'Environment description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Environment Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Associated PDPs</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_ENVIRONMENTS.map((env) => (
                    <TableRow key={env.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{env.name}</div>
                          <div className="text-sm text-muted-foreground">{env.description || 'Environment description'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={env.status === 'active' ? 'default' : 'secondary'}>
                          {env.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{env.pdpCount || 0} PDPs</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnvironmentSwitch(env.id)}
                        >
                          Select Environment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdps" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Policy Decision Points (PDPs)</CardTitle>
                  <CardDescription>
                    Manage the computational units that enforce your policies within the {currentEnvironment?.name} environment
                  </CardDescription>
                </div>
                <Button onClick={handleAddPDP} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Additional PDP
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PDP ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Load</TableHead>
                    <TableHead>Associated Resources</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentEnvPDPs.map((pdp) => (
                    <TableRow key={pdp.id}>
                      <TableCell className="font-medium">{pdp.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPDPStatusIcon(pdp.status)}
                          <span className="capitalize">{pdp.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (pdp.currentLoad || 0) > 80 ? 'bg-red-500' : 
                                (pdp.currentLoad || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${pdp.currentLoad || 0}%` }}
                            />
                          </div>
                          <span className="text-sm">{pdp.currentLoad || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pdp.associatedResources || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(pdp.associatedResources || 0) === 0 && (
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resource to PDP Mapping</CardTitle>
                  <CardDescription>
                    Map your protected Resources (PEPs) to specific Policy Decision Points (PDPs) within the {currentEnvironment?.name} environment for fine-grained traffic routing and performance optimization
                  </CardDescription>
                </div>
                <Button onClick={saveMappings}>Save Mappings</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> By default, Resources are mapped to all active PDPs for balanced load. 
                    Customize mapping to isolate traffic or ensure high availability for critical Resources.
                  </p>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      {currentEnvPDPs.map((pdp) => (
                        <TableHead key={pdp.id} className="text-center">
                          {pdp.id}
                          <div className="text-xs text-muted-foreground">
                            {pdp.status} • {pdp.currentLoad || 0}%
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_CONTROLLED_RESOURCES.resources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{resource.name}</div>
                            <div className="text-sm text-muted-foreground">{resource.originalHost}</div>
                          </div>
                        </TableCell>
                        {currentEnvPDPs.map((pdp) => (
                          <TableCell key={pdp.id} className="text-center">
                            <Checkbox
                              checked={resourcePDPMapping[resource.id]?.includes(pdp.id) || false}
                              onCheckedChange={(checked) => 
                                handleResourcePDPMapping(resource.id, pdp.id, checked as boolean)
                              }
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showProductionWarning} onOpenChange={setShowProductionWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switching to Production Environment</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              You are about to switch to the Production environment. All changes, policy activations, 
              and resource configurations made here will directly impact your live systems. Ensure all 
              development and testing is completed in the Sandbox environment first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowProductionWarning(false)}>
              Cancel
            </Button>
            <Button onClick={confirmProductionSwitch}>
              Confirm & Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPDPCostModal} onOpenChange={setShowPDPCostModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Additional PDP Deployment & Costs</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Adding a new Policy Decision Point (PDP) instance will increase your environment's capacity 
              and redundancy. This will incur additional infrastructure costs beyond your monthly subscription, 
              based on usage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowPDPCostModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAddPDP}>
              Confirm & Deploy PDP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
