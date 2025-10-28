
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUp, AlertTriangle } from "lucide-react";
import type { MockPolicy } from "@/data/mockData";

interface PromotePolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: MockPolicy | null;
  onConfirm: () => void;
}

export function PromotePolicyModal({ open, onOpenChange, policy, onConfirm }: PromotePolicyModalProps) {
  if (!policy) return null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const hasProductionVersion = policy.productionStatus !== 'not-promoted';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <ArrowUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Promote Policy: {policy.name} to Production
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm leading-relaxed mt-4">
            You are about to promote the current Sandbox version of this policy to your live Production environment.
            {hasProductionVersion && " This will overwrite the existing Production version of this policy."}
            <br /><br />
            Ensure you have thoroughly tested this version in Sandbox before proceeding.
          </DialogDescription>
          
          {hasProductionVersion && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-4">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                This will replace the current Production version (v{policy.version}).
              </span>
            </div>
          )}
        </DialogHeader>
        
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <ArrowUp className="h-4 w-4" />
            Confirm & Promote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
