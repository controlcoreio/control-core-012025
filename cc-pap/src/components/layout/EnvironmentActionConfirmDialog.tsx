
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface EnvironmentActionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  environmentName: string;
  environmentColor: string;
  actionType: string;
  itemName: string;
  actionDescription: string;
  actionImpact: string;
  isDestructive?: boolean;
}

export function EnvironmentActionConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  environmentName,
  environmentColor,
  actionType,
  itemName,
  actionDescription,
  actionImpact,
  isDestructive = false
}: EnvironmentActionConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Confirm Action on{" "}
            <Badge className={`${environmentColor} text-white border-0`}>
              {environmentName}
            </Badge>
            ?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You are about to <strong>{actionDescription}</strong> the {itemName} '{itemName}' in the{" "}
              <strong className={environmentColor.includes('red') ? 'text-red-600' : 
                              environmentColor.includes('orange') ? 'text-orange-600' :
                              environmentColor.includes('yellow') ? 'text-yellow-600' : 'text-gray-600'}>
                {environmentName}
              </strong> environment.
            </p>
            <p>
              This will <strong>{actionImpact}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to proceed?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={isDestructive ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Confirm {actionType}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
