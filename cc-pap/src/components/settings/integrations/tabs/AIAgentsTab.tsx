
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Cpu, Plus, Settings, Trash2, Check, X } from "lucide-react";
import { AIAgentForm } from "../AIAgentForm";
import { AIAgentConnection } from "../types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AIAgentsTabProps {
  aiAgents: AIAgentConnection[];
  onAddAIAgent: (agent: AIAgentConnection) => void;
  onDeleteAIAgent: (id: string) => void;
}

export function AIAgentsTab({ aiAgents, onAddAIAgent, onDeleteAIAgent }: AIAgentsTabProps) {
  const [isAddAIAgentDialogOpen, setIsAddAIAgentDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">AI Agents</h2>
          <p className="text-muted-foreground mt-1">
            Configure AI Agents that will be governed by authorization policies
          </p>
        </div>
        <Button onClick={() => setIsAddAIAgentDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New AI Agent
        </Button>
      </div>

      {aiAgents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center space-y-3">
            <Cpu className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-semibold">No AI Agents configured</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Add your first AI Agent to start applying authorization policies
              </p>
            </div>
            <Button onClick={() => setIsAddAIAgentDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add AI Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {aiAgents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {agent.name}
                      <Badge
                        variant={agent.status === "connected" ? "default" : "destructive"}
                        className={`ml-2 ${agent.status === "connected" ? "bg-green-500 hover:bg-green-600" : ""}`}
                      >
                        {agent.status === "connected" ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        {agent.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{agent.type}</CardDescription>
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
                      onClick={() => onDeleteAIAgent(agent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Type: {agent.type}</p>
                  {agent.protocol && <p>Protocol: {agent.protocol}</p>}
                  {agent.authEndpoint && <p>Auth Endpoint: {agent.authEndpoint}</p>}
                  {agent.customConfig && Object.keys(agent.customConfig).length > 0 && (
                    <p>Custom Configuration: {Object.keys(agent.customConfig).length} parameters</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddAIAgentDialogOpen} onOpenChange={setIsAddAIAgentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New AI Agent Integration</DialogTitle>
            <DialogDescription>
              Configure an AI Agent that will be governed by authorization policies
            </DialogDescription>
          </DialogHeader>
          <AIAgentForm 
            onSubmit={(agent) => {
              onAddAIAgent(agent);
              setIsAddAIAgentDialogOpen(false);
            }} 
            onCancel={() => setIsAddAIAgentDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
