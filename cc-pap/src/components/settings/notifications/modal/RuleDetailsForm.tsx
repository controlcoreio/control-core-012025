
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";

interface RuleDetailsFormProps {
  ruleName: string;
  description: string;
  onRuleNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function RuleDetailsForm({
  ruleName,
  description,
  onRuleNameChange,
  onDescriptionChange
}: RuleDetailsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EnterpriseIcon name="document" size={18} />
          Rule Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="rule-name" className="flex items-center gap-2">
              <EnterpriseIcon name="pencil" size={14} />
              Rule Name
            </Label>
            <Input
              id="rule-name"
              value={ruleName}
              onChange={(e) => onRuleNameChange(e.target.value)}
              placeholder="e.g., Frequent Denials for AI Agent"
            />
          </div>
          <div>
            <Label htmlFor="description" className="flex items-center gap-2">
              <EnterpriseIcon name="information-circle" size={14} />
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Clearer explanation for your team"
              rows={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
