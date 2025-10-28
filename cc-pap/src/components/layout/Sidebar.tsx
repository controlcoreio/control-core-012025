
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useState } from "react";
import { navigation } from "./sidebar/nav-config";
import { SidebarItem } from "./sidebar/SidebarItem";
import { useTheme } from "@/hooks/use-theme";

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { theme } = useTheme();

  // Transform navigation structure to flat routes for easier rendering
  const flatRoutes = navigation.flatMap(section => 
    section.items.map(item => ({
      ...item,
      sectionTitle: section.title
    }))
  );

  return (
    <aside 
      className={cn(
        "flex flex-col border-r transition-all duration-300 bg-sidebar text-sidebar-foreground",
        isCollapsed ? "w-[80px]" : "w-[250px]"
      )}
    >
      <div className={cn(
        "flex items-center border-b border-sidebar-border",
        isCollapsed ? "h-14 px-4" : "h-20 px-6"
      )}>
        <div className={cn(
          "flex items-center w-full",
          isCollapsed ? "justify-between" : "justify-between"
        )}>
          <Link to="/" className={cn(
            "flex items-center",
            !isCollapsed && "flex-1 justify-center"
          )}>
            {isCollapsed ? (
              <span className="text-xl font-bold w-full text-center text-sidebar-foreground">CC</span>
            ) : (
              <img 
                src="/logo.png"
                alt="Control Core"
                className={cn(
                  "h-12 w-auto max-w-[180px]",
                  theme === 'dark' ? "brightness-0 invert" : ""
                )}
              />
            )}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <EnterpriseIcon name="chevron-right" size={18} />
            ) : (
              <EnterpriseIcon name="chevron-left" size={18} />
            )}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className={cn("flex flex-col gap-1", isCollapsed ? "px-1" : "px-2")}>
          {flatRoutes.map((route) => (
            <SidebarItem
              key={route.url}
              icon={route.icon}
              label={route.title}
              path={route.url}
              active={location.pathname === route.url}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-sidebar-border p-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="text-xs text-sidebar-foreground">
            <p>Control Core</p>
            <p>v2025 SaaS</p>
          </div>
        )}
      </div>
    </aside>
  );
}
