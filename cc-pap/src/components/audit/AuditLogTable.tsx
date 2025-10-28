
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, ExternalLink } from "lucide-react";
import { AuditLog, EventType, Outcome } from "./AuditLogPage";

interface AuditLogTableProps {
  logs: AuditLog[];
  searchQuery: string;
  eventTypeFilter: EventType | "all";
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  
  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "PERMIT":
        return <Badge variant="default" className="bg-green-100 text-green-800">Allowed (by Policy)</Badge>;
      case "DENY":
        return <Badge variant="destructive">Denied (by Policy)</Badge>;
      case "ALLOWED_BY_DEFAULT":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Allowed (Default Monitoring)</Badge>;
      case "SUCCESS":
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case "FAILURE":
        return <Badge variant="destructive">Failure</Badge>;
      case "INFO":
        return <Badge variant="outline">Info</Badge>;
      case "WARNING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Warning</Badge>;
      default:
        return <Badge variant="outline">{outcome}</Badge>;
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const formatDetails = (details: string) => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If it's not valid JSON, just return the original string
      return details;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Timestamp</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Subject/Actor</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Policy Name</TableHead>
              <TableHead>Reason/Details</TableHead>
              <TableHead>Source IP</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="whitespace-nowrap">
                      {log.eventType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <span 
                      title={log.subject}
                      className="truncate block"
                    >
                      {truncateText(log.subject, 20)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span 
                      title={log.resource}
                      className="truncate block"
                    >
                      {truncateText(log.resource, 25)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getOutcomeBadge(log.outcome)}
                  </TableCell>
                  <TableCell>
                    {log.policyName ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {truncateText(log.policyName, 20)}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <span 
                      title={log.reason}
                      className="truncate block"
                    >
                      {truncateText(log.reason, 35)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.sourceIP}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Event Details</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Timestamp:</strong> {formatTimestamp(log.timestamp)}</div>
                            <div><strong>Event Type:</strong> {log.eventType}</div>
                            <div><strong>Subject:</strong> {log.subject}</div>
                            <div><strong>Resource:</strong> {log.resource}</div>
                            <div><strong>Outcome:</strong> {getOutcomeBadge(log.outcome)}</div>
                            <div><strong>Source IP:</strong> {log.sourceIP}</div>
                            {log.policyName && (
                              <div className="col-span-2">
                                <strong>Policy Name:</strong> {log.policyName}
                              </div>
                            )}
                          </div>
                          <div className="border-t pt-4">
                            <div className="mb-2"><strong>Reason:</strong></div>
                            <p className="text-sm bg-muted p-3 rounded">{log.reason}</p>
                          </div>
                          <div className="border-t pt-4">
                            <div className="mb-2"><strong>Full Event Details:</strong></div>
                            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-[200px]">
                              {formatDetails(log.details)}
                            </pre>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No audit events found matching your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
