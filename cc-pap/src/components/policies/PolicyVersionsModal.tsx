
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, GitBranch, User, RotateCcw } from "lucide-react";
import { Policy } from "./types";

interface PolicyVersionsModalProps {
  policy: Policy | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PolicyVersion {
  version: string;
  createdAt: string;
  createdBy: string;
  status: "current" | "previous" | "archived";
  description: string;
  changes: string[];
}

// Mock data for policy versions
const getMockVersions = (policyId: string): PolicyVersion[] => [
  {
    version: "v1.3.0",
    createdAt: "2024-01-20T10:30:00Z",
    createdBy: "John Doe",
    status: "current",
    description: "Added new resource access rules",
    changes: ["Added access to /api/reports", "Updated role permissions", "Fixed condition logic"]
  },
  {
    version: "v1.2.0",
    createdAt: "2024-01-15T14:20:00Z",
    createdBy: "Jane Smith",
    status: "previous",
    description: "Performance improvements",
    changes: ["Optimized rule evaluation", "Reduced policy size", "Updated documentation"]
  },
  {
    version: "v1.1.0",
    createdAt: "2024-01-10T09:15:00Z",
    createdBy: "Mike Johnson",
    status: "previous",
    description: "Initial production release",
    changes: ["Base policy structure", "Core access rules", "Basic conditions"]
  }
];

export function PolicyVersionsModal({ policy, isOpen, onClose }: PolicyVersionsModalProps) {
  if (!policy) return null;

  const versions = getMockVersions(policy.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'current': return 'default';
      case 'previous': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Policy Versions - {policy.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {versions.map((version, index) => (
            <Card key={version.version} className={version.status === 'current' ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{version.version}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(version.status)}>
                      {version.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {version.status !== 'current' && (
                      <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Rollback
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDate(version.createdAt)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {version.createdBy}
                  </div>
                </div>
                
                <p className="text-sm mb-3">{version.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Changes:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {version.changes.map((change, changeIndex) => (
                      <li key={changeIndex} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
