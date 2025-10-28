
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Shield, Database, Clock, AlertTriangle } from "lucide-react";

export function HADRConfiguration() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cluster Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-lg font-semibold">Healthy</span>
            </div>
            <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
              All Nodes Active
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Replication Lag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-lg font-semibold">&lt; 50ms</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Policy Store Sync
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failover Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-lg font-semibold">Automated</span>
            </div>
            <Badge variant="secondary" className="mt-2">Active-Passive</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last DR Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm">2024-05-28</span>
            </div>
            <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
              Passed
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>HA/DR Configuration</CardTitle>
            <CardDescription>Configure high availability and disaster recovery settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-failover">Automated Failover</Label>
                <Switch id="auto-failover" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="failover-mode">Failover Mode</Label>
                <Select defaultValue="active-passive">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active-passive">Active-Passive</SelectItem>
                    <SelectItem value="active-active">Active-Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rpo">RPO Target (minutes)</Label>
                  <Input id="rpo" type="number" defaultValue="5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rto">RTO Target (minutes)</Label>
                  <Input id="rto" type="number" defaultValue="15" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="replication-mode">Replication Mode</Label>
                <Select defaultValue="synchronous">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="synchronous">Synchronous</SelectItem>
                    <SelectItem value="asynchronous">Asynchronous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">Configure Replication</Button>
              <Button variant="outline" size="sm">Set Failover Preferences</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disaster Recovery Testing</CardTitle>
            <CardDescription>Validate DR procedures and recovery capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">DR Test Status</span>
                </div>
                <p className="text-sm text-blue-700">Last test completed successfully on 2024-05-28</p>
                <p className="text-xs text-blue-600 mt-1">Recovery time: 12 minutes (within RTO target)</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Test Schedule</h4>
                <div className="space-y-2">
                  <Label htmlFor="test-frequency">Test Frequency</Label>
                  <Select defaultValue="monthly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test-scope">Test Scope</Label>
                  <Select defaultValue="full">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partial">Partial Failover</SelectItem>
                      <SelectItem value="full">Full DR Simulation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm">Initiate DR Test</Button>
              <Button variant="outline" size="sm">View Test History</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Replication Status</CardTitle>
          <CardDescription>Real-time replication health across regions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { primary: "East US", replica: "West Europe", lag: "35ms", status: "Healthy", policies: "1,247" },
              { primary: "East US", replica: "Asia Pacific", lag: "78ms", status: "Healthy", policies: "1,247" },
              { primary: "West Europe", replica: "East US", lag: "42ms", status: "Healthy", policies: "1,247" },
            ].map((replication, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="font-medium">{replication.primary} → {replication.replica}</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {replication.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>Lag: {replication.lag}</span>
                  <span>Policies: {replication.policies}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
