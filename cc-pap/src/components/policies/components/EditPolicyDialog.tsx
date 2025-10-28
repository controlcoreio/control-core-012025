
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EditPolicyDialogProps } from "../types";

export const EditPolicyDialog = ({ policy, isOpen, onClose, onOpenBuilder, onOpenCodeEditor }: EditPolicyDialogProps) => {
  const handleEditorChoice = (choice: "code" | "builder") => {
    if (!policy) return;
    
    if (choice === "builder" && onOpenBuilder) {
      onOpenBuilder(policy.id);
    } else if (choice === "code" && onOpenCodeEditor) {
      onOpenCodeEditor(policy.id);
    }
    
    onClose();
  };
  
  if (!policy) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Policy: {policy.name}</DialogTitle>
          <DialogDescription>
            How would you like to edit this policy?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button 
            onClick={() => handleEditorChoice("code")}
            className="flex flex-col h-auto py-4"
          >
            <EnterpriseIcon name="code" size={32} className="mb-2" />
            <span>Edit with Code Editor</span>
          </Button>
          
          <Button 
            onClick={() => handleEditorChoice("builder")}
            className="flex flex-col h-auto py-4"
          >
            <EnterpriseIcon name="adjustments" size={32} className="mb-2" />
            <span>Edit with Policy Builder</span>
          </Button>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
