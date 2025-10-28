
import React, { useState } from "react";
import { ConditionGroupBlock, ConditionGroup } from "./ConditionGroupBlock";
import { TierLimitModal } from "@/components/common/TierLimitModal";

const MAX_CONDITIONS_PER_POLICY = 5;

interface ConditionsStepProps {
  policyConditions: ConditionGroup | undefined;
  setPolicyConditions: (conditions: ConditionGroup) => void;
}

export // Helper function to count total conditions recursively
function countConditions(group: ConditionGroup | undefined): number {
  if (!group || !group.conditions) return 0;
  
  return group.conditions.reduce((count, condition) => {
    if ('operator' in condition && 'conditions' in condition) {
      // It's a ConditionGroup
      return count + countConditions(condition as ConditionGroup);
    } else {
      // It's a ConditionRule
      return count + 1;
    }
  }, 0);
}

export function ConditionsStep({ policyConditions, setPolicyConditions }: ConditionsStepProps) {
  const [showTierLimitModal, setShowTierLimitModal] = useState(false);
  const conditionsCount = countConditions(policyConditions);

  const handleConditionsChange = (conditions: ConditionGroup) => {
    const newCount = countConditions(conditions);
    
    if (newCount > MAX_CONDITIONS_PER_POLICY) {
      setShowTierLimitModal(true);
      return;
    }
    
    setPolicyConditions(conditions);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Define Conditions</h2>
        <div className="text-sm text-muted-foreground">
          {conditionsCount}/{MAX_CONDITIONS_PER_POLICY} conditions used
        </div>
      </div>
      <p className="text-muted-foreground mb-2">
        Define criteria for when the permissions are evaluated.<br />
        Add rules, groups, loops, or use OPA built-ins and NOT logic. Drag or group conditions for advanced logic.
      </p>
      <ConditionGroupBlock
        group={policyConditions}
        onChange={handleConditionsChange}
        availableAttributes={[
          "user.id", "user.roles", "user.groups", "resource.owner_id", "input.method", "input.path", "time.weekday(now)", "ip"
        ]}
        pipSources={["time", "net"]}
        maxConditions={MAX_CONDITIONS_PER_POLICY}
        currentConditionsCount={conditionsCount}
        initial
      />
      
      <TierLimitModal
        open={showTierLimitModal}
        onOpenChange={setShowTierLimitModal}
        type="conditions"
      />
    </div>
  );
}
