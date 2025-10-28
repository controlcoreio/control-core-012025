import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  Clock,
  Users,
  Database,
  Network,
  Settings,
  Eye,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "investigating" | "resolved" | "false_positive";
  component: "pap" | "bouncer" | "opal" | "business_admin";
  incidentType: string;
  detectedAt: string;
  affectedSystems: string[];
  affectedUsers: string[];
  responseActions: string[];
  crmTicketId?: string;
  slaDeadline?: string;
  isOverdue?: boolean;
}

interface ComponentHealth {
  name: string;
  component: "pap" | "bouncer" | "opal" | "business_admin";
  status: "healthy" | "warning" | "critical" | "unknown";
  lastIncident?: string;
  activeIncidents: number;
  totalIncidents: number;
}

export function SecurityIncidentsWidget() {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([
    {
      id: "inc-001",
      title: "Multiple Failed Authentication Attempts",
      description: "Detected 15 failed login attempts from IP 192.168.1.100 within 5 minutes",
      severity: "high",
      status: "investigating",
      component: "pap",
      incidentType: "unauthorized_access",
      detectedAt: "2025-01-25T10:30:00Z",
      affectedSystems: ["PAP-API", "Auth Service"],
      affectedUsers: ["user@company.com"],
      responseActions: ["block_ip", "alert_security"],
      crmTicketId: "CRM-12345",
      slaDeadline: "2025-01-25T14:30:00Z"
    },
    {
      id: "inc-002",
      title: "OPAL Synchronization Failure",
      description: "OPAL failed to synchronize policies between PAP and bouncer components",
      severity: "medium",
      status: "active",
      component: "opal",
      incidentType: "sync_failure",
      detectedAt: "2025-01-25T09:15:00Z",
      affectedSystems: ["OPAL-Server", "Policy-Cache"],
      affectedUsers: [],
      responseActions: ["restart_sync", "alert_ops"],
      slaDeadline: "2025-01-25T21:15:00Z"
    },
    {
      id: "inc-003",
      title: "Suspicious Network Traffic Pattern",
      description: "Unusual traffic pattern detected by bouncer - potential DDoS attempt",
      severity: "high",
      status: "investigating",
      component: "bouncer",
      incidentType: "network_intrusion",
      detectedAt: "2025-01-25T08:45:00Z",
      affectedSystems: ["Bouncer-Service", "Load-Balancer"],
      affectedUsers: [],
      responseActions: ["rate_limit", "block_suspicious_ips"],
      crmTicketId: "CRM-12346",
      slaDeadline: "2025-01-25T12:45:00Z"
    },
    {
      id: "inc-004",
      title: "Critical Policy Violation",
      description: "High-privilege user attempted to access restricted resource",
      severity: "critical",
      status: "active",
      component: "pap",
      incidentType: "policy_violation",
      detectedAt: "2025-01-25T07:20:00Z",
      affectedSystems: ["PAP-API", "Policy-Engine"],
      affectedUsers: ["admin@company.com"],
      responseActions: ["revoke_access", "escalate_to_security"],
      crmTicketId: "CRM-12347",
      slaDeadline: "2025-01-25T08:20:00Z",
      isOverdue: true
    },
    {
      id: "inc-005",
      title: "Data Access Anomaly",
      description: "User accessed sensitive data outside normal business hours",
      severity: "medium",
      status: "resolved",
      component: "business_admin",
      incidentType: "data_access_anomaly",
      detectedAt: "2025-01-24T22:30:00Z",
      affectedSystems: ["Business-Admin-API", "Audit-Log"],
      affectedUsers: ["analyst@company.com"],
      responseActions: ["log_access", "notify_user"],
      crmTicketId: "CRM-12344"
    }
  ]);

  const [componentHealth, setComponentHealth] = useState<ComponentHealth[]>([
    { name: "PAP (Policy Admin Panel)", component: "pap", status: "warning", activeIncidents: 2, totalIncidents: 12 },
    { name: "Bouncer (PEP)", component: "bouncer", status: "warning", activeIncidents: 1, totalIncidents: 8 },
    { name: "OPAL (Policy Sync)", component: "opal", status: "critical", activeIncidents: 1, totalIncidents: 15 },
    { name: "Business Admin", component: "business_admin", status: "healthy", activeIncidents: 0, totalIncidents: 3 }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Info className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "destructive";
      case "investigating":
        return "secondary";
      case "resolved":
        return "outline";
      case "false_positive":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case "pap":
        return <Settings className="h-4 w-4" />;
      case "bouncer":
        return <Shield className="h-4 w-4" />;
      case "opal":
        return <Network className="h-4 w-4" />;
      case "business_admin":
        return <Database className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const refreshIncidents = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Incidents refreshed",
        description: "Latest security incidents have been loaded.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh incidents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeIncidents = incidents.filter(incident => 
    incident.status === "active" || incident.status === "investigating"
  );
  const criticalIncidents = incidents.filter(incident => incident.severity === "critical");
  const overdueIncidents = incidents.filter(incident => incident.isOverdue);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Incidents
          </CardTitle>
          <CardDescription>
            Real-time security incidents from PAP, bouncer, and OPAL components
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshIncidents}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Incident Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{criticalIncidents.length}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{activeIncidents.length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{overdueIncidents.length}</div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{incidents.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Component Health */}
        <div>
          <h4 className="text-sm font-medium mb-3">Component Health</h4>
          <div className="grid grid-cols-2 gap-2">
            {componentHealth.map((component, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getHealthStatusColor(component.status)}`} />
                  {getComponentIcon(component.component)}
                  <span className="text-xs font-medium">{component.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium">{component.activeIncidents}</div>
                  <div className="text-xs text-muted-foreground">active</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Recent Incidents */}
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Security Incidents</h4>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {incidents.slice(0, 5).map((incident) => (
                <div
                  key={incident.id}
                  className={cn(
                    "p-3 border rounded-lg space-y-2",
                    incident.isOverdue && "border-red-200 bg-red-50",
                    incident.severity === "critical" && "border-red-300"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      {getSeverityIcon(incident.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-sm font-medium truncate">{incident.title}</h5>
                          <Badge variant={getSeverityColor(incident.severity)} className="text-xs">
                            {incident.severity.toUpperCase()}
                          </Badge>
                          <Badge variant={getStatusColor(incident.status)} className="text-xs">
                            {incident.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {incident.isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              OVERDUE
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {incident.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {getComponentIcon(incident.component)}
                            <span>{incident.component.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(incident.detectedAt)}</span>
                          </div>
                          {incident.crmTicketId && (
                            <div className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              <span>{incident.crmTicketId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {incident.affectedSystems.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <Database className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Systems:</span>
                      <span className="font-medium">{incident.affectedSystems.join(", ")}</span>
                    </div>
                  )}
                  
                  {incident.affectedUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Users:</span>
                      <span className="font-medium">{incident.affectedUsers.join(", ")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Critical Alerts */}
        {criticalIncidents.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{criticalIncidents.length} critical incident(s) require immediate attention.</strong>
              {overdueIncidents.length > 0 && (
                <span> {overdueIncidents.length} incident(s) are overdue for SLA response.</span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
