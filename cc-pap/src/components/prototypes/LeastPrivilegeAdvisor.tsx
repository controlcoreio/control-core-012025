
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, AlertTriangle, CheckCircle, TrendingDown, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

// Import centralized mock data
import { MOCK_LEAST_PRIVILEGE_RECOMMENDATIONS, type MockLeastPrivilegeRecommendation } from "@/data/mockData";

type PrivilegeRecommendation = MockLeastPrivilegeRecommendation;
const mockRecommendations: PrivilegeRecommendation[] = MOCK_LEAST_PRIVILEGE_RECOMMENDATIONS;

const getRiskColor = (risk: "High" | "Medium" | "Low") => {
  switch (risk) {
    case "High": return "text-red-600 bg-red-50 border-red-200";
    case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "Low": return "text-green-600 bg-green-50 border-green-200";
  }
};

const getRiskIcon = (risk: "High" | "Medium" | "Low") => {
  switch (risk) {
    case "High": return <AlertTriangle className="h-4 w-4" />;
    case "Medium": return <Shield className="h-4 w-4" />;
    case "Low": return <CheckCircle className="h-4 w-4" />;
  }
};

export function LeastPrivilegeAdvisor() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<PrivilegeRecommendation | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Least Privilege Advisor</h2>
          <p className="text-muted-foreground">
            AI-powered analysis identifies overly permissive policies based on actual usage patterns
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <TrendingDown className="h-4 w-4 mr-1" />
          {mockRecommendations.length} Opportunities
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Policies Analyzed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">76%</div>
                <div className="text-sm text-muted-foreground">Avg. Privilege Reduction</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold">93%</div>
                <div className="text-sm text-muted-foreground">Avg. Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">1</div>
                <div className="text-sm text-muted-foreground">High Risk Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {mockRecommendations.map((rec) => (
          <Card key={rec.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{rec.policyName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-xs", getRiskColor(rec.riskLevel))}>
                      {getRiskIcon(rec.riskLevel)}
                      <span className="ml-1">{rec.riskLevel.toUpperCase()} RISK</span>
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {rec.confidence}% Confidence
                    </Badge>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{rec.policyName} - Privilege Analysis</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2">Current Permissions</h4>
                          <p className="text-sm text-muted-foreground mb-4">{rec.currentPermissions}</p>
                          
                          <h4 className="font-semibold mb-2">Observed Usage (30 days)</h4>
                          <p className="text-sm text-muted-foreground">{rec.observedUsage}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">AI Recommendation</h4>
                          <p className="text-sm text-muted-foreground mb-4">{rec.aiSuggestion}</p>
                          
                          <h4 className="font-semibold mb-2">Impact Assessment</h4>
                          <p className="text-sm text-muted-foreground">{rec.impactAssessment}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Suggested Changes</h4>
                        <ul className="space-y-1">
                          {rec.suggestedChanges.map((change, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button>Apply Suggestions</Button>
                        <Button variant="outline">Review in Policy Editor</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium">AI Suggestion:</div>
                  <p className="text-sm text-muted-foreground">{rec.aiSuggestion}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">Potential Impact:</span> {rec.potentialSavings}
                  </div>
                  <Button size="sm">Review & Apply</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Recommendations are based on 30+ days of audit log analysis. All suggestions maintain current functionality while reducing unnecessary privileges.
        </AlertDescription>
      </Alert>
    </div>
  );
}
