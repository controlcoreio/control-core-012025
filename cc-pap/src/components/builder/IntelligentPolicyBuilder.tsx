import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SecureStorage } from "@/utils/secureStorage";
import { 
  Shield, 
  Users, 
  Target, 
  Server,
  Zap, 
  Plus,
  X,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  MapPin,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContextManagementStep } from "./ContextManagementStep";
import { analyzePolicyComplexity, getComplexityMessage } from "@/utils/policyComplexity";
import { AdvancedFeaturesWarning } from "./AdvancedFeaturesWarning";

interface PolicyData {
  name: string;
  description: string;
  resourceId: string;
  bouncerId: string;
  effect: 'allow' | 'deny' | 'mask' | 'log';
  conditions: PolicyCondition[];
  regoCode: string;
  status: 'draft' | 'active';
  contextConfig?: Record<string, unknown>;
}

interface PolicyCondition {
  id: string;
  attribute: string;
  operator: string;
  value: string;
  enabled: boolean;
}

interface IntelligentPolicyBuilderProps {
  policyData: PolicyData;
  setPolicyData: (data: PolicyData) => void;
  onNext: () => void;
  onSwitchToCodeEditor?: () => void;
}

interface PIPAttribute {
  name: string;
  type: string;
  source: string;
  description?: string;
}

interface ResourceSchema {
  resource_type: string;
  available_actions: string[];
  endpoints: string[];
  authentication_required: boolean;
  data_classification: string;
  learned_attributes?: Array<{name: string; type: string; frequency?: number}>;
}

interface SmartSuggestion {
  type: 'condition' | 'attribute' | 'effect' | 'compliance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation?: Record<string, unknown>;
  reason: string;
}

export function IntelligentPolicyBuilder({ 
  policyData, 
  setPolicyData, 
  onNext,
  onSwitchToCodeEditor
}: IntelligentPolicyBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [policyName, setPolicyName] = useState(policyData.name || '');
  const [policyDescription, setPolicyDescription] = useState(policyData.description || '');
  const [effect, setEffect] = useState<'allow' | 'deny' | 'mask' | 'log'>(policyData.effect || 'allow');
  const [conditions, setConditions] = useState<PolicyCondition[]>(policyData.conditions || []);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [pipAttributes, setPipAttributes] = useState<PIPAttribute[]>([]);
  const [resourceSchema, setResourceSchema] = useState<ResourceSchema | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [manualAttributeInput, setManualAttributeInput] = useState('');
  const [availableResources, setAvailableResources] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [maskingConfig, setMaskingConfig] = useState({
    type: 'all' as 'all' | 'fields' | 'last_n' | 'pattern',
    fields: [] as string[],
    lastNChars: 4,
    pattern: ''
  });
  const [maskFieldInput, setMaskFieldInput] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [policyComplexity, setPolicyComplexity] = useState(analyzePolicyComplexity(policyData));
  const { toast } = useToast();

  const steps = [
    { id: 1, title: "Control Basics", icon: Shield },
    { id: 2, title: "Who Can Access?", icon: Users },
    { id: 3, title: "Conditions", icon: Target },
    { id: 4, title: "Effect", icon: Zap },
    { id: 5, title: "Context & Actions", icon: Sparkles },
    { id: 6, title: "Review", icon: CheckCircle }
  ];

  // Sync local state when policyData changes externally (e.g., template loading)
  useEffect(() => {
    console.log('[IntelligentPolicyBuilder] Syncing from policyData:', policyData);
    // Sync all fields from policyData prop to local state
    setPolicyName(policyData.name || '');
    setPolicyDescription(policyData.description || '');
    setEffect(policyData.effect || 'allow');
    
    // Auto-expand description field if template has long description
    if (policyData.description && policyData.description.length > 50) {
      setIsDescriptionExpanded(true);
    }
    
    if (policyData.conditions && policyData.conditions.length > 0) {
      setConditions(policyData.conditions);
    }
  }, [policyData]);  // Remove specific field dependencies, just watch policyData

  // Fetch available resources on mount
  useEffect(() => {
    const fetchResources = async () => {
      // Check if user is authenticated before making request
      const token = SecureStorage.getItem('access_token');
      
      if (!token) {
        // No token - user not logged in, don't make the request
        setIsLoadingResources(false);
        console.info('[Policy Builder] User not authenticated. Resources will load after login.');
        return;
      }
      
      setIsLoadingResources(true);
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/resources`, {
          headers
        });
        
        const contentType = response.headers.get('content-type');
        
        // Check if response is actually JSON before parsing
        if (response.ok && contentType?.includes('application/json')) {
          const resourcesData = await response.json();
          setAvailableResources(resourcesData);
          
          // If resourceId is already set (edit mode), find and set the selected resource
          if (policyData.resourceId) {
            const resource = resourcesData.find((r: any) => r.id.toString() === policyData.resourceId.toString());
            if (resource) {
              setSelectedResource(resource);
            }
          }
        } else if (response.status === 401) {
          // Token expired or invalid - handled by global401Handler
          console.info('[Policy Builder] Session expired. Please log in again.');
        } else {
          // Backend not available or returned non-JSON
          console.info('[Policy Builder] Could not load resources. Backend may be offline.');
        }
      } catch (error) {
        // Network error or other issue
        console.info('[Policy Builder] Network error fetching resources.');
      } finally {
        setIsLoadingResources(false);
      }
    };
    
    fetchResources();
  }, []);

  // Fetch PIP attributes and resource schema when resource/bouncer selected
  useEffect(() => {
    if (policyData.resourceId) {
      fetchMetadata();
    }
  }, [policyData.resourceId]);

  const fetchMetadata = async () => {
    setIsLoadingMetadata(true);
    setIsLoadingSuggestions(true);
    try {
      // Get auth token from SecureStorage
      const token = SecureStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      // Fetch resource schema
      const schemaResponse = await fetch(`${baseUrl}/resources/${policyData.resourceId}/schema`, { headers });
      const schemaContentType = schemaResponse.headers.get('content-type');
      
      if (schemaResponse.ok && schemaContentType?.includes('application/json')) {
        const schema = await schemaResponse.json();
        setResourceSchema(schema);
      }

      // Fetch PIP attributes
      const pipsResponse = await fetch(`${baseUrl}/pip/attributes`, { headers });
      const pipsContentType = pipsResponse.headers.get('content-type');
      
      if (pipsResponse.ok && pipsContentType?.includes('application/json')) {
        const attributes = await pipsResponse.json();
        setPipAttributes(attributes);
      }

      // Fetch smart suggestions based on resource
      const suggestionsResponse = await fetch(`${baseUrl}/resources/${policyData.resourceId}/smart-suggestions`, { headers });
      const suggestionsContentType = suggestionsResponse.headers.get('content-type');
      
      if (suggestionsResponse.ok && suggestionsContentType?.includes('application/json')) {
        const suggestionsData = await suggestionsResponse.json();
        setSmartSuggestions(suggestionsData.suggestions || []);
      }
    } catch (error) {
      // Fail silently - metadata is optional
      console.info('[Policy Builder] Metadata features unavailable. Ensure backend is running and you are logged in.');
    } finally {
      setIsLoadingMetadata(false);
      setIsLoadingSuggestions(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Generate Rego and move to preview
      generateRegoCode();
      onNext();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addCondition = () => {
    const newCondition: PolicyCondition = {
      id: `condition-${Date.now()}`,
      attribute: '',
      operator: 'equals',
      value: '',
      enabled: true
    };
    setConditions([...conditions, newCondition]);
  };

  const addManualAttribute = () => {
    const trimmedInput = manualAttributeInput.trim();
    if (trimmedInput && !selectedAttributes.includes(trimmedInput)) {
      setSelectedAttributes([...selectedAttributes, trimmedInput]);
      setManualAttributeInput('');
      toast({
        title: "Attribute Added",
        description: `Added "${trimmedInput}" to required attributes.`,
      });
    } else if (selectedAttributes.includes(trimmedInput)) {
      toast({
        title: "Already Added",
        description: "This attribute is already in the list.",
        variant: "destructive",
      });
    }
  };

  const removeAttribute = (attr: string) => {
    setSelectedAttributes(selectedAttributes.filter(a => a !== attr));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof PolicyCondition, value: any) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const applySuggestion = useCallback((suggestion: SmartSuggestion) => {
    if (suggestion.type === 'condition' && suggestion.implementation) {
      const newCondition: PolicyCondition = {
        id: `condition-${Date.now()}`,
        attribute: suggestion.implementation.attribute,
        operator: suggestion.implementation.operator,
        value: suggestion.implementation.value,
        enabled: true
      };
      setConditions([...conditions, newCondition]);
      
      toast({
        title: "Suggestion Applied",
        description: `Added: ${suggestion.title}`,
      });
    } else if (suggestion.type === 'attribute' && suggestion.implementation) {
      if (!selectedAttributes.includes(suggestion.implementation.name)) {
        setSelectedAttributes([...selectedAttributes, suggestion.implementation.name]);
        toast({
          title: "Attribute Added",
          description: `Added attribute: ${suggestion.implementation.name}`,
        });
      }
    } else if (suggestion.type === 'effect' && suggestion.implementation) {
      setEffect(suggestion.implementation.effect);
      toast({
        title: "Effect Changed",
        description: `Changed effect to: ${suggestion.implementation.effect}`,
      });
    }
  }, [conditions, selectedAttributes, toast]);

  const handleResourceSelect = (resourceId: string) => {
    const resource = availableResources.find(r => r.id.toString() === resourceId);
    if (resource) {
      setSelectedResource(resource);
      
      // Update policy data with resource ID and bouncer ID
      // Bouncer is linked to the resource - we'll use the resource's PEP
      // For now, we'll derive bouncerId from resource (in real system, resource.pep_id or similar)
      setPolicyData({
        ...policyData,
        resourceId: resourceId,
        bouncerId: resource.pep_id || `bouncer-${resourceId}` // Use pep_id if available, otherwise derive
      });
    }
  };

  const generateRegoCode = () => {
    // Generate Rego code from visual configuration
    let rego = `package controlcore.${policyName.replace(/\s+/g, '_').toLowerCase() || 'policy'}

import rego.v1

# Policy: ${policyName}
# Description: ${policyDescription}
# Resource: ${policyData.resourceId}
# Bouncer: ${policyData.bouncerId}

default ${effect} = false

${effect} {
  # Resource binding
  input.resource_id == "${policyData.resourceId}"
  
  # Bouncer binding
  input.bouncer_id == "${policyData.bouncerId}"
  
`;

    // Add attribute checks
    if (selectedAttributes.length > 0) {
      rego += `  # Attribute checks\n`;
      selectedAttributes.forEach(attr => {
        rego += `  input.${attr}\n`;
      });
      rego += `\n`;
    }

    // Add conditions
    if (conditions.length > 0) {
      rego += `  # Conditions\n`;
      conditions.forEach((condition, idx) => {
        if (condition.attribute && condition.value) {
          switch (condition.operator) {
            case 'equals':
              rego += `  input.${condition.attribute} == "${condition.value}"\n`;
              break;
            case 'not_equals':
              rego += `  input.${condition.attribute} != "${condition.value}"\n`;
              break;
            case 'contains':
              rego += `  contains(input.${condition.attribute}, "${condition.value}")\n`;
              break;
            case 'in':
              rego += `  input.${condition.attribute} in [${condition.value.split(',').map(v => `"${v.trim()}"`).join(', ')}]\n`;
              break;
            default:
              rego += `  input.${condition.attribute} == "${condition.value}"\n`;
          }
        }
      });
    }

    rego += `}\n`;

    setPolicyData({ ...policyData, regoCode: rego });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Control Basics
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Control Basics</h3>
              <p className="text-muted-foreground">
                Select the resource to protect and name your control
              </p>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Authentication Required Alert */}
              {!SecureStorage.getItem('access_token') && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Authentication Required:</strong> You must be logged in to create policies. 
                    <br />
                    Please log in to access resources and create controls.
                  </AlertDescription>
                </Alert>
              )}

              {/* Resource Selection */}
              <div className="space-y-3">
                <Label htmlFor="resource-select" className="text-sm font-medium block">
                  Protected Resource *
                </Label>
                <Select 
                  value={policyData.resourceId} 
                  onValueChange={handleResourceSelect}
                  disabled={isLoadingResources || !SecureStorage.getItem('access_token')}
                >
                  <SelectTrigger id="resource-select" className="w-full">
                    <SelectValue placeholder={
                      !SecureStorage.getItem('access_token') ? "Please log in to select a resource" :
                      isLoadingResources ? "Loading resources..." : 
                      "Select a resource to protect..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableResources.map(resource => (
                      <SelectItem key={resource.id} value={resource.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          <span className="font-medium">{resource.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {resource.url}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                    {availableResources.length === 0 && !isLoadingResources && SecureStorage.getItem('access_token') && (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No resources available. Add resources in Settings.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the resource this control will protect. The bouncer is automatically linked to the resource.
                </p>
              </div>

              {/* Show bouncer info once resource is selected */}
              {policyData.resourceId && selectedResource && (
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong>Resource:</strong> {selectedResource.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <strong>Bouncer:</strong> {selectedResource.bouncer_name || `Bouncer for ${selectedResource.name}`}
                      </div>
                      <div className="text-xs mt-2">
                        This bouncer is deployed as a {selectedResource.deployment_type || 'sidecar'} on {selectedResource.name}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Control Name */}
              <div className="space-y-3">
                <Label htmlFor="policy-name" className="text-sm font-medium block">
                  Control Name *
                </Label>
                <Input
                  id="policy-name"
                  placeholder="e.g., Admin API Access"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  A clear, descriptive name for this control
                </p>
              </div>

              {/* Control Description */}
              <div className="space-y-3">
                <Label htmlFor="policy-description" className="text-sm font-medium block">
                  Description
                </Label>
                {!isDescriptionExpanded ? (
                  <Input
                    id="policy-description"
                    placeholder="e.g., Allows administrators to access all API endpoints"
                    value={policyDescription}
                    onChange={(e) => setPolicyDescription(e.target.value)}
                    onFocus={() => setIsDescriptionExpanded(true)}
                    className="w-full cursor-pointer"
                    readOnly
                  />
                ) : (
                  <Textarea
                    id="policy-description"
                    placeholder="e.g., Allows administrators to access all API endpoints"
                    value={policyDescription}
                    onChange={(e) => setPolicyDescription(e.target.value)}
                    onBlur={() => {
                      // Only collapse if description is short enough for single line
                      if (policyDescription.length <= 50 && !policyDescription.includes('\n')) {
                        setIsDescriptionExpanded(false);
                      }
                    }}
                    className="w-full min-h-[80px] resize-none"
                    maxLength={1000}
                    rows={3}
                  />
                )}
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    What does this control do?
                  </p>
                  {isDescriptionExpanded && (
                    <p className="text-xs text-muted-foreground">
                      {policyDescription.length}/1000 characters
                    </p>
                  )}
                </div>
                {!isDescriptionExpanded && policyDescription.length > 50 && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(true)}
                    className="text-xs text-primary hover:text-primary/80 underline"
                  >
                    Click to expand and edit full description
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        // Who Can Access (Access Rules)
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Who Can Access?</h3>
              <p className="text-muted-foreground">
                Select user attributes that determine access
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              {/* PIP Attributes */}
              {pipAttributes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Available User Attributes</CardTitle>
                    <CardDescription>From connected Policy Information Points (PIPs)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pipAttributes.map((attr) => (
                      <div key={attr.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={attr.name}
                          checked={selectedAttributes.includes(attr.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAttributes([...selectedAttributes, attr.name]);
                            } else {
                              setSelectedAttributes(selectedAttributes.filter(a => a !== attr.name));
                            }
                          }}
                        />
                        <Label htmlFor={attr.name} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{attr.name}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">{attr.type}</Badge>
                              <Badge variant="secondary" className="text-xs">{attr.source}</Badge>
                            </div>
                          </div>
                          {attr.description && (
                            <p className="text-xs text-muted-foreground mt-1">{attr.description}</p>
                          )}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Resource Schema */}
              {resourceSchema && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resource Information</CardTitle>
                    <CardDescription>Learned from {resourceSchema.resource_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <strong>Available Actions:</strong>
                        <div className="flex gap-1">
                          {resourceSchema.available_actions.map(action => (
                            <Badge key={action} variant="outline" className="text-xs">{action}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <strong>Classification:</strong> {resourceSchema.data_classification}
                      </div>
                      <div>
                        <strong>Auth Required:</strong> {resourceSchema.authentication_required ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isLoadingMetadata && (
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Loading metadata...</p>
                </div>
              )}

              {!isLoadingMetadata && pipAttributes.length === 0 && !resourceSchema && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No PIP metadata available. Connect PIPs in Settings to enable intelligent suggestions, or add attributes manually below.
                  </AlertDescription>
                </Alert>
              )}

              {/* Manual Attribute Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add Custom Attributes</CardTitle>
                  <CardDescription>Manually specify required user attributes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., user.role, user.department, user.level"
                      value={manualAttributeInput}
                      onChange={(e) => setManualAttributeInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addManualAttribute();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button 
                      onClick={addManualAttribute}
                      disabled={!manualAttributeInput.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {/* Display Selected Attributes */}
                  {selectedAttributes.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Required Attributes:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedAttributes.map((attr) => (
                          <Badge 
                            key={attr} 
                            variant="secondary" 
                            className="px-3 py-1 flex items-center gap-2"
                          >
                            {attr}
                            <button
                              onClick={() => removeAttribute(attr)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAttributes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No attributes added yet. Add attributes that users must have to access this resource.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Smart Suggestions for Attributes */}
              {smartSuggestions.length > 0 && !isLoadingSuggestions && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Smart Suggestions for Attributes
                    </CardTitle>
                    <CardDescription>Recommended attributes based on resource type</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {smartSuggestions
                      .filter(s => s.type === 'attribute')
                      .slice(0, 3)
                      .map((suggestion, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border">
                          <Badge variant={
                            suggestion.priority === 'high' ? 'destructive' : 
                            suggestion.priority === 'medium' ? 'default' : 'outline'
                          }>
                            {suggestion.priority}
                          </Badge>
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{suggestion.title}</h5>
                            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                            <p className="text-xs text-blue-600 mt-1">💡 {suggestion.reason}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => applySuggestion(suggestion)}
                          >
                            Apply
                          </Button>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 3:
        // Conditions (When should this apply?)
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">When Should This Apply?</h3>
              <p className="text-muted-foreground">
                Add conditions to control when this control is enforced
              </p>
            </div>

            <div className="space-y-4 max-w-3xl mx-auto">
              {conditions.map((condition) => (
                <Card key={condition.id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4">
                        <Label className="text-xs text-muted-foreground">Attribute</Label>
                        <Select
                          value={condition.attribute}
                          onValueChange={(value) => updateCondition(condition.id, 'attribute', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select attribute" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user.role">User Role</SelectItem>
                            <SelectItem value="user.department">Department</SelectItem>
                            <SelectItem value="user.clearance_level">Clearance Level</SelectItem>
                            <SelectItem value="time.hour">Time of Day</SelectItem>
                            <SelectItem value="time.day_of_week">Day of Week</SelectItem>
                            <SelectItem value="location.country">Country</SelectItem>
                            <SelectItem value="location.ip_range">IP Range</SelectItem>
                            <SelectItem value="resource.type">Resource Type</SelectItem>
                            <SelectItem value="resource.classification">Classification</SelectItem>
                            <SelectItem value="action">Action</SelectItem>
                            {/* Add PIP attributes */}
                            {pipAttributes.map(attr => (
                              <SelectItem key={attr.name} value={attr.name}>
                                {attr.name} ({attr.source})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-3">
                        <Label className="text-xs text-muted-foreground">Operator</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => updateCondition(condition.id, 'operator', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="in">In List</SelectItem>
                            <SelectItem value="not_in">Not In List</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="starts_with">Starts With</SelectItem>
                            <SelectItem value="ends_with">Ends With</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="regex">Matches Regex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-4">
                        <Label className="text-xs text-muted-foreground">Value</Label>
                        <Input
                          placeholder="Value"
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                        />
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(condition.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                className="w-full"
                onClick={addCondition}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>

              {conditions.length === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No conditions added. Policy will apply to all requests matching the resource and bouncer.
                  </AlertDescription>
                </Alert>
              )}

              {/* Smart Suggestions for Conditions */}
              {smartSuggestions.length > 0 && !isLoadingSuggestions && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Smart Condition Suggestions
                    </CardTitle>
                    <CardDescription>
                      {resourceSchema ? `Recommended for ${resourceSchema.resource_type} (${resourceSchema.data_classification})` : 'Recommended conditions'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {smartSuggestions
                      .filter(s => s.type === 'condition')
                      .slice(0, 5)
                      .map((suggestion, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border">
                          <Badge variant={
                            suggestion.priority === 'high' ? 'destructive' : 
                            suggestion.priority === 'medium' ? 'default' : 'outline'
                          }>
                            {suggestion.priority}
                          </Badge>
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{suggestion.title}</h5>
                            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                            <p className="text-xs text-blue-600 mt-1">💡 {suggestion.reason}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => applySuggestion(suggestion)}
                          >
                            Apply
                          </Button>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 4:
        // Effect (What should happen?)
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">What Should Happen?</h3>
              <p className="text-muted-foreground">
                Choose the action when conditions are met
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              <RadioGroup value={effect} onValueChange={(value: any) => setEffect(value)}>
                <Card className={`cursor-pointer transition-all ${effect === 'allow' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value="allow" id="effect-allow" />
                      <div className="flex-1">
                        <Label htmlFor="effect-allow" className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-lg">Allow Access</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Grant access when conditions are met. Request proceeds to the resource.
                          </p>
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer transition-all ${effect === 'deny' ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value="deny" id="effect-deny" />
                      <div className="flex-1">
                        <Label htmlFor="effect-deny" className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="font-semibold text-lg">Deny Access</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Block access when conditions are met. Request is rejected with 403 Forbidden.
                          </p>
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer transition-all ${effect === 'mask' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value="mask" id="effect-mask" />
                      <div className="flex-1">
                        <Label htmlFor="effect-mask" className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-lg">Mask/Filter Data</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Allow access but mask sensitive data in the response. Useful for PII protection.
                          </p>
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer transition-all ${effect === 'log' ? 'ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value="log" id="effect-log" />
                      <div className="flex-1">
                        <Label htmlFor="effect-log" className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-5 w-5 text-yellow-600" />
                            <span className="font-semibold text-lg">Log Only (Monitor)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Allow access but log the event for audit and monitoring purposes.
                          </p>
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </RadioGroup>

              {/* Masking Configuration */}
              {effect === 'mask' && (
                <Card className="mt-4 border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Masking Configuration
                    </CardTitle>
                    <CardDescription>Configure how data should be masked</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup 
                      value={maskingConfig.type} 
                      onValueChange={(value: any) => setMaskingConfig({...maskingConfig, type: value})}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="mask-all" />
                        <Label htmlFor="mask-all" className="cursor-pointer flex-1">
                          <div className="font-medium">Mask All Data</div>
                          <p className="text-xs text-muted-foreground">All sensitive fields will be masked</p>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fields" id="mask-fields" />
                        <Label htmlFor="mask-fields" className="cursor-pointer flex-1">
                          <div className="font-medium">Mask Specific Fields</div>
                          <p className="text-xs text-muted-foreground">Choose which fields to mask</p>
                        </Label>
                      </div>

                      {maskingConfig.type === 'fields' && (
                        <div className="ml-6 mt-2 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g., ssn, credit_card, email"
                              value={maskFieldInput}
                              onChange={(e) => setMaskFieldInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (maskFieldInput.trim()) {
                                    setMaskingConfig({
                                      ...maskingConfig,
                                      fields: [...maskingConfig.fields, maskFieldInput.trim()]
                                    });
                                    setMaskFieldInput('');
                                  }
                                }
                              }}
                            />
                            <Button 
                              size="sm"
                              onClick={() => {
                                if (maskFieldInput.trim()) {
                                  setMaskingConfig({
                                    ...maskingConfig,
                                    fields: [...maskingConfig.fields, maskFieldInput.trim()]
                                  });
                                  setMaskFieldInput('');
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {maskingConfig.fields.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {maskingConfig.fields.map((field, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {field}
                                  <button
                                    onClick={() => setMaskingConfig({
                                      ...maskingConfig,
                                      fields: maskingConfig.fields.filter((_, i) => i !== idx)
                                    })}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="last_n" id="mask-last-n" />
                        <Label htmlFor="mask-last-n" className="cursor-pointer flex-1">
                          <div className="font-medium">Mask Last N Characters</div>
                          <p className="text-xs text-muted-foreground">Show only last few characters (e.g., credit cards)</p>
                        </Label>
                      </div>

                      {maskingConfig.type === 'last_n' && (
                        <div className="ml-6 mt-2">
                          <Label className="text-xs">Number of visible characters</Label>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            value={maskingConfig.lastNChars}
                            onChange={(e) => setMaskingConfig({
                              ...maskingConfig,
                              lastNChars: parseInt(e.target.value) || 4
                            })}
                            className="w-32"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Example: **** **** **** {Array(maskingConfig.lastNChars).fill('X').join('')}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pattern" id="mask-pattern" />
                        <Label htmlFor="mask-pattern" className="cursor-pointer flex-1">
                          <div className="font-medium">Mask by Pattern/Regex</div>
                          <p className="text-xs text-muted-foreground">Use regex pattern for custom masking</p>
                        </Label>
                      </div>

                      {maskingConfig.type === 'pattern' && (
                        <div className="ml-6 mt-2">
                          <Label className="text-xs">Regex Pattern</Label>
                          <Input
                            placeholder="e.g., \d{3}-\d{2}-\d{4}"
                            value={maskingConfig.pattern}
                            onChange={(e) => setMaskingConfig({
                              ...maskingConfig,
                              pattern: e.target.value
                            })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Pattern will be used to identify and mask matching data
                          </p>
                        </div>
                      )}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Smart Suggestions for Effects */}
              {smartSuggestions.length > 0 && !isLoadingSuggestions && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Recommended Effects
                    </CardTitle>
                    <CardDescription>
                      {resourceSchema ? `Based on ${resourceSchema.resource_type} classification` : 'Effect recommendations'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {smartSuggestions
                      .filter(s => s.type === 'effect' || s.type === 'compliance')
                      .slice(0, 3)
                      .map((suggestion, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border">
                          <Badge variant={
                            suggestion.priority === 'high' ? 'destructive' : 
                            suggestion.priority === 'medium' ? 'default' : 'outline'
                          }>
                            {suggestion.priority}
                          </Badge>
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{suggestion.title}</h5>
                            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                            <p className="text-xs text-blue-600 mt-1">💡 {suggestion.reason}</p>
                          </div>
                          {suggestion.implementation && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => applySuggestion(suggestion)}
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 5:
        // Context & Actions
        return (
          <ContextManagementStep
            policyData={policyData}
            setPolicyData={setPolicyData}
          />
        );

      case 6:
        // Review
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Review & Deploy</h3>
              <p className="text-muted-foreground">
                Review your policy configuration
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Control Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <strong>Name:</strong> {policyName || '(Not set)'}
                  </div>
                  <div>
                    <strong>Description:</strong> {policyDescription || '(Not set)'}
                  </div>
                  <div>
                    <strong>Resource:</strong> {policyData.resourceId}
                  </div>
                  <div>
                    <strong>Bouncer:</strong> {policyData.bouncerId}
                  </div>
                  <div>
                    <strong>Effect:</strong> 
                    <Badge className="ml-2" variant={
                      effect === 'allow' ? 'default' :
                      effect === 'deny' ? 'destructive' :
                      effect === 'mask' ? 'secondary' : 'outline'
                    }>
                      {effect.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <strong>Conditions:</strong> {conditions.length} condition(s)
                    {conditions.length > 0 && (
                      <ul className="mt-2 space-y-1 ml-4">
                        {conditions.map(c => (
                          <li key={c.id} className="text-sm text-muted-foreground">
                            • {c.attribute} {c.operator} "{c.value}"
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {selectedAttributes.length > 0 && (
                    <div>
                      <strong>Required Attributes:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedAttributes.map(attr => (
                          <Badge key={attr} variant="outline" className="text-xs">{attr}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {effect === 'mask' && maskingConfig.type && (
                    <div>
                      <strong>Masking:</strong> 
                      <Badge className="ml-2" variant="secondary">
                        {maskingConfig.type === 'all' ? 'Mask All' :
                         maskingConfig.type === 'fields' ? `Mask ${maskingConfig.fields.length} Fields` :
                         maskingConfig.type === 'last_n' ? `Last ${maskingConfig.lastNChars} Chars` :
                         'Pattern-Based'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ready to deploy!</strong> This control will be created in Sandbox mode and synced to your GitHub repository.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Update policyData when local state changes
  useEffect(() => {
    setPolicyData({
      ...policyData,
      name: policyName,
      description: policyDescription,
      effect: effect,
      conditions: conditions
    });
  }, [policyName, policyDescription, effect, conditions]);

  // Re-analyze policy complexity when policy data changes
  useEffect(() => {
    const analysis = analyzePolicyComplexity(policyData);
    setPolicyComplexity(analysis);
  }, [policyData.conditions, policyData.regoCode]);

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return policyName.trim().length > 0 && policyData.resourceId.trim().length > 0;
      case 2:
        return true; // Attributes are optional
      case 3:
        return true; // Conditions are optional
      case 4:
        return effect !== null;
      case 5:
        return true; // Context is optional
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Progress Steps */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  currentStep === step.id 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : currentStep > step.id
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs mt-2 ${
                  currentStep === step.id ? 'font-semibold text-blue-600' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t flex-shrink-0 bg-background -mx-6 px-6 -mb-6 pb-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </div>
          
          {/* Show complexity warning if needed */}
          {(policyComplexity.level === 'medium' || policyComplexity.level === 'advanced') && (
            <AdvancedFeaturesWarning
              analysis={policyComplexity}
              onSwitchToCodeEditor={() => {
                if (onSwitchToCodeEditor) {
                  onSwitchToCodeEditor();
                } else {
                  toast({
                    title: "Code Editor Recommended",
                    description: "Use the 'Code Editor' tab above to access advanced Rego features.",
                  });
                }
              }}
              position="tooltip"
            />
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={!isStepValid()}
        >
          {currentStep === steps.length ? 'Generate & Preview' : 'Next'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

