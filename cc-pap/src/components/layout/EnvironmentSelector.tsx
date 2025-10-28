
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Globe, Building, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock current user - in a real app this would come from auth context
const currentUser = {
  role: "Admin", // Could be "Admin", "Power User", or "Policy Manager"
  assignedEnvironments: ["development", "qa", "staging", "production"]
};

const environments = [
  {
    id: "development",
    name: "Development",
    color: "bg-gray-500 border-gray-600",
    description: "Development environment"
  },
  {
    id: "qa", 
    name: "QA",
    color: "bg-yellow-500 border-yellow-600",
    description: "Quality assurance environment"
  },
  {
    id: "staging",
    name: "Staging", 
    color: "bg-orange-500 border-orange-600",
    description: "Pre-production staging environment"
  },
  {
    id: "production",
    name: "Production",
    color: "bg-red-500 border-red-600", 
    description: "Live production environment"
  }
];

export function EnvironmentSelector() {
  const [currentEnvironment, setCurrentEnvironment] = useState("production");
  const { toast } = useToast();

  const isAdmin = currentUser.role === "Admin";
  const isPowerUser = currentUser.role === "Power User";
  const isPolicyManager = currentUser.role === "Policy Manager";

  const activeEnv = environments.find(env => env.id === currentEnvironment);

  const handleEnvironmentSwitch = (environmentId: string) => {
    const newEnv = environments.find(env => env.id === environmentId);
    setCurrentEnvironment(environmentId);
    
    toast({
      title: "Environment switched",
      description: `Switched to ${newEnv?.name} environment. All views are now scoped to ${newEnv?.name}.`,
      duration: 3000,
    });
  };

  // For Policy Managers - Show non-interactive environment indicator
  if (isPolicyManager) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={`${activeEnv?.color} text-white border-2 px-3 py-1 font-medium`}
        >
          <Building className="h-3 w-3 mr-1" />
          {activeEnv?.name}
        </Badge>
        <AlertTriangle className="h-4 w-4 text-orange-500" />
      </div>
    );
  }

  // For Admins and Power Users - Interactive dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`${activeEnv?.color} text-white border-2 hover:opacity-90 gap-2`}
        >
          <Globe className="h-4 w-4" />
          <span className="font-medium">{activeEnv?.name}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Switch Environment
        </div>
        <DropdownMenuSeparator />
        {environments.map((env) => (
          <DropdownMenuItem 
            key={env.id}
            onClick={() => handleEnvironmentSwitch(env.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${env.color.split(' ')[0]}`}></div>
              <div>
                <div className="font-medium">{env.name}</div>
                <div className="text-xs text-muted-foreground">{env.description}</div>
              </div>
            </div>
            {currentEnvironment === env.id && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
