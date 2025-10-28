
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Database, 
  ArrowLeft,
  ArrowRight,
  Settings,
  CheckCircle,
  Info
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

const essentialPIPs = [
  {
    id: 'identity-provider',
    title: 'Identity Provider (IAM)',
    description: 'Connect your primary Identity Provider (e.g., Okta, Azure AD, G Suite) to get user attributes like roles, groups, and department.',
    icon: Shield,
    priority: 'High',
    actionLabel: 'Configure Identity Provider',
    actionPath: '/settings/integrations?tab=mcp'
  },
  {
    id: 'hr-system',
    title: 'User Directory / HR System',
    description: 'Integrate your HR system (e.g., Workday, BambooHR) to pull employee details, managers, and organizational structure.',
    icon: Users,
    priority: 'Medium',
    actionLabel: 'Configure HR System',
    actionPath: '/settings/integrations?tab=mcp'
  },
  {
    id: 'resource-database',
    title: 'Asset/Resource Database',
    description: 'Connect a database or API that holds information about your resources (e.g., data sensitivity, application owners).',
    icon: Database,
    priority: 'Medium',
    actionLabel: 'Configure Resource Data',
    actionPath: '/settings/integrations?tab=mcp'
  }
];

export function ConnectPIPsWizard() {
  const [connectedPIPs, setConnectedPIPs] = useState<string[]>([]);
  const { updateStepStatus } = useOnboardingProgress();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handlePIPConnect = (pipId: string) => {
    setConnectedPIPs(prev => [...prev, pipId]);
    // If at least one essential PIP is connected, mark step as completed
    updateStepStatus('connect-pips', 'completed');
  };

  const handleBackToGettingStarted = () => {
    navigate('/getting-started');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="ghost" size="icon" onClick={handleBackToGettingStarted}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", 
            isDark ? "text-gray-100" : "text-[#333652]")}>
            Connect Essential Data Sources
          </h1>
          <p className={cn(
            isDark ? "text-gray-300" : "text-[#333652]/70"
          )}>
            Integrate critical data sources to provide necessary context for your policies
          </p>
        </div>
      </div>

      {/* AI Enhancement Notice */}
      <Card className={cn(
        "mb-8 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20"
      )}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Info className="h-6 w-6 text-blue-500" />
            <div>
              <CardTitle className="text-blue-800 dark:text-blue-200">
                Enhanced AI Capabilities
              </CardTitle>
              <CardDescription>
                After connecting your data sources, our AI can provide smarter suggestions for policy creation and data mapping.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Essential PIPs */}
      <div className="space-y-6">
        <h2 className={cn(
          "text-xl font-semibold mb-4",
          isDark ? "text-gray-200" : "text-[#333652]"
        )}>
          Recommended Data Sources
        </h2>
        
        {essentialPIPs.map((pip) => (
          <Card
            key={pip.id}
            className={cn(
              "transition-all duration-200",
              isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20",
              connectedPIPs.includes(pip.id) && "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20"
            )}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {connectedPIPs.includes(pip.id) ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <pip.icon className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className={cn(
                      "text-lg",
                      isDark ? "text-gray-200" : "text-[#333652]"
                    )}>
                      {pip.title}
                    </CardTitle>
                    <Badge className={getPriorityColor(pip.priority)}>
                      {pip.priority} Priority
                    </Badge>
                  </div>
                  <CardDescription className="text-sm leading-relaxed">
                    {pip.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {connectedPIPs.includes(pip.id) ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={pip.actionPath}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Configuration
                      </Link>
                    </Button>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Connected
                    </Badge>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    asChild
                    onClick={() => handlePIPConnect(pip.id)}
                  >
                    <Link to={pip.actionPath}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      {pip.actionLabel}
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Explore All Data Sources */}
      <Card className={cn(
        "mt-8",
        isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            isDark ? "text-gray-200" : "text-[#333652]"
          )}>
            Need More Data Sources?
          </CardTitle>
          <CardDescription>
            Explore our full catalog of available integrations and connectors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/settings/integrations">
              <Database className="h-4 w-4 mr-2" />
              Explore All Data Sources
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Continue Button */}
      {connectedPIPs.length > 0 && (
        <div className="mt-8 text-center">
          <Button asChild>
            <Link to="/getting-started">
              <CheckCircle className="h-4 w-4 mr-2" />
              Continue to Next Step
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
