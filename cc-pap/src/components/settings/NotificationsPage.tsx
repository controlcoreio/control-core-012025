
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertChannelsConfig } from "./notifications/AlertChannelsConfig";
import { GeneralSystemAlerts } from "./notifications/GeneralSystemAlerts";
import { CustomAlertRules } from "./notifications/CustomAlertRules";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { EnvironmentBadge } from "@/components/ui/environment-badge";

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

export function NotificationsPage() {
  const { currentEnvironment } = useEnvironment();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Notification & Alerts</h1>
          <EnvironmentBadge />
        </div>
        <p className="text-muted-foreground">
          Configure alerts and notification channels for {currentEnvironment} environment
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Alert rules and channel configurations are environment-specific. Notification credentials (API keys, tokens) are shared across both environments.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <GeneralSystemAlerts environment={currentEnvironment} />
        <CustomAlertRules environment={currentEnvironment} />
        <AlertChannelsConfig environment={currentEnvironment} />
      </div>
    </div>
  );
}
