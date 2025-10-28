
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { 
  Plus, 
  Activity, 
  Clock, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  RotateCcw, 
  RefreshCw, 
  Trash2,
  Server,
  Globe,
  Settings
} from "lucide-react";
import { OPALServerConfigDialog } from "./pdp/OPALServerConfigDialog";
import { PDPGroupsTab } from "./pdp/PDPGroupsTab";

interface PDPInstance {
  id: string;
  clientId: string;
  environment: string;
  status: "healthy" | "degraded" | "offline";
  lastCheckIn: string;
  currentPolicyBundle: string;
  policySyncStatus: "up-to-date" | "out-of-sync" | "syncing";
  activeDataVersion: string;
  avgLatency: string;
  configuredTopics: string[];
  location: string;
}

const mockPDPInstances: PDPInstance[] = [
  {
    id: "opa-prod-us-east-01",
    clientId: "client-prod-web-01",
    environment: "Production",
    status: "healthy",
    lastCheckIn: "2024-06-02 16:45:32",
    currentPolicyBundle: "v2.1.5",
    policySyncStatus: "up-to-date",
    activeDataVersion: "data-v1.2.1",
    avgLatency: "4ms",
    configuredTopics: ["web-auth", "user-permissions"],
    location: "AWS us-east-1"
  },
  {
    id: "opa-prod-us-west-01", 
    clientId: "client-prod-web-02",
    environment: "Production",
    status: "healthy",
    lastCheckIn: "2024-06-02 16:45:28",
    currentPolicyBundle: "v2.1.5",
    policySyncStatus: "up-to-date",
    activeDataVersion: "data-v1.2.1",
    avgLatency: "5ms",
    configuredTopics: ["web-auth", "api-gateway"],
    location: "AWS us-west-2"
  },
  {
    id: "opa-staging-01",
    clientId: "client-staging-01",
    environment: "Staging",
    status: "degraded",
    lastCheckIn: "2024-06-02 16:43:15",
    currentPolicyBundle: "v2.2.0-rc1",
    policySyncStatus: "out-of-sync",
    activeDataVersion: "data-v1.2.0",
    avgLatency: "12ms",
    configuredTopics: ["testing", "dev-auth"],
    location: "On-Prem DC-1"
  },
  {
    id: "opa-qa-01",
    clientId: "client-qa-01",
    environment: "QA",
    status: "healthy",
    lastCheckIn: "2024-06-02 16:45:30",
    currentPolicyBundle: "v2.2.1",
    policySyncStatus: "syncing",
    activeDataVersion: "data-v1.2.1",
    avgLatency: "7ms",
    configuredTopics: ["qa-testing"],
    location: "Azure Central US"
  }
];

export function PDPManagementPage() {
  const [showOPALConfigDialog, setShowOPALConfigDialog] = useState(false);

  const totalPDPs = mockPDPInstances.length;
  const healthyPDPs = mockPDPInstances.filter(p => p.status === "healthy").length;
  const outOfSyncPDPs = mockPDPInstances.filter(p => p.policySyncStatus === "out-of-sync").length;
  const avgPolicySyncTime = "500ms";
  const lastPolicyPush = "2024-06-02 16:30:00";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "degraded":
        return "text-yellow-600 bg-yellow-50";
      case "offline":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "offline":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSyncStatusBadge = (syncStatus: string) => {
    switch (syncStatus) {
      case "up-to-date":
        return <Badge variant="outline" className="text-green-600 border-green-200">Up-to-Date</Badge>;
      case "out-of-sync":
        return <Badge variant="outline" className="text-red-600 border-red-200">Out of Sync</Badge>;
      case "syncing":
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Syncing...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Policy Decision Points (PDPs) - Powered by OPAL</h2>
          <p className="text-muted-foreground">Monitor the health, policy, and data synchronization of your PDP (OPA) instances, managed and distributed via OPAL.</p>
        </div>
        <Button onClick={() => setShowOPALConfigDialog(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configure OPAL Servers
        </Button>
      </div>

      {/* OPAL-centric Health Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">OPAL Server</p>
                <p className="text-lg font-bold text-green-600">Online</p>
              </div>
              <Server className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected PDPs</p>
                <p className="text-2xl font-bold">{totalPDPs}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Healthy PDPs</p>
                <p className="text-2xl font-bold text-green-600">{healthyPDPs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out-of-Sync</p>
                <p className="text-2xl font-bold text-red-600">{outOfSyncPDPs}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Policy Push</p>
                <p className="text-sm font-bold">{lastPolicyPush}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Sync Time</p>
                <p className="text-2xl font-bold">{avgPolicySyncTime}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="instances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="instances">PDP Instances (OPA)</TabsTrigger>
          <TabsTrigger value="groups">PDP Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="instances">
          <Card>
            <CardHeader>
              <CardTitle>PDP Instances (Connected to OPAL)</CardTitle>
              <CardDescription>OPA instances currently subscribed to OPAL for policy and data distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PDP ID/Client ID</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Check-in</TableHead>
                    <TableHead>Policy Bundle</TableHead>
                    <TableHead>Policy Sync</TableHead>
                    <TableHead>Data Version</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Topics</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPDPInstances.map((pdp) => (
                    <TableRow key={pdp.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{pdp.id}</div>
                          <div className="text-xs text-muted-foreground">{pdp.clientId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pdp.environment}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(pdp.status)}
                          <span className={`text-sm font-medium ${getStatusColor(pdp.status)}`}>
                            {pdp.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{pdp.lastCheckIn}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pdp.currentPolicyBundle}</Badge>
                      </TableCell>
                      <TableCell>{getSyncStatusBadge(pdp.policySyncStatus)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{pdp.activeDataVersion}</Badge>
                      </TableCell>
                      <TableCell>{pdp.avgLatency}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pdp.configuredTopics.map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span className="text-sm">{pdp.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Force Policy Refresh">
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Request Data Sync">
                            <RefreshCw className="h-3 w-3" />
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

        <TabsContent value="groups">
          <PDPGroupsTab />
        </TabsContent>
      </Tabs>

      {showOPALConfigDialog && (
        <OPALServerConfigDialog
          onClose={() => setShowOPALConfigDialog(false)}
          onSave={(config) => {
            console.log("OPAL Server configuration:", config);
            setShowOPALConfigDialog(false);
          }}
        />
      )}
    </div>
  );
}
