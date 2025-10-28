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

interface ProductionWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ProductionWarningModal({ open, onOpenChange, onConfirm, onCancel }: ProductionWarningModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

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
                You are entering the Production Environment!
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm leading-relaxed mt-4">
            All changes made here, including policy creation, modification, and resource configurations, 
            will directly impact your live systems and users. It is highly recommended to design, test, 
            and iterate on your policies and configurations within the Sandbox environment first. 
            Deploying untested changes to Production can lead to service disruptions or security vulnerabilities.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => {
            onCancel?.();
            onOpenChange(false);
          }}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Proceed to Production
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}