import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AlertCircle, Code, X, Lightbulb } from 'lucide-react';
import { ComplexityAnalysis } from '@/utils/policyComplexity';

interface AdvancedFeaturesWarningProps {
  analysis: ComplexityAnalysis;
  onSwitchToCodeEditor: () => void;
  position?: 'tooltip' | 'banner';
}

const STORAGE_KEY = 'cc_hide_advanced_features_warning';

export function AdvancedFeaturesWarning({
  analysis,
  onSwitchToCodeEditor,
  position = 'tooltip',
}: AdvancedFeaturesWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has permanently dismissed the warning
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsDismissed(true);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsDismissed(false);
    setDontShowAgain(false);
  };

  // Don't show if dismissed or if complexity is basic
  if (isDismissed || analysis.level === 'basic') {
    return null;
  }

  const getVariant = () => {
    if (analysis.level === 'advanced') return 'destructive';
    return 'default';
  };

  const getIcon = () => {
    if (analysis.level === 'advanced') return AlertCircle;
    return Lightbulb;
  };

  const Icon = getIcon();

  if (position === 'banner') {
    return (
      <Alert variant={getVariant()} className="relative">
        <Icon className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between pr-8">
          {analysis.level === 'advanced' 
            ? 'Advanced Features Required' 
            : 'Consider Using Code Editor'}
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>
              {analysis.level === 'advanced'
                ? 'This policy uses advanced Rego features not fully supported in the visual builder.'
                : 'This policy may benefit from advanced Rego features for better organization and maintainability.'}
            </p>
            
            {analysis.reasons.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold text-sm mb-1">Detected features:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {analysis.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.suggestions.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold text-sm mb-1">Suggestions:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {analysis.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={onSwitchToCodeEditor}
                size="sm"
                variant={analysis.level === 'advanced' ? 'default' : 'outline'}
              >
                <Code className="h-4 w-4 mr-2" />
                Switch to Code Editor
              </Button>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="dont-show"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                />
                <Label htmlFor="dont-show" className="text-xs cursor-pointer">
                  Don't show again
                </Label>
              </div>

              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </AlertDescription>
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    );
  }

  // Tooltip/popover version
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${
            analysis.level === 'advanced'
              ? 'border-orange-500 text-orange-700 hover:bg-orange-50'
              : 'border-blue-500 text-blue-700 hover:bg-blue-50'
          }`}
        >
          <Icon className="h-4 w-4" />
          {analysis.level === 'advanced' ? 'Advanced Features' : 'Code Editor Suggested'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Icon className={`h-5 w-5 mt-0.5 ${
              analysis.level === 'advanced' ? 'text-orange-600' : 'text-blue-600'
            }`} />
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">
                {analysis.level === 'advanced'
                  ? 'Advanced Features Required'
                  : 'Consider Using Code Editor'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {analysis.level === 'advanced'
                  ? 'This policy uses advanced Rego features not fully supported in the visual builder.'
                  : 'This policy may benefit from advanced Rego features for better organization.'}
              </p>
            </div>
          </div>

          {analysis.reasons.length > 0 && (
            <div>
              <p className="font-semibold text-xs mb-1">Detected features:</p>
              <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                {analysis.reasons.slice(0, 3).map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 border-t space-y-2">
            <Button
              onClick={onSwitchToCodeEditor}
              size="sm"
              className="w-full"
              variant={analysis.level === 'advanced' ? 'default' : 'outline'}
            >
              <Code className="h-4 w-4 mr-2" />
              Switch to Code Editor
            </Button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dont-show-tooltip"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                />
                <Label htmlFor="dont-show-tooltip" className="text-xs cursor-pointer">
                  Don't show again
                </Label>
              </div>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Component to reset the "don't show again" preference
 * Useful for settings or help pages
 */
export function ResetAdvancedFeaturesWarning() {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsHidden(dismissed === 'true');
  }, []);

  if (!isHidden) {
    return null;
  }

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsHidden(false);
  };

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Advanced Features Warning Hidden</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          You have chosen to hide warnings about advanced Rego features.
        </p>
        <Button onClick={handleReset} size="sm" variant="outline">
          Show Warnings Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

