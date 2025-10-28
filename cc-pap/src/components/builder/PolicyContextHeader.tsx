
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Save } from "lucide-react";

interface PolicyContextHeaderProps {
  policyName: string;
  version: string;
  environment: string;
  isDraftMode: boolean;
  setIsDraftMode: (draft: boolean) => void;
  environments: Array<{ value: string; label: string }>;
}

export function PolicyContextHeader({
  policyName,
  version,
  environment,
  isDraftMode,
  setIsDraftMode,
  environments
}: PolicyContextHeaderProps) {
  return (
    <div className="mb-2 py-2 w-full flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between border-b bg-muted rounded-t-lg px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          {policyName}
        </h1>
        <span className="ml-4 text-sm font-medium">
          Version: <span className="font-semibold">{version}</span>
        </span>
        <span className="ml-4 text-sm font-medium">
          Environment: <span className="font-semibold">{environments.find(env => env.value === environment)?.label}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center space-x-2">
          <Switch id="draft-mode" checked={isDraftMode} onCheckedChange={setIsDraftMode} />
          <Label htmlFor="draft-mode">Draft Mode</Label>
        </div>
        <Button variant="outline" size="sm" disabled={!isDraftMode}>
          <Clock className="mr-2 h-4 w-4" />
          Save Draft
        </Button>
        <Button size="sm">
          <Save className="mr-2 h-4 w-4" />
          Save Policy
        </Button>
      </div>
    </div>
  );
}
