
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useNavigate } from "react-router-dom";

const updateSuggestions = [
  {
    name: "System Admin Access",
    suggestion: "Consider splitting this policy to reduce complexity.",
    details: "This policy contains multiple nested rules that affect performance.",
    id: "system-admin"
  },
  {
    name: "Data Export Policy",
    suggestion: "Potentially redundant with 'Data Access Policy'.",
    details: "Reviewed conditions overlap, consider consolidation.",
    id: "data-export"
  }
];

export function PolicyUpdateSuggestions() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <EnterpriseIcon name="light-bulb" className="text-violet-600" size={18} />
          <CardTitle>Policy Update Suggestions</CardTitle>
        </div>
        <CardDescription>
          Suggested improvements drawn from recent analysis and best practices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {updateSuggestions.map(s => (
            <div key={s.id} className="flex items-start border p-3 rounded-md">
              <div className="font-medium flex-1">
                <span className="text-base">{s.name}:</span>{" "}
                <span className="text-sm text-muted-foreground">{s.suggestion}</span>
                <div className="text-xs text-muted-foreground mt-1">{s.details}</div>
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
