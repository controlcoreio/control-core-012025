
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Key, Shield, Smartphone, QrCode, MoreHorizontal, CheckCircle, XCircle, Lock, Unlock } from "lucide-react";
import { SecureStorage } from "@/utils/secureStorage";
import { APP_CONFIG } from "@/config/app";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  mfa_enabled: boolean;
  status: string;
  role: string;
}

export default function MFAConfiguration() {
  const [globalMFARequired, setGlobalMFARequired] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleMfaToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const token = SecureStorage.getItem('access_token');
      const endpoint = currentStatus
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
        u.id === userId ? { ...u, mfa_enabled: !currentStatus } : u
      ));
    } catch (err) {
      console.error('Error toggling MFA:', err);
    }
  };
  
  const mfaEnabledCount = users.filter(u => u.mfa_enabled).length;
  const mfaPercentage = users.length > 0 ? Math.round((mfaEnabledCount / users.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* MFA Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>MFA Enabled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mfaEnabledCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mfaPercentage}% of users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>MFA Disabled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length - mfaEnabledCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {100 - mfaPercentage}% of users
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Global MFA Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Multi-Factor Authentication Policy
          </CardTitle>
          <CardDescription>
            Configure organization-wide MFA requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="global-mfa">Require MFA for all users</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, all users must configure MFA before accessing the platform
              </p>
            </div>
            <Switch
              id="global-mfa"
              checked={globalMFARequired}
              onCheckedChange={setGlobalMFARequired}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Google Authenticator</p>
                <p className="text-sm text-muted-foreground">Supported</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Microsoft Authenticator</p>
                <p className="text-sm text-muted-foreground">Supported</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User MFA Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            User MFA Configuration
          </CardTitle>
          <CardDescription>
            Manage MFA settings for individual users
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
          ) : users.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>MFA Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.mfa_enabled ? "default" : "secondary"}>
                        {user.mfa_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {user.mfa_enabled && (
                        <Badge variant="outline" className="text-xs">
                          TOTP
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={user.mfa_enabled ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleMfaToggle(user.id, user.mfa_enabled)}
                    >
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
                    </Button>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
