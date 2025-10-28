
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Server, 
  CheckCircle, 
  AlertTriangle, 
  X,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";

export function IntegrationStatusSummary() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const integrations = [
    {
      title: "PIP Integration Status",
      status: "healthy",
      statusText: "All PIPs Healthy",
      metric: "Total PIPs: 8",
      icon: Database,
      action: () => navigate("/settings"),
      details: "Last sync: 2 min ago"
    },
    {
      title: "External PEP Integration",
      status: "warning",
      statusText: "1 Service Disconnected",
      metric: "Connected: 5/6",
      icon: Server,
      action: () => navigate("/settings/pep"),
      details: "SIEM Gateway offline"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return "text-green-600 bg-green-50 border-green-200";
      case 'warning':
        return "text-amber-600 bg-amber-50 border-amber-200";
      case 'error':
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  return (
    <Card className={cn(
      isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className={cn(
          "text-xl",
          isDark ? "text-gray-200" : "text-[#333652]"
        )}>
          Integration Status Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {integrations.map((integration, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm",
              isDark ? "bg-muted/30 hover:bg-muted/50" : "bg-muted/20 hover:bg-muted/30"
            )}
            onClick={integration.action}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  isDark ? "bg-background" : "bg-white"
                )}>
                  <integration.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h4 className={cn(
                    "font-medium text-sm",
                    isDark ? "text-gray-200" : "text-[#333652]"
                  )}>
                    {integration.title}
                  </h4>
                  <p className={cn(
                    "text-xs",
                    isDark ? "text-gray-400" : "text-[#333652]/70"
                  )}>
                    {integration.details}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(integration.status)}
                <span className={cn(
                  "text-sm font-medium",
                  isDark ? "text-gray-300" : "text-[#333652]"
                )}>
                  {integration.statusText}
                </span>
              </div>
              <Badge variant="outline" className={cn("text-xs", getStatusColor(integration.status))}>
                {integration.metric}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
