
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Server, Activity, Clock } from "lucide-react";

export function DeploymentOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deployment Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">Clustered</span>
            </div>
            <Badge variant="secondary" className="mt-2">Multi-Region</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-lg font-semibold">5 of 5</span>
            </div>
            <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
              Healthy
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">3 Regions</span>
            </div>
            <div className="mt-2 space-y-1">
              <Badge variant="outline" className="text-xs">East US</Badge>
              <Badge variant="outline" className="text-xs">West Europe</Badge>
              <Badge variant="outline" className="text-xs">Asia Pacific</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Auto-Scaling Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm">2 hours ago</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Increased by 1 node
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Node Health Status</CardTitle>
            <CardDescription>Current status of all platform instances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "PDP-East-01", status: "Healthy", region: "East US", cpu: "45%", memory: "62%" },
                { name: "PDP-East-02", status: "Healthy", region: "East US", cpu: "38%", memory: "58%" },
                { name: "PDP-West-01", status: "Healthy", region: "West Europe", cpu: "52%", memory: "65%" },
                { name: "PDP-West-02", status: "Warning", region: "West Europe", cpu: "78%", memory: "82%" },
                { name: "PDP-Asia-01", status: "Healthy", region: "Asia Pacific", cpu: "41%", memory: "59%" },
              ].map((node) => (
                <div key={node.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        node.status === 'Healthy' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <span className="font-medium">{node.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{node.region}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>CPU: {node.cpu}</span>
                    <span>Memory: {node.memory}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm">View Node Health</Button>
              <Button variant="outline" size="sm">Configure Auto-Scaling</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Distribution Map</CardTitle>
            <CardDescription>Geographic deployment overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
              <div className="text-center">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Interactive map visualization</p>
                <p className="text-xs text-muted-foreground">Showing 3 active regions</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-semibold text-green-700">2</div>
                <div className="text-xs text-green-600">East US</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-semibold text-blue-700">2</div>
                <div className="text-xs text-blue-600">West Europe</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-semibold text-purple-700">1</div>
                <div className="text-xs text-purple-600">Asia Pacific</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
