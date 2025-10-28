import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail } from "lucide-react";

interface TierLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "conditions" | "policies";
  onContactSupport?: () => void;
}

export function TierLimitModal({ open, onOpenChange, type, onContactSupport }: TierLimitModalProps) {
  const handleContactSupport = () => {
    window.open("mailto:support@controlcore.io?subject=Enterprise Plan Inquiry", "_blank");
    onContactSupport?.();
  };

  const content = {
    conditions: {
      title: "Unlock Advanced Policy Logic",
      description: "Your current plan supports up to 5 conditions/rules per policy. For more complex and granular control, please contact us for an Enterprise plan.",
    },
    policies: {
      title: "Policy Limit Reached",
      description: "You have reached your maximum of 10 active policies. To activate this policy, please deactivate an existing one or upgrade your plan to unlock unlimited active policies.",
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{content[type].title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {content[type].description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2 sm:gap-2">
          {type === "policies" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Deactivate an Existing Policy
            </Button>
          )}
          <Button onClick={handleContactSupport} className="gap-2">
            <Mail className="h-4 w-4" />
            Contact Support
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}