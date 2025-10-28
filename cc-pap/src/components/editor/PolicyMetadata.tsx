
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, RefreshCw } from "lucide-react";

interface Environment {
  value: string;
  label: string;
}

interface PolicyMetadataProps {
  policyName: string;
  setPolicyName: (name: string) => void;
  version: string;
  environment: string;
  setEnvironment: (env: string) => void;
  isDraftMode: boolean;
  setIsDraftMode: (draft: boolean) => void;
  environments: Environment[];
  onSaveDraft: () => void;
  onSavePolicy: () => void;
  onFormatCode: () => void;
}

export function PolicyMetadata({
  policyName,
  setPolicyName,
  version,
  environment,
  setEnvironment,
  isDraftMode,
  setIsDraftMode,
  environments,
  onSaveDraft,
  onSavePolicy,
  onFormatCode
}: PolicyMetadataProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="policy-name" className="text-sm font-medium">Policy Name:</label>
        <Input 
          id="policy-name" 
          value={policyName} 
          onChange={(e) => setPolicyName(e.target.value)} 
          className="max-w-md text-lg font-semibold" 
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{policyName}</h1>
          <p className="text-muted-foreground">Create and edit your authorization policies</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Version:</span>
            <span className="text-sm font-medium">{version}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Environment:</span>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Select env" />
              </SelectTrigger>
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env.value} value={env.value}>
                    {env.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="draft-mode" 
              checked={isDraftMode} 
              onCheckedChange={setIsDraftMode} 
            />
            <Label htmlFor="draft-mode">Draft Mode</Label>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onFormatCode}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Format
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onSaveDraft}
              disabled={!isDraftMode}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button 
              size="sm" 
              onClick={onSavePolicy}
            >
              <Save className="mr-2 h-4 w-4" />
              {isDraftMode ? "Save Policy" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
