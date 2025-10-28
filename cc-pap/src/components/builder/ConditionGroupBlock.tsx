
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { ConditionRuleBlock, ConditionRule } from "./ConditionRuleBlock";
import { cn } from "@/lib/utils";

// Types
export interface ConditionGroup {
  id: string;
  operator: "AND" | "OR";
  conditions: (ConditionRule | ConditionGroup)[];
}

interface ConditionGroupBlockProps {
  group?: ConditionGroup;
  onChange: (group: ConditionGroup) => void;
  availableAttributes: string[];
  pipSources: string[];
  initial?: boolean;
  maxConditions?: number;
  currentConditionsCount?: number;
}

export const ConditionGroupBlock: React.FC<ConditionGroupBlockProps> = ({
  group, onChange, availableAttributes, pipSources, initial = false, maxConditions, currentConditionsCount = 0,
}) => {
  const currentGroup = group ?? { id: "" + Date.now(), operator: "AND", conditions: [] };
  const isAtMaxConditions = maxConditions && currentConditionsCount >= maxConditions;

  const addRule = () => {
    if (isAtMaxConditions) return;
    const newRule: ConditionRule = {
      id: Date.now() + "_" + Math.floor(Math.random() * 10000),
      attribute: "",
      operator: "=",
      value: "",
      negate: false,
      repeatForEach: "",
      builtinFn: "",
    };
    onChange({ ...currentGroup, conditions: [...currentGroup.conditions, newRule] });
  };
  const addGroup = () => {
    if (isAtMaxConditions) return;
    const newGroup: ConditionGroup = {
      id: Date.now() + "_" + Math.floor(Math.random() * 10000),
      operator: "AND",
      conditions: [],
    };
    onChange({ ...currentGroup, conditions: [...currentGroup.conditions, newGroup] });
  };

  const removeAt = (idx: number) => 
    onChange({...currentGroup, conditions: currentGroup.conditions.filter((_,i) => i !== idx)});

  const updateAt = (idx: number, newCond: Record<string, unknown>) =>
    onChange({ ...currentGroup, conditions: currentGroup.conditions.map((c, i) => i === idx ? newCond : c) });

  return (
    <div className={cn("border rounded p-3 m-1", !initial && "bg-background/75")}>
      <div className="flex gap-2 items-center mb-2">
        <span className="font-semibold text-xs px-2 py-1 rounded bg-muted">
          {initial ? "Condition Group" : `Group (${currentGroup.operator})`}
        </span>
        {!initial && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...currentGroup, operator: currentGroup.operator === "AND" ? "OR" : "AND" })}
          >
            {currentGroup.operator}
          </Button>
        )}
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={addRule}
          disabled={isAtMaxConditions}
          title={isAtMaxConditions ? "Maximum 5 conditions/rules per policy." : undefined}
        >
          <Plus size={13} className="mr-1" />
          Add Condition Rule
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={addGroup}
          disabled={isAtMaxConditions}
          title={isAtMaxConditions ? "Maximum 5 conditions/rules per policy." : undefined}
        >
          <Plus size={13} className="mr-1" />
          Add Condition Group
        </Button>
      </div>
      <div className="ml-3">
        {currentGroup.conditions.map((cond, idx) => (
          <div key={cond.id} className="mb-2">
            {"attribute" in cond ? (
              <ConditionRuleBlock
                rule={cond}
                availableAttributes={availableAttributes}
                pipSources={pipSources}
                onChange={r => updateAt(idx, r)}
                onRemove={() => removeAt(idx)}
              />
            ) : (
              <ConditionGroupBlock
                group={cond as ConditionGroup}
                onChange={g => updateAt(idx, g)}
                availableAttributes={availableAttributes}
                pipSources={pipSources}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
