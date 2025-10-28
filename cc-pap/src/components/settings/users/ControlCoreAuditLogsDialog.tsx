import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SecureStorage } from "@/utils/secureStorage";
import { APP_CONFIG } from "@/config/app";
import { formatDistanceToNow } from "date-fns";
import { Filter, Download, RefreshCw } from "lucide-react";

interface ControlCoreAuditLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AuditLog {
  id: number;
  action: string;
  resource: string;
  resource_type: string;
  event_type: string;
  outcome: string;
  user: string;
  user_id: number;
  timestamp: string;
  source_ip?: string;
  reason?: string;
}

export function ControlCoreAuditLogsDialog({ 
  open, 
  onOpenChange 
}: ControlCoreAuditLogsDialogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  
  useEffect(() => {
    if (open) {
      fetchAuditLogs();
    }
  }, [open, eventTypeFilter, resourceTypeFilter]);
  
  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = SecureStorage.getItem('access_token');
      const params = new URLSearchParams();
      params.append('limit', '100');
      
      if (eventTypeFilter && eventTypeFilter !== 'all') {
        params.append('event_type', eventTypeFilter);
      }
      if (resourceTypeFilter && resourceTypeFilter !== 'all') {
        params.append('resource_type', resourceTypeFilter);
      }
      
      const response = await fetch(
        `${APP_CONFIG.api.baseUrl}/audit/control-core/logs?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getOutcomeBadgeVariant = (outcome: string) => {
    switch (outcome.toUpperCase()) {
      case 'SUCCESS':
      case 'PERMIT':
        return 'default';
      case 'FAILURE':
      case 'DENY':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  const getEventTypeColor = (eventType: string) => {
    if (eventType.startsWith('USER_')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (eventType.startsWith('POLICY_')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    if (eventType.startsWith('RESOURCE_')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (eventType.startsWith('PEP_')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    if (eventType.startsWith('SYSTEM_')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Control Core Activity Audit Logs</DialogTitle>
          <DialogDescription>
            Audit trail of all Control Core user activities and system events
          </DialogDescription>
        </DialogHeader>
        
        {/* Filters */}
        <div className="flex items-center gap-4 pb-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="USER_LOGIN">User Login</SelectItem>
                <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
                <SelectItem value="USER_PASSWORD_CHANGED">Password Changed</SelectItem>
                <SelectItem value="POLICY_CREATED">Policy Created</SelectItem>
                <SelectItem value="POLICY_UPDATED">Policy Updated</SelectItem>
                <SelectItem value="PEP_DEPLOYED">PEP Deployed</SelectItem>
                <SelectItem value="SYSTEM_CONFIG_CHANGED">System Config</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="policy">Policies</SelectItem>
                <SelectItem value="pep">PEPs</SelectItem>
                <SelectItem value="resource">Resources</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm" onClick={fetchAuditLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full w-full pr-4">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading audit logs...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          
          {!isLoading && !error && logs.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              No audit logs found
            </div>
          )}
          
          {!isLoading && !error && logs.length > 0 && (
            <div className="w-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[200px]">Event Type</TableHead>
                    <TableHead className="w-[120px]">User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead className="w-[100px]">Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEventTypeColor(log.event_type)} variant="outline">
                          {log.event_type.replace(/_/g, ' ')}
                        </Badge>
                        {log.resource_type && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {log.resource_type}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{log.user}</div>
                        {log.source_ip && (
                          <div className="text-xs text-muted-foreground">{log.source_ip}</div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-sm truncate" title={log.action}>
                          {log.action}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{log.resource || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getOutcomeBadgeVariant(log.outcome)}>
                          {log.outcome}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          </ScrollArea>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Showing {logs.length} most recent activities
          </div>
          <div className="text-xs text-muted-foreground">
            Logs are automatically purged after 365 days for compliance
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

