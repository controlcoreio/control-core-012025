
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CustomAlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  enabled: boolean;
  channels: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface CustomAlertRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: CustomAlertRule) => void;
  rule: CustomAlertRule | null;
}

export function CustomAlertRuleModal({
  isOpen,
  onClose,
  onSave,
  rule
}: CustomAlertRuleModalProps) {
  const [formData, setFormData] = useState<Partial<CustomAlertRule>>(() => ({
    name: rule?.name || '',
    description: rule?.description || '',
    condition: rule?.condition || '',
    enabled: rule?.enabled ?? true,
    channels: rule?.channels || [],
    severity: rule?.severity || 'medium'
  }));

  const handleSave = () => {
    if (formData.name && formData.condition) {
      onSave({
        id: rule?.id || Date.now().toString(),
        name: formData.name!,
        description: formData.description || '',
        condition: formData.condition!,
        enabled: formData.enabled ?? true,
        channels: formData.channels || [],
        severity: formData.severity || 'medium'
      });
    }
  };

  const handleChannelChange = (channel: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      channels: checked 
        ? [...(prev.channels || []), channel]
        : (prev.channels || []).filter(c => c !== channel)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit' : 'Create'} Custom Alert Rule</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter rule name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
            />
          </div>
          
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Textarea
              id="condition"
              value={formData.condition || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
              placeholder="Enter condition logic"
              className="font-mono"
            />
          </div>
          
          <div>
            <Label>Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Notification Channels</Label>
            <div className="flex gap-4 mt-2">
              {['email', 'slack', 'webhook', 'serviceNow'].map((channel) => (
                <div key={channel} className="flex items-center space-x-2">
                  <Checkbox
                    id={channel}
                    checked={(formData.channels || []).includes(channel)}
                    onCheckedChange={(checked) => handleChannelChange(channel, !!checked)}
                  />
                  <Label htmlFor={channel}>{channel}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
