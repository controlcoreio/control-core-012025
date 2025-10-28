
import { CheckCircle, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ResourceProtectedSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceName: string;
  onGoToPolicies: () => void;
  onViewAuditLogs: () => void;
}

export function ResourceProtectedSuccessDialog({
  open,
  onOpenChange,
  resourceName,
  onGoToPolicies,
  onViewAuditLogs
}: ResourceProtectedSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-xl">Your Resource is Now Protected & Monitored!</DialogTitle>
          <DialogDescription className="text-base">
            <strong>{resourceName}</strong> is now routing traffic through ControlCore.
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  Monitoring Mode Active
                </Badge>
              </div>
              <p className="text-sm text-blue-900">
                To help you get started quickly and observe your resource access activity, this resource is currently in
                <strong> 'Monitoring Mode'</strong>. All traffic will be allowed by default, and detailed insights
                will be visible in your Audit Logs.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Next Steps for Security:</h4>
            <p className="text-sm text-muted-foreground">
              For stronger protection, we recommend defining specific 'Deny' or 'Mask' policies to block unwanted traffic.
              Once you're ready, you can switch this resource to a 'Secure by Default' posture from its settings.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2 text-yellow-800">Important: Update Your Application Configuration</h4>
            <p className="text-sm text-yellow-700 mb-3">
              Your resource is now protected, but you still need to update your application to use the new proxy URL instead of the direct host URL.
            </p>
            <p className="text-sm text-yellow-700 mt-3">
              Alternatively, you can update your DNS settings to point to our proxy servers. Please ensure your DNS configuration is precise to avoid forwarding loops.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={onGoToPolicies} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Continue to Policy Library
            </Button>
            <Button variant="outline" onClick={onViewAuditLogs} className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Audit Logs
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
