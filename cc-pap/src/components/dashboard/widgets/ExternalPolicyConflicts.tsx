
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OriginalPolicyConflict {
  id: string;
  yourPolicy: string;
  conflictingPolicyOwner: string;
  severity: "High" | "Medium" | "Low";
  description: string;
  conflictType: string;
}

// Import centralized mock data
import { MOCK_POLICY_CONFLICTS, type MockPolicyConflict } from "@/data/mockData";

// Type compatibility for existing component
type PolicyConflict = MockPolicyConflict;

const mockConflicts: PolicyConflict[] = MOCK_POLICY_CONFLICTS;

// Mock current user context
const currentUser = {
  role: "Policy Manager",
  scope: ["HR App", "Employee Data"]
};

export function ExternalPolicyConflicts() {
  const navigate = useNavigate();
  
  // Only show for Policy Managers
  if (currentUser.role !== "Policy Manager") {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High": return "destructive";
      case "Medium": return "default";
      case "Low": return "secondary";
      default: return "secondary";
    }
  };

  const handleViewConflictDetails = (conflictId: string) => {
    // Navigate to policy analysis with conflict filter
    navigate(`/analysis?tab=conflicts&conflict=${conflictId}`);
  };

  const handleViewAllConflicts = () => {
    navigate("/analysis?tab=cross-scope-conflicts");
  };

  if (mockConflicts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            External Policy Conflicts
          </CardTitle>
          <CardDescription>
            Conflicts with policies managed by other teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              No conflicts detected with other teams' policies
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          External Policy Conflicts
        </CardTitle>
        <CardDescription>
          Conflicts with policies managed by other teams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm font-medium text-orange-700 mb-3">
          Potential Conflicts Detected: {mockConflicts.length}
        </div>
        
        {mockConflicts.slice(0, 3).map((conflict) => (
          <div key={conflict.id} className="border rounded-lg p-3 bg-orange-50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm font-medium">
                  Your policy '{conflict.yourPolicy}' conflicts with another policy
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Managed by: {conflict.conflictingPolicyOwner}
                </div>
              </div>
              <Badge variant={getSeverityColor(conflict.severity) as any} className="text-xs">
                {conflict.severity}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground mb-2">
              {conflict.description}
            </div>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-7"
              onClick={() => handleViewConflictDetails(conflict.id)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Conflict Details
            </Button>
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewAllConflicts}
            className="w-full"
          >
            View All Conflicts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
