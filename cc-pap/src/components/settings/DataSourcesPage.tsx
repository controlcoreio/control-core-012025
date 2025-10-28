
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { PIPsTable } from "../pips/PIPsTable";
import { AddInformationSourceWizard } from "../pips/AddInformationSourceWizard";
import { useToast } from "@/hooks/use-toast";
import pipService, { PIPConnection } from "@/services/pipService";

export function DataSourcesPage() {
  const [connections, setConnections] = useState<PIPConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<PIPConnection | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const data = await pipService.getConnections();
      setConnections(data);
    } catch (error) {
      console.error("Failed to load connections:", error);
      toast({
        title: "Error",
        description: "Failed to load data sources",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPIP = (pip: any) => {
    setEditingConnection(pip);
    setIsWizardOpen(true);
  };

  const handleDeletePIP = async (pipId: string) => {
    try {
      await pipService.deleteConnection(parseInt(pipId));
      await loadConnections();
      toast({
        title: "Success",
        description: "Data source deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete connection:", error);
      toast({
        title: "Error",
        description: "Failed to delete data source",
        variant: "destructive",
      });
    }
  };

  const handleAddConnection = async (newConnection: any) => {
    try {
      await pipService.createConnection(newConnection);
      await loadConnections();
      setIsWizardOpen(false);
      setEditingConnection(null);
      toast({
        title: "Success",
        description: "Data source added successfully",
      });
    } catch (error) {
      console.error("Failed to create connection:", error);
      toast({
        title: "Error",
        description: "Failed to add data source",
        variant: "destructive",
      });
    }
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setEditingConnection(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Settings
            </Link>
          </Button>
        </div>
        <Button onClick={() => setIsWizardOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
        <p className="text-muted-foreground">
          Configure your Policy Information Points (PIPs) and data connections
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <PIPsTable 
          pips={connections} 
          onEditPIP={handleEditPIP} 
          onDeletePIP={handleDeletePIP} 
        />
      )}

      <AddInformationSourceWizard 
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        onAdd={handleAddConnection}
      />
    </div>
  );
}
