
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Server, 
  Zap, 
  Activity,
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export function CoreMetricsSnapshot() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading metrics...</div>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const metrics = [
    {
      title: "Total Policies",
      value: stats.totalPolicies.toString(),
      subtitle: `Active: ${stats.activePolicies} | Draft: ${stats.draftPolicies}`,
      icon: FileText,
      color: "text-blue-500",
      action: () => navigate("/policies")
    },
    {
      title: "Deployed Bouncers",
      value: stats.deployedPEPs.toString(),
      subtitle: `Operational: ${stats.operationalPEPs} | Warning: ${stats.warningPEPs}`,
      icon: Server,
      color: "text-green-500",
      action: () => navigate("/settings/peps"),
      hasWarning: stats.warningPEPs > 0
    },
    {
      title: "Smart Connections",
      value: stats.smartConnections.toString(),
      subtitle: `Active: ${stats.activeConnections} | Pending: ${stats.pendingConnections}`,
      icon: Zap,
      color: "text-purple-500",
      action: () => navigate("/pips")
    },
    {
      title: "Auth. Decisions (24h)",
      value: formatNumber(stats.authDecisions24h),
      subtitle: `Allowed: ${stats.allowedPercentage}% | Denied: ${stats.deniedPercentage}%`,
      icon: Activity,
      color: "text-indigo-500",
      action: () => navigate("/audit")
    }
  ];

  return (
    <Card className={cn(
      "col-span-full",
      isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className={cn(
          "text-xl",
          isDark ? "text-gray-200" : "text-[#333652]"
        )}>
          Core Authorization Metrics
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
              onClick={metric.action}
            >
              <div className={cn(
                "p-6 rounded-lg border transition-all duration-200 hover:shadow-md",
                isDark ? "bg-muted/30 hover:bg-muted/50" : "bg-muted/20 hover:bg-muted/30"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    isDark ? "bg-background" : "bg-white"
                  )}>
                    <metric.icon className={cn("h-5 w-5", metric.color)} />
                  </div>
                  {metric.hasWarning && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Warning
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className={cn(
                    "text-3xl font-bold",
                    isDark ? "text-gray-100" : "text-[#333652]"
                  )}>
                    {metric.value}
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    isDark ? "text-gray-300" : "text-[#333652]"
                  )}>
                    {metric.title}
                  </div>
                  <div className={cn(
                    "text-xs",
                    isDark ? "text-gray-400" : "text-[#333652]/70"
                  )}>
                    {metric.subtitle}
                  </div>
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
