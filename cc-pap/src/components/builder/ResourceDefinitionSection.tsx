
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface ResourceDefinitionSectionProps {
  policyName: string;
  setPolicyName: (val: string) => void;
  version: string;
  environment: string;
}

export function ResourceDefinitionSection({
  policyName,
  setPolicyName,
  version,
  environment
}: ResourceDefinitionSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Define Resources</h2>
        <p className="text-muted-foreground">
          Specify the resources that your policy will protect. Please enter your policy name below:
        </p>
      </div>
      <div className="space-y-4">
        {/* Policy name input only shown in step 1 */}
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="policy-builder-name" className="font-medium">Policy Name</Label>
          <Input
            id="policy-builder-name"
            placeholder="Enter policy name"
            value={policyName}
            onChange={e => setPolicyName(e.target.value)}
            className="text-lg font-semibold"
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select Existing Resources</h3>
          <p className="text-sm text-muted-foreground">
            Choose from your organization's predefined resources, or create new ones if needed.
          </p>
          
          <div className="grid gap-4">
            <div className="space-y-3">
              <Label className="text-base">Available Resources</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-muted/20">
                <div className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-muted/50 cursor-pointer">
                  <div className="flex-1">
                    <div className="font-medium">AI Chat API</div>
                    <div className="text-sm text-muted-foreground">/api/v1/chat/completions</div>
                    <div className="text-xs text-muted-foreground mt-1">API endpoint for AI chat completions</div>
                  </div>
                  <Button variant="outline" size="sm">Select</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-muted/50 cursor-pointer">
                  <div className="flex-1">
                    <div className="font-medium">User Management API</div>
                    <div className="text-sm text-muted-foreground">/api/v1/users/*</div>
                    <div className="text-xs text-muted-foreground mt-1">User data and profile management endpoints</div>
                  </div>
                  <Button variant="outline" size="sm">Select</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-muted/50 cursor-pointer">
                  <div className="flex-1">
                    <div className="font-medium">Analytics Dashboard</div>
                    <div className="text-sm text-muted-foreground">/dashboard/analytics</div>
                    <div className="text-xs text-muted-foreground mt-1">Internal analytics and reporting dashboard</div>
                  </div>
                  <Button variant="outline" size="sm">Select</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border rounded-md p-4">
          <h3 className="text-sm font-medium mb-2">Defined Resources</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-sm">
              <div>
                <div className="font-medium">Users API</div>
                <div className="text-xs text-muted-foreground">/api/users/{"{id}"}</div>
              </div>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-sm">
              <div>
                <div className="font-medium">Reports</div>
                <div className="text-xs text-muted-foreground">/api/reports</div>
              </div>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3">
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>
      </div>
    </div>
  );
}
