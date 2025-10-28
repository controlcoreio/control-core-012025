
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

export function RolesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Define Roles</h2>
        <p className="text-muted-foreground">
          Specify the roles that will be governed by this policy
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Role Name</Label>
            <Input placeholder="e.g., admin, user, editor" />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Role Description</Label>
            <Input placeholder="Describe what this role represents" />
          </div>
        </div>
        <div className="border rounded-md p-4">
          <h3 className="text-sm font-medium mb-2">Defined Roles</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-sm">
              <div>
                <div className="font-medium">Admin</div>
                <div className="text-xs text-muted-foreground">
                  System administrators with full access
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-sm">
              <div>
                <div className="font-medium">User</div>
                <div className="text-xs text-muted-foreground">
                  Regular system users
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-sm">
              <div>
                <div className="font-medium">Manager</div>
                <div className="text-xs text-muted-foreground">
                  Users who can manage others but not system settings
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3">
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>
      </div>
    </div>
  );
}
