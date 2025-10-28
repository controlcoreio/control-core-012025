
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Import } from "lucide-react";
import { useNavigate } from "react-router-dom";

const smartPolicies = [
  {
    name: "Optimized API Access",
    description: "Combines user and admin API access with optimized evaluation.",
    id: "opt-api",
    code: "// Rego code for optimized access policy"
  }
];

export function ImportSmartPolicies() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2 items-center">
          <Import className="text-indigo-700" size={18} />
          <CardTitle>Import Smart Policies</CardTitle>
        </div>
        <CardDescription>
          Instantly bring optimized or recommended policies into production.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {smartPolicies.length === 0 ? (
          <div className="text-muted-foreground text-sm">No smart policies ready for import.</div>
        ) : (
          <div className="space-y-3">
            {smartPolicies.map((sp) => (
              <div key={sp.id} className="flex gap-3 items-center border rounded-md p-3">
                <div className="flex-1">
                  <span className="font-semibold">{sp.name}:</span>{" "}
                  <span className="text-sm text-muted-foreground">{sp.description}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.alert(sp.code)}
                >
                  View Smart Policy
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    navigate("/policies?import=" + sp.id);
                  }}
                >
                  Import to Policies
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
