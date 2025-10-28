
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, TestTube, Pause, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Import centralized mock data
import { MOCK_PIP_SOURCES, type MockPIPSource } from "@/data/mockData";

// Type compatibility for existing component
type PIPSource = MockPIPSource;

interface PIPsTableProps {
  pips?: PIPSource[];
  onEditPIP: (pip: PIPSource) => void;
  onDeletePIP?: (pipId: string) => void;
}

export function PIPsTable({ pips = MOCK_PIP_SOURCES, onEditPIP, onDeletePIP }: PIPsTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'inactive':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Error</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'http-api':
        return 'HTTP API';
      case 'webhook':
        return 'Webhook';
      default:
        return type;
    }
  };

  if (pips.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          No data sources configured yet. Add your first data source to enhance policy decisions.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Attributes Provided</TableHead>
            <TableHead>Last Synced</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pips.map((pip) => (
            <TableRow key={pip.id}>
              <TableCell className="font-medium">{pip.name}</TableCell>
              <TableCell>{getTypeLabel(pip.type)}</TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="truncate max-w-[200px] text-sm font-mono bg-muted px-2 py-1 rounded">
                      {pip.endpoint}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{pip.endpoint}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-sm">
                      {pip.attributesProvided.slice(0, 2).join(', ')}
                      {pip.attributesProvided.length > 2 && (
                        <span className="text-muted-foreground"> +{pip.attributesProvided.length - 2} more</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{pip.attributesProvided.join(', ')}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{pip.lastSynced}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(pip.status)}
                  {getStatusBadge(pip.status)}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditPIP(pip)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Pause className="h-4 w-4 mr-2" />
                      Deactivate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => onDeletePIP?.(pip.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
