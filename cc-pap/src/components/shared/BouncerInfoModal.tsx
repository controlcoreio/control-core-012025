import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight } from "lucide-react";

interface BouncerInfo {
  name: string;
  architecture: string;
  examples: string[];
  useCases: string[];
  deploymentTips: string[];
}

interface BouncerInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bouncerInfo: BouncerInfo | null;
}

export function BouncerInfoModal({ open, onOpenChange, bouncerInfo }: BouncerInfoModalProps) {
  if (!bouncerInfo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{bouncerInfo.name} - When to Use</DialogTitle>
          <DialogDescription>
            Detailed information about architecture, use cases, and deployment guidance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Architecture */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Architecture Flow
            </h4>
            <div className="bg-muted/50 rounded-lg p-4 border">
              <code className="text-sm font-mono text-foreground">
                {bouncerInfo.architecture}
              </code>
            </div>
          </div>

          {/* Use Cases */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">When to Use This Bouncer</h4>
            <ul className="space-y-2">
              {bouncerInfo.useCases.map((useCase, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="mt-0.5">✓</Badge>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Examples */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Deployment Examples</h4>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <ul className="space-y-2">
                {bouncerInfo.examples.map((example, index) => (
                  <li key={index} className="text-sm font-mono text-blue-900 dark:text-blue-100">
                    • {example}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Deployment Tips */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Deployment Tips</h4>
            <ul className="space-y-2">
              {bouncerInfo.deploymentTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Documentation Link */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" asChild>
              <a 
                href="https://docs.controlcore.io/guides/bouncer-deployment" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                View Full Deployment Guide
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

