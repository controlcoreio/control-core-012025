
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, Plus, Settings, Trash2, Check, X, Shield } from "lucide-react";
import { A2AForm } from "../A2AForm";
import { A2AConnection, A2AType } from "../types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface A2ATabProps {
  a2aConnections: A2AConnection[];
  onAddA2A: (connection: A2AConnection) => void;
  onDeleteA2A: (id: string) => void;
}

export function A2ATab({ a2aConnections, onAddA2A, onDeleteA2A }: A2ATabProps) {
  const [isAddA2ADialogOpen, setIsAddA2ADialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Google Agent to Agent (A2A)</h2>
          <p className="text-muted-foreground mt-1">
            Manage integrations for communication between Google Agents, leveraging specific protocols and mechanisms defined by Google
          </p>
        </div>
        <Button onClick={() => setIsAddA2ADialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Google A2A Connection
        </Button>
      </div>

      {a2aConnections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center space-y-3">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-semibold">No Google A2A Connections configured</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Add your first Google Agent to Agent connection to manage authorization between Google Agents
              </p>
            </div>
            <Button onClick={() => setIsAddA2ADialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Google A2A Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {a2aConnections.map((connection) => (
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
                      onClick={() => onDeleteA2A(connection.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Protocol: {connection.type}</p>
                  {connection.sourceAgent && <p>Source Agent: {connection.sourceAgent}</p>}
                  {connection.destinationAgent && <p>Destination Agent: {connection.destinationAgent}</p>}
                  <p>Auth Method: {connection.authMethod}</p>
                  {connection.authorizationScope && <p>Auth Scope: {connection.authorizationScope}</p>}
                  {connection.interceptorEndpoint && <p>Interceptor: {connection.interceptorEndpoint}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddA2ADialogOpen} onOpenChange={setIsAddA2ADialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Google Agent to Agent (A2A) Connection</DialogTitle>
            <DialogDescription>
              Configure a Google Agent to Agent connection for secure communication and authorization between Google Agents
            </DialogDescription>
          </DialogHeader>
          <A2AForm 
            onSubmit={(connection) => {
              // Set the type to "Google Agent to Agent" by default
              const updatedConnection = {
                ...connection,
                type: "Google Agent to Agent" as A2AType
              };
              onAddA2A(updatedConnection);
              setIsAddA2ADialogOpen(false);
            }} 
            onCancel={() => setIsAddA2ADialogOpen(false)} 
            isGoogleA2A={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
