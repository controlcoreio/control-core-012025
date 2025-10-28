
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, AlertTriangle, Filter, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import { useAuthorizationActivity } from "../../../services/useApi";

export function AuthorizationActivityChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [timeRange, setTimeRange] = useState("24h");

  // Use shared API hook for authorization activity data
  const { data: activityData, isLoading, error } = useAuthorizationActivity({ period: timeRange });

  const chartConfig = {
    requests: {
      label: "Authorization Requests (RPS)",
      color: isDark ? "#90adc6" : "#333652",
    },
    denied: {
      label: "Denied Requests (%)",
      color: "#ef4444",
    },
  };

  const timeRanges = [
    { label: "Last 24h", value: "24h" },
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" }
  ];

  // Show loading state
  if (isLoading) {
    return (
      <Card className={cn(
        "col-span-full w-full",
        isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            "text-xl",
            isDark ? "text-gray-200" : "text-[#333652]"
          )}>
            Authorization Activity Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading activity data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className={cn(
        "col-span-full w-full",
        isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            "text-xl",
            isDark ? "text-gray-200" : "text-[#333652]"
          )}>
            Authorization Activity Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load activity data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "col-span-full w-full",
      isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={cn(
              "text-xl",
              isDark ? "text-gray-200" : "text-[#333652]"
            )}>
              Authorization Activity Overview
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Real-time authorization traffic</span>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                2 Anomalies Detected
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range.value)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter Logs
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Current Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className={cn(
                "text-2xl font-bold",
                isDark ? "text-blue-400" : "text-blue-600"
              )}>
                3.2K
              </div>
              <div className="text-sm text-muted-foreground">Current RPS</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className={cn(
                "text-2xl font-bold",
                isDark ? "text-green-400" : "text-green-600"
              )}>
                97.2%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className={cn(
                "text-2xl font-bold",
                isDark ? "text-red-400" : "text-red-600"
              )}>
                2.8%
              </div>
              <div className="text-sm text-muted-foreground">Denied Rate</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className={cn(
                "text-2xl font-bold",
                isDark ? "text-amber-400" : "text-amber-600"
              )}>
              12ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Latency</div>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-64">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="requests"
                    stroke={chartConfig.requests.color}
                    strokeWidth={2}
                    dot={{ fill: chartConfig.requests.color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="denied"
                    stroke={chartConfig.denied.color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: chartConfig.denied.color, strokeWidth: 2, r: 4 }}
                  />
                  {(activityData || []).map((data, index) => 
                    data.anomaly && (
                      <ReferenceLine
                        key={index}
                        x={data.time}
                        yAxisId="left"
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        label={{ value: "Anomaly", position: "top" }}
                      />
                    )
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
