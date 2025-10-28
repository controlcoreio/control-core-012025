
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Clock, ArrowRight, Copy } from "lucide-react";

export function DistributedTracing() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Distributed Tracing</h3>
          <p className="text-sm text-muted-foreground">Trace authorization requests through all platform components</p>
        </div>
        <Button variant="outline" size="sm">Configure Tracing</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trace Search</CardTitle>
          <CardDescription>Search for specific authorization request traces</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Request ID</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="req_abc123..." className="pl-8" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input placeholder="john.doe@company.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resource Path</label>
              <Input placeholder="/api/users/profile" />
            </div>
          </div>
          <Button>Search Traces</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Authorization Traces</CardTitle>
          <CardDescription>Latest authorization request traces with performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">trace_xyz789</TableCell>
                <TableCell>john.doe</TableCell>
                <TableCell className="font-mono text-sm">/api/users/profile</TableCell>
                <TableCell>
                  <Badge variant="outline">READ</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">PERMIT</Badge>
                </TableCell>
                <TableCell>24ms</TableCell>
                <TableCell>2024-06-02 10:15:32</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View Details</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">trace_abc456</TableCell>
                <TableCell>jane.smith</TableCell>
                <TableCell className="font-mono text-sm">/api/admin/users</TableCell>
                <TableCell>
                  <Badge variant="outline">DELETE</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">DENY</Badge>
                </TableCell>
                <TableCell>18ms</TableCell>
                <TableCell>2024-06-02 10:14:58</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View Details</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">trace_def123</TableCell>
                <TableCell>mike.johnson</TableCell>
                <TableCell className="font-mono text-sm">/api/reports/financial</TableCell>
                <TableCell>
                  <Badge variant="outline">READ</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">PERMIT</Badge>
                </TableCell>
                <TableCell>156ms</TableCell>
                <TableCell>2024-06-02 10:14:22</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View Details</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trace Flow Visualization</CardTitle>
          <CardDescription>Detailed flow of authorization request: trace_xyz789</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">PEP Request Received</div>
                  <div className="text-xs text-muted-foreground">API Gateway validates request format</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">2ms</span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">PDP Policy Evaluation</div>
                  <div className="text-xs text-muted-foreground">Evaluate against employee-data-access-v2.rego</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">8ms</span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">PIP Data Lookup</div>
                  <div className="text-xs text-muted-foreground">Fetch user attributes from HR system</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">12ms</span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-l-green-500">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Decision Response</div>
                  <div className="text-xs text-muted-foreground">PERMIT decision returned to PEP</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">2ms</span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">Total Trace Duration: 24ms</div>
              <div className="text-xs text-muted-foreground">Breakdown: PEP (2ms) → PDP (8ms) → PIP (12ms) → Response (2ms)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
