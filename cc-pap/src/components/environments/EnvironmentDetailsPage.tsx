
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Activity, Clock, User, ArrowUpRight, Settings, Shield } from "lucide-react";

export function EnvironmentDetailsPage() {
  const { environmentId } = useParams();

  // Mock data - in real app, fetch based on environmentId
  const environment = {
    id: environmentId,
    name: "Production - US East",
    description: "Primary production environment serving US East region",
    version: "v2.1.1",
    status: "Healthy",
    healthScore: 99,
    lastDeployed: "2024-05-28 10:00",
    deployedBy: "ops.team"
  };

  const deploymentHistory = [
    {
      id: "deploy-001",
      version: "v2.1.1",
      date: "2024-05-28 10:00",
      deployedBy: "ops.team",
      status: "Success",
      duration: "12m 34s"
    },
    {
      id: "deploy-002",
      version: "v2.1.0",
      date: "2024-05-15 14:30",
      deployedBy: "jane.smith",
      status: "Success", 
      duration: "11m 45s"
    },
    {
      id: "deploy-003",
      version: "v2.0.9",
      date: "2024-05-01 09:15",
      deployedBy: "john.doe",
      status: "Success",
      duration: "13m 12s"
    }
  ];

  const platformConfig = {
    database: {
      host: "prod-db.internal.com",
      port: 5432,
      ssl: "required"
    },
    logging: {
      level: "INFO",
      retention: "90 days"
    },
    resources: {
      cpu: "4 cores",
      memory: "8 GB",
      storage: "100 GB SSD"
    },
    integrations: {
      ldap: "ldap://prod-ad.company.com",
      siem: "splunk://prod-splunk.company.com"
    }
  };

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/environments">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{environment.name}</h1>
          <p className="text-muted-foreground">{environment.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Current Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{environment.version}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Deployed {environment.lastDeployed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">{environment.healthScore}%</div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {environment.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to={`/environments/${environmentId}/promote`}>
              <Button size="sm" className="w-full">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Promote Release
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="history">Deployment History</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Environment Information</CardTitle>
                <CardDescription>Basic details and current status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Environment ID:</span>
                    <span className="text-sm font-medium">{environment.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Purpose:</span>
                    <span className="text-sm font-medium">Production</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Region:</span>
                    <span className="text-sm font-medium">US East (Virginia)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Deployment Mode:</span>
                    <span className="text-sm font-medium">High Availability</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Auto-scaling:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promotion Relationships</CardTitle>
                <CardDescription>Source and target environments for releases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Promotes From:</h4>
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Staging Environment</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Promotes To:</h4>
                    <div className="p-2 bg-muted/30 rounded text-center">
                      <span className="text-sm text-muted-foreground">End of pipeline</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(platformConfig).map(([category, config]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category} Configuration</CardTitle>
                  <CardDescription>Current {category} settings for this environment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(config as Record<string, string>).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-sm font-medium font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>Chronological list of platform deployments to this environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deploymentHistory.map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">{deployment.version}</div>
                        <div className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {deployment.date} • Duration: {deployment.duration}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <User className="h-3 w-3 inline mr-1" />
                          Deployed by {deployment.deployedBy}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {deployment.status}
                      </Badge>
                      <Button variant="ghost" size="sm">View Logs</Button>
                      {deployment.id !== "deploy-001" && (
                        <Button variant="outline" size="sm">Rollback</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Access Control
              </CardTitle>
              <CardDescription>Define which users and roles can manage this environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Environment Administrators</h4>
                  {["ops.team", "platform.admin", "john.doe"].map((user) => (
                    <div key={user} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Full Access</Badge>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mt-6">
                  <h4 className="font-medium">Deployment Permissions</h4>
                  {["DevOps Team", "Platform Team", "Security Team"].map((role) => (
                    <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Deploy Only
                        </Badge>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4">
                  <User className="h-4 w-4 mr-2" />
                  Add User/Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
