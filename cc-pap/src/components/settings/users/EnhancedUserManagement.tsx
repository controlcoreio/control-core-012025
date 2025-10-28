import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Shield, 
  Key, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  Activity
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SecureStorage } from "@/utils/secureStorage";
import { APP_CONFIG } from "@/config/app";
import { formatDistanceToNow } from "date-fns";
import { PasswordChangeModal } from "@/components/auth/PasswordChangeModal";
import { UserAuditLogsDialog } from "./UserAuditLogsDialog";
import { ControlCoreAuditLogsDialog } from "./ControlCoreAuditLogsDialog";

// Enhanced user interface with Auth0 integration
interface EnhancedUser {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
  permissions: string[];
  status: UserStatus;
  mfa_enabled: boolean;
  last_login: string;
  created_at: string;
  subscription_tier: string;
  deployment_model: string;
  github_repo?: string;
  user_source?: string;
  auth_methods: AuthMethod[];
  session_info: SessionInfo;
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number;
  inherits_from?: string[];
}

interface AuthMethod {
  type: 'password' | 'mfa' | 'sso' | 'passkey' | 'magic_link';
  enabled: boolean;
  last_used?: string;
  metadata?: Record<string, any>;
}

interface SessionInfo {
  active_sessions: number;
  last_activity: string;
  ip_addresses: string[];
  user_agents: string[];
}

type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// SOC2-compliant role definitions
const SOC2_COMPLIANT_ROLES: UserRole[] = [
  {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Complete platform control with billing and compliance oversight',
    permissions: [
      'user.manage.all',
      'policy.manage.all',
      'system.configure.all',
      'billing.manage.all',
      'compliance.manage.all',
      'audit.view.all',
      'security.manage.all',
      'tenant.manage.all'
    ],
    level: 100
  },
  {
    id: 'policy_admin',
    name: 'Policy Administrator',
    description: 'Create and manage policies with audit log access',
    permissions: [
      'policy.create',
      'policy.edit',
      'policy.delete',
      'policy.deploy',
      'policy.test',
      'audit.view.policies',
      'resource.manage',
      'context.manage'
    ],
    level: 80
  },
  {
    id: 'security_analyst',
    name: 'Security Analyst',
    description: 'Monitor security events and analyze compliance',
    permissions: [
      'security.monitor',
      'audit.view.security',
      'compliance.view',
      'incident.manage',
      'policy.view',
      'resource.view'
    ],
    level: 70
  },
  {
    id: 'resource_manager',
    name: 'Resource Manager',
    description: 'Configure protected resources and data sources',
    permissions: [
      'resource.create',
      'resource.edit',
      'resource.delete',
      'resource.configure',
      'context.source.manage',
      'policy.view',
      'audit.view.resources'
    ],
    level: 60
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Develop and test policies with limited deployment access',
    permissions: [
      'policy.create',
      'policy.edit',
      'policy.test',
      'policy.view',
      'resource.view',
      'context.view'
    ],
    level: 40
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to dashboards and reports',
    permissions: [
      'policy.view',
      'resource.view',
      'audit.view.basic',
      'dashboard.view'
    ],
    level: 20
  }
];

// Helper functions
const mapRole = (roleStr: string): UserRole => {
  if (roleStr === 'builtin_admin') {
    return {
      id: 'super_admin',
      name: 'Super Administrator',
      description: 'Built-in system administrator with complete platform control',
      permissions: SOC2_COMPLIANT_ROLES[0].permissions,
      level: 100
    };
  }
  
  if (roleStr === 'admin') {
    return SOC2_COMPLIANT_ROLES[0];
  }
  
  // Map other roles
  const role = SOC2_COMPLIANT_ROLES.find(r => r.id === roleStr);
  return role || SOC2_COMPLIANT_ROLES[5]; // Default to viewer
};

const mapBackendUserToFrontend = (user: any): EnhancedUser => ({
  id: user.id.toString(),
  auth0_id: user.id.toString(),
  email: user.email,
  name: user.name,
  username: user.username,
  role: mapRole(user.role),
  permissions: user.permissions || [],
  status: user.status,
  mfa_enabled: user.mfa_enabled || false,
  last_login: user.last_login || user.created_at,
  created_at: user.created_at,
  subscription_tier: user.subscription_tier,
  deployment_model: user.deployment_model,
  github_repo: user.github_repo,
  user_source: user.user_source || 'local',
  auth_methods: [{ type: 'password', enabled: true }],
  session_info: {
    active_sessions: user.active_sessions || 0,
    last_activity: user.last_activity || user.last_login,
    ip_addresses: user.last_ip_address ? [user.last_ip_address] : [],
    user_agents: []
  }
});

export default function EnhancedUserManagement() {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [changePasswordUser, setChangePasswordUser] = useState<EnhancedUser | null>(null);
  const [auditLogsUser, setAuditLogsUser] = useState<EnhancedUser | null>(null);
  const [showControlCoreAuditLogs, setShowControlCoreAuditLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('users');
  
  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const token = SecureStorage.getItem('access_token');
        const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const data = await response.json();
        setUsers(data.map(mapBackendUserToFrontend));
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Check SSO configuration
  useEffect(() => {
    const checkSSO = async () => {
      try {
        const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth/sso/status`);
        const data = await response.json();
        setSsoEnabled(data.configured);
      } catch (err) {
        console.error('Error checking SSO status:', err);
      }
    };
    
    checkSSO();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role.id === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleBadgeColor = (roleId: string) => {
    const colors = {
      'super_admin': 'bg-red-100 text-red-800',
      'policy_admin': 'bg-blue-100 text-blue-800',
      'security_analyst': 'bg-purple-100 text-purple-800',
      'resource_manager': 'bg-green-100 text-green-800',
      'developer': 'bg-yellow-100 text-yellow-800',
      'viewer': 'bg-gray-100 text-gray-800'
    };
    return colors[roleId as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleUserStatusToggle = async (userId: string, newStatus: UserStatus) => {
    // This would call backend API to update user status
    // For now, update local state
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const handleRoleChange = (userId: string, newRoleId: string) => {
    const newRole = SOC2_COMPLIANT_ROLES.find(role => role.id === newRoleId);
    if (newRole) {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { 
          ...user, 
          role: newRole, 
          permissions: newRole.permissions 
        } : user
      ));
    }
  };

  const handleMfaToggle = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    try {
      const token = SecureStorage.getItem('access_token');
      const endpoint = user.mfa_enabled 
        ? `${APP_CONFIG.api.baseUrl}/auth/users/${userId}/mfa/disable`
        : `${APP_CONFIG.api.baseUrl}/auth/users/${userId}/mfa/enable`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to toggle MFA');
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, mfa_enabled: !u.mfa_enabled } : u
      ));
    } catch (err) {
      console.error('Error toggling MFA:', err);
    }
  };

  const handleKillSessions = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const activeSessions = user.session_info?.active_sessions || 0;
    if (activeSessions === 0) {
      alert(`${user.username} has no active sessions to terminate.`);
      return;
    }

    if (!confirm(`Are you sure you want to terminate all ${activeSessions} active session(s) for ${user.username}?\n\nThis will force the user to log in again.`)) {
      return;
    }

    try {
      const token = SecureStorage.getItem('access_token');
      const response = await fetch(
        `${APP_CONFIG.api.baseUrl}/auth/users/${userId}/kill-sessions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to kill sessions');
      
      const data = await response.json();
      alert(`Successfully terminated ${data.sessions_killed} active session(s) for ${user.username}`);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { 
          ...u, 
          session_info: { ...u.session_info, active_sessions: 0 } 
        } : u
      ));
    } catch (err) {
      console.error('Error killing sessions:', err);
      alert('Failed to terminate sessions');
    }
  };

  return (
    <div className="space-y-6">
      {/* Compliance Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          All user actions are logged and audited for compliance.
        </AlertDescription>
      </Alert>

      {/* SSO Enabled Alert */}
      {ssoEnabled && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            SSO is configured. Users are provisioned via SAML/OIDC federation. 
            Manual user creation is disabled except for the built-in Super Administrator.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage users with your IdP or manually here with roles
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowControlCoreAuditLogs(true)}>
            <Activity className="h-4 w-4 mr-2" />
            Audit Logs
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={ssoEnabled}
            title={ssoEnabled ? "Manual user creation disabled when SSO is configured" : ""}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {SOC2_COMPLIANT_ROLES.map(role => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Manage user accounts with Auth0 integration and role-based access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auth Methods</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(user.role.id)}>
                        {user.role.name}
                      </Badge>
                      {user.user_source && user.user_source !== 'local' && (
                        <Badge variant="outline" className="text-xs">
                          {user.user_source.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.auth_methods.map((method, index) => (
                        <Badge 
                          key={index} 
                          variant={method.enabled ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {method.type}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(user.last_login).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(user.last_login).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline">
                        {user.session_info.active_sessions || 0} active
                      </Badge>
                      {user.session_info.last_activity && (
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(user.session_info.last_activity), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        
                        {/* Password change only for local users */}
                        {(!user.user_source || user.user_source === 'local') && (
                          <DropdownMenuItem onClick={() => setChangePasswordUser(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Change Password
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem onClick={() => handleMfaToggle(user.id)}>
                          {user.mfa_enabled ? (
                            <>
                              <Unlock className="h-4 w-4 mr-2" />
                              Disable MFA
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Enable MFA
                            </>
                          )}
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => setAuditLogsUser(user)}>
                          <Activity className="h-4 w-4 mr-2" />
                          View Audit Logs
                        </DropdownMenuItem>
                        
                        {/* Kill Sessions - show only if there are active sessions */}
                        {(user.session_info?.active_sessions || 0) > 0 && (
                          <DropdownMenuItem 
                            onClick={() => handleKillSessions(user.id)}
                            className="text-orange-600 dark:text-orange-400"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Kill All Sessions ({user.session_info.active_sessions})
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invite
                        </DropdownMenuItem>
                        {user.status === 'active' ? (
                          <DropdownMenuItem onClick={() => handleUserStatusToggle(user.id, 'suspended')}>
                            <UserX className="h-4 w-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUserStatusToggle(user.id, 'active')}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        
                        {/* Prevent deleting built-in admin */}
                        {user.username !== 'ccadmin' && (
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Definitions
          </CardTitle>
          <CardDescription>
            Role-based access control with principle of least privilege
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SOC2_COMPLIANT_ROLES.map((role) => (
              <div key={role.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{role.name}</h3>
                  <Badge variant="outline">Level {role.level}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Permissions:</div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission.split('.')[0]}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Password Change Modal */}
      {changePasswordUser && (
        <PasswordChangeModal
          open={!!changePasswordUser}
          onOpenChange={(open) => !open && setChangePasswordUser(null)}
          userId={changePasswordUser.id ? parseInt(changePasswordUser.id) : undefined}
          username={changePasswordUser.username}
          isAdminChange={true}
          onSuccess={() => {
            setChangePasswordUser(null);
            // Refresh users list
            window.location.reload();
          }}
        />
      )}
      
      {/* Audit Logs Dialog */}
      {auditLogsUser && (
        <UserAuditLogsDialog
          user={auditLogsUser}
          open={!!auditLogsUser}
          onOpenChange={(open) => !open && setAuditLogsUser(null)}
        />
      )}
      
      {/* Control Core Audit Logs Dialog */}
      <ControlCoreAuditLogsDialog
        open={showControlCoreAuditLogs}
        onOpenChange={setShowControlCoreAuditLogs}
      />
    </div>
  );
}
