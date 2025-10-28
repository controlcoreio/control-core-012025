
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WandSparkles, Lightbulb, TrendingUp, Settings, Star, StarHalf, StarOff } from "lucide-react";

// Define mock suggestions (replace with dynamic logic as needed)
type SuggestionCategory = "Best Practices" | "Potential Conflicts" | "Smart Improvements";
type Severity = "critical" | "warning" | "info";

interface Suggestion {
  id: string;
  category: SuggestionCategory;
  title: string;
  explanation: string;
  affected: string;
  severity: Severity;
  canApply: boolean;
  canViewDetails: boolean;
}

interface PolicyImproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplySuggestion: (suggestion: Suggestion) => void;
  suggestions?: Suggestion[];
}

const severityIcon = {
  critical: <StarOff className="text-destructive mr-1 inline-block" size={16} />,
  warning: <StarHalf className="text-yellow-500 mr-1 inline-block" size={16} />,
  info: <Star className="text-blue-500 mr-1 inline-block" size={16} />
};

const categoryIcon = {
  "Best Practices": <Lightbulb className="text-yellow-500 mr-2" size={20} />,
  "Potential Conflicts": <Settings className="text-destructive mr-2" size={20} />,
  "Smart Improvements": <TrendingUp className="text-green-600 mr-2" size={20} />,
};

const defaultSuggestions: Suggestion[] = [
  {
    id: "bp-1",
    category: "Best Practices",
    title: "Leverage sets for user group evaluation",
    explanation: "Using sets instead of loops improves efficiency and code clarity.",
    affected: "Condition: user_in_group function",
    severity: "info",
    canApply: true,
    canViewDetails: false,
  },
  {
    id: "conf-1",
    category: "Potential Conflicts",
    title: "Conflicting permissions with 'Project Editor Policy'",
    explanation: "Policy overlap detected: both allow edit on '/api/projects/{id}'. This may cause evaluation ambiguity.",
    affected: "Permission Rule for 'edit' action",
    severity: "critical",
    canApply: false,
    canViewDetails: true,
  },
  {
    id: "imp-1",
    category: "Smart Improvements",
    title: "Simplify multiple OR conditions with 'in' operator",
    explanation: "Using 'in' can reduce rule length when matching several allowed actions.",
    affected: "Permission Rule for actions: view, edit, transfer",
    severity: "warning",
    canApply: true,
    canViewDetails: true,
  }
];

export function PolicyImproveDialog({
  open,
  onOpenChange,
  suggestions = defaultSuggestions,
  onApplySuggestion,
}: PolicyImproveDialogProps) {
  // Group suggestions by category
  const grouped: Record<SuggestionCategory, Suggestion[]> = {
    "Best Practices": [],
    "Potential Conflicts": [],
    "Smart Improvements": [],
  };
  suggestions.forEach(s => grouped[s.category].push(s));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <WandSparkles className="text-primary" size={22} />
            Improve Policy Suggestions
          </DialogTitle>
          <DialogDescription>
            Actionable suggestions to help refine your policy for clarity, correctness, and best practices.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto px-1 py-3 space-y-5">
          {Object.entries(grouped).map(([category, suggestionsList]) => (
            suggestionsList.length === 0 ? null : (
              <div key={category}>
                <div className="flex items-center mb-2">
                  {categoryIcon[category as SuggestionCategory]}
                  <span className="font-semibold text-base">{category}</span>
                </div>
                <div className="space-y-3">
                  {suggestionsList.map(s => (
                    <div
                      key={s.id}
                      className={`border rounded-md px-3 py-2 relative flex flex-col sm:flex-row sm:items-center gap-2 ${
                        s.severity === "critical"
                          ? "border-destructive bg-destructive/10"
                          : s.severity === "warning"
                          ? "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/40"
                          : "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {severityIcon[s.severity]}
                          <span className="font-medium">{s.title}</span>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mb-1">
                          {s.affected}
                        </div>
                        <div className="text-sm">{s.explanation}</div>
                      </div>
                      <div className="flex flex-col gap-1 min-w-[120px] sm:items-end">
                        {s.canApply && (
                          <Button
                            size="sm"
                            className="mb-1"
                            onClick={() => onApplySuggestion(s)}
                          >
                            Apply Suggestion
                          </Button>
                        )}
                        {s.canViewDetails && (
                          <a
                            href="#"
                            className="text-blue-600 text-xs underline hover:underline hover:font-medium transition"
                            // For real case, wire to navigation or focus event
                            onClick={e => {
                              e.preventDefault();
                              onOpenChange(false);
                              // For now, nothing additional
                            }}
                          >
                            View Details
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
