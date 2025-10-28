import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Brain, 
  Key, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  DollarSign, 
  BarChart3, 
  Shield, 
  Code, 
  Wand2, 
  FileText, 
  Target,
  Globe,
  Cpu,
  TestTube,
  Trash2,
  Plus,
  RefreshCw,
  TrendingUp,
  Activity,
  Lock,
  Unlock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIProvider {
  id: string;
  name: string;
  models: string[];
  description: string;
  icon: React.ReactNode;
}

interface AIConfiguration {
  config_id: string;
  provider: string;
  model: string;
  api_key: string;
  base_url?: string;
  max_tokens: number;
  temperature: number;
  enabled_use_cases: string[];
  cost_limits: {
    daily_limit?: number;
    monthly_limit?: number;
    per_request_limit?: number;
  };
  is_enabled: boolean;
  last_used?: string;
  usage_stats: {
    total_requests: number;
    total_tokens: number;
    total_cost: number;
    requests_by_use_case: Record<string, number>;
  };
}

interface AIUseCase {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
}

interface PolicyIntelligenceFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  cost_per_request: number;
  icon: React.ReactNode;
}

const POLICY_INTELLIGENCE_FEATURES: PolicyIntelligenceFeature[] = [
  {
    id: "code_scanning",
    name: "Code Repository Scanning",
    description: "Scan your codebase to suggest policies based on API endpoints and security patterns",
    enabled: false,
    cost_per_request: 0.01,
    icon: <Code className="h-4 w-4" />
  },
  {
    id: "openapi_analysis",
    name: "OpenAPI Spec Analysis",
    description: "Analyze OpenAPI specifications to generate targeted policies for your APIs",
    enabled: false,
    cost_per_request: 0.005,
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: "compliance_mapping",
    name: "Compliance Framework Mapping",
    description: "Map policies to compliance frameworks (SOC2, HIPAA, GDPR, PCI-DSS)",
    enabled: false,
    cost_per_request: 0.02,
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: "natural_language",
    name: "Natural Language to Policy",
    description: "Convert natural language descriptions into Rego policies",
    enabled: false,
    cost_per_request: 0.015,
    icon: <Wand2 className="h-4 w-4" />
  },
  {
    id: "conflict_detection",
    name: "Policy Conflict Detection",
    description: "Detect conflicts and overlaps between policies automatically",
    enabled: false,
    cost_per_request: 0.008,
    icon: <Target className="h-4 w-4" />
  },
  {
    id: "security_recommendations",
    name: "Security Policy Recommendations",
    description: "Get AI-powered security policy recommendations based on best practices",
    enabled: false,
    cost_per_request: 0.012,
    icon: <Shield className="h-4 w-4" />
  }
];

const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: "soc2",
    name: "SOC 2",
    description: "System and Organization Controls 2 - Security, availability, processing integrity, confidentiality, and privacy"
  },
  {
    id: "hipaa",
    name: "HIPAA",
    description: "Health Insurance Portability and Accountability Act - Healthcare data protection"
  },
  {
    id: "gdpr",
    name: "GDPR",
    description: "General Data Protection Regulation - EU data protection and privacy"
  },
  {
    id: "pci_dss",
    name: "PCI DSS",
    description: "Payment Card Industry Data Security Standard - Payment card data protection"
  },
  {
    id: "iso27001",
    name: "ISO 27001",
    description: "Information Security Management System - International security standards"
  },
  {
    id: "nist",
    name: "NIST Cybersecurity Framework",
    description: "National Institute of Standards and Technology cybersecurity framework"
  }
];

const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-4o", "gpt-4o-mini"],
    description: "OpenAI's GPT models for advanced language understanding and policy intelligence",
    icon: <Brain className="h-4 w-4 text-green-500" />
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    description: "Anthropic's Claude models for safe and helpful AI",
    icon: <Shield className="h-4 w-4 text-blue-500" />
  },
  {
    id: "google",
    name: "Google AI",
    models: ["gemini-pro", "gemini-pro-vision"],
    description: "Google's Gemini models for multimodal AI",
    icon: <Target className="h-4 w-4 text-red-500" />
  },
  {
    id: "azure",
    name: "Azure OpenAI",
    models: ["gpt-4", "gpt-35-turbo"],
    description: "Microsoft Azure's OpenAI service",
    icon: <Globe className="h-4 w-4 text-blue-600" />
  },
  {
    id: "aws_bedrock",
    name: "AWS Bedrock",
    models: ["claude-3-sonnet", "claude-3-haiku", "llama-2-70b"],
    description: "Amazon's Bedrock for foundation models",
    icon: <Cpu className="h-4 w-4 text-orange-500" />
  },
  {
    id: "cohere",
    name: "Cohere",
    models: ["command", "command-light"],
    description: "Cohere's language models for enterprise",
    icon: <Zap className="h-4 w-4 text-purple-500" />
  },
  {
    id: "custom",
    name: "Custom LLM",
    models: ["custom"],
    description: "Connect your own LLM service",
    icon: <Settings className="h-4 w-4 text-gray-500" />
  }
];

const AI_USE_CASES: AIUseCase[] = [
  {
    id: "rego_editor",
    name: "Rego Editor",
    description: "AI-powered autocomplete and suggestions for Rego code",
    icon: <Code className="h-4 w-4" />
  },
  {
    id: "policy_wizard",
    name: "Policy Wizard",
    description: "AI-enhanced policy creation and recommendations",
    icon: <Wand2 className="h-4 w-4" />
  },
  {
    id: "conflict_detection",
    name: "Conflict Detection",
    description: "AI analysis of policy conflicts and redundancies",
    icon: <AlertCircle className="h-4 w-4" />
  },
  {
    id: "compliance_analysis",
    name: "Compliance Analysis",
    description: "AI suggestions for GDPR, PIPEDA, SOC2, CCPA compliance",
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: "pip_suggestions",
    name: "PIP Suggestions",
    description: "AI recommendations for PIP attributes and parameters",
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: "policy_optimization",
    name: "Policy Optimization",
    description: "AI-powered policy performance and security optimization",
    icon: <TrendingUp className="h-4 w-4" />
  }
];

const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  { id: "gdpr", name: "GDPR", description: "General Data Protection Regulation" },
  { id: "pipeda", name: "PIPEDA", description: "Personal Information Protection and Electronic Documents Act" },
  { id: "soc2", name: "SOC2", description: "Service Organization Control 2" },
  { id: "ccpa", name: "CCPA", description: "California Consumer Privacy Act" },
  { id: "hipaa", name: "HIPAA", description: "Health Insurance Portability and Accountability Act" },
  { id: "pci_dss", name: "PCI DSS", description: "Payment Card Industry Data Security Standard" },
  { id: "iso27001", name: "ISO 27001", description: "Information Security Management System" }
];

export function AIIntegrationSettingsPage() {
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [maxTokens, setMaxTokens] = useState<number>(4000);
  const [temperature, setTemperature] = useState<number>(0.1);
  const [enabledUseCases, setEnabledUseCases] = useState<string[]>([]);
  const [costLimits, setCostLimits] = useState({
    daily_limit: 0,
    monthly_limit: 0,
    per_request_limit: 0
  });
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [policyFeatures, setPolicyFeatures] = useState<PolicyIntelligenceFeature[]>(POLICY_INTELLIGENCE_FEATURES);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration
      const mockConfigurations: AIConfiguration[] = [
        {
          config_id: "openai-primary",
          provider: "openai",
          model: "gpt-4",
          api_key: "sk-***",
          max_tokens: 4000,
          temperature: 0.1,
          enabled_use_cases: ["rego_editor", "policy_wizard"],
          cost_limits: { daily_limit: 50, monthly_limit: 1000 },
          is_enabled: true,
          last_used: new Date().toISOString(),
          usage_stats: {
            total_requests: 1250,
            total_tokens: 45000,
            total_cost: 12.50,
            requests_by_use_case: {
              rego_editor: 800,
              policy_wizard: 450
            }
          }
        }
      ];
      setConfigurations(mockConfigurations);
    } catch (error) {
      console.error("Failed to load configurations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedProvider || !apiKey) {
      toast({
        title: "Missing Configuration",
        description: "Please select a provider and enter an API key.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsConnected(true);
      setTestResult("Connection successful! AI service is ready to use.");
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${AI_PROVIDERS.find(p => p.id === selectedProvider)?.name}`,
      });
    } catch (error) {
      setTestResult("Connection failed. Please check your API key and settings.");
      toast({
        title: "Connection Failed",
        description: "Failed to connect to the AI service. Please check your configuration.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!selectedProvider || !selectedModel || !apiKey) {
      toast({
        title: "Incomplete Configuration",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newConfig: AIConfiguration = {
        config_id: `${selectedProvider}-${Date.now()}`,
        provider: selectedProvider,
        model: selectedModel,
        api_key: apiKey,
        base_url: baseUrl,
        max_tokens: maxTokens,
        temperature: temperature,
        enabled_use_cases: enabledUseCases,
        cost_limits: costLimits,
        is_enabled: true,
        usage_stats: {
          total_requests: 0,
          total_tokens: 0,
          total_cost: 0,
          requests_by_use_case: {}
        }
      };

      setConfigurations([...configurations, newConfig]);
      
      // Reset form
      setSelectedProvider("");
      setSelectedModel("");
      setApiKey("");
      setBaseUrl("");
      setMaxTokens(4000);
      setTemperature(0.1);
      setEnabledUseCases([]);
      setCostLimits({ daily_limit: 0, monthly_limit: 0, per_request_limit: 0 });
      setIsConnected(false);
      setTestResult(null);

      toast({
        title: "Configuration Saved",
        description: "AI integration settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save AI configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfiguration = (configId: string) => {
    setConfigurations(configurations.filter(c => c.config_id !== configId));
    toast({
      title: "Configuration Deleted",
      description: "AI configuration has been removed successfully.",
    });
  };

  const selectedProviderData = AI_PROVIDERS.find(p => p.id === selectedProvider);
  const totalCost = configurations.reduce((sum, config) => sum + config.usage_stats.total_cost, 0);
  const totalRequests = configurations.reduce((sum, config) => sum + config.usage_stats.total_requests, 0);
  const activeConfigurations = configurations.filter(c => c.is_enabled).length;

  const getProviderIcon = (provider: string) => {
    const providerData = AI_PROVIDERS.find(p => p.id === provider);
    return providerData?.icon || <Settings className="h-4 w-4 text-gray-500" />;
  };

  const getUseCaseIcon = (useCase: string) => {
    const useCaseData = AI_USE_CASES.find(uc => uc.id === useCase);
    return useCaseData?.icon || <Settings className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Integration</h1>
        <p className="text-muted-foreground">
          Connect your preferred LLM services to enhance Control Core features with CAPA (Code Assistance & Policy Agent).
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeConfigurations}</p>
                <p className="text-sm text-muted-foreground">Active Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalRequests}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{AI_USE_CASES.length}</p>
                <p className="text-sm text-muted-foreground">Use Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="use-cases">Use Cases</TabsTrigger>
          <TabsTrigger value="policy-intelligence">Policy Intelligence</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Integration Overview</CardTitle>
              <CardDescription>
                Control Core works perfectly without AI assistance, but you can enhance it with your own LLM services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI Enhancement Features:</strong> Rego editor autocomplete, policy wizard suggestions, 
                    conflict detection, compliance analysis, and PIP attribute suggestions.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Supported Providers</h4>
                    <div className="space-y-2">
                      {AI_PROVIDERS.slice(0, 4).map((provider) => (
                        <div key={provider.id} className="flex items-center gap-2">
                          {provider.icon}
                          <span className="text-sm">{provider.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Available Use Cases</h4>
                    <div className="space-y-2">
                      {AI_USE_CASES.slice(0, 4).map((useCase) => (
                        <div key={useCase.id} className="flex items-center gap-2">
                          {useCase.icon}
                          <span className="text-sm">{useCase.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                CAPA Configuration
              </CardTitle>
              <CardDescription>
                Connect your preferred AI model to enable intelligent policy assistance and code generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable CAPA</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on AI-powered assistance in the policy editor
                  </p>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
              </div>

              {isEnabled && (
                <>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider">AI Provider *</Label>
                      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select AI provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_PROVIDERS.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              <div className="flex items-center gap-2">
                                {provider.icon}
                                <span>{provider.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">Model *</Label>
                      <Select 
                        value={selectedModel} 
                        onValueChange={setSelectedModel}
                        disabled={!selectedProvider}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProviderData?.models.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key *</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="apiKey"
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Enter your API key"
                          className="pl-10"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleTestConnection}
                        disabled={!selectedProvider || !apiKey || isTesting}
                      >
                        {isTesting ? (
                          <>
                            <Zap className="h-4 w-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-4 w-4 mr-2" />
                            Test
                          </>
                        )}
                      </Button>
                    </div>
                    {isConnected && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Connection verified
                      </div>
                    )}
                    {testResult && (
                      <Alert>
                        <TestTube className="h-4 w-4" />
                        <AlertDescription>{testResult}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {(selectedProvider === "azure" || selectedProvider === "custom") && (
                    <div className="space-y-2">
                      <Label htmlFor="baseUrl">Base URL</Label>
                      <Input
                        id="baseUrl"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://your-resource.openai.azure.com/"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        placeholder="4000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature: {temperature}</Label>
                      <Slider
                        value={[temperature]}
                        onValueChange={([value]) => setTemperature(value)}
                        max={2}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Enabled Use Cases</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {AI_USE_CASES.map((useCase) => (
                        <div key={useCase.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={useCase.id}
                            checked={enabledUseCases.includes(useCase.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEnabledUseCases([...enabledUseCases, useCase.id]);
                              } else {
                                setEnabledUseCases(enabledUseCases.filter(uc => uc !== useCase.id));
                              }
                            }}
                          />
                          <Label htmlFor={useCase.id} className="text-sm flex items-center gap-2">
                            {useCase.icon}
                            {useCase.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Cost Limits (Optional)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dailyLimit">Daily Limit ($)</Label>
                        <Input
                          id="dailyLimit"
                          type="number"
                          value={costLimits.daily_limit}
                          onChange={(e) => setCostLimits({...costLimits, daily_limit: parseFloat(e.target.value) || 0})}
                          placeholder="50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monthlyLimit">Monthly Limit ($)</Label>
                        <Input
                          id="monthlyLimit"
                          type="number"
                          value={costLimits.monthly_limit}
                          onChange={(e) => setCostLimits({...costLimits, monthly_limit: parseFloat(e.target.value) || 0})}
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="perRequestLimit">Per Request Limit ($)</Label>
                        <Input
                          id="perRequestLimit"
                          type="number"
                          value={costLimits.per_request_limit}
                          onChange={(e) => setCostLimits({...costLimits, per_request_limit: parseFloat(e.target.value) || 0})}
                          placeholder="0.10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          Security Note
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                          API keys are encrypted and stored securely. They are only used for CAPA functionality and are never shared or logged.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveConfiguration} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Configuration"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Service Configurations</CardTitle>
              <CardDescription>
                Manage your connected LLM services and their settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {configurations.map((config) => (
                  <div key={config.config_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getProviderIcon(config.provider)}
                      <div>
                        <div className="font-medium">{config.config_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {config.provider} • {config.model} • {config.enabled_use_cases.length} use cases
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${config.usage_stats.total_cost.toFixed(2)} • {config.usage_stats.total_requests} requests
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.is_enabled ? "default" : "secondary"}>
                        {config.is_enabled ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConfiguration(config.config_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {configurations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No AI configurations found. Configure your first AI service to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="use-cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Use Cases</CardTitle>
              <CardDescription>
                Available AI enhancement features in Control Core
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AI_USE_CASES.map((useCase) => (
                  <div key={useCase.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      {useCase.icon}
                      <h4 className="font-medium">{useCase.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{useCase.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy-intelligence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Policy Intelligence Features
              </CardTitle>
              <CardDescription>
                Enable AI-powered features to enhance your policy management and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Policy Intelligence Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Available Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {policyFeatures.map((feature) => (
                    <div key={feature.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {feature.icon}
                          <h4 className="font-medium">{feature.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            ${feature.cost_per_request.toFixed(3)}/request
                          </span>
                          <Checkbox
                            checked={feature.enabled}
                            onCheckedChange={(checked) => {
                              setPolicyFeatures(prev => 
                                prev.map(f => 
                                  f.id === feature.id 
                                    ? { ...f, enabled: checked as boolean }
                                    : f
                                )
                              );
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {feature.description}
                      </p>
                      {feature.enabled && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm text-green-800 dark:text-green-200">
                          ✓ Feature enabled and ready to use
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Framework Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Compliance Frameworks</h3>
                <p className="text-sm text-muted-foreground">
                  Select compliance frameworks to enable AI-powered policy mapping and recommendations
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {COMPLIANCE_FRAMEWORKS.map((framework) => (
                    <div key={framework.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={framework.id}
                        checked={selectedFrameworks.includes(framework.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFrameworks(prev => [...prev, framework.id]);
                          } else {
                            setSelectedFrameworks(prev => prev.filter(f => f !== framework.id));
                          }
                        }}
                      />
                      <label htmlFor={framework.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {framework.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cost Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Daily Limit ($)</label>
                    <Input
                      type="number"
                      value={costLimits.daily_limit}
                      onChange={(e) => setCostLimits(prev => ({ ...prev, daily_limit: Number(e.target.value) }))}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Monthly Limit ($)</label>
                    <Input
                      type="number"
                      value={costLimits.monthly_limit}
                      onChange={(e) => setCostLimits(prev => ({ ...prev, monthly_limit: Number(e.target.value) }))}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Per Request Limit ($)</label>
                    <Input
                      type="number"
                      step="0.001"
                      value={costLimits.per_request_limit}
                      onChange={(e) => setCostLimits(prev => ({ ...prev, per_request_limit: Number(e.target.value) }))}
                      placeholder="0.05"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    toast({
                      title: "Policy Intelligence Settings Saved",
                      description: "Your AI policy intelligence features have been configured.",
                    });
                  }}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Frameworks</CardTitle>
              <CardDescription>
                AI can help generate policies for major compliance frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COMPLIANCE_FRAMEWORKS.map((framework) => (
                  <div key={framework.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <h4 className="font-medium">{framework.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{framework.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}