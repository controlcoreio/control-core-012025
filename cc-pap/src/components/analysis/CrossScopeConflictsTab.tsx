
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  Search, 
  MessageSquare, 
  Mail, 
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OriginalCrossScopeConflict {
  id: string;
  yourPolicy: string;
  yourPolicyId: string;
  conflictingPolicyId: string;
  conflictingPolicyOwner: string;
  conflictType: "Overlap" | "Contradiction" | "Redundancy";
  impact: string;
  severity: "High" | "Medium" | "Low";
  resolutionSuggestion: string;
  lastDetected: string;
  status: "Active" | "Acknowledged" | "Resolved";
}

// Import centralized mock data
import { MOCK_CROSS_SCOPE_CONFLICTS, type MockCrossScopeConflict } from "@/data/mockData";

// Type compatibility for existing component
type CrossScopeConflict = MockCrossScopeConflict;

const mockConflicts: CrossScopeConflict[] = MOCK_CROSS_SCOPE_CONFLICTS;

export function CrossScopeConflictsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [conflicts] = useState<CrossScopeConflict[]>(mockConflicts);
  const { toast } = useToast();

  const filteredConflicts = conflicts.filter(conflict =>
    conflict.yourPolicy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conflict.conflictingPolicyOwner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conflict.conflictType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High": return "destructive";
      case "Medium": return "default"; 
      case "Low": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "destructive";
      case "Acknowledged": return "default";
      case "Resolved": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active": return <AlertTriangle className="h-3 w-3" />;
      case "Acknowledged": return <AlertCircle className="h-3 w-3" />;
      case "Resolved": return <CheckCircle className="h-3 w-3" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const handleNotifyOwner = (conflict: CrossScopeConflict) => {
    toast({
      title: "Notification Sent",
      description: `A notification has been sent to ${conflict.conflictingPolicyOwner} about the policy conflict.`,
      duration: 3000,
    });
  };

  const handleOpenDiscussion = (conflict: CrossScopeConflict) => {
    toast({
      title: "Discussion Thread",
      description: "Discussion thread feature will be implemented in the next iteration.",
    });
  };

  const activeConflicts = conflicts.filter(c => c.status === "Active").length;
  const acknowledgedConflicts = conflicts.filter(c => c.status === "Acknowledged").length;
  const resolvedConflicts = conflicts.filter(c => c.status === "Resolved").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Cross-Scope Policy Conflicts
          </CardTitle>
          <CardDescription>
            Conflicts between your policies and policies managed by other teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{activeConflicts}</div>
              <div className="text-sm text-red-600">Active Conflicts</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{acknowledgedConflicts}</div>
              <div className="text-sm text-yellow-600">Acknowledged</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{resolvedConflicts}</div>
              <div className="text-sm text-green-600">Resolved</div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conflicts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Your Policy</TableHead>
                  <TableHead>Conflicting Policy Owner</TableHead>
                  <TableHead>Conflict Type</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConflicts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No conflicts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConflicts.map((conflict) => (
                    <TableRow key={conflict.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{conflict.yourPolicy}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {conflict.yourPolicyId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{conflict.conflictingPolicyOwner}</div>
                          <div className="text-sm text-muted-foreground">
                            Policy ID: {conflict.conflictingPolicyId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{conflict.conflictType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{conflict.impact}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(conflict.severity) as any}>
                          {conflict.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(conflict.status)}
                          <Badge variant={getStatusColor(conflict.status) as any}>
                            {conflict.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleNotifyOwner(conflict)}
                            className="h-7 text-xs"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Notify
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenDiscussion(conflict)}
                            className="h-7 text-xs"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Discuss
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredConflicts.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Resolution Guidelines:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use "Notify Owner" to send a system message to the conflicting policy owner</li>
                <li>• "Discuss" opens a collaboration thread for policy coordination</li>
                <li>• High-severity conflicts should be resolved before promoting policies to production</li>
                <li>• Contact your administrator if you need help resolving complex conflicts</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
