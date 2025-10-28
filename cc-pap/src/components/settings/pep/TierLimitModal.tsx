
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowRight, Shield, Zap, Globe } from "lucide-react";

interface TierLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'resources' | 'policies';
  currentCount: number;
  maxCount: number;
}

export function TierLimitModal({ 
  open, 
  onOpenChange, 
  limitType, 
  currentCount, 
  maxCount 
}: TierLimitModalProps) {
  const isResources = limitType === 'resources';
  
  const handleContactSales = () => {
    window.open('mailto:info@controlcore.io?subject=Enterprise Plan Inquiry', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            {isResources ? 'Unlock More Protected Resources' : 'Unlock More Policies'}
          </DialogTitle>
          <DialogDescription>
            {isResources 
              ? `Your current plan includes ${maxCount} Protected Resource. To protect more APIs, AI tools, or other URLs, please consider upgrading.`
              : `Your current plan includes ${maxCount} Policies. To create more custom rules or utilize additional templates, please consider upgrading.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-600" />
                Current: Fully Hosted Plan
              </CardTitle>
              <CardDescription>
                You're using {currentCount} of {maxCount} {isResources ? 'resources' : 'policies'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-600" />
                Enterprise Plan Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Unlimited {isResources ? 'Protected Resources' : 'Policies'}</span>
              </div>
              {isResources && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Multiple Environments (Sandbox, Staging, Production)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Advanced PEP/PIP Configuration</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Extended Audit Log Retention</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Dedicated Support & Custom Pricing</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Close
          </Button>
          <Button onClick={handleContactSales} className="flex-1">
            <Crown className="h-4 w-4 mr-2" />
            Contact Sales for Enterprise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
