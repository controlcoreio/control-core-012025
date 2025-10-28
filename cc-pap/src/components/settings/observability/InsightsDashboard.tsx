
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Brain,
  Eye,
  ExternalLink
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// Mock data for the heatmap and charts
const policyHeatmapData = [
  { name: "User Access Policy", evaluations: 1250, color: "#22c55e" },
  { name: "Admin Permissions", evaluations: 890, color: "#22c55e" },
  { name: "API Gateway Policy", evaluations: 650, color: "#eab308" },
  { name: "Data Access Control", evaluations: 420, color: "#eab308" },
  { name: "Finance Dept Access", evaluations: 120, color: "#f97316" },
  { name: "Legacy System Policy", evaluations: 15, color: "#ef4444" },
];

const topDenialsData = [
  { policy: "API Rate Limiting", denials: 340 },
  { policy: "After Hours Access", denials: 180 },
  { policy: "External User Block", denials: 95 },
  { policy: "Sensitive Data Access", denials: 75 },
];

const topAllowsData = [
  { policy: "User Access Policy", allows: 2100 },
  { policy: "Public Resource Access", allows: 1850 },
  { policy: "Standard User Permissions", allows: 1200 },
  { policy: "Read-Only Access", allows: 980 },
];

const anomalyTrendData = [
  { time: "00:00", baseline: 100, actual: 105 },
  { time: "04:00", baseline: 80, actual: 85 },
  { time: "08:00", baseline: 200, actual: 195 },
  { time: "12:00", baseline: 250, actual: 310 },
  { time: "16:00", baseline: 220, actual: 285 },
  { time: "20:00", baseline: 150, actual: 180 },
];

const pipHealthData = [
  { name: "HR System (Workday)", uptime: "99.8%", status: "healthy", lag: "< 1s" },
  { name: "Identity Provider (Okta)", uptime: "99.9%", status: "healthy", lag: "< 1s" },
  { name: "Salesforce CRM", uptime: "98.5%", status: "warning", lag: "5s" },
  { name: "AWS Resource API", uptime: "99.7%", status: "healthy", lag: "2s" },
];

export function InsightsDashboard() {
  return (
    <div className="space-y-6">
      {/* Policy Utilization Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Policy Utilization Heatmap
          </CardTitle>
          <CardDescription>
            Visual representation of policy evaluation frequency across your environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {policyHeatmapData.map((policy, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                style={{ backgroundColor: `${policy.color}20`, borderColor: policy.color }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{policy.name}</h4>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: policy.color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {policy.evaluations.toLocaleString()} evaluations
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              High Usage
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Medium Usage
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Low/Unused
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Policy Denials/Allows */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Top Policy Denials
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDenialsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="policy" angle={-45} textAnchor="end" height={80} fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="denials" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Top Policy Allows
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAllowsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="policy" angle={-45} textAnchor="end" height={80} fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="allows" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Access Trend Anomalies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Access Trend Anomalies (AI-Powered)
          </CardTitle>
          <CardDescription>
            AI-detected unusual patterns in authorization decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h4 className="font-medium">Unusual Access Pattern Detected</h4>
                </div>
                <Badge variant="outline" className="text-amber-600">High Priority</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Unusual access patterns detected for 'Customer Data' policies. 40% increase in denials during business hours.
              </p>
              <div className="h-[200px] mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={anomalyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeDasharray="3 3" name="Baseline" />
                    <Line type="monotone" dataKey="actual" stroke="#f97316" strokeWidth={2} name="Actual" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">AI Recommendation</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  AI suggests reviewing policy 'P-007' and tightening conditions for customer data access during peak hours.
                </p>
                <Button size="sm" variant="outline">View Policy P-007</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Conflict & Redundancy Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Policy Conflict & Redundancy Insights (AI-Powered)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">3</div>
              <div className="text-sm text-muted-foreground">Active Conflicts</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">5</div>
              <div className="text-sm text-muted-foreground">Redundant Policies</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">2</div>
              <div className="text-sm text-muted-foreground">Least Privilege Opportunities</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">AI Suggestion</span>
                </div>
                <Badge variant="secondary">Conflict Resolution</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Resolve Conflict 'C-001' by merging 'Finance-Dept-Access' and 'Expense-Approval' policies. 
                Both policies target the same resources with overlapping conditions.
              </p>
              <Button size="sm" variant="outline">
                <Eye className="h-3 w-3 mr-1" />
                View Resolution Guide
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Signal Reliability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Information Signal Reliability
          </CardTitle>
          <CardDescription>
            Health indicators for critical Policy Information Points (PIPs)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipHealthData.map((pip, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    pip.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <h4 className="font-medium">{pip.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pip.uptime} Uptime • Data Sync Lag: {pip.lag}
                    </p>
                  </div>
                </div>
                <Badge variant={pip.status === 'healthy' ? 'default' : 'secondary'}>
                  {pip.status === 'healthy' ? 'Healthy' : 'Warning'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
