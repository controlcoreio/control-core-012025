
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";
import type { Policy } from "../types";

const ENVIRONMENTS = ["testing", "production"] as const;
type Environment = typeof ENVIRONMENTS[number];
type ActionType = "copy" | "promote";

interface PromotePoliciesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPolicies: Policy[];
}

export function PromotePoliciesDialog({
  isOpen,
  onClose,
  selectedPolicies,
}: PromotePoliciesDialogProps) {
  const [targetEnv, setTargetEnv] = useState<Environment>("testing");
  const [actionType, setActionType] = useState<ActionType>("copy");
  const { toast } = useToast();

  const handlePromote = () => {
    // In a real implementation, this would make an API call
    toast({
      title: `Policies ${actionType}d`,
      description: `Successfully ${actionType}d ${selectedPolicies.length} policies to ${targetEnv} environment.`,
      duration: 3000,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Promote/Copy Policies</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label>Target Environment</Label>
            <RadioGroup
              defaultValue="testing"
              value={targetEnv}
              onValueChange={(value) => setTargetEnv(value as Environment)}
              className="flex flex-col gap-2"
            >
              {ENVIRONMENTS.map((env) => (
                <div key={env} className="flex items-center space-x-2">
                  <RadioGroupItem value={env} id={`env-${env}`} />
                  <Label htmlFor={`env-${env}`} className="capitalize">
                    {env}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label>Action Type</Label>
            <RadioGroup
              defaultValue="copy"
              value={actionType}
              onValueChange={(value) => setActionType(value as ActionType)}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="copy" id="action-copy" />
                <Label htmlFor="action-copy">
                  Copy (create duplicates in target environment)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="promote" id="action-promote" />
                <Label htmlFor="action-promote">
                  Promote (move to target environment)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {actionType === "promote" && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Promoting policies may overwrite existing ones in the target
                environment. This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            Selected policies ({selectedPolicies.length}):
            <ul className="mt-2 list-disc list-inside">
              {selectedPolicies.map((policy) => (
                <li key={policy.id}>{policy.name}</li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePromote}>
            {actionType === "promote" ? "Promote" : "Copy"} Policies
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
