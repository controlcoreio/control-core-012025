
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface AddPDPGroupDialogProps {
  onClose: () => void;
  onSave: (group: any) => void;
}

const availableOPAInstances = [
  { id: "opa-prod-us-east-02", name: "Production East 02", environment: "Production", topics: ["web-auth", "api-gateway"] },
  { id: "opa-prod-us-west-02", name: "Production West 02", environment: "Production", topics: ["web-auth", "user-permissions"] },
  { id: "opa-staging-02", name: "Staging Instance 02", environment: "Staging", topics: ["testing", "dev-auth"] },
  { id: "opa-qa-02", name: "QA Instance 02", environment: "QA", topics: ["qa-testing"] }
];

const availableOPALTopics = [
  "web-auth",
  "api-gateway", 
  "user-permissions",
  "hr-policies",
  "employee-data",
  "testing",
  "dev-auth",
  "qa-testing",
  "admin-policies",
  "audit-logs"
];

export function AddPDPGroupDialog({ onClose, onSave }: AddPDPGroupDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    environment: "",
    loadBalancingStrategy: "",
    selectedMembers: [] as string[],
    selectedTopics: [] as string[]
  });

  const handleMemberToggle = (opaId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(opaId)
        ? prev.selectedMembers.filter(id => id !== opaId)
        : [...prev.selectedMembers, opaId]
    }));
  };

  const handleTopicToggle = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter(t => t !== topic)
        : [...prev.selectedTopics, topic]
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const filteredOPAInstances = availableOPAInstances.filter(opa => 
    !formData.environment || opa.environment === formData.environment
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New PDP Group</DialogTitle>
          <DialogDescription>
            Create a logical cluster of OPA instances managed by OPAL with shared topic subscriptions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name *</Label>
            <Input
              id="groupName"
              placeholder="e.g., Production Web-Auth Cluster"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this PDP group's purpose"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="environment">Deployment Environment *</Label>
            <Select value={formData.environment} onValueChange={(value) => setFormData(prev => ({ ...prev, environment: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="qa">QA / Testing</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>OPAL Topics *</Label>
            <p className="text-xs text-muted-foreground">Select which OPAL topics this group should subscribe to</p>
            <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {availableOPALTopics.map((topic) => (
                  <div key={topic} className="flex items-center space-x-2">
                    <Checkbox
                      id={`topic-${topic}`}
                      checked={formData.selectedTopics.includes(topic)}
                      onCheckedChange={() => handleTopicToggle(topic)}
                    />
                    <Label htmlFor={`topic-${topic}`} className="text-sm font-normal">
                      {topic}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {formData.selectedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.selectedTopics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loadBalancing">Load Balancing Strategy</Label>
            <Select value={formData.loadBalancingStrategy} onValueChange={(value) => setFormData(prev => ({ ...prev, loadBalancingStrategy: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round-robin">Round Robin</SelectItem>
                <SelectItem value="least-latency">Least Latency</SelectItem>
                <SelectItem value="failover-priority">Failover Priority</SelectItem>
                <SelectItem value="weighted">Weighted Distribution</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign OPA Instances</Label>
            <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
              {filteredOPAInstances.length > 0 ? (
                <div className="space-y-2">
                  {filteredOPAInstances.map((opa) => (
                    <div key={opa.id} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={opa.id}
                          checked={formData.selectedMembers.includes(opa.id)}
                          onCheckedChange={() => handleMemberToggle(opa.id)}
                        />
                        <Label htmlFor={opa.id} className="text-sm font-normal">
                          {opa.name} ({opa.environment})
                        </Label>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-6">
                        {opa.topics.map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {formData.environment ? 
                    "No unassigned OPA instances available in this environment" : 
                    "Select an environment to see available OPA instances"
                  }
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.name || !formData.environment || formData.selectedTopics.length === 0}
          >
            Save Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
