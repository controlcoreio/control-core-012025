
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ResourceTag {
  id: string;
  tagName: string;
  description: string;
  tagType?: string;
  associatedPolicies: number;
  associatedResources: number;
  lastModified: string;
}

interface ResourceTagData {
  tagName: string;
  description: string;
  tagType?: string;
}

interface AddEditResourceTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tag: ResourceTag | null;
  onSave: (tagData: ResourceTagData) => void;
}

const tagTypes = [
  "Data Sensitivity",
  "Environment", 
  "Application Type",
  "Compliance Category",
  "Security Level",
  "Business Function"
];

export function AddEditResourceTagDialog({ 
  isOpen, 
  onClose, 
  tag, 
  onSave 
}: AddEditResourceTagDialogProps) {
  const [formData, setFormData] = useState<ResourceTagData>({
    tagName: "",
    description: "",
    tagType: undefined
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        tagName: tag.tagName,
        description: tag.description,
        tagType: tag.tagType
      });
    } else {
      setFormData({
        tagName: "",
        description: "",
        tagType: undefined
      });
    }
  }, [tag, isOpen]);

  const handleSave = () => {
    if (!formData.tagName.trim()) return;
    
    onSave({
      ...formData,
      tagType: formData.tagType || undefined
    });
  };

  const handleTagTypeChange = (value: string) => {
    setFormData({ 
      ...formData, 
      tagType: value === "__none__" ? undefined : value 
    });
  };

  const isValid = formData.tagName.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {tag ? "Edit Application/Resource Tag" : "Add New Application/Resource Tag"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tagName">Tag Name *</Label>
            <Input
              id="tagName"
              value={formData.tagName}
              onChange={(e) => setFormData({ ...formData, tagName: e.target.value })}
              placeholder="e.g., Customer_Data, PII_Protected"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Use underscores instead of spaces for tag names
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Sensitive customer identifiable information"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tagType">Tag Type (Optional)</Label>
            <Select 
              value={formData.tagType || "__none__"} 
              onValueChange={handleTagTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tag type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {tagTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
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
            {tag ? "Save Changes" : "Create Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
