
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Shield, 
  Settings, 
  FileBarChart, 
  BookOpen, 
  Users,
  Database,
  Zap,
  Activity,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";

export function QuickActionsPanel() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Policy Assistant",
      description: "AI-powered policy creation",
      icon: Bot,
      color: "text-sap-corporate-blue-600",
      bgColor: "bg-sap-corporate-blue-50 dark:bg-sap-corporate-blue-900/20",
      action: "/ai"
    },
    {
      title: "Authorization Audit", 
      description: "Review access patterns & events",
      icon: Shield,
      color: "text-sap-enterprise-green-600",
      bgColor: "bg-sap-enterprise-green-50 dark:bg-sap-enterprise-green-900/20",
      action: "/audit"
    },
    {
      title: "Analytics Dashboard",
      description: "Policy performance insights",
      icon: BarChart3,
      color: "text-sap-teal-600",
      bgColor: "bg-sap-teal-50 dark:bg-sap-teal-900/20",
      action: "/analysis"
    },
    {
      title: "Policy Management",
      description: "Configure access policies",
      icon: Settings,
      color: "text-sap-neutral-600",
      bgColor: "bg-sap-neutral-50 dark:bg-sap-neutral-900/20",
      action: "/policies"
    },
    {
      title: "Knowledge Base",
      description: "Best practices & documentation",
      icon: BookOpen,
      color: "text-sap-enterprise-amber-600",
      bgColor: "bg-sap-enterprise-amber-50 dark:bg-sap-enterprise-amber-900/20",
      action: "/knowledge"
    },
    {
      title: "User Administration",
      description: "Manage users & roles",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      action: "/settings/users"
    }
  ];

  const handleActionClick = (actionPath: string) => {
    navigate(actionPath);
  };

  return (
    <Card className={cn(
      "sap-card",
      isDark ? "bg-sidebar border-sidebar-border" : "bg-white border-border"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className={cn(
          "text-xl font-semibold",
          isDark ? "text-sidebar-foreground" : "text-foreground"
        )}>
          Quick Actions
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "h-auto p-4 flex flex-col items-center gap-3 hover:bg-muted/50 min-h-[120px] transition-all duration-200 border-border",
                action.bgColor,
                "hover:shadow-sap-level-1"
              )}
              onClick={() => handleActionClick(action.action)}
            >
              <div className={cn(
                "rounded-lg p-2 flex-shrink-0",
                action.bgColor.replace('50', '100').replace('900/20', '800/30')
              )}>
                <action.icon className={cn("h-6 w-6", action.color)} />
              </div>
              <div className="text-center flex-1 flex flex-col justify-center min-w-0 w-full">
                <div className="font-medium text-sm leading-tight mb-1 break-words text-wrap">
                  {action.title}
                </div>
                <div className="text-xs text-muted-foreground leading-tight break-words text-wrap hyphens-auto">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
