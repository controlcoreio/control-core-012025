
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddEditOrganizationalUnitDialog } from "./AddEditOrganizationalUnitDialog";

interface OrganizationalUnit {
  id: string;
  name: string;
  description: string;
  parentUnit?: string;
  associatedPolicies: number;
  associatedUsers: number;
  lastModified: string;
}

const mockOrganizationalUnits: OrganizationalUnit[] = [
  {
    id: "1",
    name: "Finance Department",
    description: "Manages all financial data access policies",
    associatedPolicies: 25,
    associatedUsers: 3,
    lastModified: "2024-06-01T10:30:00Z"
  },
  {
    id: "2", 
    name: "HR Team",
    description: "Human resources and employee data management",
    associatedPolicies: 18,
    associatedUsers: 2,
    lastModified: "2024-05-28T14:15:00Z"
  },
  {
    id: "3",
    name: "Customer Service",
    description: "Customer support and service operations",
    associatedPolicies: 12,
    associatedUsers: 1,
    lastModified: "2024-05-25T09:45:00Z"
  },
  {
    id: "4",
    name: "Europe Sales",
    description: "European sales operations",
    parentUnit: "Global Sales Department",
    associatedPolicies: 8,
    associatedUsers: 1,
    lastModified: "2024-05-20T16:20:00Z"
  }
];

export function OrganizationalUnitsTab() {
  const [units, setUnits] = useState<OrganizationalUnit[]>(mockOrganizationalUnits);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<OrganizationalUnit | null>(null);

  const handleAddUnit = () => {
    setEditingUnit(null);
    setIsDialogOpen(true);
  };

  const handleEditUnit = (unit: OrganizationalUnit) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  };

  const handleDeleteUnit = (unitId: string) => {
    // In a real app, this would show a confirmation dialog
    setUnits(units.filter(unit => unit.id !== unitId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Organizational Units</h3>
          <p className="text-sm text-muted-foreground">
            Define the structural units of the organization that policies and users can be associated with.
          </p>
        </div>
        <Button onClick={handleAddUnit}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Organizational Unit
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Parent Unit</TableHead>
            <TableHead>Associated Policies</TableHead>
            <TableHead>Associated Users</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.id}>
              <TableCell className="font-medium">{unit.name}</TableCell>
              <TableCell className="max-w-sm">
                <div className="truncate">{unit.description}</div>
              </TableCell>
              <TableCell>
                {unit.parentUnit && (
                  <Badge variant="outline">{unit.parentUnit}</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button variant="link" className="p-0 h-auto text-primary">
                  {unit.associatedPolicies}
                </Button>
              </TableCell>
              <TableCell>
                <Button variant="link" className="p-0 h-auto text-primary">
                  {unit.associatedUsers} Policy Managers
                </Button>
              </TableCell>
              <TableCell>{formatDate(unit.lastModified)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditUnit(unit)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteUnit(unit.id)}
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

      <AddEditOrganizationalUnitDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        unit={editingUnit}
        onSave={(unitData) => {
          if (editingUnit) {
            // Edit existing unit
            setUnits(units.map(unit => 
              unit.id === editingUnit.id 
                ? { ...unit, ...unitData, lastModified: new Date().toISOString() }
                : unit
            ));
          } else {
            // Add new unit
            const newUnit: OrganizationalUnit = {
              id: Date.now().toString(),
              ...unitData,
              associatedPolicies: 0,
              associatedUsers: 0,
              lastModified: new Date().toISOString()
            };
            setUnits([...units, newUnit]);
          }
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
