
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Download, Filter } from "lucide-react";

export function PlatformLogging() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Centralized Platform Logging</h3>
          <p className="text-sm text-muted-foreground">Real-time logs from all platform components with filtering and export capabilities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" size="sm">Configure Retention</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Log Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Log Level</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">ERROR</SelectItem>
                  <SelectItem value="warn">WARN</SelectItem>
                  <SelectItem value="info">INFO</SelectItem>
                  <SelectItem value="debug">DEBUG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Component</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Components</SelectItem>
                  <SelectItem value="pdp">Policy Decision Point</SelectItem>
                  <SelectItem value="pap">Policy Admin Point</SelectItem>
                  <SelectItem value="pip">Policy Info Points</SelectItem>
                  <SelectItem value="policy-store">Policy Store</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select defaultValue="1h">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5m">Last 5 minutes</SelectItem>
                  <SelectItem value="1h">Last hour</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Live Log Stream
            </CardTitle>
            <CardDescription>Real-time platform logs (auto-refreshing)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg h-96 overflow-y-auto">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">2024-06-02 10:15:32</span>
                  <Badge variant="outline" className="bg-blue-900 text-blue-300 border-blue-600">INFO</Badge>
                  <span className="text-blue-400">[PDP]</span>
                  <span>Authorization request processed successfully - user: john.doe, resource: /api/users, action: read, decision: PERMIT</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">2024-06-02 10:15:31</span>
                  <Badge variant="outline" className="bg-yellow-900 text-yellow-300 border-yellow-600">WARN</Badge>
                  <span className="text-yellow-400">[PIP]</span>
                  <span>External data source latency high: 150ms for HR-DB connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">2024-06-02 10:15:30</span>
                  <Badge variant="outline" className="bg-blue-900 text-blue-300 border-blue-600">INFO</Badge>
                  <span className="text-blue-400">[PAP]</span>
                  <span>Policy updated: employee-data-access-v2.rego deployed to production</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">2024-06-02 10:15:29</span>
                  <Badge variant="outline" className="bg-red-900 text-red-300 border-red-600">ERROR</Badge>
                  <span className="text-red-400">[POLICY-STORE]</span>
                  <span>Failed to replicate policy to secondary node: connection timeout after 5000ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">2024-06-02 10:15:28</span>
                  <Badge variant="outline" className="bg-blue-900 text-blue-300 border-blue-600">INFO</Badge>
                  <span className="text-blue-400">[PDP]</span>
                  <span>Cache hit for policy evaluation: employee-data-access-v2</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Log Statistics</CardTitle>
            <CardDescription>Log volume and error rates over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Log Entries</span>
                <span className="font-medium">2,847,392</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Error Rate</span>
                <span className="font-medium text-red-600">0.03%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Warning Rate</span>
                <span className="font-medium text-yellow-600">0.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Most Active Component</span>
                <span className="font-medium">PDP (68%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Retention Settings</CardTitle>
            <CardDescription>Configure log storage and retention policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Current Storage Used</span>
                <span className="font-medium">142 GB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Retention Period</span>
                <span className="font-medium">90 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Compression Enabled</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Yes</Badge>
              </div>
              <Button size="sm" className="w-full">Configure Retention Policy</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
