
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Cpu, Plus, Settings, Trash2, Check, X } from "lucide-react";
import { MCPForm } from "../mcp";
import { MCPConnection } from "../types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface MCPTabProps {
  mcpConnections: MCPConnection[];
  onAddMCP: (connection: MCPConnection) => void;
  onDeleteMCP: (id: string) => void;
}

export function MCPTab({ mcpConnections, onAddMCP, onDeleteMCP }: MCPTabProps) {
  const [isAddMCPDialogOpen, setIsAddMCPDialogOpen] = useState(false);

  const isAIAgent = (type: string) => type === "AI Agent MCP";
  const aiConnections = mcpConnections.filter(conn => isAIAgent(conn.type));
  const iotConnections = mcpConnections.filter(conn => !isAIAgent(conn.type));

  return (
    <div className="space-y-8">
      {/* AI Agent MCP Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Model Context Protocol (MCP) for AI Agents</h2>
            <p className="text-muted-foreground mt-1">
              Manage integrations for AI Agents using the Model Context Protocol to exchange contextual information
            </p>
          </div>
          <Button onClick={() => setIsAddMCPDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New AI Agent MCP
          </Button>
        </div>

        {aiConnections.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center space-y-3">
              <Cpu className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="font-semibold">No AI Agent MCP Connections</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Add your first Model Context Protocol connection for AI Agents
                </p>
              </div>
              <Button onClick={() => setIsAddMCPDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add AI Agent MCP
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {aiConnections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {connection.name}
                        <Badge
                          variant={connection.status === "connected" ? "default" : "destructive"}
                          className={`ml-2 ${connection.status === "connected" ? "bg-green-500 hover:bg-green-600" : ""}`}
                        >
                          {connection.status === "connected" ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {connection.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{connection.aiAgentName}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Configuration</DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Test Connection</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onDeleteMCP(connection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Endpoint: {connection.endpoint}</p>
                    <p>Auth Method: {connection.authMethod}</p>
                    {connection.pdpQueryEndpoint && <p>PDP Query Endpoint: {connection.pdpQueryEndpoint}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* IoT Devices Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">IoT Devices</h2>
            <p className="text-muted-foreground mt-1">
              Manage integrations for Internet of Things (IoT) devices communicating with cloud services
            </p>
          </div>
          <Button onClick={() => setIsAddMCPDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New IoT Device
          </Button>
        </div>

        {iotConnections.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center space-y-3">
              <Cpu className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="font-semibold">No IoT Device Connections</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Add your first IoT device connection to manage device communications
                </p>
              </div>
              <Button onClick={() => setIsAddMCPDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add IoT Device
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {iotConnections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {connection.name}
                        <Badge
                          variant={connection.status === "connected" ? "default" : "destructive"}
                          className={`ml-2 ${connection.status === "connected" ? "bg-green-500 hover:bg-green-600" : ""}`}
                        >
                          {connection.status === "connected" ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {connection.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{connection.type}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Configuration</DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Test Connection</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onDeleteMCP(connection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Endpoint: {connection.endpoint}</p>
                    <p>Auth Method: {connection.authMethod}</p>
                    {connection.deviceIdMethod && <p>Device ID Method: {connection.deviceIdMethod}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isAddMCPDialogOpen} onOpenChange={setIsAddMCPDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Connection</DialogTitle>
            <DialogDescription>
              Configure a new Model Context Protocol connection for AI Agents or IoT devices
            </DialogDescription>
          </DialogHeader>
          <MCPForm 
            onSubmit={(connection) => {
              onAddMCP(connection);
              setIsAddMCPDialogOpen(false);
            }} 
            onCancel={() => setIsAddMCPDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
