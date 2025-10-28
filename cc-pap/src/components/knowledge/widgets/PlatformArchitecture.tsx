import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";

export function PlatformArchitecture() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Platform Architecture</CardTitle>
        <CardDescription>
          Visual overview of the platform's key components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="policyEngine">Policy Engine</TabsTrigger>
            <TabsTrigger value="pip">PIP</TabsTrigger>
            <TabsTrigger value="pep">PEP</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="bg-muted rounded-lg p-6 flex flex-col items-center">
              <h3 className="text-lg font-medium mb-4">Component Interaction Flow</h3>
              <div className="relative w-full max-w-md mx-auto py-8">
                {/* Flow diagram with arrows and boxes */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="flex flex-col items-center justify-center col-span-1">
                    <div className="bg-background rounded-lg p-3 border shadow-sm text-center mb-2">
                      <div className="font-medium text-sm">User/System</div>
                    </div>
                    <ArrowRight className="h-4 w-8 text-muted-foreground rotate-90" />
                  </div>
                  <div className="flex flex-col items-center justify-center col-span-1">
                    <div className="bg-background rounded-lg p-3 border shadow-sm text-center mb-2">
                      <div className="font-medium text-sm">PEP</div>
                      <div className="text-xs text-muted-foreground">Enforcer</div>
                    </div>
                    <ArrowRight className="h-4 w-8 text-muted-foreground rotate-90" />
                  </div>
                  <div className="flex flex-col items-center justify-center col-span-1">
                    <div className="bg-primary/10 rounded-lg p-3 border border-primary/20 shadow-sm text-center mb-2">
                      <div className="font-medium text-sm">PDP</div>
                      <div className="text-xs text-muted-foreground">Decision</div>
                    </div>
                    <div className="flex">
                      <ArrowRight className="h-4 w-4 text-muted-foreground rotate-180" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center col-span-1">
                    <div className="bg-background rounded-lg p-3 border shadow-sm text-center mb-2">
                      <div className="font-medium text-sm">PIP</div>
                      <div className="text-xs text-muted-foreground">Information</div>
                    </div>
                    <ArrowRight className="h-4 w-8 text-muted-foreground rotate-90 -scale-y-100" />
                  </div>
                  <div className="flex flex-col items-center justify-center col-span-1">
                    <div className="bg-background rounded-lg p-3 border shadow-sm text-center mb-2">
                      <div className="font-medium text-sm">Resource</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center max-w-md">
                The diagram shows how authorization requests flow through the system. The Policy Enforcement Point (PEP) intercepts requests and forwards them to the Policy Decision Point (PDP), which may consult the Policy Information Point (PIP) for additional context before returning a decision.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="policyEngine" className="mt-4 space-y-4">
            <div className="bg-muted rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Policy Engine Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4 border">
                  <h4 className="font-medium mb-2">Policy Administration Point (PAP)</h4>
                  <p className="text-sm">
                    The PAP is where policies are created, managed, and stored. It provides the interface for administrators to define and maintain authorization policies.
                  </p>
                  <ul className="text-sm mt-2 space-y-1 list-disc pl-5">
                    <li>Policy authoring and editing</li>
                    <li>Version control and history</li>
                    <li>Policy validation and testing</li>
                    <li>Distribution of policies to PDPs</li>
                  </ul>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <h4 className="font-medium mb-2">Policy Decision Point (PDP)</h4>
                  <p className="text-sm">
                    The PDP evaluates access requests against policies to determine if access should be granted or denied.
                  </p>
                  <ul className="text-sm mt-2 space-y-1 list-disc pl-5">
                    <li>Receives access requests from PEPs</li>
                    <li>Evaluates applicable policies</li>
                    <li>May request additional attributes from PIPs</li>
                    <li>Returns permit/deny decisions with obligations</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 bg-primary/5 rounded-lg p-4 border border-primary/20">
                <h4 className="font-medium mb-2">How They Work Together</h4>
                <p className="text-sm">
                  The PAP and PDP work together to enable centralized policy management and consistent enforcement. Policies defined in the PAP are distributed to PDPs, which evaluate access requests against these policies in real-time.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pip" className="mt-4">
            <div className="bg-muted rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Policy Information Point (PIP)</h3>
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mb-4">
                <p className="text-sm">
                  The PIP retrieves additional attributes or contextual information needed for policy evaluation. It serves as a bridge between the policy engine and various data sources.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background rounded-lg p-4 border text-center">
                  <h4 className="font-medium mb-2">User Attributes</h4>
                  <p className="text-xs text-muted-foreground">
                    Roles, departments, clearance levels, location, etc.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border text-center">
                  <h4 className="font-medium mb-2">Resource Attributes</h4>
                  <p className="text-xs text-muted-foreground">
                    Classification, ownership, creation date, sensitivity, etc.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border text-center">
                  <h4 className="font-medium mb-2">Environmental Context</h4>
                  <p className="text-xs text-muted-foreground">
                    Time, date, network information, threat levels, etc.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Data Source Integration</h4>
                <p className="text-sm">
                  PIPs can connect to various data sources to retrieve the necessary attributes:
                </p>
                <ul className="text-sm mt-2 grid grid-cols-2 gap-2">
                  <li className="bg-background rounded p-2 border">User directories (LDAP/AD)</li>
                  <li className="bg-background rounded p-2 border">Databases</li>
                  <li className="bg-background rounded p-2 border">API services</li>
                  <li className="bg-background rounded p-2 border">Time services</li>
                  <li className="bg-background rounded p-2 border">Geolocation services</li>
                  <li className="bg-background rounded p-2 border">Risk engines</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pep" className="mt-4">
            <div className="bg-muted rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Policy Enforcement Point (PEP)</h3>
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mb-4">
                <p className="text-sm">
                  The PEP intercepts user requests to access resources, forwards them to the PDP for authorization decisions, and enforces those decisions by allowing or denying access.
                </p>
              </div>
              
              <h4 className="font-medium mb-2">PEP Deployment Options</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-background rounded-lg p-4 border">
                  <h5 className="font-medium mb-1">API Gateways</h5>
                  <p className="text-xs text-muted-foreground">
                    Intercepts API calls to enforce authorization decisions before requests reach backend services.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <h5 className="font-medium mb-1">Application Code</h5>
                  <p className="text-xs text-muted-foreground">
                    Embedded within application logic to enforce access control at specific points.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <h5 className="font-medium mb-1">Middleware</h5>
                  <p className="text-xs text-muted-foreground">
                    Sits between client and server to intercept requests and enforce decisions.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <h5 className="font-medium mb-1">Sidecar Proxies</h5>
                  <p className="text-xs text-muted-foreground">
                    Deployed alongside microservices to handle authorization for the service.
                  </p>
                </div>
              </div>
              
              <h4 className="font-medium mb-2">Technology Protection</h4>
              <p className="text-sm mb-3">
                PEPs can protect various technologies within an organization:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-background rounded-lg p-3 border">APIs</div>
                <div className="bg-background rounded-lg p-3 border">Databases</div>
                <div className="bg-background rounded-lg p-3 border">AI Agents</div>
                <div className="bg-background rounded-lg p-3 border">Cloud Services</div>
                <div className="bg-background rounded-lg p-3 border">Web Applications</div>
                <div className="bg-background rounded-lg p-3 border">Microservices</div>
                <div className="bg-background rounded-lg p-3 border">Data Lakes</div>
                <div className="bg-background rounded-lg p-3 border">IoT Devices</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
