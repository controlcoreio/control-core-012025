
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ArrowUpRight, History, RotateCcw, Eye, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { PromotePoliciesWizard } from "./environment-management/PromotePoliciesWizard";
import { RollbackPoliciesWizard } from "./environment-management/RollbackPoliciesWizard";
import { DeployFromHistoryWizard } from "./environment-management/DeployFromHistoryWizard";

interface PolicyEnvironment {
  id: string;
  name: string;
  description: string;
  activePolicies: number;
  pendingPromotions: number;
  conflictsDetected: number;
  lastUpdated: string;
  updatedBy: string;
  currentBundleVersion: string;
  status: "healthy" | "warning" | "error";
}

const environments: PolicyEnvironment[] = [
  {
    id: "development",
    name: "Development",
    description: "Development environment for policy testing",
    activePolicies: 85,
    pendingPromotions: 0,
    conflictsDetected: 0,
    lastUpdated: "2024-06-02 15:30",
    updatedBy: "john.doe",
    currentBundleVersion: "v2.3.0-dev",
    status: "healthy"
  },
  {
    id: "qa",
    name: "QA / Testing",
    description: "Quality assurance environment",
    activePolicies: 78,
    pendingPromotions: 3,
    conflictsDetected: 1,
    lastUpdated: "2024-06-01 11:15",
    updatedBy: "jane.smith",
    currentBundleVersion: "v2.2.1",
    status: "warning"
  },
  {
    id: "staging",
    name: "Staging",
    description: "Pre-production staging environment",
    activePolicies: 110,
    pendingPromotions: 1,
    conflictsDetected: 0,
    lastUpdated: "2024-05-30 16:45",
    updatedBy: "ops.team",
    currentBundleVersion: "v2.2.0",
    status: "healthy"
  },
  {
    id: "production",
    name: "Production",
    description: "Live production environment",
    activePolicies: 110,
    pendingPromotions: 0,
    conflictsDetected: 0,
    lastUpdated: "2024-05-28 10:00",
    updatedBy: "platform.admin",
    currentBundleVersion: "v2.1.5",
    status: "healthy"
  }
];

export function PolicyEnvironmentsPage() {
  const [selectedWizard, setSelectedWizard] = useState<"promote" | "rollback" | "deploy" | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<PolicyEnvironment | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 text-green-700 border-green-200";
      case "warning":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "error":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const openWizard = (type: "promote" | "rollback" | "deploy", environment: PolicyEnvironment) => {
    setSelectedEnvironment(environment);
    setSelectedWizard(type);
  };

  const closeWizard = () => {
    setSelectedWizard(null);
    setSelectedEnvironment(null);
  };

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Policy Environment Management</h1>
          <p className="text-muted-foreground">Manage policy lifecycle across deployment environments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {environments.map((env) => (
          <Card key={env.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{env.name}</CardTitle>
                <div className="flex items-center gap-1">
                  {getStatusIcon(env.status)}
                  <Badge variant="outline" className={getStatusColor(env.status)}>
                    {env.status}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-sm">{env.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Current Bundle</div>
                  <div className="font-medium text-primary">{env.currentBundleVersion}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 border rounded">
                    <div className="font-medium text-green-600">{env.activePolicies}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div className="text-center p-2 border rounded">
                    <div className="font-medium text-blue-600">{env.pendingPromotions}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                </div>

                {env.conflictsDetected > 0 && (
                  <div className="text-center p-2 border border-yellow-200 bg-yellow-50 rounded">
                    <div className="font-medium text-yellow-700">{env.conflictsDetected}</div>
                    <div className="text-xs text-yellow-600">Conflicts</div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Updated {env.lastUpdated} by {env.updatedBy}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Policies
                </Button>
                
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => openWizard("promote", env)}
                  disabled={env.id === "production"}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Promote Policies
                </Button>

                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openWizard("rollback", env)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Rollback
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openWizard("deploy", env)}
                  >
                    <History className="h-4 w-4 mr-1" />
                    Deploy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Pipeline Overview</CardTitle>
          <CardDescription>Typical promotion flow for policy releases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-4">
              {environments.map((env, index) => (
                <div key={env.id} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      env.status === "healthy" ? "bg-green-500" : 
                      env.status === "warning" ? "bg-yellow-500" : "bg-red-500"
                    }`}></div>
                    <span className="text-sm font-medium mt-1">{env.name}</span>
                    <span className="text-xs text-muted-foreground">{env.currentBundleVersion}</span>
                  </div>
                  {index < environments.length - 1 && (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedWizard === "promote" && selectedEnvironment && (
        <PromotePoliciesWizard
          sourceEnvironment={selectedEnvironment}
          onClose={closeWizard}
        />
      )}

      {selectedWizard === "rollback" && selectedEnvironment && (
        <RollbackPoliciesWizard
          environment={selectedEnvironment}
          onClose={closeWizard}
        />
      )}

      {selectedWizard === "deploy" && selectedEnvironment && (
        <DeployFromHistoryWizard
          environment={selectedEnvironment}
          onClose={closeWizard}
        />
      )}
    </div>
  );
}
