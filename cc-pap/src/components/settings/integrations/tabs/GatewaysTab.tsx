
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Database, Plus, Settings, Trash2, Check, X } from "lucide-react";
import { AddGatewayForm } from "../AddGatewayForm";
import { GatewayConnection } from "../types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface GatewaysTabProps {
  gateways: GatewayConnection[];
  onAddGateway: (gateway: GatewayConnection) => void;
  onDeleteGateway: (id: string) => void;
}

export function GatewaysTab({ gateways, onAddGateway, onDeleteGateway }: GatewaysTabProps) {
  const [isAddGatewayDialogOpen, setIsAddGatewayDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">API Gateways</h2>
          <p className="text-muted-foreground mt-1">
            Connect your API Gateways to enforce dynamic authorization policies
          </p>
        </div>
        <Button onClick={() => setIsAddGatewayDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Gateway
        </Button>
      </div>

      {gateways.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center space-y-3">
            <Database className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-semibold">No API Gateways connected</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Add your first API Gateway connection to start enforcing authorization policies
              </p>
            </div>
            <Button onClick={() => setIsAddGatewayDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Gateway
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {gateways.map((gateway) => (
            <Card key={gateway.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {gateway.name}
                      <Badge
                        variant={gateway.status === "connected" ? "default" : "destructive"}
                        className={`ml-2 ${gateway.status === "connected" ? "bg-green-500 hover:bg-green-600" : ""}`}
                      >
                        {gateway.status === "connected" ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        {gateway.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{gateway.type}</CardDescription>
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
                      onClick={() => onDeleteGateway(gateway.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Endpoint: {gateway.endpoint}</p>
                  {gateway.pdpQueryEndpoint && (
                    <p>PDP Query Endpoint: {gateway.pdpQueryEndpoint}</p>
                  )}
                  {gateway.additionalHeaders && Object.keys(gateway.additionalHeaders).length > 0 && (
                    <p>Additional Headers: {Object.keys(gateway.additionalHeaders).length}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddGatewayDialogOpen} onOpenChange={setIsAddGatewayDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New API Gateway Connection</DialogTitle>
            <DialogDescription>
              Configure a new API Gateway connection to enforce authorization policies
            </DialogDescription>
          </DialogHeader>
          <AddGatewayForm 
            onSubmit={(gateway) => {
              onAddGateway(gateway);
              setIsAddGatewayDialogOpen(false);
            }} 
            onCancel={() => setIsAddGatewayDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
