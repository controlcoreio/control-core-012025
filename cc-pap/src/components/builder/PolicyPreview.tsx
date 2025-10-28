import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Code, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Play,
  Save,
  ArrowLeft,
  Sparkles,
  Brain,
  Zap
} from "lucide-react";

interface PolicyData {
  name: string;
  description: string;
  resourceId: string;
  bouncerId: string;
  effect: 'allow' | 'deny' | 'mask' | 'log';
  conditions: PolicyCondition[];
  regoCode: string;
  status: 'draft' | 'active';
}

interface PolicyCondition {
  id: string;
  attribute: string;
  operator: string;
  value: string;
  enabled: boolean;
}

interface SmartSuggestion {
  type: string;
  title: string;
  description: string;
  priority: string;
}

interface TestResults {
  passed: number;
  failed: number;
  total: number;
  tests: TestCase[];
}

interface TestCase {
  name: string;
  status: string;
  description: string;
  details?: string;
}

interface PolicyPreviewProps {
  policyData: PolicyData;
  smartSuggestions: SmartSuggestion[];
  onSave?: () => void;
  onBack?: () => void;
}

export function PolicyPreview({ 
  policyData, 
  smartSuggestions, 
  onSave, 
  onBack 
}: PolicyPreviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'code'>('overview');
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const runTests = async () => {
    setIsTesting(true);
    try {
      // Simulate policy testing
      const results = {
        passed: 3,
        failed: 1,
        total: 4,
        tests: [
          {
            name: "Admin access test",
            status: "passed",
            description: "Admin user can access resource",
            details: "User with admin role successfully accessed the resource"
          },
          {
            name: "Guest access test",
            status: "passed",
            description: "Guest user is denied access",
            details: "User with guest role was correctly denied access"
          },
          {
            name: "Invalid input test",
            status: "passed",
            description: "Invalid input is handled correctly",
            details: "Policy correctly handled invalid input without errors"
          },
          {
            name: "Edge case test",
            status: "failed",
            description: "Edge case handling needs improvement",
            details: "Policy failed to handle edge case with null values"
          }
        ]
      };
      
      setTestResults(results);
    } catch (error) {
      console.error('Testing failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const getEffectIcon = (effect: string) => {
    switch (effect) {
      case 'allow': return CheckCircle;
      case 'deny': return AlertTriangle;
      case 'mask': return Eye;
      case 'log': return Info;
      default: return Shield;
    }
  };

  const getEffectColor = (effect: string) => {
    switch (effect) {
      case 'allow': return 'text-green-600 bg-green-100';
      case 'deny': return 'text-red-600 bg-red-100';
      case 'mask': return 'text-yellow-600 bg-yellow-100';
      case 'log': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Control Preview</h3>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Ready to Deploy
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'code')} className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Code
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="h-full">
              <div className="h-full overflow-y-auto space-y-6">
                {/* Control Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Control Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Control Name</Label>
                        <p className="text-sm">{policyData.name || 'Untitled Policy'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Effect</Label>
                        <div className="flex items-center gap-2">
                          <Badge className={getEffectColor(policyData.effect || 'allow')}>
                            <Shield className="h-3 w-3 mr-1" />
                            {policyData.effect?.toUpperCase() || 'ALLOW'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Resource</Label>
                        <p className="text-sm">{policyData.resourceId || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                        <Badge variant="outline" className="text-xs">
                          {policyData.status || 'Draft'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Smart Suggestions */}
                {smartSuggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {smartSuggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className={`p-1 rounded-full ${
                              suggestion.priority === 'high' ? 'bg-red-100 text-red-600' :
                              suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <h6 className="font-medium">{suggestion.title}</h6>
                              <p className="text-sm text-muted-foreground">
                                {suggestion.description}
                              </p>
                            </div>
                            <Button size="sm" variant="outline">
                              Apply
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Security Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Security Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Authentication required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Input validation present</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Consider adding rate limiting</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="code" className="h-full">
              <div className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Generated Policy Code</CardTitle>
                    <CardDescription>
                      This is the Rego code that will be deployed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-full">
                    <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto h-full text-sm">
                      {policyData.regoCode || '// No code generated yet'}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="test" className="h-full">
              <div className="h-full overflow-y-auto">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Policy Testing</CardTitle>
                      <CardDescription>
                        Test your policy with various scenarios
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {testResults ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {testResults.passed}
                              </div>
                              <div className="text-sm text-muted-foreground">Passed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">
                                {testResults.failed}
                              </div>
                              <div className="text-sm text-muted-foreground">Failed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-600">
                                {testResults.total}
                              </div>
                              <div className="text-sm text-muted-foreground">Total</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {testResults.tests.map((test: TestCase, index: number) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className={`p-1 rounded-full ${
                                  test.status === 'passed' 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                  {test.status === 'passed' ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h6 className="font-medium">{test.name}</h6>
                                  <p className="text-sm text-muted-foreground">
                                    {test.description}
                                  </p>
                                </div>
                                <Badge variant={test.status === 'passed' ? 'default' : 'destructive'}>
                                  {test.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h5 className="font-medium text-gray-600">No tests run yet</h5>
                          <p className="text-sm text-muted-foreground mb-4">
                            Click "Test Policy" to run automated tests
                          </p>
                          <Button onClick={runTests} disabled={isTesting}>
                            <Play className="h-4 w-4 mr-2" />
                            {isTesting ? 'Running Tests...' : 'Run Tests'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deploy" className="h-full">
              <div className="h-full overflow-y-auto">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Deployment Options</CardTitle>
                      <CardDescription>
                        Choose how to deploy your policy
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="cursor-pointer hover:shadow-md transition-all">
                          <CardContent className="p-4 text-center">
                            <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <h4 className="font-medium">Deploy Now</h4>
                            <p className="text-sm text-muted-foreground">
                              Deploy immediately to production
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card className="cursor-pointer hover:shadow-md transition-all">
                          <CardContent className="p-4 text-center">
                            <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <h4 className="font-medium">Staged Deployment</h4>
                            <p className="text-sm text-muted-foreground">
                              Deploy to staging first
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Deployment Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Policy syntax validated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Security analysis completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Tests passed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">Review AI suggestions</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Footer */}
    </div>
  );
}
