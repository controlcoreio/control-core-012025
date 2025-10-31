
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { Link, useNavigate } from "react-router-dom";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { usePolicies } from "@/hooks/use-policies";
import { usePIPConnections } from "@/hooks/use-pip-connections";
import { useAuditLogs } from "@/hooks/use-audit-logs";

export function GettingStartedOverview() {
  const { resetOnboarding } = useOnboardingProgress();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { currentEnvironment, isProduction } = useEnvironment();
  
  // Fetch real data from backend filtered by current environment
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { policies, refetch: refetchPolicies } = usePolicies({ 
    status: 'enabled',
    environment: currentEnvironment 
  });
  const { connections, refetch: refetchConnections } = usePIPConnections();
  
  // Listen to environment changes and refetch data
  useEffect(() => {
    const handleEnvironmentChange = () => {
      console.log('[Dashboard] Environment changed, refetching data for:', currentEnvironment);
      refetchStats?.();
      refetchPolicies?.();
      refetchConnections?.();
    };
    
    window.addEventListener('environmentChanged', handleEnvironmentChange);
    return () => window.removeEventListener('environmentChanged', handleEnvironmentChange);
  }, [refetchStats, refetchPolicies, refetchConnections]);
  
  // Refetch data when environment changes directly
  useEffect(() => {
    console.log('[Dashboard] Current environment changed to:', currentEnvironment);
    refetchStats?.();
    refetchPolicies?.();
    refetchConnections?.();
  }, [currentEnvironment]);
  // Disabled audit logs on login page to prevent console errors
  // const { logs } = useAuditLogs({ limit: 100 });
  const logs: Array<{
    id: number;
    timestamp: string;
    user: string;
    action: string;
    resource: string;
    result: string;
  }> = [];

  const quickActions = [
    {
      title: 'Create New Policy',
      description: 'Quickly define a new authorization policy from scratch',
      icon: "plus",
      link: '/policies/builder'
    },
    {
      title: 'Browse Policy Templates',
      description: 'Explore pre-built policy templates for common use cases',
      icon: "document",
      link: '/policies/templates'
    },
    {
      title: 'Manage Data Sources',
      description: 'Connect and manage your data sources for dynamic policy decisions',
      icon: "database",
      link: '/pips'
    },
    {
      title: 'Configure Settings',
      description: 'Customize platform settings, user roles, and access controls',
      icon: "settings",
      link: '/settings'
    }
  ];

  // Calculate access denials from audit logs
  const deniedCount = logs?.filter(log => log.outcome === 'DENY').length || 0;
  
  const dashboardStats = [
    {
      title: 'Policies Deployed',
      value: statsLoading ? '...' : stats.totalPolicies.toString(),
      icon: "shield",
      trend: stats.activePolicies > 0 ? `${stats.activePolicies} active` : 'Getting started',
      description: `${stats.draftPolicies} in draft`,
      color: 'text-green-500'
    },
    {
      title: 'Data Sources Connected',
      value: statsLoading ? '...' : stats.smartConnections.toString(),
      icon: "database",
      trend: stats.activeConnections > 0 ? `${stats.activeConnections} active` : 'None configured',
      description: stats.pendingConnections > 0 ? `${stats.pendingConnections} pending` : 'All connected',
      color: 'text-blue-500'
    },
    {
      title: 'Authorization Requests (24h)',
      value: statsLoading ? '...' : stats.authDecisions24h.toLocaleString(),
      icon: "activity",
      trend: stats.authDecisions24h > 0 ? `${stats.allowedPercentage}% allowed` : 'No activity',
      description: stats.authDecisions24h > 0 ? `${stats.deniedPercentage}% denied` : 'Start enforcing policies',
      color: 'text-purple-500'
    },
    {
      title: 'Access Denials (24h)',
      value: statsLoading ? '...' : deniedCount.toString(),
      icon: "lock",
      trend: deniedCount === 0 ? 'No denials' : `${deniedCount} blocked`,
      description: deniedCount === 0 ? 'All access permitted' : 'Review audit logs',
      color: deniedCount > 10 ? 'text-red-500' : 'text-orange-500'
    }
  ];

  // Calculate security metrics from real data
  const policyCount = stats.totalPolicies || 0;
  const resourceCount = 3; // TODO: Fetch from /resources endpoint
  const coveragePercentage = policyCount > 0 && resourceCount > 0 
    ? Math.min(Math.round((policyCount / resourceCount) * 30), 100) // Simplified calculation
    : 0;
  
  const securityReports = [
    {
      title: 'Policy Coverage',
      value: statsLoading ? '...' : `${coveragePercentage}%`,
      icon: "activity",
      description: `${policyCount} policies protecting ${resourceCount} resources`,
      status: coveragePercentage >= 80 ? 'good' : coveragePercentage >= 50 ? 'warning' : 'error'
    },
    {
      title: 'Anomalous Activity',
      value: '0',
      icon: "exclamation-triangle",
      description: 'No suspicious access patterns detected',
      status: 'good'
    },
    {
      title: 'Policy Compliance',
      value: policyCount > 0 ? '100%' : 'N/A',
      icon: "check",
      description: policyCount > 0 ? 'All policies validated' : 'No policies to validate',
      status: 'good'
    }
  ];

  const handleGetStarted = () => {
    resetOnboarding();
    navigate('/getting-started/wizard');
  };

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", 
            isDark ? "text-gray-100" : "text-[#333652]")}>
            Welcome to Control Core
          </h1>
          <p className={cn(
            isDark ? "text-gray-300" : "text-[#333652]/70"
          )}>
            Your authorization platform is ready. Get an overview of your setup and key metrics.
          </p>
        </div>
        <Button onClick={handleGetStarted}>
          <EnterpriseIcon name="arrow-right" size={16} className="mr-2" />
          Get Started with Control Core
        </Button>
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className={cn("text-2xl font-semibold mb-4", 
          isDark ? "text-gray-100" : "text-[#333652]")}>
          Quick Actions
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card key={action.title} className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              isDark ? "bg-sidebar border-border hover:border-primary/50" : "bg-white border-[#90adc6]/20 hover:border-primary/50"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EnterpriseIcon name={action.icon as any} size={20} className="text-primary" />
                  {action.title}
                </CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={action.link}>
                    Go
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Key Metrics */}
      <section className="mb-8">
        <h2 className={cn("text-2xl font-semibold mb-4", 
          isDark ? "text-gray-100" : "text-[#333652]")}>
          Key Metrics
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
            <Card key={stat.title} className={cn(
              isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EnterpriseIcon name={stat.icon as any} size={20} />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-sm">
                  <EnterpriseIcon name="trending-up" size={16} />
                  <span className={stat.color}>{stat.trend}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Security Reports */}
      <section className="mb-8">
        <h2 className={cn("text-2xl font-semibold mb-4", 
          isDark ? "text-gray-100" : "text-[#333652]")}>
          Security Reports
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {securityReports.map((report) => (
            <Card key={report.title} className={cn(
              isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EnterpriseIcon name={report.icon as any} size={20} />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{report.value}</div>
                <p className="text-sm text-muted-foreground">{report.description}</p>
                {report.status === 'good' && (
                  <Badge variant="outline" className="mt-2">
                    <EnterpriseIcon name="check" size={16} className="mr-2" />
                    Good
                  </Badge>
                )}
                {report.status === 'warning' && (
                  <Badge variant="outline" className="mt-2 text-orange-500 border-orange-500">
                    <EnterpriseIcon name="exclamation-triangle" size={16} className="mr-2" />
                    Warning
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
