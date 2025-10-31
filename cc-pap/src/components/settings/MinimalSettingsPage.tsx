
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { Link } from "react-router-dom";
import { LayoutGrid, List } from "lucide-react";

export function MinimalSettingsPage() {
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const settingsItems = [
    {
      title: "Environments",
      description: "Manage Sandbox & Production environment settings",
      icon: "server",
      href: "/settings/environments",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "Protected Resources",
      description: "Manage your protected resources and endpoints",
      icon: "shield",
      href: "/settings/resources",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Bouncers (PEPs)",
      description: "Manage Policy Enforcement Points",
      icon: "shield",
      href: "/settings/peps",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    },
    {
      title: "GitHub Configuration",
      description: "Configure GitHub repository per bouncer",
      icon: "git-branch",
      href: "/settings/peps",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: "users",
      href: "/settings/users",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Notifications",
      description: "Configure alerts and notification settings",
      icon: "bell",
      href: "/settings/notifications",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
    },
    {
      title: "Data Sources",
      description: "Configure PIPs and data connections",
      icon: "database",
      href: "/settings/data-sources",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      title: "General Settings",
      description: "System preferences and configuration",
      icon: "adjustments",
      href: "/settings/general",
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-900/20"
    }
  ];

  // Sort settings items alphabetically by title
  const sortedSettingsItems = [...settingsItems].sort((a, b) => 
    a.title.localeCompare(b.title)
  );

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your Control Core platform settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Cards
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedSettingsItems.map((item) => (
            <Card key={item.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center mb-3`}>
                  <EnterpriseIcon name={item.icon as any} size={24} className={item.color} />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={item.href}>
                  <Button variant="outline" className="w-full">
                    Configure
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSettingsItems.map((item) => (
            <Card key={item.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <EnterpriseIcon name={item.icon as any} size={20} className={item.color} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Link to={item.href}>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
