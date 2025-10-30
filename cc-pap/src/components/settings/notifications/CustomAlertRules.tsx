
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { CustomAlertRuleModal, CustomAlertRule } from "./CustomAlertRuleModal";

interface CustomAlertRulesProps {
  environment: string;
}

export function CustomAlertRules({ environment }: CustomAlertRulesProps) {
  const [rules, setRules] = useState<CustomAlertRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomAlertRule | null>(null);

  // Reload rules when environment changes
  useEffect(() => {
    // In a full implementation, load rules from API per environment
    // For now, just clear rules to show environment-specific behavior
    setRules([]);
  }, [environment]);

  const handleAddRule = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEditRule = (rule: CustomAlertRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    // In full implementation, make DELETE API call with environment parameter
  };

  const handleSaveRule = (rule: CustomAlertRule) => {
    if (editingRule) {
      setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    } else {
      setRules(prev => [...prev, { ...rule, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setEditingRule(null);
    // In full implementation, make POST/PUT API call with environment parameter
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Alert Rules</CardTitle>
              <CardDescription>
                Create custom conditions to trigger alerts based on your specific requirements
              </CardDescription>
            </div>
            <Button onClick={handleAddRule}>
              <EnterpriseIcon name="plus" size={16} className="mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No custom alert rules configured yet. Create your first rule to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge 
                          variant={rule.enabled ? "default" : "secondary"}
                          className={rule.enabled ? getSeverityColor(rule.severity) : ""}
                        >
                          {rule.enabled ? rule.severity.toUpperCase() : "DISABLED"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <div className="text-xs bg-muted p-2 rounded font-mono">
                        {rule.condition}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditRule(rule)}>
                        <EnterpriseIcon name="pencil" size={12} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <EnterpriseIcon name="trash" size={12} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Channels:</span>
                    {rule.channels.map((channel) => (
                      <Badge key={channel} variant="outline" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CustomAlertRuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
        rule={editingRule}
      />
    </>
  );
}
