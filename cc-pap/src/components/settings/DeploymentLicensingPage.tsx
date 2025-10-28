
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Server, Shield, Users, Database, AlertCircle, CheckCircle, Copy, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DeploymentLicensingPage() {
  const [deploymentModel, setDeploymentModel] = useState<string>("on-premises");
  const [licenseKey, setLicenseKey] = useState("");
  const [autoRenewal, setAutoRenewal] = useState(true);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your deployment and licensing settings have been updated.",
    });
  };

  const handleLicenseUpload = () => {
    toast({
      title: "License uploaded",
      description: "New license file has been processed successfully.",
    });
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Server className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Deployment & Licensing</h1>
      </div>

      <div className="space-y-6">
        {/* Deployment Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Deployment Model
            </CardTitle>
            <CardDescription>
              Configure how your ControlCore instance is deployed and managed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deployment-model">Deployment Type</Label>
              <Select value={deploymentModel} onValueChange={setDeploymentModel}>
                <SelectTrigger id="deployment-model">
                  <SelectValue placeholder="Select deployment model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-premises">On-Premises</SelectItem>
                  <SelectItem value="cloud">Cloud Hosted</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {deploymentModel === "on-premises" && (
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">On-Premises Deployment</span>
                </div>
                <p className="text-sm text-blue-800">
                  Your ControlCore instance is deployed within your own infrastructure, giving you full control over data and security.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-medium">Max Users</div>
                <div className="text-2xl font-bold">500</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Database className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-medium">Max Policies</div>
                <div className="text-2xl font-bold">1,000</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Server className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-medium">PEP Instances</div>
                <div className="text-2xl font-bold">10</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              License Management
            </CardTitle>
            <CardDescription>
              Manage your ControlCore license and subscription details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">License Status</div>
                  <div className="text-sm text-muted-foreground">Active - Expires March 15, 2025</div>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Active
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-key">License Key</Label>
              <div className="flex gap-2">
                <Input
                  id="license-key"
                  type="password"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="Enter your license key"
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-renewal">Auto-renewal</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically renew license before expiration
                </div>
              </div>
              <Switch
                id="auto-renewal"
                checked={autoRenewal}
                onCheckedChange={setAutoRenewal}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLicenseUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload License File
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download License Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support & Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Support & Maintenance</CardTitle>
            <CardDescription>
              Support subscription and maintenance schedule information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-2">Support Level</div>
                <Badge variant="outline">Enterprise</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  24/7 support with dedicated account manager
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-2">Maintenance Window</div>
                <div className="text-sm">Sundays 2:00 AM - 4:00 AM UTC</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Scheduled maintenance and updates
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-contact">Support Contact</Label>
              <Input
                id="support-contact"
                placeholder="support@yourcompany.com"
                defaultValue="support@yourcompany.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-notes">Maintenance Notes</Label>
              <Textarea
                id="maintenance-notes"
                placeholder="Special maintenance instructions or notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Reset to Defaults</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
