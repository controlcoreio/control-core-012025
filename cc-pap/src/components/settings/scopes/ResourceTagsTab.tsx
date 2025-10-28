
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddEditResourceTagDialog } from "./AddEditResourceTagDialog";

interface ResourceTag {
  id: string;
  tagName: string;
  description: string;
  tagType?: string;
  associatedPolicies: number;
  associatedResources: number;
  lastModified: string;
}

const mockResourceTags: ResourceTag[] = [
  {
    id: "1",
    tagName: "Customer_Data",
    description: "Sensitive customer identifiable information",
    tagType: "Data Sensitivity",
    associatedPolicies: 18,
    associatedResources: 7,
    lastModified: "2024-06-01T11:20:00Z"
  },
  {
    id: "2",
    tagName: "PII_Protected", 
    description: "Personally identifiable information requiring protection",
    tagType: "Compliance Category",
    associatedPolicies: 22,
    associatedResources: 5,
    lastModified: "2024-05-30T09:15:00Z"
  },
  {
    id: "3",
    tagName: "Internal_API",
    description: "Internal microservices and APIs",
    tagType: "Application Type",
    associatedPolicies: 15,
    associatedResources: 12,
    lastModified: "2024-05-28T16:45:00Z"
  },
  {
    id: "4",
    tagName: "Production_Database",
    description: "Production database systems",
    tagType: "Environment",
    associatedPolicies: 8,
    associatedResources: 3,
    lastModified: "2024-05-25T14:30:00Z"
  }
];

export function ResourceTagsTab() {
  const [tags, setTags] = useState<ResourceTag[]>(mockResourceTags);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ResourceTag | null>(null);

  const handleAddTag = () => {
    setEditingTag(null);
    setIsDialogOpen(true);
  };

  const handleEditTag = (tag: ResourceTag) => {
    setEditingTag(tag);
    setIsDialogOpen(true);
  };

  const handleDeleteTag = (tagId: string) => {
    // In a real app, this would show a confirmation dialog
    setTags(tags.filter(tag => tag.id !== tagId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Application & Resource Tags</h3>
          <p className="text-sm text-muted-foreground">
            Define logical groupings and categories for applications and various types of resources that policies will protect.
          </p>
        </div>
        <Button onClick={handleAddTag}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Application/Resource Tag
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tag Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Tag Type</TableHead>
            <TableHead>Associated Policies</TableHead>
            <TableHead>Associated Resources</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag.id}>
              <TableCell className="font-medium font-mono">{tag.tagName}</TableCell>
              <TableCell className="max-w-sm">
                <div className="truncate">{tag.description}</div>
              </TableCell>
              <TableCell>
                {tag.tagType && (
                  <Badge variant="outline">{tag.tagType}</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button variant="link" className="p-0 h-auto text-primary">
                  {tag.associatedPolicies}
                </Button>
              </TableCell>
              <TableCell>
                <Button variant="link" className="p-0 h-auto text-primary">
                  {tag.associatedResources} Resources
                </Button>
              </TableCell>
              <TableCell>{formatDate(tag.lastModified)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditTag(tag)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AddEditResourceTagDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        tag={editingTag}
        onSave={(tagData) => {
          if (editingTag) {
            // Edit existing tag
            setTags(tags.map(tag => 
              tag.id === editingTag.id 
                ? { ...tag, ...tagData, lastModified: new Date().toISOString() }
                : tag
            ));
          } else {
            // Add new tag
            const newTag: ResourceTag = {
              id: Date.now().toString(),
              ...tagData,
              associatedPolicies: 0,
              associatedResources: 0,
              lastModified: new Date().toISOString()
            };
            setTags([...tags, newTag]);
          }
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
