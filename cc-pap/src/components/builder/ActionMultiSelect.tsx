
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ActionMultiSelectProps {
  values: string[];
  customValue?: string;
  availableActions: string[];
  onChange: (selected: string[], custom?: string) => void;
}
export const ActionMultiSelect: React.FC<ActionMultiSelectProps> = ({
  values, customValue, availableActions, onChange,
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState(customValue || "");

  const toggleAction = (action: string) => {
    if (values.includes(action)) {
      onChange(values.filter(a => a !== action));
    } else {
      onChange([...values, action]);
    }
  };

  const handleCustomAdd = () => {
    if (custom && !values.includes(custom)) {
      onChange([...values, custom], "");
      setShowCustom(false);
      setCustom("");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {availableActions.map(action => (
        <Button
          key={action}
          variant={values.includes(action) ? "default" : "outline"}
          size="sm"
          onClick={() => toggleAction(action)}
        >
          {action}
        </Button>
      ))}
      {!showCustom ? (
        <Button variant="outline" size="sm" onClick={() => setShowCustom(true)}>
          <Plus size={14} className="mr-1" />Custom Action
        </Button>
      ) : (
        <div className="flex gap-1">
          <Input
            className="text-xs w-[100px]"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Custom..."
          />
          <Button
            type="button"
            size="sm"
            onClick={handleCustomAdd}
            disabled={!custom}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
};
