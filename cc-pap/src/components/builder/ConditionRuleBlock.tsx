import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Database, Shield } from "lucide-react";
import { usePIPAttributes } from "@/hooks/use-pip-attributes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Types
export interface ConditionRule {
  id: string;
  attribute: string;
  operator: string;
  value: string;
  negate: boolean;
  repeatForEach: string;
  builtinFn: string;
}

interface ConditionRuleBlockProps {
  rule: ConditionRule;
  availableAttributes: string[];
  pipSources: string[];
  onChange: (rule: ConditionRule) => void;
  onRemove: () => void;
}

const OPERATORS = [
  "=", "!=", ">", "<", ">=", "<=", "in", "contains", "startswith", "endswith", "regex", "not in"
];
const BUILTINS = [
  "time.weekday(now)", "net.cidr_match()"
];

export const ConditionRuleBlock: React.FC<ConditionRuleBlockProps> = ({
  rule, availableAttributes, pipSources, onChange, onRemove,
}) => {
  const { attributes: pipAttributes, loading: pipLoading } = usePIPAttributes();
  
  return (
    <div className="rounded bg-muted/40 border px-3 py-2 flex flex-wrap items-center gap-2 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-1"
        aria-label="Remove condition"
        onClick={onRemove}
      >
        <X className="text-destructive" size={14} />
      </Button>
      <span className="text-xs font-medium mr-1">Fact/Attribute:</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <select
              className="border rounded px-1 py-0.5 text-xs min-w-[200px]"
              value={rule.attribute}
              onChange={e => onChange({ ...rule, attribute: e.target.value })}
            >
              <option value="">Select attribute...</option>
              
              <optgroup label="Built-in Attributes">
                {availableAttributes.map(attr => (
                  <option key={attr} value={attr}>{attr}</option>
                ))}
              </optgroup>
              
              {!pipLoading && pipAttributes.length > 0 && (
                <optgroup label="PIP Data Sources">
                  {pipAttributes.map(pip => (
                    <option 
                      key={`pip-${pip.source_id}-${pip.label}`} 
                      value={pip.path}
                      title={pip.description}
                    >
                      {pip.label} ({pip.source}) [{pip.type}]
                    </option>
                  ))}
                </optgroup>
              )}
              
              {/* Legacy PIP sources for backward compatibility */}
              {pipSources.length > 0 && (
                <optgroup label="Legacy PIP Sources">
                  {pipSources.map(pip => (
                    <option key={"pip-" + pip} value={pip}>{pip} (Legacy)</option>
                  ))}
                </optgroup>
              )}
            </select>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Select an attribute from built-in options or connected PIP data sources
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="text-xs font-medium mx-1">Operator:</span>
      <select
        className="border rounded px-1 py-0.5 text-xs"
        value={rule.operator}
        onChange={e => onChange({ ...rule, operator: e.target.value })}
      >
        {OPERATORS.map(op => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>
      <span className="text-xs font-medium mx-1">Value:</span>
      <Input
        className="text-xs w-24"
        value={rule.value}
        onChange={e => onChange({ ...rule, value: e.target.value })}
        placeholder="Enter value"
      />
      <span className="text-xs font-medium mx-1">Built-in:</span>
      <select
        className="border rounded px-1 py-0.5 text-xs"
        value={rule.builtinFn}
        onChange={e => onChange({ ...rule, builtinFn: e.target.value })}
      >
        <option value="">None</option>
        {BUILTINS.map(fn => (
          <option key={fn} value={fn}>{fn}</option>
        ))}
      </select>
      <label className="flex items-center mx-1 text-xs">
        <input
          type="checkbox"
          checked={rule.negate}
          onChange={e => onChange({ ...rule, negate: e.target.checked })}
        />
        <span className="ml-1">NOT</span>
      </label>
      <Button
        variant="outline"
        size="sm"
        className="ml-2"
        onClick={() => onChange({ ...rule, repeatForEach: "user.groups" })}
      >
        Repeat for Each...
      </Button>
    </div>
  );
};
