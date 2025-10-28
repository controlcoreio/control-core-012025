
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { EffectSelector } from "./EffectSelector";
import { ActionMultiSelect } from "./ActionMultiSelect";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConditionGroupBlock } from "./ConditionGroupBlock";

// Types
export interface ConditionGroup { 
  id: string;
  operator: "AND" | "OR",
  conditions: any[] // defined in ConditionGroupBlock
}

export interface PermissionRule {
  id: string;
  effect: "allow" | "deny";
  actions: string[];
  customAction?: string;
  resourceInstance: string;
  repeatForEach?: string;
  nestedGroups?: NestedRuleGroup[];
  conditions?: ConditionGroup;
}

export interface NestedRuleGroup {
  id: string;
  operator: "AND" | "OR";
  rules: PermissionRule[];
}

interface PermissionRuleBlockProps {
  rule: PermissionRule;
  availableActions: string[];
  onChange: (rule: PermissionRule) => void;
  onRemove: () => void;
  onAddNestedGroup: () => void;
  showConditions: boolean;
  toggleConditions: () => void;
}

export const PermissionRuleBlock: React.FC<PermissionRuleBlockProps> = ({
  rule, availableActions, onChange, onRemove, onAddNestedGroup, showConditions, toggleConditions,
}) => {
  const [showNested, setShowNested] = useState(true);

  // Updates
  const updateField = (field: keyof PermissionRule, value: any) => {
    onChange({ ...rule, [field]: value });
  };

  return (
    <div className="rounded-md border p-4 mb-4 bg-muted/50 shadow relative">
      <Button 
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        aria-label="Remove"
        onClick={onRemove}
      >
        <X size={16} />
      </Button>

      <div className="flex flex-col md:flex-row gap-3 items-center">
        <Label className="min-w-[60px]">Effect:</Label>
        <EffectSelector
          value={rule.effect}
          onChange={val => updateField('effect', val)}
        />

        <Label className="min-w-[60px] ml-2">Actions:</Label>
        <ActionMultiSelect
          values={rule.actions}
          availableActions={availableActions}
          customValue={rule.customAction}
          onChange={(actions, custom) => {
            updateField("actions", actions);
            updateField("customAction", custom);
          }}
        />

        <Label className="min-w-[60px] ml-2">Resource Instance:</Label>
        <Input
          className="max-w-[150px] text-sm"
          value={rule.resourceInstance}
          onChange={e => updateField("resourceInstance", e.target.value)}
          placeholder="Any"
        />
      </div>

      <div className="flex gap-3 mt-3 items-center">
        <Button variant="ghost" size="sm" onClick={onAddNestedGroup} className="flex items-center">
          <Plus size={16} className="mr-1" />
          Add Nested Rule Group
        </Button>
        <Button variant="ghost" size="sm" onClick={() => updateField("repeatForEach", "user.roles")}>
          <Plus size={16} className="mr-1" />
          Repeat for Each...
        </Button>
        <Button
          variant="link"
          className="text-primary ml-3"
          onClick={toggleConditions}
        >
          Conditions: {showConditions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </Button>
      </div>

      {showConditions && (
        <div className="border rounded p-3 mt-3 bg-white dark:bg-muted/80">
          <ConditionGroupBlock
            group={rule.conditions}
            onChange={group => updateField("conditions", group)}
            availableAttributes={["user.id", "user.roles", "resource.owner_id", "input.method", "time.weekday(now)"]}
            pipSources={["time", "net"]}
          />
        </div>
      )}

      {/* Render Nested Groups if implemented */}
      {showNested && rule.nestedGroups && rule.nestedGroups.length > 0 && (
        <div className="pl-7 mt-3 border-l-2 border-muted-foreground">
          {rule.nestedGroups.map(ng => (
            <div key={ng.id} className="mt-3">
              {/* Recursive blocks could go here */}
              <span className="font-semibold text-xs mb-2 bg-muted px-2 py-1 rounded">Nested Group ({ng.operator})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
