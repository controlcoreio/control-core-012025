
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Shield, Activity, FileX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

interface Alert {
  id: string;
  severity: "critical" | "high" | "medium";
  title: string;
  description: string;
  action: string;
  timestamp: string;
  icon: any;
}

export function CriticalAlertsWidget() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const alerts: Alert[] = [
    {
      id: "1",
      severity: "critical",
      title: "Overly Permissive Policy Detected",
      description: "Policy 'AllDataAccess' grants excessive permissions",
      action: "Review in Least Privilege Advisor",
      timestamp: "2 min ago",
      icon: Shield
    },
    {
      id: "2", 
      severity: "high",
      title: "PEP Performance Degradation",
      description: "Prod-API-Gateway-PEP reporting high latency (150ms)",
      action: "Check PEP Health Dashboard",
      timestamp: "5 min ago",
      icon: Activity
    },
    {
      id: "3",
      severity: "high", 
      title: "Anomalous Access Pattern",
      description: "Unusual login from new location for 'admin' role",
      action: "Review Audit Logs",
      timestamp: "12 min ago",
      icon: AlertTriangle
    },
    {
      id: "4",
      severity: "medium",
      title: "Incomplete Policy Testing",
      description: "2 policies lacking full test coverage",
      action: "Run Policy Analysis",
      timestamp: "1 hour ago", 
      icon: FileX
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return "🔴";
      case "high": return "🟠"; 
      case "medium": return "🟡";
      default: return "⚪";
    }
  };

  return (
    <Card className={cn(
      isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-xl",
            isDark ? "text-gray-200" : "text-[#333652]"
          )}>
            Critical Authorization Alerts
          </CardTitle>
          <Badge variant="outline" className="text-red-600 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {alerts.filter(a => a.severity === "critical" || a.severity === "high").length} High Priority
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 4).map((alert) => (
            <div key={alert.id} className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <alert.icon className={cn(
                    "h-4 w-4",
                    alert.severity === "critical" ? "text-red-500" :
                    alert.severity === "high" ? "text-orange-500" : "text-yellow-500"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={cn("text-xs", getSeverityColor(alert.severity))}>
                      {getSeverityIcon(alert.severity)} {alert.severity.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {alert.timestamp}
                    </div>
                  </div>
                  <h4 className={cn(
                    "font-medium text-sm",
                    isDark ? "text-gray-200" : "text-[#333652]"
                  )}>
                    {alert.title}
                  </h4>
                  <p className={cn(
                    "text-sm text-muted-foreground mt-1",
                    isDark ? "text-gray-400" : "text-[#333652]/70"
                  )}>
                    {alert.description}
                  </p>
                  <div className="mt-2">
                    <span className="text-xs text-primary hover:underline cursor-pointer">
                      → {alert.action}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
