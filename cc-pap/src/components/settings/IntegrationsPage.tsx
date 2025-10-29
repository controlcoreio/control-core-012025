import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ChevronLeft, Shield, Users, Code, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "@/config/app";

export function IntegrationsPage() {
  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Integrations Hub</h1>
          <p className="text-muted-foreground">
            Configure and manage all external integrations with your Authorization Platform.
          </p>
        </div>
      </div>

      <Tabs defaultValue="siem" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="siem">SIEM/SOAR</TabsTrigger>
          <TabsTrigger value="identity">Identity Providers</TabsTrigger>
          <TabsTrigger value="ticketing">Ticketing</TabsTrigger>
          <TabsTrigger value="devops">DevOps/SCM</TabsTrigger>
        </TabsList>

        <TabsContent value="siem" className="space-y-6">
          <SIEMIntegrationsTab />
        </TabsContent>

        <TabsContent value="identity" className="space-y-6">
          <IdentityIntegrationsTab />
        </TabsContent>

        <TabsContent value="ticketing" className="space-y-6">
          <TicketingIntegrationsTab />
        </TabsContent>

        <TabsContent value="devops" className="space-y-6">
          <DevOpsIntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function SIEMIntegrationsTab() {
  const [integrations] = useState([
    { name: "Splunk", status: "connected", lastSync: "2024-01-15 14:30:00", logo: "🔍" },
    { name: "Azure Sentinel", status: "disconnected", lastSync: null, logo: "☁️" },
    { name: "Elastic Stack", status: "needs-config", lastSync: null, logo: "🔍" },
    { name: "IBM QRadar", status: "disconnected", lastSync: null, logo: "🖥️" },
    { name: "Custom Webhook", status: "connected", lastSync: "2024-01-15 15:45:00", logo: "🔗" }
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Information & Event Management (SIEM/SOAR)
          </CardTitle>
          <CardDescription>
            Stream audit logs and security alerts to your SIEM/SOAR platform for centralized monitoring and response.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.name} className="border-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{integration.logo}</span>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    <Badge variant={
                      integration.status === "connected" ? "default" :
                      integration.status === "needs-config" ? "secondary" : "outline"
                    }>
                      {integration.status === "connected" ? "Connected" :
                       integration.status === "needs-config" ? "Needs Config" : "Disconnected"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {integration.lastSync && (
                    <p className="text-sm text-muted-foreground">
                      Last sync: {integration.lastSync}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Configure</Button>
                    {integration.status === "connected" && (
                      <Button size="sm" variant="outline">Test</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function IdentityIntegrationsTab() {
  const [integrations] = useState([
    { name: "Okta", status: "configured", logo: "🔐" },
    { name: "Azure AD", status: "not-configured", logo: "☁️" },
    { name: "Auth0", status: "not-configured", logo: "🔑" },
    { name: "Ping Identity", status: "not-configured", logo: "🏓" },
    { name: "Custom SAML/OIDC", status: "not-configured", logo: "🔗" }
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Identity Provider (IdP) for Platform Access
          </CardTitle>
          <CardDescription>
            Integrate with your enterprise Identity Provider for single sign-on (SSO) and user provisioning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.name} className="border-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{integration.logo}</span>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    <Badge variant={integration.status === "configured" ? "default" : "outline"}>
                      {integration.status === "configured" ? "Configured" : "Not Configured"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline">Configure</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TicketingIntegrationsTab() {
  const [integrations] = useState([
    { name: "ServiceNow", status: "connected", logo: "🎫" },
    { name: "Jira", status: "not-configured", logo: "📊" },
    { name: "Zendesk", status: "not-configured", logo: "💬" },
    { name: "PagerDuty", status: "connected", logo: "📟" }
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Ticketing & Incident Management
          </CardTitle>
          <CardDescription>
            Automatically create tickets for critical authorization issues or system alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.name} className="border-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{integration.logo}</span>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    <Badge variant={integration.status === "connected" ? "default" : "outline"}>
                      {integration.status === "connected" ? "Connected" : "Not Configured"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline">Configure</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DevOpsIntegrationsTab() {
  const [githubStatus, setGithubStatus] = useState<'connected' | 'not-configured'>('not-configured');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGitHubStatus = async () => {
      try {
        const response = await fetch(`${APP_CONFIG.api.baseUrl}/settings/github-config`);
        if (response.ok) {
          const config = await response.json();
          setGithubStatus(config.connection_status === 'connected' ? 'connected' : 'not-configured');
        }
      } catch (error) {
        console.error('Failed to fetch GitHub status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGitHubStatus();
  }, []);

  const integrations = [
    { name: "GitHub", status: githubStatus, logo: "🐙", configHref: "/settings/controls-repository" },
    { name: "GitLab", status: "not-configured", logo: "🦊", configHref: null },
    { name: "Azure DevOps", status: "not-configured", logo: "☁️", configHref: null },
    { name: "Bitbucket", status: "not-configured", logo: "🪣", configHref: null }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Source Code Management (SCM) / DevOps
          </CardTitle>
          <CardDescription>
            Integrate with your SCM for Policy as Code (PaC) management and CI/CD pipeline triggers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.name} className="border-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{integration.logo}</span>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    <Badge variant={integration.status === "connected" ? "default" : "outline"}>
                      {integration.status === "connected" ? "Connected" : "Not Configured"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {integration.configHref ? (
                    <Link to={integration.configHref}>
                      <Button size="sm" variant="outline">Configure</Button>
                    </Link>
                  ) : (
                    <Button size="sm" variant="outline" disabled>Configure</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}