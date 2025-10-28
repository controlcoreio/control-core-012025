
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Terminal, Sparkles } from "lucide-react";
import { PolicyImproveDialog } from "./PolicyImproveDialog";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InnovativePrototypes } from "../prototypes/InnovativePrototypes";

interface PolicyReviewSectionProps {
  policyName: string;
  previewMode: 'visual' | 'code';
  setPreviewMode: (val: 'visual' | 'code') => void;
  version: string;
  environment: string;
}

export function PolicyReviewSection({
  policyName,
  previewMode,
  setPreviewMode,
  version,
  environment,
}: PolicyReviewSectionProps) {
  const [improveOpen, setImproveOpen] = useState(false);

  // Mock apply suggestion callback. In a real scenario, this would update state.
  const handleApplySuggestion = (suggestion: any) => {
    // eslint-disable-next-line no-console
    console.log("Applying suggestion: ", suggestion);
    // Show a toast, or update policy structure here!
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review Policy</h2>
        <p className="text-muted-foreground">
          Review and confirm your policy configuration
        </p>
        {/* Show current policy name prominently in review */}
        <div className="mt-4 flex items-center space-x-2">
          <span className="text-lg font-bold">Policy:</span>
          <span className="text-lg">{policyName || "New Policy"}</span>
        </div>
      </div>
      <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'visual' | 'code')}>
        <TabsList>
          <TabsTrigger value="visual">
            <Eye className="mr-2 h-4 w-4" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="code">
            <Terminal className="mr-2 h-4 w-4" />
            Generated Code
          </TabsTrigger>
        </TabsList>
        <TabsContent value="visual" className="mt-4 space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h3 className="font-semibold mb-2">Resources</h3>
            <ul className="list-disc list-inside">
              <li>/api/users/{"{id}"}</li>
              <li>/api/reports</li>
            </ul>
          </div>
          <div className="rounded-md bg-muted p-4">
            <h3 className="font-semibold mb-2">Roles</h3>
            <ul className="list-disc list-inside">
              <li>Admin - System administrators with full access</li>
              <li>User - Regular system users</li>
              <li>Manager - Users who can manage others but not system settings</li>
            </ul>
          </div>
          <div className="rounded-md bg-muted p-4">
            <h3 className="font-semibold mb-2">Permissions</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Admin can perform all actions on all resources</li>
              <li>Users can read and edit their own data</li>
              <li>Managers can read all user data and edit their reports</li>
            </ul>
          </div>
          <div className="rounded-md bg-muted p-4">
            <h3 className="font-semibold mb-2">Conditions</h3>
            <ul className="list-disc list-inside">
              <li>User can only access their own data where user.id == resource.owner_id</li>
              <li>All access requires active session token</li>
            </ul>
          </div>
        </TabsContent>
        <TabsContent value="code" className="mt-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 font-mono text-sm overflow-auto max-h-[400px]">
            <pre className="whitespace-pre-wrap">
{`package authz.users_api

# Default deny all
default allow = false

# Allow admins full access
allow {
    input.user.roles[_] == "admin"
}

# Users can access their own data
allow {
    input.path = ["api", "users", user_id]
    input.user.id == user_id
    input.method == "GET"
}

allow {
    input.path = ["api", "users", user_id]
    input.user.id == user_id
    input.method == "PUT"
}

# Managers can read all user data
allow {
    input.path = ["api", "users", _]
    input.user.roles[_] == "manager"
    input.method == "GET"
}

# Report access rules
allow {
    input.path = ["api", "reports"]
    input.method == "GET"
    input.user.roles[_] == "manager"
}

# Require valid session for all access
allow = false {
    not input.session.valid
}
`}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
      {/* --- New Improve Policy action section --- */}
      <div className="mt-8 pt-4 border-t space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WandSparkles className="text-primary" size={24} />
            <span className="text-base font-semibold">Need help improving this policy?</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setImproveOpen(true)}
              variant="default"
              aria-label="Improve Policy"
            >
              <WandSparkles className="h-5 w-5" />
              Improve Policy
            </Button>
            
            {/* New Innovative Features Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  aria-label="View More CAPA Tools"
                >
                  <Sparkles className="h-5 w-5" />
                  More CAPA Tools
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Control Core Advanced CAPA Tools</DialogTitle>
                </DialogHeader>
                <div className="overflow-auto max-h-[80vh]">
                  <InnovativePrototypes />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <PolicyImproveDialog
          open={improveOpen}
          onOpenChange={setImproveOpen}
          onApplySuggestion={handleApplySuggestion}
        />
      </div>
    </div>
  );
}
