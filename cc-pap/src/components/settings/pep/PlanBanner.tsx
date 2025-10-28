
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, X, Calendar } from "lucide-react";

interface PlanBannerProps {
  planType: 'trial' | 'hosted' | 'enterprise';
  daysRemaining?: number;
}

export function PlanBanner({ planType, daysRemaining }: PlanBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || planType === 'enterprise') return null;

  const handleUpgrade = () => {
    window.open('mailto:info@controlcore.io?subject=Plan Upgrade Inquiry', '_blank');
  };

  if (planType === 'trial') {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 mb-6">
        <Calendar className="h-4 w-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="text-blue-800 dark:text-blue-200">
            <strong>You're on the 30-day Free Tier!</strong> Enjoy all ControlCore features. 
            {daysRemaining && (
              <span className="font-medium"> {daysRemaining} days remaining.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleUpgrade}>
              Upgrade Now
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800 mb-6">
      <Crown className="h-4 w-4 text-purple-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="text-purple-800 dark:text-purple-200">
          Need more resources or advanced features? 
          <strong className="ml-1">Upgrade to Enterprise for unlimited capabilities.</strong>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleUpgrade}>
            <Crown className="h-3 w-3 mr-1" />
            Contact Sales for Enterprise
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
