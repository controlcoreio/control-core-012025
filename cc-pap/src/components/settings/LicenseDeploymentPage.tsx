import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Key, 
  Calendar, 
  Server, 
  Users, 
  Database, 
  Clock,
  ExternalLink,
  BookOpen,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LicenseDeploymentPage() {
  const { toast } = useToast();

  const handleContactSupport = () => {
    toast({
      title: "Contact Support",
      description: "Opening support contact form...",
    });
  };

  const handleViewDocumentation = () => {
    toast({
      title: "Documentation",
      description: "Opening self-deployment documentation...",
    });
  };

  // Mock license data
  const licenseKey = "CC2025-EA7B-9F3D-1A8C-************";
  const maskedLicenseKey = licenseKey.replace(/\w(?=\w{4})/g, '*');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">License & Deployment Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your self-deployed ControlCore instance license and deployment information.
        </p>
      </div>

      {/* Current License Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your Current License
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">ControlCore Early Adopter Program</h3>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">Active</Badge>
                <Badge variant="outline">Self-Managed</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">License Type</p>
              <p className="text-sm text-muted-foreground">Early Adopter Program</p>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">License Key</p>
                  <p className="text-sm text-muted-foreground font-mono">{maskedLicenseKey}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Expiry Date</p>
                  <p className="text-sm text-muted-foreground">December 31, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Included Capabilities Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Included Capabilities
          </CardTitle>
          <CardDescription>
            Your Early Adopter license includes unlimited capabilities within your infrastructure capacity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm">Protected Resources: Unlimited</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-sm">Policies: Unlimited</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-sm">Policy Conditions: Unlimited</span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-primary" />
              <span className="text-sm">Contextual Data: Unlimited Connections</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm">Audit Log Retention: 90 Days</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm">Users: Unlimited</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * Within your own infrastructure capacity
          </p>
        </CardContent>
      </Card>

      {/* Deployment Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Deployment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Self-Managed Infrastructure</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Your ControlCore instance is deployed and managed on your cloud infrastructure.
            </p>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>Manage your Policy Enforcement Points (PEPs) under Settings → Resources → Deploy PEPs</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="h-3 w-3" />
                <span>For scaling your instance or managing Policy Decision Points, refer to Settings → Environments</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Audit Log Retention</h4>
            <p className="text-sm text-muted-foreground">
              Your current setup includes 90 days of audit log retention. For longer retention, please contact our support team to discuss enterprise options.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support & Enterprise Section */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Enterprise Options</CardTitle>
          <CardDescription>
            For custom requirements, longer log retention, or dedicated support, please contact our Enterprise team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleContactSupport} className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Support/Enterprise
            </Button>
            <Button variant="outline" onClick={handleViewDocumentation} className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              View Documentation for Self-Deployment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}