
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
import { ChevronDown, Globe, User, Shield, Eye } from "lucide-react";

// Mock current user - in a real app this would come from auth context
const currentUser = {
  role: "Policy Manager", // Could be "Admin", "Policy Manager", or "Viewer"
};

export function ScopeIndicator() {
  const [currentView, setCurrentView] = useState("All Policies");

  const isAdmin = currentUser.role === "Admin";
  const isPolicyManager = currentUser.role === "Policy Manager";
  const isViewer = currentUser.role === "Viewer";

  const getViewIcon = () => {
    if (currentView === "All Policies") return <Globe className="h-4 w-4" />;
    if (currentView === "My Policies") return <User className="h-4 w-4" />;
    return <Globe className="h-4 w-4" />;
  };

  const getRoleIcon = () => {
    if (isAdmin) return <Shield className="h-4 w-4" />;
    if (isPolicyManager) return <User className="h-4 w-4" />;
    if (isViewer) return <Eye className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getViewText = () => {
    return `Viewing: ${currentView}`;
  };

  const getRoleVariant = () => {
    if (isAdmin) return "default";
    if (isPolicyManager) return "secondary";
    if (isViewer) return "outline";
    return "outline";
  };

  // For Viewers - Show non-interactive indicator
  if (isViewer) {
    return (
      <div className="flex items-center gap-3 px-3 py-1 bg-muted/50 rounded-md border border-blue-200">
        {getViewIcon()}
        <div className="flex flex-col">
          <span className="text-sm font-medium">{getViewText()}</span>
          <span className="text-xs text-muted-foreground">
            Read-only access to policies and logs
          </span>
        </div>
        <Badge variant={getRoleVariant()} className="text-xs">
          {currentUser.role}
        </Badge>
        {getRoleIcon()}
      </div>
    );
  }

  // Admin and Policy Manager dropdown functionality
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-3">
          {getViewIcon()}
          <span className="text-sm font-medium">{getViewText()}</span>
          <Badge variant={getRoleVariant()} className="text-xs">
            {currentUser.role}
          </Badge>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => setCurrentView("All Policies")}>
          <Globe className="h-4 w-4 mr-2" />
          All Policies
          <span className="ml-auto text-xs text-muted-foreground">Global</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrentView("My Policies")}>
          <User className="h-4 w-4 mr-2" />
          My Policies
          <span className="ml-auto text-xs text-muted-foreground">Personal</span>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCurrentView("Draft Policies")}>
              <Globe className="h-4 w-4 mr-2" />
              Draft Policies
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentView("Published Policies")}>
              <Globe className="h-4 w-4 mr-2" />
              Published Policies
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
