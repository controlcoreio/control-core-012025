
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Eye, Building, Globe } from "lucide-react";

// User type - should be fetched from backend
interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  status: string;
  permissions?: string[];
  mfaEnabled?: boolean;
  subscriptionTier?: string;
  deploymentModel?: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  user: User | null;
}

export default function EditUserModal({ isOpen, onClose, onSave, user }: EditUserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: [...user.permissions],
        mfaEnabled: user.mfaEnabled,
        lastLogin: user.lastLogin
      });
    }
  }, [user, isOpen]);

  const handleSave = () => {
    if (formData.id && formData.username && formData.email && formData.name && formData.role) {
      onSave({
        id: formData.id,
        username: formData.username,
        password: user?.password || 'controldemo', // Keep existing password
        email: formData.email,
        name: formData.name,
        role: formData.role,
        permissions: formData.permissions || [],
        lastLogin: formData.lastLogin || new Date(),
        mfaEnabled: formData.mfaEnabled || false,
        status: user?.status || 'active' // Add required status property
      });
      onClose();
    }
  };

  const handleRoleChange = (newRole: string) => {
    setFormData({ ...formData, role: newRole });
    
    // Update permissions based on role
    let newPermissions: string[] = [];
    switch (newRole) {
      case 'Admin':
        newPermissions = ['read', 'write', 'delete', 'admin', 'user-management', 'system-settings'];
        break;
      case 'Policy Manager':
        newPermissions = ['read', 'write', 'policy-management', 'policy-create', 'policy-edit'];
        break;
      case 'Viewer':
        newPermissions = ['read'];
        break;
    }
    setFormData({ ...formData, role: newRole, permissions: newPermissions });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
        return <Shield className="h-4 w-4" />;
      case "Policy Manager":
        return <Users className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "Admin": 
        return "Full control of all settings, policies, and user management";
      case "Policy Manager": 
        return "Manage policies, view logs, run tests, and manage versions. Limited settings access";
      case "Viewer": 
        return "View-only access to policies and logs. No settings access";
      default: 
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username || ""}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="john.doe"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@company.com"
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="role">User Role</Label>
            <Select value={formData.role || ""} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-muted-foreground">Full platform access</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="Policy Manager">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Policy Manager</div>
                      <div className="text-xs text-muted-foreground">Policy management with limited settings</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="Viewer">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-muted-foreground">View-only access</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {formData.role && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {getRoleDescription(formData.role)}
                </p>
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-xs font-medium mb-2">Current Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.permissions?.map((permission, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Environment Scope</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Production Environment</span>
                <Badge variant="outline">Access Granted</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Sandbox Environment</span>
                <Badge variant="outline">Access Granted</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Environment access is currently managed at the organizational level
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="mfa">Multi-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require MFA for this user's login
              </p>
            </div>
            <Switch
              id="mfa"
              checked={formData.mfaEnabled || false}
              onCheckedChange={(checked) => setFormData({ ...formData, mfaEnabled: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
