import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ProductionPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  action: 'create' | 'modify';
}

export function ProductionPolicyModal({ open, onOpenChange, onConfirm, action }: ProductionPolicyModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const actionText = action === 'create' ? 'save' : 'modify';
  const actionPastTense = action === 'create' ? 'created' : 'modified';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-red-900">
                Confirm Production Policy Change
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm leading-relaxed mt-4">
            You are about to {actionText} a policy in the Production environment. This change will be 
            immediately applied to your live systems. Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirm & {actionText.charAt(0).toUpperCase() + actionText.slice(1)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}