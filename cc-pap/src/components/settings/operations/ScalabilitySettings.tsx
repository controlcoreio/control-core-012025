
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, TrendingDown, Zap, Globe } from "lucide-react";

export function ScalabilitySettings() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Auto-Scaling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-lg font-semibold">Enabled</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CPU-based scaling
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-lg font-semibold">5 / 10</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active / Max nodes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <span className="text-lg font-semibold">52%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all nodes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deploy Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Multi-Region</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active-Active
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Auto-Scaling Configuration</CardTitle>
            <CardDescription>Configure automatic scaling policies and thresholds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-scaling">Auto-Scaling Enabled</Label>
                <Switch id="auto-scaling" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="scaling-metric">Scaling Metric</Label>
                <Select defaultValue="cpu">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpu">CPU Utilization</SelectItem>
                    <SelectItem value="latency">Request Latency</SelectItem>
                    <SelectItem value="requests">Concurrent Requests</SelectItem>
                    <SelectItem value="memory">Memory Utilization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scale-up">Scale Up Threshold (%)</Label>
                  <Input id="scale-up" type="number" defaultValue="70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scale-down">Scale Down Threshold (%)</Label>
                  <Input id="scale-down" type="number" defaultValue="30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-nodes">Minimum Nodes</Label>
                  <Input id="min-nodes" type="number" defaultValue="2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-nodes">Maximum Nodes</Label>
                  <Input id="max-nodes" type="number" defaultValue="10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cooldown">Cooldown Period (seconds)</Label>
                <Input id="cooldown" type="number" defaultValue="300" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm">Apply Scaling Changes</Button>
              <Button variant="outline" size="sm">Test Scaling Policy</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Deployment Strategy</CardTitle>
            <CardDescription>Configure geographic distribution and deployment preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deployment-strategy">Deployment Strategy</Label>
                <Select defaultValue="multi-region-active">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-region">Single Region</SelectItem>
                    <SelectItem value="multi-region-active">Multi-Region Active-Active</SelectItem>
                    <SelectItem value="multi-region-passive">Multi-Region Active-Passive</SelectItem>
                    <SelectItem value="closest-pep">Closest to PEP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preferred Regions</Label>
                <div className="space-y-2">
                  {[
                    { region: "East US", enabled: true },
                    { region: "West Europe", enabled: true },
                    { region: "Asia Pacific", enabled: true },
                    { region: "South America", enabled: false },
                  ].map((region) => (
                    <div key={region.region} className="flex items-center justify-between">
                      <Label htmlFor={region.region} className="text-sm">{region.region}</Label>
                      <Switch id={region.region} defaultChecked={region.enabled} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="load-balancing">Load Balancing Strategy</Label>
                <Select defaultValue="round-robin">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round-robin">Round Robin</SelectItem>
                    <SelectItem value="least-connections">Least Connections</SelectItem>
                    <SelectItem value="geographic">Geographic Proximity</SelectItem>
                    <SelectItem value="weighted">Weighted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm">Update Strategy</Button>
              <Button variant="outline" size="sm">View Historical Scaling</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scaling History</CardTitle>
          <CardDescription>Recent auto-scaling events and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { 
                time: "2 hours ago", 
                action: "Scale Up", 
                reason: "CPU > 70% for 5 minutes", 
                change: "4 → 5 nodes",
                region: "East US"
              },
              { 
                time: "6 hours ago", 
                action: "Scale Down", 
                reason: "CPU < 30% for 10 minutes", 
                change: "5 → 4 nodes",
                region: "West Europe"
              },
              { 
                time: "1 day ago", 
                action: "Scale Up", 
                reason: "Request latency > 100ms", 
                change: "3 → 4 nodes",
                region: "Asia Pacific"
              },
            ].map((event, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${
                    event.action === 'Scale Up' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <div className="font-medium">{event.action}: {event.change}</div>
                    <div className="text-sm text-muted-foreground">{event.reason}</div>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{event.region}</div>
                  <div>{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
