
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { AddPDPGroupDialog } from "./AddPDPGroupDialog";

interface PDPGroup {
  id: string;
  name: string;
  environment: string;
  memberCount: number;
  health: "healthy" | "degraded" | "critical";
  opalTopics: string[];
  syncStatus: string;
  loadBalancingStrategy: string;
}

const mockPDPGroups: PDPGroup[] = [
  {
    id: "prod-web-auth-cluster",
    name: "Production Web-Auth Cluster",
    environment: "Production",
    memberCount: 3,
    health: "healthy",
    opalTopics: ["web-auth", "user-permissions", "api-gateway"],
    syncStatus: "All members up-to-date via OPAL",
    loadBalancingStrategy: "Round Robin"
  },
  {
    id: "hr-app-backend-pdps",
    name: "HR-App Backend PDPs",
    environment: "Production",
    memberCount: 2,
    health: "degraded",
    opalTopics: ["hr-policies", "employee-data"],
    syncStatus: "1 member out of sync with OPAL",
    loadBalancingStrategy: "Least Latency"
  },
  {
    id: "staging-cluster",
    name: "Staging Test Cluster",
    environment: "Staging",
    memberCount: 2,
    health: "healthy",
    opalTopics: ["testing", "dev-auth"],
    syncStatus: "All members synchronized via OPAL",
    loadBalancingStrategy: "Failover Priority"
  }
];

export function PDPGroupsTab() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "degraded":
        return "text-yellow-600 bg-yellow-50";
      case "critical":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "healthy":
        return <EnterpriseIcon name="check" size={16} className="text-green-600" />;
      case "degraded":
      case "critical":
        return <EnterpriseIcon name="exclamation-triangle" size={16} className="text-red-600" />;
      default:
        return <EnterpriseIcon name="exclamation-triangle" size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">PDP Groups (OPAL-Managed)</h3>
          <p className="text-sm text-muted-foreground">
            Manage logical clusters of OPA instances that subscribe to the same OPAL topics and serve similar purposes
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <EnterpriseIcon name="plus" size={16} className="mr-2" />
          Add New PDP Group
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PDP Groups</CardTitle>
          <CardDescription>Logical clusters of OPA instances organized by OPAL topic subscriptions and deployment environments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>OPAL Topics</TableHead>
                <TableHead>Sync Status</TableHead>
                <TableHead>Load Balancing</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPDPGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{group.environment}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <EnterpriseIcon name="server" size={16} className="text-muted-foreground" />
                      <span className="font-medium">{group.memberCount} OPA instances</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getHealthIcon(group.health)}
                      <span className={`text-sm font-medium ${getHealthColor(group.health)}`}>
                        {group.health}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {group.opalTopics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{group.syncStatus}</TableCell>
                  <TableCell>{group.loadBalancingStrategy}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <EnterpriseIcon name="eye" size={12} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <EnterpriseIcon name="pencil" size={12} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <EnterpriseIcon name="trash" size={12} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showAddDialog && (
        <AddPDPGroupDialog
          onClose={() => setShowAddDialog(false)}
          onSave={(group) => {
            console.log("New OPAL-managed PDP group:", group);
            setShowAddDialog(false);
          }}
        />
      )}
    </div>
  );
}
