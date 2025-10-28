
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Eye, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export function AuthorizationHealthScore() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { stats, isLoading } = useDashboardStats();

  // Calculate health score from real data
  const calculateHealthScore = () => {
    if (isLoading) return 0;
    
    // Health score based on:
    // - Active policies (40%)
    // - Operational bouncers (40%) 
    // - Smart connections (20%)
    const policyScore = stats.totalPolicies > 0 ? 40 : 0;
    const bouncerScore = stats.deployedPEPs > 0 && stats.operationalPEPs === stats.deployedPEPs ? 40 : 
                         stats.deployedPEPs > 0 ? 20 : 0;
    const connectionScore = stats.smartConnections > 0 && stats.activeConnections === stats.smartConnections ? 20 :
                           stats.smartConnections > 0 ? 10 : 0;
    
    return policyScore + bouncerScore + connectionScore;
  };

  const healthScore = calculateHealthScore();
  const healthStatus = healthScore >= 90 ? "Healthy" : healthScore >= 70 ? "Fair" : healthScore > 0 ? "Needs Attention" : "Not Configured";
  
  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score > 0) return "text-orange-600";
    return "text-gray-600";
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 90) return "bg-green-50 border-green-200";
    if (score >= 70) return "bg-yellow-50 border-yellow-200";
    if (score > 0) return "bg-orange-50 border-orange-200";
    return "bg-gray-50 border-gray-200";
  };

  // Calculate coverage from real data
  const policyCount = stats.totalPolicies || 0;
  const bouncerUptime = stats.deployedPEPs > 0 && stats.operationalPEPs === stats.deployedPEPs ? 100 : 
                        stats.deployedPEPs > 0 ? Math.round((stats.operationalPEPs / stats.deployedPEPs) * 100) : 0;

  const driverMetrics = [
    { label: "Active Policies", value: isLoading ? "..." : policyCount.toString(), icon: Shield },
    { label: "Operational Bouncers", value: isLoading ? "..." : `${stats.operationalPEPs}/${stats.deployedPEPs}`, icon: CheckCircle },
    { label: "Bouncer Uptime", value: isLoading ? "..." : `${bouncerUptime}%`, icon: TrendingUp }
  ];

  const handleViewReport = () => {
    navigate("/posture-report");
  };

  return (
    <Card className={cn(
      "relative overflow-hidden",
      isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-xl",
            isDark ? "text-gray-200" : "text-[#333652]"
          )}>
            Authorization Health Score
          </CardTitle>
          <Badge variant="outline" className={cn(getHealthBgColor(healthScore), getHealthColor(healthScore))}>
            <Shield className="h-3 w-3 mr-1" />
            {healthStatus}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Score Display */}
        <div className="text-center space-y-2">
          <div className={cn(
            "text-6xl font-bold",
            getHealthColor(healthScore),
            isDark ? "text-green-400" : ""
          )}>
            {healthScore}
          </div>
          <div className={cn(
            "text-sm font-medium",
            isDark ? "text-gray-300" : "text-[#333652]/70"
          )}>
            Overall Authorization Health
          </div>
        </div>

        {/* Driver Metrics */}
        <div className="space-y-3">
          <h4 className={cn(
            "text-sm font-semibold",
            isDark ? "text-gray-200" : "text-[#333652]"
          )}>
            Key Health Drivers
          </h4>
          <div className="grid gap-2">
            {driverMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {metric.value}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full" variant="outline" onClick={handleViewReport}>
          <Eye className="h-4 w-4 mr-2" />
          View Full Authorization Posture Report
        </Button>
      </CardContent>
    </Card>
  );
}
