
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertType } from "../NotificationAlertSettingsPage";
import { toast } from "sonner";
import { APP_CONFIG } from "@/config/app";
import { SecureStorage } from "@/utils/secureStorage";

interface GeneralSystemAlertsProps {
  environment: string;
}

const defaultAlertTypes: AlertType[] = [
  {
    id: "resource-status",
    name: "Resource Status Change",
    description: "Notifies when a protected Resource (URL) changes status (e.g., disconnected, error).",
    enabled: true,
    channels: { email: true, slack: false, serviceNow: false, webhook: false }
  },
  {
    id: "critical-policy-error",
    name: "Critical Policy Error",
    description: "Alerts if a policy fails to evaluate or an enforcement point encounters a critical error.",
    enabled: true,
    channels: { email: true, slack: true, serviceNow: false, webhook: false }
  },
  {
    id: "high-denial-volume",
    name: "High Volume of Denials Detected",
    description: "Notifies if an unusually high rate of access denials occurs across your resources.",
    enabled: false,
    channels: { email: true, slack: false, serviceNow: false, webhook: false }
  },
  {
    id: "trial-expiration",
    name: "Trial Expiration Reminder",
    description: "Receive reminders as your 30-day free trial approaches expiration.",
    enabled: true,
    channels: { email: true, slack: false, serviceNow: false, webhook: false },
    required: true
  }
];

export function GeneralSystemAlerts({ environment }: GeneralSystemAlertsProps) {
  const [alertTypes, setAlertTypes] = useState<AlertType[]>(defaultAlertTypes);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings when environment changes
  useEffect(() => {
    loadSettings();
  }, [environment]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const token = SecureStorage.getItem('access_token');
      const response = await fetch(
        `${APP_CONFIG.api.baseUrl}/v1/notifications/settings?environment=${environment}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.alert_types && data.alert_types.length > 0) {
          setAlertTypes(data.alert_types);
        } else {
          setAlertTypes(defaultAlertTypes);
        }
      }
    } catch (error) {
      console.error("Failed to load alert settings:", error);
      setAlertTypes(defaultAlertTypes);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (updatedAlerts: AlertType[]) => {
    try {
      const token = SecureStorage.getItem('access_token');
      const response = await fetch(
        `${APP_CONFIG.api.baseUrl}/v1/notifications/settings?environment=${environment}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            alert_types: updatedAlerts
          })
        }
      );

      if (response.ok) {
        toast.success("Alert settings saved successfully");
      }
    } catch (error) {
      console.error("Failed to save alert settings:", error);
      toast.error("Failed to save alert settings");
    }
  };

  const updateAlertType = (id: string, updates: Partial<AlertType>) => {
    const updated = alertTypes.map(alert => 
      alert.id === id ? { ...alert, ...updates } : alert
    );
    setAlertTypes(updated);
    saveSettings(updated);
  };

  const updateChannel = (alertId: string, channel: keyof AlertType['channels'], enabled: boolean) => {
    const updated = alertTypes.map(alert => 
      alert.id === alertId 
        ? { ...alert, channels: { ...alert.channels, [channel]: enabled } }
        : alert
    );
    setAlertTypes(updated);
    saveSettings(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General System Alerts</CardTitle>
        <CardDescription>
          Receive essential notifications about your ControlCore account, resource status, and critical security events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Label className="font-medium">Email Notifications Enabled for:</Label>
            <Badge variant="secondary">admin@example.com</Badge>
          </div>
        </div>

        {alertTypes.map((alert) => (
          <div key={alert.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`alert-${alert.id}`} className="font-medium">
                    {alert.name}
                  </Label>
                  {alert.required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
              </div>
              <Switch
                id={`alert-${alert.id}`}
                checked={alert.enabled}
                onCheckedChange={(enabled) => updateAlertType(alert.id, { enabled })}
                disabled={alert.required}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Notification Channels:</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${alert.id}-email`}
                    checked={alert.channels.email}
                    onCheckedChange={(checked) => 
                      updateChannel(alert.id, 'email', checked as boolean)
                    }
                    disabled={!alert.enabled || (alert.required && alert.channels.email)}
                  />
                  <Label htmlFor={`${alert.id}-email`} className="text-sm">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${alert.id}-slack`}
                    checked={alert.channels.slack}
                    onCheckedChange={(checked) => 
                      updateChannel(alert.id, 'slack', checked as boolean)
                    }
                    disabled={!alert.enabled}
                  />
                  <Label htmlFor={`${alert.id}-slack`} className="text-sm">Slack</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${alert.id}-servicenow`}
                    checked={alert.channels.serviceNow}
                    onCheckedChange={(checked) => 
                      updateChannel(alert.id, 'serviceNow', checked as boolean)
                    }
                    disabled={!alert.enabled}
                  />
                  <Label htmlFor={`${alert.id}-servicenow`} className="text-sm">ServiceNow</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${alert.id}-webhook`}
                    checked={alert.channels.webhook}
                    onCheckedChange={(checked) => 
                      updateChannel(alert.id, 'webhook', checked as boolean)
                    }
                    disabled={!alert.enabled}
                  />
                  <Label htmlFor={`${alert.id}-webhook`} className="text-sm">Webhook</Label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
