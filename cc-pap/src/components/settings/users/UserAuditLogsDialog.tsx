import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SecureStorage } from "@/utils/secureStorage";
import { APP_CONFIG } from "@/config/app";
import { formatDistanceToNow } from "date-fns";

interface UserAuditLogsDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AuditLog {
  id: number;
  action: string;
  resource: string;
  event_type: string;
  outcome: string;
  timestamp: string;
  source_ip?: string;
  reason?: string;
}

export function UserAuditLogsDialog({ 
  user,
  open, 
  onOpenChange 
}: UserAuditLogsDialogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (open && user) {
      fetchAuditLogs();
    }
  }, [open, user]);
  
  const fetchAuditLogs = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = SecureStorage.getItem('access_token');
      const response = await fetch(
        `${APP_CONFIG.api.baseUrl}/audit/users/${user.id}/audit-logs?limit=50`,
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
  
  const getEventTypeBadgeVariant = (eventType: string) => {
    if (eventType.includes('LOGIN')) return 'default';
    if (eventType.includes('PASSWORD')) return 'outline';
    if (eventType.includes('MFA')) return 'secondary';
    return 'outline';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Audit Logs for {user?.name}</DialogTitle>
          <DialogDescription>
            Activity history and audit trail for {user?.username}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] w-full">
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
              No audit logs found for this user
            </div>
          )}
          
          {!isLoading && !error && logs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>IP Address</TableHead>
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
                      <Badge variant={getEventTypeBadgeVariant(log.event_type)} className="text-xs">
                        {log.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
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
                    <TableCell className="text-sm text-muted-foreground">
                      {log.source_ip || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

