
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Database, ChevronLeft, HardDrive } from "lucide-react";
import { Link } from "react-router-dom";

interface DataRetentionSetting {
  id: string;
  name: string;
  description: string;
  currentRetention: string;
  storageUsage: number;
  maxStorage: number;
}

export function DataRetentionPage() {
  const [dataTypes, setDataTypes] = useState<DataRetentionSetting[]>([
    {
      id: "audit-logs",
      name: "Authorization Audit Logs",
      description: "Detailed records of every authorization decision (who, what, where, when, why).",
      currentRetention: "90-days",
      storageUsage: 750,
      maxStorage: 1000
    },
    {
      id: "system-logs",
      name: "Platform System Logs",
      description: "Internal logs for platform operations, errors, and performance.",
      currentRetention: "30-days",
      storageUsage: 120,
      maxStorage: 500
    },
    {
      id: "policy-versions",
      name: "Policy Version History",
      description: "Snapshots of all policy versions in the Policy Store.",
      currentRetention: "keep-10",
      storageUsage: 45,
      maxStorage: 200
    },
    {
      id: "analysis-results",
      name: "Policy Analysis Results",
      description: "Historical results of policy conflict analyses, impact simulations, and least privilege advisories.",
      currentRetention: "1-year",
      storageUsage: 30,
      maxStorage: 100
    }
  ]);

  const retentionOptions = {
    "audit-logs": [
      { value: "7-days", label: "7 days" },
      { value: "30-days", label: "30 days" },
      { value: "90-days", label: "90 days" },
      { value: "1-year", label: "1 year" },
      { value: "indefinite", label: "Indefinite" }
    ],
    "system-logs": [
      { value: "7-days", label: "7 days" },
      { value: "30-days", label: "30 days" },
      { value: "90-days", label: "90 days" },
      { value: "1-year", label: "1 year" }
    ],
    "policy-versions": [
      { value: "keep-5", label: "Keep last 5 versions" },
      { value: "keep-10", label: "Keep last 10 versions" },
      { value: "keep-25", label: "Keep last 25 versions" },
      { value: "2-years", label: "Keep for 2 years" },
      { value: "indefinite", label: "Indefinite" }
    ],
    "analysis-results": [
      { value: "30-days", label: "30 days" },
      { value: "90-days", label: "90 days" },
      { value: "1-year", label: "1 year" },
      { value: "indefinite", label: "Indefinite" }
    ]
  };

  const handleRetentionChange = (dataTypeId: string, newRetention: string) => {
    setDataTypes(prev => prev.map(dt => 
      dt.id === dataTypeId ? { ...dt, currentRetention: newRetention } : dt
    ));
  };

  const handleApplyChanges = () => {
    console.log("Applying data retention changes:", dataTypes);
    // Implementation would handle the actual save operation
  };

  const totalStorageUsed = dataTypes.reduce((sum, dt) => sum + dt.storageUsage, 0);
  const totalMaxStorage = dataTypes.reduce((sum, dt) => sum + dt.maxStorage, 0);

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Data Retention Policies</h1>
          <p className="text-muted-foreground">
            Configure how long various types of platform data are stored for compliance and storage optimization.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Storage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Current Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Storage Used</span>
                <span>{totalStorageUsed} MB / {totalMaxStorage} MB</span>
              </div>
              <Progress value={(totalStorageUsed / totalMaxStorage) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Data Retention Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention Settings</CardTitle>
            <CardDescription>
              Configure retention periods for different types of platform data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {dataTypes.map((dataType) => (
              <div key={dataType.id} className="p-4 border rounded-lg space-y-4">
                <div>
                  <h3 className="font-medium">{dataType.name}</h3>
                  <p className="text-sm text-muted-foreground">{dataType.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor={`retention-${dataType.id}`}>Retention Period</Label>
                    <Select 
                      value={dataType.currentRetention} 
                      onValueChange={(value) => handleRetentionChange(dataType.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {retentionOptions[dataType.id as keyof typeof retentionOptions]?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Current Storage</Label>
                    <div className="text-sm text-muted-foreground">
                      {dataType.storageUsage} MB used
                    </div>
                    <Progress 
                      value={(dataType.storageUsage / dataType.maxStorage) * 100} 
                      className="h-2 mt-1" 
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Preview Impact</Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Apply Changes */}
        <div className="flex justify-end">
          <Button onClick={handleApplyChanges} className="px-8">
            Apply All Changes
          </Button>
        </div>
      </div>
    </div>
  );
}