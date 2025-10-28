
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  active?: boolean;
  isCollapsed?: boolean;
  indented?: boolean;
  isNew?: boolean;
}

export const SidebarItem = ({ 
  icon: Icon, 
  label, 
  path, 
  active, 
  isCollapsed, 
  indented,
  isNew
}: SidebarItemProps) => {
  return (
    <Link to={path} className="w-full">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 font-normal text-sidebar-foreground relative",
          active 
            ? "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
            : "text-sidebar-foreground hover:text-sidebar-foreground",
          isCollapsed && "justify-center p-0",
          indented && !isCollapsed && "pl-8",
          !isCollapsed && "px-3",
          "hover:bg-sidebar-accent/10 hover:text-sidebar-foreground dark:hover:text-white",
          isNew && "border border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 dark:border-orange-800 dark:bg-orange-900/20"
        )}
      >
        <Icon size={isCollapsed ? 24 : 18} />
        {!isCollapsed && (
          <div className="flex items-center justify-between w-full">
            <span>{label}</span>
            {isNew && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs px-1 py-0">
                New
              </Badge>
            )}
          </div>
        )}
      </Button>
    </Link>
  );
};
