
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { AlertChannelsConfig } from "./notifications/AlertChannelsConfig";
import { GeneralSystemAlerts } from "./notifications/GeneralSystemAlerts";
import { CustomAlertRules } from "./notifications/CustomAlertRules";
import { SecurityIncidentAlerts } from "./notifications/SecurityIncidentAlerts";

export interface AlertType {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: {
    email: boolean;
    slack: boolean;
    serviceNow: boolean;
    webhook: boolean;
  };
  required?: boolean;
}

export default function NotificationAlertSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification & Alerts</h1>
        <p className="text-muted-foreground">
          Configure alerts and notification channels for your organization
        </p>
      </div>

      <div className="grid gap-6">
        <SecurityIncidentAlerts />
        <GeneralSystemAlerts />
        <CustomAlertRules />
        <AlertChannelsConfig />
      </div>
    </div>
  );
}
