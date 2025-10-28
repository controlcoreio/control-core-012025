
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useNavigate } from "react-router-dom";

const pastConflicts = [
  {
    name: "Report Access",
    summary: "Conflict with 'Manager Permissions' on /api/reports.",
    recommendation: "Refine rule order for deny/allow.",
    id: "report-access"
  },
  {
    name: "User Data Access",
    summary: "Overlapping scopes with 'Admin Access' for /api/users.",
    recommendation: "Make resource conditions more specific.",
    id: "user-data"
  }
];

export function PastConflicts() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2 items-center">
          <EnterpriseIcon name="exclamation-triangle" className="text-emerald-700" size={18} />
          <CardTitle>Past Conflicts and Resolution Opportunities</CardTitle>
        </div>
        <CardDescription>
          Review conflict history and potential resolutions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pastConflicts.map(pc => (
            <div key={pc.id} className="flex items-center border rounded-md p-3">
              <div className="flex-1">
                <span className="font-medium">{pc.name}:</span>{" "}
                <span className="text-sm text-muted-foreground">{pc.summary}</span>
                <div className="text-xs mt-1 text-muted-foreground">{pc.recommendation}</div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="ml-3"
                onClick={() => navigate("/analysis?tab=conflicts")}
              >
                View Conflict Analysis
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
