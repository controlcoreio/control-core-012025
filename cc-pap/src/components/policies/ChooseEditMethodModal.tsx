
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";

interface ChooseEditMethodModalProps {
  open: boolean;
  onCancel: () => void;
  onSelect: (method: "builder"|"editor") => void;
}

export function ChooseEditMethodModal({ open, onCancel, onSelect }: ChooseEditMethodModalProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Editing Method</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 h-auto p-4"
            onClick={() => onSelect("builder")}
          >
            <EnterpriseIcon name="adjustments" size={24} className="text-violet-500" />
            <div className="text-left">
              <div className="font-semibold">Policy Builder</div>
              <div className="text-sm text-muted-foreground">Visual workflow wizard for creating policies</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 h-auto p-4"
            onClick={() => onSelect("editor")}
          >
            <EnterpriseIcon name="code" size={24} className="text-purple-600" />
            <div className="text-left">
              <div className="font-semibold">Policy Editor</div>
              <div className="text-sm text-muted-foreground">Advanced code editor for Rego policies</div>
            </div>
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
