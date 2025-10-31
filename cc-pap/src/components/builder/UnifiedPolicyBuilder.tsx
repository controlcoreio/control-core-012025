import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Code, 
  Wand2, 
  Shield, 
  Settings, 
  Play, 
  Save, 
  Eye, 
  Zap,
  ChevronRight,
  Target,
  Lock,
  Unlock,
  AlertCircle,
  FileCode,
  Info,
  Server
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { MonacoRegoEditor } from "@/components/editor/MonacoRegoEditor";
import { IntelligentPolicyBuilder } from "./IntelligentPolicyBuilder";
import { PolicyCodeEditor } from "./PolicyCodeEditor.tsx";
import { PolicyPreview } from "./PolicyPreview.tsx";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useUnsavedWorkRecovery } from "@/hooks/use-unsaved-work-recovery";
import { SecureStorage } from "@/utils/secureStorage";

interface UnifiedPolicyBuilderProps {
  mode?: 'create' | 'edit';
  resourceId?: string;
  policyId?: string;
  templateData?: Record<string, unknown>;
  open: boolean;
  onClose: () => void;
  onPolicyCreate?: (policyData: PolicyData) => void;
  onPolicyUpdate?: (policyData: PolicyData) => void;
  onboarding?: boolean;
}

interface PolicyData {
  name: string;
  description: string;
  resourceId: string;
  bouncerId: string;
  effect: 'allow' | 'deny' | 'mask' | 'log';
  conditions: PolicyCondition[];
  regoCode: string;
  status: 'draft' | 'active';
  folder?: 'drafts' | 'enabled' | 'disabled' | 'staging' | 'production';
  contextConfig?: any;
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

export function UnifiedPolicyBuilder({
  mode = 'create',
  resourceId,
  policyId,
  templateData,
  open,
  onClose,
  onPolicyCreate,
  onPolicyUpdate,
  onboarding = false
}: UnifiedPolicyBuilderProps) {
  const [activeTab, setActiveTab] = useState<'builder' | 'code' | 'preview'>('builder');
  const [policyData, setPolicyData] = useState<PolicyData>({
    name: '',
    description: '',
    resourceId: resourceId || '',
    bouncerId: '',
    effect: 'allow',
    conditions: [],
    regoCode: '',
    status: 'draft',
    folder: 'drafts'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [gitHubError, setGitHubError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<'draft' | 'sandbox' | 'staging' | 'production'>('sandbox');
  const [resourceName, setResourceName] = useState<string>('');
  const [bouncerName, setBouncerName] = useState<string>('');
  const [resourceMetadata, setResourceMetadata] = useState<any>(null);
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [templateLoadCounter, setTemplateLoadCounter] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Compute form validation state for button enablement
  const isFormValid = useMemo(() => {
    return (
      policyData.name.trim().length > 0 &&
      policyData.resourceId.trim().length > 0 &&
      policyData.bouncerId.trim().length > 0
    );
  }, [policyData.name, policyData.resourceId, policyData.bouncerId]);

  // Recovery for unsaved work
  const { hasUnsavedWork, restoreWork, discardWork } = useUnsavedWorkRecovery<PolicyData>({
    storageKey: 'autosave_policy_builder',
  }, (data) => {
    setPolicyData(data);
    toast({
      title: "Work Restored",
      description: "Your unsaved policy has been restored.",
    });
  });

  // Auto-save functionality
  const { lastSaved, isSaving, clearAutoSave } = useAutoSave(
    policyData,
    async (data) => {
      console.log('Auto-saving policy builder state...', data);
    },
    {
      storageKey: 'autosave_policy_builder',
      enabled: open && mode === 'create', // Only auto-save in create mode when dialog is open
      interval: 30000, // 30 seconds
    }
  );

  // Reset states when modal closes
  useEffect(() => {
    if (!open) {
      setIsLoadingTemplate(false);
      // Reset to initial state when closing
      if (mode === 'create') {
        setPolicyData({
          name: '',
          description: '',
          resourceId: resourceId || '',
          bouncerId: '',
          effect: 'allow',
          conditions: [],
          regoCode: '',
          status: 'draft',
          folder: 'drafts'
        });
      }
    }
  }, [open, mode, resourceId]);

  // Load template data when provided - PERMANENT FIX for template loading
  useEffect(() => {
    // Reset template loading state when dialog is opened
    if (open && !templateData) {
      setIsLoadingTemplate(false);
    }
    
    if (open && templateData && mode === 'create') {
      console.log('[UnifiedPolicyBuilder] Starting template load:', templateData);
      setIsLoadingTemplate(true);
      
      // Use setTimeout to ensure state updates are batched properly
      // This prevents the race condition where the builder renders before data is set
      setTimeout(() => {
        try {
          // Convert template metadata conditions to PolicyCondition format
          const templateConditions: PolicyCondition[] = [];
          if (templateData.metadata?.conditions && Array.isArray(templateData.metadata.conditions)) {
            templateData.metadata.conditions.forEach((condition: any, index: number) => {
              // Determine operator based on condition type and example values
              let operator = '==';
              let value = '';
              
              if (condition.type === 'array' || (condition.example_values && condition.example_values.length > 1)) {
                operator = 'in';
                value = condition.example_values ? condition.example_values.join(',') : '';
              } else if (condition.type === 'boolean') {
                operator = '==';
                value = 'true';
              } else if (condition.type === 'number' || condition.type === 'integer') {
                operator = '>=';
                value = condition.example_values?.[0]?.toString() || '0';
              } else if (condition.example_values && condition.example_values.length > 0) {
                operator = '==';
                value = condition.example_values[0].toString();
              }
              
              templateConditions.push({
                id: `condition-${index + 1}`,
                attribute: condition.name || `attribute_${index}`,
                operator: operator,
                value: value,
                enabled: condition.required !== false // Enable by default if required is not explicitly false
              });
            });
          }
          
          // Extract effect from metadata
          let templateEffect: 'allow' | 'deny' | 'mask' | 'log' = 'allow';
          if (templateData.metadata?.effect) {
            templateEffect = templateData.metadata.effect;
          } else if (templateData.effect) {
            templateEffect = templateData.effect;
          }
          
          const newPolicyData = {
            name: templateData.name || '',
            description: templateData.description || '',
            resourceId: resourceId || '',
            bouncerId: '',
            effect: templateEffect,
            conditions: templateConditions,
            regoCode: templateData.template_content || '',
            status: 'draft' as const,
            folder: 'drafts' as const
          };
          
          console.log('[UnifiedPolicyBuilder] Setting policyData to:', newPolicyData);
          console.log('[UnifiedPolicyBuilder] Template data was:', templateData);
          
          // Set policy data and wait for next tick to set loading to false
          setPolicyData(newPolicyData);
          
          // Use another setTimeout to ensure React has processed the setPolicyData update
          setTimeout(() => {
            setIsLoadingTemplate(false);
            setTemplateLoadCounter(prev => prev + 1); // Increment to force re-render
            toast({
              title: "Template Loaded",
              description: `Loaded template "${templateData.name}". Review and customize as needed.`,
            });
          }, 50);
          
        } catch (error) {
          console.error('[UnifiedPolicyBuilder] Error loading template:', error);
          setIsLoadingTemplate(false);
          toast({
            title: "Template Load Error",
            description: "Failed to load template data. Please try again.",
            variant: "destructive"
          });
        }
      }, 100); // Small delay to ensure proper state initialization
    }
  }, [open, templateData, mode, resourceId]);

  // Fetch policy data when in edit mode
  useEffect(() => {
    const fetchPolicyData = async () => {
      if (mode === 'edit' && policyId) {
        setIsLoadingPolicy(true);
        try {
          const token = SecureStorage.getItem('access_token');
          const headers: HeadersInit = {
            'Content-Type': 'application/json'
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          const response = await fetch(`${baseUrl}/policies/${policyId}`, { headers });
          
          const contentType = response.headers.get('content-type');
          if (response.ok && contentType?.includes('application/json')) {
            const policy = await response.json();
            setPolicyData({
              name: policy.name || '',
              description: policy.description || '',
              resourceId: policy.resource_id || resourceId || '',
              bouncerId: policy.bouncer_id || '',
              effect: policy.effect || 'allow',
              conditions: policy.conditions || [],
              regoCode: policy.rego_code || '',
              status: policy.status || 'draft',
              folder: policy.folder || 'drafts'
            });
            
            toast({
              title: "Policy Loaded",
              description: `Loaded "${policy.name}" for editing`,
            });
          } else {
            toast({
              title: "Failed to Load Policy",
              description: "Could not load the policy for editing. Check authentication.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.info('[Policy Builder] Failed to fetch policy:', error);
          toast({
            title: "Error",
            description: "Failed to fetch policy data. Ensure you are logged in.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingPolicy(false);
        }
      }
    };
    
    if (open && mode === 'edit') {
      fetchPolicyData();
    }
  }, [mode, policyId, open]);

  // Fetch resource and bouncer names
  useEffect(() => {
    const fetchResourceAndBouncerInfo = async () => {
      const token = SecureStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      if (policyData.resourceId) {
        try {
          const resResponse = await fetch(`${baseUrl}/resources/${policyData.resourceId}`, { headers });
          const contentType = resResponse.headers.get('content-type');
          
          if (resResponse.ok && contentType?.includes('application/json')) {
            const resData = await resResponse.json();
            setResourceName(resData.name || `Resource #${policyData.resourceId}`);
            setResourceMetadata(resData);
          } else {
            setResourceName(`Resource #${policyData.resourceId}`);
          }
        } catch (error) {
          console.info('[Policy Builder] Could not fetch resource info');
          setResourceName(`Resource #${policyData.resourceId}`);
        }
      }
      
      if (policyData.bouncerId) {
        try {
          const pepResponse = await fetch(`${baseUrl}/peps/${policyData.bouncerId}`, { headers });
          const contentType = pepResponse.headers.get('content-type');
          
          if (pepResponse.ok && contentType?.includes('application/json')) {
            const pepData = await pepResponse.json();
            setBouncerName(pepData.name || `Bouncer #${policyData.bouncerId}`);
          } else {
            setBouncerName(`Bouncer #${policyData.bouncerId}`);
          }
        } catch (error) {
          console.info('[Policy Builder] Could not fetch bouncer info');
          setBouncerName(`Bouncer #${policyData.bouncerId}`);
        }
      }
    };
    
    if (policyData.resourceId || policyData.bouncerId) {
      fetchResourceAndBouncerInfo();
    }
  }, [policyData.resourceId, policyData.bouncerId]);

  // Check GitHub connection on mount
  useEffect(() => {
    const checkGitHubConnection = async () => {
      try {
        // Get authentication token
        const token = SecureStorage.getItem('access_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/settings/github-config`, {
          headers
        });
        
        // Check if we got HTML instead of JSON (backend not running)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.info('[Policy Builder] Backend API not responding. Ensure Control Core backend is running on port 8000.');
          setGitHubError(true);
          setErrorMessage('Control Core backend is not running. Start with: cd cc-pap-api && uvicorn app.main:app --reload');
          return;
        }
        
        if (response.ok) {
          const config = await response.json();
          
          if (config.connection_status !== 'connected') {
            setGitHubError(true);
            setErrorMessage('GitHub repository is not connected. Click "Configure Now" to set up your policy repository.');
          } else {
            // Connected successfully - clear any previous errors
            setGitHubError(false);
            setErrorMessage('');
          }
        } else {
          setGitHubError(true);
          setErrorMessage('GitHub repository configuration is missing. Configure in Settings → Controls Repository.');
        }
      } catch (error) {
        console.info('[Policy Builder] Could not reach backend. Ensure Control Core backend is running.');
        setGitHubError(true);
        setErrorMessage('Cannot connect to Control Core backend. Start with: cd cc-pap-api && source venv/bin/activate && uvicorn app.main:app --reload');
      }
    };
    
    if (open) {
      checkGitHubConnection();
    }
  }, [open]);

  // Smart Intelligence Functions
  const analyzePolicy = async (data: PolicyData) => {
    setIsGenerating(true);
    try {
      // Simulate AI analysis
      const analysis = {
        complexity: data.conditions.length > 3 ? 'high' : 'low',
        suggestions: [
          {
            type: 'security',
            title: 'Add authentication check',
            description: 'Consider adding user authentication validation',
            priority: 'high'
          },
          {
            type: 'performance',
            title: 'Optimize conditions',
            description: 'Combine similar conditions for better performance',
            priority: 'medium'
          }
        ],
        compliance: ['SOC2', 'ISO27001'],
        riskLevel: data.effect === 'deny' ? 'low' : 'medium'
      };
      
      setSmartSuggestions(analysis.suggestions);
      return analysis;
    } catch (error) {
      console.error('Policy analysis failed:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePolicyCode = async (data: PolicyData) => {
    setIsGenerating(true);
    try {
      // Simulate AI code generation
      const regoCode = `package controlcore.${data.name.replace(/\s+/g, "_").toLowerCase()}

# Policy: ${data.name}
# Description: ${data.description}

default allow = false

allow {
  # Add your conditions here
  input.user.authenticated
  input.resource.type == "${data.resourceId}"
}

# Example conditions
# allow {
#   input.user.role == "admin"
#   input.action == "read"
# }`;
      
      setPolicyData(prev => ({ ...prev, regoCode }));
      return regoCode;
    } catch (error) {
      console.error('Code generation failed:', error);
      return '';
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!policyData.name.trim()) {
      toast({
        title: "Control Name Required",
        description: "Please enter a control name before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!policyData.resourceId || !policyData.bouncerId) {
      toast({
        title: "Resource and Bouncer Required",
        description: "Please select a resource and bouncer before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get auth token from SecureStorage
      const token = SecureStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Generate Rego code if not already present
      let regoCode = policyData.regoCode;
      if (!regoCode) {
        regoCode = await generatePolicyCode(policyData);
      }

      const draftPolicy = {
        name: policyData.name,
        description: policyData.description,
        resource_id: policyData.resourceId,
        bouncer_id: policyData.bouncerId,
        rego_code: regoCode,
        effect: policyData.effect,
        status: 'draft',
        folder: 'drafts',
      };

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/policies/drafts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(draftPolicy)
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Backend API not available');
        }
        throw new Error('Failed to save draft');
      }

      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const savedPolicy = await response.json();

      clearAutoSave(); // Clear auto-save after successful draft save
      discardWork(); // Clear unsaved work recovery
      
      toast({
        title: "Draft Saved Successfully",
        description: `Control "${policyData.name}" has been saved as draft in GitHub.`,
      });

      // Close modal and refresh policies list
      onClose();
      
      // Optionally notify parent to refresh
      if (onPolicyCreate) {
        onPolicyCreate(savedPolicy);
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error && error.message === 'Backend API not available' 
          ? "Control Core backend is not running. Please start the backend server."
          : error instanceof Error ? error.message : "Failed to save control draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeployClick = () => {
    // Validate before opening modal
    if (!policyData.name.trim()) {
      toast({
        title: "Control Name Required",
        description: "Please enter a control name before deploying.",
        variant: "destructive",
      });
      return;
    }

    if (!policyData.resourceId || !policyData.bouncerId) {
      toast({
        title: "Resource and Bouncer Required",
        description: "Please select a resource and bouncer before deploying.",
        variant: "destructive",
      });
      return;
    }

    // Open deployment options modal
    setShowDeployModal(true);
  };

  const handleDeploy = async () => {
    setIsGenerating(true);
    setShowDeployModal(false);

    try {
      // Get auth token from SecureStorage
      const token = SecureStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Generate Rego code
      const generatedCode = await generatePolicyCode(policyData);

      const finalPolicyData = {
        name: policyData.name,
        description: policyData.description,
        resource_id: policyData.resourceId,
        bouncer_id: policyData.bouncerId,
        rego_code: generatedCode,
        effect: policyData.effect,
        status: selectedEnvironment === 'draft' ? 'draft' : 'active',
        folder: selectedEnvironment === 'draft' ? 'drafts' : 'enabled',
      };

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const endpoint = selectedEnvironment === 'draft' ? `${baseUrl}/policies/drafts` : `${baseUrl}/policies`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(finalPolicyData)
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Backend API not available');
        }
        throw new Error('Failed to deploy');
      }

      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const savedPolicy = await response.json();

      clearAutoSave();
      discardWork();
      
      toast({
        title: "Control Deployed Successfully",
        description: `Control "${policyData.name}" deployed to ${selectedEnvironment}.`,
      });

      onClose();
      
      if (onPolicyCreate) {
        onPolicyCreate(savedPolicy);
      }
    } catch (error) {
      console.error('Deploy error:', error);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error && error.message === 'Backend API not available' 
          ? "Control Core backend is not running. Please start the backend server."
          : error instanceof Error ? error.message : "Failed to deploy control. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestPolicy = async () => {
    // Validate
    if (!policyData.name.trim()) {
      toast({
        title: "Control Name Required",
        description: "Please enter a control name before testing.",
        variant: "destructive",
      });
      return;
    }

    if (!policyData.resourceId || !policyData.bouncerId) {
      toast({
        title: "Resource and Bouncer Required",
        description: "Please select a resource and bouncer before testing.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get auth token from SecureStorage
      const token = SecureStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Generate Rego code if not already present
      let regoCode = policyData.regoCode;
      if (!regoCode) {
        regoCode = await generatePolicyCode(policyData);
      }

      // Save as draft first
      const draftPolicy = {
        ...policyData,
        regoCode,
        status: 'draft' as const,
        folder: 'drafts' as const,
      };

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/policies/drafts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(draftPolicy)
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType?.includes('application/json')) {
        throw new Error('Failed to save draft for testing');
      }

      const savedPolicy = await response.json();

      toast({
        title: "Draft Saved for Testing",
        description: "Control saved. Redirecting to test console...",
      });

      // Navigate to test page with policy data
      setTimeout(() => {
        navigate('/test', { 
          state: { 
            policy: savedPolicy,
            fromBuilder: true 
          } 
        });
      }, 500);

    } catch (error) {
      console.error('Test policy error:', error);
      toast({
        title: "Test Setup Failed",
        description: error instanceof Error ? error.message : "Failed to prepare control for testing. Ensure you are logged in.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                {mode === 'edit' ? 'Edit Control' : 'Create New Control'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'edit' ? 'Modify your control configuration' : 'Create and deploy a new access control'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Resource & Bouncer Info Banner */}
        {policyData.resourceId && policyData.bouncerId && (
          <Alert className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">
              Control Target
            </AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div>
                  <Badge variant="outline" className="bg-white dark:bg-gray-800">
                    <Target className="h-3 w-3 mr-1" />
                    Resource: {resourceName || policyData.resourceId}
                  </Badge>
                </div>
                <div>
                  <Badge variant="outline" className="bg-white dark:bg-gray-800">
                    <Server className="h-3 w-3 mr-1" />
                    Bouncer/PEP: {bouncerName || policyData.bouncerId}
                  </Badge>
                </div>
              </div>
              <p className="text-xs mt-2">
                This control will be enforced by the {bouncerName || 'bouncer'} when accessing {resourceName || 'the resource'}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* GitHub Connection Error Banner */}
        {gitHubError && (
          <Alert variant="destructive" className="flex-shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>GitHub Repository Not Connected</AlertTitle>
            <AlertDescription>
              {errorMessage}
              <Link to="/settings/controls-repository">
                <Button variant="link" className="h-auto p-0 ml-2">
                  Configure Now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Unsaved Work Recovery Banner */}
        {hasUnsavedWork && (
          <Alert className="flex-shrink-0">
            <Info className="h-4 w-4" />
            <AlertTitle>Unsaved Work Found</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>You have unsaved control work from a previous session.</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={discardWork}>
                  Discard
                </Button>
                <Button size="sm" onClick={restoreWork}>
                  Restore
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-save indicator */}
        {lastSaved && open && (
          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground flex-shrink-0">
            {isSaving ? 'Saving...' : `Last auto-saved: ${lastSaved.toLocaleTimeString()}`}
          </div>
        )}

        {/* Loading state for edit mode or template loading */}
        {isLoadingPolicy || isLoadingTemplate ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-sm font-medium">
                {isLoadingPolicy ? 'Loading policy data...' : 'Loading template data...'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden min-h-0">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'builder' | 'code' | 'preview')} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-muted flex-shrink-0">
                <TabsTrigger 
                  value="builder" 
                  className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-semibold"
                >
                  <Target className="h-4 w-4" />
                  Control Builder
                </TabsTrigger>
                <TabsTrigger 
                  value="code" 
                  className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-semibold"
                >
                  <Code className="h-4 w-4" />
                  Code Editor
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-semibold"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden min-h-0">
                <TabsContent value="builder" className="h-full m-0">
                  <IntelligentPolicyBuilder
                    key={`builder-${templateLoadCounter}-${policyData.name}-${policyData.description.substring(0, 20)}`}
                    policyData={policyData}
                    setPolicyData={setPolicyData}
                    onNext={() => setActiveTab('preview')}
                    onSwitchToCodeEditor={() => setActiveTab('code')}
                  />
                </TabsContent>

                <TabsContent value="code" className="h-full m-0">
                  <PolicyCodeEditor
                    key={`code-${templateLoadCounter}-${policyData.name}-${policyData.regoCode?.substring(0, 30)}`}
                    policyData={policyData}
                    setPolicyData={setPolicyData}
                    onNext={() => setActiveTab('preview')}
                  />
                </TabsContent>

                <TabsContent value="preview" className="h-full m-0">
                  <PolicyPreview
                    policyData={policyData}
                    smartSuggestions={smartSuggestions}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t pt-4 flex-shrink-0 bg-background space-y-2">
          {/* Validation Warning */}
          {!isFormValid && !isLoadingPolicy && !isLoadingTemplate && (
            <Alert variant="default" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>Required fields missing:</strong> 
                {!policyData.name.trim() && <span className="ml-2">• Control Name</span>}
                {!policyData.resourceId.trim() && <span className="ml-2">• Resource</span>}
                {!policyData.bouncerId.trim() && <span className="ml-2">• Bouncer/PEP</span>}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {activeTab !== 'builder' && (
                <Button variant="outline" onClick={() => setActiveTab('builder')}>
                  <Target className="h-4 w-4 mr-2" />
                  Back to Builder
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleTestPolicy}
              disabled={!isFormValid || gitHubError || isGenerating}
            >
              <Play className="h-4 w-4 mr-2" />
              Test Control
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={!isFormValid || gitHubError || isGenerating}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={handleDeployClick}
              disabled={!isFormValid || gitHubError || isGenerating || isLoadingPolicy}
            >
              <Zap className="h-4 w-4 mr-2" />
              {isGenerating ? (mode === 'edit' ? 'Updating...' : 'Deploying...') : (mode === 'edit' ? 'Update Control' : 'Deploy Control')}
            </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Deployment Options Modal */}
    <Dialog open={showDeployModal} onOpenChange={setShowDeployModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Deploy Control: {policyData.name}
          </DialogTitle>
          <DialogDescription>
            Choose deployment environment and review recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Deployment Environment Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select Deployment Target</Label>
            
            <RadioGroup value={selectedEnvironment} onValueChange={(value: any) => setSelectedEnvironment(value)}>
              {/* Draft Option */}
              <Card className={`cursor-pointer transition-all ${selectedEnvironment === 'draft' ? 'ring-2 ring-gray-500 bg-gray-50 dark:bg-gray-900/20' : ''}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="draft" id="deploy-draft" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="deploy-draft" className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Save className="h-4 w-4 text-gray-600" />
                          <span className="font-semibold">Save as Draft</span>
                          <Badge variant="outline" className="text-xs bg-blue-50">Recommended</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Save to drafts folder for testing before deployment. Won't affect live systems.
                        </p>
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sandbox Option */}
              <Card className={`cursor-pointer transition-all ${selectedEnvironment === 'sandbox' ? 'ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="sandbox" id="deploy-sandbox" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="deploy-sandbox" className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Play className="h-4 w-4 text-yellow-600" />
                          <span className="font-semibold">Deploy to Sandbox</span>
                          <Badge variant="outline" className="text-xs">Default</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Deploy to sandbox environment for testing. Safe for initial deployment.
                        </p>
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Staging Option */}
              <Card className={`cursor-pointer transition-all ${selectedEnvironment === 'staging' ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="staging" id="deploy-staging" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="deploy-staging" className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold">Deploy to Staging</span>
                          <Badge variant="outline" className="text-xs bg-orange-50">Caution</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Deploy to staging for pre-production testing. Should be tested in sandbox first.
                        </p>
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Production Option */}
              <Card className={`cursor-pointer transition-all ${selectedEnvironment === 'production' ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="production" id="deploy-production" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="deploy-production" className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="font-semibold">Deploy to Production</span>
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Deploy to production. Must be tested in sandbox and staging first.
                        </p>
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Warnings and Recommendations */}
          {selectedEnvironment === 'draft' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended:</strong> Draft controls are saved but not enforced. Use /test page to simulate before deploying.
              </AlertDescription>
            </Alert>
          )}

          {selectedEnvironment === 'sandbox' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Safe Deployment:</strong> Sandbox is isolated from production. Test thoroughly before promoting.
              </AlertDescription>
            </Alert>
          )}

          {selectedEnvironment === 'staging' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Staging may affect pre-production systems. Ensure sandbox testing is complete.
              </AlertDescription>
            </Alert>
          )}

          {selectedEnvironment === 'production' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical Warning:</strong> Production deployment will affect live systems immediately. Requires:
                <ul className="list-disc list-inside mt-2 text-xs">
                  <li>Successful sandbox testing</li>
                  <li>Staging validation</li>
                  <li>Approval from authorized personnel</li>
                  <li>Rollback plan in place</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Deployment Path */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm">Deployment Path</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">Draft</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className={selectedEnvironment === 'sandbox' ? 'ring-2 ring-yellow-500' : ''}>Sandbox</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className={selectedEnvironment === 'staging' ? 'ring-2 ring-orange-500' : ''}>Staging</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className={selectedEnvironment === 'production' ? 'ring-2 ring-red-500' : ''}>Production</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Control Core recommends: Draft → Test → Sandbox → Staging → Production
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={() => setShowDeployModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeploy} disabled={isGenerating}>
            <Play className="h-4 w-4 mr-2" />
            {isGenerating ? 'Deploying...' : `Deploy to ${selectedEnvironment.charAt(0).toUpperCase() + selectedEnvironment.slice(1)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}
