
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Save, FileDown, Plus, CheckCircle, XCircle, Clock, ArrowRight, Trash2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { usePolicies } from "@/hooks/use-policies";

interface AttributeValue {
  key: string;
  value: string;
  type: "string" | "number" | "boolean";
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  policy: string;
  resource: string;
  action: string;
  userAttributes: AttributeValue[];
  resourceAttributes: AttributeValue[];
  contextAttributes: AttributeValue[];
  expectedResult?: "allow" | "deny";
}

export function TestConsole() {
  // Fetch real policies from backend
  const { policies, isLoading: policiesLoading } = usePolicies({ status: 'enabled' });
  
  const [testResults, setTestResults] = useState<null | {
    decision: "allow" | "deny";
    message: string;
    timestamp: Date;
    duration: number;
    ruleEvaluations: Array<{
      rule: string;
      result: boolean;
      conditions: Array<{ condition: string; result: boolean; }>;
    }>;
    aiThreatAnalysis?: {
      threatsDetected: string[];
      riskScore: number;
      recommendations: string[];
    };
  }>(null);

  const [currentScenario, setCurrentScenario] = useState<TestScenario>({
    id: "1",
    name: "Basic User Access Test",
    description: "Test user access to their own profile",
    policy: "user-access-control",
    resource: "/users/{id}",
    action: "read",
    userAttributes: [
      { key: "user.id", value: "user-123", type: "string" },
      { key: "user.role", value: "user", type: "string" },
      { key: "user.department", value: "engineering", type: "string" },
      { key: "user.location", value: "us-west", type: "string" }
    ],
    resourceAttributes: [
      { key: "resource.owner", value: "user-123", type: "string" },
      { key: "resource.type", value: "profile", type: "string" },
      { key: "resource.sensitivity", value: "low", type: "string" }
    ],
    contextAttributes: [
      { key: "context.authenticated", value: "true", type: "boolean" },
      { key: "context.client_ip", value: "203.0.113.1", type: "string" },
      { key: "context.time", value: "14:30:00", type: "string" }
    ],
    expectedResult: "allow"
  });

  const [activeTab, setActiveTab] = useState("visual");

  const runTest = () => {
    setTestResults(null);
    
    // Simulate test execution with delay
    setTimeout(() => {
      const decision = Math.random() > 0.3 ? "allow" : "deny";
      const hasAIThreats = Math.random() > 0.7;
      
      setTestResults({
        decision,
        message: decision === "allow" 
          ? "Policy evaluation successful. Access granted based on user attributes and resource ownership." 
          : "Policy evaluation denied. User does not meet the required conditions for the requested action.",
        timestamp: new Date(),
        duration: Math.floor(Math.random() * 100) + 50,
        ruleEvaluations: [
          {
            rule: "user_can_read_own_profile",
            result: decision === "allow",
            conditions: [
              { condition: "user.id == resource.owner", result: true },
              { condition: "action == 'read'", result: true },
              { condition: "context.authenticated == true", result: true }
            ]
          },
          {
            rule: "department_access_check",
            result: true,
            conditions: [
              { condition: "user.department in allowed_departments", result: true }
            ]
          }
        ],
        aiThreatAnalysis: hasAIThreats ? {
          threatsDetected: ["Suspicious IP pattern", "Unusual time access"],
          riskScore: 0.3,
          recommendations: ["Enable additional monitoring", "Consider time-based restrictions"]
        } : undefined
      });
    }, 1000);
  };

  const addAttribute = (category: keyof Pick<TestScenario, 'userAttributes' | 'resourceAttributes' | 'contextAttributes'>) => {
    setCurrentScenario(prev => ({
      ...prev,
      [category]: [...prev[category], { key: "", value: "", type: "string" as const }]
    }));
  };

  const updateAttribute = (category: keyof Pick<TestScenario, 'userAttributes' | 'resourceAttributes' | 'contextAttributes'>, index: number, field: keyof AttributeValue, value: string) => {
    setCurrentScenario(prev => ({
      ...prev,
      [category]: prev[category].map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (category: keyof Pick<TestScenario, 'userAttributes' | 'resourceAttributes' | 'contextAttributes'>, index: number) => {
    setCurrentScenario(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const renderAttributeSection = (
    title: string, 
    category: keyof Pick<TestScenario, 'userAttributes' | 'resourceAttributes' | 'contextAttributes'>,
    attributes: AttributeValue[]
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{title}</Label>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => addAttribute(category)}
          className="h-7 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {attributes.map((attr, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              placeholder="Key"
              value={attr.key}
              onChange={(e) => updateAttribute(category, index, 'key', e.target.value)}
              className="flex-1 text-xs"
            />
            <Input
              placeholder="Value"
              value={attr.value}
              onChange={(e) => updateAttribute(category, index, 'value', e.target.value)}
              className="flex-1 text-xs"
            />
            <Select value={attr.type} onValueChange={(value) => updateAttribute(category, index, 'type', value)}>
              <SelectTrigger className="w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeAttribute(category, index)}
              className="h-8 w-8 p-0 text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Console</h1>
          <p className="text-muted-foreground">Simulate policy decisions with custom attributes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save Scenario
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Export Results
          </Button>
          <Button size="sm" onClick={runTest}>
            <Play className="mr-2 h-4 w-4" />
            Run Test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Test Configuration */}
        <Card className="flex flex-col">
          <CardHeader className="px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle>Test Configuration</CardTitle>
              {currentScenario.expectedResult && (
                <Badge variant={currentScenario.expectedResult === "allow" ? "default" : "destructive"}>
                  Expected: {currentScenario.expectedResult}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-6 flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Policy</Label>
                <Select value={currentScenario.policy} onValueChange={(value) => setCurrentScenario(prev => ({ ...prev, policy: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={policiesLoading ? "Loading policies..." : "Select a policy"} />
                  </SelectTrigger>
                  <SelectContent>
                    {policiesLoading ? (
                      <SelectItem value="loading" disabled>Loading policies...</SelectItem>
                    ) : policies.length === 0 ? (
                      <SelectItem value="no-policies" disabled>No policies available</SelectItem>
                    ) : (
                      policies.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id.toString()}>
                          {policy.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={currentScenario.action} onValueChange={(value) => setCurrentScenario(prev => ({ ...prev, action: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="write">Write</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resource</Label>
              <Input
                value={currentScenario.resource}
                onChange={(e) => setCurrentScenario(prev => ({ ...prev, resource: e.target.value }))}
                placeholder="/path/to/resource"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList>
                <TabsTrigger value="visual">Attribute Builder</TabsTrigger>
                <TabsTrigger value="json">JSON Input</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visual" className="flex-1 space-y-4 mt-2">
                <div className="grid gap-4 max-h-[400px] overflow-y-auto">
                  {renderAttributeSection("User Attributes", "userAttributes", currentScenario.userAttributes)}
                  {renderAttributeSection("Resource Attributes", "resourceAttributes", currentScenario.resourceAttributes)}
                  {renderAttributeSection("Context Attributes", "contextAttributes", currentScenario.contextAttributes)}
                </div>
              </TabsContent>
              
              <TabsContent value="json" className="flex-1 mt-2">
                <Textarea 
                  className="font-mono text-sm flex-1 h-full resize-none"
                  value={JSON.stringify({
                    policy: currentScenario.policy,
                    resource: currentScenario.resource,
                    action: currentScenario.action,
                    user: Object.fromEntries(currentScenario.userAttributes.map(attr => [attr.key, attr.value])),
                    resource_attributes: Object.fromEntries(currentScenario.resourceAttributes.map(attr => [attr.key, attr.value])),
                    context: Object.fromEntries(currentScenario.contextAttributes.map(attr => [attr.key, attr.value]))
                  }, null, 2)}
                  readOnly
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="flex flex-col">
          <CardHeader className="px-6 py-4">
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="px-6 flex-1 flex flex-col gap-4">
            {testResults === null ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Run test to see results</h3>
                <p className="text-muted-foreground max-w-md">
                  Configure your test scenario and click "Run Test" to simulate the policy decision.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className={`flex items-center justify-between rounded-lg p-4 ${
                  testResults.decision === "allow" ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"
                }`}>
                  <div className="flex items-center gap-3">
                    {testResults.decision === "allow" ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {testResults.decision === "allow" ? "Access Granted" : "Access Denied"}
                      </h3>
                      <div className="text-sm opacity-80">
                        Completed in {testResults.duration}ms
                      </div>
                    </div>
                  </div>
                  <div className="text-xs opacity-80">
                    {testResults.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto">
                  <div>
                    <h3 className="font-medium mb-2">Decision Details</h3>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      {testResults.message}
                    </div>
                  </div>

                  {testResults.aiThreatAnalysis && (
                    <div>
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        AI Threat Analysis
                      </h3>
                      <div className="rounded-md bg-orange-50 p-3 text-sm space-y-2">
                        <div>
                          <span className="font-medium">Risk Score: </span>
                          <Badge variant={testResults.aiThreatAnalysis.riskScore > 0.5 ? "destructive" : "secondary"}>
                            {Math.round(testResults.aiThreatAnalysis.riskScore * 100)}%
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Threats: </span>
                          {testResults.aiThreatAnalysis.threatsDetected.join(", ")}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium mb-2">Rule Evaluations</h3>
                    <div className="space-y-2">
                      {testResults.ruleEvaluations.map((rule, index) => (
                        <div key={index} className="rounded-md bg-muted p-3 text-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{rule.rule}</span>
                            <Badge variant={rule.result ? "default" : "destructive"}>
                              {rule.result ? "PASS" : "FAIL"}
                            </Badge>
                          </div>
                          <div className="space-y-1 ml-4">
                            {rule.conditions.map((condition, condIndex) => (
                              <div key={condIndex} className="flex items-center gap-2 text-xs">
                                <span className={condition.result ? "text-green-600" : "text-red-600"}>
                                  {condition.result ? "✓" : "✗"}
                                </span>
                                <span>{condition.condition}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
