
import { useState } from "react";

export interface PermissionRule {
  id: string;
  effect: "allow" | "deny";
  actions: string[];
  resourceInstance: string;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionRule[]>([]);
  const [showConditionForRule, setShowConditionForRule] = useState<{[id:string]:boolean}>({});

  const addPermission = () => {
    const id = Date.now() + "_" + Math.random().toString(16).slice(2,5);
    setPermissions([
      ...permissions,
      {
        id,
        effect: "allow",
        actions: [],
        resourceInstance: "Any"
      }
    ]);
  };

  const removePermission = (idx: number) => {
    setPermissions(permissions.filter((_,i) => i !== idx));
  };

  const updatePermission = (idx: number, rule: PermissionRule) => {
    setPermissions(permissions.map((r,i) => i===idx ? rule : r));
  };

  const toggleConditionsForRule = (id: string) => {
    setShowConditionForRule(s => ({...s, [id]: !s[id]}));
  };

  return {
    permissions,
    showConditionForRule,
    addPermission,
    removePermission,
    updatePermission,
    toggleConditionsForRule
  };
}
