
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  FileCheck, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  ExternalLink 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";

export function PlatformMetricsExplained() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const healthFactors = [
    {
      title: "Least Privilege Score",
      weight: "30%",
      description: "Assesses how closely your policies adhere to least privilege principles, identifying overly permissive rules based on actual usage.",
      icon: Shield,
      color: "text-blue-500"
    },
    {
      title: "Policy Coverage",
      weight: "25%", 
      description: "Measures the percentage of critical assets and high-risk applications that are actively protected by your policies.",
      icon: FileCheck,
      color: "text-green-500"
    },
    {
      title: "PEP Operational Health",
      weight: "20%",
      description: "Reflects the uptime, performance (latency), and connectivity of all active PEPs (both deployed agents and Smart Connections).",
      icon: Activity,
      color: "text-purple-500"
    },
    {
      title: "Compliance & Audit Adherence",
      weight: "15%",
      description: "Evaluates policy adherence to defined compliance standards and the integrity/completeness of authorization audit logs.",
      icon: FileCheck,
      color: "text-indigo-500"
    },
    {
      title: "Anomaly Detection & Threat Posture",
      weight: "10%",
      description: "Incorporates AI-driven insights from detected unusual authorization patterns or potential policy conflicts.",
      icon: AlertTriangle,
      color: "text-amber-500"
    }
  ];

  return (
    <Card className={cn(
      isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
    )}>
      <CardHeader>
        <CardTitle className={cn(
          "text-xl",
          isDark ? "text-gray-200" : "text-[#333652]"
        )}>
          Platform Metrics Explained
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className={cn(
            "text-lg font-semibold mb-3",
            isDark ? "text-gray-200" : "text-[#333652]"
          )}>
            Understanding Your Authorization Health Score
          </h3>
          <p className={cn(
            "text-sm mb-4",
            isDark ? "text-gray-300" : "text-[#333652]/80"
          )}>
            Your Authorization Health Score provides a real-time, aggregated view of your organization's authorization posture, 
            helping you assess overall security, efficiency, and compliance. It's calculated dynamically based on a weighted 
            average of key factors:
          </p>
        </div>

        <div className="space-y-4">
          {healthFactors.map((factor, index) => (
            <div key={index} className={cn(
              "p-4 rounded-lg border",
              isDark ? "bg-muted/30" : "bg-muted/20"
            )}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center mt-1",
                  isDark ? "bg-background" : "bg-white"
                )}>
                  <factor.icon className={cn("h-4 w-4", factor.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={cn(
                      "font-medium",
                      isDark ? "text-gray-200" : "text-[#333652]"
                    )}>
                      {factor.title}
                    </h4>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      isDark ? "text-gray-300" : "text-[#333652]/70"
                    )}>
                      {factor.weight} Weight
                    </Badge>
                  </div>
                  <p className={cn(
                    "text-sm",
                    isDark ? "text-gray-400" : "text-[#333652]/70"
                  )}>
                    {factor.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={() => navigate("/posture-report")}
            className="w-full"
            variant="outline"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View Full Authorization Posture Report
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
