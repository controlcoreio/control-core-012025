import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface StrictProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSandbox: () => void;
}

export function StrictProductionModal({ open, onOpenChange, onSwitchToSandbox }: StrictProductionModalProps) {
  const handleSwitchToSandbox = () => {
    onSwitchToSandbox();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-blue-900">
                Action Restricted in Production
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm leading-relaxed mt-4">
            Your organization's settings prohibit direct policy creation or modification in the Production environment. 
            Please switch to the Sandbox environment for policy development. Policy changes should be deployed to 
            Production via your configured CI/CD pipeline.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSwitchToSandbox}>
            Switch to Sandbox Environment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}