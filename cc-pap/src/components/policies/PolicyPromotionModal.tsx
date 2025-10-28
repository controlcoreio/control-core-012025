import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUp, GitBranch, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Policy } from "./types";

interface PolicyPromotionModalProps {
  policy: Policy;
  isOpen: boolean;
  onClose: () => void;
  onPromote: (policy: Policy, options: PromotionOptions) => Promise<void>;
}

interface PromotionOptions {
  createPullRequest: boolean;
  commitMessage: string;
  targetBranch: string;
}

export function PolicyPromotionModal({ policy, isOpen, onClose, onPromote }: PolicyPromotionModalProps) {
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionOptions, setPromotionOptions] = useState<PromotionOptions>({
    createPullRequest: true,
    commitMessage: `Promote policy "${policy.name}" from Sandbox to Production`,
    targetBranch: "production"
  });
  const { toast } = useToast();

  const handlePromote = async () => {
    setIsPromoting(true);
    try {
      await onPromote(policy, promotionOptions);
      toast({
        title: "Control Promoted",
        description: `Control "${policy.name}" has been successfully promoted to Production and committed to GitHub repository.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Promotion Failed",
        description: "Failed to promote control to Production. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-green-600" />
            Promote Control to Production
          </DialogTitle>
          <DialogDescription>
            Promote the control "{policy.name}" from Sandbox environment to Production environment.
            This will create a copy in the Production branch of your GitHub repository.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Policy Information */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{policy.name}</h4>
              <Badge variant="outline">{policy.version}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span>Resource: <Badge variant="secondary">{policy.resourceId}</Badge></span>
              <span>Status: <Badge variant={policy.status === 'enabled' ? 'default' : 'secondary'}>{policy.status}</Badge></span>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong>               This action will copy the control to the Production environment 
              and create a commit in your GitHub repository. The control will be immediately available 
              in Production once the deployment is complete.
            </AlertDescription>
          </Alert>

          {/* Promotion Options */}
          <div className="space-y-3">
            <h4 className="font-medium">Promotion Options</h4>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Commit Message</label>
              <textarea
                value={promotionOptions.commitMessage}
                onChange={(e) => setPromotionOptions(prev => ({ ...prev, commitMessage: e.target.value }))}
                className="w-full p-2 border rounded-md text-sm"
                rows={2}
                placeholder="Enter commit message for this promotion..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Branch</label>
              <select
                value={promotionOptions.targetBranch}
                onChange={(e) => setPromotionOptions(prev => ({ ...prev, targetBranch: e.target.value }))}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="production">production</option>
                <option value="main">main</option>
                <option value="prod">prod</option>
              </select>
            </div>
          </div>

          {/* GitHub Integration Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">GitHub Integration</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              This promotion will create a commit in your connected GitHub repository on the {promotionOptions.targetBranch} branch.
              The control file will be updated in the controls directory with the current version.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPromoting}>
            Cancel
          </Button>
          <Button 
            onClick={handlePromote} 
            disabled={isPromoting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPromoting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Promoting...
              </>
            ) : (
              <>
                <ArrowUp className="mr-2 h-4 w-4" />
                Promote to Production
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
