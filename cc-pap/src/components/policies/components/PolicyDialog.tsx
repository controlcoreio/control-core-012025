
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { ScopeBadge } from "./ScopeBadge";
import type { PolicyDialogProps } from "../types";

export const PolicyDialog = ({ type, policy, isOpen, onClose, onConfirm }: PolicyDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  
  if (!policy) return null;
  
  let title = "";
  let description = "";
  let confirmLabel = "";
  let confirmRequired = false;
  
  switch (type) {
    case "view":
      title = policy.name;
      confirmLabel = "Close";
      break;
    case "delete":
      title = "Delete Policy?";
      description = `Are you sure you want to permanently delete policy '${policy.name}'? This action cannot be undone.`;
      confirmLabel = "Delete Policy";
      confirmRequired = true;
      break;
    case "archive":
      title = "Archive Policy?";
      description = `Are you sure you want to archive policy '${policy.name}'? It will be hidden from the default list but can be restored later.`;
      confirmLabel = "Archive Policy";
      break;
  }
  
  const handleConfirm = () => {
    if (type === "delete" && confirmRequired && confirmText !== policy.name) {
      return;
    }
    
    onConfirm();
    onClose();
    setConfirmText("");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        {type === "view" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground">{policy.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Status</h3>
              <div className="mt-1"><StatusBadge status={policy.status} /></div>
            </div>
            <div>
              <h3 className="text-sm font-medium">Scope</h3>
              <div className="flex flex-wrap mt-1">
                {policy.scope.map((scope, i) => (
                  <ScopeBadge key={i} label={scope} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium">Version</h3>
                <p className="text-sm text-muted-foreground">{policy.version}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Last Modified</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(policy.lastModified).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Created By</h3>
                <p className="text-sm text-muted-foreground">{policy.createdBy}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Modified By</h3>
                <p className="text-sm text-muted-foreground">{policy.modifiedBy}</p>
              </div>
            </div>
          </div>
        )}
        
        {type === "delete" && confirmRequired && (
          <div className="py-2">
            <p className="text-sm mb-2">Please type <strong>{policy.name}</strong> to confirm:</p>
            <Input 
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type "${policy.name}" to confirm`}
            />
          </div>
        )}
        
        <DialogFooter className="flex sm:justify-between">
          {type !== "view" && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleConfirm}
            variant={type === "delete" ? "destructive" : "default"}
            disabled={type === "delete" && confirmRequired && confirmText !== policy.name}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
