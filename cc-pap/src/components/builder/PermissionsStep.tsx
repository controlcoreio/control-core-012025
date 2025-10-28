
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PermissionRuleBlock } from "./PermissionRuleBlock";
import { usePermissions } from "@/hooks/usePermissions";
import { TierLimitModal } from "@/components/common/TierLimitModal";

const actions = ["view", "edit", "delete", "transfer"];
const MAX_RULES_PER_POLICY = 5;

interface PermissionsStepProps {
  permissions: ReturnType<typeof usePermissions>['permissions'];
  showConditionForRule: ReturnType<typeof usePermissions>['showConditionForRule'];
  addPermission: ReturnType<typeof usePermissions>['addPermission'];
  removePermission: ReturnType<typeof usePermissions>['removePermission'];
  updatePermission: ReturnType<typeof usePermissions>['updatePermission'];
  toggleConditionsForRule: ReturnType<typeof usePermissions>['toggleConditionsForRule'];
}

export function PermissionsStep({
  permissions,
  showConditionForRule,
  addPermission,
  removePermission,
  updatePermission,
  toggleConditionsForRule
}: PermissionsStepProps) {
  const [showTierLimitModal, setShowTierLimitModal] = useState(false);
  const isAtMaxRules = permissions.length >= MAX_RULES_PER_POLICY;

  const handleAddPermission = () => {
    if (isAtMaxRules) {
      setShowTierLimitModal(true);
      return;
    }
    addPermission();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Define Permissions</h2>
        <div className="text-sm text-muted-foreground">
          {permissions.length}/{MAX_RULES_PER_POLICY} permission rules used
        </div>
      </div>
      <p className="text-muted-foreground mb-2">
        Define which actions are allowed or denied on the selected resources. Use advanced logic by nesting rules or looping over attributes.
      </p>
      <Button
        onClick={handleAddPermission}
        variant="default"
        disabled={isAtMaxRules}
        title={isAtMaxRules ? "Maximum 5 conditions/rules per policy." : undefined}
      >
        + Add Permission Rule
      </Button>
      <div className="mt-4 space-y-3">
        {permissions.map((rule, idx) => (
          <PermissionRuleBlock
            key={rule.id}
            rule={rule}
            availableActions={actions}
            onChange={r => updatePermission(idx, r)}
            onRemove={() => removePermission(idx)}
            onAddNestedGroup={()=>{}}
            showConditions={!!showConditionForRule[rule.id]}
            toggleConditions={() => toggleConditionsForRule(rule.id)}
          />
        ))}
      </div>
      
      <TierLimitModal
        open={showTierLimitModal}
        onOpenChange={setShowTierLimitModal}
        type="conditions"
      />
    </div>
  );
}
