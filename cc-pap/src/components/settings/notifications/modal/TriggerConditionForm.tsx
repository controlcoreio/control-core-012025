
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface RuleCondition {
  attribute: string;
  operator: string;
  value: string;
}

interface TriggerConditionFormProps {
  eventType: string;
  conditions: RuleCondition[];
  onEventTypeChange: (value: string) => void;
  onConditionsChange: (conditions: RuleCondition[]) => void;
}

const eventTypes = [
  "Policy Deny",
  "Resource Access",
  "Configuration Change",
  "PEP Status Change"
];

const attributes = [
  "subject.id",
  "subject.type",
  "resource.url",
  "policy.name",
  "request.ai_model_name",
  "request.ai_agent_id",
  "request.ip_address",
  "event.outcome"
];

const operators = ["=", "!=", "contains", "starts with", "ends with", ">", "<", ">=", "<="];

export function TriggerConditionForm({
  eventType,
  conditions,
  onEventTypeChange,
  onConditionsChange
}: TriggerConditionFormProps) {
  const addCondition = () => {
    onConditionsChange([...conditions, { attribute: "", operator: "=", value: "" }]);
  };

  const updateCondition = (index: number, field: keyof RuleCondition, value: string) => {
    const newConditions = conditions.map((condition, i) => 
      i === index ? { ...condition, [field]: value } : condition
    );
    onConditionsChange(newConditions);
  };

  const removeCondition = (index: number) => {
    onConditionsChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trigger Condition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="event-type">When</Label>
          <select
            id="event-type"
            value={eventType}
            onChange={(e) => onEventTypeChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Additional Conditions</Label>
            <Button type="button" variant="outline" size="sm" onClick={addCondition}>
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>

          {conditions.map((condition, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
              <select
                value={condition.attribute}
                onChange={(e) => updateCondition(index, 'attribute', e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Select attribute...</option>
                {attributes.map(attr => (
                  <option key={attr} value={attr}>{attr}</option>
                ))}
              </select>
              <select
                value={condition.operator}
                onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                className="w-32 rounded-md border border-input bg-background px-3 py-2"
              >
                {operators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              <Input
                value={condition.value}
                onChange={(e) => updateCondition(index, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCondition(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
