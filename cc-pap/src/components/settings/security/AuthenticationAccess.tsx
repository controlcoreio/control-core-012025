
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Key, Users, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function AuthenticationAccess() {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              SSO/IdP Integration
            </CardTitle>
            <CardDescription>Configure Single Sign-On with enterprise Identity Providers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sso-enabled">SSO Authentication</Label>
              <Switch id="sso-enabled" defaultChecked />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-green-900">Azure AD</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                </div>
                <p className="text-sm text-green-700">Primary identity provider for platform access</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Okta</span>
                  <Badge variant="outline" className="text-gray-600">Not Configured</Badge>
                </div>
                <p className="text-sm text-gray-600">Additional identity provider option</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm">Configure SSO</Button>
              <Button variant="outline" size="sm">Test Connection</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Service Account Management
            </CardTitle>
            <CardDescription>Manage dedicated service accounts for platform-to-platform communication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { name: "Platform Monitoring Service", scope: "Read-only metrics", status: "Active" },
                { name: "Backup Service", scope: "Policy Store backup", status: "Active" },
                { name: "External Audit System", scope: "Audit log access", status: "Inactive" },
              ].map((account) => (
                <div key={account.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{account.name}</div>
                    <div className="text-xs text-muted-foreground">{account.scope}</div>
                  </div>
                  <Badge variant={account.status === 'Active' ? 'default' : 'secondary'}>
                    {account.status}
                  </Badge>
                </div>
              ))}
            </div>

            <Button size="sm" className="w-full">Create Service Account</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-600" />
            API Key Management
          </CardTitle>
          <CardDescription>Generate and manage API keys for programmatic access to PAP endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">API Access Control</h4>
                <p className="text-sm text-muted-foreground">Control programmatic access to Policy Administration endpoints</p>
              </div>
              <Button>Create New API Key</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Production PAP Access</TableCell>
                  <TableCell>Policy CRUD, Deploy</TableCell>
                  <TableCell>2024-05-15</TableCell>
                  <TableCell>2 hours ago</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">CI/CD Pipeline</TableCell>
                  <TableCell>Policy Validation</TableCell>
                  <TableCell>2024-05-20</TableCell>
                  <TableCell>1 day ago</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Legacy Integration</TableCell>
                  <TableCell>Read-only</TableCell>
                  <TableCell>2024-04-10</TableCell>
                  <TableCell>Never</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Inactive</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Security Best Practices</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Rotate API keys regularly (recommended: every 90 days)</li>
                <li>• Use the principle of least privilege for API key scopes</li>
                <li>• Monitor API key usage and revoke unused keys</li>
                <li>• Store API keys securely in your secret management system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
