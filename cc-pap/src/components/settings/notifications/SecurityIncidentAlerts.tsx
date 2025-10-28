import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Eye, 
  Database, 
  Network, 
  Settings,
  Info,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface SecurityIncidentAlert {
  id: string;
  name: string;
  description: string;
  incidentType: string;
  severity: "critical" | "high" | "medium" | "low";
  component: "pap" | "bouncer" | "opal" | "all";
  enabled: boolean;
  channels: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
    inApp: boolean;
  };
  threshold?: number;
  cooldownMinutes?: number;
  escalation?: {
    enabled: boolean;
    delayMinutes: number;
    recipients: string[];
  };
  customMessage?: string;
}

interface ComponentStatus {
  name: string;
  status: "healthy" | "warning" | "critical" | "unknown";
  lastIncident?: string;
  incidentCount: number;
}

export function SecurityIncidentAlerts() {
  const { user } = useAuth();
  const [incidentAlerts, setIncidentAlerts] = useState<SecurityIncidentAlert[]>([
    {
      id: "data-breach",
      name: "Data Breach Detection",
      description: "Alerts when unauthorized access to sensitive data is detected",
      incidentType: "data_breach",
      severity: "critical",
      component: "all",
      enabled: true,
      channels: { email: true, slack: true, webhook: true, inApp: true },
      cooldownMinutes: 60,
      escalation: {
        enabled: true,
        delayMinutes: 15,
        recipients: [user?.email || "security@company.com"]
      }
    },
    {
      id: "unauthorized-access",
      name: "Unauthorized Access Attempts",
      description: "Notifies when multiple failed authentication attempts or privilege escalation is detected",
      incidentType: "unauthorized_access",
      severity: "high",
      component: "pap",
      enabled: true,
      channels: { email: true, slack: false, webhook: true, inApp: true },
      threshold: 5,
      cooldownMinutes: 30
    },
    {
      id: "policy-violation",
      name: "Critical Policy Violations",
      description: "Alerts when critical policy violations occur across PAP, bouncer, or OPAL",
      incidentType: "policy_violation",
      severity: "high",
      component: "all",
      enabled: true,
      channels: { email: true, slack: true, webhook: false, inApp: true },
      cooldownMinutes: 15
    },
    {
      id: "system-compromise",
      name: "System Compromise Indicators",
      description: "Detects signs of system compromise in any Control Core component",
      incidentType: "system_compromise",
      severity: "critical",
      component: "all",
      enabled: true,
      channels: { email: true, slack: true, webhook: true, inApp: true },
      escalation: {
        enabled: true,
        delayMinutes: 5,
        recipients: [user?.email || "security@company.com", "management@company.com"]
      }
    },
    {
      id: "network-intrusion",
      name: "Network Intrusion Detection",
      description: "Alerts when suspicious network activity is detected by bouncer",
      incidentType: "network_intrusion",
      severity: "high",
      component: "bouncer",
      enabled: true,
      channels: { email: true, slack: false, webhook: true, inApp: true },
      threshold: 10,
      cooldownMinutes: 45
    },
    {
      id: "opal-sync-failure",
      name: "OPAL Synchronization Failures",
      description: "Notifies when OPAL fails to synchronize policies between components",
      incidentType: "opal_sync_failure",
      severity: "medium",
      component: "opal",
      enabled: true,
      channels: { email: true, slack: false, webhook: false, inApp: true },
      cooldownMinutes: 120
    },
    {
      id: "account-compromise",
      name: "Account Compromise Indicators",
      description: "Detects potential account compromise through unusual access patterns",
      incidentType: "account_compromise",
      severity: "high",
      component: "pap",
      enabled: true,
      channels: { email: true, slack: true, webhook: true, inApp: true },
      cooldownMinutes: 30
    },
    {
      id: "vulnerability-detected",
      name: "Security Vulnerability Detection",
      description: "Alerts when new security vulnerabilities are detected in components",
      incidentType: "vulnerability_detected",
      severity: "medium",
      component: "all",
      enabled: true,
      channels: { email: true, slack: false, webhook: false, inApp: true },
      cooldownMinutes: 240
    }
  ]);

  const [componentStatus, setComponentStatus] = useState<ComponentStatus[]>([
    { name: "PAP (Policy Admin Panel)", status: "healthy", incidentCount: 2 },
    { name: "Bouncer (PEP)", status: "healthy", incidentCount: 1 },
    { name: "OPAL (Policy Sync)", status: "warning", lastIncident: "2 hours ago", incidentCount: 3 },
    { name: "Business Admin", status: "healthy", incidentCount: 0 }
  ]);

  const updateAlert = (id: string, updates: Partial<SecurityIncidentAlert>) => {
    setIncidentAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, ...updates } : alert
    ));
    toast.success("Security alert settings updated");
  };

  const updateChannel = (alertId: string, channel: keyof SecurityIncidentAlert['channels'], enabled: boolean) => {
    updateAlert(alertId, {
      channels: {
        ...incidentAlerts.find(a => a.id === alertId)!.channels,
        [channel]: enabled
      }
    });
  };

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

  const getComponentIcon = (component: string) => {
    switch (component) {
      case "pap":
        return <Settings className="h-4 w-4" />;
      case "bouncer":
        return <Shield className="h-4 w-4" />;
      case "opal":
        return <Network className="h-4 w-4" />;
      case "all":
        return <Database className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Incident Alerts
          </CardTitle>
          <CardDescription>
            Configure alerts for security incidents across PAP, bouncer, and OPAL components.
            These alerts help you respond quickly to potential security threats and maintain system security.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Component Status Overview */}
          <div>
            <h4 className="text-sm font-medium mb-3">Component Status Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {componentStatus.map((component, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(component.status)}`} />
                    <div>
                      <p className="text-sm font-medium">{component.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {component.incidentCount} incidents
                        {component.lastIncident && ` • Last: ${component.lastIncident}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Security Incident Alerts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Security Incident Alert Rules</h4>
              <Badge variant="outline" className="text-xs">
                {incidentAlerts.filter(a => a.enabled).length} of {incidentAlerts.length} enabled
              </Badge>
            </div>

            <div className="space-y-4">
              {incidentAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {/* Alert Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(alert.severity)}
                            <h5 className="font-medium">{alert.name}</h5>
                            <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {getComponentIcon(alert.component)}
                            <span>Component: {alert.component.toUpperCase()}</span>
                            {alert.threshold && (
                              <>
                                <span>•</span>
                                <span>Threshold: {alert.threshold}</span>
                              </>
                            )}
                            {alert.cooldownMinutes && (
                              <>
                                <span>•</span>
                                <span>Cooldown: {alert.cooldownMinutes}m</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={alert.enabled}
                          onCheckedChange={(enabled) => updateAlert(alert.id, { enabled })}
                        />
                      </div>

                      {/* Alert Configuration */}
                      {alert.enabled && (
                        <div className="space-y-4 pl-6 border-l-2 border-muted">
                          {/* Notification Channels */}
                          <div>
                            <Label className="text-sm font-medium">Notification Channels</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                              {Object.entries(alert.channels).map(([channel, enabled]) => (
                                <div key={channel} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${alert.id}-${channel}`}
                                    checked={enabled}
                                    onCheckedChange={(checked) => 
                                      updateChannel(alert.id, channel as keyof SecurityIncidentAlert['channels'], checked as boolean)
                                    }
                                  />
                                  <Label htmlFor={`${alert.id}-${channel}`} className="text-sm capitalize">
                                    {channel === 'inApp' ? 'In-App' : channel}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Escalation Settings */}
                          {alert.escalation && (
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Switch
                                  checked={alert.escalation.enabled}
                                  onCheckedChange={(enabled) => 
                                    updateAlert(alert.id, {
                                      escalation: { ...alert.escalation!, enabled }
                                    })
                                  }
                                />
                                <Label className="text-sm font-medium">Enable Escalation</Label>
                              </div>
                              
                              {alert.escalation.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                                  <div>
                                    <Label className="text-xs">Escalation Delay (minutes)</Label>
                                    <Input
                                      type="number"
                                      value={alert.escalation.delayMinutes}
                                      onChange={(e) => 
                                        updateAlert(alert.id, {
                                          escalation: { 
                                            ...alert.escalation!, 
                                            delayMinutes: parseInt(e.target.value) || 0 
                                          }
                                        })
                                      }
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Escalation Recipients</Label>
                                    <Textarea
                                      value={alert.escalation.recipients.join(', ')}
                                      onChange={(e) => 
                                        updateAlert(alert.id, {
                                          escalation: { 
                                            ...alert.escalation!, 
                                            recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                                          }
                                        })
                                      }
                                      className="mt-1"
                                      placeholder="email1@company.com, email2@company.com"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Custom Message */}
                          <div>
                            <Label className="text-sm font-medium">Custom Alert Message (Optional)</Label>
                            <Textarea
                              value={alert.customMessage || ''}
                              onChange={(e) => updateAlert(alert.id, { customMessage: e.target.value })}
                              placeholder="Add a custom message that will be included in alerts..."
                              className="mt-1"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Alert Testing */}
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-3">Test Alert Configuration</h4>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Use the test feature to verify your alert configuration is working correctly.
                Test alerts will be sent to all enabled channels.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm">
                Test Critical Alert
              </Button>
              <Button variant="outline" size="sm">
                Test High Priority Alert
              </Button>
              <Button variant="outline" size="sm">
                Test Medium Priority Alert
              </Button>
            </div>
          </div>

          {/* Save Changes */}
          <div className="flex justify-end pt-4 border-t">
            <Button>
              Save Security Alert Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
