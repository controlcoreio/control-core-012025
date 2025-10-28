
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrganizationalUnit {
  id: string;
  name: string;
  description: string;
  parentUnit?: string;
  associatedPolicies: number;
  associatedUsers: number;
  lastModified: string;
}

interface OrganizationalUnitData {
  name: string;
  description: string;
  parentUnit?: string;
}

interface AddEditOrganizationalUnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  unit: OrganizationalUnit | null;
  onSave: (unitData: OrganizationalUnitData) => void;
}

const mockParentUnits = [
  "Global Sales Department",
  "Engineering Division", 
  "Corporate Operations",
  "Regional Management"
];

export function AddEditOrganizationalUnitDialog({ 
  isOpen, 
  onClose, 
  unit, 
  onSave 
}: AddEditOrganizationalUnitDialogProps) {
  const [formData, setFormData] = useState<OrganizationalUnitData>({
    name: "",
    description: "",
    parentUnit: undefined
  });

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name,
        description: unit.description,
        parentUnit: unit.parentUnit
      });
    } else {
      setFormData({
        name: "",
        description: "",
        parentUnit: undefined
      });
    }
  }, [unit, isOpen]);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    onSave({
      ...formData,
      parentUnit: formData.parentUnit || undefined
    });
  };

  const handleParentUnitChange = (value: string) => {
    setFormData({ 
      ...formData, 
      parentUnit: value === "__none__" ? undefined : value 
    });
  };

  const isValid = formData.name.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {unit ? "Edit Organizational Unit" : "Add New Organizational Unit"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Finance Department"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Manages all financial data access policies"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="parentUnit">Parent Unit (Optional)</Label>
            <Select 
              value={formData.parentUnit || "__none__"} 
              onValueChange={handleParentUnitChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent unit..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {mockParentUnits.map((parentUnit) => (
                  <SelectItem key={parentUnit} value={parentUnit}>
                    {parentUnit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {unit ? "Save Changes" : "Create Unit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
