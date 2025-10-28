
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Shield, 
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PEPHealthData {
  id: string;
  name: string;
  status: "healthy" | "warning" | "critical";
  avgLatency: number;
  requestVolume: number;
  denialRate: number;
  predictedIssues: PredictedIssue[];
  anomalyScore: number;
}

interface PredictedIssue {
  type: string;
  description: string;
  confidence: "high" | "medium" | "low";
  timeframe: string;
  severity: "low" | "medium" | "high";
}

interface AnomalyPoint {
  timestamp: string;
  requests: number;
  denials: number;
  latency: number;
  anomaly: boolean;
}

const mockPEPData: PEPHealthData[] = [
  {
    id: "pep-1",
    name: "API Gateway PEP",
    status: "healthy",
    avgLatency: 45,
    requestVolume: 1247,
    denialRate: 2.3,
    anomalyScore: 15,
    predictedIssues: [
      {
        type: "Performance Degradation",
        description: "Latency trending upward, may exceed SLA in 18-24 hours",
        confidence: "medium",
        timeframe: "Next 24 hours",
        severity: "medium"
      }
    ]
  },
  {
    id: "pep-2", 
    name: "Database Access PEP",
    status: "warning",
    avgLatency: 125,
    requestVolume: 892,
    denialRate: 8.7,
    anomalyScore: 68,
    predictedIssues: [
      {
        type: "Connection Instability",
        description: "Intermittent connection drops detected, failure rate increasing",
        confidence: "high",
        timeframe: "Next 6 hours",
        severity: "high"
      },
      {
        type: "Resource Saturation",
        description: "Memory usage pattern suggests potential exhaustion",
        confidence: "medium", 
        timeframe: "Next 12 hours",
        severity: "medium"
      }
    ]
  },
  {
    id: "pep-3",
    name: "File Storage PEP", 
    status: "critical",
    avgLatency: 230,
    requestVolume: 445,
    denialRate: 15.2,
    anomalyScore: 89,
    predictedIssues: [
      {
        type: "Service Degradation",
        description: "Critical: Response times 300% above baseline, immediate attention required",
        confidence: "high",
        timeframe: "Immediate",
        severity: "high"
      }
    ]
  }
];

const anomalyData: AnomalyPoint[] = [
  { timestamp: "00:00", requests: 120, denials: 5, latency: 45, anomaly: false },
  { timestamp: "04:00", requests: 89, denials: 3, latency: 42, anomaly: false },
  { timestamp: "08:00", requests: 340, denials: 12, latency: 48, anomaly: false },
  { timestamp: "12:00", requests: 567, denials: 23, latency: 52, anomaly: true },
  { timestamp: "16:00", requests: 445, denials: 67, latency: 125, anomaly: true },
  { timestamp: "20:00", requests: 234, denials: 8, latency: 47, anomaly: false },
];

const getStatusColor = (status: PEPHealthData["status"]) => {
  switch (status) {
    case "healthy": return "text-green-600 bg-green-50 border-green-200";
    case "warning": return "text-yellow-600 bg-yellow-50 border-yellow-200"; 
    case "critical": return "text-red-600 bg-red-50 border-red-200";
  }
};

const getStatusIcon = (status: PEPHealthData["status"]) => {
  switch (status) {
    case "healthy": return <CheckCircle className="h-4 w-4" />;
    case "warning": return <AlertCircle className="h-4 w-4" />;
    case "critical": return <XCircle className="h-4 w-4" />;
  }
};

const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case "high": return "bg-red-100 text-red-800";
    case "medium": return "bg-yellow-100 text-yellow-800";
    case "low": return "bg-blue-100 text-blue-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export function PredictivePEPHealth() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");

  const overallHealth = mockPEPData.filter(pep => pep.status === "healthy").length;
  const avgLatency = Math.round(mockPEPData.reduce((sum, pep) => sum + pep.avgLatency, 0) / mockPEPData.length);
  const totalRequests = mockPEPData.reduce((sum, pep) => sum + pep.requestVolume, 0);
  const avgDenialRate = (mockPEPData.reduce((sum, pep) => sum + pep.denialRate, 0) / mockPEPData.length).toFixed(1);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Predictive PEP Health & Anomaly Detection</h2>
          <p className="text-muted-foreground">
            AI-powered monitoring and predictive analysis of Policy Enforcement Points
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <Activity className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{overallHealth}/3</div>
                <div className="text-sm text-muted-foreground">Healthy PEPs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{avgLatency}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{totalRequests}</div>
                <div className="text-sm text-muted-foreground">Total Requests/hr</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{avgDenialRate}%</div>
                <div className="text-sm text-muted-foreground">Avg Denial Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly Detection Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Authorization Request Anomalies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={anomalyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === "requests" ? "Requests" : name === "denials" ? "Denials" : "Latency (ms)"]}
              />
              <Area 
                type="monotone" 
                dataKey="requests" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="denials" 
                stackId="2"
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6}
              />
              <Line 
                type="monotone" 
                dataKey="latency" 
                stroke="#ff7300" 
                strokeWidth={2}
                dot={(props) => props.payload.anomaly ? 
                  <circle cx={props.cx} cy={props.cy} r={6} fill="red" stroke="red" strokeWidth={2} /> : null
                }
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="text-sm text-muted-foreground mt-2">
            Red dots indicate detected anomalies. Hover over data points for details.
          </div>
        </CardContent>
      </Card>

      {/* PEP Status List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>PEP Health Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockPEPData.map((pep) => (
              <div key={pep.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{pep.name}</h4>
                  <Badge className={cn("text-xs", getStatusColor(pep.status))}>
                    {getStatusIcon(pep.status)}
                    <span className="ml-1">{pep.status.toUpperCase()}</span>
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Latency</div>
                    <div className="font-medium">{pep.avgLatency}ms</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Requests/hr</div>
                    <div className="font-medium">{pep.requestVolume}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Denial Rate</div>
                    <div className="font-medium">{pep.denialRate}%</div>
                  </div>
                </div>
                
                {pep.anomalyScore > 50 && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Anomaly Score: {pep.anomalyScore}/100 - Unusual patterns detected
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Predictive Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockPEPData.flatMap(pep => 
              pep.predictedIssues.map((issue, idx) => (
                <div key={`${pep.id}-${idx}`} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{issue.type}</h4>
                      <div className="text-xs text-muted-foreground">{pep.name}</div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className={getConfidenceColor(issue.confidence)}>
                        {issue.confidence}
                      </Badge>
                      <Badge variant="outline" className={getConfidenceColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {issue.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Expected: {issue.timeframe}
                    </div>
                    <Button size="sm" variant="outline">
                      Investigate
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
