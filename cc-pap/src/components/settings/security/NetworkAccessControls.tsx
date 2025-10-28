
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Globe, Lock, Plus, Trash2 } from "lucide-react";

export function NetworkAccessControls() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Ingress Access Control
            </CardTitle>
            <CardDescription>Configure IP allowlists for platform access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ip-restriction">IP Restriction Enabled</Label>
              <Switch id="ip-restriction" defaultChecked />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Add IP Range/CIDR</Label>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Input placeholder="192.168.1.0/24" className="flex-1" />
                <Button size="sm">Add</Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Allowed IP Ranges</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                    <span className="font-mono text-sm">10.0.0.0/8</span>
                    <span className="text-xs text-muted-foreground">Corporate Network</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                    <span className="font-mono text-sm">203.0.113.0/24</span>
                    <span className="text-xs text-muted-foreground">VPN Gateway</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              Egress Control
            </CardTitle>
            <CardDescription>Control outbound connections from platform components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="egress-control">Egress Filtering Enabled</Label>
              <Switch id="egress-control" defaultChecked />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Allowed Destinations</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">HTTPS</Badge>
                    <span className="font-mono text-sm">*.company.com</span>
                    <span className="text-xs text-muted-foreground">Internal APIs</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">HTTPS</Badge>
                    <span className="font-mono text-sm">api.slack.com</span>
                    <span className="text-xs text-muted-foreground">Notifications</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">HTTPS</Badge>
                    <span className="font-mono text-sm">events.pagerduty.com</span>
                    <span className="text-xs text-muted-foreground">Alerting</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <Button size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Egress Rule
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-600" />
            Private Endpoint Configuration
          </CardTitle>
          <CardDescription>Configure private connectivity for cloud deployments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="private-endpoints">Private Endpoints Enabled</Label>
                <Switch id="private-endpoints" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="service-mesh">Service Mesh Integration</Label>
                <Switch id="service-mesh" />
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Private Endpoint Status</h4>
              <p className="text-sm text-purple-700 mb-3">
                Private endpoints are not currently configured. All communication is over public internet with TLS encryption.
              </p>
              <Button size="sm">Configure Private Endpoints</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Endpoint Type</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Policy Administration API</TableCell>
                  <TableCell>
                    <Badge variant="outline">Public</Badge>
                  </TableCell>
                  <TableCell>Internet</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Configure Private</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Policy Decision API</TableCell>
                  <TableCell>
                    <Badge variant="outline">Public</Badge>
                  </TableCell>
                  <TableCell>Internet</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Configure Private</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Metrics & Monitoring</TableCell>
                  <TableCell>
                    <Badge variant="outline">Public</Badge>
                  </TableCell>
                  <TableCell>Internet</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Configure Private</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Network Security Best Practices</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Use private endpoints for all internal communication when possible</li>
                <li>• Implement network segmentation between different platform components</li>
                <li>• Regularly review and audit network access logs</li>
                <li>• Consider implementing a Web Application Firewall (WAF) for additional protection</li>
                <li>• Enable DDoS protection for public-facing endpoints</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
