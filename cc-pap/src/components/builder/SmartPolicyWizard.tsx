import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Brain, 
  Shield, 
  Users, 
  Target, 
  Zap, 
  ChevronRight,
  Sparkles,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info,
  Server,
  Construction
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

interface SmartPolicyWizardProps {
  policyData: PolicyData;
  setPolicyData: (data: PolicyData) => void;
  onNext: () => void;
}

export function SmartPolicyWizard({ policyData, setPolicyData, onNext }: SmartPolicyWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [bouncers, setBouncers] = useState<any[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  // Fetch resources and bouncers on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingResources(true);
      try {
        const resourcesResponse = await fetch('/api/resources');
        const bouncersResponse = await fetch('/api/peps');
        
        // Check if we got JSON responses
        const resContentType = resourcesResponse.headers.get('content-type');
        const bounContentType = bouncersResponse.headers.get('content-type');
        
        if (resourcesResponse.ok && resContentType?.includes('application/json')) {
          const resourcesData = await resourcesResponse.json();
          setResources(resourcesData);
        } else {
          console.warn('Resources API not available or returned non-JSON');
          setResources([]);
        }
        
        if (bouncersResponse.ok && bounContentType?.includes('application/json')) {
          const bouncersData = await bouncersResponse.json();
          setBouncers(bouncersData);
        } else {
          console.warn('Bouncers API not available or returned non-JSON');
          setBouncers([]);
        }
      } catch (error) {
        console.error('Failed to fetch resources/bouncers:', error);
        console.warn('Backend API may not be running. Start with: uvicorn app.main:app --reload');
        setResources([]);
        setBouncers([]);
      } finally {
        setIsLoadingResources(false);
      }
    };
    
    fetchData();
  }, []);

  const steps = [
    { id: 1, title: "Select Resource & Bouncer", icon: Server },
    { id: 2, title: "Choose Policy Template", icon: Target },
    { id: 3, title: "Who should have access?", icon: Users },
    { id: 4, title: "What should happen?", icon: Shield },
    { id: 5, title: "Review & Create", icon: CheckCircle }
  ];

  const templates = [
    {
      id: 'ai-chat-protection',
      title: 'AI Chat Protection',
      description: 'Protect sensitive data in AI chat conversations',
      icon: Brain,
      category: 'AI Security',
      complexity: 'Simple',
      estimatedTime: '2 minutes'
    },
    {
      id: 'api-access-control',
      title: 'API Access Control',
      description: 'Control who can access your APIs',
      icon: Shield,
      category: 'API Security',
      complexity: 'Simple',
      estimatedTime: '3 minutes'
    },
    {
      id: 'data-masking',
      title: 'Data Masking',
      description: 'Mask sensitive data based on user roles',
      icon: Users,
      category: 'Data Protection',
      complexity: 'Medium',
      estimatedTime: '5 minutes'
    },
    {
      id: 'vendor-access',
      title: 'Vendor Access Control',
      description: 'Control access to external vendor services',
      icon: Target,
      category: 'Platform Security',
      complexity: 'Medium',
      estimatedTime: '4 minutes'
    }
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setPolicyData({
        ...policyData,
        name: template.title,
        description: template.description
      });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onNext();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Select Resource & Bouncer</h3>
              <p className="text-muted-foreground">
                Choose the resource to protect and the bouncer (PEP) that will enforce this policy
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Protected Resource *</Label>
                <Select 
                  value={policyData.resourceId} 
                  onValueChange={(value) => setPolicyData({ ...policyData, resourceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingResources ? (
                      <SelectItem value="loading" disabled>Loading resources...</SelectItem>
                    ) : resources.length === 0 ? (
                      <SelectItem value="none" disabled>No resources available</SelectItem>
                    ) : (
                      resources.map((resource) => (
                        <SelectItem key={resource.id} value={resource.id}>
                          {resource.name} - {resource.type}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  The API or resource that this policy will protect
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Bouncer (Policy Enforcement Point) *</Label>
                <Select 
                  value={policyData.bouncerId} 
                  onValueChange={(value) => setPolicyData({ ...policyData, bouncerId: value })}
                  disabled={!policyData.resourceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bouncer" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingResources ? (
                      <SelectItem value="loading" disabled>Loading bouncers...</SelectItem>
                    ) : bouncers.length === 0 ? (
                      <SelectItem value="none" disabled>No bouncers available</SelectItem>
                    ) : (
                      bouncers.map((bouncer) => (
                        <SelectItem key={bouncer.id} value={bouncer.id}>
                          {bouncer.name} - {bouncer.environment || 'sandbox'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  The bouncer that will enforce this policy for the selected resource
                </p>
              </div>

              {policyData.resourceId && policyData.bouncerId && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Resource and bouncer selected
                    </span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    This policy will be deployed to the selected bouncer and will protect the selected resource
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Choose a Policy Template</h3>
              <p className="text-muted-foreground">
                Select a template that matches your security needs, or start from scratch
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <template.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{template.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {template.complexity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      {template.estimatedTime}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center relative">
              <Button variant="outline" className="w-full opacity-50 cursor-not-allowed" disabled>
                <Construction className="h-4 w-4 mr-2" />
                Start from scratch with AI assistance
              </Button>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  New Controls Builder Assistant Coming Soon
                </Badge>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Who should have access?</h3>
              <p className="text-muted-foreground">
                Define who can access this resource based on their role or identity
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">User Roles</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrators</SelectItem>
                    <SelectItem value="user">Regular Users</SelectItem>
                    <SelectItem value="guest">Guest Users</SelectItem>
                    <SelectItem value="custom">Custom Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Departments</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Access Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Access</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="limited">Limited Access</SelectItem>
                    <SelectItem value="none">No Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    AI Suggestion
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Based on your template, we recommend allowing access to administrators and engineering team members only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">What should happen?</h3>
              <p className="text-muted-foreground">
                Define what happens when someone tries to access this resource
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Action</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">Allow Access</SelectItem>
                    <SelectItem value="deny">Deny Access</SelectItem>
                    <SelectItem value="mask">Mask Sensitive Data</SelectItem>
                    <SelectItem value="log">Log and Allow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Conditions</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="auth-required" className="rounded" />
                    <Label htmlFor="auth-required" className="text-sm">Require authentication</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="time-restriction" className="rounded" />
                    <Label htmlFor="time-restriction" className="text-sm">Business hours only</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="location-restriction" className="rounded" />
                    <Label htmlFor="location-restriction" className="text-sm">Office location only</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Security Check
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Your policy configuration looks secure. We recommend adding authentication requirements for better security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Review & Create</h3>
              <p className="text-muted-foreground">
                Review your policy configuration and create it
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Policy Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Policy Name</Label>
                    <p className="text-sm">{policyData.name || 'AI Chat Protection'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Action</Label>
                    <p className="text-sm">Allow Access</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">User Roles</Label>
                    <p className="text-sm">Administrators, Engineering</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Conditions</Label>
                    <p className="text-sm">Authentication Required</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    AI Analysis Complete
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Your policy has been analyzed and optimized for security and performance. Ready to create!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              currentStep >= step.id 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              <step.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        <Button onClick={handleNext}>
          {currentStep === steps.length ? 'Create Policy' : 'Next'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
