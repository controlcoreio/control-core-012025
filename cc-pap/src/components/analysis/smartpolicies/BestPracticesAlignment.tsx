
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useNavigate } from "react-router-dom";

const bestPractices = [
  {
    name: "Legacy API Access",
    issue: "Missing default deny rule.",
    explanation: "Add a default deny rule to follow Rego best practices.",
    id: "legacy-api"
  },
  {
    name: "Temporary Testing Policy",
    issue: "Ambiguous variable names.",
    explanation: "Clarify variable naming for maintainability.",
    id: "temp-testing"
  }
];

export function BestPracticesAlignment() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2 items-center">
          <EnterpriseIcon name="document-check" className="text-sky-800" size={18} />
          <CardTitle>PBAC Rego Best Practices Alignment</CardTitle>
        </div>
        <CardDescription>
          Review adherence and recommendations for Rego best practices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {bestPractices.map(bp => (
            <div key={bp.id} className="flex items-center border rounded-md p-3">
              <div className="flex-1">
                <span className="font-medium">{bp.name}:</span>{" "}
                <span className="text-sm text-red-700">{bp.issue}</span>
                <div className="text-xs mt-1 text-muted-foreground">{bp.explanation}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-3"
                onClick={() => navigate("/editor")}
              >
                View Policy
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
