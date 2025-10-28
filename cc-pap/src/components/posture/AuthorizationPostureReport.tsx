
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  FileCheck, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  Download,
  Calendar,
  ArrowRight,
  Eye,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function AuthorizationPostureReport() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("7d");

  const overallScore = 92;
  const lastUpdated = "June 1, 2025, 7:30 PM EDT";

  const factorData = [
    {
      title: "Least Privilege Score",
      score: 85,
      status: "Needs Improvement",
      weight: 30,
      metrics: [
        { label: "Overly Permissive Policies", value: "5", type: "warning" },
        { label: "Recommended Restrictions", value: "12", type: "info" },
        { label: "Policies Following Best Practices", value: "88%", type: "success" }
      ],
      trend: [82, 83, 84, 83, 85, 85, 85],
      icon: Shield,
      color: "text-blue-500",
      action: () => navigate("/analysis?tab=smart-policies")
    },
    {
      title: "Policy Coverage",
      score: 95,
      status: "Excellent",
      weight: 25,
      metrics: [
        { label: "Protected Critical Assets", value: "95%", type: "success" },
        { label: "High-Risk Apps Covered", value: "22/23", type: "success" },
        { label: "Uncovered Resources", value: "3", type: "warning" }
      ],
      trend: [92, 93, 94, 95, 95, 95, 95],
      icon: FileCheck,
      color: "text-green-500",
      action: () => navigate("/policies")
    },
    {
      title: "PEP Operational Health",
      score: 98,
      status: "Excellent",
      weight: 20,
      metrics: [
        { label: "PEP Uptime", value: "99.9%", type: "success" },
        { label: "Average Latency", value: "12ms", type: "success" },
        { label: "Failed Health Checks", value: "0", type: "success" }
      ],
      trend: [96, 97, 98, 97, 98, 98, 98],
      icon: Activity,
      color: "text-purple-500",
      action: () => navigate("/settings/pep")
    },
    {
      title: "Compliance & Audit Adherence",
      score: 88,
      status: "Good",
      weight: 15,
      metrics: [
        { label: "Standards Compliance", value: "88%", type: "success" },
        { label: "Audit Log Coverage", value: "99.8%", type: "success" },
        { label: "Policy Violations", value: "2", type: "warning" }
      ],
      trend: [85, 86, 87, 88, 88, 88, 88],
      icon: FileCheck,
      color: "text-indigo-500",
      action: () => navigate("/audit")
    },
    {
      title: "Anomaly Detection & Threat Posture",
      score: 92,
      status: "Good",
      weight: 10,
      metrics: [
        { label: "Anomalies Detected", value: "3", type: "info" },
        { label: "False Positive Rate", value: "0.1%", type: "success" },
        { label: "Threat Patterns Blocked", value: "15", type: "success" }
      ],
      trend: [90, 91, 92, 91, 92, 92, 92],
      icon: AlertTriangle,
      color: "text-amber-500",
      action: () => navigate("/audit")
    }
  ];

  const historicalData = [
    { date: "May 25", score: 88, events: [] },
    { date: "May 26", score: 89, events: [] },
    { date: "May 27", score: 90, events: ["Policy Deployment"] },
    { date: "May 28", score: 91, events: [] },
    { date: "May 29", score: 90, events: [] },
    { date: "May 30", score: 91, events: [] },
    { date: "Jun 1", score: 92, events: ["PEP Optimization"] }
  ];

  const recommendations = [
    {
      impact: "High Impact",
      title: "Review and restrict 'AllDataAccess' policy permissions",
      description: "This policy grants excessive permissions beyond typical usage patterns.",
      action: "Policy Editor",
      priority: "critical"
    },
    {
      impact: "Medium Impact", 
      title: "Enable Smart Connections for 3 unprotected APIs",
      description: "Critical APIs detected without authorization enforcement.",
      action: "PEP Management",
      priority: "high"
    },
    {
      impact: "Medium Impact",
      title: "Address 2 compliance violations in financial data policies",
      description: "SOX compliance gaps identified in data access policies.",
      action: "Audit Logs",
      priority: "medium"
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-50 border-green-200";
    if (score >= 70) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getMetricColor = (type: string) => {
    switch (type) {
      case "success": return "text-green-600 bg-green-50 border-green-200";
      case "warning": return "text-amber-600 bg-amber-50 border-amber-200";
      case "info": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", 
            isDark ? "text-gray-100" : "text-[#333652]")}>
            Full Authorization Posture Report
          </h1>
          <p className={cn(
            "text-sm mt-1",
            isDark ? "text-gray-300" : "text-[#333652]/70"
          )}>
            Data as of: {lastUpdated}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card className={cn(
        "relative overflow-hidden",
        isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className={cn(
                "text-6xl font-bold mb-2",
                getScoreColor(overallScore)
              )}>
                {overallScore}
              </div>
              <Badge variant="outline" className={cn(getScoreBgColor(overallScore), getScoreColor(overallScore))}>
                <Shield className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            </div>
            <div className="flex-1 ml-8">
              <h3 className={cn(
                "text-xl font-semibold mb-4",
                isDark ? "text-gray-200" : "text-[#333652]"
              )}>
                Score Breakdown by Factor
              </h3>
              <div className="space-y-2">
                {factorData.map((factor, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <factor.icon className={cn("h-4 w-4", factor.color)} />
                    <span className="text-sm font-medium flex-1">{factor.title}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className={cn("h-2 rounded-full", 
                            factor.score >= 90 ? "bg-green-500" : 
                            factor.score >= 70 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{factor.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Factor Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {factorData.map((factor, index) => (
          <Card key={index} className={cn(
            isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
          )}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <factor.icon className={cn("h-5 w-5", factor.color)} />
                  <CardTitle className={cn(
                    "text-lg",
                    isDark ? "text-gray-200" : "text-[#333652]"
                  )}>
                    {factor.title}
                  </CardTitle>
                </div>
                <Badge variant="outline" className={cn(getScoreBgColor(factor.score), getScoreColor(factor.score))}>
                  {factor.score}% - {factor.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="space-y-2">
                <h4 className={cn(
                  "text-sm font-semibold",
                  isDark ? "text-gray-200" : "text-[#333652]"
                )}>
                  Key Metrics
                </h4>
                {factor.metrics.map((metric, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{metric.label}</span>
                    <Badge variant="outline" className={cn("text-xs", getMetricColor(metric.type))}>
                      {metric.value}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Trend */}
              <div className="space-y-2">
                <h4 className={cn(
                  "text-sm font-semibold",
                  isDark ? "text-gray-200" : "text-[#333652]"
                )}>
                  7-Day Trend
                </h4>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={factor.trend.map((score, i) => ({ day: i + 1, score }))}>
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke={factor.score >= 90 ? "#10b981" : factor.score >= 70 ? "#f59e0b" : "#ef4444"}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                onClick={factor.action}
                variant="outline" 
                className="w-full"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Historical Trends */}
      <Card className={cn(
        isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            "text-xl",
            isDark ? "text-gray-200" : "text-[#333652]"
          )}>
            Historical Trends & Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[80, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className={cn(
        isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            "text-xl",
            isDark ? "text-gray-200" : "text-[#333652]"
          )}>
            Actionable Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className={cn(
                "p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                isDark ? "bg-muted/30" : "bg-muted/20"
              )}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(rec.priority))}>
                        {rec.impact}
                      </Badge>
                    </div>
                    <h4 className={cn(
                      "font-medium mb-1",
                      isDark ? "text-gray-200" : "text-[#333652]"
                    )}>
                      {rec.title}
                    </h4>
                    <p className={cn(
                      "text-sm mb-2",
                      isDark ? "text-gray-400" : "text-[#333652]/70"
                    )}>
                      {rec.description}
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      → Go to {rec.action}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
