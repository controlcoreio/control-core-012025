
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";

interface SidebarGroupProps {
  icon: React.ElementType;
  label: React.ReactNode;
  path: string;
  active?: boolean;
  isCollapsed?: boolean;
  isExpanded?: boolean;
  onToggleExpand: () => void;
  children?: React.ReactNode;
}

export const SidebarGroup = ({ 
  icon: Icon, 
  label, 
  path, 
  active, 
  isCollapsed, 
  isExpanded, 
  onToggleExpand,
  children 
}: SidebarGroupProps) => {
  return (
    <div className="w-full">
      <div className="flex w-full">
        <Link to={path} className={cn("w-full", isCollapsed ? "flex-1" : "flex-grow")}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 font-normal text-sidebar-foreground",
              active 
                ? "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
                : "text-sidebar-foreground hover:text-sidebar-foreground",
              isCollapsed && "justify-center p-0",
              !isCollapsed && "px-3",
              "hover:bg-sidebar-accent/10 hover:text-sidebar-foreground dark:hover:text-white"
            )}
          >
            <Icon />
            {!isCollapsed && <span>{label}</span>}
          </Button>
        </Link>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-foreground dark:hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              onToggleExpand();
            }}
          >
            {isExpanded ? (
              <EnterpriseIcon name="chevron-down" size={16} />
            ) : (
              <EnterpriseIcon name="chevron-right" size={16} />
            )}
          </Button>
        )}
      </div>
      {isExpanded && !isCollapsed && children}
    </div>
  );
};
