
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Key, Settings, Fingerprint } from "lucide-react";
import EnhancedUserManagement from "./EnhancedUserManagement";
import SSOConfiguration from "./SSOConfigurationTab";
import MFAConfiguration from "./MFAConfigurationTab";
import AuthenticationMethods from "./AuthenticationMethodsTab";
import PasskeyManagement from "./PasskeyManagement";

export default function UserManagementTabs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Comprehensive user management including SSO, MFA, and authentication methods
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="sso" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            SSO Configuration
          </TabsTrigger>
          <TabsTrigger value="mfa" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            MFA Settings
          </TabsTrigger>
          <TabsTrigger value="passkeys" className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Passkeys
          </TabsTrigger>
          <TabsTrigger value="auth-methods" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Authentication Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <EnhancedUserManagement />
        </TabsContent>

        <TabsContent value="sso" className="space-y-6">
          <SSOConfiguration />
        </TabsContent>

        <TabsContent value="mfa" className="space-y-6">
          <MFAConfiguration />
        </TabsContent>

        <TabsContent value="passkeys" className="space-y-6">
          <PasskeyManagement />
        </TabsContent>

        <TabsContent value="auth-methods" className="space-y-6">
          <AuthenticationMethods />
        </TabsContent>
      </Tabs>
    </div>
  );
}
