import { BookText, Download, AlertTriangle, Calendar, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AuditLogTable } from "./AuditLogTable";
import { ExportLogsModal } from "./ExportLogsModal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define types for the audit log system
export type EventType = 
  | "Policy Decision" 
  | "Resource Config Change" 
  | "User Login" 
  | "PEP Status Update"
  | "System Event"
  | "Security Alert"
  | "POLICY_CREATED"
  | "POLICY_UPDATED"
  | "POLICY_DELETED"
  | "ACCESS_GRANTED"
  | "ACCESS_DENIED";

export type Outcome = "PERMIT" | "DENY" | "SUCCESS" | "FAILURE" | "INFO" | "WARNING" | "ALLOWED_BY_DEFAULT" | "success" | "failure";

export interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: EventType;
  subject: string;
  resource: string;
  outcome: Outcome;
  policyName?: string;
  reason: string;
  sourceIP: string;
  details: string;
}

// Import centralized mock data
import { MOCK_AUDIT_LOGS, type MockAuditLog } from "@/data/mockData";

// Type compatibility for existing component - override existing AuditLog type
type AuditLogFromData = MockAuditLog;

// Use centralized mock data - convert timestamp strings to Date objects for compatibility
export const mockLogs: AuditLog[] = MOCK_AUDIT_LOGS.map((log, index) => ({
  ...log,
  // Add some "Allowed by Default" entries to demonstrate monitoring mode
  outcome: index % 8 === 0 ? "ALLOWED_BY_DEFAULT" : log.outcome,
  reason: index % 8 === 0 ? "Traffic allowed by default monitoring mode - no specific policy matched" : log.reason,
  timestamp: typeof log.timestamp === 'string' ? new Date(log.timestamp) : log.timestamp
}));

const timePeriodOptions = [
  { label: "Last 1 hour", value: "1h" },
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Custom Range...", value: "custom" }
];

const quickFilters: { label: string; value: EventType | "all" }[] = [
  { label: "All Events", value: "all" },
  { label: "Policy Decisions", value: "Policy Decision" },
  { label: "Config Changes", value: "Resource Config Change" },
  { label: "Security Alerts", value: "Security Alert" },
  { label: "System Events", value: "System Event" },
  { label: "Denied Access", value: "Policy Decision" } // Will filter by DENY outcome
];

export function AuditLogPage() {
  const { toast } = useToast();
  
  // State for filters
  const [timePeriod, setTimePeriod] = useState("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<EventType | "all">("all");
  const [showExportModal, setShowExportModal] = useState(false);

  // Mock user role - in real app this would come from auth context
  const userRole = 'admin'; // Can be 'admin' or 'user'

  // Show warning banner for 90-day selection
  const showRetentionWarning = timePeriod === "90d";

  // Filter logs based on current selections
  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = searchQuery === "" ||
      log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.policyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEventType = selectedEventType === "all" || 
      (selectedEventType === "Policy Decision" && log.eventType === "Policy Decision") ||
      log.eventType === selectedEventType;

    // Time filtering logic would be implemented here based on timePeriod
    // For now, showing all logs

    return matchesSearch && matchesEventType;
  });

  const handleExportLogs = () => {
    setShowExportModal(true);
  };

  const handleConfirmExport = (startDate: Date, endDate: Date) => {
    // In a real app, this would trigger the actual export
    toast({
      title: "Export Started",
      description: "Your logs are being prepared and will be sent to your registered email address shortly.",
    });
    setShowExportModal(false);
  };

  const handleQuickFilter = (filterValue: EventType | "all") => {
    setSelectedEventType(filterValue);
  };

  const handlePurgeLogs = () => {
    // In a real app, this would call the backend API to purge logs
    toast({
      title: "Audit Logs Purged",
      description: `Successfully purged all audit logs older than ${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}.`,
      variant: "destructive",
    });
  };

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      {/* Retention Notice Banner */}
      <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Audit Log Retention Policy:</strong> Audit logs are retained for 90 days on your current plan. For longer data retention options, please contact ControlCore Enterprise.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <BookText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-muted-foreground mt-1">
              Review all policy decisions, configuration changes, and system events across your protected resources. Essential for monitoring and compliance.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportLogs}
          >
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
          {userRole === 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Purge Logs
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Audit Log Purge</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to permanently purge all audit logs older than {new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handlePurgeLogs} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirm Purge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Top Bar: Filters & Actions */}
      <Card className="mb-6 p-6">
        <div className="space-y-4">
          {/* Time Period and Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period:</label>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  {timePeriodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Search:</label>
              <Input
                placeholder="Search by Subject, Resource, Policy Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Filters:</label>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map(filter => (
                <Badge
                  key={filter.value}
                  variant={selectedEventType === filter.value ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleQuickFilter(filter.value)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Retention Warning Banner */}
      {showRetentionWarning && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Heads Up: Your Logs Will Be Purged Soon!</strong>
            <br />
            ControlCore retains audit logs for 90 days by default. Any logs older than this period will be automatically purged. 
            If you are exporting logs from the full 90-day period, this is your last chance to retrieve them before they are permanently deleted. 
            Longer retention periods are available exclusively for Enterprise plans.
          </AlertDescription>
        </Alert>
      )}

      {/* Audit Log Table */}
      <AuditLogTable 
        logs={filteredLogs}
        searchQuery={searchQuery}
        eventTypeFilter={selectedEventType}
      />

      {/* Export Modal */}
      <ExportLogsModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onConfirmExport={handleConfirmExport}
        timePeriod={timePeriod}
      />
    </div>
  );
}
