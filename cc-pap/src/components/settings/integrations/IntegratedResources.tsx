
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IntegratedResource, ResourceType } from "./types";
import { Database, Server, Cloud, Code, Link, Cpu, Network, Layers, Shield, Laptop } from "lucide-react";

const resourceIcons: Record<ResourceType, React.ReactNode> = {
  "APIs": <Code className="h-5 w-5 text-blue-500" />,
  "AI Agents": <Cpu className="h-5 w-5 text-purple-500" />,
  "Model Context Protocol (MCP) for AI Agents": <Cpu className="h-5 w-5 text-green-500" />,
  "IoT Devices": <Laptop className="h-5 w-5 text-orange-500" />,
  "Google Agent to Agent (A2A)": <Shield className="h-5 w-5 text-red-500" />,
  "Datalakes": <Database className="h-5 w-5 text-yellow-500" />,
  "Databases": <Database className="h-5 w-5 text-pink-500" />,
  "Network Endpoints": <Network className="h-5 w-5 text-indigo-500" />,
};

// No mock data - will be populated from backend when feature is ready
const mockResources: IntegratedResource[] = [];

const getStatusColor = (status: IntegratedResource["status"]) => {
  switch (status) {
    case "active":
      return "bg-green-500 hover:bg-green-600";
    case "inactive":
      return "bg-gray-500 hover:bg-gray-600";
    case "partial":
      return "bg-yellow-500 hover:bg-yellow-600";
    default:
      return "";
  }
};

export function IntegratedResources() {
  return (
    <section className="space-y-4 mt-10">
      <div>
        <h2 className="text-2xl font-semibold">Integrated Resources</h2>
        <p className="text-muted-foreground mt-1">
          Resources that are currently protected by PEPs connected to this platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockResources.map((resource) => (
          <Card key={resource.type} className="hover:border-primary/70 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {resourceIcons[resource.type]}
                  <CardTitle className="text-base">{resource.type}</CardTitle>
                </div>
                <Badge className={getStatusColor(resource.status)}>
                  {resource.status}
                </Badge>
              </div>
              <CardDescription>
                {resource.count} {resource.count === 1 ? 'instance' : 'instances'} protected
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-muted-foreground">
                Last updated: Today at 10:45 AM
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
